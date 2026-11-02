/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock } from '../types/sgx';
import { ArrowUpRight, Info } from 'lucide-react';

interface YieldRankingChartProps {
  stocks: SGXStock[];
  selectedStock: SGXStock | null;
  onSelectStock: (stock: SGXStock) => void;
  sgsYield: number;
  stiAverageYield: number;
}

export const YieldRankingChart: React.FC<YieldRankingChartProps> = ({
  stocks,
  selectedStock,
  onSelectStock,
  sgsYield,
  stiAverageYield,
}) => {
  const [metric, setMetric] = useState<'yield' | 'dps' | 'cagr'>('yield');
  const [sectorFilter, setSectorFilter] = useState<string>('All');

  const filteredStocks = stocks.filter((s) =>
    sectorFilter === 'All' ? true : s.sector === sectorFilter
  );

  // Sort descending by current metric
  const sortedStocks = [...filteredStocks].sort((a, b) => {
    if (metric === 'yield') return b.yieldPercent - a.yieldPercent;
    if (metric === 'dps') return b.dpsAnnual - a.dpsAnnual;
    return b.fiveYearCAGR - a.fiveYearCAGR;
  });

  const maxVal = Math.max(
    ...sortedStocks.map((s) => {
      if (metric === 'yield') return s.yieldPercent;
      if (metric === 'dps') return s.dpsAnnual;
      return Math.max(s.fiveYearCAGR, 5);
    }),
    10
  );

  const getBarColor = (stock: SGXStock) => {
    if (selectedStock?.ticker === stock.ticker) return 'bg-cyan-400';
    if (stock.sector === 'S-REITs') return 'bg-emerald-500 hover:bg-emerald-400';
    if (stock.sector === 'Banking & Finance') return 'bg-sky-500 hover:bg-sky-400';
    if (stock.sector === 'Telecommunications') return 'bg-indigo-500 hover:bg-indigo-400';
    if (stock.sector === 'Consumer & Technology') return 'bg-amber-500 hover:bg-amber-400';
    return 'bg-teal-500 hover:bg-teal-400';
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h2 className="text-base font-semibold text-slate-100 flex items-center gap-2">
            Yield Percentage Ranking & Benchmark Spread
            <span className="text-xs font-normal text-slate-400">
              ({sortedStocks.length} SGX Issuers)
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Ranked in descending order with MAS 10Y SGS bond reference comparison
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
            <button
              onClick={() => setMetric('yield')}
              className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                metric === 'yield'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Yield %
            </button>
            <button
              onClick={() => setMetric('dps')}
              className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                metric === 'dps'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Annual DPS (S$)
            </button>
            <button
              onClick={() => setMetric('cagr')}
              className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
                metric === 'cagr'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              5Y Dividend CAGR
            </button>
          </div>
        </div>
      </div>

      {/* Benchmark Reference Legend */}
      <div className="flex flex-wrap items-center gap-4 py-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-amber-400 inline-block"></span>
          <span>MAS 10Y SGS Bond: <strong className="text-amber-300 font-mono">{sgsYield.toFixed(2)}%</strong></span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-3 h-0.5 bg-cyan-400 inline-block"></span>
          <span>STI Index Avg: <strong className="text-cyan-300 font-mono">{stiAverageYield.toFixed(2)}%</strong></span>
        </div>
        <div className="flex items-center gap-3 ml-auto text-slate-500">
          <span>0% SG Dividend Tax applies</span>
        </div>
      </div>

      {/* Horizontal Bar Chart Container */}
      <div className="space-y-2 mt-2 max-h-[460px] overflow-y-auto pr-2">
        {sortedStocks.map((stock, idx) => {
          const val =
            metric === 'yield'
              ? stock.yieldPercent
              : metric === 'dps'
              ? stock.dpsAnnual
              : stock.fiveYearCAGR;

          const pctWidth = Math.min(Math.max((val / maxVal) * 100, 4), 100);
          const isSelected = selectedStock?.ticker === stock.ticker;

          return (
            <div
              key={stock.ticker}
              onClick={() => onSelectStock(stock)}
              className={`group flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                isSelected
                  ? 'bg-slate-800/90 border border-cyan-500/50 shadow-md'
                  : 'hover:bg-slate-800/50 border border-transparent'
              }`}
            >
              {/* Rank & Ticker Badge */}
              <div className="w-20 shrink-0 flex items-center gap-2">
                <span className="text-xs font-mono text-slate-500 w-4 text-right">
                  {idx + 1}
                </span>
                <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                  {stock.ticker}
                </span>
              </div>

              {/* Stock Name (Truncated) */}
              <div className="w-36 sm:w-48 shrink-0 truncate text-xs text-slate-300">
                {stock.name}
              </div>

              {/* Progress Bar with Relative Benchmark Alignment */}
              <div className="flex-1 relative h-6 bg-slate-900 rounded-md overflow-hidden flex items-center px-2">
                {/* 10Y SGS Benchmark Line (if viewing yield) */}
                {metric === 'yield' && (
                  <div
                    style={{ left: `${(sgsYield / maxVal) * 100}%` }}
                    className="absolute top-0 bottom-0 w-px bg-amber-400/70 z-10"
                    title={`MAS 10Y SGS: ${sgsYield}%`}
                  />
                )}
                {/* STI Avg Benchmark Line (if viewing yield) */}
                {metric === 'yield' && (
                  <div
                    style={{ left: `${(stiAverageYield / maxVal) * 100}%` }}
                    className="absolute top-0 bottom-0 w-px bg-cyan-400/60 z-10"
                    title={`STI Average: ${stiAverageYield}%`}
                  />
                )}

                {/* Animated Fill Bar */}
                <div
                  style={{ width: `${pctWidth}%` }}
                  className={`absolute left-0 top-0 bottom-0 rounded-r transition-all duration-300 ${getBarColor(
                    stock
                  )}`}
                />

                {/* Subtext info inside or right */}
                <span className="relative z-20 text-[11px] font-mono font-bold text-slate-900 mix-blend-difference">
                  {metric === 'yield' && `${val.toFixed(2)}%`}
                  {metric === 'dps' && `S$${val.toFixed(3)}`}
                  {metric === 'cagr' && `${val > 0 ? '+' : ''}${val.toFixed(1)}%`}
                </span>
              </div>

              {/* Ex-Dividend Date Status */}
              <div className="w-24 shrink-0 text-right text-[11px] font-mono text-slate-400 hidden sm:block">
                <span>{stock.upcomingDividend.exDate}</span>
              </div>

              {/* Action Chevron */}
              <div className="shrink-0 text-slate-500 group-hover:text-slate-200">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Info Strip */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
          Click any counter to inspect 5-year payout trajectory, DPU breakdown, and health audit.
        </span>
        <span className="font-mono text-slate-400 hidden sm:inline">
          Live Yield Spread: +{(sortedStocks[0].yieldPercent - sgsYield).toFixed(2)}% max
        </span>
      </div>
    </div>
  );
};
