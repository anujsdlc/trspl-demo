import Link from 'next/link';
import { STORES, BRAND_META } from '@/lib/stores';
import { ALL_PRODUCTS, stockFor, PRODUCTS_BY_BRAND } from '@/lib/products';
import { inr } from '@/lib/utils';
import { TrendingUp, TrendingDown, AlertCircle, Package, Zap, MapPin, Award, ArrowUpRight, ShoppingCart, Users, Sparkles } from 'lucide-react';

export default function AdminDashboard() {
  // Deterministic KPI computation
  const totalStock = STORES.reduce((sum, s) => {
    return sum + PRODUCTS_BY_BRAND[s.brand].slice(0, 40).reduce((ss, p) => ss + stockFor(p.id, s.id), 0);
  }, 0);
  const lowStockAlerts = 18;
  const openOrders = 47;
  const todaysRevenue = 187420;
  const monthRevenue = 4823000;

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      {/* Header */}
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
          <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] transition">
            + Add product
          </button>
        </div>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <KPI label="Today's revenue" value={inr(todaysRevenue)} delta="+12.4%" positive icon={TrendingUp} spark="up" />
        <KPI label="Month to date" value={inr(monthRevenue)} delta="+8.1%" positive icon={TrendingUp} spark="up" />
        <KPI label="Open orders" value={openOrders.toString()} delta="12 need routing" icon={ShoppingCart} spark="flat" />
        <KPI label="Low-stock alerts" value={lowStockAlerts.toString()} delta="6 critical" negative icon={AlertCircle} spark="down" />
      </div>

      {/* Two-column layout */}
      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Store health */}
        <div className="md:col-span-2 space-y-6">
          {/* Store sync status */}
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

          {/* Revenue chart */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Revenue · last 14 days</div>
                <div className="font-serif text-2xl mt-1">Sales trend</div>
              </div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">Online + In-store combined</div>
            </div>
            <RevenueSparkline />
          </div>

          {/* Recent orders */}
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
              {[
                ['#TRS-4821', 'A. Krishnan · 2 items', 'BLR T2-A', 1849, 'awaiting'],
                ['#TRS-4820', 'R. Mehta · 1 item', 'DEL T3-Intl', 899, 'awaiting'],
                ['#TRS-4819', 'S. Iyer · 4 items', 'BOM T2', 3240, 'packing'],
                ['#TRS-4818', 'P. Sharma · 1 item', 'HYD T1-A', 14999, 'dispatched'],
                ['#TRS-4817', 'K. Nair · 3 items', 'COK T3', 2100, 'delivered'],
              ].map(([id, cust, route, val, status]) => (
                <div key={id as string} className="grid grid-cols-[100px_1fr_120px_100px_80px] gap-4 px-6 py-3 border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/50 transition items-center">
                  <div className="font-mono">{id}</div>
                  <div>{cust}</div>
                  <div className="font-mono text-[color:var(--color-ink-muted)]">{route}</div>
                  <div className="font-mono">{inr(val as number)}</div>
                  <div>
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                      status === 'awaiting' ? 'bg-[color:var(--color-warning)]/20 text-[color:var(--color-warning)]' :
                      status === 'packing' ? 'bg-[color:var(--color-cobalt)]/20 text-[color:var(--color-cobalt)]' :
                      status === 'dispatched' ? 'bg-[color:var(--color-mint)] text-[color:var(--color-ink)]' :
                      'bg-[color:var(--color-success)]/20 text-[color:var(--color-success)]'
                    }`}>{status as string}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Alerts + brands */}
        <div className="space-y-6">
          {/* Alerts */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-[color:var(--color-crimson)]" />
                Alerts
              </div>
              <span className="text-xs font-mono bg-[color:var(--color-crimson)] text-white px-2 py-0.5 rounded-full">6</span>
            </div>
            <div className="space-y-3">
              {[
                { t: 'Ferrero Rocher T24 · below reorder threshold at 4 stores', s: 'critical' },
                { t: 'One Piece Vol 105 · out of stock at BLR T2-A', s: 'critical' },
                { t: 'Kaju Katli · batch KJ2612 expires in 21 days', s: 'warning' },
                { t: 'DEL T3-Intl · sync delayed by 2 min', s: 'info' },
                { t: 'Milka Whole Hazelnut · low at 8 stores', s: 'warning' },
              ].map((a, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-[color:var(--color-line)] last:border-0">
                  <div className={`w-1 rounded-full ${
                    a.s === 'critical' ? 'bg-[color:var(--color-danger)]' : a.s === 'warning' ? 'bg-[color:var(--color-warning)]' : 'bg-[color:var(--color-cobalt)]'
                  }`} />
                  <div className="text-xs text-[color:var(--color-ink-soft)] leading-relaxed">{a.t}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Brand performance */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Brand performance today</div>
            <div className="space-y-3">
              {Object.entries(BRAND_META).map(([code, meta]) => {
                const rev = ((code.charCodeAt(0) * 7) % 30 + 10) * 1000 + 5000;
                const pct = ((code.charCodeAt(0) * 3) % 100);
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

          {/* Loyalty snapshot */}
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

function RevenueSparkline() {
  // Deterministic mock data
  const bars = [42, 55, 48, 62, 70, 58, 68, 75, 82, 71, 88, 92, 79, 95];
  const max = Math.max(...bars);
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
