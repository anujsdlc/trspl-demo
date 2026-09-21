'use client';

import { useEffect, useMemo, useState } from 'react';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { STORES, BRAND_META, type StoreBrand } from '@/lib/stores';
import { inr, pct } from '@/lib/utils';
import { TrendingUp, AlertCircle, RefreshCw } from 'lucide-react';

const WINDOWS = [
  { key: '7', label: 'Last 7 days' },
  { key: '30', label: 'Last 30 days' },
  { key: '90', label: 'Last 90 days' },
  { key: 'all', label: 'All time' },
];

export function AnalyticsConsole() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [win, setWin] = useState('30');
  const [fetchedAt, setFetchedAt] = useState(0);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Order store returned ${res.status}.`);
      const data = await res.json();
      setOrders(Array.isArray(data.rows) ? (data.rows as Order[]) : []);
      setFetchedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the order store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const scoped = useMemo(() => {
    const live = orders.filter(o => o.status !== 'cancelled');
    if (win === 'all') return live;
    const cutoff = fetchedAt - Number(win) * 86_400_000;
    return live.filter(o => new Date(o.placedAt).getTime() >= cutoff);
  }, [orders, win, fetchedAt]);

  const stats = useMemo(() => {
    const revenue = scoped.reduce((s, o) => s + o.total, 0);
    const units = scoped.reduce((s, o) => s + o.lines.reduce((ls, l) => ls + l.qty, 0), 0);
    const points = scoped.reduce((s, o) => s + o.pointsEarned, 0);
    return {
      revenue,
      orders: scoped.length,
      units,
      points,
      basket: scoped.length ? Math.round(revenue / scoped.length) : 0,
      pickupShare: scoped.length
        ? (scoped.filter(o => o.delivery.method === 'pickup').length / scoped.length) * 100
        : 0,
    };
  }, [scoped]);

  const bySku = useMemo(() => {
    const map = new Map<string, { title: string; sku: string; units: number; revenue: number }>();
    for (const o of scoped) {
      for (const l of o.lines) {
        const row = map.get(l.productId) ?? { title: l.title, sku: l.sku, units: 0, revenue: 0 };
        row.units += l.qty;
        row.revenue += l.lineTotal;
        map.set(l.productId, row);
      }
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [scoped]);

  const byPayment = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of scoped) map.set(o.payment.method, (map.get(o.payment.method) ?? 0) + o.total);
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [scoped]);

  const byStore = useMemo(() => {
    const map = new Map<string, { code: string; brand: StoreBrand; city: string; revenue: number; orders: number }>();
    for (const o of scoped) {
      if (o.delivery.method !== 'pickup' || !o.delivery.storeCode) continue;
      const store = STORES.find(s => s.code === o.delivery.storeCode);
      if (!store) continue;
      const row = map.get(store.code) ?? { code: store.code, brand: store.brand, city: store.city, revenue: 0, orders: 0 };
      row.revenue += o.total;
      row.orders += 1;
      map.set(store.code, row);
    }
    return [...map.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 10);
  }, [scoped]);

  const maxSkuRevenue = bySku[0]?.revenue ?? 1;
  const paymentTotal = byPayment.reduce((s, [, v]) => s + v, 0) || 1;

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Analytics</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">What sold, and where.</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-xl">
            Every figure on this page is computed from real storefront orders. Nothing here is illustrative.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={win}
            onChange={e => setWin(e.target.value)}
            aria-label="Reporting window"
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
          >
            {WINDOWS.map(w => <option key={w.key} value={w.key}>{w.label}</option>)}
          </select>
          <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-sm text-[color:var(--color-ink-muted)]">Reading the order store…</div>
      ) : scoped.length === 0 ? (
        <div className="py-24 text-center">
          <TrendingUp className="w-8 h-8 mx-auto mb-3 text-[color:var(--color-ink-faint)]" />
          <div className="font-serif text-3xl mb-2">Nothing to report yet.</div>
          <div className="text-sm text-[color:var(--color-ink-muted)] max-w-md mx-auto">
            {orders.length === 0
              ? 'No orders have been placed. Complete a checkout on the storefront and the numbers appear here.'
              : 'No orders fall inside this window. Try a wider one.'}
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
            <Tile label="Revenue" value={inr(stats.revenue)} />
            <Tile label="Orders" value={stats.orders.toLocaleString()} />
            <Tile label="Units" value={stats.units.toLocaleString()} />
            <Tile label="Average basket" value={inr(stats.basket)} />
            <Tile label="Store pickup" value={pct(stats.pickupShare)} />
            <Tile label="Points issued" value={stats.points.toLocaleString()} />
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <Panel title="Top sellers">
              <div className="space-y-3">
                {bySku.map(r => (
                  <div key={r.sku}>
                    <div className="flex justify-between text-sm gap-3">
                      <span className="truncate">{r.title}</span>
                      <span className="font-mono shrink-0">{inr(r.revenue)}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="h-1.5 bg-[color:var(--color-paper)] rounded-full flex-1 overflow-hidden">
                        <div className="h-full bg-[color:var(--color-crimson)]" style={{ width: `${(r.revenue / maxSkuRevenue) * 100}%` }} />
                      </div>
                      <span className="font-mono text-[10px] text-[color:var(--color-ink-muted)] w-16 text-right">{r.units} units</span>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Payment mix">
              <div className="space-y-3">
                {byPayment.map(([method, value]) => (
                  <div key={method}>
                    <div className="flex justify-between text-sm">
                      <span className="uppercase">{method}</span>
                      <span className="font-mono">{inr(value)}</span>
                    </div>
                    <div className="h-1.5 bg-[color:var(--color-paper)] rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-[color:var(--color-ink)]" style={{ width: `${(value / paymentTotal) * 100}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel title="Pickup stores" className="lg:col-span-2">
              {byStore.length === 0 ? (
                <div className="text-sm text-[color:var(--color-ink-muted)]">No pickup orders in this window.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                    <tr>
                      <th className="text-left font-normal pb-2">Store</th>
                      <th className="text-left font-normal pb-2">Brand</th>
                      <th className="text-left font-normal pb-2">City</th>
                      <th className="text-right font-normal pb-2">Orders</th>
                      <th className="text-right font-normal pb-2">Revenue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {byStore.map(s => (
                      <tr key={s.code} className="border-t border-[color:var(--color-line)]">
                        <td className="py-2 font-mono text-xs">{s.code}</td>
                        <td className="py-2">
                          <span className="inline-flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full" style={{ background: BRAND_META[s.brand].color }} />
                            {BRAND_META[s.brand].name}
                          </span>
                        </td>
                        <td className="py-2">{s.city}</td>
                        <td className="py-2 text-right font-mono">{s.orders}</td>
                        <td className="py-2 text-right font-mono">{inr(s.revenue)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Panel>
          </div>
        </>
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

function Panel({ title, children, className = '' }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={`p-5 border border-[color:var(--color-line)] rounded-xl bg-white ${className}`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">{title}</div>
      {children}
    </div>
  );
}
