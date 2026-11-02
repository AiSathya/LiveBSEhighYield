/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SGXStock, MarketMetrics } from '../types/sgx';

interface PrintableDossierProps {
  stocks: SGXStock[];
  marketMetrics: MarketMetrics;
}

export const PrintableDossier: React.FC<PrintableDossierProps> = ({ stocks, marketMetrics }) => {
  const sorted = [...stocks].sort((a, b) => b.yieldPercent - a.yieldPercent);
  const avgYield = (stocks.reduce((acc, s) => acc + s.yieldPercent, 0) / stocks.length).toFixed(2);

  return (
    <div className="hidden print:block p-8 bg-white text-black font-sans max-w-4xl mx-auto">
      {/* Header */}
      <div className="border-b-2 border-black pb-4 mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-black">
            LionYield SGX Dividend Intelligence
          </h1>
          <p className="text-sm text-gray-700">
            Singapore Exchange (SGX) High-Yield Equities & REITs Executive Dossier
          </p>
        </div>
        <div className="text-right text-xs text-gray-600 font-mono">
          <p>Date: {new Date().toLocaleDateString('en-SG', { dateStyle: 'full' })}</p>
          <p>Market Status: SGX LIVE</p>
          <p>Currency: SGD (S$)</p>
        </div>
      </div>

      {/* Benchmark Summary Table */}
      <div className="grid grid-cols-4 gap-4 mb-6 text-xs p-3 bg-gray-100 rounded border border-gray-300">
        <div>
          <span className="text-gray-600 block">Straits Times Index (STI)</span>
          <span className="font-bold font-mono text-base">{marketMetrics.stiLevel.toFixed(2)}</span>
        </div>
        <div>
          <span className="text-gray-600 block">Average SGX Dividend Yield</span>
          <span className="font-bold font-mono text-base">{avgYield}%</span>
        </div>
        <div>
          <span className="text-gray-600 block">MAS 10Y SGS Bond Yield</span>
          <span className="font-bold font-mono text-base">{marketMetrics.sgs10YearBondYield.toFixed(2)}%</span>
        </div>
        <div>
          <span className="text-gray-600 block">S-REIT Yield Spread</span>
          <span className="font-bold font-mono text-base">+{marketMetrics.yieldSpread.toFixed(2)}%</span>
        </div>
      </div>

      {/* Key Takeaways */}
      <div className="mb-6 p-4 border-l-4 border-black bg-gray-50 text-xs leading-relaxed">
        <h3 className="font-bold uppercase text-black mb-1">Key Singapore Tax & Regulatory Note</h3>
        <p>
          Under the Singapore One-Tier Corporate Tax System, dividends paid by Singapore tax-resident companies are exempt from Singapore income tax in the hands of individual shareholders. Furthermore, Singapore imposes 0% withholding tax on dividends paid to both local and foreign individual investors.
        </p>
      </div>

      {/* Main High Yield Leaderboard */}
      <div className="mb-8">
        <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-2">
          SGX High Dividend Yield Stock Rankings (Descending by Yield %)
        </h2>
        <table className="w-full text-left text-xs border border-gray-300">
          <thead className="bg-gray-200 border-b border-gray-400 font-bold">
            <tr>
              <th className="p-2">Rank</th>
              <th className="p-2">Ticker</th>
              <th className="p-2">Issuer Name</th>
              <th className="p-2">Sector</th>
              <th className="p-2 text-right">Price</th>
              <th className="p-2 text-right">Yield %</th>
              <th className="p-2 text-right">Annual DPS</th>
              <th className="p-2 text-right">5Y CAGR</th>
              <th className="p-2 text-right">Gearing</th>
              <th className="p-2 text-center">Ex-Date</th>
              <th className="p-2 text-center">Health</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 font-mono text-[11px]">
            {sorted.map((stock, i) => (
              <tr key={stock.ticker}>
                <td className="p-2 text-center font-sans">{i + 1}</td>
                <td className="p-2 font-bold">{stock.ticker}</td>
                <td className="p-2 font-sans font-medium">{stock.name}</td>
                <td className="p-2 font-sans">{stock.sector}</td>
                <td className="p-2 text-right">S${stock.price.toFixed(3)}</td>
                <td className="p-2 text-right font-bold">{stock.yieldPercent.toFixed(2)}%</td>
                <td className="p-2 text-right">S${stock.dpsAnnual.toFixed(4)}</td>
                <td className="p-2 text-right">{stock.fiveYearCAGR.toFixed(1)}%</td>
                <td className="p-2 text-right">
                  {stock.gearing !== null ? `${stock.gearing}%` : '-'}
                </td>
                <td className="p-2 text-center">{stock.upcomingDividend.exDate}</td>
                <td className="p-2 text-center font-sans">{stock.healthRating}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Upcoming Ex-Dividend Announcements */}
      <div className="mb-6">
        <h2 className="text-sm font-bold uppercase tracking-wide border-b border-gray-400 pb-1 mb-2">
          Upcoming Dividend Announcements & Ex-Dates
        </h2>
        <div className="grid grid-cols-2 gap-3 text-xs">
          {sorted.slice(0, 8).map((s) => (
            <div key={s.ticker} className="p-2 border border-gray-300 rounded">
              <div className="flex justify-between font-bold">
                <span>{s.ticker} · {s.name}</span>
                <span>S${s.upcomingDividend.amount.toFixed(4)}</span>
              </div>
              <div className="text-gray-600 flex justify-between mt-1 text-[11px] font-mono">
                <span>Ex-Date: {s.upcomingDividend.exDate}</span>
                <span>Payment: {s.upcomingDividend.paymentDate}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-gray-400 pt-4 mt-8 text-[10px] text-gray-500 flex justify-between">
        <span>LionYield SGX Intelligence · Confidential Investor Memo</span>
        <span>Securities Data sourced from Singapore Exchange (SGX)</span>
      </div>
    </div>
  );
};
