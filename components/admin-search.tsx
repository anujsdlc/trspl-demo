'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES } from '@/lib/stores';
import { BASE_MEMBERS } from '@/lib/members';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { inr } from '@/lib/utils';
import {
  Search, X, Package, ShoppingCart, Users, MapPin, LayoutDashboard, CornerDownLeft,
} from 'lucide-react';

type Kind = 'page' | 'product' | 'order' | 'member' | 'store';

interface Hit {
  kind: Kind;
  id: string;
  title: string;
  detail: string;
  href: string;
}

const KIND_META: Record<Kind, { label: string; icon: React.ElementType }> = {
  page: { label: 'Go to', icon: LayoutDashboard },
  product: { label: 'Products', icon: Package },
  order: { label: 'Orders', icon: ShoppingCart },
  member: { label: 'Members', icon: Users },
  store: { label: 'Stores', icon: MapPin },
};

const PAGES: Hit[] = [
  { kind: 'page', id: 'p-dash', title: 'Dashboard', detail: 'Head office overview', href: '/admin' },
  { kind: 'page', id: 'p-till', title: 'The till', detail: 'Open a shift and sell', href: '/admin/till' },
  { kind: 'page', id: 'p-orders', title: 'Orders', detail: 'Order desk', href: '/admin/orders' },
  { kind: 'page', id: 'p-inv', title: 'Inventory', detail: 'Stock by product and store', href: '/admin/inventory' },
  { kind: 'page', id: 'p-bulk', title: 'Bulk upload', detail: 'Products, stock, price, transfers', href: '/admin/inventory/bulk' },
  { kind: 'page', id: 'p-rep', title: 'Replenishment', detail: 'What each store is short of', href: '/admin/inventory/replenishment' },
  { kind: 'page', id: 'p-ist', title: 'Inter-state transfers', detail: 'Stock between registrations', href: '/admin/inventory/interstate' },
  { kind: 'page', id: 'p-exh', title: 'Exhibitions', detail: 'Fairs and pop-ups', href: '/admin/inventory/exhibitions' },
  { kind: 'page', id: 'p-stores', title: 'Stores', detail: 'The 51-store estate', href: '/admin/stores' },
  { kind: 'page', id: 'p-reg', title: 'GST registrations', detail: 'Coverage and placement', href: '/admin/registrations' },
  { kind: 'page', id: 'p-ret', title: 'GST returns', detail: 'GSTR-1, 3B, HSN, e-invoice', href: '/admin/registrations/returns' },
  { kind: 'page', id: 'p-tally', title: 'Tally migration', detail: 'Stage, validate, import', href: '/admin/registrations/tally' },
  { kind: 'page', id: 'p-ana', title: 'Analytics', detail: 'What sold, and where', href: '/admin/analytics' },
  { kind: 'page', id: 'p-cust', title: 'Customers', detail: 'Rolled up from orders', href: '/admin/customers' },
  { kind: 'page', id: 'p-loy', title: 'Loyalty', detail: 'Skyline programme', href: '/admin/loyalty' },
  { kind: 'page', id: 'p-mem', title: 'Members', detail: 'Member list', href: '/admin/loyalty/members' },
  { kind: 'page', id: 'p-erp', title: 'ERP', detail: 'Publisher console', href: '/admin/erp' },
  { kind: 'page', id: 'p-set', title: 'Settings', detail: 'Console settings', href: '/admin/settings' },
];

export function AdminSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [cursor, setCursor] = useState(0);
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [orders, setOrders] = useState<Order[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    setQuery('');
    setCursor(0);
    inputRef.current?.focus();
    loadClientCatalog().then(setCatalog).catch(() => {});
    fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { rows: null }))
      .then(d => setOrders(Array.isArray(d.rows) ? (d.rows as Order[]) : []))
      .catch(() => {});
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) return PAGES.slice(0, 6);

    const out: Hit[] = [];

    for (const p of PAGES) {
      if (p.title.toLowerCase().includes(q) || p.detail.toLowerCase().includes(q)) out.push(p);
    }

    for (const p of catalog) {
      if (out.filter(h => h.kind === 'product').length >= 6) break;
      if (p.sku.toLowerCase().includes(q) || p.title.toLowerCase().includes(q)) {
        out.push({
          kind: 'product', id: p.id, title: p.title,
          detail: `${p.sku} · ${inr(p.price)}`,
          href: `/admin/inventory?q=${encodeURIComponent(p.sku)}`,
        });
      }
    }

    for (const o of orders) {
      if (out.filter(h => h.kind === 'order').length >= 6) break;
      if (
        o.id.toLowerCase().includes(q) ||
        o.customer.name.toLowerCase().includes(q) ||
        o.customer.email.toLowerCase().includes(q) ||
        o.lines.some(l => l.sku.toLowerCase().includes(q))
      ) {
        out.push({
          kind: 'order', id: o.id, title: o.id,
          detail: `${o.customer.name} · ${inr(o.total)} · ${o.status}`,
          href: `/admin/orders?q=${encodeURIComponent(o.id)}`,
        });
      }
    }

    for (const m of BASE_MEMBERS) {
      if (out.filter(h => h.kind === 'member').length >= 5) break;
      if (m.name.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.phone.includes(q)) {
        out.push({
          kind: 'member', id: m.id, title: m.name,
          detail: `${m.email} · ${inr(m.ytdSpend)} YTD`,
          href: `/admin/loyalty/members?q=${encodeURIComponent(m.name)}`,
        });
      }
    }

    for (const s of STORES) {
      if (out.filter(h => h.kind === 'store').length >= 5) break;
      if (s.code.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.location.toLowerCase().includes(q)) {
        out.push({
          kind: 'store', id: s.id, title: s.code,
          detail: `${s.location} · ${s.state}`,
          href: `/admin/stores?q=${encodeURIComponent(s.code)}`,
        });
      }
    }

    return out.slice(0, 24);
  }, [query, catalog, orders]);

  useEffect(() => { setCursor(0); }, [query]);

  const go = (hit: Hit) => {
    onClose();
    router.push(hit.href);
  };

  const onKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setCursor(c => Math.min(c + 1, hits.length - 1)); }
    if (e.key === 'ArrowUp') { e.preventDefault(); setCursor(c => Math.max(c - 1, 0)); }
    if (e.key === 'Enter' && hits[cursor]) { e.preventDefault(); go(hits[cursor]); }
    if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  if (!open) return null;

  let lastKind: Kind | null = null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-start justify-center pt-[12vh] px-4" onClick={onClose}>
      <div
        className="w-full max-w-xl bg-white rounded-xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 border-b border-[color:var(--color-line)]">
          <Search className="w-4 h-4 text-[color:var(--color-ink-muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={onKey}
            placeholder="Search SKU, order, member, store or a screen"
            aria-label="Search the console"
            className="flex-1 h-12 text-sm bg-transparent focus:outline-none"
          />
          <button onClick={onClose} aria-label="Close search" className="p-1 text-[color:var(--color-ink-muted)]">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="max-h-[52vh] overflow-auto py-1">
          {hits.length === 0 && (
            <div className="px-4 py-10 text-center text-sm text-[color:var(--color-ink-muted)]">
              Nothing matches “{query}”.
            </div>
          )}

          {hits.map((hit, i) => {
            const meta = KIND_META[hit.kind];
            const header = hit.kind !== lastKind ? meta.label : null;
            lastKind = hit.kind;
            return (
              <div key={`${hit.kind}-${hit.id}`}>
                {header && (
                  <div className="px-4 pt-3 pb-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                    {header}
                  </div>
                )}
                <button
                  onMouseEnter={() => setCursor(i)}
                  onClick={() => go(hit)}
                  className={`w-full text-left px-4 py-2.5 flex items-center gap-3 ${
                    i === cursor ? 'bg-[color:var(--color-paper)]' : ''
                  }`}
                >
                  <meta.icon className="w-3.5 h-3.5 shrink-0 text-[color:var(--color-ink-muted)]" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm truncate">{hit.title}</span>
                    <span className="block text-[11px] text-[color:var(--color-ink-muted)] truncate">{hit.detail}</span>
                  </span>
                  {i === cursor && <CornerDownLeft className="w-3 h-3 shrink-0 text-[color:var(--color-ink-muted)]" />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-[color:var(--color-line)] flex items-center gap-4 text-[10px] text-[color:var(--color-ink-muted)]">
          <span>↑↓ to move</span>
          <span>↵ to open</span>
          <span>esc to close</span>
        </div>
      </div>
    </div>
  );
}
