/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock } from '../types/sgx';
import { Search, ArrowUpDown, ChevronDown, ChevronUp, Plus, TrendingUp, ShieldCheck } from 'lucide-react';

interface StockLeaderboardTableProps {
  stocks: SGXStock[];
  selectedStock: SGXStock | null;
  onSelectStock: (stock: SGXStock) => void;
  onAddToPortfolio?: (stock: SGXStock) => void;
}

type SortField = 'yieldPercent' | 'price' | 'dpsAnnual' | 'fiveYearCAGR' | 'fcfCoverage' | 'healthScore' | 'gearing';

export const StockLeaderboardTable: React.FC<StockLeaderboardTableProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  onAddToPortfolio,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('All');
  const [selectedHealth, setSelectedHealth] = useState<string>('All');
  const [minYield, setMinYield] = useState<number>(0);
  const [sortField, setSortField] = useState<SortField>('yieldPercent');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // Filter
  const filtered = stocks.filter((s) => {
    const matchSearch =
      s.ticker.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchSector = selectedSector === 'All' || s.sector === selectedSector;
    const matchHealth = selectedHealth === 'All' || s.healthRating === selectedHealth;
    const matchYield = s.yieldPercent >= minYield;
    return matchSearch && matchSector && matchHealth && matchYield;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (aVal === null) aVal = -999;
    if (bVal === null) bVal = -999;

    if (sortDirection === 'desc') {
      return (bVal as number) - (aVal as number);
    } else {
      return (aVal as number) - (bVal as number);
    }
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-600 inline ml-1" />;
    }
    return sortDirection === 'desc' ? (
      <ChevronDown className="w-3 h-3 text-emerald-400 inline ml-1" />
    ) : (
      <ChevronUp className="w-3 h-3 text-emerald-400 inline ml-1" />
    );
  };

  const maxYield = Math.max(...stocks.map((s) => s.yieldPercent), 8.5);

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Top Controls Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            SGX High Dividend Yield Stock Leaderboard
            <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
              {sorted.length} of {stocks.length} matches
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Default sorted descending by dividend yield with 5-year track record and payout sustainability metrics
          </p>
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search ticker (e.g. D05, C38U)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700/80 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Filter Chips Bar */}
      <div className="flex flex-wrap items-center gap-3 py-3 border-b border-slate-800/80 text-xs">
        {/* Sector Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {[
            'All',
            'S-REITs',
            'Banking & Finance',
            'Telecommunications',
            'Industrials',
            'Infrastructure & Utilities',
            'Consumer & Technology',
          ].map((sec) => (
            <button
              key={sec}
              onClick={() => setSelectedSector(sec)}
              className={`px-2.5 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                selectedSector === sec
                  ? 'bg-slate-800 text-emerald-400 font-medium border border-slate-700'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {sec}
            </button>
          ))}
        </div>

        {/* Min Yield Filter */}
        <div className="flex items-center gap-2 ml-auto text-xs text-slate-400">
          <span>Min Yield:</span>
          {[0, 5, 6, 7].map((val) => (
            <button
              key={val}
              onClick={() => setMinYield(val)}
              className={`px-2 py-0.5 rounded font-mono text-[11px] ${
                minYield === val
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-slate-200'
              }`}
            >
              {val === 0 ? 'All' : `≥${val}%`}
            </button>
          ))}
        </div>
      </div>

      {/* Data Table */}
      <div className="overflow-x-auto mt-2">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium select-none">
            <tr>
              <th className="py-3 px-3 text-center w-10">#</th>
              <th className="py-3 px-3">Ticker & Company</th>
              <th className="py-3 px-3">Sector</th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('price')}
              >
                Price (SGD) {getSortIcon('price')}
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('yieldPercent')}
              >
                Yield % {getSortIcon('yieldPercent')}
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('dpsAnnual')}
              >
                Annual DPS {getSortIcon('dpsAnnual')}
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 hidden sm:table-cell"
                onClick={() => handleSort('fiveYearCAGR')}
              >
                5Y CAGR {getSortIcon('fiveYearCAGR')}
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 hidden md:table-cell"
                onClick={() => handleSort('fcfCoverage')}
              >
                FCF Coverage {getSortIcon('fcfCoverage')}
              </th>
              <th
                className="py-3 px-3 text-right cursor-pointer hover:text-slate-200 hidden lg:table-cell"
                onClick={() => handleSort('gearing')}
              >
                Gearing {getSortIcon('gearing')}
              </th>
              <th className="py-3 px-3 text-center">Next Ex-Date</th>
              <th
                className="py-3 px-3 text-center cursor-pointer hover:text-slate-200"
                onClick={() => handleSort('healthScore')}
              >
                Safety {getSortIcon('healthScore')}
              </th>
              <th className="py-3 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {sorted.map((stock, idx) => {
              const isSelected = selectedStock?.ticker === stock.ticker;
              const yieldWidth = Math.min((stock.yieldPercent / maxYield) * 100, 100);

              return (
                <tr
                  key={stock.ticker}
                  onClick={() => onSelectStock(stock)}
                  className={`cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-slate-800/90 text-white'
                      : 'hover:bg-slate-800/40 text-slate-300'
                  }`}
                >
                  {/* Rank */}
                  <td className="py-3 px-3 text-center text-slate-500 font-sans text-xs">
                    {idx + 1}
                  </td>

                  {/* Ticker & Name */}
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-100 group-hover:text-emerald-400">
                        {stock.ticker}
                      </span>
                      <span className="text-[11px] text-slate-400 font-sans truncate max-w-[140px] sm:max-w-[200px]">
                        {stock.name}
                      </span>
                    </div>
                  </td>

                  {/* Sector */}
                  <td className="py-3 px-3 font-sans text-slate-400 text-[11px]">
                    {stock.sector}
                  </td>

                  {/* Price & Change */}
                  <td className="py-3 px-3 text-right">
                    <div className="font-bold text-slate-200">
                      S${stock.price.toFixed(3)}
                    </div>
                    <div
                      className={`text-[10px] ${
                        stock.dayChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {stock.dayChange >= 0 ? '+' : ''}
                      {stock.dayChange.toFixed(3)} ({stock.dayChangePercent >= 0 ? '+' : ''}
                      {stock.dayChangePercent.toFixed(2)}%)
                    </div>
                  </td>

                  {/* Yield with Micro-Bar */}
                  <td className="py-3 px-3 text-right">
                    <div className="text-emerald-400 font-bold text-sm">
                      {stock.yieldPercent.toFixed(2)}%
                    </div>
                    <div className="w-16 h-1 bg-slate-800 rounded-full ml-auto mt-1 overflow-hidden">
                      <div
                        style={{ width: `${yieldWidth}%` }}
                        className="h-full bg-emerald-500 rounded-full"
                      />
                    </div>
                  </td>

                  {/* DPS */}
                  <td className="py-3 px-3 text-right text-slate-200">
                    S${stock.dpsAnnual.toFixed(4)}
                  </td>

                  {/* 5Y CAGR */}
                  <td className="py-3 px-3 text-right hidden sm:table-cell">
                    <span
                      className={
                        stock.fiveYearCAGR >= 0 ? 'text-emerald-400' : 'text-rose-400'
                      }
                    >
                      {stock.fiveYearCAGR >= 0 ? '+' : ''}
                      {stock.fiveYearCAGR.toFixed(1)}%
                    </span>
                  </td>

                  {/* FCF Coverage */}
                  <td className="py-3 px-3 text-right hidden md:table-cell text-cyan-400">
                    {stock.fcfCoverage.toFixed(2)}x
                  </td>

                  {/* Gearing */}
                  <td className="py-3 px-3 text-right hidden lg:table-cell">
                    {stock.gearing !== null ? (
                      <span
                        className={
                          stock.gearing > 42 ? 'text-amber-400' : 'text-slate-300'
                        }
                      >
                        {stock.gearing}%
                      </span>
                    ) : (
                      <span className="text-slate-600">-</span>
                    )}
                  </td>

                  {/* Ex-Date */}
                  <td className="py-3 px-3 text-center">
                    <span className="text-slate-300 text-[11px]">
                      {stock.upcomingDividend.exDate}
                    </span>
                  </td>

                  {/* Health Score */}
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[11px] font-sans ${
                        stock.healthRating === 'Safe'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : stock.healthRating === 'Stable'
                          ? 'bg-sky-950 text-sky-300 border border-sky-800'
                          : 'bg-amber-950 text-amber-300 border border-amber-800'
                      }`}
                    >
                      {stock.healthScore}
                    </span>
                  </td>

                  {/* Action */}
                  <td className="py-3 px-3 text-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectStock(stock);
                      }}
                      className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-[11px] font-sans transition-colors"
                    >
                      Analyze
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {sorted.length === 0 && (
        <div className="py-12 text-center text-slate-500 text-xs">
          No SGX dividend stocks matched your filter criteria. Try adjusting the sector or yield threshold.
        </div>
      )}

      {/* Bottom Summary Strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-4">
          <span>
            Highest Yield: <strong className="text-emerald-400 font-mono">{sorted[0]?.name || 'N/A'} ({sorted[0]?.yieldPercent || 0}%)</strong>
          </span>
          <span>·</span>
          <span>
            Average Yield: <strong className="text-slate-200 font-mono">{(sorted.reduce((acc, s) => acc + s.yieldPercent, 0) / (sorted.length || 1)).toFixed(2)}%</strong>
          </span>
        </div>
        <div className="text-slate-500 text-[11px]">
          SGX Official Ticker Codes · Prices in SGD
        </div>
      </div>
    </div>
  );
};
