'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Building2, Plus, Search, X, Edit2, Trash2, MapPin, Phone, Mail, User,
  ArrowUpDown, CheckCircle2, XCircle,
} from 'lucide-react';
import {
  loadBranches, saveBranch, deleteBranch, SEED_BRANCHES, type Branch, type BranchType,
} from '@/lib/erp/foundations';

const TYPES: BranchType[] = ['HO', 'branch', 'sub-branch'];

export function BranchesConsole() {
  const [rows, setRows] = useState<Branch[]>(SEED_BRANCHES);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setRows(loadBranches()); setHydrated(true); }, []);
  function refresh() { setRows(loadBranches()); }

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<BranchType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editing, setEditing] = useState<Branch | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(r =>
        r.name.toLowerCase().includes(s) ||
        r.code.toLowerCase().includes(s) ||
        r.city.toLowerCase().includes(s) ||
        r.state.toLowerCase().includes(s) ||
        (r.gstin?.toLowerCase().includes(s) ?? false) ||
        r.manager.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'all') arr = arr.filter(r => r.type === typeFilter);
    if (statusFilter !== 'all') arr = arr.filter(r => r.status === statusFilter);
    return arr;
  }, [rows, q, typeFilter, statusFilter]);

  const counts = useMemo(() => ({
    HO: rows.filter(r => r.type === 'HO').length,
    branch: rows.filter(r => r.type === 'branch').length,
    sub: rows.filter(r => r.type === 'sub-branch').length,
    inactive: rows.filter(r => r.status === 'inactive').length,
  }), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Building2 className="w-3 h-3" /> Foundations
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Branches</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            {rows.length} total · every branch anchors warehouses, GST registrations, and staff access.
          </p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add branch
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Head Office" value={counts.HO} />
        <KPI label="Branches" value={counts.branch} />
        <KPI label="Sub-branches" value={counts.sub} />
        <KPI label="Inactive" value={counts.inactive} accent="warn" />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search branch, code, city, state, GSTIN, manager…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', 'HO', 'branch', 'sub-branch'] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 h-full transition ${typeFilter === t ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>
              {t === 'all' ? 'All' : t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', 'active', 'inactive'] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-full transition capitalize ${statusFilter === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${rows.length}` : 'loading…'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <SortHead label="Code" />
                <SortHead label="Branch" />
                <SortHead label="Type" className="w-24" />
                <SortHead label="City / State" />
                <SortHead label="GSTIN" className="w-40" />
                <SortHead label="Manager" />
                <SortHead label="Status" className="w-24" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No branches match this filter.</td></tr>
              )}
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-4 py-3 font-mono text-xs">{b.code}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium leading-tight">{b.name}</div>
                    <div className="text-[11px] text-[color:var(--color-ink-muted)] line-clamp-1">{b.address}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]">
                      {b.type}
                    </span>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{b.city}</div>
                    <div className="text-[color:var(--color-ink-muted)]">{b.state} · {b.pincode}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-[11px]">{b.gstin ?? <span className="text-[color:var(--color-ink-faint)]">—</span>}</td>
                  <td className="px-3 py-3 text-xs">
                    <div>{b.manager}</div>
                    <div className="text-[color:var(--color-ink-muted)] font-mono">{b.phone}</div>
                  </td>
                  <td className="px-3 py-3">
                    {b.status === 'active' ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-success)]"><CheckCircle2 className="w-3 h-3" /> Active</span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]"><XCircle className="w-3 h-3" /> Inactive</span>
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditing(b)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded" title="Edit"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete ${b.name}?`)) { deleteBranch(b.id); refresh(); } }} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <BranchModal
          branch={editing}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={b => { saveBranch(b); refresh(); setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function KPI({ label, value, accent }: { label: string; value: number; accent?: 'warn' }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${accent === 'warn' ? 'border-[color:var(--color-warning)]/40' : 'border-[color:var(--color-line)]'}`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
      <div className="editorial-num text-3xl mt-1">{value}</div>
    </div>
  );
}

function SortHead({ label, className }: { label: string; className?: string }) {
  return (
    <th className={`text-left px-3 py-2.5 ${className || ''}`}>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        {label} <ArrowUpDown className="w-3 h-3 text-[color:var(--color-ink-faint)]" />
      </span>
    </th>
  );
}

function BranchModal({ branch, onClose, onSave }: { branch: Branch | null; onClose: () => void; onSave: (b: Branch) => void }) {
  const [form, setForm] = useState<Branch>(branch ?? {
    id: `br-${Date.now().toString(36)}`,
    code: '', name: '', type: 'branch', address: '', city: '', state: '', pincode: '',
    manager: '', phone: '', email: '', status: 'active', createdOn: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.code.trim() || !form.name.trim() || !form.city.trim() || !form.state.trim()) {
      setError('Code, name, city, and state are required'); return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{branch ? 'Edit branch' : 'New branch'}</div>
            <div className="font-serif text-2xl leading-tight">{form.name || 'Branch details'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Branch code">
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" />
            </Field>
            <Field label="Type" className="col-span-2">
              <div className="flex items-center gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
                {TYPES.map(t => (
                  <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className={`flex-1 h-full rounded text-xs uppercase tracking-widest transition ${form.type === t ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{t}</button>
                ))}
              </div>
            </Field>
          </div>
          <Field label="Branch name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" />
          </Field>
          <Field label="Address">
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" />
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="State"><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Pincode"><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <Field label="GSTIN (optional)">
            <input value={form.gstin ?? ''} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} maxLength={15} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Branch manager"><input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <Field label="Email">
            <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" />
          </Field>
          <Field label="Status">
            <div className="flex items-center gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5 w-fit">
              {(['active', 'inactive'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`px-4 h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{branch ? 'Save changes' : 'Create branch'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      {children}
    </div>
  );
}
