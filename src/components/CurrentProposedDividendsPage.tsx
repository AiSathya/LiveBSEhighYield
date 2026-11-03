/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SGXStock } from '../types/sgx';
import {
  MONTH_TABS,
  getAllUpcomingScheduleItems,
} from '../data/dividendSchedules';
import {
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Download,
  Search,
  ArrowUpDown,
  Filter,
  CheckCircle,
  AlertCircle,
  Calculator,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Tag,
  Layers,
  Sparkles,
} from 'lucide-react';
import { downloadDividendCalendarICS, downloadScheduleEventsICS } from '../services/exportService';

interface CurrentProposedDividendsPageProps {
  stocks: SGXStock[];
  onSelectStock: (stock: SGXStock) => void;
  onRefreshLivePrices: () => void;
  isApiLoading: boolean;
  lastSyncedTime: string | null;
}

type MonthTabSelection = 'all' | 0 | 1 | 2 | 3;
type FilterDateMode = 'exDate' | 'paymentDate';

export const CurrentProposedDividendsPage: React.FC<CurrentProposedDividendsPageProps> = ({
  stocks,
  onSelectStock,
  onRefreshLivePrices,
  isApiLoading,
  lastSyncedTime,
}) => {
  // Sub-tabs: 'all' | 0 (Current Month: Nov 2026) | 1 (Month +1: Dec 2026) | 2 (Month +2: Jan 2027) | 3 (Month +3: Feb 2027)
  const [activeMonthTab, setActiveMonthTab] = useState<MonthTabSelection>(0);
  const [filterDateMode, setFilterDateMode] = useState<FilterDateMode>('exDate');

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'imminent' | 'high_yield' | 'reits' | 'banks'>('all');
  const [sortField, setSortField] = useState<'exDate' | 'yield' | 'amount' | 'price' | 'paymentDate'>('exDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  // Calculator State
  const [calcItem, setCalcItem] = useState<{
    ticker: string;
    name: string;
    price: number;
    amount: number;
    paymentDate: string;
    exDate: string;
    dpsAnnual: number;
    payoutFrequency: string;
    periodLabel?: string;
  } | null>(null);
  const [calcShares, setCalcShares] = useState<number>(5000);

  // Reference date (2026-11-02 simulated environment date)
  const referenceDateStr = '2026-11-02';

  // Extract all dividend schedule items across the 4 months
  const allScheduleItems = useMemo(() => {
    return getAllUpcomingScheduleItems(stocks, referenceDateStr);
  }, [stocks, referenceDateStr]);

  // Map month counts for badges
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = { 0: 0, 1: 0, 2: 0, 3: 0 };
    const monthKeys = ['2026-11', '2026-12', '2027-01', '2027-02'];

    allScheduleItems.forEach((item) => {
      const targetKey = filterDateMode === 'exDate' ? item.exMonthKey : item.paymentMonthKey;
      const idx = monthKeys.indexOf(targetKey);
      if (idx !== -1) {
        counts[idx] = (counts[idx] || 0) + 1;
      }
    });

    return counts;
  }, [allScheduleItems, filterDateMode]);

  // Filter items by Month Sub-tab
  const monthFilteredItems = useMemo(() => {
    if (activeMonthTab === 'all') return allScheduleItems;

    const targetMonthKey = MONTH_TABS[activeMonthTab]?.yearMonthKey;
    if (!targetMonthKey) return allScheduleItems;

    return allScheduleItems.filter((item) => {
      const compareKey = filterDateMode === 'exDate' ? item.exMonthKey : item.paymentMonthKey;
      return compareKey === targetMonthKey;
    });
  }, [allScheduleItems, activeMonthTab, filterDateMode]);

  // Apply Secondary Filters (Search, Sector, Imminent, High Yield)
  const secondaryFilteredItems = useMemo(() => {
    return monthFilteredItems.filter((s) => {
      const matchSearch =
        s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase());

      if (!matchSearch) return false;

      if (selectedFilter === 'imminent') return s.daysToExDate <= 14 && s.daysToExDate >= 0;
      if (selectedFilter === 'high_yield') return s.yieldPercent >= 6.0;
      if (selectedFilter === 'reits') return s.sector === 'S-REITs';
      if (selectedFilter === 'banks') return s.sector === 'Banking & Finance';
      return true;
    });
  }, [monthFilteredItems, searchTerm, selectedFilter]);

  // Sort
  const sortedItems = useMemo(() => {
    return [...secondaryFilteredItems].sort((a, b) => {
      if (sortField === 'exDate') {
        const timeA = new Date(a.exDate).getTime();
        const timeB = new Date(b.exDate).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortField === 'paymentDate') {
        const timeA = new Date(a.paymentDate).getTime();
        const timeB = new Date(b.paymentDate).getTime();
        return sortOrder === 'asc' ? timeA - timeB : timeB - timeA;
      }
      if (sortField === 'yield') {
        return sortOrder === 'desc' ? b.yieldPercent - a.yieldPercent : a.yieldPercent - b.yieldPercent;
      }
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      if (sortField === 'price') {
        return sortOrder === 'desc' ? b.price - a.price : a.price - b.price;
      }
      return 0;
    });
  }, [secondaryFilteredItems, sortField, sortOrder]);

  const toggleSort = (field: 'exDate' | 'yield' | 'amount' | 'price' | 'paymentDate') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder(field === 'yield' || field === 'amount' || field === 'price' ? 'desc' : 'asc');
    }
  };

  // Active Month Intelligence Aggregates
  const monthStats = useMemo(() => {
    const list = monthFilteredItems;
    const totalAnnouncements = list.length;
    const sumDPS = list.reduce((acc, curr) => acc + curr.amount, 0);
    const avgYield =
      totalAnnouncements > 0
        ? list.reduce((acc, curr) => acc + curr.yieldPercent, 0) / totalAnnouncements
        : 0;

    const earliestEx = list.length > 0 ? [...list].sort((a, b) => a.exDate.localeCompare(b.exDate))[0]?.exDate : null;
    const latestPay = list.length > 0 ? [...list].sort((a, b) => b.paymentDate.localeCompare(a.paymentDate))[0]?.paymentDate : null;

    return {
      totalAnnouncements,
      sumDPS,
      avgYield,
      earliestEx,
      latestPay,
    };
  }, [monthFilteredItems]);

  const currentTabInfo = activeMonthTab === 'all' ? null : MONTH_TABS[activeMonthTab];

  // Calendar Exports
  const handleExportMonthICS = () => {
    const title = currentTabInfo ? `SGX_Dividends_${currentTabInfo.shortBadge.replace(/[^a-zA-Z0-9]/g, '_')}.ics` : 'SGX_Dividends_Upcoming_Schedule.ics';
    downloadScheduleEventsICS(monthFilteredItems, title);
  };

  const handleExportSingleItemICS = (item: typeof sortedItems[0]) => {
    downloadScheduleEventsICS([item], `SGX_${item.ticker}_Dividend_${item.exDate}.ics`);
  };

  const handleStockClick = (ticker: string) => {
    const stock = stocks.find((s) => s.ticker === ticker);
    if (stock) onSelectStock(stock);
  };

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calendar className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
                  Current Share Prices & Proposed Dividends
                  <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800/80 font-mono">
                    SGX Live Feed
                  </span>
                </h1>
                <p className="text-xs text-slate-400">
                  Comprehensive 4-month upcoming schedule: live share prices, proposed DPS, ex-dividend dates, and cash payout timing
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Live API Sync Button */}
            <button
              onClick={onRefreshLivePrices}
              disabled={isApiLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-850 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${isApiLoading ? 'animate-spin' : ''}`} />
              <span>{isApiLoading ? 'Refreshing Live Prices...' : 'Refresh Live Prices'}</span>
            </button>

            {/* Sync All Calendar (.ics) */}
            <button
              onClick={() => downloadDividendCalendarICS(stocks)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
              title="Download iCal (.ics) file for upcoming dividends"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Full iCal (.ics)</span>
            </button>
          </div>
        </div>

        {/* 4-Month Sub-Tabs Header Navigation */}
        <div className="pt-4 pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-emerald-400" />
                Upcoming Dividend Schedule Sub-Tabs:
              </span>
            </div>

            {/* Date Perspective Switcher (Ex-Date vs Payment Date) */}
            <div className="flex items-center gap-2 bg-slate-950/70 border border-slate-800 rounded-lg p-1 text-xs">
              <span className="text-slate-500 px-2 text-[11px] font-sans">Filter Tabs by:</span>
              <button
                onClick={() => setFilterDateMode('exDate')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDateMode === 'exDate'
                    ? 'bg-slate-800 text-emerald-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Ex-Dividend Month (Buy By)
              </button>
              <button
                onClick={() => setFilterDateMode('paymentDate')}
                className={`px-2.5 py-1 rounded font-medium transition-colors ${
                  filterDateMode === 'paymentDate'
                    ? 'bg-slate-800 text-cyan-400 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Payment Month (Cash In)
              </button>
            </div>
          </div>

          {/* Sub-Tabs Selector Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
            {/* Tab 0: All Upcoming */}
            <button
              onClick={() => setActiveMonthTab('all')}
              className={`p-3 rounded-xl border text-left transition-all ${
                activeMonthTab === 'all'
                  ? 'bg-slate-850/90 border-emerald-500/80 shadow-lg shadow-emerald-950/30'
                  : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className={`text-xs font-bold ${activeMonthTab === 'all' ? 'text-emerald-400' : 'text-slate-300'}`}>
                  All Upcoming
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                  {allScheduleItems.length}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 mt-1 truncate">
                Full 4-Month Horizon
              </div>
            </button>

            {/* Sub-Tabs: Current Month, Month +1, Month +2, Month +3 */}
            {MONTH_TABS.map((tab) => {
              const isSelected = activeMonthTab === tab.offset;
              const count = monthCounts[tab.offset] || 0;

              return (
                <button
                  key={tab.offset}
                  onClick={() => setActiveMonthTab(tab.offset as MonthTabSelection)}
                  className={`p-3 rounded-xl border text-left transition-all relative overflow-hidden ${
                    isSelected
                      ? 'bg-slate-850/90 border-emerald-500 shadow-lg shadow-emerald-950/30'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {/* Subtle top indicator bar */}
                  {isSelected && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-500 to-cyan-400" />
                  )}

                  <div className="flex items-center justify-between gap-1">
                    <span
                      className={`text-xs font-bold truncate ${
                        isSelected ? 'text-emerald-400' : 'text-slate-200'
                      }`}
                    >
                      {tab.label}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isSelected
                          ? 'bg-emerald-500/20 text-emerald-300 font-bold'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {count}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1 font-mono">
                    <span>{tab.shortBadge}</span>
                    <span className="text-[10px] text-slate-500">
                      {filterDateMode === 'exDate' ? 'Ex-Date' : 'Pay Date'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Month Intelligence Strip */}
        <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-slate-900/90 via-slate-900/80 to-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-slate-100">
                {currentTabInfo ? currentTabInfo.fullLabel : 'All Upcoming SGX Dividends (Nov 2026 – Feb 2027)'}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/60 font-mono">
                {monthStats.totalAnnouncements} Announcements
              </span>
            </div>
            <p className="text-xs text-slate-400">
              {filterDateMode === 'exDate'
                ? 'Showing distributions with Ex-Dividend qualification dates in this period.'
                : 'Showing cash distribution payments being deposited into bank/CDP accounts in this period.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-slate-400 block font-sans">Combined DPS Sum</span>
              <span className="text-sm font-bold font-mono text-emerald-400">
                S${monthStats.sumDPS.toFixed(4)}
              </span>
            </div>

            <div className="bg-slate-950/80 border border-slate-800/80 px-3 py-1.5 rounded-lg text-right">
              <span className="text-[10px] text-slate-400 block font-sans">Average Yield</span>
              <span className="text-sm font-bold font-mono text-cyan-400">
                {monthStats.avgYield.toFixed(2)}%
              </span>
            </div>

            <button
              onClick={handleExportMonthICS}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Sync Month to iCal</span>
            </button>
          </div>
        </div>

        {/* Search, Secondary Filter Buttons & View Mode */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-4 border-t border-slate-800/80 mt-4">
          {/* Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 text-xs">
            <button
              onClick={() => setSelectedFilter('all')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === 'all'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              All in Tab ({monthFilteredItems.length})
            </button>
            <button
              onClick={() => setSelectedFilter('imminent')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === 'imminent'
                  ? 'bg-slate-800 text-amber-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Imminent &lt;14 Days
            </button>
            <button
              onClick={() => setSelectedFilter('high_yield')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === 'high_yield'
                  ? 'bg-slate-800 text-cyan-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              High Yield &gt;6%
            </button>
            <button
              onClick={() => setSelectedFilter('reits')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === 'reits'
                  ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              S-REITs
            </button>
            <button
              onClick={() => setSelectedFilter('banks')}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
                selectedFilter === 'banks'
                  ? 'bg-slate-800 text-sky-400 font-bold border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Banks & Finance
            </button>
          </div>

          {/* Search Box & View Mode Toggle */}
          <div className="flex items-center gap-2">
            <div className="relative w-full md:w-56">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search ticker / name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
              <button
                onClick={() => setViewMode('table')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  viewMode === 'table' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Table
              </button>
              <button
                onClick={() => setViewMode('cards')}
                className={`px-2.5 py-1 font-medium rounded-md transition-colors ${
                  viewMode === 'cards' ? 'bg-slate-800 text-slate-100 shadow-sm' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Cards
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* View Mode: High-Density Table */}
      {viewMode === 'table' ? (
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Detailed Upcoming Dividend Ledger</span>
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {sortedItems.length} Scheduled
              </span>
            </h2>
            <div className="flex items-center gap-3 text-xs text-slate-400">
              <span className="hidden sm:inline">Singapore Dollars (SGD)</span>
              <span>·</span>
              <span className="text-emerald-400 font-medium">0% Withholding Tax</span>
            </div>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium select-none">
                <tr>
                  <th className="py-3 px-3">Ticker & Company</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('price')}
                  >
                    Current Price (SGD) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('amount')}
                  >
                    Proposed DPS (SGD) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th className="py-3 px-3">Period / Event</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('exDate')}
                  >
                    Ex-Dividend Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th className="py-3 px-3 text-center">Record Date</th>
                  <th
                    className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('paymentDate')}
                  >
                    Payment Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('yield')}
                  >
                    Annual Yield (%) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th className="py-3 px-3 text-right">Period Yield</th>
                  <th className="py-3 px-3">Distribution Type</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedItems.map((item, idx) => {
                  const isVeryClose = item.daysToExDate <= 3 && item.daysToExDate >= 0;
                  const isPast = item.daysToExDate < 0;

                  return (
                    <tr
                      key={`${item.ticker}-${item.exDate}-${idx}`}
                      onClick={() => handleStockClick(item.ticker)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      {/* Ticker & Name */}
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{item.ticker}</span>
                          <span className="text-[11px] text-slate-400 font-sans truncate max-w-[150px]">
                            {item.name}
                          </span>
                        </div>
                      </td>

                      {/* Current Share Price & Change */}
                      <td className="py-3 px-3 text-right">
                        <div className="font-bold text-slate-100 text-sm">
                          S${item.price.toFixed(3)}
                        </div>
                        <div
                          className={`text-[10px] ${
                            item.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.dayChange >= 0 ? '+' : ''}
                          {item.dayChange.toFixed(3)} ({item.dayChangePercent >= 0 ? '+' : ''}
                          {item.dayChangePercent.toFixed(2)}%)
                        </div>
                      </td>

                      {/* Proposed Dividend Amount */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-emerald-400 text-sm">
                          S${item.amount.toFixed(4)}
                        </span>
                        <span className="block text-[10px] text-slate-400 font-sans">
                          per share
                        </span>
                      </td>

                      {/* Period Label */}
                      <td className="py-3 px-3 font-sans">
                        <span className="text-[11px] text-slate-300 font-medium block">
                          {item.periodLabel || 'Proposed Distribution'}
                        </span>
                        <span className="text-[10px] text-slate-500">{item.payoutFrequency}</span>
                      </td>

                      {/* Ex-Dividend Date & Countdown */}
                      <td className="py-3 px-3 text-center">
                        <div className="text-slate-200 font-medium">{item.exDate}</div>
                        <div className="mt-0.5">
                          {isPast ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-500 font-sans">
                              Ex-Date Passed
                            </span>
                          ) : isVeryClose ? (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-950 text-rose-300 border border-rose-800 font-sans font-bold animate-pulse">
                              {item.daysToExDate === 0 ? 'Today!' : `${item.daysToExDate}d left`}
                            </span>
                          ) : (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800/80 text-emerald-400 font-sans">
                              in {item.daysToExDate} days
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Record Date */}
                      <td className="py-3 px-3 text-center text-slate-400">
                        {item.recordDate}
                      </td>

                      {/* Payment Date */}
                      <td className="py-3 px-3 text-center font-bold text-emerald-400">
                        {item.paymentDate}
                      </td>

                      {/* Annual Yield */}
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-cyan-400 text-sm">
                          {item.yieldPercent.toFixed(2)}%
                        </span>
                      </td>

                      {/* Single Period Yield */}
                      <td className="py-3 px-3 text-right text-slate-300">
                        {item.payoutYield.toFixed(2)}%
                      </td>

                      {/* Type & Scrip Option */}
                      <td className="py-3 px-3 font-sans">
                        <div className="text-[11px] text-slate-300">{item.distributionType}</div>
                        {item.scripScheme && (
                          <span className="inline-block mt-0.5 text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                            Scrip Option ({item.scripDiscountPercent}% Disc)
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-3 text-center font-sans">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCalcItem(item);
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 hover:text-emerald-300 transition-colors"
                            title="Calculate Payout"
                          >
                            <Calculator className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExportSingleItemICS(item);
                            }}
                            className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 transition-colors"
                            title="Add this dividend to Calendar (.ics)"
                          >
                            <Calendar className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {sortedItems.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No dividend announcements found for the selected sub-tab and filter criteria.
            </div>
          )}
        </div>
      ) : (
        /* View Mode: Card Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sortedItems.map((item, idx) => {
            const isVeryClose = item.daysToExDate <= 3 && item.daysToExDate >= 0;

            return (
              <div
                key={`${item.ticker}-${item.exDate}-${idx}`}
                onClick={() => handleStockClick(item.ticker)}
                className="group bg-[#111827] border border-slate-800 hover:border-emerald-500/50 rounded-xl p-5 cursor-pointer transition-all shadow-md flex flex-col justify-between"
              >
                <div>
                  {/* Top Row: Ticker, Name, Sector */}
                  <div className="flex items-start justify-between gap-2 pb-3 border-b border-slate-800/80">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-slate-100 px-2 py-0.5 rounded bg-slate-800 group-hover:text-emerald-400 transition-colors">
                          {item.ticker}
                        </span>
                        <span className="text-xs text-slate-400 font-sans">{item.sector}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-100 mt-1 truncate max-w-[210px]">
                        {item.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block mt-0.5">
                        {item.periodLabel || 'Proposed Dividend'}
                      </span>
                    </div>

                    <div className="text-right font-mono">
                      <span className="text-sm font-bold text-slate-100">
                        S${item.price.toFixed(3)}
                      </span>
                      <span
                        className={`block text-[10px] ${
                          item.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                        }`}
                      >
                        {item.dayChange >= 0 ? '+' : ''}
                        {item.dayChange.toFixed(3)} ({item.dayChangePercent >= 0 ? '+' : ''}
                        {item.dayChangePercent.toFixed(2)}%)
                      </span>
                    </div>
                  </div>

                  {/* Proposed Amount & Yield Box */}
                  <div className="grid grid-cols-2 gap-2 my-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Proposed DPS
                      </span>
                      <span className="text-base font-bold font-mono text-emerald-400">
                        S${item.amount.toFixed(4)}
                      </span>
                      <span className="text-[10px] text-slate-500 block">per share</span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                        Annual Yield
                      </span>
                      <span className="text-base font-bold font-mono text-cyan-400">
                        {item.yieldPercent.toFixed(2)}%
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Period: {item.payoutYield.toFixed(2)}%
                      </span>
                    </div>
                  </div>

                  {/* Dates Schedule */}
                  <div className="space-y-1.5 text-xs font-mono">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-sans">Ex-Dividend Date:</span>
                      <span className="font-semibold text-slate-100">{item.exDate}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="text-slate-500 font-sans">Payment Date:</span>
                      <span className="font-semibold text-emerald-400">{item.paymentDate}</span>
                    </div>

                    <div className="flex items-center justify-between text-slate-400">
                      <span className="text-slate-500 font-sans">Distribution Type:</span>
                      <span className="text-[11px] font-sans truncate max-w-[140px]">
                        {item.distributionType}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Card Footer */}
                <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div>
                    {isVeryClose ? (
                      <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse">
                        {item.daysToExDate === 0 ? 'Ex-Div Today!' : `${item.daysToExDate}d left`}
                      </span>
                    ) : item.daysToExDate < 0 ? (
                      <span className="text-[11px] font-mono text-slate-500">Ex-Date Passed</span>
                    ) : (
                      <span className="text-[11px] font-mono text-slate-400">
                        Ex-Div in {item.daysToExDate} days
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setCalcItem(item);
                      }}
                      className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-sans font-medium transition-colors flex items-center gap-1"
                    >
                      <Calculator className="w-3 h-3" />
                      Calculate
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleExportSingleItemICS(item);
                      }}
                      className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Add to Calendar (.ics)"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Interactive Payout Calculator Modal */}
      {calcItem && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <button
              onClick={() => setCalcItem(null)}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-300 p-1 text-lg"
            >
              ×
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <Calculator className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-100">
                  Payout Calculator: {calcItem.ticker}
                </h3>
                <p className="text-xs text-slate-400">{calcItem.name}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Holding Units (Shares)
                </label>
                <input
                  type="number"
                  min="100"
                  step="100"
                  value={calcShares}
                  onChange={(e) => setCalcShares(Math.max(0, Number(e.target.value)))}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                />
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Current Share Price: S${calcItem.price.toFixed(3)} · Total Capital: S$
                  {(calcShares * calcItem.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 block">This Upcoming Payout</span>
                  <span className="text-xl font-bold font-mono text-emerald-400 mt-0.5 block">
                    S$
                    {(calcShares * calcItem.amount).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    Paid on {calcItem.paymentDate}
                  </span>
                </div>

                <div className="text-right">
                  <span className="text-xs text-slate-400 block">Projected Full Year</span>
                  <span className="text-xl font-bold font-mono text-cyan-400 mt-0.5 block">
                    S$
                    {(calcShares * calcItem.dpsAnnual).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {calcItem.payoutFrequency} Cadence
                  </span>
                </div>
              </div>

              <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-lg text-xs text-emerald-300/90 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                <span>
                  <strong>0% Singapore Tax:</strong> You receive 100% of S$
                  {(calcShares * calcItem.amount).toFixed(2)} with zero dividend withholding tax.
                </span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => {
                    handleExportSingleItemICS(calcItem as unknown as typeof sortedItems[0]);
                    setCalcItem(null);
                  }}
                  className="flex-1 py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors flex items-center justify-center gap-1.5"
                >
                  <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                  Add to Calendar
                </button>
                <button
                  onClick={() => setCalcItem(null)}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
