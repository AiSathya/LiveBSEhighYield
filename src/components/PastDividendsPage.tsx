/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { SGXStock } from '../types/sgx';
import { Search, Download, History, Calendar, ArrowUpDown, ChevronDown, ChevronUp, Filter, TrendingUp, DollarSign } from 'lucide-react';

interface PastDividendsPageProps {
  stocks: SGXStock[];
  onSelectStock: (stock: SGXStock) => void;
}

interface FlattenedPayoutEvent {
  id: string;
  ticker: string;
  stockName: string;
  sector: string;
  year: number;
  period: string;
  amount: number;
  paymentDate: string;
  stockPrice: number;
  yieldPercent: number;
  distributionType: string;
  stock: SGXStock;
}

export const PastDividendsPage: React.FC<PastDividendsPageProps> = ({ stocks, onSelectStock }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('All');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [activeTab, setActiveTab] = useState<'ledger' | 'matrix'>('ledger');
  const [sortField, setSortField] = useState<'paymentDate' | 'amount' | 'ticker' | 'year'>('paymentDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Flatten all historical payout events across all stocks
  const allPayoutEvents: FlattenedPayoutEvent[] = useMemo(() => {
    const list: FlattenedPayoutEvent[] = [];
    stocks.forEach((stock) => {
      stock.historicalPayouts.forEach((hp) => {
        hp.distributionBreakdown.forEach((dist, idx) => {
          list.push({
            id: `${stock.ticker}-${hp.year}-${idx}-${dist.period}`,
            ticker: stock.ticker,
            stockName: stock.name,
            sector: stock.sector,
            year: hp.year,
            period: dist.period,
            amount: dist.amount,
            paymentDate: dist.paymentDate,
            stockPrice: stock.price,
            yieldPercent: hp.yield,
            distributionType: stock.sector === 'S-REITs' ? 'Tax-Exempt DPU' : 'Ordinary Dividend',
            stock: stock,
          });
        });
      });
    });
    return list;
  }, [stocks]);

  // Filter events
  const filteredEvents = useMemo(() => {
    return allPayoutEvents.filter((item) => {
      const matchSearch =
        item.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.stockName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchYear = selectedYear === 'All' || item.year.toString() === selectedYear;
      const matchSector = selectedSector === 'All' || item.sector === selectedSector;
      return matchSearch && matchYear && matchSector;
    });
  }, [allPayoutEvents, searchTerm, selectedYear, selectedSector]);

  // Sort events
  const sortedEvents = useMemo(() => {
    return [...filteredEvents].sort((a, b) => {
      if (sortField === 'paymentDate') {
        const timeA = new Date(a.paymentDate).getTime();
        const timeB = new Date(b.paymentDate).getTime();
        return sortOrder === 'desc' ? timeB - timeA : timeA - timeB;
      }
      if (sortField === 'amount') {
        return sortOrder === 'desc' ? b.amount - a.amount : a.amount - b.amount;
      }
      if (sortField === 'ticker') {
        return sortOrder === 'desc'
          ? b.ticker.localeCompare(a.ticker)
          : a.ticker.localeCompare(b.ticker);
      }
      if (sortField === 'year') {
        return sortOrder === 'desc' ? b.year - a.year : a.year - b.year;
      }
      return 0;
    });
  }, [filteredEvents, sortField, sortOrder]);

  const toggleSort = (field: 'paymentDate' | 'amount' | 'ticker' | 'year') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const exportPastDividendsCSV = () => {
    const headers = ['Ticker', 'Company Name', 'Sector', 'Period', 'DPS (SGD)', 'Payment Date', 'Year', 'Yield (%)'];
    const rows = sortedEvents.map((e) => [
      `"${e.ticker}"`,
      `"${e.stockName.replace(/"/g, '""')}"`,
      `"${e.sector}"`,
      `"${e.period}"`,
      e.amount.toFixed(4),
      `"${e.paymentDate}"`,
      e.year,
      e.yieldPercent.toFixed(2),
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `SGX_Past_Dividends_${selectedYear}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Metrics summary
  const totalPayoutEvents = sortedEvents.length;
  const totalDpsSum = sortedEvents.reduce((acc, curr) => acc + curr.amount, 0);
  const avgDps = totalPayoutEvents > 0 ? totalDpsSum / totalPayoutEvents : 0;

  return (
    <div className="space-y-6">
      {/* Top Header Card */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                <History className="w-4 h-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-100">
                  Past Dividends & Historical Distributions Ledger
                </h1>
                <p className="text-xs text-slate-400">
                  Detailed record of historical dividend payments, distribution per share (DPS), and multi-year payout progression across 2022–2026
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportPastDividendsCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <Download className="w-3.5 h-3.5 text-emerald-400" />
              <span>Export Ledger (.csv)</span>
            </button>
          </div>
        </div>

        {/* Quick KPI Counters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <span className="text-xs text-slate-400">Recorded Payout Events</span>
            <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
              {totalPayoutEvents} Distributions
            </p>
            <span className="text-[10px] text-slate-500">Across 20 SGX issuers</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <span className="text-xs text-slate-400">Average Payout (DPS)</span>
            <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
              S${avgDps.toFixed(4)}
            </p>
            <span className="text-[10px] text-slate-500">Per share per period</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <span className="text-xs text-slate-400">Coverage Horizon</span>
            <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
              5 Fiscal Years
            </p>
            <span className="text-[10px] text-slate-500">2022 to 2026 Periods</span>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
            <span className="text-xs text-slate-400">Individual Tax Withheld</span>
            <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">
              0.00% (SGD S$)
            </p>
            <span className="text-[10px] text-emerald-300/80">100% Tax-Exempt at Source</span>
          </div>
        </div>

        {/* View Tabs & Search Filters */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-2">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setActiveTab('ledger')}
              className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'ledger'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Itemized Payout Ledger ({sortedEvents.length})
            </button>
            <button
              onClick={() => setActiveTab('matrix')}
              className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'matrix'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5-Year Annual Progression Matrix
            </button>
          </div>

          {/* Search Box */}
          <div className="relative w-full md:w-64">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter ticker / company..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-3 pt-3 mt-3 border-t border-slate-800/80 text-xs">
          {/* Year Pills */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-slate-500 text-[11px] mr-1">Year:</span>
            {['All', '2026', '2025', '2024', '2023', '2022'].map((yr) => (
              <button
                key={yr}
                onClick={() => setSelectedYear(yr)}
                className={`px-2.5 py-1 rounded-md text-xs font-mono transition-colors ${
                  selectedYear === yr
                    ? 'bg-slate-800 text-emerald-400 font-bold border border-slate-700'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {yr}
              </button>
            ))}
          </div>

          {/* Sector Pills */}
          <div className="flex items-center gap-1 overflow-x-auto ml-auto pb-1 sm:pb-0">
            <span className="text-slate-500 text-[11px] mr-1">Sector:</span>
            {['All', 'S-REITs', 'Banking & Finance', 'Telecommunications', 'Industrials', 'Consumer & Technology'].map(
              (sec) => (
                <button
                  key={sec}
                  onClick={() => setSelectedSector(sec)}
                  className={`px-2.5 py-1 rounded-md text-xs transition-colors whitespace-nowrap ${
                    selectedSector === sec
                      ? 'bg-slate-800 text-emerald-400 font-medium border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {sec}
                </button>
              )
            )}
          </div>
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'ledger' ? (
        /* 1. Itemized Payout Ledger Table */
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              Historical Dividend Payment Events
              <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
                {sortedEvents.length} items
              </span>
            </h2>
            <span className="text-xs text-slate-500">
              Sorted by {sortField === 'paymentDate' ? 'Payment Date' : sortField} ({sortOrder.toUpperCase()})
            </span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium select-none">
                <tr>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('paymentDate')}
                  >
                    Payment Date <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th
                    className="py-3 px-3 cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('ticker')}
                  >
                    Ticker & Company <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th className="py-3 px-3">Sector</th>
                  <th className="py-3 px-3">Period</th>
                  <th
                    className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                    onClick={() => toggleSort('amount')}
                  >
                    DPS Amount (SGD) <ArrowUpDown className="w-3 h-3 inline ml-1" />
                  </th>
                  <th className="py-3 px-3">Distribution Type</th>
                  <th className="py-3 px-3 text-right">Annual Yield (%)</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {sortedEvents.map((item) => (
                  <tr
                    key={item.id}
                    onClick={() => onSelectStock(item.stock)}
                    className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                  >
                    {/* Payment Date */}
                    <td className="py-3 px-3 font-semibold text-slate-200">
                      {item.paymentDate}
                    </td>

                    {/* Ticker & Name */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-100">{item.ticker}</span>
                        <span className="text-[11px] text-slate-400 font-sans truncate max-w-[180px]">
                          {item.stockName}
                        </span>
                      </div>
                    </td>

                    {/* Sector */}
                    <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                      {item.sector}
                    </td>

                    {/* Period */}
                    <td className="py-3 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 text-[11px]">
                        {item.period}
                      </span>
                    </td>

                    {/* DPS Amount */}
                    <td className="py-3 px-3 text-right">
                      <span className="font-bold text-emerald-400 text-sm">
                        S${item.amount.toFixed(4)}
                      </span>
                    </td>

                    {/* Type */}
                    <td className="py-3 px-3 font-sans text-[11px] text-slate-400">
                      {item.distributionType}
                    </td>

                    {/* Yield */}
                    <td className="py-3 px-3 text-right text-cyan-400 font-medium">
                      {item.yieldPercent.toFixed(2)}%
                    </td>

                    {/* Action */}
                    <td className="py-3 px-3 text-center font-sans">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectStock(item.stock);
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                      >
                        Inspect Trends
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedEvents.length === 0 && (
            <div className="py-12 text-center text-slate-500 text-xs">
              No historical dividend records found matching the selected filters.
            </div>
          )}
        </div>
      ) : (
        /* 2. 5-Year Annual Progression Matrix */
        <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-slate-100">
                5-Year Annual Distribution per Share (DPS) Matrix (2022–2026)
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative annual dividends paid per share in Singapore Dollars (SGD)
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">Currency: SGD (S$)</span>
          </div>

          <div className="overflow-x-auto mt-3">
            <table className="w-full text-left text-xs whitespace-nowrap">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium select-none">
                <tr>
                  <th className="py-3 px-3">Ticker & Company</th>
                  <th className="py-3 px-3">Sector</th>
                  <th className="py-3 px-3 text-right">2022 DPS</th>
                  <th className="py-3 px-3 text-right">2023 DPS</th>
                  <th className="py-3 px-3 text-right">2024 DPS</th>
                  <th className="py-3 px-3 text-right">2025 DPS</th>
                  <th className="py-3 px-3 text-right font-bold text-slate-200">2026 DPS</th>
                  <th className="py-3 px-3 text-right">5Y CAGR</th>
                  <th className="py-3 px-3 text-center">Safety Rating</th>
                  <th className="py-3 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {stocks.map((stock) => {
                  const d22 = stock.historicalPayouts.find((p) => p.year === 2022)?.dps ?? 0;
                  const d23 = stock.historicalPayouts.find((p) => p.year === 2023)?.dps ?? 0;
                  const d24 = stock.historicalPayouts.find((p) => p.year === 2024)?.dps ?? 0;
                  const d25 = stock.historicalPayouts.find((p) => p.year === 2025)?.dps ?? 0;
                  const d26 = stock.historicalPayouts.find((p) => p.year === 2026)?.dps ?? stock.dpsAnnual;

                  return (
                    <tr
                      key={stock.ticker}
                      onClick={() => onSelectStock(stock)}
                      className="hover:bg-slate-800/50 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-100">{stock.ticker}</span>
                          <span className="text-[11px] text-slate-400 font-sans truncate max-w-[160px]">
                            {stock.name}
                          </span>
                        </div>
                      </td>

                      <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                        {stock.sector}
                      </td>

                      <td className="py-3 px-3 text-right text-slate-400">
                        S${d22.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-400">
                        S${d23.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        S${d24.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right text-slate-300">
                        S${d25.toFixed(4)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        S${d26.toFixed(4)}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <span
                          className={
                            stock.fiveYearCAGR >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }
                        >
                          {stock.fiveYearCAGR >= 0 ? '+' : ''}
                          {stock.fiveYearCAGR.toFixed(1)}%
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <span
                          className={`inline-block px-2 py-0.5 rounded text-[11px] ${
                            stock.healthRating === 'Safe'
                              ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                              : stock.healthRating === 'Stable'
                              ? 'bg-sky-950 text-sky-300 border border-sky-800'
                              : 'bg-amber-950 text-amber-300 border border-amber-800'
                          }`}
                        >
                          {stock.healthRating}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-center font-sans">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectStock(stock);
                          }}
                          className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] transition-colors"
                        >
                          Deep Dive
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
