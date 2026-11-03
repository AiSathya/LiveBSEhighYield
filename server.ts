/** SPDX-License-Identifier: Apache-2.0 */
import express from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
import { readFile, mkdtemp, rm } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { tmpdir } from 'node:os';
import path from 'node:path';
import type { Snapshot } from './src/types/bse';

dotenv.config();
const app = express();
const PORT = Number(process.env.PORT) || 3000;
const ROOT = process.cwd();
const TTL = 60_000;
const CANONICAL = 'https://raw.githubusercontent.com/AiSathya/LiveBSEhighYield/main/public/data/bse-high-yield.json';
const run = promisify(execFile);
let cached: Snapshot | null = null;
let fetchedAt = 0;
let lastAttempt = 0;
let inFlight: Promise<Snapshot> | null = null;
let actionsAttemptDay = '';
let cachedIsProviderObservation = false;

function validSnapshot(value: unknown): value is Snapshot {
  if (!value || typeof value !== 'object') return false;
  const s = value as Snapshot;
  return s.schemaVersion === 1 && s.market === 'BSE' && s.currency === 'INR' && Array.isArray(s.stocks) && s.stocks.length > 0 && typeof s.message === 'string' && s.stocks.every(stock => stock.currency === 'INR' && typeof stock.ticker === 'string' && typeof stock.bseCode === 'string' && Array.isArray(stock.dividends) && (stock.price === null || (typeof stock.price === 'number' && Number.isFinite(stock.price) && stock.price > 0)));
}

function reclassify(snapshot: Snapshot): Snapshot {
  const now = Date.now();
  const formatter = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', year: 'numeric', month: '2-digit', day: '2-digit' });
  const parts = Object.fromEntries(formatter.formatToParts(new Date(now)).map(p => [p.type, p.value]));
  const clock = Number(parts.hour) * 60 + Number(parts.minute);
  const tradingHours = !['Sat', 'Sun'].includes(parts.weekday) && clock >= 555 && clock < 930;
  const day = `${parts.year}-${parts.month}-${parts.day}`;
  const stocks = snapshot.stocks.map(stock => {
    const observed = stock.quoteAsOf ? Date.parse(stock.quoteAsOf) : NaN;
    let dataStatus: Snapshot['status'] = 'unavailable';
    if (stock.price !== null && Number.isFinite(observed) && observed <= now + 120_000) {
      const age = now - observed;
      const tradeParts = Object.fromEntries(formatter.formatToParts(new Date(observed)).map(p => [p.type, p.value]));
      const tradeDay = `${tradeParts.year}-${tradeParts.month}-${tradeParts.day}`;
      if (age > 4 * 86_400_000) dataStatus = 'stale';
      else if (cachedIsProviderObservation && tradingHours && tradeDay === day && age < 15 * 60_000) dataStatus = 'live';
      else if (cachedIsProviderObservation && tradingHours && tradeDay === day && age < 60 * 60_000) dataStatus = 'delayed';
      else dataStatus = 'eod';
    }
    return { ...stock, dataStatus, yieldPercent: dataStatus === 'stale' || dataStatus === 'unavailable' ? null : stock.yieldPercent };
  });
  const states = stocks.map(s => s.dataStatus).filter(s => s !== 'unavailable');
  const status: Snapshot['status'] = !states.length ? 'unavailable' : states.includes('stale') ? 'stale' : states.includes('eod') ? 'eod' : states.includes('delayed') ? 'delayed' : 'live';
  return { ...snapshot, stocks, status, message: status === 'stale' ? 'One or more quote observations are older than four calendar days. Prices remain dated; affected yields are withheld.' : snapshot.message };
}

async function bundled(): Promise<Snapshot> {
  const parsed: unknown = JSON.parse(await readFile(path.join(ROOT, 'public/data/bse-high-yield.json'), 'utf8'));
  if (!validSnapshot(parsed)) throw new Error('Invalid bundled snapshot');
  return parsed;
}

async function publicSnapshot(): Promise<Snapshot> {
  try {
    const response = await fetch(CANONICAL, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000), cache: 'no-store' });
    if (!response.ok) throw new Error('Canonical snapshot unavailable');
    const text = await response.text();
    if (text.length > 2_000_000) throw new Error('Snapshot size exceeded');
    const data: unknown = JSON.parse(text);
    if (!validSnapshot(data)) throw new Error('Canonical snapshot malformed');
    return data;
  } catch {
    const fallback = cached ?? await bundled();
    return { ...fallback, message: `${fallback.message} Canonical daily snapshot could not be loaded; using the dated last successful/bundled copy.` };
  }
}

async function providerSnapshot(): Promise<Snapshot> {
  const dir = await mkdtemp(path.join(tmpdir(), 'bse-snapshot-'));
  const output = path.join(dir, 'snapshot.json');
  const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const args = [path.join(ROOT, 'scripts/update_bse_data.py'), '--output', output, '--cache', path.join(tmpdir(), 'bseyield-actions-cache.json')];
  // One action sweep per day, even if it fails. Python also has a daily cache guard.
  if (actionsAttemptDay === day) args.push('--quotes-only');
  else actionsAttemptDay = day;
  try {
    await run('python3', args, { cwd: ROOT, timeout: 480_000, maxBuffer: 64_000, env: process.env });
    const parsed: unknown = JSON.parse(await readFile(output, 'utf8'));
    if (!validSnapshot(parsed)) throw new Error('Provider snapshot invalid');
    cachedIsProviderObservation = true;
    return parsed;
  } catch {
    // Never log child-process objects, provider payloads, authorization headers or tokens.
    console.warn('BSE provider refresh failed; using a dated snapshot. Check server token/data configuration.');
    const fallback = cached ?? await publicSnapshot();
    return { ...fallback, errors: [...(fallback.errors ?? []), 'Provider refresh failed; last successful snapshot preserved.'], message: `${fallback.message} Provider refresh failed; this is not a new successful quote observation.` };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function snapshot(refresh: boolean): Promise<Snapshot> {
  const now = Date.now();
  if (inFlight) return reclassify(await inFlight);
  // A force request can invalidate local TTL, never the minimum upstream budget.
  if (cached && ((!refresh && now - fetchedAt < TTL) || now - lastAttempt < TTL)) return reclassify(cached);
  lastAttempt = now;
  inFlight = (async () => {
    cachedIsProviderObservation = false;
    const permitted = process.env.BSE_PUBLIC_DATA_REDISTRIBUTION_CONFIRMED?.toLowerCase() === 'true';
    const data = process.env.UPSTOX_ANALYTICS_TOKEN?.trim() && permitted ? await providerSnapshot() : await publicSnapshot();
    cached = data;
    fetchedAt = Date.now();
    return data;
  })();
  try {
    return reclassify(await inFlight);
  } finally {
    inFlight = null;
  }
}

app.get('/api/bse/snapshot', async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');
  try {
    res.json(await snapshot(req.query.refresh === 'true'));
  } catch {
    console.warn('BSE snapshot unavailable: bundled data/configuration requires attention.');
    res.status(503).json({ schemaVersion: 1, generatedAt: null, market: 'BSE', currency: 'INR', provider: 'Upstox', status: 'unavailable', message: 'Snapshot unavailable. Check server data configuration.', stocks: [], errors: ['Snapshot could not be loaded.'], methodology: 'Missing data is null; no inferred or demonstration prices.' });
  }
});
app.get('/api/health', (_req, res) => res.json({ status: 'ok', market: 'BSE' }));

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(ROOT, 'dist')));
    app.get('*', (_req, res) => res.sendFile(path.join(ROOT, 'dist/index.html')));
  }
  app.listen(PORT, '0.0.0.0', () => console.log(`BSE dashboard listening on port ${PORT}`));
}
startServer().catch(() => { console.error('Server startup failed; check configuration.'); process.exitCode = 1; });
