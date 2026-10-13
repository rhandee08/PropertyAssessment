import jsPDF from 'jspdf';
import autoTable, { RowInput } from 'jspdf-autotable';
import { MarketAssessmentResult, QuickMarketKPIItem } from '../types';
import { DEFAULT_QUICK_MARKET_VIEW } from '../data/defaultAssessment';

const KPI_SUBTITLES: Record<string, string> = {
  traffic_count: 'Average Annual Daily Traffic',
  crime_rate: 'Safety Index & Incident Rate',
  annual_income: 'Per Capita / Individual Earnings',
  poverty_level: 'Census Tract Poverty Ratio',
  job_growth: 'Annualized Employment Growth',
  population_growth: 'Demographic Influx Rate',
  unemployment_rate: 'Local vs Benchmark Ratio',
};

const KPI_BENCHMARK_NOTES: Record<string, string> = {
  traffic_count: 'Requires >= 15k cars/day for commercial viability.',
  crime_rate: 'Scores under 35% signify low incident risk.',
  annual_income: 'Demographic purchasing power threshold.',
  poverty_level: 'Must remain strictly below 20% distress ceiling.',
  job_growth: 'At least 1.4% to ensure expansion momentum.',
  population_growth: 'At least +1.2% year-over-year population gain.',
  unemployment_rate: 'Unemployment must be below regional baseline.',
};

interface LinkAnnotation {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  url: string;
}

/**
 * Breaks long URLs at natural delimiters (/ ? & . -) or character-by-character
 * to guarantee that every line strictly fits within maxWidth with zero column overflow.
 */
function breakUrlToFit(url: string, maxWidth: number, doc: jsPDF): string[] {
  if (!url) return [];
  if (doc.getTextWidth(url) <= maxWidth) return [url];

  const lines: string[] = [];
  let current = '';
  const tokens = url.split(/(?<=[/?&.-])/g);
  for (const token of tokens) {
    if (doc.getTextWidth(current + token) <= maxWidth) {
      current += token;
    } else {
      if (current) lines.push(current);
      if (doc.getTextWidth(token) > maxWidth) {
        let sub = '';
        for (const ch of token) {
          if (doc.getTextWidth(sub + ch) <= maxWidth) {
            sub += ch;
          } else {
            lines.push(sub);
            sub = ch;
          }
        }
        current = sub;
      } else {
        current = token;
      }
    }
  }
  if (current) lines.push(current);
  return lines;
}

/**
 * Draws the Big Guy Storage logo vector asset into jsPDF
 * Target size: 2 inches (144 pt) width by 1 inch (72 pt) height
 */
function drawBigGuyStorageLogo(doc: jsPDF, startX: number, startY: number) {
  // Dimensions: 144 pt width x 68 pt height (2in x ~1in)
  // Scale factor based on 520x240 viewBox
  const scale = 0.28;

  // Box 1: Bottom Left
  const blX = startX + 4;
  const blY = startY + 24;
  // Top Face
  doc.setFillColor(155, 203, 56); // #9bcb38
  doc.setDrawColor(255, 255, 255);
  doc.setLineWidth(1);
  doc.triangle(blX + 18 * scale, blY, blX + 36 * scale, blY + 9 * scale, blX + 18 * scale, blY + 18 * scale, 'FD');
  doc.triangle(blX, blY + 9 * scale, blX + 18 * scale, blY, blX + 18 * scale, blY + 18 * scale, 'FD');
  // Left Face
  doc.setFillColor(134, 181, 40); // #86b528
  doc.rect(blX, blY + 9 * scale, 18 * scale, 22 * scale, 'FD');
  // Right Face
  doc.setFillColor(115, 159, 30); // #739f1e
  doc.rect(blX + 18 * scale, blY + 9 * scale, 18 * scale, 22 * scale, 'FD');

  // Box 2: Bottom Right
  const brX = startX + 26;
  const brY = startY + 34;
  doc.setFillColor(155, 203, 56);
  doc.triangle(brX + 18 * scale, brY, brX + 36 * scale, brY + 9 * scale, brX + 18 * scale, brY + 18 * scale, 'FD');
  doc.triangle(brX, brY + 9 * scale, brX + 18 * scale, brY, brX + 18 * scale, brY + 18 * scale, 'FD');
  doc.setFillColor(134, 181, 40);
  doc.rect(brX, brY + 9 * scale, 18 * scale, 22 * scale, 'FD');
  doc.setFillColor(115, 159, 30);
  doc.rect(brX + 18 * scale, brY + 9 * scale, 18 * scale, 22 * scale, 'FD');

  // Box 3: Top
  const tX = startX + 15;
  const tY = startY + 4;
  doc.setFillColor(155, 203, 56);
  doc.triangle(tX + 18 * scale, tY, tX + 36 * scale, tY + 9 * scale, tX + 18 * scale, tY + 18 * scale, 'FD');
  doc.triangle(tX, tY + 9 * scale, tX + 18 * scale, tY, tX + 18 * scale, tY + 18 * scale, 'FD');
  doc.setFillColor(134, 181, 40);
  doc.rect(tX, tY + 9 * scale, 18 * scale, 22 * scale, 'FD');
  doc.setFillColor(115, 159, 30);
  doc.rect(tX + 18 * scale, tY + 9 * scale, 18 * scale, 22 * scale, 'FD');

  // Typography Right Side
  const textX = startX + 54;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(155, 203, 56); // #9bcb38
  doc.text('BIG', textX, startY + 34);

  const bigW = doc.getTextWidth('BIG');
  doc.setTextColor(0, 0, 0); // Black
  doc.text('GUY', textX + bigW + 4, startY + 34);

  // Black STORAGE Banner
  const guyW = doc.getTextWidth('GUY');
  const bannerW = bigW + guyW + 8;
  doc.setFillColor(0, 0, 0);
  doc.roundedRect(textX - 1, startY + 40, bannerW, 14, 1, 1, 'F');

  // White STORAGE text
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(255, 255, 255);
  doc.text('S T O R A G E', textX + bannerW / 2, startY + 50, { align: 'center' });
}

export function exportAssessmentToPdf(
  assessment: MarketAssessmentResult,
  customLogoDataUrl?: string | null
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth(); // 612 pt
  const pageHeight = doc.internal.pageSize.getHeight(); // 792 pt
  const margin = 36; // 0.5 in standard margin
  const rightBoundary = pageWidth - margin; // 576 pt
  const contentWidth = pageWidth - margin * 2; // 540 pt

  const pendingLinks: LinkAnnotation[] = [];

  // ==========================================
  // 1. BRAND TOP HEADER BAR (with 2in x 1in logo)
  // ==========================================
  const headerHeight = 76;
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, pageWidth, headerHeight, 'F');

  // Emerald/Lime top accent stripe
  doc.setFillColor(155, 203, 56); // #9bcb38
  doc.rect(0, 0, pageWidth, 4, 'F');

  // Render the 2in x 1in Logo on the top-left (custom image if provided, else vector logo)
  if (customLogoDataUrl) {
    try {
      doc.addImage(customLogoDataUrl, 'PNG', margin, 8, 144, 58, undefined, 'FAST');
    } catch {
      drawBigGuyStorageLogo(doc, margin, 10);
    }
  } else {
    drawBigGuyStorageLogo(doc, margin, 10);
  }

  // Right-side Assessment Title & Meta Information
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(15, 23, 42); // slate-900
  const titleStr = 'PROPERTY MARKET ASSESSMENT REPORT';
  doc.text(titleStr, rightBoundary - doc.getTextWidth(titleStr), 26);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  const subStr = 'COMMERCIAL REAL ESTATE & SELF-STORAGE FEASIBILITY';
  doc.text(subStr, rightBoundary - doc.getTextWidth(subStr), 40);

  const dateStr = `Generated: ${new Date().toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })}  |  5-Mile Radius & Benchmarks`;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(134, 181, 40); // lime-600
  doc.text(dateStr, rightBoundary - doc.getTextWidth(dateStr), 54);

  // Bottom border of header
  doc.setDrawColor(226, 232, 240);
  doc.setLineWidth(0.75);
  doc.line(margin, headerHeight, rightBoundary, headerHeight);

  let yPos = headerHeight + 14;

  // ==========================================
  // 2. EXECUTIVE SUMMARY & VERDICT CARD
  // ==========================================
  const cardWidth = contentWidth; // 540 pt
  const rawVerdict = assessment.overallScore.verdict || 'Viable';
  const verdictNorm = rawVerdict.toLowerCase();
  const isViable =
    verdictNorm.includes('viable') && !verdictNorm.includes('non') && !verdictNorm.includes('un');
  const isCaution = verdictNorm.includes('caution');

  const passRatio = `${assessment.overallScore.passedCount} of ${assessment.overallScore.totalCount} KPIs Met`;
  const percentage = Math.round(
    (assessment.overallScore.passedCount / assessment.overallScore.totalCount) * 100
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const summaryLines = doc.splitTextToSize(
    assessment.overallScore.summaryText,
    cardWidth - 28
  );
  const summaryBlockHeight = summaryLines.length * 10.5;
  const cardHeight = 72 + summaryBlockHeight;

  // Card Background with subtle border
  doc.setFillColor(255, 255, 255);
  doc.setDrawColor(226, 232, 240); // slate-200
  doc.setLineWidth(0.75);
  doc.roundedRect(margin, yPos, cardWidth, cardHeight, 5, 5, 'FD');

  // Address Section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139); // slate-500
  doc.text('TARGET PROPERTY ADDRESS', margin + 14, yPos + 18);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(15, 23, 42); // slate-900
  const splitAddress = doc.splitTextToSize(assessment.propertyAddress, cardWidth - 195);
  doc.text(splitAddress, margin + 14, yPos + 32);

  // Verdict Box: Width 160pt, Height 34pt, perfectly centered text
  const badgeW = 160;
  const badgeH = 34;
  const badgeX = margin + cardWidth - badgeW - 12;
  const badgeY = yPos + 10;

  const badgeBg = isViable
    ? [236, 253, 245]
    : isCaution
    ? [255, 251, 235]
    : [254, 242, 242];
  const badgeBorder = isViable
    ? [167, 243, 208]
    : isCaution
    ? [253, 230, 138]
    : [254, 202, 202];
  const badgeText = isViable
    ? [6, 95, 70]
    : isCaution
    ? [146, 64, 14]
    : [153, 27, 27];

  doc.setFillColor(badgeBg[0], badgeBg[1], badgeBg[2]);
  doc.setDrawColor(badgeBorder[0], badgeBorder[1], badgeBorder[2]);
  doc.setLineWidth(0.75);
  doc.roundedRect(badgeX, badgeY, badgeW, badgeH, 4, 4, 'FD');

  const upperVerdict = rawVerdict.toUpperCase();
  const verdictTitle = upperVerdict.startsWith('VERDICT')
    ? upperVerdict
    : `VERDICT: ${upperVerdict}`;

  let verdictFontSize = 8.5;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(verdictFontSize);
  while (doc.getTextWidth(verdictTitle) > badgeW - 18 && verdictFontSize > 6) {
    verdictFontSize -= 0.5;
    doc.setFontSize(verdictFontSize);
  }

  const badgeCenterX = badgeX + badgeW / 2;
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(verdictTitle, badgeCenterX, badgeY + 14, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(badgeText[0], badgeText[1], badgeText[2]);
  doc.text(`${passRatio} (${percentage}%)`, badgeCenterX, badgeY + 26, { align: 'center' });

  const divY = yPos + 48;
  doc.setDrawColor(241, 245, 249);
  doc.setLineWidth(1);
  doc.line(margin + 14, divY, margin + cardWidth - 14, divY);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(15, 23, 42);
  doc.text('EXECUTIVE TRADE AREA SUMMARY', margin + 14, divY + 14);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text(summaryLines, margin + 14, divY + 25);

  yPos += cardHeight + 14;

  // ==========================================
  // 3. TABLE 1: 3-COLUMN LOCATION BENCHMARK ASSESSMENT
  // ==========================================
  const col0Width = 120;
  const col1Width = 130;
  const col2Width = 290;
  const safeUsableWidth = col2Width - 18; // 272 pt

  const tableHead1 = [
    [
      { content: '1. KPI', styles: { halign: 'left' as const } },
      { content: '2. ACCEPTABLE REGION', styles: { halign: 'left' as const } },
      {
        content: `3. MARKET RESEARCH & MEASURED RESULT`,
        styles: { halign: 'left' as const },
      },
    ],
    [
      { content: 'Location Benchmarks', styles: { halign: 'left' as const } },
      { content: 'Target Thresholds', styles: { halign: 'left' as const } },
      { content: `Property: ${assessment.propertyAddress.slice(0, 48)}`, styles: { halign: 'left' as const } },
    ],
  ];

  const tableRows1: RowInput[] = assessment.kpis.map((item) => {
    const subtitle = KPI_SUBTITLES[item.id] || 'Regional Metric';
    const benchmarkNote = KPI_BENCHMARK_NOTES[item.id] || 'Target qualification criteria.';

    const col0Text = `${item.kpi}\n${subtitle}`;
    const col1Text = `${item.acceptableRegion}\n\n${benchmarkNote}`;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const measuredLine = `Measured: ${item.measuredValue}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const notesLines = item.notes ? doc.splitTextToSize(item.notes, safeUsableWidth) : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const sourceTitle = item.sourceTitle || 'Official Regional Data';
    const sourceTitleLines = doc.splitTextToSize(`Source: ${sourceTitle}`, safeUsableWidth);

    const urlLines = item.sourceUrl
      ? breakUrlToFit(`Website: ${item.sourceUrl}`, safeUsableWidth, doc)
      : [];

    const col2Lines = [
      measuredLine,
      ...notesLines,
      ...sourceTitleLines,
      ...urlLines,
      '',
    ];

    return [col0Text, col1Text, col2Lines.join('\n')];
  });

  autoTable(doc, {
    startY: yPos,
    head: tableHead1,
    body: tableRows1,
    margin: { top: 36, right: margin, bottom: 40, left: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      lineColor: [30, 41, 59],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: col0Width, fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 },
      1: { cellWidth: col1Width, textColor: [51, 65, 85], fontSize: 7.5 },
      2: { cellWidth: col2Width, textColor: [15, 23, 42], fontSize: 8.5 },
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      font: 'helvetica',
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.row.index === 1) {
        data.cell.styles.fillColor = [241, 245, 249];
        data.cell.styles.textColor = [100, 116, 139];
        data.cell.styles.fontStyle = 'normal';
        data.cell.styles.fontSize = 7;
        data.cell.styles.cellPadding = { top: 4, bottom: 4, left: 8, right: 8 };
      }
    },
    willDrawCell: (data) => {
      if (data.section === 'body') {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;

      const cell = data.cell;
      const kpiIndex = data.row.index;
      const item = assessment.kpis[kpiIndex];
      if (!item) return;

      const pageNumber = doc.getCurrentPageInfo().pageNumber;

      if (data.column.index === 0) {
        let y = cell.y + 13;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.kpi, cell.x + 8, y);

        y += 11;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const subtitle = KPI_SUBTITLES[item.id] || 'Regional Metric';
        doc.text(subtitle, cell.x + 8, y);
      }

      if (data.column.index === 1) {
        let y = cell.y + 13;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const accLines = doc.splitTextToSize(item.acceptableRegion, col1Width - 16);
        doc.text(accLines, cell.x + 8, y);
        y += accLines.length * 10.5 + 4;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        const benchmarkNote = KPI_BENCHMARK_NOTES[item.id] || 'Target qualification criteria.';
        const noteLines = doc.splitTextToSize(benchmarkNote, col1Width - 16);
        doc.text(noteLines, cell.x + 8, y);
      }

      if (data.column.index === 2) {
        let y = cell.y + 13;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const measuredText = `Measured: ${item.measuredValue}`;
        doc.text(measuredText, cell.x + 8, y);

        const isPass = item.status === 'PASS';
        const isFail = item.status === 'FAIL';
        const pillW = 38;
        const pillH = 13;
        const pillX = cell.x + cell.width - 8 - pillW;
        const pillY = cell.y + 4;

        const pillBg = isPass ? [209, 250, 229] : isFail ? [254, 226, 226] : [254, 243, 199];
        const pillBorder = isPass ? [110, 231, 183] : isFail ? [252, 165, 165] : [253, 230, 138];
        const pillTextColor = isPass ? [6, 95, 70] : isFail ? [153, 27, 27] : [146, 64, 14];

        doc.setFillColor(pillBg[0], pillBg[1], pillBg[2]);
        doc.setDrawColor(pillBorder[0], pillBorder[1], pillBorder[2]);
        doc.setLineWidth(0.5);
        doc.roundedRect(pillX, pillY, pillW, pillH, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(pillTextColor[0], pillTextColor[1], pillTextColor[2]);
        const statusTextW = doc.getTextWidth(item.status);
        doc.text(item.status, pillX + (pillW - statusTextW) / 2, pillY + 9);

        y += 14;

        if (item.notes) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const notesLines = doc.splitTextToSize(item.notes, safeUsableWidth);
          doc.text(notesLines, cell.x + 8, y);
          y += notesLines.length * 10 + 4;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const sourceTitle = item.sourceTitle || 'Official Regional Data';
        const sourceTitleLines = doc.splitTextToSize(`Source: ${sourceTitle}`, safeUsableWidth);
        doc.text(sourceTitleLines, cell.x + 8, y);
        y += sourceTitleLines.length * 11 + 2;

        if (item.sourceUrl) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          const urlLines = breakUrlToFit(`Website: ${item.sourceUrl}`, safeUsableWidth, doc);

          for (const line of urlLines) {
            doc.text(line, cell.x + 8, y);

            const lineWidth = Math.min(doc.getTextWidth(line), safeUsableWidth);
            pendingLinks.push({
              page: pageNumber,
              x: cell.x + 8,
              y: y - 8,
              width: lineWidth,
              height: 10,
              url: item.sourceUrl,
            });

            y += 11;
          }
        }
      }
    },
  });

  // ==========================================
  // 4. TABLE 2: QUICK MARKET VIEW (5-MILE RADIUS)
  // ==========================================
  const lastTableY = (doc as any).lastAutoTable?.finalY || yPos + 200;
  let qmvStartY = lastTableY + 22;

  // If near bottom of page, start on next page
  if (qmvStartY > pageHeight - 140) {
    doc.addPage();
    qmvStartY = 46;
  }

  const qmvData: QuickMarketKPIItem[] =
    assessment.quickMarketView && assessment.quickMarketView.length > 0
      ? assessment.quickMarketView
      : DEFAULT_QUICK_MARKET_VIEW;

  const tableHead2: RowInput[] = [
    [
      { content: 'QUICK MARKET VIEW (5-MILE RADIUS)', colSpan: 3, styles: { halign: 'left' as const } },
    ],
    [
      { content: '1. 5-MILE STORAGE KPI', styles: { halign: 'left' as const } },
      { content: '2. INDUSTRY BENCHMARK', styles: { halign: 'left' as const } },
      { content: '3. MEASURED 5-MILE RESULT & SOURCE', styles: { halign: 'left' as const } },
    ],
  ];

  const tableRows2: RowInput[] = qmvData.map((item) => {
    const col0Text = `${item.kpi}\n5-Mile Radius`;
    const col1Text = item.benchmark;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const measuredLine = `Measured: ${item.measuredValue}`;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    const notesLines = item.notes ? doc.splitTextToSize(item.notes, safeUsableWidth) : [];

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    const sourceTitle = item.sourceTitle || 'Industry Radius Analytics';
    const sourceTitleLines = doc.splitTextToSize(`Source: ${sourceTitle}`, safeUsableWidth);

    const urlLines = item.sourceUrl
      ? breakUrlToFit(`Website: ${item.sourceUrl}`, safeUsableWidth, doc)
      : [];

    const col2Lines = [
      measuredLine,
      ...notesLines,
      ...sourceTitleLines,
      ...urlLines,
      '',
    ];

    return [col0Text, col1Text, col2Lines.join('\n')];
  });

  autoTable(doc, {
    startY: qmvStartY,
    head: tableHead2,
    body: tableRows2,
    margin: { top: 36, right: margin, bottom: 40, left: margin },
    tableWidth: contentWidth,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: { top: 6, bottom: 6, left: 8, right: 8 },
      lineColor: [51, 65, 85],
      lineWidth: 0.5,
    },
    columnStyles: {
      0: { cellWidth: col0Width, fontStyle: 'bold', textColor: [15, 23, 42], fontSize: 8 },
      1: { cellWidth: col1Width, textColor: [51, 65, 85], fontSize: 7.5 },
      2: { cellWidth: col2Width, textColor: [15, 23, 42], fontSize: 8.5 },
    },
    styles: {
      lineColor: [226, 232, 240],
      lineWidth: 0.5,
      cellPadding: { top: 7, bottom: 7, left: 8, right: 8 },
      font: 'helvetica',
      overflow: 'linebreak',
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252],
    },
    didParseCell: (data) => {
      if (data.section === 'head' && data.row.index === 0) {
        data.cell.styles.fillColor = [15, 23, 42];
        data.cell.styles.textColor = [155, 203, 56]; // #9bcb38
        data.cell.styles.fontStyle = 'bold';
        data.cell.styles.fontSize = 9;
        data.cell.styles.cellPadding = { top: 6, bottom: 6, left: 8, right: 8 };
      }
    },
    willDrawCell: (data) => {
      if (data.section === 'body') {
        data.cell.text = [];
      }
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;

      const cell = data.cell;
      const kpiIndex = data.row.index;
      const item = qmvData[kpiIndex];
      if (!item) return;

      const pageNumber = doc.getCurrentPageInfo().pageNumber;

      if (data.column.index === 0) {
        let y = cell.y + 13;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        doc.text(item.kpi, cell.x + 8, y);

        y += 11;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text('5-Mile Radius', cell.x + 8, y);
      }

      if (data.column.index === 1) {
        let y = cell.y + 13;
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(7.5);
        doc.setTextColor(30, 41, 59);
        const bLines = doc.splitTextToSize(item.benchmark, col1Width - 16);
        doc.text(bLines, cell.x + 8, y);
      }

      if (data.column.index === 2) {
        let y = cell.y + 13;

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const measuredText = `Measured: ${item.measuredValue}`;
        doc.text(measuredText, cell.x + 8, y);

        const pillW = 44;
        const pillH = 13;
        const pillX = cell.x + cell.width - 8 - pillW;
        const pillY = cell.y + 4;

        doc.setFillColor(209, 250, 229);
        doc.setDrawColor(110, 231, 183);
        doc.setLineWidth(0.5);
        doc.roundedRect(pillX, pillY, pillW, pillH, 3, 3, 'FD');

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(6.5);
        doc.setTextColor(6, 95, 70);
        const statusTextW = doc.getTextWidth(item.status);
        doc.text(item.status, pillX + (pillW - statusTextW) / 2, pillY + 9);

        y += 14;

        if (item.notes) {
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7.5);
          doc.setTextColor(71, 85, 105);
          const notesLines = doc.splitTextToSize(item.notes, safeUsableWidth);
          doc.text(notesLines, cell.x + 8, y);
          y += notesLines.length * 10 + 4;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.setTextColor(15, 23, 42);
        const sourceTitle = item.sourceTitle || 'Industry Radius Analytics';
        const sourceTitleLines = doc.splitTextToSize(`Source: ${sourceTitle}`, safeUsableWidth);
        doc.text(sourceTitleLines, cell.x + 8, y);
        y += sourceTitleLines.length * 11 + 2;

        if (item.sourceUrl) {
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8.5);
          doc.setTextColor(15, 23, 42);
          const urlLines = breakUrlToFit(`Website: ${item.sourceUrl}`, safeUsableWidth, doc);

          for (const line of urlLines) {
            doc.text(line, cell.x + 8, y);

            const lineWidth = Math.min(doc.getTextWidth(line), safeUsableWidth);
            pendingLinks.push({
              page: pageNumber,
              x: cell.x + 8,
              y: y - 8,
              width: lineWidth,
              height: 10,
              url: item.sourceUrl,
            });

            y += 11;
          }
        }
      }
    },
    didDrawPage: () => {
      const pageNum = doc.getNumberOfPages();

      doc.setDrawColor(226, 232, 240);
      doc.setLineWidth(0.5);
      doc.line(margin, pageHeight - 24, rightBoundary, pageHeight - 24);

      doc.setFontSize(6.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(148, 163, 184);
      doc.text(
        'BIG GUY STORAGE | Confidential & Proprietary Market Assessment | 5-Mile Radius & Benchmarks',
        margin,
        pageHeight - 14
      );

      const pageStr = `Page ${pageNum}`;
      doc.text(pageStr, rightBoundary - doc.getTextWidth(pageStr), pageHeight - 14);
    },
  });

  // ==========================================
  // 5. ATTACH ACTIVE PDF HYPERLINKS
  // ==========================================
  for (const link of pendingLinks) {
    doc.setPage(link.page);
    doc.link(link.x, link.y, link.width, link.height, { url: link.url });
  }

  // ==========================================
  // 6. DOWNLOAD PDF
  // ==========================================
  const sanitizedFilename = `bigguy-storage-assessment-${assessment.propertyAddress
    .slice(0, 30)
    .replace(/[^a-z0-9]/gi, '_')}.pdf`;
  doc.save(sanitizedFilename);
}
