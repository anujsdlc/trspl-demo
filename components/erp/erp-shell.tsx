'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo, useState } from 'react';
import {
  LayoutDashboard, Building2, Warehouse, Landmark, BookOpenText, ShoppingCart,
  Receipt, Users, Truck, BookMinus, FileText, Banknote, Tent, Wifi,
  HeartHandshake, BarChart3, UserRound, FileInput, Lock, Settings2,
  Menu, X, ChevronRight, ArrowLeft,
} from 'lucide-react';
import { ERP_MODULES, type ERPModule } from '@/lib/erp/foundations';

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Warehouse, Landmark, BookOpenText, ShoppingCart,
  Receipt, Users, Truck, BookMinus, FileText, Banknote, Tent, Wifi,
  HeartHandshake, BarChart3, UserRound, FileInput, Lock, Settings2,
};

export function ERPShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  return (
    <div className="min-h-screen flex bg-[color:var(--color-paper)]">
      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0 border-r border-[color:var(--color-line)] bg-white h-screen sticky top-0 overflow-y-auto">
        <Sidebar />
      </aside>

      {/* Mobile sidebar sheet */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex" onClick={() => setMobileOpen(false)}>
          <div className="absolute inset-0 bg-black/40" />
          <aside className="relative w-72 max-w-[80vw] bg-white h-full overflow-y-auto" onClick={e => e.stopPropagation()}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-3 right-3 p-2"><X className="w-4 h-4" /></button>
            <Sidebar onNavigate={() => setMobileOpen(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <div className="sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[color:var(--color-line)]">
          <div className="flex items-center gap-3 h-14 px-4 lg:px-6">
            <button className="lg:hidden p-2 hover:bg-[color:var(--color-paper)] rounded" onClick={() => setMobileOpen(true)}>
              <Menu className="w-5 h-5" />
            </button>
            <Link href="/admin" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
              <ArrowLeft className="w-3 h-3" /> Console
            </Link>
            <ERPBreadcrumb />
            <div className="ml-auto text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] font-mono flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full pulse-dot" />
              TRS ERP · Phase 1
            </div>
          </div>
        </div>

        {children}
      </main>
    </div>
  );
}

function Sidebar({ onNavigate }: { onNavigate?: () => void }) {
  const path = usePathname();
  const grouped = useMemo(() => {
    const m = new Map<string, ERPModule[]>();
    for (const mod of ERP_MODULES) {
      const arr = m.get(mod.section) ?? [];
      arr.push(mod);
      m.set(mod.section, arr);
    }
    return Array.from(m.entries());
  }, []);

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">TRS ERP</div>
        <div className="font-serif text-xl leading-tight mt-0.5">Publisher Console</div>
      </div>

      <nav className="space-y-5">
        {grouped.map(([section, mods]) => (
          <div key={section}>
            <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-faint)] mb-1.5 px-2">{section}</div>
            <ul className="space-y-0.5">
              {mods.map(m => {
                const Icon = ICONS[m.icon] ?? LayoutDashboard;
                const active = path === m.href || (m.href !== '/admin/erp' && path.startsWith(m.href));
                const live = m.status === 'live';
                const inner = (
                  <span className={`flex items-center gap-2.5 h-9 px-2 rounded-md text-sm transition ${
                    active
                      ? 'bg-[color:var(--color-ink)] text-white'
                      : live
                      ? 'hover:bg-[color:var(--color-paper)] text-[color:var(--color-ink)]'
                      : 'text-[color:var(--color-ink-faint)] cursor-not-allowed'
                  }`}>
                    <Icon className="w-4 h-4" />
                    <span className="flex-1">{m.label}</span>
                    {!live && <span className="text-[9px] uppercase tracking-widest text-[color:var(--color-ink-faint)]">soon</span>}
                    {active && <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                );
                return (
                  <li key={m.key}>
                    {live ? (
                      <Link href={m.href} onClick={onNavigate}>{inner}</Link>
                    ) : (
                      <div>{inner}</div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <div className="mt-8 p-3 rounded-md bg-[color:var(--color-crimson-soft)] text-xs">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1">Phase 1 · Live</div>
        <div className="text-[color:var(--color-ink-soft)]">Foundations shipped. Purchase and Sales up next in Phase 2.</div>
      </div>
    </div>
  );
}

function ERPBreadcrumb() {
  const path = usePathname();
  const module = ERP_MODULES.find(m => m.href !== '/admin/erp' && path.startsWith(m.href));
  return (
    <div className="text-sm text-[color:var(--color-ink)] font-medium">
      {module ? module.label : 'ERP Dashboard'}
    </div>
  );
}
