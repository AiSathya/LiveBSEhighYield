import { useEffect, useRef, type ReactNode } from 'react';
import { Database, X } from 'lucide-react';
import { statusLabel } from '../lib/format';

export function Badge({ status }: { status: string }) {
  return <span className={`status-badge ${status === 'live' ? 'status-live' : 'status-warning'}`}><span className="status-dot" />{statusLabel(status)}</span>;
}
export function EmptyState({ title, description, loading = false, compact = false }: { title: string; description: string; loading?: boolean; compact?: boolean }) {
  return <div className={`empty-state ${compact ? 'compact' : ''}`}><div className={`empty-icon ${loading ? 'loading-pulse' : ''}`}><Database size={23} strokeWidth={1.5} /></div><h3>{title}</h3><p>{description}</p></div>;
}
export function Panel({ title, subtitle, action, children, className = '' }: { title: string; subtitle?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return <section className={`panel ${className}`}><div className="panel-heading"><div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>{action}</div>{children}</section>;
}
export function Dialog({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeRef.current();
      if (event.key === 'Tab') {
        const items = ref.current?.querySelectorAll<HTMLElement>('button, a[href], input, select, textarea, [tabindex="0"]');
        if (!items?.length) return;
        const first = items[0]; const last = items[items.length - 1];
        if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); document.body.style.overflow = previousOverflow; previous?.focus(); };
  }, []);
  return <div className="dialog-backdrop" onClick={event => { if (event.target === event.currentTarget) onClose(); }}><div ref={ref} className="dialog" role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" aria-label="Close dialog" onClick={onClose}><X size={20} /></button></div>{children}</div></div>;
}
