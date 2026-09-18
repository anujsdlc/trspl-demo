'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Warehouse as WarehouseIcon, Plus, Search, X, Edit2, Trash2, ArrowUpDown,
  Package, Tent, ArrowRightLeft, Building2,
} from 'lucide-react';
import {
  loadWarehouses, saveWarehouse, deleteWarehouse, loadBranches, SEED_WAREHOUSES, SEED_BRANCHES,
  type Warehouse, type WarehouseType, type Branch,
} from '@/lib/erp/foundations';

const TYPES: WarehouseType[] = ['branch', 'godown', 'exhibition', 'in-transit'];

const TYPE_META: Record<WarehouseType, { color: string; label: string; icon: React.ElementType }> = {
  branch:      { color: '#1D1D1F', label: 'Branch store',  icon: Building2 },
  godown:      { color: '#8A0325', label: 'Central godown', icon: Package },
  exhibition:  { color: '#B45309', label: 'Exhibition',     icon: Tent },
  'in-transit':{ color: '#86868B', label: 'In-transit',     icon: ArrowRightLeft },
};

export function WarehousesConsole() {
  const [rows, setRows] = useState<Warehouse[]>(SEED_WAREHOUSES);
  const [branches, setBranches] = useState<Branch[]>(SEED_BRANCHES);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    loadWarehouses().then(setRows);
    loadBranches().then(setBranches);
    setHydrated(true);
  }, []);
  function refresh() { loadWarehouses().then(setRows); }

  const branchById = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);

  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<WarehouseType | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Warehouse | null>(null);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(w => w.name.toLowerCase().includes(s) || w.code.toLowerCase().includes(s) || w.address.toLowerCase().includes(s) || w.manager.toLowerCase().includes(s) || (branchById.get(w.branchId)?.name.toLowerCase().includes(s) ?? false));
    }
    if (typeFilter !== 'all') arr = arr.filter(w => w.type === typeFilter);
    return arr;
  }, [rows, q, typeFilter, branchById]);

  const counts = useMemo(() => ({
    branch: rows.filter(r => r.type === 'branch').length,
    godown: rows.filter(r => r.type === 'godown').length,
    exhibition: rows.filter(r => r.type === 'exhibition').length,
    inTransit: rows.filter(r => r.type === 'in-transit').length,
  }), [rows]);

  const totalTitles = useMemo(() => rows.reduce((s, r) => s + (r.capacityTitles ?? 0), 0), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <WarehouseIcon className="w-3 h-3" /> Foundations
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Warehouses</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Branch stores, central godowns, event booths, and in-transit vans — every physical location where stock lives.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add warehouse
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Branch stores" value={counts.branch} icon={Building2} />
        <KPI label="Central godowns" value={counts.godown} icon={Package} />
        <KPI label="Exhibition booths" value={counts.exhibition} icon={Tent} />
        <KPI label="In-transit" value={counts.inTransit} icon={ArrowRightLeft} />
        <KPI label="Titles capacity" value={totalTitles.toLocaleString('en-IN')} accent />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search warehouse, code, branch, manager…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', ...TYPES] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 h-full transition ${typeFilter === t ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{t === 'all' ? 'All' : (t as string).replace('-', ' ')}</button>
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
                <Th label="Code" />
                <Th label="Warehouse" />
                <Th label="Type" className="w-28" />
                <Th label="Branch" />
                <Th label="Capacity" className="w-40 text-right" />
                <Th label="Manager" />
                <Th label="Status" className="w-24" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No warehouses match this filter.</td></tr>
              )}
              {filtered.map(w => {
                const meta = TYPE_META[w.type];
                const Icon = meta.icon;
                const branch = branchById.get(w.branchId);
                return (
                  <tr key={w.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                    <td className="px-4 py-3 font-mono text-xs">{w.code}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium leading-tight">{w.name}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-muted)] line-clamp-1">{w.address}</div>
                    </td>
                    <td className="px-3 py-3">
                      <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest px-2 py-1 rounded" style={{ background: `${meta.color}15`, color: meta.color }}>
                        <Icon className="w-3 h-3" /> {meta.label}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-xs">
                      {branch ? (
                        <>
                          <div>{branch.name}</div>
                          <div className="text-[color:var(--color-ink-muted)] font-mono">{branch.code}</div>
                        </>
                      ) : <span className="text-[color:var(--color-ink-faint)]">—</span>}
                    </td>
                    <td className="px-3 py-3 text-right text-xs font-mono">
                      {w.capacityTitles ? `${w.capacityTitles.toLocaleString('en-IN')} titles` : '—'}
                      {w.capacitySqft && <div className="text-[10px] text-[color:var(--color-ink-muted)]">{w.capacitySqft.toLocaleString('en-IN')} sqft</div>}
                    </td>
                    <td className="px-3 py-3 text-xs">
                      <div>{w.manager}</div>
                      {w.phone && <div className="text-[color:var(--color-ink-muted)] font-mono">{w.phone}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded capitalize ${
                        w.status === 'active' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' :
                        w.status === 'temporary' ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                        'bg-[color:var(--color-ink-faint)]/20 text-[color:var(--color-ink-muted)]'
                      }`}>{w.status}</span>
                    </td>
                    <td className="px-3 py-3 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button onClick={() => setEditing(w)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                        <button onClick={() => { if (confirm(`Delete ${w.name}?`)) { deleteWarehouse(w.id); refresh(); } }} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
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
        <WarehouseModal
          warehouse={editing}
          branches={branches}
          onClose={() => { setEditing(null); setCreating(false); }}
          onSave={w => { saveWarehouse(w); refresh(); setEditing(null); setCreating(false); }}
        />
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: number | string; icon?: React.ElementType; accent?: boolean }) {
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

function WarehouseModal({ warehouse, branches, onClose, onSave }: {
  warehouse: Warehouse | null;
  branches: Branch[];
  onClose: () => void;
  onSave: (w: Warehouse) => void;
}) {
  const [form, setForm] = useState<Warehouse>(warehouse ?? {
    id: `wh-${Date.now().toString(36)}`,
    code: '', name: '', type: 'godown', branchId: branches[0]?.id ?? '',
    address: '', manager: '', status: 'active',
    createdOn: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.code.trim() || !form.name.trim() || !form.branchId) {
      setError('Code, name, and parent branch are required.'); return;
    }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{warehouse ? 'Edit warehouse' : 'New warehouse'}</div>
            <div className="font-serif text-2xl leading-tight">{form.name || 'Warehouse details'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Code">
              <input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" />
            </Field>
            <Field label="Type" className="col-span-2">
              <div className="grid grid-cols-4 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
                {TYPES.map(t => {
                  const meta = TYPE_META[t];
                  const active = form.type === t;
                  return (
                    <button key={t} type="button" onClick={() => setForm({ ...form, type: t })} className={`h-full rounded text-[11px] uppercase tracking-widest transition ${active ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>
                      {meta.label}
                    </button>
                  );
                })}
              </div>
            </Field>
          </div>
          <Field label="Name">
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" />
          </Field>
          <Field label="Parent branch">
            <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
              {branches.map(b => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}
            </select>
          </Field>
          <Field label="Address">
            <textarea value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Capacity (sq ft)"><input type="number" min={0} value={form.capacitySqft ?? ''} onChange={e => setForm({ ...form, capacitySqft: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="Capacity (titles)"><input type="number" min={0} value={form.capacityTitles ?? ''} onChange={e => setForm({ ...form, capacityTitles: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Manager"><input value={form.manager} onChange={e => setForm({ ...form, manager: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Phone"><input value={form.phone ?? ''} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <Field label="GSTIN (optional)"><input value={form.gstin ?? ''} onChange={e => setForm({ ...form, gstin: e.target.value.toUpperCase() })} maxLength={15} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          <Field label="Notes"><textarea value={form.notes ?? ''} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" placeholder="e.g. Event-only, 4-day exhibition" /></Field>
          <Field label="Status">
            <div className="grid grid-cols-3 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
              {(['active', 'temporary', 'inactive'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{warehouse ? 'Save changes' : 'Create warehouse'}</button>
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
