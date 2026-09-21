'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES, BRAND_META } from '@/lib/stores';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import { loadMoves, appendMoves } from '@/lib/stock-ledger.client';
import { deltaIndex, onHand } from '@/lib/stock-ledger';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import {
  TILL_SESSIONS_KEY,
  openSession,
  ringUp,
  tillTotals,
  closeSession,
  openSessionFor,
  newTillOrderId,
  type TillSession,
  type TillPayment,
  type BasketLine,
} from '@/lib/till';
import { inr } from '@/lib/utils';
import {
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Minus,
  Trash2,
  Lock,
  Unlock,
  Banknote,
  CreditCard,
  Smartphone,
  Receipt,
} from 'lucide-react';

const sessionsEndpoint = `/api/erp/${encodeURIComponent(TILL_SESSIONS_KEY)}`;
const ordersEndpoint = `/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`;

async function readJson<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as T[]) : [];
}

async function writeJson(url: string, rows: unknown[]): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Store returned ${res.status}.`);
}

const TENDERS: { key: TillPayment; label: string; icon: React.ElementType }[] = [
  { key: 'cash', label: 'Cash', icon: Banknote },
  { key: 'card', label: 'Card', icon: CreditCard },
  { key: 'upi', label: 'UPI', icon: Smartphone },
];

export function TillConsole() {
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  const [sessions, setSessions] = useState<TillSession[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [storeId, setStoreId] = useState(STORES[0].id);
  const [cashier, setCashier] = useState('');
  const [float, setFloat] = useState(2000);
  const [basket, setBasket] = useState<BasketLine[]>([]);
  const [tender, setTender] = useState<TillPayment>('cash');
  const [counted, setCounted] = useState(0);
  const [search, setSearch] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, gst, s, o, moves] = await Promise.all([
        loadClientCatalog(), loadGST(),
        readJson<TillSession>(sessionsEndpoint),
        readJson<Order>(ordersEndpoint),
        loadMoves(),
      ]);
      setCatalog(cat);
      setRegistrations(gst);
      setSessions(s);
      setOrders(o);
      setStockIndex(deltaIndex(moves));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not open the till.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const store = STORES.find(s => s.id === storeId)!;
  const active = openSessionFor(storeId, sessions);
  const totals = active ? tillTotals(active, orders) : null;

  const shelf = useMemo(
    () => catalog
      .filter(p => p.brand === store.brand)
      .map(p => ({ product: p, qty: onHand(p.id, store.id, stockIndex) }))
      .filter(x => x.qty > 0)
      .filter(x => {
        const q = search.trim().toLowerCase();
        return !q || x.product.title.toLowerCase().includes(q) || x.product.sku.toLowerCase().includes(q);
      })
      .slice(0, 60),
    [catalog, store, stockIndex, search],
  );

  const basketTotal = basket.reduce((t, l) => t + l.product.price * l.qty, 0);

  const add = (product: Product) => {
    setBasket(prev => {
      const found = prev.find(l => l.product.id === product.id);
      if (found) return prev.map(l => (l.product.id === product.id ? { ...l, qty: l.qty + 1 } : l));
      return [...prev, { product, qty: 1 }];
    });
  };

  const bump = (productId: string, by: number) => {
    setBasket(prev => prev
      .map(l => (l.product.id === productId ? { ...l, qty: l.qty + by } : l))
      .filter(l => l.qty > 0));
  };

  const start = async () => {
    setBusy(true);
    setError(null);
    const res = openSession(store, cashier, float, sessions, registrations);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      const next = [res.value, ...sessions];
      await writeJson(sessionsEndpoint, next);
      setSessions(next);
      setCashier('');
      setNotice(`${res.value.reference} open at ${store.code} — float ${inr(res.value.openingFloat)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The shift was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const sell = async () => {
    if (!active) return;
    setBusy(true);
    setError(null);
    const orderId = newTillOrderId(active.reference, active.orderIds.length + 1);
    const res = ringUp(active, store, basket, tender, registrations, stockIndex, orderId);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }

    try {
      const nextOrders = [res.value.order, ...orders];
      await writeJson(ordersEndpoint, nextOrders);
      setOrders(nextOrders);

      const nextSessions = sessions.map(s =>
        s.id === active.id ? { ...s, orderIds: [...s.orderIds, orderId] } : s);
      await writeJson(sessionsEndpoint, nextSessions);
      setSessions(nextSessions);

      const all = await appendMoves(res.value.moves);
      setStockIndex(deltaIndex(all));

      setBasket([]);
      setNotice(`${orderId} · ${inr(res.value.order.total)} taken by ${tender}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The sale was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const close = async () => {
    if (!active) return;
    setBusy(true);
    setError(null);
    const res = closeSession(active, orders, counted);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      const next = sessions.map(s => (s.id === active.id ? res.value : s));
      await writeJson(sessionsEndpoint, next);
      setSessions(next);
      const d = res.value.difference ?? 0;
      setNotice(
        d === 0
          ? `${res.value.reference} closed — the drawer balances.`
          : `${res.value.reference} closed — drawer ${d > 0 ? 'over' : 'short'} by ${inr(Math.abs(d))}.`,
      );
      setCounted(0);
      setBasket([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The shift was not closed.');
    } finally {
      setBusy(false);
    }
  };

  const recent = sessions.slice(0, 8);

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Console
      </NextLink>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Shop floor · Point of sale</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">The till</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            A shift opens with a float, rings up what crosses the counter, and closes against a counted drawer.
            Each sale takes stock off this store&apos;s shelf and is reported under its registration.
          </p>
        </div>
        <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}
      {notice && !error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-success)]" />
          <span>{notice}</span>
        </div>
      )}

      <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white mb-6 flex items-end gap-3 flex-wrap">
        <label className="block">
          <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Till</div>
          <select
            value={storeId}
            onChange={e => { setStoreId(e.target.value); setBasket([]); }}
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white min-w-[280px]"
          >
            {STORES.map(s => (
              <option key={s.id} value={s.id}>
                {s.code} · {s.location} · {BRAND_META[s.brand].name}
              </option>
            ))}
          </select>
        </label>
        <div className="text-xs text-[color:var(--color-ink-muted)] pb-2">
          {store.state} · {registrations.find(r => r.stateCode === store.stateCode)?.gstin ?? 'no registration'}
        </div>
        <div className="ml-auto pb-1">
          {active
            ? <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]"><Unlock className="w-3 h-3" /> {active.reference} open · {active.cashier}</span>
            : <span className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-full bg-[color:var(--color-ink)]/10"><Lock className="w-3 h-3" /> Closed</span>}
        </div>
      </div>

      {!active ? (
        <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white max-w-lg">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Open a shift</div>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <label className="block">
              <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Cashier</div>
              <input value={cashier} onChange={e => setCashier(e.target.value)} placeholder="Who is on the till" className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
            </label>
            <label className="block">
              <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Opening float (₹)</div>
              <input type="number" min={0} value={float} onChange={e => setFloat(Math.max(0, Number(e.target.value)))} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm font-mono" />
            </label>
          </div>
          <button onClick={start} disabled={busy || !cashier.trim()} className="h-10 px-5 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50">
            <Unlock className="w-3.5 h-3.5" /> Open the till
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_380px] gap-6">
          <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
            <div className="p-4 border-b border-[color:var(--color-line)] flex items-center justify-between gap-3 flex-wrap">
              <div>
                <div className="text-sm font-medium">On the shelf</div>
                <div className="text-xs text-[color:var(--color-ink-muted)]">{BRAND_META[store.brand].name} · {store.code}</div>
              </div>
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search or scan"
                aria-label="Search the shelf"
                className="h-9 px-3 w-56 border border-[color:var(--color-line)] rounded-md text-sm"
              />
            </div>
            <div className="max-h-[520px] overflow-auto divide-y divide-[color:var(--color-line)]">
              {shelf.map(({ product, qty }) => (
                <button
                  key={product.id}
                  onClick={() => add(product)}
                  className="w-full px-4 py-3 flex items-center justify-between gap-3 text-left hover:bg-[color:var(--color-paper)]/60 transition"
                >
                  <div className="min-w-0">
                    <div className="text-sm truncate">{product.title}</div>
                    <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{product.sku} · {qty} on hand</div>
                  </div>
                  <div className="font-mono text-sm shrink-0">{inr(product.price)}</div>
                </button>
              ))}
              {shelf.length === 0 && (
                <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">
                  Nothing on this shelf matches.
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
              <div className="p-4 border-b border-[color:var(--color-line)] text-sm font-medium flex items-center gap-2">
                <Receipt className="w-3.5 h-3.5" /> On the counter
              </div>
              <div className="divide-y divide-[color:var(--color-line)] max-h-64 overflow-auto">
                {basket.map(l => (
                  <div key={l.product.id} className="px-4 py-2.5 flex items-center justify-between gap-2 text-sm">
                    <div className="min-w-0 flex-1">
                      <div className="truncate">{l.product.title}</div>
                      <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{inr(l.product.price)} each</div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button onClick={() => bump(l.product.id, -1)} aria-label="One fewer" className="w-7 h-7 border border-[color:var(--color-line)] rounded"><Minus className="w-3 h-3 mx-auto" /></button>
                      <span className="w-7 text-center font-mono text-xs">{l.qty}</span>
                      <button onClick={() => bump(l.product.id, 1)} aria-label="One more" className="w-7 h-7 border border-[color:var(--color-line)] rounded"><Plus className="w-3 h-3 mx-auto" /></button>
                      <button onClick={() => bump(l.product.id, -l.qty)} aria-label="Remove" className="w-7 h-7 rounded"><Trash2 className="w-3 h-3 mx-auto text-[color:var(--color-ink-muted)]" /></button>
                    </div>
                  </div>
                ))}
                {basket.length === 0 && (
                  <div className="py-10 text-center text-xs text-[color:var(--color-ink-muted)]">
                    Tap something on the shelf.
                  </div>
                )}
              </div>
              <div className="p-4 border-t border-[color:var(--color-line)] space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[color:var(--color-ink-muted)]">Total</span>
                  <span className="font-serif text-2xl">{inr(basketTotal)}</span>
                </div>
                <div className="grid grid-cols-3 gap-1.5">
                  {TENDERS.map(t => (
                    <button
                      key={t.key}
                      onClick={() => setTender(t.key)}
                      className={`h-9 rounded-md text-xs inline-flex items-center justify-center gap-1.5 border transition ${tender === t.key ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)] border-[color:var(--color-ink)]' : 'border-[color:var(--color-line)]'}`}
                    >
                      <t.icon className="w-3.5 h-3.5" /> {t.label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={sell}
                  disabled={busy || basket.length === 0}
                  className="w-full h-11 bg-[color:var(--color-crimson)] text-white rounded-md text-sm font-medium inline-flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {busy ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
                  Take {inr(basketTotal)}
                </button>
              </div>
            </div>

            {totals && (
              <div className="border border-[color:var(--color-line)] rounded-xl bg-white p-4">
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">This shift</div>
                <div className="space-y-1.5 text-sm">
                  <Row label="Receipts" value={totals.orders.toString()} />
                  <Row label="Units" value={totals.units.toString()} />
                  <Row label="Cash" value={inr(totals.cash)} />
                  <Row label="Card" value={inr(totals.card)} />
                  <Row label="UPI" value={inr(totals.upi)} />
                  <div className="pt-1.5 border-t border-[color:var(--color-line)]">
                    <Row label="Takings" value={inr(totals.takings)} />
                    <Row label={`Drawer should hold (float ${inr(active.openingFloat)})`} value={inr(totals.expectedCash)} strong />
                  </div>
                </div>

                <div className="mt-4 pt-4 border-t border-[color:var(--color-line)]">
                  <label className="block mb-2">
                    <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Counted in the drawer (₹)</div>
                    <input type="number" min={0} value={counted} onChange={e => setCounted(Math.max(0, Number(e.target.value)))} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm font-mono" />
                  </label>
                  {counted > 0 && counted !== totals.expectedCash && (
                    <div className={`text-xs mb-2 ${counted < totals.expectedCash ? 'text-[color:var(--color-danger)]' : 'text-amber-700'}`}>
                      {counted < totals.expectedCash ? 'Short' : 'Over'} by {inr(Math.abs(counted - totals.expectedCash))}
                    </div>
                  )}
                  <button onClick={close} disabled={busy} className="w-full h-10 border border-[color:var(--color-line)] rounded-md text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50">
                    <Lock className="w-3.5 h-3.5" /> Close the shift
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {recent.length > 0 && (
        <div className="mt-8 border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
          <div className="p-4 border-b border-[color:var(--color-line)] text-sm font-medium">Recent shifts</div>
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-normal">Shift</th>
                <th className="px-4 py-2.5 text-left font-normal">Till</th>
                <th className="px-4 py-2.5 text-left font-normal">Cashier</th>
                <th className="px-4 py-2.5 text-right font-normal">Receipts</th>
                <th className="px-4 py-2.5 text-right font-normal">Expected</th>
                <th className="px-4 py-2.5 text-right font-normal">Counted</th>
                <th className="px-4 py-2.5 text-right font-normal">Difference</th>
                <th className="px-4 py-2.5 text-left font-normal">Status</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(s => (
                <tr key={s.id} className="border-t border-[color:var(--color-line)]">
                  <td className="px-4 py-3 font-mono text-xs">{s.reference}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.storeCode}</td>
                  <td className="px-4 py-3">{s.cashier}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.orderIds.length}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.expectedCash != null ? inr(s.expectedCash) : '—'}</td>
                  <td className="px-4 py-3 text-right font-mono">{s.countedCash != null ? inr(s.countedCash) : '—'}</td>
                  <td className={`px-4 py-3 text-right font-mono ${s.difference ? (s.difference < 0 ? 'text-[color:var(--color-danger)]' : 'text-amber-700') : ''}`}>
                    {s.difference != null ? (s.difference === 0 ? 'balanced' : inr(s.difference)) : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${s.status === 'open' ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]' : 'bg-[color:var(--color-ink)]/10'}`}>{s.status}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between gap-3">
      <span className={strong ? '' : 'text-[color:var(--color-ink-muted)]'}>{label}</span>
      <span className={`font-mono shrink-0 ${strong ? 'font-medium' : ''}`}>{value}</span>
    </div>
  );
}
