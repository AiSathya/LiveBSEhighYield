/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SGXStock } from '../types/sgx';

export const exportToCSV = (stocks: SGXStock[], filename = 'SGX_High_Dividend_Report.csv') => {
  const headers = [
    'Ticker',
    'Company Name',
    'Sector',
    'Price (SGD)',
    'Dividend Yield (%)',
    'Annual DPS (SGD)',
    'Payout Frequency',
    'Payout Ratio (%)',
    'FCF Coverage (x)',
    'Gearing / Leverage (%)',
    '5Y Dividend CAGR (%)',
    'Health Rating',
    'Health Score (100)',
    'Upcoming Ex-Date',
    'Upcoming Payout Date',
    'Next DPS (SGD)',
    '5Y History (2022 DPS)',
    '5Y History (2023 DPS)',
    '5Y History (2024 DPS)',
    '5Y History (2025 DPS)',
    '5Y History (2026 DPS)',
  ];

  const rows = stocks.map((s) => {
    const dps2022 = s.historicalPayouts.find((p) => p.year === 2022)?.dps || 'N/A';
    const dps2023 = s.historicalPayouts.find((p) => p.year === 2023)?.dps || 'N/A';
    const dps2024 = s.historicalPayouts.find((p) => p.year === 2024)?.dps || 'N/A';
    const dps2025 = s.historicalPayouts.find((p) => p.year === 2025)?.dps || 'N/A';
    const dps2026 = s.historicalPayouts.find((p) => p.year === 2026)?.dps || 'N/A';

    return [
      `"${s.ticker}"`,
      `"${s.name.replace(/"/g, '""')}"`,
      `"${s.sector}"`,
      s.price.toFixed(3),
      s.yieldPercent.toFixed(2),
      s.dpsAnnual.toFixed(4),
      `"${s.payoutFrequency}"`,
      s.payoutRatio,
      s.fcfCoverage.toFixed(2),
      s.gearing !== null ? s.gearing.toFixed(1) : 'N/A',
      s.fiveYearCAGR.toFixed(1),
      `"${s.healthRating}"`,
      s.healthScore,
      `"${s.upcomingDividend.exDate}"`,
      `"${s.upcomingDividend.paymentDate}"`,
      s.upcomingDividend.amount.toFixed(4),
      dps2022,
      dps2023,
      dps2024,
      dps2025,
      dps2026,
    ].join(',');
  });

  const csvContent = [headers.join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const exportToJSON = (stocks: SGXStock[], filename = 'sgx_dividend_intelligence.json') => {
  const jsonContent = JSON.stringify(
    {
      market: 'Singapore Exchange (SGX)',
      currency: 'SGD',
      generatedAt: new Date().toISOString(),
      disclaimer: 'For analytical and research purposes only. 0% dividend withholding tax applies for retail individuals under Singapore one-tier corporate tax framework.',
      stocksCount: stocks.length,
      data: stocks,
    },
    null,
    2
  );

  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

export const copyMarkdownAnalysis = async (stocks: SGXStock[]): Promise<boolean> => {
  const sorted = [...stocks].sort((a, b) => b.yieldPercent - a.yieldPercent);
  
  let md = `# Singapore Exchange (SGX) High-Yield Dividend Rankings\n`;
  md += `*Generated: ${new Date().toLocaleDateString('en-SG', { dateStyle: 'long' })}*\n\n`;
  md += `| Ticker | Company Name | Sector | Price (SGD) | Yield (%) | Annual DPS | Ex-Date | Payout Date | Health |\n`;
  md += `| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |\n`;

  sorted.forEach((s) => {
    md += `| **${s.ticker}** | ${s.name} | ${s.sector} | S$${s.price.toFixed(3)} | **${s.yieldPercent.toFixed(2)}%** | S$${s.dpsAnnual.toFixed(4)} | ${s.upcomingDividend.exDate} | ${s.upcomingDividend.paymentDate} | ${s.healthRating} (${s.healthScore}/100) |\n`;
  });

  md += `\n### Key Takeaways\n`;
  md += `- Singapore Individual Dividend Withholding Tax: **0.00%** (One-tier corporate tax).\n`;
  md += `- Highest Dividend Yield: **${sorted[0].name} (${sorted[0].ticker})** at **${sorted[0].yieldPercent.toFixed(2)}%**.\n`;
  md += `- Average Portfolio Yield: **${(sorted.reduce((acc, curr) => acc + curr.yieldPercent, 0) / sorted.length).toFixed(2)}%**.\n`;

  try {
    await navigator.clipboard.writeText(md);
    return true;
  } catch (err) {
    console.error('Failed to copy markdown to clipboard', err);
    return false;
  }
};

/**
 * Creates an iCalendar .ics file so users can import upcoming ex-dividend & payment dates into Google Calendar / Outlook / Apple Calendar.
 */
export const downloadDividendCalendarICS = (stocks: SGXStock[]) => {
  const events = stocks
    .filter((s) => s.upcomingDividend.declared)
    .map((s) => {
      const exDateClean = s.upcomingDividend.exDate.replace(/-/g, '');
      const payDateClean = s.upcomingDividend.paymentDate.replace(/-/g, '');
      return [
        'BEGIN:VEVENT',
        `SUMMARY:SGX Ex-Dividend: ${s.ticker} (${s.name})`,
        `DESCRIPTION:${s.name} (${s.ticker}) Ex-Dividend Date.\\nDistribution: S$${s.upcomingDividend.amount.toFixed(4)} per share\\nPayment Date: ${s.upcomingDividend.paymentDate}\\nYield: ${s.yieldPercent.toFixed(2)}%`,
        `DTSTART;VALUE=DATE:${exDateClean}`,
        `DTEND;VALUE=DATE:${exDateClean}`,
        `UID:sgx-ex-${s.ticker}-${exDateClean}@lionyield.sg`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
        'BEGIN:VEVENT',
        `SUMMARY:SGX Dividend Payout: ${s.ticker} (${s.name})`,
        `DESCRIPTION:${s.name} (${s.ticker}) Dividend Payment Date.\\nAmount: S$${s.upcomingDividend.amount.toFixed(4)} per share.`,
        `DTSTART;VALUE=DATE:${payDateClean}`,
        `DTEND;VALUE=DATE:${payDateClean}`,
        `UID:sgx-pay-${s.ticker}-${payDateClean}@lionyield.sg`,
        'STATUS:CONFIRMED',
        'END:VEVENT',
      ].join('\r\n');
    })
    .join('\r\n');

  const icsBody = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//LionYield SGX Dividend Intelligence//SG//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    events,
    'END:VCALENDAR',
  ].join('\r\n');

  const blob = new Blob([icsBody], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'SGX_Dividend_Calendar.ics');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
