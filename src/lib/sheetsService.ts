import { MarketAssessmentResult } from '../types';

export interface CreateSheetResponse {
  spreadsheetId: string;
  spreadsheetUrl: string;
}

/**
 * Helper to fetch with exponential backoff on transient errors (503, 429, 500)
 */
async function fetchWithRetry(url: string, options: RequestInit, retries = 3): Promise<Response> {
  let lastResponse: Response | null = null;
  let delay = 1000;

  for (let i = 0; i < retries; i++) {
    try {
      const resp = await fetch(url, options);
      if (resp.ok) {
        return resp;
      }
      lastResponse = resp;
      if (resp.status === 401) {
        return resp;
      }
      if ([503, 429, 500, 502, 504].includes(resp.status)) {
        console.warn(`Google Sheets API returned ${resp.status}. Retrying in ${delay}ms... (attempt ${i + 1}/${retries})`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2;
        continue;
      }
      return resp;
    } catch (err: any) {
      console.warn(`Fetch error for ${url}:`, err);
      if (i === retries - 1) throw err;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  return lastResponse!;
}

/**
 * Creates a formatted Google Sheet in the authenticated user's Google Drive.
 * Includes both:
 * 1. Location Benchmarks (7 KPIs)
 * 2. Quick Market View (12 KPIs within 5-Mile Radius)
 */
export async function createAssessmentGoogleSheet(
  assessment: MarketAssessmentResult,
  accessToken: string
): Promise<CreateSheetResponse> {
  const sanitizedAddress = assessment.propertyAddress.trim() || 'Property';
  const title = `Big Guy Storage - Market Assessment - ${sanitizedAddress.slice(0, 30)}`;

  // Step 1: Create a new spreadsheet with basic metadata
  const totalRows = 30 + (assessment.quickMarketView?.length || 12);
  const createResp = await fetchWithRetry('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title,
      },
      sheets: [
        {
          properties: {
            title: 'Market Assessment',
            gridProperties: {
              rowCount: totalRows,
              columnCount: 5,
              frozenRowCount: 4,
            },
          },
        },
      ],
    }),
  });

  if (!createResp.ok) {
    const errBody = await createResp.json().catch(() => ({}));
    if (createResp.status === 401) {
      throw new Error('Google authorization token expired. Please sign out and sign in again.');
    }
    if (createResp.status === 503) {
      throw new Error('Google Sheets service is temporarily experiencing high traffic. Please try again in a moment.');
    }
    throw new Error(
      errBody.error?.message || `Failed to create Google Sheet (HTTP ${createResp.status})`
    );
  }

  const sheetData = await createResp.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const sheetId = sheetData.sheets?.[0]?.properties?.sheetId || 0;

  // Step 2: Prepare values for the 3 columns
  const values: any[][] = [
    ['BIG GUY STORAGE - PROPERTY MARKET ASSESSMENT REPORT', '', ''],
    [`Target Property Address:`, '', assessment.propertyAddress],
    [`Assessment Date: ${new Date(assessment.assessedAt).toLocaleDateString()}`, '', `Overall Viability: ${assessment.overallScore.verdict} (${assessment.overallScore.passedCount}/${assessment.overallScore.totalCount} KPIs Met)`],
    ['KPI', 'Acceptable Region', `Market Assessment for: ${sanitizedAddress}`],
  ];

  assessment.kpis.forEach((item) => {
    const sourceFormula = item.sourceUrl
      ? `=HYPERLINK("${item.sourceUrl}", "${item.measuredValue} [${item.status}] - Source: ${item.sourceTitle.replace(/"/g, '""')}")`
      : `${item.measuredValue} [${item.status}]`;

    values.push([item.kpi, item.acceptableRegion, sourceFormula]);
  });

  // Table 2: Quick Market View (5-Mile Radius)
  const qmvStartRowIndex = values.length + 1; // 0-indexed
  if (assessment.quickMarketView?.length) {
    values.push(['', '', '']);
    values.push(['QUICK MARKET VIEW (5-MILE RADIUS)', '', 'Self-Storage Facility Competition & 5-Mile Demographic Ring']);
    values.push(['5-Mile Storage KPI', 'Industry Benchmark', 'Measured 5-Mile Market Research & Verified Source']);

    assessment.quickMarketView.forEach((item) => {
      const sourceFormula = item.sourceUrl
        ? `=HYPERLINK("${item.sourceUrl}", "${item.measuredValue} [${item.status}] - Source: ${item.sourceTitle.replace(/"/g, '""')}")`
        : `${item.measuredValue} [${item.status}]`;

      values.push([item.kpi, item.benchmark, sourceFormula]);
    });
  }

  // Summary notes at bottom
  values.push(['', '', '']);
  values.push(['EXECUTIVE TRADE AREA SUMMARY', '', assessment.overallScore.summaryText]);

  // Update sheet values with USER_ENTERED so HYPERLINK formulas evaluate
  try {
    await fetchWithRetry(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/A1:C${values.length}?valueInputOption=USER_ENTERED`,
      {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          range: `A1:C${values.length}`,
          majorDimension: 'ROWS',
          values,
        }),
      }
    );
  } catch (err) {
    console.warn('Failed to insert values into sheet with retry:', err);
  }

  // Step 3: Polish layout, column widths, header colors, borders, and typography
  const batchRequests: any[] = [
    // Column Widths
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 0,
          endIndex: 1,
        },
        properties: { pixelSize: 250 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 1,
          endIndex: 2,
        },
        properties: { pixelSize: 280 },
        fields: 'pixelSize',
      },
    },
    {
      updateDimensionProperties: {
        range: {
          sheetId,
          dimension: 'COLUMNS',
          startIndex: 2,
          endIndex: 3,
        },
        properties: { pixelSize: 480 },
        fields: 'pixelSize',
      },
    },
    // Main Brand Header (Row 1)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 0,
          endRowIndex: 1,
          startColumnIndex: 0,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.12, green: 0.18, blue: 0.28 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 13,
            },
            horizontalAlignment: 'LEFT',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)',
      },
    },
    // Table 1 Headers (Row 4)
    {
      repeatCell: {
        range: {
          sheetId,
          startRowIndex: 3,
          endRowIndex: 4,
          startColumnIndex: 0,
          endColumnIndex: 3,
        },
        cell: {
          userEnteredFormat: {
            backgroundColor: { red: 0.22, green: 0.35, blue: 0.55 },
            textFormat: {
              foregroundColor: { red: 1, green: 1, blue: 1 },
              bold: true,
              fontSize: 10,
            },
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat(backgroundColor,textFormat,verticalAlignment)',
      },
    },
  ];

  // If Quick Market View exists, style Table 2 Header as well
  if (assessment.quickMarketView?.length) {
    batchRequests.push(
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: qmvStartRowIndex,
            endRowIndex: qmvStartRowIndex + 1,
            startColumnIndex: 0,
            endColumnIndex: 3,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.12, green: 0.18, blue: 0.28 },
              textFormat: {
                foregroundColor: { red: 0.75, green: 0.95, blue: 0.3 },
                bold: true,
                fontSize: 11,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      },
      {
        repeatCell: {
          range: {
            sheetId,
            startRowIndex: qmvStartRowIndex + 1,
            endRowIndex: qmvStartRowIndex + 2,
            startColumnIndex: 0,
            endColumnIndex: 3,
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.22, green: 0.35, blue: 0.55 },
              textFormat: {
                foregroundColor: { red: 1, green: 1, blue: 1 },
                bold: true,
                fontSize: 10,
              },
            },
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat)',
        },
      }
    );
  }

  // Apply batch updates
  try {
    await fetchWithRetry(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ requests: batchRequests }),
    });
  } catch (err) {
    console.warn('Batch formatting warning (sheet still created successfully):', err);
  }

  const spreadsheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  return {
    spreadsheetId,
    spreadsheetUrl,
  };
}
