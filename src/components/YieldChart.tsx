import { ArrowUpRight } from 'lucide-react';
import type { BSEStock } from '../types/bse';
import { availableYield, percent } from '../lib/format';
import { EmptyState, Panel } from './ui';

export function YieldChart({ stocks, loading, onSelect }: { stocks: BSEStock[]; loading: boolean; onSelect: (stock: BSEStock) => void }) {
  const ranked = stocks.filter(s => availableYield(s) !== null).sort((a, b) => availableYield(b)! - availableYield(a)!).slice(0, 8);
  const max = Math.max(1, ...ranked.map(s => availableYield(s)!));
  return <Panel title="The yield leaders" subtitle="Trailing 12-month cash dividend yield · selected watchlist" action={<span className="small-tag">TOP {ranked.length || '—'}</span>}>
    {!ranked.length ? <EmptyState loading={loading} title={loading ? 'Finding sourced dividend yields' : 'No covered yields available'} description="Rankings appear only when both a usable quote and provider-covered trailing dividends are available. Missing values are never ranked as zero." /> : <div className="yield-chart" role="img" aria-label="Top eight stocks by provider-covered trailing dividend yield">{ranked.map((stock, index) => <button className="chart-row" key={stock.bseCode} onClick={() => onSelect(stock)} aria-label={`${stock.name}, ${percent(availableYield(stock))}. View details.`}><span className="chart-rank">{String(index + 1).padStart(2, '0')}</span><span className="chart-label"><strong>{stock.ticker}</strong><span>{stock.name}</span></span><span className="chart-track"><span style={{ width: `${availableYield(stock)! / max * 100}%` }} className={`chart-bar ${index === 0 ? 'chart-bar-first' : ''}`} /></span><strong className="chart-value">{percent(availableYield(stock))}</strong><ArrowUpRight size={14} className="chart-arrow" /></button>)}</div>}
    <div className="panel-footnote"><span className="emerald-dot" />Yield is historical, not a forecast. A higher yield is not a safety rating.</div>
  </Panel>;
}
