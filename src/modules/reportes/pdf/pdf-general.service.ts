import { reportePorGuia } from '../reportes.service';
import { buildStaticMapUrl, prefetchImages } from './image-utils';
import { renderReporteGeneral, PdfCard, PdfReportData } from './pdf-renderer';
import { env } from '../../../config/env';
import { progressManager } from '../../../shared/progress/progress.manager';


function parseMultiField(value: string | null | undefined, separator = ', '): string {
  if (!value) return '—';
  return value
    .split('|')
    .map((v) => v.trim())
    .filter(Boolean)
    .join(separator);
}

function parseMultiFieldSuffix(
  value: string | null | undefined,
  suffix: string,
  separator = ', ',
): string {
  if (!value) return '—';
  return value
    .split('|')
    .map((v) => `${v.trim()}${suffix}`)
    .filter((v) => v !== suffix)
    .join(separator);
}

function formatNovedades(novedades: { tipo: string; descripcion: string }[]): string {
  return novedades.length
    ? novedades.map((n) => `${n.tipo}: ${n.descripcion}`).join(' | ')
    : '—';
}

type GuiaFromService = Awaited<ReturnType<typeof reportePorGuia>>[number];




export async function generateReporteGeneralPdf(
  stream: NodeJS.WritableStream,
  filters: {
    desde?: string;
    hasta?: string;
    clienteId?: string;
    choferId?: string;
    tipo?: string;
    ciudad?: string;
    filtroGuia?: 'con-guia' | 'sin-guia';
    jobId?: string;
    titulo?: string;
  },
): Promise<{ totalCards: number; totalImages: number; durationMs: number }> {
  const t0 = Date.now();

  if (filters.jobId) {
    progressManager.emit(filters.jobId, {
      step: 'query_db',
      message: 'Consultando información de guías...',
      percent: 5,
      taskType: 'PDF_GENERAL',
    });
  }

  const guias: GuiaFromService[] = await reportePorGuia(filters);

  if (filters.jobId) {
    progressManager.emit(filters.jobId, {
      step: 'process_guides',
      message: 'Procesando guías y rutas...',
      subMessage: `${guias.length} guías obtenidas`,
      percent: 10,
      taskType: 'PDF_GENERAL',
    });
  }

  const cards: PdfCard[] = guias.map((g): PdfCard => {
    const ruta = g.ruta;
    const stop = g.stop;
    const rutaLabel = ruta?.hojaRuta?.trim() || ruta?.nombre?.trim() || '—';

    const temperaturaRaw = g.temperatura ?? null;
    const temperaturaFormatted = temperaturaRaw
      ? parseMultiFieldSuffix(temperaturaRaw, '°C')
      : '—';

    const receptorRaw = g.receptorNombre ?? null;
    const receptorFormatted = receptorRaw
      ? parseMultiField(receptorRaw, ', ')
      : '—';

    const mapUrl = buildStaticMapUrl(stop?.lat, stop?.lng, stop?.direccion, env.MAPBOX_TOKEN);

    const evidenceUrls = (g.fotos ?? [])
      .filter((f) => f.tipo === 'GUIA')
      .map((f) => f.urlPreview)
      .filter(Boolean);

    const imageUrls: string[] = [
      ...(mapUrl ? [mapUrl] : []),
      ...evidenceUrls,
    ];

    return {
      groupTitle: `Ruta: ${rutaLabel} | Fecha: ${ruta?.fecha ?? '—'} | Chofer: ${ruta?.chofer?.nombre ?? '—'}`,
      title: `Guía ${g.numeroGuia ?? '(sin número)'} — ${g.cliente?.nombre ?? '—'}`,
      subtitle: `${ruta?.lugarOrigen ?? '—'} → ${ruta?.lugarDestino ?? '—'}`,
      fields: [
        { label: 'Estado', value: g.estado ?? '—' },
        { label: 'Cliente', value: g.cliente?.nombre ?? '—' },
        { label: 'Ciudad / Sector', value: g.cliente?.ciudad ?? 'Sin asignar' },
        { label: 'Recibido por', value: receptorFormatted },
        { label: 'Hora llegada', value: g.horaLlegada ?? '—' },
        { label: 'Hora salida', value: g.horaSalida ?? '—' },
        { label: 'Temperatura', value: temperaturaFormatted },
        { label: 'Observaciones', value: g.observaciones ?? '—' },
        { label: 'Incidencias', value: formatNovedades(g.novedades ?? []) },
        {
          label: 'Registrada',
          value: g.createdAt ? new Date(g.createdAt).toLocaleString('es-ES') : '—',
        },
      ],
      imageUrls,
    };
  });

  const allUrls = [...new Set(cards.flatMap((c) => c.imageUrls))];

  const imageCache = await prefetchImages(allUrls, 8, (loaded, total) => {
    if (filters.jobId) {
      const percent = 10 + Math.floor((loaded / Math.max(total, 1)) * 65);
      progressManager.emit(filters.jobId, {
        step: 'download_photos',
        message: 'Descargando fotografías y mapas...',
        subMessage: `${loaded} / ${total} imágenes`,
        current: loaded,
        total,
        percent,
        taskType: 'PDF_GENERAL',
      });
    }
  });

  const totalGuias = cards.length;
  const entregadas = guias.filter((g) => g.estado === 'ENTREGADO').length;
  const pendientes = guias.filter((g) => g.estado === 'PENDIENTE').length;
  const incidencias = guias.filter((g) => g.estado === 'INCIDENCIA').length;

  const filterInfo: string[] = [];
  if (filters.desde || filters.hasta) {
    filterInfo.push(`Período: ${filters.desde ?? '—'} a ${filters.hasta ?? '—'}`);
  }
  if (filters.clienteId) filterInfo.push(`Cliente ID: ${filters.clienteId}`);
  if (filters.choferId) filterInfo.push(`Chofer ID: ${filters.choferId}`);
  if (filters.ciudad) filterInfo.push(`Ciudad: ${filters.ciudad}`);
  if (filters.filtroGuia) filterInfo.push(`Filtro guía: ${filters.filtroGuia}`);
  if (filterInfo.length === 0) filterInfo.push('Sin filtros específicos (reporte general)');

  const reportData: PdfReportData = {
    title: filters.titulo ? filters.titulo.trim() : 'Reporte General',
    generatedAt: new Date().toLocaleString('es-ES'),
    filterInfo,
    highlights: [
      { label: 'Total guías', value: totalGuias },
      { label: 'Entregadas', value: entregadas },
      { label: 'Pendientes', value: pendientes },
      { label: 'Incidencias', value: incidencias },
    ],
    cards,
  };

  await renderReporteGeneral(stream, reportData, imageCache, (rendered, total) => {
    if (filters.jobId) {
      const percent = 75 + Math.floor((rendered / Math.max(total, 1)) * 24);
      progressManager.emit(filters.jobId, {
        step: 'render_pdf',
        message: 'Construyendo documento PDF...',
        subMessage: `Guía ${rendered} de ${total}`,
        current: rendered,
        total,
        percent,
        taskType: 'PDF_GENERAL',
      });
    }
  });

  if (filters.jobId) {
    progressManager.complete(
      filters.jobId,
      '¡Reporte generado! Descargando archivo en el navegador...',
    );
  }

  const durationMs = Date.now() - t0;

  return { totalCards: cards.length, totalImages: allUrls.length, durationMs };
}
