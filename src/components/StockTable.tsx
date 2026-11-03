import { useMemo, useState } from 'react';
import { ArrowDown, ArrowUpDown, ArrowUpRight, Search, SlidersHorizontal, Download } from 'lucide-react';
import type { BSEStock, Snapshot } from '../types/bse';
import { availableYield, change, dateLabel, finite, money, percent } from '../lib/format';
import { exportStocks } from '../lib/export';
import { Badge, EmptyState, Panel } from './ui';

type SortKey = 'yield' | 'price' | 'dividend' | 'change' | 'name';
export function StockTable({ stocks, snapshot, loading, onSelect }: { stocks: BSEStock[]; snapshot: Snapshot | null; loading: boolean; onSelect: (stock: BSEStock) => void }) {
  const [search, setSearch] = useState('');
  const [sector, setSector] = useState('All sectors');
  const [minimum, setMinimum] = useState('');
  const [coveredOnly, setCoveredOnly] = useState(false);
  const [sort, setSort] = useState<SortKey>('yield');
  const [ascending, setAscending] = useState(false);
  const sectors = [...new Set(stocks.map(s => s.sector))].sort();
  const value = (s: BSEStock, key: SortKey) => key === 'name' ? s.name : key === 'yield' ? availableYield(s) : key === 'dividend' ? s.dividendStatus === 'available' && s.dividendTTM !== null && s.dividendTTM >= 0 ? s.dividendTTM : null : key === 'change' ? s.dayChangePercent : s.price;
  const filtered = useMemo(() => stocks.filter(s => {
    const q = search.trim().toLowerCase(); const y = availableYield(s);
    return (!q || `${s.ticker} ${s.bseCode} ${s.name} ${s.isin || ''}`.toLowerCase().includes(q)) && (sector === 'All sectors' || s.sector === sector) && (!coveredOnly || y !== null) && (minimum === '' || y !== null && y >= Number(minimum));
  }).sort((a, b) => {
    const av = value(a, sort); const bv = value(b, sort);
    if (av === null) return bv === null ? 0 : 1;
    if (bv === null) return -1;
    return (ascending ? 1 : -1) * (typeof av === 'string' ? av.localeCompare(String(bv)) : av - Number(bv));
  }), [stocks, search, sector, minimum, coveredOnly, sort, ascending]);
  const ranking = new Map(stocks.filter(s => availableYield(s) !== null).sort((a, b) => availableYield(b)! - availableYield(a)!).map((s, i) => [s.bseCode, i + 1]));
  const toggleSort = (key: SortKey) => { if (sort === key) setAscending(!ascending); else { setSort(key); setAscending(key === 'name'); } };
  const sortHeading = (label: string, key: SortKey) => <button onClick={() => toggleSort(key)} className="sort-button">{label}{sort === key ? <ArrowDown size={12} style={{ transform: ascending ? 'rotate(180deg)' : undefined }} /> : <ArrowUpDown size={12} />}</button>;
  return <Panel title="BSE dividend watchlist" subtitle="Selected securities, not the full BSE market. Click a company to inspect its records." action={<button className="button button-quiet" disabled={!filtered.length} onClick={() => exportStocks(filtered, snapshot)}><Download size={14} /><span>Export CSV</span></button>} className="table-panel">
    <div className="table-controls"><label className="search-field"><Search size={17} /><input value={search} onChange={event => setSearch(event.target.value)} placeholder="Search company, ticker or BSE code" aria-label="Search company, ticker or BSE code" />{search && <button aria-label="Clear search" onClick={() => setSearch('')}>×</button>}</label><div className="table-filters"><SlidersHorizontal size={15} /><select aria-label="Filter by sector" value={sector} onChange={event => setSector(event.target.value)}><option>All sectors</option>{sectors.map(s => <option key={s}>{s}</option>)}</select><select aria-label="Minimum dividend yield" value={minimum} onChange={event => setMinimum(event.target.value)}><option value="">Any yield</option><option value="2">Yield ≥ 2%</option><option value="4">Yield ≥ 4%</option><option value="6">Yield ≥ 6%</option></select><button className={`filter-chip ${coveredOnly ? 'active' : ''}`} aria-pressed={coveredOnly} onClick={() => setCoveredOnly(!coveredOnly)}>Covered yields only</button></div></div>
    <div className="table-scroll"><table className="stock-table"><thead><tr><th>Rank</th><th aria-sort={sort === 'name' ? ascending ? 'ascending' : 'descending' : 'none'}>{sortHeading('Company / BSE code', 'name')}</th><th className="numeric" aria-sort={sort === 'price' ? ascending ? 'ascending' : 'descending' : 'none'}>{sortHeading('Price · INR', 'price')}</th><th className="numeric" aria-sort={sort === 'change' ? ascending ? 'ascending' : 'descending' : 'none'}>{sortHeading('Day change', 'change')}</th><th className="numeric" aria-sort={sort === 'yield' ? ascending ? 'ascending' : 'descending' : 'none'}>{sortHeading('TTM yield', 'yield')}</th><th className="numeric" aria-sort={sort === 'dividend' ? ascending ? 'ascending' : 'descending' : 'none'}>{sortHeading('TTM dividend', 'dividend')}</th><th>Quote / source</th><th aria-label="Details" /></tr></thead><tbody>{filtered.map(stock => <tr key={stock.bseCode}><td className="rank-cell">{ranking.has(stock.bseCode) ? String(ranking.get(stock.bseCode)).padStart(2, '0') : '—'}</td><td><button className="company-link" onClick={() => onSelect(stock)}><strong>{stock.ticker}<span className="bse-code">{stock.bseCode}</span></strong><span>{stock.name}</span><small>{stock.sector}</small></button></td><td className="numeric mono"><strong>{stock.price !== null && stock.price >= 0 ? money(stock.price) : '—'}</strong></td><td className={`numeric mono ${finite(stock.dayChangePercent) ? stock.dayChangePercent >= 0 ? 'text-emerald' : 'text-rose' : 'text-muted'}`}><span>{change(stock.dayChangePercent)}</span><small className="secondary-number">{money(stock.dayChange)}</small></td><td className="numeric mono"><strong className={availableYield(stock) !== null ? 'text-emerald yield-number' : 'text-muted'}>{percent(availableYield(stock))}</strong></td><td className="numeric mono">{money(stock.dividendStatus === 'available' && stock.dividendTTM !== null && stock.dividendTTM >= 0 ? stock.dividendTTM : null)}</td><td className="source-cell"><Badge status={stock.dataStatus} /><span>{dateLabel(stock.quoteAsOf, true)}</span><small>{stock.source}</small></td><td><button className="icon-button" aria-label={`View ${stock.name}`} onClick={() => onSelect(stock)}><ArrowUpRight size={17} /></button></td></tr>)}</tbody></table></div>
    {!filtered.length && <EmptyState compact loading={loading} title={loading ? 'Loading the watchlist' : stocks.length ? 'No matching securities' : 'Watchlist data unavailable'} description={stocks.length ? 'Try another search, sector or minimum yield. Securities with missing yields are excluded only when a yield filter is applied.' : 'The dashboard will populate after a valid BSE snapshot is received. No placeholder securities or invented prices are shown.'} />}
    <div className="table-footer"><span><strong>{filtered.length}</strong> of {stocks.length} securities</span><span>— = unavailable · TTM = trailing 12 months · all amounts in INR</span></div>
  </Panel>;
}
