/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type Sector =
  | 'S-REITs'
  | 'Banking & Finance'
  | 'Telecommunications'
  | 'Industrials'
  | 'Infrastructure & Utilities'
  | 'Consumer & Technology';

export type PayoutFrequency = 'Quarterly' | 'Semi-Annual' | 'Annual';

export type HealthRating = 'Safe' | 'Stable' | 'Monitor' | 'Caution';

export interface HistoricalPayout {
  year: number; // 2022 to 2026
  dps: number; // Dividend / Distribution per share in SGD
  yield: number; // Dividend yield in %
  payoutRatio: number; // %
  fcfPayoutRatio: number; // %
  gearing?: number; // for REITs %
  distributionBreakdown: {
    period: string; // e.g. '1H 2025', '2H 2025' or 'Q1', 'Q2'
    amount: number;
    paymentDate: string;
  }[];
}

export interface UpcomingDividend {
  declared: boolean;
  amount: number; // SGD per share
  currency: 'SGD';
  announcementDate: string;
  cumDate: string;
  exDate: string;
  recordDate: string;
  paymentDate: string;
  scripScheme: boolean;
  scripDiscountPercent?: number;
  status: 'Upcoming' | 'Pending Announcement' | 'Ex-Dividends Today' | 'Paid';
  distributionType: 'Ordinary Dividend' | 'Special Dividend' | 'Taxable Income DPU' | 'Tax-Exempt DPU' | 'Capital Return';
  periodLabel?: string; // e.g. 'Q3 2026', '2H 2026', 'Q4 2026 (Est)'
}

export interface DividendScheduleItem extends UpcomingDividend {
  ticker: string;
  name: string;
  sector: Sector;
  price: number;
  dayChange: number;
  dayChangePercent: number;
  yieldPercent: number;
  healthRating: HealthRating;
  dpsAnnual: number;
  payoutFrequency: PayoutFrequency;
  daysToExDate: number;
  daysToPayment: number;
  payoutYield: number;
  monthOffset: number; // 0 for Nov 2026, 1 for Dec 2026, 2 for Jan 2027, 3 for Feb 2027
  exMonthKey: string; // '2026-11'
  paymentMonthKey: string; // '2026-12'
}

export interface SGXStock {
  ticker: string; // e.g. 'D05'
  symbol: string; // e.g. 'SGX:D05'
  name: string;
  sector: Sector;
  price: number; // SGD
  dayChange: number; // SGD
  dayChangePercent: number; // %
  yieldPercent: number; // % (e.g. 6.12)
  dpsAnnual: number; // SGD
  payoutFrequency: PayoutFrequency;
  payoutRatio: number; // %
  fcfCoverage: number; // e.g. 1.42x
  gearing: number | null; // % (null if not a REIT)
  marketCapBillion: number; // SGD Billions
  peRatio: number;
  pbRatio: number;
  healthRating: HealthRating;
  healthScore: number; // 0 - 100
  fiveYearCAGR: number; // % annualized dividend growth
  volumeToday: number;
  fiftyTwoWeekHigh: number;
  fiftyTwoWeekLow: number;
  upcomingDividend: UpcomingDividend;
  upcomingSchedule?: UpcomingDividend[]; // Full 4-month upcoming schedule
  historicalPayouts: HistoricalPayout[];
  insights: {
    summary: string;
    catalysts: string[];
    risks: string[];
    sustainabilityVerdict: string;
    taxAdvantage: string;
  };
  analystConsensus: 'Strong Buy' | 'Buy' | 'Hold' | 'Underweight';
  targetPrice: number;
}

export interface MarketMetrics {
  stiLevel: number;
  stiChange: number;
  stiChangePercent: number;
  averageSgxYield: number;
  averageSreitYield: number;
  sgs10YearBondYield: number;
  yieldSpread: number;
  marketStatus: 'OPEN' | 'MID-DAY BREAK' | 'CLOSED' | 'PRE-OPEN';
  lastUpdated: string;
}

export interface AlertItem {
  id: string;
  ticker: string;
  stockName: string;
  title: string;
  message: string;
  date: string;
  type: 'ex_date' | 'payment' | 'yield_spike' | 'announcement';
  read: boolean;
  daysRemaining?: number;
}

export interface UserHolding {
  ticker: string;
  shares: number;
  averagePriceSGD: number;
}

export interface BiometricProfile {
  isConfigured: boolean;
  isLocked: boolean;
  credentialId?: string;
  pinFallback: string;
  useBiometrics: boolean;
  requireForExport: boolean;
  autoLockMinutes: number;
  lastActiveTimestamp: number;
}
