'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Truck, Plus, Search, X, Edit2, Trash2, Star, Phone, Mail, MapPin,
} from 'lucide-react';
import {
  loadSuppliers, saveSupplier, deleteSupplier, SEED_SUPPLIERS,
  type Supplier, type SupplierType,
} from '@/lib/erp/phase2';
import { inr } from '@/lib/utils';
import { KPI, Th, Field, StatusPill } from './ui';

const TYPES: SupplierType[] = ['publisher', 'distributor', 'wholesaler', 'author-direct', 'importer'];

export function SuppliersConsole() {
  const [rows, setRows] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { loadSuppliers().then(setRows); setHydrated(true); }, []);
  function refresh() { loadSuppliers().then(setRows); }

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<SupplierType | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | Supplier['status']>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Supplier | null>(null);

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
        r.contactName.toLowerCase().includes(s)
      );
    }
    if (typeFilter !== 'all') arr = arr.filter(r => r.type === typeFilter);
    if (statusFilter !== 'all') arr = arr.filter(r => r.status === statusFilter);
    return arr;
  }, [rows, q, typeFilter, statusFilter]);

  const totals = useMemo(() => ({
    total: rows.length,
    outstanding: rows.reduce((s, r) => s + r.currentOutstanding, 0),
    creditLimit: rows.reduce((s, r) => s + r.creditLimit, 0),
    overThreshold: rows.filter(r => r.currentOutstanding > r.creditLimit * 0.8).length,
  }), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Truck className="w-3 h-3" /> Buy → Sell
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Suppliers</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Publishers, distributors, and importers — with rate contracts, credit terms, and running outstandings.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add supplier
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Suppliers" value={totals.total.toString()} />
        <KPI label="Total credit limit" value={inr(totals.creditLimit)} />
        <KPI label="Current outstanding" value={inr(totals.outstanding)} accent="crimson" />
        <KPI label="Over 80% credit limit" value={totals.overThreshold.toString()} accent={totals.overThreshold > 0 ? 'warn' : undefined} />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search supplier, code, GSTIN, city, contact…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', ...TYPES] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 h-full transition capitalize ${typeFilter === t ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{t === 'all' ? 'All' : t.replace('-', ' ')}</button>
          ))}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', 'active', 'hold', 'blocked'] as const).map(s => (
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
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Code" className="w-28" />
                <Th label="Supplier" />
                <Th label="Type" className="w-24" />
                <Th label="Contact" />
                <Th label="Credit" className="w-32" align="right" />
                <Th label="Outstanding" className="w-32" align="right" />
                <Th label="Discount" className="w-20" align="right" />
                <Th label="Rating" className="w-24" />
                <Th label="Status" className="w-20" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No suppliers match.</td></tr>}
              {filtered.map(s => {
                const utilization = s.creditLimit ? (s.currentOutstanding / s.creditLimit) * 100 : 0;
                return (
                  <tr key={s.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                    <td className="px-3 py-3 font-mono text-xs">{s.code}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium leading-tight">{s.name}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-muted)] flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" /> {s.city} · {s.state}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] capitalize">{s.type.replace('-', ' ')}</span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div>{s.contactName}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{s.phone}</div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs">
                      <div className="font-mono">{inr(s.creditLimit)}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{s.creditDays}-day terms</div>
                    </td>
                    <td className="px-3 py-3 text-right text-xs">
                      <div className={`font-mono ${utilization > 80 ? 'text-[color:var(--color-warning)]' : ''}`}>{inr(s.currentOutstanding)}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{utilization.toFixed(0)}%</div>
                    </td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{s.defaultDiscount}%</td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} className={`w-3 h-3 ${i < s.rating ? 'text-[color:var(--color-warning)] fill-[color:var(--color-warning)]' : 'text-[color:var(--color-ink-faint)]'}`} />
                        ))}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={s.status} tone={s.status === 'active' ? 'success' : s.status === 'hold' ? 'warning' : 'danger'} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setEditing(s)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm(`Delete ${s.name}?`)) { deleteSupplier(s.id); refresh(); } }} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <SupplierModal
          row={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={s => { saveSupplier(s); refresh(); setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function SupplierModal({ row, onClose, onSave }: { row: Supplier | null; onClose: () => void; onSave: (s: Supplier) => void }) {
  const [form, setForm] = useState<Supplier>(row ?? {
    id: `sup-${Date.now().toString(36)}`,
    code: '', name: '', type: 'publisher',
    contactName: '', phone: '', email: '',
    address: '', city: '', state: '', pincode: '',
    creditDays: 45, creditLimit: 500000, currentOutstanding: 0,
    defaultDiscount: 25, rating: 4, status: 'active',
    since: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.code.trim() || !form.name.trim()) { setError('Code and name are required'); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{row ? 'Edit supplier' : 'New supplier'}</div>
            <div className="font-serif text-2xl leading-tight">{form.name || 'Supplier details'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Code"><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
            <Field label="Type" className="col-span-2">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as SupplierType })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm capitalize">
                {TYPES.map(t => <option key={t} value={t}>{t.replace('-', ' ')}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Contact name"><input value={form.contactName} onChange={e => setForm({ ...form, contactName: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Email"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          </div>
          <Field label="Address"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="City"><input value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="State"><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Pincode"><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="GSTIN"><input value={form.gstin ?? ''} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
            <Field label="PAN"><input value={form.panNumber ?? ''} onChange={e => setForm({ ...form, panNumber: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          </div>
          <div className="grid grid-cols-4 gap-3">
            <Field label="Credit days"><input type="number" value={form.creditDays} onChange={e => setForm({ ...form, creditDays: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Credit limit (₹)"><input type="number" value={form.creditLimit} onChange={e => setForm({ ...form, creditLimit: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Outstanding (₹)"><input type="number" value={form.currentOutstanding} onChange={e => setForm({ ...form, currentOutstanding: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Discount (%)"><input type="number" value={form.defaultDiscount} onChange={e => setForm({ ...form, defaultDiscount: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Rating">
              <select value={form.rating} onChange={e => setForm({ ...form, rating: Number(e.target.value) as Supplier['rating'] })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n} star{n !== 1 ? 's' : ''}</option>)}
              </select>
            </Field>
            <Field label="Status">
              <div className="grid grid-cols-3 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
                {(['active', 'hold', 'blocked'] as const).map(s => (
                  <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
                ))}
              </div>
            </Field>
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{row ? 'Save changes' : 'Add supplier'}</button>
        </div>
      </form>
    </div>
  );
}
