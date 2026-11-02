/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// In-memory cache to avoid rate limits while giving real-time data
let cachedQuotes: Record<string, any> = {};
let lastFetchTime = 0;
const CACHE_TTL_MS = 10000; // 10 seconds cache

const SGX_SYMBOLS_MAP: Record<string, string> = {
  'D05': 'D05.SI',
  'O39': 'O39.SI',
  'U11': 'U11.SI',
  'C38U': 'C38U.SI',
  'N2IU': 'N2IU.SI',
  'M44U': 'M44U.SI',
  'ME8U': 'ME8U.SI',
  'T82U': 'T82U.SI',
  'A17U': 'A17U.SI',
  'J69U': 'J69U.SI',
  'CJLU': 'CJLU.SI',
  'S63': 'S63.SI',
  'BN4': 'BN4.SI',
  'S68': 'S68.SI',
  'OV8': 'OV8.SI',
  'V03': 'V03.SI',
  'CWBU': 'CMOU.SI', // Keppel Pacific Oak US REIT ticker on SGX
  'CC3': 'CC3.SI',
  'C2PU': 'C2PU.SI',
  'Z74': 'Z74.SI',
  '^STI': '^STI',
};

async function fetchYahooQuote(symbol: string) {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json',
      },
    });
    if (!res.ok) return null;
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;
    if (!meta) return null;

    const price = meta.regularMarketPrice;
    const prevClose = meta.chartPreviousClose || meta.previousClose || price;
    const dayChange = Number((price - prevClose).toFixed(3));
    const dayChangePercent = prevClose ? Number(((dayChange / prevClose) * 100).toFixed(2)) : 0;

    return {
      symbol,
      price,
      prevClose,
      dayChange,
      dayChangePercent,
      currency: meta.currency || 'SGD',
      fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh || price,
      fiftyTwoWeekLow: meta.fiftyTwoWeekLow || price,
      regularMarketTime: meta.regularMarketTime,
      exchangeTimezoneName: meta.exchangeTimezoneName,
      source: 'SGX via Yahoo Finance API',
    };
  } catch (err) {
    console.warn(`Failed to fetch quote for ${symbol}:`, err);
    return null;
  }
}

// API Route: Live prices for all SGX stocks & STI
app.get('/api/sgx/live-prices', async (req: Request, res: Response) => {
  const now = Date.now();
  const forceRefresh = req.query.force === 'true';

  if (!forceRefresh && now - lastFetchTime < CACHE_TTL_MS && Object.keys(cachedQuotes).length > 0) {
    res.json({
      success: true,
      cached: true,
      timestamp: new Date(lastFetchTime).toISOString(),
      data: cachedQuotes,
    });
    return;
  }

  try {
    const entries = Object.entries(SGX_SYMBOLS_MAP);
    // Fetch in parallel chunks
    const promises = entries.map(async ([ticker, sym]) => {
      const quote = await fetchYahooQuote(sym);
      return { ticker, quote };
    });

    const results = await Promise.all(promises);
    const quotesObj: Record<string, any> = {};

    results.forEach(({ ticker, quote }) => {
      if (quote) {
        quotesObj[ticker] = quote;
      }
    });

    if (Object.keys(quotesObj).length > 0) {
      cachedQuotes = { ...cachedQuotes, ...quotesObj };
      lastFetchTime = now;
    }

    res.json({
      success: true,
      cached: false,
      timestamp: new Date().toISOString(),
      data: cachedQuotes,
    });
  } catch (error: any) {
    console.error('Error fetching live SGX prices:', error);
    res.status(500).json({
      success: false,
      error: error?.message || 'Failed to fetch live SGX quotes',
      data: cachedQuotes,
    });
  }
});

// API Route: Single ticker live quote
app.get('/api/sgx/quote/:ticker', async (req: Request, res: Response) => {
  const ticker = req.params.ticker.toUpperCase();
  const symbol = SGX_SYMBOLS_MAP[ticker] || (ticker.includes('.') ? ticker : `${ticker}.SI`);

  const quote = await fetchYahooQuote(symbol);
  if (quote) {
    res.json({ success: true, ticker, data: quote });
  } else {
    res.status(404).json({ success: false, error: `Quote not found for ${ticker}` });
  }
});

// Mount Vite middleware for SPA
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile('dist/index.html', { root: '.' });
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
