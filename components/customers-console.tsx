'use client';

import { useEffect, useMemo, useState } from 'react';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { tierFor } from '@/lib/loyalty';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import { Users, Search, RefreshCw, Download, AlertCircle, X } from 'lucide-react';

interface CustomerRow {
  key: string;
  name: string;
  email: string;
  phone: string;
  orders: Order[];
  spend: number;
  units: number;
  points: number;
  firstAt: string;
  lastAt: string;
}

function rollUp(orders: Order[]): CustomerRow[] {
  const map = new Map<string, CustomerRow>();
  for (const o of orders) {
    if (o.status === 'cancelled') continue;
    const key = o.customer.email.trim().toLowerCase() || o.customer.phone.trim();
    if (!key) continue;
    const row = map.get(key) ?? {
      key,
      name: o.customer.name,
      email: o.customer.email,
      phone: o.customer.phone,
      orders: [],
      spend: 0,
      units: 0,
      points: 0,
      firstAt: o.placedAt,
      lastAt: o.placedAt,
    };
    row.orders.push(o);
    row.spend += o.total;
    row.units += o.lines.reduce((s, l) => s + l.qty, 0);
    row.points += o.pointsEarned;
    if (o.placedAt < row.firstAt) row.firstAt = o.placedAt;
    if (o.placedAt > row.lastAt) {
      row.lastAt = o.placedAt;
      row.name = o.customer.name;
      row.phone = o.customer.phone;
    }
    map.set(key, row);
  }
  return [...map.values()].sort((a, b) => b.spend - a.spend);
}

export function CustomersConsole() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState<CustomerRow | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Order store returned ${res.status}.`);
      const data = await res.json();
      setOrders(Array.isArray(data.rows) ? (data.rows as Order[]) : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the order store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const customers = useMemo(() => rollUp(orders), [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(c =>
      c.name.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.phone.includes(q),
    );
  }, [customers, query]);

  const totals = useMemo(() => ({
    people: customers.length,
    repeat: customers.filter(c => c.orders.length > 1).length,
    spend: customers.reduce((s, c) => s + c.spend, 0),
  }), [customers]);

  const exportCsv = () => {
    downloadCSV(
      'trs-customers.csv',
      ['name', 'email', 'phone', 'orders', 'units', 'spend', 'points', 'tier', 'first_order', 'last_order'],
      filtered.map(c => ({
        name: c.name,
        email: c.email,
        phone: c.phone,
        orders: String(c.orders.length),
        units: String(c.units),
        spend: String(c.spend),
        points: String(c.points),
        tier: tierFor(c.spend).name,
        first_order: c.firstAt,
        last_order: c.lastAt,
      })),
    );
  };

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Customers</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Who bought.</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-xl">
            Rolled up from storefront orders by email. Skyline members with no order history live under Loyalty.
          </p>
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

      <div className="grid grid-cols-3 gap-4 mb-6">
        <Tile label="Customers" value={totals.people.toLocaleString()} />
        <Tile label="Repeat buyers" value={totals.repeat.toLocaleString()} />
        <Tile label="Lifetime value" value={inr(totals.spend)} />
      </div>

      <div className="relative mb-4">
        <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-ink-muted)]" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Name, email or phone"
          aria-label="Search customers"
          className="h-9 pl-9 pr-3 w-72 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
        />
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-[color:var(--color-ink-muted)]">Reading the order store…</div>
      ) : customers.length === 0 ? (
        <div className="py-24 text-center">
          <Users className="w-8 h-8 mx-auto mb-3 text-[color:var(--color-ink-faint)]" />
          <div className="font-serif text-3xl mb-2">No customers yet.</div>
          <div className="text-sm text-[color:var(--color-ink-muted)] max-w-md mx-auto">
            A shopper appears here after their first completed checkout.
          </div>
        </div>
      ) : (
        <div className="border border-[color:var(--color-line)] rounded-xl overflow-hidden bg-white">
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <th className="px-4 py-2.5 text-left font-normal">Customer</th>
                <th className="px-4 py-2.5 text-left font-normal">Phone</th>
                <th className="px-4 py-2.5 text-left font-normal">Tier</th>
                <th className="px-4 py-2.5 text-right font-normal">Orders</th>
                <th className="px-4 py-2.5 text-right font-normal">Units</th>
                <th className="px-4 py-2.5 text-right font-normal">Spend</th>
                <th className="px-4 py-2.5 text-right font-normal">Points</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(c => (
                <tr
                  key={c.key}
                  onClick={() => setOpen(c)}
                  className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)] cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <div>{c.name}</div>
                    <div className="text-xs text-[color:var(--color-ink-muted)]">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{c.phone}</td>
                  <td className="px-4 py-3">{tierFor(c.spend).name}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.orders.length}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.units}</td>
                  <td className="px-4 py-3 text-right font-mono">{inr(c.spend)}</td>
                  <td className="px-4 py-3 text-right font-mono">{c.points.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">Nobody matches that search.</div>
          )}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/30" onClick={() => setOpen(null)}>
          <div className="w-full max-w-lg h-full bg-white overflow-auto p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="font-serif text-3xl">{open.name}</div>
                <div className="text-sm text-[color:var(--color-ink-muted)]">{open.email} · {open.phone}</div>
                <div className="mt-1 text-xs font-mono text-[color:var(--color-ink-muted)]">
                  {tierFor(open.spend).name} · {inr(open.spend)} lifetime · {open.points.toLocaleString()} points
                </div>
              </div>
              <button onClick={() => setOpen(null)} aria-label="Close"><X className="w-5 h-5" /></button>
            </div>

            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">
              Orders ({open.orders.length})
            </div>
            <div className="border border-[color:var(--color-line)] rounded-lg divide-y divide-[color:var(--color-line)]">
              {open.orders
                .slice()
                .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
                .map(o => (
                  <div key={o.id} className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div className="min-w-0">
                      <div className="font-mono text-xs">{o.id}</div>
                      <div className="text-xs text-[color:var(--color-ink-muted)]">
                        {new Date(o.placedAt).toLocaleDateString('en-IN')} · {o.lines.length} lines · {o.status}
                      </div>
                    </div>
                    <div className="font-mono shrink-0">{inr(o.total)}</div>
                  </div>
                ))}
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
