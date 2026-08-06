import PDFDocument from 'pdfkit';
import { fetchImageBuffer } from './image-utils';
import { progressManager } from '../../../shared/progress/progress.manager';
import { prisma } from '../../../config/prisma';

// A4 dimensions in points
const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 30;
const HEADER_HEIGHT = 60;
const CONTENT_W = PAGE_WIDTH - MARGIN * 2;
const CONTENT_H = PAGE_HEIGHT - HEADER_HEIGHT - MARGIN * 2;

interface PhotoEntry {
  fotoId: string;
  url: string;
  label: string;
  rutaLabel: string;
  fecha: string;
  chofer: string;
}

function drawPageHeader(
  doc: InstanceType<typeof PDFDocument>,
  titulo: string,
  entry: PhotoEntry,
): void {
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT).fill('#0f172a');

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#ffffff')
    .text(titulo, MARGIN, 14, {
      width: CONTENT_W,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#94a3b8')
    .text(
      `Hoja de Ruta: ${entry.rutaLabel}  |  Fecha: ${entry.fecha}  |  Chofer: ${entry.chofer}`,
      MARGIN,
      32,
      { width: CONTENT_W, lineBreak: false, ellipsis: true },
    );

  doc
    .font('Helvetica')
    .fontSize(9)
    .fillColor('#cbd5e1')
    .text(entry.label, MARGIN, 46, {
      width: CONTENT_W,
      lineBreak: false,
      ellipsis: true,
    });
}

function placeImageCentered(
  doc: InstanceType<typeof PDFDocument>,
  buf: Buffer,
): void {
  doc.image(buf, MARGIN, HEADER_HEIGHT + MARGIN, {
    fit: [CONTENT_W, CONTENT_H],
    align: 'center',
    valign: 'center',
  });
}

export async function generateExportImagesPdf(
  stream: NodeJS.WritableStream,
  filters: {
    fotoIds: string[];
    jobId?: string;
    titulo?: string;
  },
): Promise<{ totalImages: number; durationMs: number }> {
  const t0 = Date.now();
  const { fotoIds, jobId, titulo = 'Respaldo de Imágenes' } = filters;

  if (jobId) {
    progressManager.emit(jobId, {
      step: 'query_db',
      message: 'Consultando imágenes...',
      percent: 5,
      taskType: 'PDF_EXPORT_IMAGES',
    });
  }

  // Solo incluimos fotos de tipo HOJA_RUTA, ignorando las guías en el PDF
  const fotos = await prisma.foto.findMany({
    where: { id: { in: fotoIds }, publicId: { not: null }, tipo: 'HOJA_RUTA' },
    include: {
      ruta: {
        select: {
          id: true,
          hojaRuta: true,
          nombre: true,
          fecha: true,
          chofer: { select: { nombre: true } },
        },
      },
    },
  });

  const getRouteRef = (f: (typeof fotos)[number]) => {
    const r = f.ruta;
    return {
      rutaLabel: r?.hojaRuta || r?.nombre || r?.id?.slice(-6).toUpperCase() || '—',
      fecha: r?.fecha ?? '—',
      chofer: r?.chofer?.nombre ?? '—',
    };
  };

  const entries: PhotoEntry[] = fotos.map((f) => ({
    fotoId: f.id,
    url: f.urlPreview,
    label: 'Foto Hoja de Ruta',
    ...getRouteRef(f),
  }));

  if (jobId) {
    progressManager.emit(jobId, {
      step: 'process_images',
      message: 'Preparando exportación...',
      subMessage: `${entries.length} imágenes encontradas`,
      percent: 10,
      taskType: 'PDF_EXPORT_IMAGES',
    });
  }

  // ─── ESTRATEGIA: descarga on-demand, una imagen a la vez ──────────────────
  // A diferencia de prefetchImages (que carga todo en RAM antes de construir
  // el PDF), aquí descargamos cada imagen justo antes de renderizarla y la
  // dejamos caer fuera de scope al terminar la página, liberando la RAM.
  // Esto permite procesar miles de imágenes sin agotar el heap.
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: false,
      bufferPages: false,  // CRÍTICO: false = streaming real, sin acumular páginas en RAM
      info: { Title: titulo, Author: 'LOGISTRANS S.A.' },
    });

    doc.pipe(stream);
    doc.on('error', reject);
    stream.on('error', reject);

    (async () => {
      try {
        if (entries.length === 0) {
          doc.addPage();
          doc
            .font('Helvetica')
            .fontSize(14)
            .fillColor('#64748b')
            .text(
              'No hay imágenes disponibles para este respaldo.',
              0,
              PAGE_HEIGHT / 2,
              { align: 'center', width: PAGE_WIDTH },
            );
        } else {
          for (let i = 0; i < entries.length; i++) {
            const entry = entries[i];

            // Descarga on-demand: el buffer existe solo durante esta iteración
            // y puede ser recolectado por el GC al pasar a la siguiente.
            const imgBuf = await fetchImageBuffer(entry.url);

            doc.addPage();
            drawPageHeader(doc, titulo, entry);

            if (imgBuf) {
              try {
                placeImageCentered(doc, imgBuf);
              } catch {
                doc
                  .font('Helvetica')
                  .fontSize(12)
                  .fillColor('#64748b')
                  .text('Imagen no disponible o corrupta.', MARGIN, PAGE_HEIGHT / 2, {
                    width: CONTENT_W,
                    align: 'center',
                  });
              }
            } else {
              doc
                .font('Helvetica')
                .fontSize(12)
                .fillColor('#64748b')
                .text('No se pudo descargar la imagen.', MARGIN, PAGE_HEIGHT / 2, {
                  width: CONTENT_W,
                  align: 'center',
                });
            }

            // Emitir progreso SSE cada 5 imágenes o en la última
            if (jobId && (i % 5 === 0 || i === entries.length - 1)) {
              const rendered = i + 1;
              const percent = 10 + Math.floor((rendered / Math.max(entries.length, 1)) * 89);
              progressManager.emit(jobId, {
                step: 'render_pdf',
                message: 'Construyendo documento PDF...',
                subMessage: `Imagen ${rendered} de ${entries.length}`,
                current: rendered,
                total: entries.length,
                percent,
                taskType: 'PDF_EXPORT_IMAGES',
              });
            }
          }
        }

        doc.end();

        if (jobId) {
          progressManager.complete(
            jobId,
            '¡Respaldo generado! Descargando archivo en el navegador...',
          );
        }

        resolve({ totalImages: entries.length, durationMs: Date.now() - t0 });
      } catch (err) {
        doc.end();
        reject(err);
      }
    })();
  });
}
