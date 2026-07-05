import PDFDocument from 'pdfkit';
import {
  mm, PAGE_WIDTH, PAGE_HEIGHT, MARGIN_X, MARGIN_Y,
  COLORS, FONT, FONT_SIZE,
  HEADER_HEIGHT, CARD_BORDER_R, MAP_W, MAP_H, CARD_GAP, CARD_HEADER_H,
} from './layout-constants';
import { isMapboxUrl } from './image-utils';



export interface PdfField {
  label: string;
  value: string | number;
}

export interface PdfCard {
  groupTitle?: string;
  title: string;
  subtitle?: string;
  fields: PdfField[];
  imageUrls: string[];
}

export interface PdfReportData {
  title: string;
  generatedAt: string;
  filterInfo: string[];
  highlights: { label: string; value: string | number }[];
  cards: PdfCard[];
}

function drawPageHeader(doc: InstanceType<typeof PDFDocument>, title: string, generatedAt: string) {
  doc.rect(0, 0, PAGE_WIDTH, HEADER_HEIGHT).fill(COLORS.headerBg);

  doc
    .font(FONT.bold)
    .fontSize(FONT_SIZE.title)
    .fillColor(COLORS.headerText)
    .text(title, MARGIN_X, mm(7), {
      width: PAGE_WIDTH - MARGIN_X * 2,
      lineBreak: false,
      ellipsis: true,
    });

  doc
    .font(FONT.regular)
    .fontSize(FONT_SIZE.subtitle)
    .fillColor(COLORS.headerText)
    .text(`Generado: ${generatedAt} — LOGISTRANS S.A.`, MARGIN_X, mm(19), {
      width: PAGE_WIDTH - MARGIN_X * 2,
      lineBreak: false,
      ellipsis: true,
    });
}


function addNewPage(doc: InstanceType<typeof PDFDocument>, title: string, generatedAt: string): number {
  doc.addPage();
  drawPageHeader(doc, title, generatedAt);
  doc.y = HEADER_HEIGHT + MARGIN_Y;
  return HEADER_HEIGHT + MARGIN_Y;
}

function calcCardHeight(doc: InstanceType<typeof PDFDocument>, card: PdfCard): number {
  const hasMap = card.imageUrls.length > 0 && isMapboxUrl(card.imageUrls[0]);
  const mapReservedWidth = hasMap ? MAP_W + mm(8) : 0;
  const labelX = MARGIN_X;
  const valueX = labelX + mm(33);
  const valueMaxW = PAGE_WIDTH - MARGIN_X * 2 - valueX + labelX - mapReservedWidth - mm(4);

  let totalH = CARD_HEADER_H + mm(11);

  doc.font(FONT.regular).fontSize(FONT_SIZE.label);
  card.fields.slice(0, 6).forEach((f) => {
    const text = String(f.value || '—');
    const textH = doc.heightOfString(text, { width: Math.max(mm(20), valueMaxW) });
    totalH += Math.max(mm(6), textH + mm(1.5));
  });

  const mapMinH = hasMap ? MAP_H + mm(24) : 0;
  const fieldsH = totalH + mm(14);

  return Math.max(mm(80), Math.max(fieldsH, mapMinH + CARD_HEADER_H));
}



async function renderCard(
  doc: InstanceType<typeof PDFDocument>,
  card: PdfCard,
  y: number,
  imageCache: Map<string, Buffer>,
  title: string,
  generatedAt: string,
): Promise<number> {
  const cardW = PAGE_WIDTH - MARGIN_X * 2;
  const cardH = calcCardHeight(doc, card);

  if (y + cardH > PAGE_HEIGHT - MARGIN_Y) {
    y = addNewPage(doc, title, generatedAt);
  }

  const x = MARGIN_X;

  doc
    .roundedRect(x, y, cardW, cardH, CARD_BORDER_R)
    .fillAndStroke(COLORS.cardBg, COLORS.cardBorder);

  doc
    .roundedRect(x, y, cardW, CARD_HEADER_H, CARD_BORDER_R)
    .fill(COLORS.tealBg);

  doc
    .font(FONT.bold)
    .fontSize(FONT_SIZE.cardTitle)
    .fillColor(COLORS.tealText)
    .text(card.title, x + mm(2), y + mm(3), { lineBreak: false });

  if (card.subtitle) {
    doc
      .font(FONT.regular)
      .fontSize(FONT_SIZE.label)
      .fillColor(COLORS.subtitleText)
      .text(card.subtitle, x + mm(2), y + CARD_HEADER_H + mm(3), { lineBreak: false });
  }

  const firstUrl = card.imageUrls[0] ?? '';
  const hasMap = isMapboxUrl(firstUrl);
  const mapUrl = hasMap ? firstUrl : '';
  const evidenceUrls = hasMap ? card.imageUrls.slice(1) : card.imageUrls;

  const mapReservedWidth = hasMap ? MAP_W + mm(8) : 0;
  const labelX = x + mm(2);
  const valueX = x + mm(33);
  const valueMaxW = cardW - mm(33) - mapReservedWidth - mm(4);

  let fieldY = y + CARD_HEADER_H + mm(11);

  card.fields.slice(0, 6).forEach((field) => {
    doc
      .font(FONT.bold)
      .fontSize(FONT_SIZE.label)
      .fillColor(COLORS.labelText)
      .text(`${field.label}:`, labelX, fieldY, { lineBreak: false });

    const val = String(field.value || '—');
    doc
      .font(FONT.regular)
      .fontSize(FONT_SIZE.label)
      .fillColor(COLORS.valueText)
      .text(val, valueX, fieldY, { width: Math.max(mm(20), valueMaxW), lineBreak: true });

    const textH = doc.heightOfString(val, { width: Math.max(mm(20), valueMaxW) });
    fieldY += Math.max(mm(6), textH + mm(2));
  });

  if (hasMap) {
    const mapX = x + cardW - MAP_W - mm(4);
    const mapY = y + CARD_HEADER_H + mm(3);

    doc
      .font(FONT.regular)
      .fontSize(FONT_SIZE.small)
      .fillColor(COLORS.subtitleText)
      .text('Ubicación', mapX, mapY, { width: MAP_W, align: 'center', lineBreak: false });

    const mapBuf = imageCache.get(mapUrl);
    if (mapBuf) {
      try {
        doc.image(mapBuf, mapX, mapY + mm(4), { width: MAP_W, height: MAP_H });
      } catch {
        doc
          .fontSize(FONT_SIZE.small)
          .fillColor(COLORS.subtitleText)
          .text('Mapa no disponible', mapX, mapY + mm(12), { width: MAP_W, align: 'center' });
      }
    } else {
      doc
        .fontSize(FONT_SIZE.small)
        .fillColor(COLORS.subtitleText)
        .text('Mapa no disponible', mapX, mapY + mm(12), { width: MAP_W, align: 'center' });
    }
  }

  const fotosLabelY = Math.max(fieldY + mm(2), y + cardH - mm(12));
  if (evidenceUrls.length > 0) {
    doc
      .font(FONT.regular)
      .fontSize(FONT_SIZE.label)
      .fillColor(COLORS.subtitleText)
      .text(
        `Fotos de evidencia (${evidenceUrls.length}): ver páginas siguientes`,
        labelX,
        fotosLabelY,
        { lineBreak: false },
      );

    y += cardH + CARD_GAP;

    for (let i = 0; i < evidenceUrls.length; i++) {
      const photoTitle = `${card.title} — Foto ${i + 1} de ${evidenceUrls.length}`;
      y = addNewPage(doc, photoTitle, generatedAt);

      const imgBuf = imageCache.get(evidenceUrls[i]);
      if (imgBuf) {
        try {
          doc.image(imgBuf, MARGIN_X, HEADER_HEIGHT + MARGIN_Y, {
            width: PAGE_WIDTH - MARGIN_X * 2,
            height: PAGE_HEIGHT - HEADER_HEIGHT - MARGIN_Y * 2,
            fit: [PAGE_WIDTH - MARGIN_X * 2, PAGE_HEIGHT - HEADER_HEIGHT - MARGIN_Y * 2],
          });
        } catch {
          doc
            .fontSize(FONT_SIZE.info)
            .fillColor(COLORS.subtitleText)
            .text('Imagen no disponible', MARGIN_X, PAGE_HEIGHT / 2, {
              width: PAGE_WIDTH - MARGIN_X * 2,
              align: 'center',
            });
        }
      } else {
        doc
          .fontSize(FONT_SIZE.info)
          .fillColor(COLORS.subtitleText)
          .text('Imagen no disponible', MARGIN_X, PAGE_HEIGHT / 2, {
            width: PAGE_WIDTH - MARGIN_X * 2,
            align: 'center',
          });
      }
    }

    y = addNewPage(doc, title, generatedAt);
  } else {
    doc
      .font(FONT.regular)
      .fontSize(FONT_SIZE.small)
      .fillColor(COLORS.footerText)
      .text('Sin fotos de evidencia', labelX, fotosLabelY, { lineBreak: false });

    y += cardH + CARD_GAP;
  }

  return y;
}



export async function renderReporteGeneral(
  stream: NodeJS.WritableStream,
  data: PdfReportData,
  imageCache: Map<string, Buffer>,
  onProgress?: (rendered: number, total: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      autoFirstPage: true,
      bufferPages: false,  // CRÍTICO: false = streaming real, sin acumular páginas en RAM
      info: {
        Title: data.title,
        Author: 'LOGISTRANS S.A.',
        Creator: 'LOGISTRANS S.A. - Sistema de Reportes',
      },
    });

    doc.pipe(stream);
    doc.on('error', reject);
    stream.on('error', reject);

    (async () => {
      try {
        drawPageHeader(doc, data.title, data.generatedAt);
        let y = HEADER_HEIGHT + MARGIN_Y;

        const cardW = mm(42);
        const cardH = mm(16);
        const gap   = mm(4);
        data.highlights.slice(0, 4).forEach((h, idx) => {
          const cx = MARGIN_X + idx * (cardW + gap);
          doc.roundedRect(cx, y, cardW, cardH, mm(2)).fill('#F1F5F9');
          doc
            .font(FONT.regular)
            .fontSize(FONT_SIZE.label)
            .fillColor(COLORS.labelText)
            .text(h.label, cx + mm(2), y + mm(3), { lineBreak: false });
          doc
            .font(FONT.bold)
            .fontSize(FONT_SIZE.info)
            .fillColor(COLORS.valueText)
            .text(String(h.value), cx + mm(2), y + mm(9), { lineBreak: false });
        });
        y += cardH + mm(8);

        doc
          .font(FONT.bold)
          .fontSize(FONT_SIZE.info)
          .fillColor(COLORS.valueText)
          .text('Filtros aplicados:', MARGIN_X, y);
        y += mm(5);

        doc.font(FONT.regular).fontSize(FONT_SIZE.label).fillColor(COLORS.labelText);
        data.filterInfo.forEach((f) => {
          doc.text(`• ${f}`, MARGIN_X, y, { lineBreak: false });
          y += mm(4);
        });
        y += mm(6);

        doc
          .font(FONT.bold)
          .fontSize(FONT_SIZE.section)
          .fillColor(COLORS.valueText)
          .text('Detalle de guías', MARGIN_X, y);
        y += mm(6);

        let currentGroup = '';

        for (let i = 0; i < data.cards.length; i++) {
          const card = data.cards[i];

          if (card.groupTitle && card.groupTitle !== currentGroup) {
            const estCardH = calcCardHeight(doc, card);
            if (y + mm(16) + estCardH > PAGE_HEIGHT - MARGIN_Y) {
              y = addNewPage(doc, data.title, data.generatedAt);
            }
            doc
              .roundedRect(MARGIN_X, y, PAGE_WIDTH - MARGIN_X * 2, mm(12), mm(2))
              .fill(COLORS.groupBg);
            doc
              .font(FONT.bold)
              .fontSize(FONT_SIZE.label)
              .fillColor(COLORS.valueText)
              .text(card.groupTitle, MARGIN_X + mm(2.5), y + mm(4), { lineBreak: false });
            y += mm(16);
            currentGroup = card.groupTitle;
          }

          y = await renderCard(doc, card, y, imageCache, data.title, data.generatedAt);

          if (onProgress && (i % 25 === 0 || i === data.cards.length - 1)) {
            onProgress(i + 1, data.cards.length);
          }
        }

        // Nota: bufferPages:false impide recorrer páginas anteriores.
        // El footer se agrega en tiempo real en cada addPage().
        // Se omite el footer total de páginas (requiere 2 pasadas en streaming).
        // Solo se agrega un footer simple en la última página.
        doc
          .font(FONT.regular)
          .fontSize(FONT_SIZE.footer)
          .fillColor(COLORS.footerText)
          .text(
            `Fin del reporte — ${data.cards.length} guías procesadas`,
            MARGIN_X,
            PAGE_HEIGHT - mm(8),
            { lineBreak: false },
          );

        doc.end();
        resolve();
      } catch (err) {
        doc.end();
        reject(err);
      }
    })();
  });
}
