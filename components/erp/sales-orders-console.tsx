'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Receipt, Plus, Search, X, ArrowRight, ClipboardList, FileText, CheckCircle2,
  Truck, Wallet, Ban,
} from 'lucide-react';
import {
  loadSOs, saveSO, deleteSO, SEED_SOS,
  loadCustomers, SEED_CUSTOMERS,
  type SalesOrder, type SOStatus, type Customer,
} from '@/lib/erp/phase2';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

const STATUS_TONE: Record<SOStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  quotation: 'muted',
  confirmed: 'info',
  picked: 'warning',
  invoiced: 'info',
  delivered: 'warning',
  paid: 'success',
  cancelled: 'danger',
};

const STATUSES: SOStatus[] = ['quotation', 'confirmed', 'picked', 'invoiced', 'delivered', 'paid', 'cancelled'];

export function SalesOrdersConsole() {
  const [rows, setRows] = useState<SalesOrder[]>(SEED_SOS);
  const [customers, setCustomers] = useState<Customer[]>(SEED_CUSTOMERS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    loadSOs().then(setRows);
    loadCustomers().then(setCustomers);
    setHydrated(true);
  }, []);
  function refresh() { loadSOs().then(setRows); }

  const customerById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<SOStatus | 'all'>('all');
  const [drawer, setDrawer] = useState<SalesOrder | null>(null);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(r =>
        r.soNumber.toLowerCase().includes(s) ||
        (r.invoiceNumber?.toLowerCase().includes(s) ?? false) ||
        (customerById.get(r.customerId)?.name.toLowerCase().includes(s) ?? false)
      );
    }
    if (statusFilter !== 'all') arr = arr.filter(r => r.status === statusFilter);
    return arr;
  }, [rows, q, statusFilter, customerById]);

  const kpi = useMemo(() => ({
    openOrders: rows.filter(r => ['confirmed', 'picked', 'invoiced', 'delivered'].includes(r.status)).length,
    receivable: rows.reduce((s, r) => s + (r.total - r.amountReceived), 0),
    monthValue: rows.filter(r => r.orderDate.startsWith('2026-09')).reduce((s, r) => s + r.total, 0),
    ytdSales: rows.reduce((s, r) => s + r.total, 0),
  }), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Receipt className="w-3 h-3" /> Buy → Sell
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Sales &amp; Invoicing</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Quotation → Sales Order → Invoice → Receipt. Per-GSTIN invoice numbering, credit terms, and receivables ageing.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> New sales order
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Open orders" value={kpi.openOrders.toString()} accent="crimson" />
        <KPI label="Receivable" value={inr(kpi.receivable)} accent={kpi.receivable > 0 ? 'warn' : undefined} />
        <KPI label="This month sales" value={inr(kpi.monthValue)} />
        <KPI label="Rolling YTD" value={inr(kpi.ytdSales)} accent="success" />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search SO, invoice, customer…" className="flex-1 bg-transparent text-sm focus:outline-none" />
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
                <Th label="SO #" className="w-40" />
                <Th label="Customer" />
                <Th label="Order date" className="w-28" />
                <Th label="Lines" className="w-16" align="right" />
                <Th label="Total" className="w-32" align="right" />
                <Th label="Received" className="w-32" align="right" />
                <Th label="Stage" className="w-40" />
                <Th label="Status" className="w-24" />
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No sales orders match.</td></tr>}
              {filtered.map(so => {
                const customer = customerById.get(so.customerId);
                const dispatched = ['picked', 'invoiced', 'delivered', 'paid'].includes(so.status);
                const invoiced = ['invoiced', 'delivered', 'paid'].includes(so.status);
                const paid = so.status === 'paid';
                const receivable = so.total - so.amountReceived;
                return (
                  <tr key={so.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30 cursor-pointer" onClick={() => setDrawer(so)}>
                    <td className="px-3 py-3 font-mono text-xs">
                      <div className="font-medium">{so.soNumber}</div>
                      {so.invoiceNumber && <div className="text-[10px] text-[color:var(--color-ink-muted)]">INV {so.invoiceNumber}</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="font-medium leading-tight">{customer?.name ?? so.customerId}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-muted)]">{customer?.code}</div>
                    </td>
                    <td className="px-3 py-3 font-mono text-xs">{so.orderDate}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">{so.lines.length}</td>
                    <td className="px-3 py-3 text-right font-mono">{inr(so.total)}</td>
                    <td className="px-3 py-3 text-right font-mono text-xs">
                      <div>{inr(so.amountReceived)}</div>
                      {receivable > 0 && <div className="text-[10px] text-[color:var(--color-warning)]">₹{receivable.toLocaleString('en-IN')} due</div>}
                    </td>
                    <td className="px-3 py-3">
                      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest">
                        <StageDot ok label="SO" />
                        <ArrowRight className="w-2.5 h-2.5 text-[color:var(--color-ink-faint)]" />
                        <StageDot ok={dispatched} label="Ship" />
                        <ArrowRight className="w-2.5 h-2.5 text-[color:var(--color-ink-faint)]" />
                        <StageDot ok={invoiced} label="Inv" />
                        <ArrowRight className="w-2.5 h-2.5 text-[color:var(--color-ink-faint)]" />
                        <StageDot ok={paid} label="Paid" />
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <StatusPill status={so.status} tone={STATUS_TONE[so.status]} />
                    </td>
                    <td className="px-3 py-3 text-right">
                      <button onClick={e => { e.stopPropagation(); setDrawer(so); }} className="text-xs text-[color:var(--color-crimson)] hover:underline">Open →</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {drawer && (
        <SODrawer
          so={drawer}
          customers={customers}
          onClose={() => setDrawer(null)}
          onAdvance={next => { saveSO(next); refresh(); setDrawer(next); }}
        />
      )}
    </div>
  );
}

function StageDot({ ok, label }: { ok?: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded ${ok ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' : 'bg-[color:var(--color-paper)] text-[color:var(--color-ink-muted)]'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${ok ? 'bg-[color:var(--color-success)]' : 'bg-[color:var(--color-ink-faint)]'}`} />
      {label}
    </span>
  );
}

function SODrawer({ so, customers, onClose, onAdvance }: { so: SalesOrder; customers: Customer[]; onClose: () => void; onAdvance: (s: SalesOrder) => void }) {
  const customer = customers.find(c => c.id === so.customerId);

  function confirmOrder() { onAdvance({ ...so, status: 'confirmed' }); }
  function pickOrder() { onAdvance({ ...so, status: 'picked' }); }
  function invoice() {
    const state = customer?.state?.slice(0, 3).toUpperCase() ?? 'DEL';
    const inv = `INV-${state}-2026-${(Math.floor(Math.random() * 9000) + 1000).toString()}`;
    onAdvance({ ...so, status: 'invoiced', invoiceNumber: inv });
  }
  function deliver() { onAdvance({ ...so, status: 'delivered', deliveryDate: new Date().toISOString().slice(0, 10) }); }
  function markPaid() { onAdvance({ ...so, status: 'paid', amountReceived: so.total, paymentMethod: so.paymentMethod ?? 'bank' }); }
  function cancel() { if (confirm('Cancel this sales order?')) onAdvance({ ...so, status: 'cancelled' }); }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Sales Order</div>
            <div className="font-serif text-2xl">{so.soNumber}</div>
            {so.invoiceNumber && <div className="font-mono text-xs text-[color:var(--color-ink-muted)]">Invoice {so.invoiceNumber}</div>}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Customer</div>
              <div className="text-sm font-medium">{customer?.name}</div>
              <div className="text-[11px] text-[color:var(--color-ink-muted)] font-mono">{customer?.gstin ?? '—'}</div>
            </div>
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Timeline</div>
              <div className="text-xs font-mono">Ordered {so.orderDate}</div>
              {so.deliveryDate && <div className="text-xs font-mono text-[color:var(--color-success)]">Delivered {so.deliveryDate}</div>}
              <div className="text-xs font-mono text-[color:var(--color-ink-muted)]">Terms: {customer?.creditDays}-day</div>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-1.5">
              <ClipboardList className="w-3 h-3" /> {so.lines.length} line{so.lines.length === 1 ? '' : 's'}
            </div>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                  <th className="text-left px-3 py-2">Title</th>
                  <th className="text-right px-3 py-2 w-16">Qty</th>
                  <th className="text-right px-3 py-2 w-20">MRP ₹</th>
                  <th className="text-right px-3 py-2 w-16">Disc</th>
                  <th className="text-right px-3 py-2 w-16">GST</th>
                  <th className="text-right px-3 py-2 w-24">Line ₹</th>
                </tr>
              </thead>
              <tbody>
                {so.lines.map((l, i) => {
                  const gross = l.qty * l.unitPrice;
                  const net = gross * (1 - l.discount / 100);
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
              <div><div className="text-[color:var(--color-ink-muted)]">Subtotal</div><div className="font-mono">{inr(so.subtotal)}</div></div>
              <div><div className="text-[color:var(--color-ink-muted)]">Discount</div><div className="font-mono text-[color:var(--color-crimson)]">−{inr(so.discountTotal)}</div></div>
              <div><div className="text-[color:var(--color-ink-muted)]">GST</div><div className="font-mono">{inr(so.gstTotal)}</div></div>
            </div>
            <div className="px-3 py-3 border-t border-[color:var(--color-line)] flex items-center justify-between bg-[color:var(--color-paper)]/40">
              <div className="text-sm">Total</div>
              <div className="font-serif text-2xl">{inr(so.total)}</div>
            </div>
            <div className="px-3 py-2 border-t border-[color:var(--color-line)] flex items-center justify-between text-xs">
              <div className="text-[color:var(--color-ink-muted)]">Received</div>
              <div className="font-mono">{inr(so.amountReceived)}</div>
            </div>
            <div className="px-3 py-2 border-t border-[color:var(--color-line)] flex items-center justify-between text-xs bg-[color:var(--color-warning)]/10">
              <div className="text-[color:var(--color-warning)]">Receivable</div>
              <div className="font-mono text-[color:var(--color-warning)]">{inr(so.total - so.amountReceived)}</div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-4">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Advance the SO</div>
            <div className="grid grid-cols-3 gap-2 text-sm">
              <button disabled={so.status !== 'quotation'} onClick={confirmOrder} className="h-10 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <CheckCircle2 className="w-4 h-4" /> Confirm
              </button>
              <button disabled={so.status !== 'confirmed'} onClick={pickOrder} className="h-10 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Truck className="w-4 h-4" /> Pick
              </button>
              <button disabled={so.status !== 'picked'} onClick={invoice} className="h-10 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <FileText className="w-4 h-4" /> Invoice
              </button>
              <button disabled={so.status !== 'invoiced'} onClick={deliver} className="h-10 border border-[color:var(--color-line)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Truck className="w-4 h-4" /> Deliver
              </button>
              <button disabled={!['invoiced', 'delivered'].includes(so.status)} onClick={markPaid} className="h-10 bg-[color:var(--color-ink)] text-white rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-crimson)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Wallet className="w-4 h-4" /> Mark paid
              </button>
              <button disabled={so.status === 'paid' || so.status === 'cancelled'} onClick={cancel} className="h-10 border border-[color:var(--color-danger)] text-[color:var(--color-danger)] rounded-md inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-danger)]/10 disabled:opacity-40 disabled:cursor-not-allowed">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            </div>
            {so.notes && (
              <div className="mt-4 text-xs text-[color:var(--color-ink-muted)]">
                <div className="font-medium text-[color:var(--color-ink)] mb-1">Notes</div>
                {so.notes}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
