import type { BSEStock, Holding, Snapshot } from '../types/bse';
import { availableYield } from './format';

function csvCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  const text = String(value);
  // Prevent spreadsheet formula injection in provider-supplied company/source fields.
  const safe = /^[=+@\-]/.test(text) && typeof value !== 'number' ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}
export function downloadCsv(filename: string, rows: unknown[][]) {
  const blob = new Blob(['\ufeff' + rows.map(row => row.map(csvCell).join(',')).join('\r\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.download = filename; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function exportStocks(stocks: BSEStock[], snapshot: Snapshot | null) {
  downloadCsv('bse-high-yield-watchlist.csv', [
    ['Ticker', 'BSE code', 'ISIN', 'Company', 'Sector', 'Currency', 'Price', 'Previous close', 'Day change', 'Day change percent', 'TTM cash dividends per share', 'Yield percent', 'Quote as of', 'Quote status', 'Dividend coverage', 'Stock source', 'Snapshot provider', 'Snapshot generated at', 'Snapshot status', 'Methodology'],
    ...stocks.map(s => [s.ticker, s.bseCode, s.isin, s.name, s.sector, 'INR', s.price, s.previousClose, s.dayChange, s.dayChangePercent, s.dividendTTM, availableYield(s), s.quoteAsOf, s.dataStatus, s.dividendStatus, s.source, snapshot?.provider, snapshot?.generatedAt, snapshot?.status, snapshot?.methodology]),
  ]);
}
export function exportDividends(stocks: BSEStock[], snapshot: Snapshot | null) {
  downloadCsv('bse-dividend-records.csv', [
    ['Ticker', 'BSE code', 'Company', 'Dividend date', 'Amount per share', 'Currency', 'Payment date', 'Kind', 'Dividend coverage', 'Source', 'Quote as of', 'Snapshot generated at', 'Methodology'],
    ...stocks.flatMap(s => s.dividends.map(d => [s.ticker, s.bseCode, s.name, d.date, d.amount, d.currency, d.paymentDate, d.kind, s.dividendStatus, s.source, s.quoteAsOf, snapshot?.generatedAt, snapshot?.methodology])),
  ]);
}
export function exportHoldings(holdings: Holding[], stocks: BSEStock[], snapshot: Snapshot | null) {
  downloadCsv('bse-portfolio-plan.csv', [
    ['Ticker', 'BSE code', 'Company', 'Shares (user entered)', 'Average cost INR (user entered)', 'Latest price INR', 'TTM dividend per share INR', 'Estimated annual dividends INR (pre-tax)', 'Source', 'Quote as of', 'Snapshot generated at', 'Assumption'],
    ...holdings.map(h => { const s = stocks.find(stock => stock.bseCode === h.bseCode); const dps = s?.dividendStatus === 'available' && s.dividendTTM !== null && s.dividendTTM >= 0 ? s.dividendTTM : null; return [h.ticker, h.bseCode, h.name, h.shares, h.averageCost, s?.price, dps, dps === null ? null : h.shares * dps, s?.source, s?.quoteAsOf, snapshot?.generatedAt, 'TTM-based estimate, not a forecast or guaranteed payout. Excludes tax and TDS.']; }),
  ]);
}
