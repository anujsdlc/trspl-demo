'use client';

import { useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES, BRAND_META, type StoreBrand } from '@/lib/stores';
import { loadMoves, appendMoves } from '@/lib/stock-ledger.client';
import { deltaIndex } from '@/lib/stock-ledger';
import {
  REPLENISHMENT_KEY, suggest, buildOrders, receiptMoves,
  type Suggestion, type ReplenishmentOrder,
} from '@/lib/replenishment';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import {
  RefreshCw, Download, AlertCircle, PackageCheck, ArrowLeft,
  Truck, CheckCircle2, XCircle, Boxes,
} from 'lucide-react';

const endpoint = `/api/erp/${encodeURIComponent(REPLENISHMENT_KEY)}`;

async function readOrders(): Promise<ReplenishmentOrder[]> {
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Replenishment store returned ${res.status}.`);
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as ReplenishmentOrder[]) : [];
}

async function writeOrders(rows: ReplenishmentOrder[]): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Replenishment store returned ${res.status}.`);
}

export function ReplenishmentConsole() {
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  const [orders, setOrders] = useState<ReplenishmentOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [brand, setBrand] = useState<StoreBrand | 'all'>('all');
  const [storeId, setStoreId] = useState<string>('all');
  const [suggestions, setSuggestions] = useState<Suggestion[] | null>(null);
  const [chosen, setChosen] = useState<Set<string>>(new Set());

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, moves, ord] = await Promise.all([loadClientCatalog(), loadMoves(), readOrders()]);
      setCatalog(cat);
      setStockIndex(deltaIndex(moves));
      setOrders(ord);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the stores.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const storesForBrand = useMemo(
    () => STORES.filter(s => brand === 'all' || s.brand === brand),
    [brand],
  );

  const generate = () => {
    const rows = suggest({
      catalog,
      stockIndex,
      orders,
      brands: brand === 'all' ? [] : [brand],
      storeIds: storeId === 'all' ? [] : [storeId],
    });
    setSuggestions(rows);
    setChosen(new Set(rows.map(r => `${r.productId}::${r.storeId}`)));
    setNotice(rows.length === 0 ? 'Nothing is below its reorder point in this scope.' : null);
  };

  const key = (r: Suggestion) => `${r.productId}::${r.storeId}`;

  const toggle = (r: Suggestion) => {
    setChosen(prev => {
      const next = new Set(prev);
      const k = key(r);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };

  const selected = useMemo(
    () => (suggestions ?? []).filter(r => chosen.has(key(r))),
    [suggestions, chosen],
  );

  const raise = async () => {
    if (selected.length === 0) return;
    setBusy(true);
    setError(null);
    try {
      const fresh = buildOrders(selected);
      const next = [...fresh, ...orders];
      await writeOrders(next);
      setOrders(next);
      setSuggestions(null);
      setChosen(new Set());
      setNotice(`Raised ${fresh.length} ${fresh.length === 1 ? 'order' : 'orders'} covering ${selected.length} positions.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The orders were not saved.');
    } finally {
      setBusy(false);
    }
  };

  const setStatus = async (id: string, status: ReplenishmentOrder['status']) => {
    const previous = orders;
    const at = new Date().toISOString();
    const updated = orders.map(o => (o.id === id ? { ...o, status, receivedAt: status === 'received' ? at : o.receivedAt } : o));
    setOrders(updated);
    setError(null);
    try {
      await writeOrders(updated);
      if (status === 'received') {
        const order = previous.find(o => o.id === id);
        if (order) {
          const moves = receiptMoves(order, at);
          const all = await appendMoves(moves);
          setStockIndex(deltaIndex(all));
          const units = moves.reduce((s, m) => s + m.qty, 0);
          setNotice(`${order.reference} received — ${units} units onto the shelf at ${order.storeCode}.`);
        }
      }
    } catch (err) {
      setOrders(previous);
      setError(err instanceof Error ? err.message : 'The change was not saved.');
    }
  };

  const exportSuggestions = () => {
    downloadCSV(
      'trs-replenishment.csv',
      ['sku', 'title', 'store_code', 'on_hand', 'reorder_at', 'on_order', 'suggested_qty', 'unit_price'],
      (suggestions ?? []).map(r => ({
        sku: r.sku,
        title: r.title,
        store_code: r.storeCode,
        on_hand: String(r.onHand),
        reorder_at: String(r.reorderAt),
        on_order: String(r.onOrder),
        suggested_qty: String(r.suggestedQty),
        unit_price: String(r.unitPrice),
      })),
    );
  };

  const openOrders = orders.filter(o => o.status === 'draft' || o.status === 'placed');

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin/inventory" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Inventory
      </NextLink>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Buying</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Replenishment</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            What each store has fallen short of, counted from the stock ledger and net of what is already on order.
            Receiving an order puts the units on the shelf.
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

      <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white mb-6">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Scope</div>
        <div className="flex items-end gap-3 flex-wrap">
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Store brand</div>
            <select
              value={brand}
              onChange={e => { setBrand(e.target.value as StoreBrand | 'all'); setStoreId('all'); }}
              className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
            >
              <option value="all">Every brand</option>
              {Object.entries(BRAND_META).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Store</div>
            <select
              value={storeId}
              onChange={e => setStoreId(e.target.value)}
              className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
            >
              <option value="all">Every store</option>
              {storesForBrand.map(s => <option key={s.id} value={s.id}>{s.code} · {s.location}</option>)}
            </select>
          </label>
          <button
            onClick={generate}
            disabled={loading}
            className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50"
          >
            <Boxes className="w-3.5 h-3.5" /> Generate suggestions
          </button>
        </div>
      </div>

      {suggestions && suggestions.length > 0 && (
        <div className="border border-[color:var(--color-line)] rounded-xl bg-white mb-8 overflow-hidden">
          <div className="p-4 border-b border-[color:var(--color-line)] flex items-center justify-between gap-3 flex-wrap">
            <div>
              <div className="text-sm font-medium">{suggestions.length} positions below reorder point</div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">
                {selected.length} selected · {inr(selected.reduce((s, r) => s + r.suggestedQty * r.unitPrice, 0))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={exportSuggestions} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white">
                <Download className="w-3.5 h-3.5" /> Export CSV
              </button>
              <button
                onClick={raise}
                disabled={selected.length === 0 || busy}
                className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-50"
              >
                {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <PackageCheck className="w-3.5 h-3.5" />}
                Raise orders
              </button>
            </div>
          </div>
          <div className="max-h-[520px] overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] sticky top-0">
                <tr>
                  <th className="px-3 py-2.5 w-10"></th>
                  <th className="px-3 py-2.5 text-left font-normal">Product</th>
                  <th className="px-3 py-2.5 text-left font-normal">Store</th>
                  <th className="px-3 py-2.5 text-right font-normal">On hand</th>
                  <th className="px-3 py-2.5 text-right font-normal">Reorder at</th>
                  <th className="px-3 py-2.5 text-right font-normal">On order</th>
                  <th className="px-3 py-2.5 text-right font-normal">Suggested</th>
                  <th className="px-3 py-2.5 text-right font-normal">Value</th>
                </tr>
              </thead>
              <tbody>
                {suggestions.map(r => (
                  <tr key={key(r)} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/40">
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={chosen.has(key(r))}
                        onChange={() => toggle(r)}
                        aria-label={`Include ${r.sku} at ${r.storeCode}`}
                        className="accent-[color:var(--color-crimson)]"
                      />
                    </td>
                    <td className="px-3 py-2">
                      <div className="truncate max-w-[280px]">{r.title}</div>
                      <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{r.sku}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{r.storeCode}</td>
                    <td className={`px-3 py-2 text-right font-mono ${r.onHand === 0 ? 'text-[color:var(--color-danger)]' : ''}`}>{r.onHand}</td>
                    <td className="px-3 py-2 text-right font-mono text-[color:var(--color-ink-muted)]">{r.reorderAt}</td>
                    <td className="px-3 py-2 text-right font-mono text-[color:var(--color-ink-muted)]">{r.onOrder || '—'}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{r.suggestedQty}</td>
                    <td className="px-3 py-2 text-right font-mono">{inr(r.suggestedQty * r.unitPrice)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
        <div className="p-4 border-b border-[color:var(--color-line)]">
          <div className="text-sm font-medium">Replenishment orders</div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">
            {openOrders.length} open · {orders.length} in total
          </div>
        </div>
        {orders.length === 0 ? (
          <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">
            No orders raised yet. Generate suggestions above and raise them.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-normal">Reference</th>
                <th className="px-4 py-2.5 text-left font-normal">Supplier</th>
                <th className="px-4 py-2.5 text-left font-normal">Store</th>
                <th className="px-4 py-2.5 text-left font-normal">Raised</th>
                <th className="px-4 py-2.5 text-right font-normal">Lines</th>
                <th className="px-4 py-2.5 text-right font-normal">Units</th>
                <th className="px-4 py-2.5 text-right font-normal">Value</th>
                <th className="px-4 py-2.5 text-left font-normal">Status</th>
                <th className="px-4 py-2.5 text-right font-normal">Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(o => {
                const units = o.lines.reduce((s, l) => s + l.qty, 0);
                return (
                  <tr key={o.id} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/40">
                    <td className="px-4 py-3 font-mono text-xs">{o.reference}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ background: BRAND_META[o.brand].color }} />
                        {o.supplier}
                      </span>
                      {o.supplierGstin && (
                        <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">
                          {o.supplierGstin} · {o.supplierState}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs">{o.storeCode}</td>
                    <td className="px-4 py-3 text-xs text-[color:var(--color-ink-muted)]">
                      {new Date(o.raisedAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-right font-mono">{o.lines.length}</td>
                    <td className="px-4 py-3 text-right font-mono">{units}</td>
                    <td className="px-4 py-3 text-right font-mono">
                      {inr(o.total)}
                      {o.taxableValue != null && (
                        <div className="text-[10px] text-[color:var(--color-ink-muted)]">
                          {inr(o.taxableValue)} + {(o.igst ?? 0) > 0 ? `IGST ${inr(o.igst ?? 0)}` : `GST ${inr((o.cgst ?? 0) + (o.sgst ?? 0))}`}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                        o.status === 'received' ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]' :
                        o.status === 'cancelled' ? 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]' :
                        o.status === 'placed' ? 'bg-amber-100 text-amber-800' :
                        'bg-[color:var(--color-ink)]/10'
                      }`}>{o.status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      {o.status === 'draft' && (
                        <button onClick={() => setStatus(o.id, 'placed')} className="h-8 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5">
                          <Truck className="w-3 h-3" /> Place
                        </button>
                      )}
                      {o.status === 'placed' && (
                        <button onClick={() => setStatus(o.id, 'received')} className="h-8 px-3 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5">
                          <PackageCheck className="w-3 h-3" /> Receive
                        </button>
                      )}
                      {(o.status === 'draft' || o.status === 'placed') && (
                        <button onClick={() => setStatus(o.id, 'cancelled')} className="ml-2 h-8 px-2 text-xs text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> Cancel
                        </button>
                      )}
                      {o.status === 'received' && o.receivedAt && (
                        <span className="text-xs text-[color:var(--color-ink-muted)]">
                          {new Date(o.receivedAt).toLocaleDateString('en-IN')}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
