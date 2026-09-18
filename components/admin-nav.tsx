'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Package, MapPin, Award, ShoppingCart, TrendingUp, Users, Settings, Search, Bell, Command, Building2 } from 'lucide-react';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { href: '/admin/inventory', label: 'Inventory', icon: Package },
  { href: '/admin/stores', label: 'Stores', icon: MapPin, badge: '51' },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingCart, badge: '47' },
  { href: '/admin/loyalty', label: 'Loyalty', icon: Award },
  { href: '/admin/erp', label: 'ERP', icon: Building2, badge: 'P1' },
  { href: '/admin/analytics', label: 'Analytics', icon: TrendingUp },
  { href: '/admin/customers', label: 'Customers', icon: Users },
];

export function AdminNav() {
  const path = usePathname();
  return (
    <div className="sticky top-0 z-40 bg-white border-b border-[color:var(--color-line)]">
      <div className="px-6 h-14 flex items-center gap-6">
        <Link href="/admin" className="flex items-center gap-2">
          <div className="w-7 h-7 bg-[color:var(--color-ink)] rounded-md flex items-center justify-center">
            <span className="font-serif text-white text-xs italic font-bold">TRS</span>
          </div>
          <div className="text-sm">
            <div className="font-semibold leading-none">Console</div>
            <div className="text-[10px] text-[color:var(--color-ink-muted)] uppercase tracking-widest mt-0.5">Ops · v2.4</div>
          </div>
        </Link>
        <div className="h-6 w-px bg-[color:var(--color-line)]" />
        <nav className="flex items-center gap-1 overflow-x-auto flex-1">
          {NAV.map(n => {
            const active = n.exact ? path === n.href : path.startsWith(n.href);
            return (
              <Link
                key={n.href}
                href={n.href}
                className={`flex items-center gap-2 h-9 px-3 rounded-md text-sm transition whitespace-nowrap ${active ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]'}`}
              >
                <n.icon className="w-3.5 h-3.5" />
                {n.label}
                {n.badge && (
                  <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] ${active ? 'bg-[color:var(--color-mustard)] text-[color:var(--color-ink)]' : 'bg-[color:var(--color-paper-warm)] text-[color:var(--color-ink)]'}`}>{n.badge}</span>
                )}
              </Link>
            );
          })}
        </nav>
        <div className="hidden md:flex items-center gap-1 h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs text-[color:var(--color-ink-muted)] bg-[color:var(--color-paper)]">
          <Search className="w-3 h-3" />
          <span>Search SKU, order, member…</span>
          <span className="ml-2 flex items-center gap-0.5 font-mono">
            <Command className="w-2.5 h-2.5" />K
          </span>
        </div>
        <button className="relative p-2 hover:bg-[color:var(--color-paper)] rounded-md" aria-label="Notifications">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full" />
        </button>
        <Link href="/admin/settings" className="p-2 hover:bg-[color:var(--color-paper)] rounded-md" aria-label="Settings">
          <Settings className="w-4 h-4" />
        </Link>
        <div className="flex items-center gap-2 pl-3 border-l border-[color:var(--color-line)]">
          <div className="w-7 h-7 rounded-full bg-[color:var(--color-crimson)] text-white flex items-center justify-center font-medium text-xs">DS</div>
          <div className="hidden lg:block text-xs">
            <div className="font-medium leading-tight">Dhananjay S.</div>
            <div className="text-[10px] text-[color:var(--color-ink-muted)]">COO · TRS HO</div>
          </div>
        </div>
      </div>
    </div>
  );
}
