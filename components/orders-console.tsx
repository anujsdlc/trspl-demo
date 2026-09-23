'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import {
  CREDIT_NOTES_KEY, CREDIT_REASON_LABEL, creditAgainstOrder, creditedQuantities,
  restockMoves, type CreditNote, type CreditReason,
} from '@/lib/credit-notes';
import { sectionFor } from '@/lib/gst-returns';
import { appendMoves } from '@/lib/stock-ledger.client';
import { STORES } from '@/lib/stores';
import { inr, relativeTime } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import {
  ShoppingCart, Search, RefreshCw, Download, X, Store, Truck,
  CreditCard, Smartphone, Banknote, AlertCircle, Receipt, Undo2, Printer,
} from 'lucide-react';

const STATUSES: Order['status'][] = ['placed', 'packing', 'shipped', 'delivered', 'cancelled'];

const STATUS_STYLE: Record<Order['status'], string> = {
  placed: 'bg-[color:var(--color-ink)]/10 text-[color:var(--color-ink)]',
  packing: 'bg-amber-100 text-amber-800',
  shipped: 'bg-blue-100 text-blue-800',
  delivered: 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]',
  cancelled: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
};

const PAYMENT_ICON = { card: CreditCard, upi: Smartphone, cod: Banknote } as const;

async function readOrders(): Promise<Order[]> {
  const res = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Order store returned ${res.status}.`);
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as Order[]) : [];
}

const notesEndpoint = `/api/erp/${encodeURIComponent(CREDIT_NOTES_KEY)}`;

async function readNotes(): Promise<CreditNote[]> {
  const res = await fetch(notesEndpoint, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as CreditNote[]) : [];
}

async function writeNotes(rows: CreditNote[]): Promise<void> {
  const res = await fetch(notesEndpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Credit note store returned ${res.status}.`);
}

async function writeOrders(rows: Order[]): Promise<void> {
  const res = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Order store returned ${res.status}.`);
}

export function OrdersConsole() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState(useSearchParams().get('q') ?? '');
  const [status, setStatus] = useState<'all' | Order['status']>('all');
  const [open, setOpen] = useState<Order | null>(null);
  const [fetchedAt, setFetchedAt] = useState(0);

  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [crediting, setCrediting] = useState(false);
  const [creditQty, setCreditQty] = useState<Record<string, number>>({});
  const [creditReason, setCreditReason] = useState<CreditReason>('return');
  const [restock, setRestock] = useState(true);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [rows, cns] = await Promise.all([readOrders(), readNotes()]);
      setOrders(rows);
      setNotes(cns);
      setFetchedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the order store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const setStatusOf = async (id: string, next: Order['status']) => {
    const previous = orders;
    const updated = orders.map(o => (o.id === id ? { ...o, status: next } : o));
    setOrders(updated);
    setOpen(o => (o && o.id === id ? { ...o, status: next } : o));
    try {
      await writeOrders(updated);
    } catch (err) {
      setOrders(previous);
      setError(err instanceof Error ? err.message : 'The status change was not saved.');
    }
  };

  const issueCredit = async () => {
    if (!open) return;
    setCrediting(true);
    setError(null);
    try {
      const res = creditAgainstOrder({
        order: open,
        quantities: creditQty,
        reason: creditReason,
        section: sectionFor(open),
        existing: notes,
        restock,
        sequence: notes.length + 1,
      });
      if (!res.ok) { setError(res.reason); return; }

      const next = [res.note, ...notes];
      await writeNotes(next);
      setNotes(next);

      const moves = restockMoves(res.note);
      if (moves.length > 0) await appendMoves(moves);

      setCreditQty({});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The credit note was not saved.');
    } finally {
      setCrediting(false);
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter(o => {
      if (status !== 'all' && o.status !== status) return false;
      if (!q) return true;
      return (
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.customer.phone.includes(q) ||
        o.lines.some(l => l.title.toLowerCase().includes(q) || l.sku.toLowerCase().includes(q))
      );
    });
  }, [orders, query, status]);

  const totals = useMemo(() => ({
    count: orders.length,
    open: orders.filter(o => o.status === 'placed' || o.status === 'packing').length,
    revenue: orders.filter(o => o.status !== 'cancelled').reduce((s, o) => s + o.total, 0),
    units: orders.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.qty, 0), 0),
  }), [orders]);

  const exportCsv = () => {
    downloadCSV(
      'trs-orders.csv',
      ['order_id', 'placed_at', 'customer', 'email', 'phone', 'delivery', 'store', 'payment', 'lines', 'units', 'total', 'points', 'status'],
      filtered.map(o => ({
        order_id: o.id,
        placed_at: o.placedAt,
        customer: o.customer.name,
        email: o.customer.email,
        phone: o.customer.phone,
        delivery: o.delivery.method,
        store: o.delivery.storeCode || '',
        payment: o.payment.method,
        lines: String(o.lines.length),
        units: String(o.lines.reduce((s, l) => s + l.qty, 0)),
        total: String(o.total),
        points: String(o.pointsEarned),
        status: o.status,
      })),
    );
  };

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Order desk</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Orders</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button
            onClick={exportCsv}
            disabled={filtered.length === 0}
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile label="Orders" value={totals.count.toLocaleString()} />
        <Tile label="Awaiting action" value={totals.open.toLocaleString()} />
        <Tile label="Units sold" value={totals.units.toLocaleString()} />
        <Tile label="Order value" value={inr(totals.revenue)} />
      </div>

      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Order, customer, email, SKU"
            aria-label="Search orders"
            className="h-9 pl-9 pr-3 w-72 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all', ...STATUSES] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatus(s)}
              className={`h-8 px-3 rounded-full text-xs capitalize transition ${status === s ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'border border-[color:var(--color-line)] bg-white'}`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-[color:var(--color-ink-muted)]">Reading the order store…</div>
      ) : orders.length === 0 ? (
        <div className="py-24 text-center">
          <ShoppingCart className="w-8 h-8 mx-auto mb-3 text-[color:var(--color-ink-faint)]" />
          <div className="font-serif text-3xl mb-2">No orders yet.</div>
          <div className="text-sm text-[color:var(--color-ink-muted)] max-w-md mx-auto">
            Orders appear here the moment a shopper completes checkout on the storefront.
          </div>
        </div>
      ) : (
        <div className="border border-[color:var(--color-line)] rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <Th>Order</Th><Th>Placed</Th><Th>Customer</Th><Th>Fulfilment</Th>
                <Th>Pay</Th><Th className="text-right">Units</Th><Th className="text-right">Total</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(o => {
                const PayIcon = PAYMENT_ICON[o.payment.method];
                const units = o.lines.reduce((s, l) => s + l.qty, 0);
                const store = STORES.find(s => s.code === o.delivery.storeCode);
                return (
                  <tr
                    key={o.id}
                    onClick={() => setOpen(o)}
                    className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)] cursor-pointer"
                  >
                    <Td className="font-mono text-xs">{o.id}</Td>
                    <Td className="text-[color:var(--color-ink-muted)] text-xs">{relativeTime(Math.max(0, fetchedAt - new Date(o.placedAt).getTime()))}</Td>
                    <Td>
                      <div>{o.customer.name}</div>
                      <div className="text-[color:var(--color-ink-muted)] text-xs">{o.customer.email}</div>
                    </Td>
                    <Td className="text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        {o.delivery.method === 'pickup' ? <Store className="w-3.5 h-3.5" /> : <Truck className="w-3.5 h-3.5" />}
                        {o.delivery.method === 'pickup' ? (store ? `${store.code}` : 'Store pickup') : o.delivery.pincode || 'Ship home'}
                      </span>
                    </Td>
                    <Td><PayIcon className="w-3.5 h-3.5" aria-label={o.payment.method} /></Td>
                    <Td className="text-right font-mono">{units}</Td>
                    <Td className="text-right font-mono">{inr(o.total)}</Td>
                    <Td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${STATUS_STYLE[o.status]}`}>{o.status}</span>
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">No order matches that filter.</div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(null)}>
          <div className="w-full max-w-lg h-full bg-white overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="font-mono text-xs text-[color:var(--color-ink-muted)]">{open.id}</div>
                <div className="font-serif text-3xl">{open.customer.name}</div>
                <div className="text-sm text-[color:var(--color-ink-muted)]">{open.customer.email} · {open.customer.phone}</div>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div className="mb-6">
              <a
                href={`/print/invoice/${encodeURIComponent(open.id)}`}
                target="_blank"
                rel="noreferrer"
                className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white"
              >
                <Printer className="w-3.5 h-3.5" /> Tax invoice
              </a>
            </div>

            <div className="mb-6">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Status</div>
              <div className="flex flex-wrap gap-1">
                {STATUSES.map(s => (
                  <button
                    key={s}
                    onClick={() => setStatusOf(open.id, s)}
                    className={`h-8 px-3 rounded-full text-xs capitalize transition ${open.status === s ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'border border-[color:var(--color-line)]'}`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
              <Field label="Placed">{new Date(open.placedAt).toLocaleString('en-IN')}</Field>
              <Field label="Payment">{open.payment.method.toUpperCase()}{open.payment.maskedCard ? ` · ${open.payment.maskedCard}` : ''}</Field>
              <Field label="Fulfilment">{open.delivery.method === 'pickup' ? `Pickup · ${open.delivery.storeCode}` : 'Ship home'}</Field>
              <Field label="Points earned">{open.pointsEarned.toLocaleString()}</Field>
              {open.delivery.method === 'ship' && (
                <Field label="Address" wide>{open.delivery.address}, {open.delivery.city} {open.delivery.pincode}</Field>
              )}
            </div>

            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Lines</div>
            <div className="border border-[color:var(--color-line)] rounded-lg divide-y divide-[color:var(--color-line)] mb-6">
              {open.lines.map(l => (
                <div key={l.productId} className="p-3 flex items-center justify-between gap-3 text-sm">
                  <div className="min-w-0">
                    <div className="truncate">{l.title}</div>
                    <div className="font-mono text-xs text-[color:var(--color-ink-muted)]">{l.sku} · {l.qty} × {inr(l.unitPrice)}</div>
                  </div>
                  <div className="font-mono shrink-0">{inr(l.lineTotal)}</div>
                </div>
              ))}
            </div>

            <CreditPanel
              order={open}
              notes={notes}
              qty={creditQty}
              setQty={setCreditQty}
              reason={creditReason}
              setReason={setCreditReason}
              restock={restock}
              setRestock={setRestock}
              busy={crediting}
              onIssue={issueCredit}
            />

            <div className="space-y-1 text-sm">
              <Row label="Subtotal" value={inr(open.subtotal)} />
              <Row label="Delivery" value={open.delivery_fee === 0 ? 'Free' : inr(open.delivery_fee)} />
              {open.discount > 0 && <Row label="Discount" value={`− ${inr(open.discount)}`} />}
              <div className="pt-2 border-t border-[color:var(--color-line)]">
                <Row label="Total" value={inr(open.total)} strong />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-[color:var(--color-line)] rounded-xl bg-white">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <th className={`px-4 py-2.5 text-left font-normal ${className}`}>{children}</th>;
}

function Td({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-4 py-3 align-top ${className}`}>{children}</td>;
}

function Field({ label, children, wide }: { label: string; children: React.ReactNode; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
      <div>{children}</div>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex justify-between ${strong ? 'font-serif text-xl' : ''}`}>
      <span className={strong ? '' : 'text-[color:var(--color-ink-muted)]'}>{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}

function CreditPanel({
  order, notes, qty, setQty, reason, setReason, restock, setRestock, busy, onIssue,
}: {
  order: Order;
  notes: CreditNote[];
  qty: Record<string, number>;
  setQty: (v: Record<string, number>) => void;
  reason: CreditReason;
  setReason: (v: CreditReason) => void;
  restock: boolean;
  setRestock: (v: boolean) => void;
  busy: boolean;
  onIssue: () => void;
}) {
  const raised = notes.filter(n => n.against.kind === 'order' && n.against.orderId === order.id);
  const already = creditedQuantities(order.id, notes);
  const selected = Object.values(qty).reduce((t, v) => t + (v || 0), 0);
  const fullyCredited = order.lines.every(l => (already.get(l.productId) ?? 0) >= l.qty);

  return (
    <div className="mb-6">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2 flex items-center gap-1.5">
        <Receipt className="w-3 h-3" /> Credit note
      </div>

      {raised.length > 0 && (
        <div className="mb-3 space-y-1">
          {raised.map(n => (
            <div key={n.id} className="flex items-center justify-between gap-2 text-xs px-3 py-2 rounded-md bg-[color:var(--color-paper)]">
              <a href={`/print/credit-note/${encodeURIComponent(n.number)}`} target="_blank" rel="noreferrer" className="font-mono underline">
                {n.number}
              </a>
              <span className="text-[color:var(--color-ink-muted)]">{CREDIT_REASON_LABEL[n.reason]}</span>
              <span className="font-mono">− {inr(n.total)}</span>
            </div>
          ))}
        </div>
      )}

      {fullyCredited ? (
        <div className="text-xs text-[color:var(--color-ink-muted)] px-3 py-2 rounded-md border border-[color:var(--color-line)]">
          Every line on this order has been credited in full.
        </div>
      ) : (
        <div className="border border-[color:var(--color-line)] rounded-lg p-3 space-y-3">
          {order.lines.map(l => {
            const left = l.qty - (already.get(l.productId) ?? 0);
            return (
              <div key={l.productId} className="flex items-center justify-between gap-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate">{l.title}</div>
                  <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">
                    {l.sku} · {left} of {l.qty} left to credit
                  </div>
                </div>
                <input
                  type="number"
                  min={0}
                  max={left}
                  value={qty[l.productId] ?? 0}
                  disabled={left <= 0}
                  onChange={e => setQty({ ...qty, [l.productId]: Math.max(0, Math.min(left, Number(e.target.value))) })}
                  aria-label={`Quantity to credit for ${l.sku}`}
                  className="h-8 w-16 px-2 border border-[color:var(--color-line)] rounded-md text-sm text-center font-mono disabled:opacity-40"
                />
              </div>
            );
          })}

          <div className="grid grid-cols-2 gap-2 pt-1">
            <label className="block">
              <div className="text-[10px] text-[color:var(--color-ink-muted)] mb-1">Reason</div>
              <select
                value={reason}
                onChange={e => setReason(e.target.value as CreditReason)}
                className="h-8 px-2 w-full border border-[color:var(--color-line)] rounded-md text-xs bg-white"
              >
                {(Object.keys(CREDIT_REASON_LABEL) as CreditReason[]).map(k => (
                  <option key={k} value={k}>{CREDIT_REASON_LABEL[k]}</option>
                ))}
              </select>
            </label>
            <label className="flex items-end gap-2 text-xs pb-1">
              <input
                type="checkbox"
                checked={restock}
                onChange={e => setRestock(e.target.checked)}
                className="accent-[color:var(--color-crimson)]"
              />
              Put stock back
            </label>
          </div>

          <button
            onClick={onIssue}
            disabled={busy || selected === 0}
            className="w-full h-9 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Undo2 className="w-3.5 h-3.5" />}
            Issue credit note{selected > 0 ? ` for ${selected} ${selected === 1 ? 'unit' : 'units'}` : ''}
          </button>
        </div>
      )}
    </div>
  );
}
