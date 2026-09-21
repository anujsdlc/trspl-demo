import Link from 'next/link';
import { STORES, BRAND_META } from '@/lib/stores';
import { PRODUCTS_BY_BRAND } from '@/lib/products';
import { getServerStockIndex } from '@/lib/stock-ledger.server';
import { onHand } from '@/lib/stock-ledger';
import { storeGet } from '@/lib/server-store';
import { ensureTradingHistory } from '@/lib/demo-bootstrap';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { reorderLevel } from '@/lib/replenishment';
import { inr } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, Award, ArrowUpRight, ShoppingCart } from 'lucide-react';

export default async function AdminDashboard() {
  const stockIndex = await getServerStockIndex();
  const totalStock = STORES.reduce((sum, s) => {
    return sum + PRODUCTS_BY_BRAND[s.brand].slice(0, 40).reduce((ss, p) => ss + onHand(p.id, s.id, stockIndex), 0);
  }, 0);

  await ensureTradingHistory();
  const orders = ((await storeGet<Order[]>(ORDERS_STORE_KEY)) ?? []).filter(o => o.status !== 'cancelled');
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const month = now.toISOString().slice(0, 7);

  const todaysRevenue = orders
    .filter(o => o.placedAt.slice(0, 10) === today)
    .reduce((sum, o) => sum + o.total, 0);
  const monthRevenue = orders
    .filter(o => o.placedAt.slice(0, 7) === month)
    .reduce((sum, o) => sum + o.total, 0);
  const openOrders = orders.filter(o => o.status === 'placed' || o.status === 'packing').length;

  let lowStockAlerts = 0;
  const shortages: { title: string; store: string; qty: number }[] = [];
  for (const s of STORES) {
    for (const p of PRODUCTS_BY_BRAND[s.brand].slice(0, 40)) {
      const qty = onHand(p.id, s.id, stockIndex);
      if (qty <= reorderLevel(p.id)) {
        lowStockAlerts++;
        shortages.push({ title: p.title, store: s.code, qty });
      }
    }
  }
  shortages.sort((a, b) => a.qty - b.qty);
  const alerts = shortages.slice(0, 5);

  const needingAction = orders
    .filter(o => o.status === 'placed' || o.status === 'packing')
    .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
    .slice(0, 5);

  const trend: { day: string; value: number }[] = [];
  for (let back = 13; back >= 0; back--) {
    const d = new Date(now);
    d.setDate(d.getDate() - back);
    const key = d.toISOString().slice(0, 10);
    trend.push({
      day: key,
      value: orders.filter(o => o.placedAt.slice(0, 10) === key).reduce((sum, o) => sum + o.total, 0),
    });
  }

  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const brandRevenue = new Map<string, number>();
  for (const o of orders) {
    if (o.delivery.method !== 'pickup' || !o.delivery.storeCode) continue;
    if (new Date(o.placedAt) < weekAgo) continue;
    const store = STORES.find(st => st.code === o.delivery.storeCode);
    if (!store) continue;
    brandRevenue.set(store.brand, (brandRevenue.get(store.brand) ?? 0) + o.total);
  }
  const brandTop = Math.max(1, ...brandRevenue.values());

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Overview</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Good morning, Dhananjay.</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs font-mono text-[color:var(--color-ink-muted)]">
            <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full inline-block pulse-dot mr-1.5" />
            All 51 stores online · last sync 12s ago
          </div>
          <Link href="/admin/inventory/bulk" className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center">
            + Add product
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Today's revenue" value={inr(todaysRevenue)} delta={`${orders.filter(o => o.placedAt.slice(0, 10) === today).length} orders`} positive icon={TrendingUp} spark="up" />
        <KPI label="Month to date" value={inr(monthRevenue)} delta={`${orders.filter(o => o.placedAt.slice(0, 7) === month).length} orders`} positive icon={TrendingUp} spark="up" />
        <KPI label="Open orders" value={openOrders.toString()} delta="placed or packing" icon={ShoppingCart} spark="flat" />
        <KPI label="Below reorder point" value={lowStockAlerts.toLocaleString()} delta="across every store" negative icon={AlertCircle} spark="down" />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Store sync health</div>
                <div className="font-serif text-2xl mt-1">51 locations · real-time</div>
              </div>
              <Link href="/admin/stores" className="text-xs inline-flex items-center gap-1 border-b border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)] hover:border-[color:var(--color-crimson)] transition">
                Store console <ArrowUpRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-6">
              <SyncPill status="live" label="In sync" count={STORES.filter(s => s.status === 'live').length} />
              <SyncPill status="sync" label="Syncing" count={STORES.filter(s => s.status === 'sync').length} />
              <SyncPill status="offline" label="Offline" count={STORES.filter(s => s.status === 'offline').length} />
            </div>
            <div className="grid grid-cols-8 md:grid-cols-12 gap-1.5">
              {STORES.map(s => (
                <div key={s.id} className="group relative">
                  <div className={`aspect-square rounded-sm ${
                    s.status === 'live' ? 'bg-[color:var(--color-success)]' : s.status === 'sync' ? 'bg-[color:var(--color-warning)]' : 'bg-[color:var(--color-line-strong)]'
                  } hover:scale-125 transition-transform cursor-pointer`} />
                  <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 bg-[color:var(--color-ink)] text-white text-[10px] font-mono px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition pointer-events-none z-10">
                    {s.code}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Revenue · last 14 days</div>
                <div className="font-serif text-2xl mt-1">Sales trend</div>
              </div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">Online + In-store combined</div>
            </div>
            <RevenueSparkline trend={trend} />
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-6 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Recent activity</div>
                <div className="font-serif text-2xl mt-1">Orders needing action</div>
              </div>
              <Link href="/admin/orders" className="text-xs inline-flex items-center gap-1 border-b border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)] transition">All orders</Link>
            </div>
            <div className="text-xs">
              <div className="grid grid-cols-[100px_1fr_120px_100px_80px] gap-4 px-6 py-2.5 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <div>Order</div><div>Customer / Items</div><div>Route to</div><div>Value</div><div>Status</div>
              </div>
              {needingAction.map(o => (
                <div key={o.id} className="grid grid-cols-[100px_1fr_120px_100px_80px] gap-4 px-6 py-3 border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/50 transition items-center">
                  <div className="font-mono">{o.id}</div>
                  <div>{o.customer.name} · {o.lines.length} {o.lines.length === 1 ? 'item' : 'items'}</div>
                  <div className="font-mono text-[color:var(--color-ink-muted)]">
                    {o.delivery.method === 'pickup' ? o.delivery.storeCode : o.delivery.city}
                  </div>
                  <div className="font-mono">{inr(o.total)}</div>
                  <div>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                      o.status === 'placed'
                        ? 'bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]'
                        : 'bg-[color:var(--color-cobalt)]/20 text-[color:var(--color-cobalt)]'
                    }`}>{o.status}</span>
                  </div>
                </div>
              ))}
              {needingAction.length === 0 && (
                <div className="px-6 py-10 text-center text-[color:var(--color-ink-muted)]">
                  Nothing is waiting. Every order has been dealt with.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[color:var(--color-crimson)]" />
                Alerts
              </div>
              <span className="text-xs font-mono bg-[color:var(--color-crimson)] text-white px-2 py-0.5 rounded-full">{lowStockAlerts.toLocaleString()}</span>
            </div>
            <div className="space-y-3">
              {alerts.map(a => ({
                t: a.qty === 0
                  ? `${a.title} · out of stock at ${a.store}`
                  : `${a.title} · ${a.qty} left at ${a.store}`,
                s: a.qty === 0 ? 'critical' : 'warning',
              })).map((a, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-[color:var(--color-line)] last:border-0">
                  <div className={`w-1 rounded-full ${
                    a.s === 'critical' ? 'bg-[color:var(--color-danger)]' : a.s === 'warning' ? 'bg-[color:var(--color-warning)]' : 'bg-[color:var(--color-cobalt)]'
                  }`} />
                  <div className="text-xs text-[color:var(--color-ink-soft)] leading-relaxed">{a.t}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Brand performance · counter sales, last 7 days</div>
            <div className="space-y-3">
              {Object.entries(BRAND_META).map(([code, meta]) => {
                const rev = brandRevenue.get(code) ?? 0;
                const pct = Math.round((rev / brandTop) * 100);
                return (
                  <div key={code}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                        {meta.name}
                      </span>
                      <span className="font-mono">{inr(rev)}</span>
                    </div>
                    <div className="h-1 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, background: meta.color }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-[color:var(--color-ink)] text-white rounded-xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid opacity-20" />
            <div className="relative">
              <div className="flex items-center justify-between mb-4">
                <div className="text-[10px] uppercase tracking-widest text-white/50 flex items-center gap-1">
                  <Award className="w-3 h-3 text-[color:var(--color-mustard)]" />
                  Skyline snapshot
                </div>
                <Link href="/admin/loyalty" className="text-[10px] text-[color:var(--color-mustard)]">Manage →</Link>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Members</div>
                  <div className="editorial-num text-3xl text-[color:var(--color-mustard)]">28,412</div>
                  <div className="text-[10px] text-white/50 mt-1">+147 today</div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-white/50">Points issued (mo)</div>
                  <div className="editorial-num text-3xl text-[color:var(--color-mustard)]">4.2M</div>
                  <div className="text-[10px] text-white/50 mt-1">Redeem rate 24%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KPI({ label, value, delta, positive, negative, icon: Icon, spark }: { label: string; value: string; delta: string; positive?: boolean; negative?: boolean; icon: React.ElementType; spark: 'up' | 'down' | 'flat' }) {
  return (
    <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-line-strong)] transition">
      <div className="flex items-center justify-between mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        <Icon className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
      </div>
      <div className="editorial-num text-4xl">{value}</div>
      <div className="mt-2 flex items-center gap-1.5">
        {positive && <TrendingUp className="w-3 h-3 text-[color:var(--color-success)]" />}
        {negative && <TrendingDown className="w-3 h-3 text-[color:var(--color-danger)]" />}
        <span className={`text-xs ${positive ? 'text-[color:var(--color-success)]' : negative ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-ink-muted)]'}`}>{delta}</span>
      </div>
    </div>
  );
}

function SyncPill({ status, label, count }: { status: 'live' | 'sync' | 'offline'; label: string; count: number }) {
  const colors = {
    live: 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]',
    sync: 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]',
    offline: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
  };
  return (
    <div className={`rounded-lg p-4 ${colors[status]}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="editorial-num text-3xl mt-1">{count}</div>
    </div>
  );
}

function RevenueSparkline({ trend }: { trend: { day: string; value: number }[] }) {
  const bars = trend.map(t => t.value);
  const max = Math.max(1, ...bars);
  return (
    <div>
      <div className="flex items-end gap-1.5 h-32">
        {bars.map((v, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={`w-full rounded-t ${i === bars.length - 1 ? 'bg-[color:var(--color-crimson)]' : 'bg-[color:var(--color-ink)]'} hover:opacity-70 transition`}
              style={{ height: `${(v / max) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-ink-muted)] mt-2">
        <span>Sep 1</span><span>Sep 7</span><span>Today</span>
      </div>
    </div>
  );
}
