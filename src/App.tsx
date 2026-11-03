import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, ArrowUpRight, BarChart3, BriefcaseBusiness, CalendarDays, Check, Clock3, Database, Download, ExternalLink, History, Info, ListOrdered, RefreshCw, TrendingUp, WifiOff } from 'lucide-react';
import type { BSEStock } from './types/bse';
import { availableYield, dateLabel, finite, money, percent, setupUrl } from './lib/format';
import { useSnapshot } from './hooks/useSnapshot';
import { Badge, EmptyState, Panel } from './components/ui';
import { YieldChart } from './components/YieldChart';
import { StockTable } from './components/StockTable';
import { DividendPage, StockDetail, dividendEvents } from './components/Dividends';
import { Portfolio, holdingMetrics, useHoldings } from './components/Portfolio';
import { ExportReport, PrintableReport } from './components/ExportReport';

type Tab = 'dashboard' | 'current' | 'past' | 'rankings' | 'portfolio';
const tabs = [
  { id: 'dashboard', label: 'Dashboard', mobile: 'Overview', icon: BarChart3 },
  { id: 'current', label: 'Current Dividends', mobile: 'Current', icon: CalendarDays },
  { id: 'past', label: 'Past Dividends', mobile: 'History', icon: History },
  { id: 'rankings', label: 'Yield Rankings', mobile: 'Rankings', icon: ListOrdered },
  { id: 'portfolio', label: 'Portfolio Planner', mobile: 'Portfolio', icon: BriefcaseBusiness },
] as const;
const hashTab = (): Tab => tabs.some(t => t.id === location.hash.slice(1)) ? location.hash.slice(1) as Tab : 'dashboard';

export default function App() {
  const { snapshot, loading, error, refresh, transport, autoRefresh, setAutoRefresh, canAutoRefresh } = useSnapshot();
  const { holdings, setHoldings, storageError } = useHoldings();
  const [tab, setTab] = useState<Tab>(hashTab);
  const [selected, setSelected] = useState<BSEStock | null>(null);
  const [addStock, setAddStock] = useState<BSEStock | null>(null);
  const [exportOpen, setExportOpen] = useState(false);
  const closeDetail = useCallback(() => setSelected(null), []);
  const closeExport = useCallback(() => setExportOpen(false), []);
  const stocks = snapshot?.stocks || [];
  const rankable = snapshot?.status === 'unavailable' ? [] : stocks.filter(s => availableYield(s) !== null).sort((a, b) => availableYield(b)! - availableYield(a)!);
  const top = rankable[0];
  const average = rankable.length ? rankable.reduce((sum, s) => sum + availableYield(s)!, 0) / rankable.length : null;
  const quoted = stocks.filter(s => s.dataStatus !== 'unavailable' && finite(s.price) && s.price > 0).length;
  const income = holdingMetrics(holdings, stocks);
  const events = dividendEvents(stocks, 'current');
  const status = snapshot?.status || 'unavailable';
  const nav = (next: Tab) => { setAddStock(null); setTab(next); history.replaceState(null, '', `#${next}`); window.scrollTo({ top: 0, behavior: 'smooth' }); };
  useEffect(() => { const handle = () => setTab(hashTab()); window.addEventListener('hashchange', handle); return () => window.removeEventListener('hashchange', handle); }, []);
  useEffect(() => { if (selected) { const updated = stocks.find(s => s.bseCode === selected.bseCode); if (updated && updated !== selected) setSelected(updated); } }, [snapshot]);
  const table = <StockTable stocks={stocks} snapshot={snapshot} loading={loading} onSelect={setSelected} />;
  const chart = <YieldChart stocks={snapshot?.status === 'unavailable' ? [] : stocks} loading={loading} onSelect={setSelected} />;

  return <><div className="app-shell no-print"><header className="site-header"><a className="brand" href="#dashboard" onClick={event => { event.preventDefault(); nav('dashboard'); }} aria-label="BSE High Yield dashboard"><span className="brand-mark">₹<i /></span><span>BSE <strong>High Yield</strong><small>DIVIDEND INTELLIGENCE</small></span></a><nav className="desktop-nav" aria-label="Main navigation">{tabs.map(t => <button key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => nav(t.id)}>{t.label}</button>)}</nav><button className="button button-primary header-export" onClick={() => setExportOpen(true)}><Download size={16} /><span>Export report</span></button></header>
    <div className="market-strip"><div className="market-place"><span className="market-dot" /><strong>BSE</strong><span>Mumbai market</span><span className="strip-divider" />INR · Asia/Kolkata</div><div className="market-context"><span>Selected dividend watchlist</span><span className="strip-divider" /><span>{transport}</span></div></div>
    <main className="main-content"><div className="page-heading"><div><div className="eyebrow">INDIAN EQUITIES <span>/</span> DIVIDEND RESEARCH</div><h1>{tab === 'dashboard' ? 'Income investing. Clearer.' : tabs.find(t => t.id === tab)?.label}</h1><p>{tab === 'dashboard' ? 'Explore dividend-paying BSE securities with transparent data, not assumptions.' : tab === 'portfolio' ? 'Turn sourced dividends into a plan based on your own holdings.' : tab === 'rankings' ? 'Compare only the yields supported by usable quotes and covered dividends.' : 'Follow the cash dividend records actually supplied by your provider.'}</p></div><div className="heading-controls"><button className="button button-secondary" disabled={loading} onClick={() => void refresh(true)}><RefreshCw size={15} className={loading ? 'spinning' : ''} />{loading ? 'Fetching data…' : 'Refresh quotes'}</button>{canAutoRefresh && <label className="auto-refresh"><input type="checkbox" checked={autoRefresh} onChange={e => setAutoRefresh(e.target.checked)} /><span>Auto refresh · 60s</span></label>}</div></div>
    <section className={`data-banner ${status !== 'live' || error ? 'data-banner-warning' : ''}`} aria-label="Data source status" aria-live="polite"><div className="data-banner-main"><span className="data-banner-icon">{status === 'unavailable' ? <WifiOff size={19} /> : <Clock3 size={19} />}</span><div><div className="data-banner-title"><Badge status={status} /><strong>{loading && !snapshot ? 'Connecting to the BSE data source' : status === 'unavailable' ? 'Quotes are not currently available' : `${transport} · ${snapshot?.provider || 'Provider unavailable'}`}</strong></div><p>{error || snapshot?.message || (loading ? 'Waiting for a valid snapshot. No sample data is used.' : 'A valid data feed is required before values can be displayed.')}</p></div></div><div className="snapshot-time"><span>SNAPSHOT AS OF</span><strong>{dateLabel(snapshot?.generatedAt, true)}</strong><a href={setupUrl} target="_blank" rel="noreferrer">Data source & setup <ArrowUpRight size={13} /></a></div></section>
    {(tab === 'dashboard' || tab === 'rankings') && <div className="metrics-row"><div className="metric-card metric-featured"><div className="metric-label">Highest covered yield<TrendingUp size={16} /></div><div className="metric-value text-emerald">{percent(top ? availableYield(top) : null)}{top && <span>{top.ticker}</span>}</div><p>{top?.name || 'Awaiting covered dividend data'}</p><span className="metric-caption">Trailing 12 months · not a forecast</span></div><div className="metric-card"><div className="metric-label">Watchlist average<BarChart3 size={16} /></div><div className="metric-value">{percent(average)}</div><p>{rankable.length ? `Across ${rankable.length} securities with covered yields` : 'No covered yields to average'}</p><span className="metric-caption">Not a BSE-wide market average</span></div><div className="metric-card"><div className="metric-label">Available quotes<Database size={16} /></div><div className="metric-value">{loading && !snapshot ? '—' : quoted}<span className="metric-denominator">/ {stocks.length}</span></div><p>Selected securities with usable prices</p><span className="metric-caption">See each quote’s status and timestamp</span></div><button className="metric-card metric-clickable" onClick={() => nav('portfolio')}><div className="metric-label">Your estimated income<BriefcaseBusiness size={16} /></div><div className="metric-value metric-money">{holdings.length ? money(income.income) : '—'}<ArrowUpRight size={18} /></div><p>{holdings.length ? `${income.covered} of ${holdings.length} holdings covered · pre-tax` : 'Add your own holdings to begin'}</p><span className="metric-caption">Annual TTM-based portfolio estimate</span></button></div>}
    {tab === 'dashboard' && <><div className="dashboard-split">{chart}<div className="insight-column"><section className="methodology-card"><div className="eyebrow"><Info size={14} /> THE YIELD, EXPLAINED</div><h2>Past income.<br /><span>Not a future promise.</span></h2><div className="formula"><span>TTM cash dividends / share</span><div /><strong>Latest share price</strong><span className="formula-multiplier">× 100</span></div><p>We use the provider’s covered TTM figures. Incomplete dividend history is never summed into an invented annual yield.</p><a href={setupUrl} target="_blank" rel="noreferrer">Read the methodology <ArrowUpRight size={14} /></a></section><Panel title="Next dividend dates" action={<CalendarDays size={17} className="text-muted" />} className="upcoming-panel">{events.length ? <div className="upcoming-list">{events.slice(0, 3).map(({ stock, dividend }, i) => <button key={`${stock.bseCode}-${i}`} onClick={() => setSelected(stock)}><span><strong>{stock.ticker}</strong><small>{dateLabel(dividend.date)}</small></span><strong className="mono text-emerald">{money(dividend.amount)}</strong></button>)}</div> : <div className="small-empty"><CalendarDays size={22} /><div><strong>No confirmed dates supplied</strong><p>Future events are not inferred from past payouts.</p></div></div>}<button className="panel-link" onClick={() => nav('current')}>View current dividends <ArrowRight size={14} /></button></Panel></div></div>{table}</>}
    {tab === 'rankings' && <>{table}{chart}</>}
    {(tab === 'current' || tab === 'past') && <DividendPage mode={tab} stocks={stocks} snapshot={snapshot} onSelect={setSelected} />}
    {tab === 'portfolio' && <Portfolio stocks={stocks} snapshot={snapshot} holdings={holdings} onUpdate={setHoldings} initialStock={addStock} storageError={storageError} />}
    <section className="disclosure"><Info size={16} /><p><strong>Research with context.</strong> Prices may be delayed or stale. Historical dividends do not guarantee future income; high yield is not a quality or safety score. {snapshot?.methodology || 'Yield uses provider-covered TTM cash dividends divided by the latest price. Missing information is shown as —.'}</p></section>
    </main><footer className="site-footer"><div className="footer-top"><div className="footer-brand"><span className="mini-brand">₹</span><strong>BSE High Yield</strong><span>Selected watchlist · Indian equities</span></div><a href={setupUrl} target="_blank" rel="noreferrer">Data sources & setup <ExternalLink size={13} /></a></div><p>Dividends are subject to Indian income-tax and TDS rules, depending on personal circumstances. All portfolio income estimates are pre-tax. This is not investment or tax advice. BSE High Yield is an independent research tool, not an official BSE service.</p></footer><nav className="mobile-nav" aria-label="Mobile navigation">{tabs.map(t => <button key={t.id} className={tab === t.id ? 'active' : ''} aria-current={tab === t.id ? 'page' : undefined} onClick={() => nav(t.id)}><t.icon size={19} strokeWidth={1.7} /><span>{t.mobile}</span></button>)}</nav></div>
    {selected && <StockDetail stock={selected} onClose={closeDetail} onAdd={stock => { setSelected(null); setAddStock(stock); setTab('portfolio'); history.replaceState(null, '', '#portfolio'); window.scrollTo({ top: 0, behavior: 'smooth' }); }} />}
    {exportOpen && <ExportReport stocks={stocks} snapshot={snapshot} holdings={holdings} onClose={closeExport} />}
    <PrintableReport snapshot={snapshot} stocks={stocks} holdings={holdings} />
  </>;
}
