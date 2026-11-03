import type { BSEStock } from '../types/bse';

export const finite = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
export const nonnegative = (value: unknown): value is number => finite(value) && value >= 0;
export const money = (value: number | null | undefined) => finite(value)
  ? new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  : '—';
export const percent = (value: number | null | undefined) => finite(value) ? `${value.toFixed(2)}%` : '—';
export const number = (value: number | null | undefined) => finite(value) ? new Intl.NumberFormat('en-IN', { maximumFractionDigits: 2 }).format(value) : '—';
export const change = (value: number | null | undefined) => finite(value) ? `${value > 0 ? '+' : ''}${value.toFixed(2)}%` : '—';
export const dateLabel = (value: string | null | undefined, time = false) => {
  if (!value) return '—';
  const parsed = new Date(/^\d{4}-\d{2}-\d{2}$/.test(value) ? `${value}T00:00:00+05:30` : value);
  if (Number.isNaN(parsed.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric', ...(time ? { hour: '2-digit', minute: '2-digit', hour12: false } : {}) }).format(parsed) + (time ? ' IST' : '');
};
export const indiaToday = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
export function availableYield(stock: BSEStock): number | null {
  return stock.dataStatus !== 'unavailable' && stock.dataStatus !== 'stale' && stock.dividendStatus === 'available' && nonnegative(stock.yieldPercent) && nonnegative(stock.dividendTTM) && finite(stock.price) && stock.price > 0 ? stock.yieldPercent : null;
}
export const statusLabel = (status: string) => ({ live: 'Live', delayed: 'Delayed', eod: 'End of day', unavailable: 'Unavailable', stale: 'Stale' }[status] || 'Unavailable');
export const setupUrl = 'https://github.com/AiSathya/LiveBSEhighYield/tree/main/docs';
