/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SGXStock, UpcomingDividend, DividendScheduleItem } from '../types/sgx';

/**
 * 4-Month Multi-Cadence Dividend Schedule for SGX Universe
 * Reference Date Context: 2026-11-02
 * Month 0: November 2026 (Current Month)
 * Month +1: December 2026 (Current Month + 1)
 * Month +2: January 2027 (Next 2 Month)
 * Month +3: February 2027 (Current Month + 3rd)
 */
export const SGX_UPCOMING_SCHEDULE: Record<string, UpcomingDividend[]> = {
  // 1. Keppel Pacific Oak US REIT (CWBU)
  CWBU: [
    {
      declared: true,
      amount: 0.0064,
      currency: 'SGD',
      announcementDate: '2026-10-24',
      cumDate: '2026-11-06',
      exDate: '2026-11-09',
      recordDate: '2026-11-10',
      paymentDate: '2026-11-28',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: '2H 2026 Distribution',
    },
    {
      declared: true,
      amount: 0.0062,
      currency: 'SGD',
      announcementDate: '2026-12-18',
      cumDate: '2027-01-07',
      exDate: '2027-01-08',
      recordDate: '2027-01-11',
      paymentDate: '2027-02-04',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q4 2026 Advance Payout',
    },
  ],

  // 2. Mapletree Pan Asia Commercial Trust (N2IU)
  N2IU: [
    {
      declared: true,
      amount: 0.0205,
      currency: 'SGD',
      announcementDate: '2026-10-25',
      cumDate: '2026-11-03',
      exDate: '2026-11-04',
      recordDate: '2026-11-05',
      paymentDate: '2026-12-04',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q2 FY26/27 Interim',
    },
    {
      declared: true,
      amount: 0.0210,
      currency: 'SGD',
      announcementDate: '2027-01-20',
      cumDate: '2027-02-04',
      exDate: '2027-02-05',
      recordDate: '2027-02-08',
      paymentDate: '2027-03-16',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q3 FY26/27 Distribution',
    },
  ],

  // 3. Mapletree Logistics Trust (M44U)
  M44U: [
    {
      declared: true,
      amount: 0.0190,
      currency: 'SGD',
      announcementDate: '2026-10-22',
      cumDate: '2026-10-31',
      exDate: '2026-11-03',
      recordDate: '2026-11-04',
      paymentDate: '2026-12-12',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q2 FY26/27 Distribution',
    },
    {
      declared: true,
      amount: 0.0202,
      currency: 'SGD',
      announcementDate: '2027-01-18',
      cumDate: '2027-02-02',
      exDate: '2027-02-03',
      recordDate: '2027-02-04',
      paymentDate: '2027-03-12',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q3 FY26/27 Distribution',
    },
  ],

  // 4. Mapletree Industrial Trust (ME8U)
  ME8U: [
    {
      declared: true,
      amount: 0.0295,
      currency: 'SGD',
      announcementDate: '2026-10-24',
      cumDate: '2026-11-05',
      exDate: '2026-11-06',
      recordDate: '2026-11-09',
      paymentDate: '2026-12-08',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: 'Q2 FY26/27 DPU',
    },
    {
      declared: true,
      amount: 0.0305,
      currency: 'SGD',
      announcementDate: '2027-01-22',
      cumDate: '2027-02-08',
      exDate: '2027-02-09',
      recordDate: '2027-02-10',
      paymentDate: '2027-03-10',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: 'Q3 FY26/27 DPU',
    },
  ],

  // 5. CapitaLand Ascendas REIT (A17U)
  A17U: [
    {
      declared: true,
      amount: 0.0735,
      currency: 'SGD',
      announcementDate: '2026-10-23',
      cumDate: '2026-11-04',
      exDate: '2026-11-05',
      recordDate: '2026-11-06',
      paymentDate: '2026-12-02',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: '1H 2026 Distribution',
    },
    {
      declared: true,
      amount: 0.0760,
      currency: 'SGD',
      announcementDate: '2027-01-26',
      cumDate: '2027-02-11',
      exDate: '2027-02-12',
      recordDate: '2027-02-15',
      paymentDate: '2027-03-18',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: '2H 2026 Distribution',
    },
  ],

  // 6. StarHub Ltd (CC3)
  CC3: [
    {
      declared: true,
      amount: 0.0350,
      currency: 'SGD',
      announcementDate: '2026-11-12',
      cumDate: '2026-12-03',
      exDate: '2026-12-04',
      recordDate: '2026-12-07',
      paymentDate: '2026-12-22',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend 2',
    },
    {
      declared: true,
      amount: 0.0320,
      currency: 'SGD',
      announcementDate: '2027-01-10',
      cumDate: '2027-01-26',
      exDate: '2027-01-27',
      recordDate: '2027-01-28',
      paymentDate: '2027-02-25',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Special Dividend',
      periodLabel: '5G Transformation Special',
    },
  ],

  // 7. Suntec REIT (T82U)
  T82U: [
    {
      declared: true,
      amount: 0.0215,
      currency: 'SGD',
      announcementDate: '2026-10-23',
      cumDate: '2026-11-04',
      exDate: '2026-11-05',
      recordDate: '2026-11-06',
      paymentDate: '2026-11-27',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q3 2026 DPU',
    },
    {
      declared: true,
      amount: 0.0210,
      currency: 'SGD',
      announcementDate: '2026-12-28',
      cumDate: '2027-01-13',
      exDate: '2027-01-14',
      recordDate: '2027-01-15',
      paymentDate: '2027-02-18',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q4 2026 Advance DPU',
    },
  ],

  // 8. Oversea-Chinese Banking Corp (O39)
  O39: [
    {
      declared: true,
      amount: 0.8800,
      currency: 'SGD',
      announcementDate: '2026-11-05',
      cumDate: '2026-12-02',
      exDate: '2026-12-03',
      recordDate: '2026-12-04',
      paymentDate: '2026-12-18',
      scripScheme: true,
      scripDiscountPercent: 2.0,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend (Scrip 2% Disc)',
    },
    {
      declared: true,
      amount: 0.9200,
      currency: 'SGD',
      announcementDate: '2027-02-02',
      cumDate: '2027-02-17',
      exDate: '2027-02-18',
      recordDate: '2027-02-19',
      paymentDate: '2027-03-09',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'FY2026 Final Proposed',
    },
  ],

  // 9. NetLink NBN Trust (CJLU)
  CJLU: [
    {
      declared: true,
      amount: 0.0270,
      currency: 'SGD',
      announcementDate: '2026-10-27',
      cumDate: '2026-11-12',
      exDate: '2026-11-13',
      recordDate: '2026-11-14',
      paymentDate: '2026-11-29',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: '1H FY26/27 DPU',
    },
    {
      declared: true,
      amount: 0.0268,
      currency: 'SGD',
      announcementDate: '2027-01-05',
      cumDate: '2027-01-15',
      exDate: '2027-01-18',
      recordDate: '2027-01-19',
      paymentDate: '2027-02-24',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Special Fiber Capital Return',
    },
  ],

  // 10. United Overseas Bank (U11)
  U11: [
    {
      declared: true,
      amount: 1.2000,
      currency: 'SGD',
      announcementDate: '2026-10-28',
      cumDate: '2026-11-13',
      exDate: '2026-11-16',
      recordDate: '2026-11-17',
      paymentDate: '2026-12-01',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend',
    },
    {
      declared: true,
      amount: 1.2500,
      currency: 'SGD',
      announcementDate: '2027-01-30',
      cumDate: '2027-02-15',
      exDate: '2027-02-16',
      recordDate: '2027-02-17',
      paymentDate: '2027-03-05',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'FY2026 Final Dividend',
    },
  ],

  // 11. Frasers Centrepoint Trust (J69U)
  J69U: [
    {
      declared: true,
      amount: 0.0610,
      currency: 'SGD',
      announcementDate: '2026-10-24',
      cumDate: '2026-11-05',
      exDate: '2026-11-06',
      recordDate: '2026-11-09',
      paymentDate: '2026-11-28',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: '2H FY26 DPU',
    },
    {
      declared: true,
      amount: 0.0620,
      currency: 'SGD',
      announcementDate: '2027-01-28',
      cumDate: '2027-02-18',
      exDate: '2027-02-19',
      recordDate: '2027-02-22',
      paymentDate: '2027-03-23',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: 'Q1 FY27 Advance',
    },
  ],

  // 12. CapitaLand Integrated Commercial Trust (C38U)
  C38U: [
    {
      declared: true,
      amount: 0.0640,
      currency: 'SGD',
      announcementDate: '2026-10-24',
      cumDate: '2026-11-09',
      exDate: '2026-11-10',
      recordDate: '2026-11-11',
      paymentDate: '2026-11-30',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: '1H 2026 Advance DPU',
    },
    {
      declared: true,
      amount: 0.0652,
      currency: 'SGD',
      announcementDate: '2027-01-21',
      cumDate: '2027-02-05',
      exDate: '2027-02-08',
      recordDate: '2027-02-09',
      paymentDate: '2027-03-15',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Taxable Income DPU',
      periodLabel: '2H 2026 Distribution',
    },
  ],

  // 13. Venture Corporation (V03)
  V03: [
    {
      declared: true,
      amount: 0.5300,
      currency: 'SGD',
      announcementDate: '2026-10-29',
      cumDate: '2026-11-12',
      exDate: '2026-11-13',
      recordDate: '2026-11-14',
      paymentDate: '2026-12-04',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend',
    },
    {
      declared: true,
      amount: 0.6500,
      currency: 'SGD',
      announcementDate: '2027-02-01',
      cumDate: '2027-02-19',
      exDate: '2027-02-22',
      recordDate: '2027-02-23',
      paymentDate: '2027-03-26',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'FY2026 Final Dividend',
    },
  ],

  // 14. Singtel (Z74)
  Z74: [
    {
      declared: true,
      amount: 0.1150,
      currency: 'SGD',
      announcementDate: '2026-11-14',
      cumDate: '2026-12-07',
      exDate: '2026-12-08',
      recordDate: '2026-12-09',
      paymentDate: '2026-12-23',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim + Value Realisation',
    },
    {
      declared: true,
      amount: 0.0950,
      currency: 'SGD',
      announcementDate: '2027-02-05',
      cumDate: '2027-02-23',
      exDate: '2027-02-24',
      recordDate: '2027-02-25',
      paymentDate: '2027-03-25',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Special Dividend',
      periodLabel: 'Asset Realisation Special Tranche',
    },
  ],

  // 15. Keppel Ltd (BN4)
  BN4: [
    {
      declared: true,
      amount: 0.3200,
      currency: 'SGD',
      announcementDate: '2026-11-18',
      cumDate: '2026-12-09',
      exDate: '2026-12-10',
      recordDate: '2026-12-11',
      paymentDate: '2026-12-29',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend',
    },
    {
      declared: true,
      amount: 0.3400,
      currency: 'SGD',
      announcementDate: '2027-02-06',
      cumDate: '2027-02-25',
      exDate: '2027-02-26',
      recordDate: '2027-02-27',
      paymentDate: '2027-04-15',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'FY2026 Final Proposed',
    },
  ],

  // 16. DBS Group Holdings (D05)
  D05: [
    {
      declared: true,
      amount: 0.8100,
      currency: 'SGD',
      announcementDate: '2026-10-27',
      cumDate: '2026-11-10',
      exDate: '2026-11-11',
      recordDate: '2026-11-12',
      paymentDate: '2026-11-26',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Q3 2026 Interim Dividend',
    },
    {
      declared: true,
      amount: 0.9600, // 0.81 regular + 0.15 special capital return
      currency: 'SGD',
      announcementDate: '2027-01-28',
      cumDate: '2027-02-09',
      exDate: '2027-02-10',
      recordDate: '2027-02-11',
      paymentDate: '2027-02-26',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Special Dividend',
      periodLabel: 'Q4 2026 + Capital Return Special',
    },
  ],

  // 17. Sheng Siong Group (OV8)
  OV8: [
    {
      declared: true,
      amount: 0.0510,
      currency: 'SGD',
      announcementDate: '2026-11-19',
      cumDate: '2026-12-10',
      exDate: '2026-12-11',
      recordDate: '2026-12-14',
      paymentDate: '2026-12-30',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Interim Dividend',
    },
    {
      declared: true,
      amount: 0.0530,
      currency: 'SGD',
      announcementDate: '2027-02-04',
      cumDate: '2027-02-24',
      exDate: '2027-02-25',
      recordDate: '2027-02-26',
      paymentDate: '2027-03-24',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'FY2026 Final Dividend',
    },
  ],

  // 18. Parkway Life REIT (C2PU)
  C2PU: [
    {
      declared: true,
      amount: 0.0780,
      currency: 'SGD',
      announcementDate: '2026-11-20',
      cumDate: '2026-12-14',
      exDate: '2026-12-15',
      recordDate: '2026-12-16',
      paymentDate: '2027-01-08',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Tax-Exempt DPU',
      periodLabel: '2H 2026 Distribution',
    },
    {
      declared: true,
      amount: 0.0785,
      currency: 'SGD',
      announcementDate: '2027-01-08',
      cumDate: '2027-01-21',
      exDate: '2027-01-22',
      recordDate: '2027-01-25',
      paymentDate: '2027-02-26',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Capital Return',
      periodLabel: 'Nursing Home Capital Repayment',
    },
  ],

  // 19. Singapore Technologies Engineering (S63)
  S63: [
    {
      declared: true,
      amount: 0.0950,
      currency: 'SGD',
      announcementDate: '2026-11-21',
      cumDate: '2026-12-15',
      exDate: '2026-12-16',
      recordDate: '2026-12-17',
      paymentDate: '2027-01-06',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Q3 2026 Interim Dividend',
    },
    {
      declared: true,
      amount: 0.0950,
      currency: 'SGD',
      announcementDate: '2027-02-06',
      cumDate: '2027-02-22',
      exDate: '2027-02-23',
      recordDate: '2027-02-24',
      paymentDate: '2027-03-20',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Q4 2026 Final Dividend',
    },
  ],

  // 20. Singapore Exchange Ltd (S68)
  S68: [
    {
      declared: true,
      amount: 0.1850,
      currency: 'SGD',
      announcementDate: '2026-11-23',
      cumDate: '2026-12-17',
      exDate: '2026-12-18',
      recordDate: '2026-12-21',
      paymentDate: '2027-01-12',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Q1 FY26/27 Interim',
    },
    {
      declared: true,
      amount: 0.1850,
      currency: 'SGD',
      announcementDate: '2027-02-09',
      cumDate: '2027-02-24',
      exDate: '2027-02-25',
      recordDate: '2027-02-26',
      paymentDate: '2027-03-24',
      scripScheme: false,
      status: 'Upcoming',
      distributionType: 'Ordinary Dividend',
      periodLabel: 'Q2 FY26/27 Interim',
    },
  ],
};

export interface MonthTabMeta {
  offset: number; // 0, 1, 2, 3
  label: string; // e.g. "Current Month", "Month +1", "Next 2 Month", "Month +3"
  fullLabel: string; // e.g. "Current Month: November 2026"
  monthName: string; // "November 2026"
  shortBadge: string; // "Nov '26"
  yearMonthKey: string; // "2026-11"
}

export const MONTH_TABS: MonthTabMeta[] = [
  {
    offset: 0,
    label: 'Current Month',
    fullLabel: 'Current Month: November 2026',
    monthName: 'November 2026',
    shortBadge: "Nov '26",
    yearMonthKey: '2026-11',
  },
  {
    offset: 1,
    label: 'Current Month + 1',
    fullLabel: 'Next Month: December 2026 (Month +1)',
    monthName: 'December 2026',
    shortBadge: "Dec '26",
    yearMonthKey: '2026-12',
  },
  {
    offset: 2,
    label: 'Next 2 Month',
    fullLabel: 'Upcoming: January 2027 (Month +2)',
    monthName: 'January 2027',
    shortBadge: "Jan '27",
    yearMonthKey: '2027-01',
  },
  {
    offset: 3,
    label: 'Current Month + 3rd',
    fullLabel: 'Blockbuster Payouts: February 2027 (Month +3)',
    monthName: 'February 2027',
    shortBadge: "Feb '27",
    yearMonthKey: '2027-02',
  },
];

/**
 * Extracts and normalizes all upcoming dividend events from the stocks and the schedule
 */
export function getAllUpcomingScheduleItems(
  stocks: SGXStock[],
  refDateStr = '2026-11-02'
): DividendScheduleItem[] {
  const refDate = new Date(`${refDateStr}T00:00:00`);
  const stockMap = new Map<string, SGXStock>();
  stocks.forEach((s) => stockMap.set(s.ticker, s));

  const items: DividendScheduleItem[] = [];

  stocks.forEach((stock) => {
    const schedules = SGX_UPCOMING_SCHEDULE[stock.ticker] || [stock.upcomingDividend];

    schedules.forEach((up) => {
      const exDateObj = new Date(`${up.exDate}T00:00:00`);
      const payDateObj = new Date(`${up.paymentDate}T00:00:00`);

      const daysToEx = Math.ceil((exDateObj.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));
      const daysToPay = Math.ceil((payDateObj.getTime() - refDate.getTime()) / (1000 * 60 * 60 * 24));

      const exYear = exDateObj.getFullYear();
      const exMonth = String(exDateObj.getMonth() + 1).padStart(2, '0');
      const exMonthKey = `${exYear}-${exMonth}`;

      const payYear = payDateObj.getFullYear();
      const payMonth = String(payDateObj.getMonth() + 1).padStart(2, '0');
      const paymentMonthKey = `${payYear}-${payMonth}`;

      // Calculate month offset relative to 2026-11
      const startYear = 2026;
      const startMonth = 11;
      const monthOffset = (exYear - startYear) * 12 + (exDateObj.getMonth() + 1 - startMonth);

      const periodYield = stock.price > 0 ? (up.amount / stock.price) * 100 : 0;

      items.push({
        ...up,
        ticker: stock.ticker,
        name: stock.name,
        sector: stock.sector,
        price: stock.price,
        dayChange: stock.dayChange,
        dayChangePercent: stock.dayChangePercent,
        yieldPercent: stock.yieldPercent,
        healthRating: stock.healthRating,
        dpsAnnual: stock.dpsAnnual,
        payoutFrequency: stock.payoutFrequency,
        daysToExDate: daysToEx,
        daysToPayment: daysToPay,
        payoutYield: periodYield,
        monthOffset,
        exMonthKey,
        paymentMonthKey,
      });
    });
  });

  return items;
}
