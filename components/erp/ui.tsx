'use client';

import { ArrowUpDown } from 'lucide-react';

export function KPI({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: 'crimson' | 'warn' | 'danger' | 'success' }) {
  const border = accent === 'crimson' ? 'border-[color:var(--color-crimson)]'
    : accent === 'warn' ? 'border-[color:var(--color-warning)]'
    : accent === 'danger' ? 'border-[color:var(--color-danger)]'
    : accent === 'success' ? 'border-[color:var(--color-success)]'
    : 'border-[color:var(--color-line)]';
  return (
    <div className={`bg-white rounded-lg border ${border} p-4`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
      <div className="editorial-num text-3xl mt-1">{value}</div>
      {sub && <div className="text-[10px] font-mono text-[color:var(--color-ink-muted)] mt-1">{sub}</div>}
    </div>
  );
}

export function Th({ label, className, align }: { label: string; className?: string; align?: 'right' }) {
  return (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className || ''}`}>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        {label} <ArrowUpDown className="w-3 h-3 text-[color:var(--color-ink-faint)]" />
      </span>
    </th>
  );
}

export function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      {children}
    </div>
  );
}

export function Toggle({ label, hint, value, onChange }: { label: string; hint?: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex items-start gap-3 p-3 border border-[color:var(--color-line)] rounded-md cursor-pointer hover:bg-[color:var(--color-paper)]/40">
      <input type="checkbox" checked={value} onChange={e => onChange(e.target.checked)} className="mt-0.5 accent-[color:var(--color-crimson)]" />
      <div className="flex-1">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-[11px] text-[color:var(--color-ink-muted)]">{hint}</div>}
      </div>
    </label>
  );
}

export function StatusPill({ status, tone }: { status: string; tone: 'success' | 'warning' | 'info' | 'danger' | 'muted' }) {
  const cls = {
    success: 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]',
    warning: 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]',
    info:    'bg-[color:var(--color-cobalt)]/10 text-[color:var(--color-cobalt)]',
    danger:  'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
    muted:   'bg-[color:var(--color-paper)] text-[color:var(--color-ink-muted)]',
  }[tone];
  return <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${cls}`}>{status}</span>;
}
