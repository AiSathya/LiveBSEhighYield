import { useEffect, useMemo, useState } from 'react';
import { BriefcaseBusiness, Download, Pencil, Plus, Trash2, Info } from 'lucide-react';
import type { BSEStock, Holding, Snapshot } from '../types/bse';
import { finite, money, nonnegative, number } from '../lib/format';
import { exportHoldings } from '../lib/export';
import { Dialog, EmptyState, Panel } from './ui';

const STORAGE_KEY = 'bseyield-holdings';
export function useHoldings() {
  const [holdings, setHoldings] = useState<Holding[]>(() => {
    try {
      const saved: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
      if (!Array.isArray(saved)) return [];
      return saved.filter((h): h is Holding => h && typeof h.id === 'string' && typeof h.ticker === 'string' && typeof h.bseCode === 'string' && typeof h.name === 'string' && finite(h.shares) && h.shares > 0 && Number.isInteger(h.shares) && nonnegative(h.averageCost));
    } catch { return []; }
  });
  const [storageError, setStorageError] = useState(false);
  useEffect(() => { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(holdings)); setStorageError(false); } catch { setStorageError(true); } }, [holdings]);
  return { holdings, setHoldings, storageError };
}
export function holdingMetrics(holdings: Holding[], stocks: BSEStock[]) {
  let cost = 0, value = 0, income = 0, priced = 0, covered = 0, quotedCost = 0;
  for (const h of holdings) {
    const s = stocks.find(stock => stock.bseCode === h.bseCode);
    cost += h.shares * h.averageCost;
    if (s && s.dataStatus !== 'unavailable' && nonnegative(s.price)) { value += h.shares * s.price; quotedCost += h.shares * h.averageCost; priced++; }
    if (s?.dividendStatus === 'available' && nonnegative(s.dividendTTM)) { income += h.shares * s.dividendTTM; covered++; }
  }
  return { cost, value: holdings.length && !priced ? null : value, income: holdings.length && !covered ? null : income, gain: holdings.length && !priced ? null : value - quotedCost, priced, covered };
}
export function Portfolio({ stocks, snapshot, holdings, onUpdate, initialStock, storageError }: { stocks: BSEStock[]; snapshot: Snapshot | null; holdings: Holding[]; onUpdate: (holdings: Holding[]) => void; initialStock: BSEStock | null; storageError: boolean }) {
  const [open, setOpen] = useState(Boolean(initialStock));
  const [editing, setEditing] = useState<Holding | null>(null);
  const [code, setCode] = useState(initialStock?.bseCode || '');
  const [shares, setShares] = useState('');
  const [cost, setCost] = useState('');
  const [validation, setValidation] = useState('');
  useEffect(() => { if (initialStock) { setCode(initialStock.bseCode); setEditing(null); setShares(''); setCost(''); setValidation(''); setOpen(true); } }, [initialStock]);
  const metrics = useMemo(() => holdingMetrics(holdings, stocks), [holdings, stocks]);
  const add = () => { setEditing(null); setCode(stocks[0]?.bseCode || ''); setShares(''); setCost(''); setValidation(''); setOpen(true); };
  const edit = (h: Holding) => { setEditing(h); setCode(h.bseCode); setShares(String(h.shares)); setCost(String(h.averageCost)); setValidation(''); setOpen(true); };
  const save = (event: React.FormEvent) => {
    event.preventDefault();
    const quantity = Number(shares); const averageCost = Number(cost); const stock = stocks.find(s => s.bseCode === code);
    if ((!stock && !editing) || !shares.trim() || !cost.trim() || !finite(quantity) || quantity <= 0 || !Number.isInteger(quantity) || !nonnegative(averageCost) || !Number.isFinite(quantity * averageCost)) { setValidation('Choose a security, enter a positive whole number of shares and a non-negative INR buy cost.'); return; }
    const holding: Holding = { id: editing?.id || (typeof globalThis.crypto?.randomUUID === 'function' ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`), ticker: stock?.ticker || editing!.ticker, bseCode: stock?.bseCode || editing!.bseCode, name: stock?.name || editing!.name, shares: quantity, averageCost };
    onUpdate(editing ? holdings.map(h => h.id === editing.id ? holding : h) : [...holdings, holding]);
    setOpen(false);
  };
  return <div className="portfolio-view">{storageError && <div className="notice notice-warning" role="alert">Browser storage is unavailable. Your changes work in this session but may not persist.</div>}<div className="portfolio-summary"><div className="portfolio-summary-main"><span className="eyebrow"><BriefcaseBusiness size={15} />YOUR INCOME PLAN</span><h2>{money(metrics.income)}<span> / year, estimated pre-tax</span></h2><p>Based on reported trailing cash dividends, not promised future payouts.</p><div className="coverage-line">Dividend coverage: {metrics.covered} of {holdings.length} holdings{metrics.covered < holdings.length ? ' · partial estimate' : ''}</div></div><div className="portfolio-summary-side"><div><span>Invested cost · user entered</span><strong>{money(metrics.cost)}</strong></div><div><span>Quoted market value{metrics.priced < holdings.length ? ' · partial' : ''}</span><strong>{money(metrics.value)}</strong></div><div><span>Unrealised change · quoted holdings only</span><strong className={metrics.gain !== null && metrics.gain >= 0 ? 'text-emerald' : 'text-muted'}>{money(metrics.gain)}</strong></div></div></div>
    <Panel title="Your holdings" subtitle="Build a plan with actual share quantities and your average buy cost." action={<div className="button-group"><button className="button button-quiet" disabled={!holdings.length} onClick={() => exportHoldings(holdings, stocks, snapshot)} aria-label="Export portfolio CSV"><Download size={15} /><span>CSV</span></button><button className="button button-primary" disabled={!stocks.length} onClick={add}><Plus size={16} />Add holding</button></div>}>
      {holdings.length ? <div className="table-scroll"><table className="stock-table"><thead><tr><th>Security</th><th className="numeric">Shares</th><th className="numeric">Avg. buy cost</th><th className="numeric">Market value</th><th className="numeric">Annual estimate · pre-tax</th><th>Actions</th></tr></thead><tbody>{holdings.map(h => { const s = stocks.find(stock => stock.bseCode === h.bseCode); const price = s?.dataStatus !== 'unavailable' && nonnegative(s?.price) ? s!.price! : null; const dps = s?.dividendStatus === 'available' && nonnegative(s.dividendTTM) ? s.dividendTTM : null; return <tr key={h.id}><td><div className="company-link"><strong>{h.ticker}<span className="bse-code">{h.bseCode}</span></strong><span>{h.name}</span>{!s && <small className="text-amber">Not in current watchlist</small>}</div></td><td className="numeric mono">{number(h.shares)}</td><td className="numeric mono">{money(h.averageCost)}</td><td className="numeric mono">{money(price === null ? null : h.shares * price)}</td><td className="numeric mono text-emerald">{money(dps === null ? null : h.shares * dps)}{dps === null && <small className="secondary-number text-muted">Dividend data unavailable</small>}</td><td><div className="button-group"><button className="icon-button" aria-label={`Edit ${h.name} holding`} onClick={() => edit(h)}><Pencil size={15} /></button><button className="icon-button delete-button" aria-label={`Remove ${h.name} holding`} onClick={() => onUpdate(holdings.filter(item => item.id !== h.id))}><Trash2 size={15} /></button></div></td></tr>; })}</tbody></table></div> : <EmptyState title="A clean slate for your portfolio" description={stocks.length ? 'No example holdings, no assumed investments. Add your first security and enter the shares and buy cost yourself.' : 'Your portfolio starts empty. Add holdings once watchlist data is available; existing saved holdings can still be reviewed.'} />}
      <div className="portfolio-notes"><Info size={16} /><p>Estimates use shares × provider-covered trailing 12-month dividends per share. Missing or negative dividend values and unavailable quotes are excluded, not treated as zero; partial coverage is shown above. Dividends may change. Holdings are stored locally in this browser, unencrypted, with no account sync or biometric protection.</p></div>
    </Panel>
    {open && <Dialog title={editing ? 'Edit holding' : 'Add a holding'} onClose={() => setOpen(false)}><form onSubmit={save} className="holding-form"><p>Use your own investment details. This is a planning tool, not a brokerage order.</p><label>Security<select required disabled={Boolean(editing)} value={code} onChange={e => setCode(e.target.value)}><option value="" disabled>Select from the BSE watchlist</option>{editing && !stocks.some(s => s.bseCode === editing.bseCode) && <option value={editing.bseCode}>{editing.ticker} · {editing.name} (quote unavailable)</option>}{stocks.map(s => <option key={s.bseCode} value={s.bseCode}>{s.ticker} · {s.name} · {s.bseCode}</option>)}</select></label><div className="form-grid"><label>Number of shares<input required autoFocus type="number" min="1" step="1" inputMode="numeric" value={shares} onChange={e => setShares(e.target.value)} placeholder="Enter quantity" /></label><label>Average buy cost · INR<input required type="number" min="0" step="any" inputMode="decimal" value={cost} onChange={e => setCost(e.target.value)} placeholder="₹ per share" /></label></div>{validation && <p className="text-amber" role="alert">{validation}</p>}<div className="dialog-actions"><button type="button" className="button button-quiet" onClick={() => setOpen(false)}>Cancel</button><button className="button button-primary" type="submit">{editing ? 'Save changes' : 'Add holding'}</button></div></form></Dialog>}
  </div>;
}
