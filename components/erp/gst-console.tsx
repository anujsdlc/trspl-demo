'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Landmark, Plus, Search, X, Edit2, Trash2, ArrowUpDown, ShieldCheck,
  FileText, Send,
} from 'lucide-react';
import {
  loadGST, saveGST, deleteGST, SEED_GST, type GSTRegistration,
} from '@/lib/erp/foundations';

const BUCKETS: GSTRegistration['turnoverBucket'][] = ['below-5cr', '5-20cr', '20-100cr', 'above-100cr'];

export function GSTConsole() {
  const [rows, setRows] = useState<GSTRegistration[]>(SEED_GST);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setRows(loadGST()); setHydrated(true); }, []);
  function refresh() { setRows(loadGST()); }

  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<GSTRegistration | null>(null);

  const filtered = useMemo(() => {
    if (!q) return rows;
    const s = q.toLowerCase();
    return rows.filter(r =>
      r.gstin.toLowerCase().includes(s) ||
      r.state.toLowerCase().includes(s) ||
      r.tradeName?.toLowerCase().includes(s) ||
      r.legalName.toLowerCase().includes(s)
    );
  }, [rows, q]);

  const active = rows.filter(r => r.status === 'active').length;
  const einvoice = rows.filter(r => r.einvoiceEnabled).length;
  const ewaybill = rows.filter(r => r.ewaybillEnabled).length;

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Landmark className="w-3 h-3" /> Foundations
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">GST Registrations</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            One GSTIN per state under the same PAN. Every branch, warehouse, and invoice series routes through one of these.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add GSTIN
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Total GSTINs" value={rows.length} icon={Landmark} />
        <KPI label="Active" value={active} icon={ShieldCheck} accent />
        <KPI label="E-invoice enabled" value={einvoice} icon={FileText} />
        <KPI label="E-way bill enabled" value={ewaybill} icon={Send} />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search GSTIN, state, trade name…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
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
                <Th label="GSTIN" />
                <Th label="State" className="w-40" />
                <Th label="Trade name" />
                <Th label="Registration" className="w-32" />
                <Th label="Compliance" className="w-40" />
                <Th label="Turnover" className="w-28" />
                <Th label="Status" className="w-24" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No registrations match this filter.</td></tr>}
              {filtered.map(r => (
                <tr key={r.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{r.gstin}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)]">{r.legalName}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs">{r.state}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">Code {r.stateCode}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{r.tradeName ?? '—'}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] line-clamp-1">{r.address}</div>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{r.registrationDate}</td>
                  <td className="px-3 py-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {r.einvoiceEnabled && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] rounded">e-invoice</span>}
                      {r.ewaybillEnabled && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-[color:var(--color-cobalt)]/10 text-[color:var(--color-cobalt)] rounded">e-way</span>}
                      {r.compositeScheme && <span className="text-[9px] uppercase tracking-widest px-1.5 py-0.5 bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)] rounded">composite</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-xs font-mono">{r.turnoverBucket}</td>
                  <td className="px-3 py-3">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded capitalize ${
                      r.status === 'active' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' :
                      r.status === 'suspended' ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                      'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]'
                    }`}>{r.status}</span>
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditing(r)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete GSTIN ${r.gstin}?`)) { deleteGST(r.id); refresh(); } }} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <GSTModal
          row={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={r => { saveGST(r); refresh(); setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: number; icon?: React.ElementType; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${accent ? 'border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)]'}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        {Icon && <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'}`} />}
      </div>
      <div className="editorial-num text-3xl mt-1">{value}</div>
    </div>
  );
}

function Th({ label, className }: { label: string; className?: string }) {
  return (
    <th className={`text-left px-3 py-2.5 ${className || ''}`}>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        {label} <ArrowUpDown className="w-3 h-3 text-[color:var(--color-ink-faint)]" />
      </span>
    </th>
  );
}

function GSTModal({ row, onClose, onSave }: { row: GSTRegistration | null; onClose: () => void; onSave: (r: GSTRegistration) => void }) {
  const [form, setForm] = useState<GSTRegistration>(row ?? {
    id: `gst-${Date.now().toString(36)}`,
    gstin: '', legalName: 'Travel Retail Services Pvt Ltd', tradeName: '',
    state: '', stateCode: '', address: '', pincode: '',
    registrationDate: new Date().toISOString().slice(0, 10),
    compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true,
    status: 'active', turnoverBucket: '5-20cr',
  });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][A-Z0-9]Z[A-Z0-9]$/.test(form.gstin)) {
      setError('GSTIN must be a valid 15-character identifier'); return;
    }
    if (!form.state || !form.stateCode) { setError('State and state code are required'); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{row ? 'Edit GSTIN' : 'New GST registration'}</div>
            <div className="font-serif text-2xl leading-tight">{form.tradeName || form.state || 'GSTIN details'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}
          <Field label="GSTIN"><input value={form.gstin} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} maxLength={15} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Legal name"><input value={form.legalName} onChange={e => setForm({ ...form, legalName: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Trade name"><input value={form.tradeName ?? ''} onChange={e => setForm({ ...form, tradeName: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="State" className="col-span-2"><input value={form.state} onChange={e => setForm({ ...form, state: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="State code"><input value={form.stateCode} onChange={e => setForm({ ...form, stateCode: e.target.value })} maxLength={2} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          </div>
          <Field label="Registered address"><textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Pincode"><input value={form.pincode} onChange={e => setForm({ ...form, pincode: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="Registration date"><input type="date" value={form.registrationDate} onChange={e => setForm({ ...form, registrationDate: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Turnover bucket">
              <select value={form.turnoverBucket} onChange={e => setForm({ ...form, turnoverBucket: e.target.value as GSTRegistration['turnoverBucket'] })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {BUCKETS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>
          <div className="space-y-2">
            <Toggle label="Composition scheme" value={form.compositeScheme} onChange={v => setForm({ ...form, compositeScheme: v })} hint="Turnover under composition-scheme threshold" />
            <Toggle label="E-invoice enabled" value={form.einvoiceEnabled} onChange={v => setForm({ ...form, einvoiceEnabled: v })} hint="Mandatory for turnover ≥ ₹5 Cr" />
            <Toggle label="E-way bill enabled" value={form.ewaybillEnabled} onChange={v => setForm({ ...form, ewaybillEnabled: v })} hint="For inter-state / consignment ≥ ₹50k" />
          </div>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
              {(['active', 'suspended', 'cancelled'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{row ? 'Save' : 'Register'}</button>
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

function Toggle({ label, value, onChange, hint }: { label: string; value: boolean; onChange: (v: boolean) => void; hint?: string }) {
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
