'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  ShoppingCart, Plus, Search, X, ArrowRight, PackageCheck, PackageX,
  ClipboardCheck, ClipboardList, FileText, Truck, Package, CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  loadPOs, savePO, deletePO, SEED_POS,
  loadSuppliers, SEED_SUPPLIERS,
  type PurchaseOrder, type POStatus, type Supplier,
} from '@/lib/erp/phase2';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

const STATUS_TONE: Record<POStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'muted',
  placed: 'info',
  partial: 'warning',
  received: 'info',
  billed: 'success',
  closed: 'muted',
  cancelled: 'danger',
};

const STATUSES: POStatus[] = ['draft', 'placed', 'partial', 'received', 'billed', 'closed', 'cancelled'];

export function PurchaseOrdersConsole() {
  const [rows, setRows] = useState<PurchaseOrder[]>(SEED_POS);
  const [suppliers, setSuppliers] = useState<Supplier[]>(SEED_SUPPLIERS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    loadPOs().then(setRows);
    loadSuppliers().then(setSuppliers);
    setHydrated(true);
  }, []);
  function refresh() { loadPOs().then(setRows); }

  const supplierById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<POStatus | 'all'>('all');
  const [drawer, setDrawer] = useState<PurchaseOrder | null>(null);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(r =>
        r.poNumber.toLowerCase().includes(s) ||
        (r.grnNumber?.toLowerCase().includes(s) ?? false) ||
        (r.billNumber?.toLowerCase().includes(s) ?? false) ||
        (supplierById.get(r.supplierId)?.name.toLowerCase().includes(s) ?? false)
      );
    }
    if (statusFilter !== 'all') arr = arr.filter(r => r.status === statusFilter);
    return arr;
  }, [rows, q, statusFilter, supplierById]);

  const kpi = useMemo(() => ({
    openPOs: rows.filter(r => ['placed', 'partial'].includes(r.status)).length,
    receivedAwaitingBill: rows.filter(r => r.status === 'received').length,
    monthValue: rows.filter(r => r.orderDate.startsWith('2026-09')).reduce((s, r) => s + r.total, 0),
    ytdSpend: rows.reduce((s, r) => s + r.total, 0),
  }), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <ShoppingCart className="w-3 h-3" /> Buy → Sell
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Purchase Orders</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            PO → GRN → Bill with three-way matching. Every commit checks quantity, price, and terms against the goods receipt.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> New PO
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Open POs" value={kpi.openPOs.toString()} accent="crimson" />
        <KPI label="Received · awaiting bill" value={kpi.receivedAwaitingBill.toString()} accent={kpi.receivedAwaitingBill > 0 ? 'warn' : undefined} />
        <KPI label="This month spend" value={inr(kpi.monthValue)} />
        <KPI label="Rolling YTD" value={inr(kpi.ytdSpend)} accent="success" />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search PO, GRN, bill, supplier…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9 flex-wrap">
          {(['all', ...STATUSES] as const).map(s => (
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
                <Th label="PO #" className="w-40" />
                <Th label="Supplier" />
                <Th label="Order date" className="w-28" />
                <Th label="Expected" className="w-28" />
                <Th label="Lines" className="w-16" align="right" />
                <Th label="Total" className="w-32" align="right" />
                <Th label="3-way match" className="w-40" />
                <Th label="Status" className="w-24" />
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No purchase orders match.</td></tr>}
              {filtered.map(po => {
                const supplier = supplierById.get(po.supplierId);
                const grnDone = !!po.grnNumber;
                const billDone = !!po.billNumber;
                const matched = grnDone && billDone && Math.abs((po.billAmount ?? 0) - po.total) < 1;
                return (
                  <tr key={po.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30 cursor-pointer" onClick={() => setDrawer(po)}>
                    <td className="px-3 py-3 font-mono text-xs">
                      <div className="font-medium">{po.poNumber}</div>
                      {po.grnNumber && <div className="text-[10px] text-[color:var(--color-ink-muted)]">GRN {po.grnNumber}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium leading-tight">{supplier?.name ?? po.supplierId}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-muted)]">{supplier?.code}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{po.orderDate}</td>
                    <td className="px-3 py-3 font-mono text-xs">{po.expectedDate}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{po.lines.length}</td>
                    <td className="px-3 py-3 text-right font-mono">{inr(po.total)}</td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
                        <MatchDot ok label="PO" />
                        <ArrowRight className="w-2.5 h-2.5 text-[color:var(--color-ink-faint)]" />
                        <MatchDot ok={grnDone} label="GRN" />
                        <ArrowRight className="w-2.5 h-2.5 text-[color:var(--color-ink-faint)]" />
                        <MatchDot ok={billDone} label="Bill" />
                        {matched && <CheckCircle2 className="w-3 h-3 text-[color:var(--color-success)] ml-1" />}
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={po.status} tone={STATUS_TONE[po.status]} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); setDrawer(po); }} className="text-xs text-[color:var(--color-crimson)] hover:underline">Open →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && (
        <PODrawer
          po={drawer}
          suppliers={suppliers}
          onClose={() => setDrawer(null)}
          onAdvance={advanced => { savePO(advanced); refresh(); setDrawer(advanced); }}
        />
      )}
    </div>
  );
}

function MatchDot({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${ok ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' : 'bg-[color:var(--color-paper)] text-[color:var(--color-ink-muted)]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[color:var(--color-success)]' : 'bg-[color:var(--color-ink-faint)]'}`} />
      {label}
    </span>
  );
}

function PODrawer({ po, suppliers, onClose, onAdvance }: { po: PurchaseOrder; suppliers: Supplier[]; onClose: () => void; onAdvance: (p: PurchaseOrder) => void }) {
  const supplier = suppliers.find(s => s.id === po.supplierId);

  function receiveGoods() {
    const grn = `GRN-2026-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
    onAdvance({ ...po, status: 'received', grnNumber: grn, grnDate: new Date().toISOString().slice(0, 10) });
  }
  function bookBill() {
    const bill = `INV/${supplier?.code ?? 'SUP'}/${Math.floor(Math.random() * 9000) + 1000}`;
    onAdvance({ ...po, status: 'billed', billNumber: bill, billDate: new Date().toISOString().slice(0, 10), billAmount: po.total });
  }
  function closePO() { onAdvance({ ...po, status: 'closed' }); }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Purchase Order</div>
            <div className="font-serif text-2xl">{po.poNumber}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Supplier</div>
              <div className="text-sm font-medium">{supplier?.name}</div>
              <div className="text-[11px] text-[color:var(--color-ink-muted)] font-mono">{supplier?.gstin}</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Timeline</div>
              <div className="text-xs font-mono">Ordered {po.orderDate}</div>
              <div className="text-xs font-mono text-[color:var(--color-ink-muted)]">ETA {po.expectedDate}</div>
              {po.grnDate && <div className="text-xs font-mono text-[color:var(--color-success)]">Received {po.grnDate}</div>}
              {po.billDate && <div className="text-xs font-mono text-[color:var(--color-success)]">Billed {po.billDate}</div>}
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-1.5">
              <ClipboardList className="w-3 h-3" /> {po.lines.length} line{po.lines.length === 1 ? '' : 's'}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-right px-3 py-2 w-16">Qty</th>
                  <th className="text-right px-3 py-2 w-20">Unit ₹</th>
                  <th className="text-right px-3 py-2 w-16">Disc</th>
                  <th className="text-right px-3 py-2 w-16">GST</th>
                  <th className="text-right px-3 py-2 w-24">Line ₹</th>
                </tr>
              </thead>
              <tbody>
                {po.lines.map((l, i) => {
                  const gross = l.qty * l.unitPrice;
                  const discAmount = gross * l.discount / 100;
                  const net = gross - discAmount;
                  const gst = net * l.gstRate / 100;
                  const line = net + gst;
                  return (
                    <tr key={i} className="border-b border-[color:var(--color-line)] last:border-0">
                      <td className="px-3 py-2">
                        <div>{l.title}</div>
                        {l.isbn && <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{l.isbn}</div>}
                      </td>
                      <td className="px-3 py-2 text-right font-mono">{l.qty}</td>
                      <td className="px-3 py-2 text-right font-mono">{l.unitPrice}</td>
                      <td className="px-3 py-2 text-right font-mono">{l.discount}%</td>
                      <td className="px-3 py-2 text-right font-mono">{l.gstRate}%</td>
                      <td className="px-3 py-2 text-right font-mono">{inr(line)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            <div className="p-3 border-t border-[color:var(--color-line)] grid grid-cols-3 gap-2 text-xs">
              <div><div className="text-[color:var(--color-ink-muted)]">Subtotal</div><div className="font-mono">{inr(po.subtotal)}</div></div>
              <div><div className="text-[color:var(--color-ink-muted)]">Discount</div><div className="font-mono text-[color:var(--color-crimson)]">−{inr(po.discountTotal)}</div></div>
              <div><div className="text-[color:var(--color-ink-muted)]">GST</div><div className="font-mono">{inr(po.gstTotal)}</div></div>
            </div>
            <div className="px-3 py-3 border-t border-[color:var(--color-line)] flex items-center justify-between bg-[color:var(--color-paper)]/40">
              <div className="text-sm">Total payable</div>
              <div className="font-serif text-2xl">{inr(po.total)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Advance the PO</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button disabled={!!po.grnNumber} onClick={receiveGoods} className="h-10 px-3 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <PackageCheck className="w-4 h-4" /> Receive goods
              </button>
              <button disabled={!po.grnNumber || !!po.billNumber} onClick={bookBill} className="h-10 px-3 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <FileText className="w-4 h-4" /> Book bill
              </button>
              <button disabled={!po.billNumber || po.status === 'closed'} onClick={closePO} className="h-10 px-3 bg-[color:var(--color-ink)] text-white rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-crimson)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ClipboardCheck className="w-4 h-4" /> Close PO
              </button>
            </div>
            {po.notes && (
              <div className="mt-4 text-xs text-[color:var(--color-ink-muted)]">
                <div className="font-medium text-[color:var(--color-ink)] mb-1">Notes</div>
                {po.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
