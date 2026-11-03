export interface BSEStock {
  ticker: string;
  bseCode: string;
  isin?: string;
  name: string;
  sector: string;
  price: number | null;
  previousClose: number | null;
  dayChange: number | null;
  dayChangePercent: number | null;
  currency: 'INR';
  dividendTTM: number | null;
  yieldPercent: number | null;
  dividends: Array<{ date: string; amount: number; currency: 'INR'; paymentDate?: string | null; kind?: string }>;
  quoteAsOf: string | null;
  source: string;
  dataStatus: 'live' | 'delayed' | 'eod' | 'unavailable' | 'stale';
  dividendStatus: 'available' | 'unavailable';
  volume?: number | null;
  marketCap?: number | null;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
}

export interface Snapshot {
  schemaVersion: 1;
  generatedAt: string | null;
  market: 'BSE';
  currency: 'INR';
  provider: string;
  status: 'live' | 'delayed' | 'eod' | 'unavailable' | 'stale';
  message: string;
  stocks: BSEStock[];
  errors?: string[];
  methodology: string;
}

export interface Holding {
  id: string;
  ticker: string;
  bseCode: string;
  name: string;
  shares: number;
  averageCost: number;
}
