/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SGXStock, AlertItem } from '../types/sgx';
import { Bell, Calendar, Clock, AlertTriangle, Download, CheckCircle, ChevronRight } from 'lucide-react';
import { downloadDividendCalendarICS } from '../services/exportService';

interface UpcomingDividendsAlertsProps {
  stocks: SGXStock[];
  onSelectStock: (stock: SGXStock) => void;
  alerts: AlertItem[];
  onDismissAlert: (id: string) => void;
}

export const UpcomingDividendsAlerts: React.FC<UpcomingDividendsAlertsProps> = ({
  stocks,
  onSelectStock,
  alerts,
  onDismissAlert,
}) => {
  const [filterMode, setFilterMode] = useState<'all' | 'imminent' | 'alerts'>('imminent');
  const [notificationStatus, setNotificationStatus] = useState<string | null>(null);

  // Compute days until ex-date based on current simulated date 2026-11-02
  const referenceDate = new Date('2026-11-02T00:00:00');

  const stocksWithCountdown = stocks
    .filter((s) => s.upcomingDividend.declared)
    .map((s) => {
      const exDateObj = new Date(`${s.upcomingDividend.exDate}T00:00:00`);
      const diffTime = exDateObj.getTime() - referenceDate.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      return {
        ...s,
        daysToExDate: diffDays,
      };
    })
    .sort((a, b) => a.daysToExDate - b.daysToExDate);

  const imminentStocks = stocksWithCountdown.filter((s) => s.daysToExDate <= 14);

  const displayedStocks = filterMode === 'imminent' ? imminentStocks : stocksWithCountdown;

  const requestBrowserNotification = async () => {
    if (!('Notification' in window)) {
      setNotificationStatus('Browser notifications not supported in this environment.');
      setTimeout(() => setNotificationStatus(null), 4000);
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        new Notification('LionYield SGX Alerts Active', {
          body: 'You will receive alerts for upcoming SGX ex-dividend dates and yield spikes.',
          icon: '/favicon.ico',
        });
        setNotificationStatus('Notifications enabled! Live ex-dividend alerts activated.');
      } else {
        setNotificationStatus('Notification permission was declined or dismissed.');
      }
    } catch {
      setNotificationStatus('Notification permission requested.');
    }
    setTimeout(() => setNotificationStatus(null), 4000);
  };

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-xl p-5 shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-400" />
            <h2 className="text-base font-semibold text-slate-100">
              Dividend Announcements & Ex-Date Alerts
            </h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-950/80 text-emerald-400 border border-emerald-800 font-mono">
              {stocksWithCountdown.length} Declared
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time track of cum-dividend deadlines, record cutoffs, and payment dates
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Action: Add to Calendar */}
          <button
            onClick={() => downloadDividendCalendarICS(stocks)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-900 border border-slate-700 text-slate-200 hover:bg-slate-800 hover:text-white transition-colors"
            title="Download .ics file for Google / Apple Calendar"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            Sync Calendar (.ics)
          </button>

          {/* Action: Enable Notifications */}
          <button
            onClick={requestBrowserNotification}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors"
          >
            <Bell className="w-3.5 h-3.5 text-emerald-400" />
            Alerts
          </button>
        </div>
      </div>

      {notificationStatus && (
        <div className="mt-3 p-2.5 rounded-lg bg-slate-800/90 border border-cyan-500/40 text-xs text-cyan-300 flex items-center justify-between">
          <span>{notificationStatus}</span>
          <button
            onClick={() => setNotificationStatus(null)}
            className="text-slate-400 hover:text-slate-200"
          >
            ×
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 my-4">
        <button
          onClick={() => setFilterMode('imminent')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'imminent'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Imminent ({imminentStocks.length} within 14d)
        </button>
        <button
          onClick={() => setFilterMode('all')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
            filterMode === 'all'
              ? 'bg-slate-800 text-emerald-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          All Announcements ({stocksWithCountdown.length})
        </button>
        <button
          onClick={() => setFilterMode('alerts')}
          className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
            filterMode === 'alerts'
              ? 'bg-slate-800 text-amber-400 border border-slate-700'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          Active Alerts ({alerts.length})
        </button>
      </div>

      {/* Alert Feed View */}
      {filterMode === 'alerts' ? (
        <div className="space-y-2">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-xs text-slate-500">
              No pending alerts. You will be notified when ex-dates near or yields spike.
            </div>
          ) : (
            alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 rounded bg-amber-500/10 text-amber-400 mt-0.5">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-100">
                        {alert.ticker}
                      </span>
                      <span className="text-xs text-slate-300 font-medium">{alert.title}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{alert.message}</p>
                    <span className="text-[10px] text-slate-500 font-mono mt-1 block">
                      {alert.date}
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => onDismissAlert(alert.id)}
                  className="p-1 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-800 text-xs"
                  title="Dismiss alert"
                >
                  <CheckCircle className="w-4 h-4" />
                </button>
              </div>
            ))
          )}
        </div>
      ) : (
        /* Announcements Cards / Table */
        <div className="space-y-2.5">
          {displayedStocks.map((stock) => {
            const up = stock.upcomingDividend;
            const isVeryClose = stock.daysToExDate <= 3;
            const isPast = stock.daysToExDate < 0;

            return (
              <div
                key={stock.ticker}
                onClick={() => onSelectStock(stock)}
                className="group flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-900/60 border border-slate-800 hover:border-emerald-500/40 hover:bg-slate-800/60 transition-all cursor-pointer"
              >
                {/* Stock Info */}
                <div className="flex items-center gap-3">
                  <div className="w-16 shrink-0">
                    <span className="font-mono text-xs font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">
                      {stock.ticker}
                    </span>
                    <span className="block text-[10px] text-slate-500">
                      S${stock.price.toFixed(3)}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-100">{stock.name}</h4>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                      <span className="text-emerald-400 font-bold font-mono">
                        {stock.yieldPercent.toFixed(2)}% Yield
                      </span>
                      <span>·</span>
                      <span className="font-mono">Next DPS: S${up.amount.toFixed(4)}</span>
                      <span>·</span>
                      <span>{up.distributionType}</span>
                      {up.scripScheme && (
                        <span className="text-[10px] text-cyan-400 bg-cyan-950/70 border border-cyan-800/80 px-1.5 py-0.2 rounded">
                          Scrip Option ({up.scripDiscountPercent || 0}% Disc)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Ex-Date Countdown & Milestone Strip */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-800">
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">Ex-Dividend Date</span>
                    <span className="font-mono text-xs font-semibold text-slate-200">
                      {up.exDate}
                    </span>
                  </div>

                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-400 block">Payout Date</span>
                    <span className="font-mono text-xs text-slate-400">
                      {up.paymentDate}
                    </span>
                  </div>

                  {/* Countdown Badge */}
                  <div className="shrink-0">
                    {isPast ? (
                      <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 text-slate-400 border border-slate-700">
                        Passed
                      </span>
                    ) : isVeryClose ? (
                      <span className="px-2.5 py-1 text-xs font-mono font-bold rounded bg-rose-950 text-rose-300 border border-rose-800 animate-pulse flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {stock.daysToExDate === 0 ? 'Today!' : `${stock.daysToExDate}d left`}
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800/90 text-emerald-400 border border-slate-700 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-500" />
                        {stock.daysToExDate} days
                      </span>
                    )}
                  </div>

                  <div className="text-slate-500 group-hover:text-slate-200 transition-colors hidden sm:block">
                    <ChevronRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Note */}
      <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <span>To qualify for dividend payout, shares must be purchased before the Ex-Dividend Date.</span>
        <span className="font-mono text-slate-400">T+2 Settlement Rule</span>
      </div>
    </div>
  );
};
