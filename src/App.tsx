/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SGXStock, MarketMetrics, AlertItem, UserHolding, BiometricProfile } from './types/sgx';
import { INITIAL_SGX_STOCKS, INITIAL_MARKET_METRICS } from './data/sgxStocks';
import { YieldRankingChart } from './components/YieldRankingChart';
import { HistoricalPayoutView } from './components/HistoricalPayoutView';
import { UpcomingDividendsAlerts } from './components/UpcomingDividendsAlerts';
import { StockLeaderboardTable } from './components/StockLeaderboardTable';
import { PortfolioSimulator } from './components/PortfolioSimulator';
import { BiometricSecurityModal } from './components/BiometricSecurityModal';
import { ReportExportModal } from './components/ReportExportModal';
import { PrintableDossier } from './components/PrintableDossier';
import { PastDividendsPage } from './components/PastDividendsPage';
import { CurrentProposedDividendsPage } from './components/CurrentProposedDividendsPage';
import { getBiometricProfile, saveBiometricProfile } from './services/biometrics';
import {
  TrendingUp,
  TrendingDown,
  Calendar,
  Shield,
  Lock,
  Unlock,
  RefreshCw,
  Download,
  DollarSign,
  BarChart3,
  ListOrdered,
  Bell,
  Briefcase,
  ExternalLink,
  Flame,
  Award,
  Layers,
  ArrowRight,
  History
} from 'lucide-react';

const STORAGE_HOLDINGS_KEY = 'lionyield_user_holdings';

export default function App() {
  const [stocks, setStocks] = useState<SGXStock[]>(INITIAL_SGX_STOCKS);
  const [marketMetrics, setMarketMetrics] = useState<MarketMetrics>(INITIAL_MARKET_METRICS);
  const [selectedStock, setSelectedStock] = useState<SGXStock>(INITIAL_SGX_STOCKS[0]);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposed' | 'past' | 'leaderboard' | 'portfolio'>('overview');
  const [isLiveActive, setIsLiveActive] = useState<boolean>(true);
  const [lastTickTime, setLastTickTime] = useState<Date>(new Date());
  const [isApiLoading, setIsApiLoading] = useState<boolean>(false);
  const [apiStatus, setApiStatus] = useState<{
    connected: boolean;
    source: string;
    lastSynced: string | null;
    quoteCount: number;
  }>({
    connected: true,
    source: 'SGX Market API',
    lastSynced: null,
    quoteCount: 0,
  });

  // Biometrics & Security
  const [biometricProfile, setBiometricProfile] = useState<BiometricProfile>(getBiometricProfile());
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [authReason, setAuthReason] = useState<string>('Authenticate to unlock vault');
  const [postAuthCallback, setPostAuthCallback] = useState<(() => void) | null>(null);

  // Reports
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);

  // Portfolio Holdings
  const [holdings, setHoldings] = useState<UserHolding[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_HOLDINGS_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return [
      { ticker: 'D05', shares: 1000, averagePriceSGD: 65.2 },
      { ticker: 'C38U', shares: 10000, averagePriceSGD: 2.25 },
      { ticker: 'CJLU', shares: 15000, averagePriceSGD: 0.91 },
      { ticker: 'O39', shares: 2000, averagePriceSGD: 26.5 },
    ];
  });

  // Save holdings changes
  useEffect(() => {
    localStorage.setItem(STORAGE_HOLDINGS_KEY, JSON.stringify(holdings));
  }, [holdings]);

  // Alerts
  const [alerts, setAlerts] = useState<AlertItem[]>([
    {
      id: 'a1',
      ticker: 'N2IU',
      stockName: 'Mapletree Pan Asia Commercial Trust',
      title: 'Ex-Dividend Countdown: 2 Days Left',
      message: 'Ex-Dividend date is 04 Nov 2026. Next distribution is S$0.0205/share.',
      date: '2026-11-01',
      type: 'ex_date',
      read: false,
      daysRemaining: 2,
    },
    {
      id: 'a2',
      ticker: 'CWBU',
      stockName: 'Keppel Pacific Oak US REIT',
      title: 'High Yield Alert: 8.74%',
      message: 'CWBU dividend yield is 8.74% with 0% individual Singapore withholding tax.',
      date: '2026-10-30',
      type: 'yield_spike',
      read: false,
    },
    {
      id: 'a3',
      ticker: 'O39',
      stockName: 'Oversea-Chinese Banking Corp',
      title: 'Scrip Dividend Scheme Announced',
      message: 'OCBC offers 2% discount on scrip dividend reinvestment for upcoming S$0.88 DPS.',
      date: '2026-10-29',
      type: 'announcement',
      read: false,
    },
  ]);

  // Function to fetch live SGX prices from our backend API proxy
  const fetchLiveSGXPrices = async (force = false) => {
    setIsApiLoading(true);
    try {
      const res = await fetch(`/api/sgx/live-prices${force ? '?force=true' : ''}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const payload = await res.json();
      
      if (payload.success && payload.data) {
        const quotes = payload.data;
        let count = 0;

        setStocks((prevStocks) => {
          return prevStocks.map((stock) => {
            const quote = quotes[stock.ticker];
            if (!quote || typeof quote.price !== 'number') return stock;
            count++;
            
            const livePrice = quote.price;
            const liveYield = Number(((stock.dpsAnnual / livePrice) * 100).toFixed(2));

            return {
              ...stock,
              price: livePrice,
              dayChange: quote.dayChange ?? stock.dayChange,
              dayChangePercent: quote.dayChangePercent ?? stock.dayChangePercent,
              fiftyTwoWeekHigh: quote.fiftyTwoWeekHigh ?? stock.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: quote.fiftyTwoWeekLow ?? stock.fiftyTwoWeekLow,
              yieldPercent: liveYield,
            };
          });
        });

        // Update STI index if returned
        if (quotes['^STI'] && typeof quotes['^STI'].price === 'number') {
          const sti = quotes['^STI'];
          setMarketMetrics((prev) => ({
            ...prev,
            stiLevel: sti.price,
            stiChange: sti.dayChange ?? prev.stiChange,
            stiChangePercent: sti.dayChangePercent ?? prev.stiChangePercent,
            lastUpdated: payload.timestamp || new Date().toISOString(),
          }));
        }

        setApiStatus({
          connected: true,
          source: 'SGX Official Market Feed',
          lastSynced: new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          quoteCount: count,
        });
        setLastTickTime(new Date());
      }
    } catch (err) {
      console.warn('Live SGX API sync notice:', err);
      setApiStatus((prev) => ({
        ...prev,
        connected: false,
      }));
    } finally {
      setIsApiLoading(false);
    }
  };

  // Initial live price fetch on app load
  useEffect(() => {
    fetchLiveSGXPrices(true);
  }, []);

  // Periodic Live API background auto-sync every 15 seconds when live is active
  useEffect(() => {
    if (!isLiveActive) return;
    const interval = setInterval(() => {
      fetchLiveSGXPrices(false);
    }, 15000);
    return () => clearInterval(interval);
  }, [isLiveActive]);

  const handleDismissAlert = (id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const promptBiometricAuth = (reason: string, onSuccess?: () => void) => {
    setAuthReason(reason);
    if (onSuccess) setPostAuthCallback(() => onSuccess);
    setIsBiometricModalOpen(true);
  };

  const handleToggleVaultLock = () => {
    if (biometricProfile.isLocked) {
      promptBiometricAuth('Authenticate with Touch ID, Face ID, or PIN to unlock vault');
    } else {
      const updated = { ...biometricProfile, isLocked: true };
      setBiometricProfile(updated);
      saveBiometricProfile(updated);
    }
  };

  // Top statistics
  const topYieldStock = [...stocks].sort((a, b) => b.yieldPercent - a.yieldPercent)[0];
  const avgSgxYield = (stocks.reduce((acc, s) => acc + s.yieldPercent, 0) / stocks.length).toFixed(2);
  const totalUpcomingEx = stocks.filter((s) => s.upcomingDividend.declared).length;

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      {/* Printable Dossier (visible strictly in @media print) */}
      <PrintableDossier stocks={stocks} marketMetrics={marketMetrics} />

      {/* Strict 1-Row 3-Zone Top Bar Contract */}
      <header className="no-print flex items-center justify-between gap-8 px-4 sm:px-8 py-3.5 border-b border-slate-800 bg-[#0B0F17]/95 backdrop-blur-md sticky top-0 z-40">
        {/* Zone 1: Single text element wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold font-mono">
            S$
          </div>
          <span className="text-base font-bold tracking-tight text-slate-100 whitespace-nowrap shrink-0">
            LionYield SGX
          </span>
        </div>

        {/* Zone 2: 4-5 single-line clean text nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-slate-400">
          <button
            onClick={() => setActiveTab('overview')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeTab === 'overview' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('proposed')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 flex items-center gap-1.5 ${
              activeTab === 'proposed' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            <span>Current Dividends</span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
              Live
            </span>
          </button>
          <button
            onClick={() => setActiveTab('past')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeTab === 'past' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Past Dividends
          </button>
          <button
            onClick={() => setActiveTab('leaderboard')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeTab === 'leaderboard' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Yield Rankings
          </button>
          <button
            onClick={() => setActiveTab('portfolio')}
            className={`transition-colors whitespace-nowrap shrink-0 hover:text-slate-100 ${
              activeTab === 'portfolio' ? 'text-emerald-400 font-semibold' : ''
            }`}
          >
            Portfolio Planner
          </button>
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Export Report CTA */}
          <button
            onClick={() => setIsExportModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>

          {/* Biometric Vault Lock Icon */}
          <button
            onClick={handleToggleVaultLock}
            className={`p-2 rounded-lg border transition-colors ${
              biometricProfile.isLocked
                ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                : 'bg-slate-900 border-slate-700 text-slate-300 hover:text-white'
            }`}
            title={biometricProfile.isLocked ? 'Vault is Locked (Click to Unlock)' : 'Vault Unlocked (Click to Secure)'}
          >
            {biometricProfile.isLocked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4 text-emerald-400" />}
          </button>
        </div>
      </header>

      {/* Sub-Header SGX Live Market Ticker Strip */}
      <div className="no-print bg-slate-950 border-b border-slate-800/80 px-4 sm:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-3 font-mono">
        <div className="flex flex-wrap items-center gap-4 text-slate-300">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 text-[11px]">SGX MARKET:</span>
            <span className="font-bold text-slate-100">STI {marketMetrics.stiLevel.toFixed(2)}</span>
            <span
              className={`text-[11px] ${
                marketMetrics.stiChange >= 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {marketMetrics.stiChange >= 0 ? '+' : ''}
              {marketMetrics.stiChange.toFixed(2)} ({marketMetrics.stiChangePercent >= 0 ? '+' : ''}
              {marketMetrics.stiChangePercent}%)
            </span>
          </div>

          <span className="text-slate-700 hidden sm:inline">|</span>

          {/* Real-Time API Connection Badge */}
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-[11px]">
            <span
              className={`w-2 h-2 rounded-full ${
                apiStatus.connected ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
              }`}
            />
            <span className="text-slate-300">
              API: {apiStatus.connected ? 'Live SGX (.SI) Feed' : 'Offline Buffer'}
            </span>
            {apiStatus.lastSynced && (
              <span className="text-slate-500 hidden sm:inline">
                · Synced {apiStatus.lastSynced}
              </span>
            )}
          </div>

          <span className="text-slate-700 hidden md:inline">|</span>

          <div className="hidden md:flex items-center gap-1.5 text-slate-400 text-[11px]">
            <Shield className="w-3.5 h-3.5 text-emerald-400" />
            <span>0% Singapore Individual Dividend Withholding Tax</span>
          </div>
        </div>

        {/* Live Feed Toggle & Force Refresh Button */}
        <div className="flex items-center gap-2 ml-auto text-[11px] text-slate-400">
          <button
            onClick={() => fetchLiveSGXPrices(true)}
            disabled={isApiLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-slate-200 hover:text-white hover:border-slate-600 transition-colors disabled:opacity-50"
            title="Fetch latest live prices immediately from SGX Yahoo Finance API"
          >
            <RefreshCw className={`w-3 h-3 text-cyan-400 ${isApiLoading ? 'animate-spin' : ''}`} />
            <span>{isApiLoading ? 'Fetching Live...' : 'Fetch Live Prices'}</span>
          </button>

          <button
            onClick={() => setIsLiveActive(!isLiveActive)}
            className={`flex items-center gap-1.5 px-2 py-1 rounded text-[11px] transition-colors ${
              isLiveActive
                ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-800'
                : 'bg-slate-900 text-slate-400 border border-slate-800'
            }`}
            title="Toggle Live Ticks Simulation"
          >
            <span>{isLiveActive ? 'Auto-Sync On' : 'Auto-Sync Off'}</span>
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="no-print flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Top Summary KPI Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          {/* Top Yielding Stock */}
          <div
            onClick={() => {
              setSelectedStock(topYieldStock);
              setActiveTab('past');
            }}
            className="group bg-[#111827] border border-slate-800 hover:border-emerald-500/40 rounded-xl p-4 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Top SGX Yield</span>
              <Flame className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-emerald-400">
                {topYieldStock.yieldPercent.toFixed(2)}%
              </span>
              <span className="text-xs font-mono font-bold text-slate-300">
                {topYieldStock.ticker}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 truncate mt-1">
              {topYieldStock.name}
            </p>
          </div>

          {/* Average Yield */}
          <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-md">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Average High-Yield</span>
              <BarChart3 className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-slate-100">
                {avgSgxYield}%
              </span>
              <span className="text-xs text-emerald-400 font-mono font-medium">
                +{(Number(avgSgxYield) - marketMetrics.sgs10YearBondYield).toFixed(2)}% Spread
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Across 20 Blue-Chip SGX Issuers
            </p>
          </div>

          {/* Upcoming Announcements */}
          <div
            onClick={() => setActiveTab('proposed')}
            className="group bg-[#111827] border border-slate-800 hover:border-cyan-500/40 rounded-xl p-4 cursor-pointer transition-all shadow-md"
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Proposed & Ex-Dates</span>
              <Calendar className="w-4 h-4 text-sky-400" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black font-mono text-sky-400">
                {totalUpcomingEx} Declared
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1 group-hover:text-sky-300">
              <span>Next: N2IU in 2 days</span>
              <ArrowRight className="w-3 h-3" />
            </p>
          </div>

          {/* Biometric Vault Status */}
          <div
            onClick={handleToggleVaultLock}
            className={`group border rounded-xl p-4 cursor-pointer transition-all shadow-md ${
              biometricProfile.isLocked
                ? 'bg-rose-950/30 border-rose-800/80'
                : 'bg-[#111827] border-slate-800 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
              <span>Biometric Vault</span>
              {biometricProfile.isLocked ? (
                <Lock className="w-4 h-4 text-rose-400" />
              ) : (
                <Shield className="w-4 h-4 text-emerald-400" />
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span
                className={`text-xl font-bold font-mono ${
                  biometricProfile.isLocked ? 'text-rose-400' : 'text-emerald-400'
                }`}
              >
                {biometricProfile.isLocked ? 'SECURE LOCKED' : 'VAULT ACTIVE'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              {biometricProfile.isLocked ? 'Tap to authenticate' : 'WebAuthn Protected'}
            </p>
          </div>
        </div>

        {/* Tab-driven View Switching */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Visual Yield Ranking Chart */}
            <YieldRankingChart
              stocks={stocks}
              selectedStock={selectedStock}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setActiveTab('past');
              }}
              sgsYield={marketMetrics.sgs10YearBondYield}
              stiAverageYield={marketMetrics.averageSgxYield}
            />

            {/* Split Row: 5-Year Deep Dive on Selected Stock & Upcoming Ex-Dates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
              <div className="lg:col-span-2">
                <HistoricalPayoutView stock={selectedStock} />
              </div>
              <div className="lg:col-span-1">
                <UpcomingDividendsAlerts
                  stocks={stocks}
                  onSelectStock={(stock) => {
                    setSelectedStock(stock);
                    setActiveTab('past');
                  }}
                  alerts={alerts}
                  onDismissAlert={handleDismissAlert}
                  onViewProposedTabs={() => setActiveTab('proposed')}
                />
              </div>
            </div>

            {/* Comprehensive Stock Leaderboard Table */}
            <StockLeaderboardTable
              stocks={stocks}
              selectedStock={selectedStock}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setActiveTab('past');
              }}
            />
          </div>
        )}

        {/* SUB PAGE: Current Share Prices & Proposed Dividends */}
        {activeTab === 'proposed' && (
          <div className="space-y-6">
            <CurrentProposedDividendsPage
              stocks={stocks}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setActiveTab('past');
              }}
              onRefreshLivePrices={() => fetchLiveSGXPrices(true)}
              isApiLoading={isApiLoading}
              lastSyncedTime={apiStatus.lastSynced}
            />
          </div>
        )}

        {/* SUB PAGE: Past Dividends Ledger & Historical Deep-Dive */}
        {activeTab === 'past' && (
          <div className="space-y-6">
            <PastDividendsPage
              stocks={stocks}
              onSelectStock={(stock) => setSelectedStock(stock)}
            />
            {/* Deep-Dive View on Selected Stock */}
            <HistoricalPayoutView stock={selectedStock} />
          </div>
        )}

        {activeTab === 'leaderboard' && (
          <div className="space-y-6">
            <StockLeaderboardTable
              stocks={stocks}
              selectedStock={selectedStock}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setActiveTab('past');
              }}
            />
            <YieldRankingChart
              stocks={stocks}
              selectedStock={selectedStock}
              onSelectStock={(stock) => {
                setSelectedStock(stock);
                setActiveTab('past');
              }}
              sgsYield={marketMetrics.sgs10YearBondYield}
              stiAverageYield={marketMetrics.averageSgxYield}
            />
          </div>
        )}

        {activeTab === 'portfolio' && (
          <div className="space-y-6">
            <PortfolioSimulator
              stocks={stocks}
              holdings={holdings}
              onUpdateHoldings={setHoldings}
              isUnlocked={!biometricProfile.isLocked}
              onRequireAuth={() =>
                promptBiometricAuth('Authenticate to reveal portfolio balances and cash flow models')
              }
            />
          </div>
        )}
      </main>

      {/* Mobile-Responsive Bottom Navigation Bar */}
      <nav className="no-print md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#0B0F17]/95 backdrop-blur-md border-t border-slate-800 px-2 py-2 flex items-center justify-around text-[10px]">
        <button
          onClick={() => setActiveTab('overview')}
          className={`flex flex-col items-center gap-1 p-1 rounded-md transition-colors ${
            activeTab === 'overview' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Dashboard</span>
        </button>

        <button
          onClick={() => setActiveTab('proposed')}
          className={`flex flex-col items-center gap-1 p-1 rounded-md transition-colors ${
            activeTab === 'proposed' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Proposed</span>
        </button>

        <button
          onClick={() => setActiveTab('past')}
          className={`flex flex-col items-center gap-1 p-1 rounded-md transition-colors ${
            activeTab === 'past' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past</span>
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`flex flex-col items-center gap-1 p-1 rounded-md transition-colors ${
            activeTab === 'leaderboard' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <ListOrdered className="w-4 h-4" />
          <span>Ranks</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex flex-col items-center gap-1 p-1 rounded-md transition-colors ${
            activeTab === 'portfolio' ? 'text-emerald-400 font-semibold' : 'text-slate-400'
          }`}
        >
          <Briefcase className="w-4 h-4" />
          <span>Planner</span>
        </button>
      </nav>

      {/* Footer */}
      <footer className="no-print mt-auto border-t border-slate-900 bg-[#0B0F17] py-6 px-4 sm:px-8 text-center text-xs text-slate-500 pb-16 md:pb-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <p>
            LionYield SGX Dividend Intelligence · Real-time market analytics for Singapore Exchange securities.
          </p>
          <p className="text-[11px] text-slate-400">
            Singapore One-Tier Corporate Tax System (0% Withholding Tax on Dividends)
          </p>
        </div>
      </footer>

      {/* Biometric Security & Master PIN Modal */}
      <BiometricSecurityModal
        profile={biometricProfile}
        onUpdateProfile={setBiometricProfile}
        isOpen={isBiometricModalOpen}
        onClose={() => setIsBiometricModalOpen(false)}
        reason={authReason}
        onSuccess={() => {
          if (postAuthCallback) {
            postAuthCallback();
            setPostAuthCallback(null);
          }
        }}
      />

      {/* Exportable Reports Modal */}
      <ReportExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        stocks={stocks}
        marketMetrics={marketMetrics}
        isUnlocked={!biometricProfile.isLocked}
        onRequireAuth={() =>
          promptBiometricAuth(
            'Biometric verification required to export confidential financial reports',
            () => setIsExportModalOpen(true)
          )
        }
      />
    </div>
  );
}
