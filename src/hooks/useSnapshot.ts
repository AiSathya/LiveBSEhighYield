import { useCallback, useEffect, useRef, useState } from 'react';
import type { BSEStock, Snapshot } from '../types/bse';
import { finite, indiaToday } from '../lib/format';

const DEFAULT_SNAPSHOT = 'https://raw.githubusercontent.com/AiSathya/LiveBSEhighYield/main/public/data/bse-high-yield.json';
const env = (import.meta as ImportMeta & { env: Record<string, string | undefined> }).env;
const apiBase = (env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const rawUrl = env.VITE_SNAPSHOT_URL || DEFAULT_SNAPSHOT;
const bundledUrl = new URL('data/bse-high-yield.json', document.baseURI).href;
const announcementsUrl = new URL('data/bse-announcements.json', document.baseURI).href;
const isNative = /BSEHighYieldAndroid/i.test(navigator.userAgent);
const staticOnly = !apiBase && (isNative || Boolean(env.VITE_SNAPSHOT_URL) || location.protocol === 'file:');
const allowed = ['live', 'delayed', 'eod', 'unavailable', 'stale'];

function parseSnapshot(value: unknown): Snapshot {
  if (!value || typeof value !== 'object') throw new Error('Invalid snapshot response.');
  const data = value as Snapshot;
  if (data.schemaVersion !== 1 || data.market !== 'BSE' || data.currency !== 'INR' || !Array.isArray(data.stocks) || !allowed.includes(data.status)) throw new Error('Response does not match the BSE snapshot schema.');
  const stocks = data.stocks.filter(stock => stock && typeof stock.ticker === 'string' && typeof stock.bseCode === 'string' && typeof stock.name === 'string' && stock.currency === 'INR').map(stock => {
    const result: BSEStock = { ...stock, sector: typeof stock.sector === 'string' ? stock.sector : 'Unclassified', source: typeof stock.source === 'string' ? stock.source : 'Not supplied', quoteAsOf: typeof stock.quoteAsOf === 'string' ? stock.quoteAsOf : null, dataStatus: allowed.includes(stock.dataStatus) ? stock.dataStatus : 'unavailable', dividendStatus: stock.dividendStatus === 'available' ? 'available' : 'unavailable', dividends: Array.isArray(stock.dividends) ? stock.dividends.filter(d => d && typeof d.date === 'string' && !Number.isNaN(Date.parse(d.date)) && finite(d.amount) && d.amount >= 0 && d.currency === 'INR') : [] };
    for (const key of ['price', 'previousClose', 'dayChange', 'dayChangePercent', 'dividendTTM', 'yieldPercent', 'volume', 'marketCap', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow'] as const) result[key] = finite(stock[key]) ? stock[key] as number : null;
    for (const key of ['price', 'previousClose', 'dividendTTM', 'yieldPercent', 'volume', 'marketCap', 'fiftyTwoWeekHigh', 'fiftyTwoWeekLow'] as const) if (result[key] !== null && result[key]! < 0) result[key] = null;
    return result;
  });
  return { ...data, stocks, generatedAt: typeof data.generatedAt === 'string' ? data.generatedAt : null, provider: typeof data.provider === 'string' ? data.provider : 'Not supplied', message: typeof data.message === 'string' ? data.message : '', methodology: typeof data.methodology === 'string' ? data.methodology : 'Trailing 12-month cash dividends divided by latest price × 100. Only provider-covered yields are shown.' };
}

// The client can downgrade provider labels, never promote old data to live.
function checkFreshness(data: Snapshot, daily: boolean): Snapshot {
  const now = Date.now();
  const india = new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(now));
  const part = (type: string) => india.find(p => p.type === type)?.value || '';
  const minutes = Number(part('hour')) * 60 + Number(part('minute'));
  const regularSession = !['Sat', 'Sun'].includes(part('weekday')) && minutes >= 555 && minutes <= 930;
  const today = Date.parse(indiaToday());
  const stocks = data.stocks.map(stock => {
    if (stock.dataStatus === 'unavailable') return stock;
    const quotedAt = stock.quoteAsOf ? Date.parse(stock.quoteAsOf) : NaN;
    let dataStatus = stock.dataStatus;
    if (Number.isFinite(quotedAt)) {
      const quoteDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(quotedAt));
      if (today - Date.parse(quoteDay) > 4 * 86400000) dataStatus = 'stale';
      else if (dataStatus === 'live' && (daily || now - quotedAt > 15 * 60000)) dataStatus = daily || !regularSession ? 'eod' : 'delayed';
    } else if (dataStatus === 'live') dataStatus = daily ? 'eod' : 'delayed';
    return { ...stock, dataStatus, yieldPercent: dataStatus === 'stale' ? null : stock.yieldPercent };
  });
  const priced = stocks.filter(s => finite(s.price) && s.price > 0 && s.dataStatus !== 'unavailable');
  let status = data.status;
  if (priced.length && priced.every(s => s.dataStatus === 'stale')) status = 'stale';
  else if (status === 'live' && (daily || priced.length && priced.every(s => s.dataStatus !== 'live'))) status = daily || !regularSession ? 'eod' : 'delayed';
  return { ...data, stocks, status, message: status === 'stale' && data.status !== 'stale' ? `${data.message} Client freshness check: all usable quotes are over four calendar days old; original timestamps are preserved.` : data.message };
}

async function supplementAnnouncements(data: Snapshot): Promise<Snapshot> {
  try {
    const response = await fetch(announcementsUrl, { cache: 'no-store', signal: AbortSignal.timeout(4000) });
    if (!response.ok) return data;
    const payload = await response.json();
    if (!Array.isArray(payload.events) || payload.source !== 'BSE Corporate Actions') return data;
    return { ...data, stocks: data.stocks.map(stock => {
      const extra = payload.events.filter((event: { bseCode?: string; date?: string; amount?: number; currency?: string }) => event.bseCode === stock.bseCode && typeof event.date === 'string' && !Number.isNaN(Date.parse(event.date)) && finite(event.amount) && event.amount >= 0 && event.currency === 'INR' && !stock.dividends.some(d => d.date === event.date && d.amount === event.amount));
      // These are selected actual events, NOT complete trailing history. Coverage and yields are untouched.
      return extra.length ? { ...stock, dividends: [...stock.dividends, ...extra], source: `${stock.source}; selected dividend events: BSE Corporate Actions` } : stock;
    }) };
  } catch { return data; }
}

async function readSnapshot(url: string): Promise<Snapshot> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 18000);
  try {
    const response = await fetch(url, { cache: 'no-store', signal: controller.signal });
    if (!response.ok) throw new Error(`Data request returned HTTP ${response.status}.`);
    return parseSnapshot(await response.json());
  } finally { clearTimeout(timeout); }
}

export function useSnapshot() {
  const [snapshot, setSnapshot] = useState<Snapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [transport, setTransport] = useState(staticOnly ? 'Daily snapshot' : 'Backend API');
  const [autoRefresh, setAutoRefresh] = useState(false);
  const inFlight = useRef(false);
  const alive = useRef(true);
  const refresh = useCallback(async (force = true) => {
    if (inFlight.current) return;
    inFlight.current = true;
    setLoading(true);
    let fallback = false;
    let bundled = false;
    const dailySnapshot = async () => {
      try { return await readSnapshot(rawUrl); }
      catch { bundled = true; return await readSnapshot(bundledUrl); }
    };
    try {
      let data: Snapshot;
      if (staticOnly) data = await dailySnapshot();
      else {
        try { data = await readSnapshot(`${apiBase}/api/bse/snapshot${force ? '?refresh=true' : ''}`); }
        catch { fallback = true; data = await dailySnapshot(); }
      }
      data = checkFreshness(await supplementAnnouncements(data), staticOnly || fallback);
      if (!alive.current) return;
      setSnapshot(data);
      setTransport(bundled ? 'Bundled daily snapshot' : staticOnly || fallback ? 'Published daily snapshot' : 'Backend API');
      setError(bundled ? 'Remote data unavailable. Showing the bundled daily snapshot, which may be outdated. Quote timestamps and freshness labels are preserved; this is not a live feed.' : fallback ? 'Backend unavailable. Showing the published daily snapshot; this is not a live quote feed.' : null);
    } catch {
      if (!alive.current) return;
      setError('Could not retrieve BSE data. Check your connection or review the data-source setup. No sample prices or dividends are substituted.');
      setSnapshot(previous => previous ? { ...previous, status: 'stale', message: 'Refresh failed. Previously received data is retained with its original timestamps.', stocks: previous.stocks.map(stock => ({ ...stock, yieldPercent: null, dataStatus: stock.dataStatus === 'unavailable' ? 'unavailable' : 'stale' })) } : null);
    } finally {
      inFlight.current = false;
      if (alive.current) setLoading(false);
    }
  }, []);
  useEffect(() => { alive.current = true; void refresh(false); return () => { alive.current = false; }; }, [refresh]);
  useEffect(() => {
    if (!autoRefresh || staticOnly) return;
    const timer = setInterval(() => { if (document.visibilityState === 'visible') void refresh(false); }, 60000);
    return () => clearInterval(timer);
  }, [autoRefresh, refresh]);
  return { snapshot, loading, error, refresh, transport, autoRefresh, setAutoRefresh, canAutoRefresh: !staticOnly };
}
