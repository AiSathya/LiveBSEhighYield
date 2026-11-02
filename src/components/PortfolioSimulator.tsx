/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock, UserHolding } from '../types/sgx';
import { DollarSign, Plus, Trash2, Eye, EyeOff, Calendar, ShieldCheck, Lock } from 'lucide-react';

interface PortfolioSimulatorProps {
  stocks: SGXStock[];
  holdings: UserHolding[];
  onUpdateHoldings: (holdings: UserHolding[]) => void;
  isUnlocked: boolean;
  onRequireAuth: () => void;
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const PortfolioSimulator: React.FC<PortfolioSimulatorProps> = ({
  stocks,
  holdings,
  onUpdateHoldings,
  isUnlocked,
  onRequireAuth,
}) => {
  const [selectedTicker, setSelectedTicker] = useState<string>(stocks[0]?.ticker || 'D05');
  const [sharesInput, setSharesInput] = useState<number>(2000);
  const [showValues, setShowValues] = useState<boolean>(true);

  // Compute Portfolio Metrics
  const portfolioItems = holdings
    .map((h) => {
      const stock = stocks.find((s) => s.ticker === h.ticker);
      if (!stock) return null;
      const capitalValue = h.shares * stock.price;
      const annualDividend = h.shares * stock.dpsAnnual;
      return {
        ...h,
        stock,
        capitalValue,
        annualDividend,
        effectiveYield: (annualDividend / capitalValue) * 100,
      };
    })
    .filter(Boolean) as Array<{
    ticker: string;
    shares: number;
    averagePriceSGD: number;
    stock: SGXStock;
    capitalValue: number;
    annualDividend: number;
    effectiveYield: number;
  }>;

  const totalCapitalValue = portfolioItems.reduce((acc, curr) => acc + curr.capitalValue, 0);
  const totalAnnualDividend = portfolioItems.reduce((acc, curr) => acc + curr.annualDividend, 0);
  const blendedYield = totalCapitalValue > 0 ? (totalAnnualDividend / totalCapitalValue) * 100 : 0;
  const averageMonthlyCashflow = totalAnnualDividend / 12;

  // Monthly payout distribution projection (12 months)
  const monthlyPayouts = Array(12).fill(0);
  portfolioItems.forEach((item) => {
    // Distribute based on frequency and breakdown
    const latestPayout = item.stock.historicalPayouts[item.stock.historicalPayouts.length - 1];
    latestPayout.distributionBreakdown.forEach((dist) => {
      const month = new Date(dist.paymentDate).getMonth();
      const perPeriodAmount = item.shares * dist.amount;
      monthlyPayouts[month] += perPeriodAmount;
    });
  });

  const maxMonthValue = Math.max(...monthlyPayouts, 100);

  const handleAddHolding = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sharesInput || sharesInput <= 0) return;

    const stock = stocks.find((s) => s.ticker === selectedTicker);
    if (!stock) return;

    const existingIdx = holdings.findIndex((h) => h.ticker === selectedTicker);
    if (existingIdx >= 0) {
      const updated = [...holdings];
      updated[existingIdx].shares += sharesInput;
      onUpdateHoldings(updated);
    } else {
      onUpdateHoldings([
        ...holdings,
        {
          ticker: selectedTicker,
          shares: sharesInput,
          averagePriceSGD: stock.price,
        },
      ]);
    }
    setSharesInput(1000);
  };

  const handleRemoveHolding = (ticker: string) => {
    onUpdateHoldings(holdings.filter((h) => h.ticker !== ticker));
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">
              SGX Portfolio Yield & Cash Flow Planner
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Model your actual holdings, monthly cash distribution schedule, and 0% tax dividend income
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Privacy Eye Toggle */}
          <button
            onClick={() => {
              if (!isUnlocked && !showValues) {
                onRequireAuth();
              } else {
                setShowValues(!showValues);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-300 hover:text-white transition-colors"
          >
            {showValues ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{showValues ? 'Mask Balances' : 'Reveal Balances'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 my-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <span className="text-xs text-slate-400">Total Portfolio Value</span>
          <p className="text-lg font-bold font-mono text-slate-100 mt-0.5">
            {showValues ? `S$${totalCapitalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'S$ ••••••'}
          </p>
          <span className="text-[10px] text-slate-500 font-mono">{holdings.length} Positions</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <span className="text-xs text-slate-400">Annual Dividend Income</span>
          <p className="text-lg font-bold font-mono text-emerald-400 mt-0.5">
            {showValues ? `S$${totalAnnualDividend.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'S$ ••••••'}
          </p>
          <span className="text-[10px] text-emerald-300/80">Net 0% Withholding Tax</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <span className="text-xs text-slate-400">Weighted Average Yield</span>
          <p className="text-lg font-bold font-mono text-cyan-400 mt-0.5">
            {blendedYield.toFixed(2)}%
          </p>
          <span className="text-[10px] text-slate-500">Effective portfolio yield</span>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-lg p-3">
          <span className="text-xs text-slate-400">Monthly Average Cash Flow</span>
          <p className="text-lg font-bold font-mono text-amber-300 mt-0.5">
            {showValues ? `S$${averageMonthlyCashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : 'S$ ••••••'}
          </p>
          <span className="text-[10px] text-slate-500">Passive income rate</span>
        </div>
      </div>

      {/* Monthly Cash Flow Distribution Bar Chart */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-lg p-4 my-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Projected Monthly Payout Distribution (SGD)
          </h3>
          <span className="text-[11px] text-slate-500 font-mono">12-Month Distribution Radar</span>
        </div>

        <div className="grid grid-cols-12 gap-1.5 items-end h-28 pt-4 pb-2 border-b border-slate-800/80">
          {monthlyPayouts.map((amount, idx) => {
            const heightPercent = maxMonthValue > 0 ? Math.max((amount / maxMonthValue) * 100, 4) : 4;
            const hasPayout = amount > 0;

            return (
              <div key={idx} className="flex flex-col items-center h-full justify-end group">
                {/* Tooltip on hover */}
                {hasPayout && (
                  <span className="text-[9px] font-mono text-emerald-300 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap mb-1">
                    {showValues ? `S$${amount.toFixed(0)}` : '••••'}
                  </span>
                )}
                {/* Bar */}
                <div
                  style={{ height: `${heightPercent}%` }}
                  className={`w-full rounded-t transition-all ${
                    hasPayout ? 'bg-emerald-500 hover:bg-emerald-400' : 'bg-slate-800'
                  }`}
                />
                {/* Month label */}
                <span className="text-[10px] font-mono text-slate-400 mt-1">
                  {MONTH_NAMES[idx]}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Holding Form */}
      <form
        onSubmit={handleAddHolding}
        className="flex flex-wrap items-center gap-3 p-3 bg-slate-900/80 border border-slate-800 rounded-lg my-4 text-xs"
      >
        <div className="flex-1 min-w-[140px]">
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
            Select SGX Stock
          </label>
          <select
            value={selectedTicker}
            onChange={(e) => setSelectedTicker(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
          >
            {stocks.map((s) => (
              <option key={s.ticker} value={s.ticker}>
                {s.ticker} - {s.name} ({s.yieldPercent.toFixed(2)}%)
              </option>
            ))}
          </select>
        </div>

        <div className="w-32">
          <label className="block text-slate-400 text-[10px] uppercase font-semibold mb-1">
            Shares (Units)
          </label>
          <input
            type="number"
            min="100"
            step="100"
            value={sharesInput}
            onChange={(e) => setSharesInput(Number(e.target.value))}
            className="w-full bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 font-mono text-slate-100 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="self-end">
          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-md bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add to Portfolio
          </button>
        </div>
      </form>

      {/* Holdings List */}
      <div className="overflow-x-auto border border-slate-800 rounded-lg">
        <table className="w-full text-left text-xs whitespace-nowrap">
          <thead className="bg-slate-900 text-slate-400 border-b border-slate-800 font-medium">
            <tr>
              <th className="py-2.5 px-3">Ticker</th>
              <th className="py-2.5 px-3">Company Name</th>
              <th className="py-2.5 px-3 text-right">Shares</th>
              <th className="py-2.5 px-3 text-right">Current Price</th>
              <th className="py-2.5 px-3 text-right">Market Value</th>
              <th className="py-2.5 px-3 text-right">Annual Cashflow</th>
              <th className="py-2.5 px-3 text-right">Yield</th>
              <th className="py-2.5 px-3 text-center">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {portfolioItems.map((item) => (
              <tr key={item.ticker} className="hover:bg-slate-800/40">
                <td className="py-2.5 px-3 font-bold text-slate-100">{item.ticker}</td>
                <td className="py-2.5 px-3 font-sans text-slate-300 truncate max-w-[180px]">
                  {item.stock.name}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-200">
                  {item.shares.toLocaleString()}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-400">
                  S${item.stock.price.toFixed(3)}
                </td>
                <td className="py-2.5 px-3 text-right text-slate-100 font-medium">
                  {showValues ? `S$${item.capitalValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '••••••'}
                </td>
                <td className="py-2.5 px-3 text-right text-emerald-400 font-bold">
                  {showValues ? `S$${item.annualDividend.toFixed(2)}` : '••••••'}
                </td>
                <td className="py-2.5 px-3 text-right text-cyan-400">
                  {item.stock.yieldPercent.toFixed(2)}%
                </td>
                <td className="py-2.5 px-3 text-center">
                  <button
                    onClick={() => handleRemoveHolding(item.ticker)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition-colors"
                    title="Remove position"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-slate-500 text-[11px] flex items-center justify-between">
        <span>Portfolio state is cached locally with biometrics vault security.</span>
        <span>MAS CDP Sub-Account Simulation</span>
      </div>
    </div>
  );
};
