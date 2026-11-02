/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock } from '../types/sgx';
import { Calendar, ShieldAlert, Sparkles, TrendingUp, DollarSign, ExternalLink } from 'lucide-react';

interface HistoricalPayoutViewProps {
  stock: SGXStock;
  onClose?: () => void;
}

export const HistoricalPayoutView: React.FC<HistoricalPayoutViewProps> = ({ stock }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [sharesInput, setSharesInput] = useState<number>(1000);
  const [activeTab, setActiveTab] = useState<'trends' | 'breakdown' | 'insights'>('trends');

  const payouts = stock.historicalPayouts;
  const currentYearPayout = payouts.find((p) => p.year === selectedYear) || payouts[payouts.length - 1];

  // SVG Chart Dimensions
  const chartHeight = 160;
  const chartWidth = 480;
  const maxDPS = Math.max(...payouts.map((p) => p.dps)) * 1.25;

  // Projected Annual Dividend Calculation
  const projectedIncome = sharesInput * stock.dpsAnnual;
  const totalCostSGD = sharesInput * stock.price;

  const getHealthBadge = (rating: string) => {
    switch (rating) {
      case 'Safe':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-800/80';
      case 'Stable':
        return 'text-sky-400 bg-sky-950/60 border-sky-800/80';
      case 'Monitor':
        return 'text-amber-400 bg-amber-950/60 border-amber-800/80';
      default:
        return 'text-rose-400 bg-rose-950/60 border-rose-800/80';
    }
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Top Header Card */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-bold">
              {stock.ticker}
            </span>
            <h2 className="text-lg font-bold text-slate-100">{stock.name}</h2>
            <span
              className={`text-xs px-2 py-0.5 rounded border font-medium ${getHealthBadge(
                stock.healthRating
              )}`}
            >
              {stock.healthRating} ({stock.healthScore}/100)
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1">
            <span>{stock.sector}</span>
            <span>·</span>
            <span className="font-mono text-slate-300">Price: S${stock.price.toFixed(3)}</span>
            <span>·</span>
            <span className="font-mono text-emerald-400 font-bold">
              Yield: {stock.yieldPercent.toFixed(2)}%
            </span>
            <span>·</span>
            <span>Freq: {stock.payoutFrequency}</span>
            {stock.gearing !== null && (
              <>
                <span>·</span>
                <span className="font-mono text-amber-300">Gearing: {stock.gearing}%</span>
              </>
            )}
          </div>
        </div>

        {/* View Tabs */}
        <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-0.5 text-xs">
          <button
            onClick={() => setActiveTab('trends')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'trends'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            5-Year Trends
          </button>
          <button
            onClick={() => setActiveTab('breakdown')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'breakdown'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Period Distributions
          </button>
          <button
            onClick={() => setActiveTab('insights')}
            className={`px-3 py-1 font-medium rounded-md transition-colors whitespace-nowrap ${
              activeTab === 'insights'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Analyst Intelligence
          </button>
        </div>
      </div>

      {/* Main Content Areas */}
      {activeTab === 'trends' && (
        <div className="space-y-6 pt-4">
          {/* Key 5-Year Performance Metrics Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400">5Y Dividend CAGR</span>
              <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
                {stock.fiveYearCAGR > 0 ? `+${stock.fiveYearCAGR}%` : `${stock.fiveYearCAGR}%`}
              </p>
              <span className="text-[10px] text-slate-500">Compound annual growth</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400">Current Annual DPS</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                S${stock.dpsAnnual.toFixed(4)}
              </p>
              <span className="text-[10px] text-slate-500">Per SGX ordinary unit</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400">FCF Payout Coverage</span>
              <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
                {stock.fcfCoverage.toFixed(2)}x
              </p>
              <span className="text-[10px] text-slate-500">Free cash flow health</span>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
              <span className="text-xs text-slate-400">Payout Ratio</span>
              <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
                {stock.payoutRatio}%
              </p>
              <span className="text-[10px] text-slate-500">Of distributable income</span>
            </div>
          </div>

          {/* 5-Year Visual Chart Area */}
          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                5-Year Distribution Per Share (DPS) Trajectory & Yield
              </h3>
              <span className="text-xs text-slate-400">2022 - 2026 Fiscal Periods</span>
            </div>

            {/* Responsive SVG Chart */}
            <div className="w-full overflow-x-auto">
              <svg
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                className="w-full h-44 text-slate-400 font-mono text-[10px]"
              >
                {/* Background grid lines */}
                {[0.25, 0.5, 0.75, 1].map((ratio, i) => {
                  const y = chartHeight - ratio * (chartHeight - 30) - 20;
                  return (
                    <g key={i}>
                      <line
                        x1="40"
                        y1={y}
                        x2={chartWidth - 20}
                        y2={y}
                        stroke="#1E293B"
                        strokeDasharray="3 3"
                      />
                      <text x="5" y={y + 3} fill="#64748B" fontSize="9">
                        S${((maxDPS * ratio)).toFixed(2)}
                      </text>
                    </g>
                  );
                })}

                {/* Bars & Labels */}
                {payouts.map((item, idx) => {
                  const barWidth = 44;
                  const step = (chartWidth - 80) / payouts.length;
                  const x = 55 + idx * step;
                  const barHeight = ((item.dps / maxDPS) * (chartHeight - 40));
                  const y = chartHeight - 20 - barHeight;
                  const isCurrent = item.year === selectedYear;

                  return (
                    <g
                      key={item.year}
                      className="cursor-pointer transition-opacity hover:opacity-80"
                      onClick={() => setSelectedYear(item.year)}
                    >
                      {/* Bar Fill */}
                      <rect
                        x={x}
                        y={y}
                        width={barWidth}
                        height={barHeight}
                        rx="4"
                        fill={isCurrent ? '#10B981' : '#334155'}
                        className="transition-all duration-200"
                      />

                      {/* Value label on top of bar */}
                      <text
                        x={x + barWidth / 2}
                        y={y - 5}
                        textAnchor="middle"
                        fill={isCurrent ? '#34D399' : '#94A3B8'}
                        fontWeight="bold"
                        fontSize="10"
                      >
                        S${item.dps.toFixed(3)}
                      </text>

                      {/* Year label below */}
                      <text
                        x={x + barWidth / 2}
                        y={chartHeight - 5}
                        textAnchor="middle"
                        fill={isCurrent ? '#FFFFFF' : '#64748B'}
                        fontWeight={isCurrent ? 'bold' : 'normal'}
                        fontSize="10"
                      >
                        {item.year}
                      </text>

                      {/* Yield indicator point */}
                      <circle
                        cx={x + barWidth / 2}
                        cy={y + 12}
                        r="3"
                        fill="#38BDF8"
                      />
                    </g>
                  );
                })}
              </svg>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded bg-emerald-500 inline-block"></span>
                  Annual DPS (SGD)
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block"></span>
                  Annual Dividend Yield
                </span>
              </div>
              <span>Click any year bar to inspect seasonal distributions</span>
            </div>
          </div>

          {/* Interactive Dividend Cashflow Calculator */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800/80 border border-slate-800 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <DollarSign className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                Payout Simulator for {stock.ticker}
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  Holding Units (Shares)
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="100"
                    step="100"
                    value={sharesInput}
                    onChange={(e) => setSharesInput(Math.max(0, Number(e.target.value)))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-1.5 text-sm font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <span className="text-[10px] text-slate-500">
                  Est. Capital: S${totalCostSGD.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-md p-3">
                <span className="text-xs text-slate-400">Projected Annual Cashflow</span>
                <p className="text-xl font-bold font-mono text-emerald-400">
                  S${projectedIncome.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
                <span className="text-[10px] text-emerald-300/80">
                  Net 0% Withholding Tax = 100% Retained
                </span>
              </div>

              <div className="bg-slate-950/70 border border-slate-800 rounded-md p-3">
                <span className="text-xs text-slate-400">Per Payout Estimated</span>
                <p className="text-xl font-bold font-mono text-cyan-400">
                  S${(
                    projectedIncome /
                    (stock.payoutFrequency === 'Quarterly'
                      ? 4
                      : stock.payoutFrequency === 'Semi-Annual'
                      ? 2
                      : 1)
                  ).toFixed(2)}
                </p>
                <span className="text-[10px] text-slate-400">
                  Paid {stock.payoutFrequency.toLowerCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Distribution Breakdown Tab */}
      {activeTab === 'breakdown' && (
        <div className="pt-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-semibold text-slate-300">
              Distribution Schedule & Historical Breakdown for {selectedYear}
            </h3>
            <div className="flex items-center gap-1">
              {payouts.map((p) => (
                <button
                  key={p.year}
                  onClick={() => setSelectedYear(p.year)}
                  className={`px-2.5 py-1 text-xs rounded font-mono ${
                    selectedYear === p.year
                      ? 'bg-emerald-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {p.year}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-800 rounded-lg">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="py-2.5 px-3">Distribution Period</th>
                  <th className="py-2.5 px-3 text-right">DPS Amount (SGD)</th>
                  <th className="py-2.5 px-3 text-right">Payment Date</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {currentYearPayout.distributionBreakdown.map((b, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {b.period}
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                      S${b.amount.toFixed(4)}
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-400">
                      {b.paymentDate}
                    </td>
                    <td className="py-2.5 px-3 text-right font-sans">
                      <span className="text-[11px] text-slate-400">
                        {b.period.includes('Est') ? 'Projected' : 'Disbursed'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="p-3 bg-slate-900/60 border border-slate-800 rounded-lg text-xs text-slate-400 space-y-1">
            <p>
              <strong>Total {selectedYear} DPS:</strong>{' '}
              <span className="font-mono text-emerald-400 font-bold">
                S${currentYearPayout.dps.toFixed(4)}
              </span>{' '}
              · <strong>Effective Yield:</strong>{' '}
              <span className="font-mono text-cyan-400">{currentYearPayout.yield}%</span>
            </p>
            <p className="text-slate-500 text-[11px]">
              SGX listed REIT distributions may contain taxable, tax-exempt, and capital components. Individual retail investors receive 100% tax exemption at source.
            </p>
          </div>
        </div>
      )}

      {/* Analyst Intelligence Tab */}
      {activeTab === 'insights' && (
        <div className="pt-4 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-lg p-4">
            <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              Executive Research Synopsis
            </h3>
            <p className="text-xs leading-relaxed text-slate-300">
              {stock.insights.summary}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="bg-slate-900/50 border border-emerald-900/40 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Dividend Growth Catalysts
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {stock.insights.catalysts.map((c, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold">›</span>
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-slate-900/50 border border-rose-900/40 rounded-lg p-3">
              <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" />
                Distribution Risk Factors
              </h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                {stock.insights.risks.map((r, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="text-rose-400 font-bold">›</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-3 text-xs text-slate-300">
            <h4 className="font-semibold text-slate-200 mb-1">
              Sustainability Verdict & Balance Sheet Health
            </h4>
            <p className="text-slate-400 leading-relaxed mb-2">
              {stock.insights.sustainabilityVerdict}
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
              <span>Analyst Target: <strong className="text-slate-200 font-mono">S${stock.targetPrice.toFixed(2)}</strong></span>
              <span>·</span>
              <span>Consensus: <strong className="text-emerald-400 font-mono">{stock.analystConsensus}</strong></span>
              <span>·</span>
              <span>{stock.insights.taxAdvantage}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
