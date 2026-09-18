'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  Building2, Warehouse, Landmark, BookOpenText, ShoppingCart, Receipt,
  Users, Truck, BookMinus, FileText, Banknote, Tent, Wifi, HeartHandshake,
  BarChart3, UserRound, FileInput, Lock, Settings2, ArrowRight, LayoutDashboard,
} from 'lucide-react';
import {
  loadBranches, loadWarehouses, loadGST, loadBookMaster, ERP_MODULES,
  SEED_BRANCHES, SEED_WAREHOUSES, SEED_GST, SEED_BOOK_MASTER,
} from '@/lib/erp/foundations';
import {
  loadSuppliers, loadCustomers, loadPOs, loadSOs,
  SEED_SUPPLIERS, SEED_CUSTOMERS, SEED_POS, SEED_SOS,
} from '@/lib/erp/phase2';
import {
  loadCoA, loadJVs, loadBankEntries, computeBalances, summariseByType,
  SEED_COA, SEED_JVS, SEED_BANK_ENTRIES,
} from '@/lib/erp/phase3';
import {
  loadExhibitions, loadDevices, loadLeads,
  SEED_EXHIBITIONS, SEED_DEVICES, SEED_LEADS,
} from '@/lib/erp/phase4';
import {
  loadEmployees, loadAttendance, loadLeaves,
  SEED_EMPLOYEES, SEED_ATTENDANCE, SEED_LEAVES,
} from '@/lib/erp/phase5';
import {
  loadMigrations, loadUsers, loadAlerts,
  SEED_MIGRATIONS, SEED_USERS, SEED_ALERTS,
} from '@/lib/erp/phase6';

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Building2, Warehouse, Landmark, BookOpenText, ShoppingCart,
  Receipt, Users, Truck, BookMinus, FileText, Banknote, Tent, Wifi,
  HeartHandshake, BarChart3, UserRound, FileInput, Lock, Settings2,
};

export function ERPDashboard() {
  const [counts, setCounts] = useState({
    branches: SEED_BRANCHES.length,
    warehouses: SEED_WAREHOUSES.length,
    gst: SEED_GST.length,
    books: SEED_BOOK_MASTER.length,
    suppliers: SEED_SUPPLIERS.length,
    customers: SEED_CUSTOMERS.length,
    pos: SEED_POS.length,
    sos: SEED_SOS.length,
    ledgers: SEED_COA.length,
    journals: SEED_JVS.length,
    bank: SEED_BANK_ENTRIES.length,
    exhibitions: SEED_EXHIBITIONS.length,
    devices: SEED_DEVICES.length,
    leads: SEED_LEADS.length,
    employees: SEED_EMPLOYEES.length,
    leavesPending: SEED_LEAVES.filter(l => l.status === 'pending').length,
    migrations: SEED_MIGRATIONS.length,
    users: SEED_USERS.length,
    activeAlerts: SEED_ALERTS.filter(a => !a.resolved).length,
  });
  const [netIncome, setNetIncome] = useState(0);
  useEffect(() => {
    (async () => {
      const [
        branches, warehouses, gst, books, suppliers, customers, pos, sos,
        coa, jvs, bank, exhibitions, devices, leads, employees, leaves,
        migrations, users, alerts,
      ] = await Promise.all([
        loadBranches(), loadWarehouses(), loadGST(), loadBookMaster(),
        loadSuppliers(), loadCustomers(), loadPOs(), loadSOs(),
        loadCoA(), loadJVs(), loadBankEntries(), loadExhibitions(),
        loadDevices(), loadLeads(), loadEmployees(), loadLeaves(),
        loadMigrations(), loadUsers(), loadAlerts(),
      ]);
      const balances = computeBalances(coa, jvs);
      const s = summariseByType(balances);
      setNetIncome(s.income - s.expense);
      setCounts({
        branches: branches.length,
        warehouses: warehouses.length,
        gst: gst.length,
        books: books.length,
        suppliers: suppliers.length,
        customers: customers.length,
        pos: pos.length,
        sos: sos.length,
        ledgers: coa.length,
        journals: jvs.length,
        bank: bank.length,
        exhibitions: exhibitions.length,
        devices: devices.length,
        leads: leads.length,
        employees: employees.length,
        leavesPending: leaves.filter(l => l.status === 'pending').length,
        migrations: migrations.length,
        users: users.length,
        activeAlerts: alerts.filter(a => !a.resolved).length,
      });
    })();
  }, []);

  const phase1 = ERP_MODULES.filter(m => m.phase === 1 && m.key !== 'dashboard');
  const phase2 = ERP_MODULES.filter(m => m.phase === 2 && m.status === 'live');
  const phase3 = ERP_MODULES.filter(m => m.phase === 3 && m.status === 'live');
  const phase4 = ERP_MODULES.filter(m => m.phase === 4 && m.status === 'live');
  const phase5 = ERP_MODULES.filter(m => m.phase === 5 && m.status === 'live');
  const phase6 = ERP_MODULES.filter(m => m.phase === 6 && m.status === 'live');
  const coming = ERP_MODULES.filter(m => m.status === 'coming-soon');

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Publisher Console</div>
        <h1 className="font-serif text-5xl leading-tight tracking-tight">TRS ERP</h1>
        <p className="mt-3 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
          One book. Every branch, every GSTIN, every fair. The publisher/distributor spine that connects buying, selling, moving, reporting, and closing your books.
        </p>
      </div>

      {/* Phase 1 — foundations */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 1 · Live
            </div>
            <h2 className="font-serif text-2xl">Foundations</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phase1.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'branches' ? counts.branches
                       : m.key === 'warehouses' ? counts.warehouses
                       : m.key === 'gst' ? counts.gst
                       : m.key === 'books' ? counts.books
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'branches' && 'Branches + HO + sub-branches'}
                  {m.key === 'warehouses' && 'Godowns, branch stores, exhibitions'}
                  {m.key === 'gst' && 'GSTINs · one per state'}
                  {m.key === 'books' && 'Titles on the master'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase 2 — Buy → Sell */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 2 · Live
            </div>
            <h2 className="font-serif text-2xl">Buy → Sell</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {phase2.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'suppliers' ? counts.suppliers
                       : m.key === 'customers' ? counts.customers
                       : m.key === 'purchase' ? counts.pos
                       : m.key === 'sales' ? counts.sos
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'suppliers' && 'Publishers · distributors · importers'}
                  {m.key === 'customers' && 'Schools · dealers · retail'}
                  {m.key === 'purchase' && 'PO → GRN → Bill'}
                  {m.key === 'sales' && 'Quote → SO → Invoice → Receipt'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase 3 — Finance */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 3 · Live
            </div>
            <h2 className="font-serif text-2xl">Finance</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase3.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'accounts' ? counts.journals
                       : m.key === 'gst-returns' ? counts.sos
                       : m.key === 'bank-recon' ? counts.bank
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'accounts' && `Journal entries · net income ${netIncome >= 0 ? '+' : ''}₹${(netIncome / 100000).toFixed(1)}L`}
                  {m.key === 'gst-returns' && 'Invoices sourced for GSTR-1'}
                  {m.key === 'bank-recon' && 'Bank statement entries · auto-match ready'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase 4 — Field Ops */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 4 · Live
            </div>
            <h2 className="font-serif text-2xl">Field Ops</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase4.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'exhibitions' ? counts.exhibitions
                       : m.key === 'offline-pos' ? counts.devices
                       : m.key === 'crm' ? counts.leads
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'exhibitions' && 'Events · issue notes · settlements'}
                  {m.key === 'offline-pos' && 'Registered devices with sync queue'}
                  {m.key === 'crm' && 'Leads across the pipeline'}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase 5 — Insight */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 5 · Live
            </div>
            <h2 className="font-serif text-2xl">Insight</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
          {phase5.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'reports' ? counts.sos
                       : m.key === 'hr' ? counts.employees
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'reports' && 'SOs behind the sales / management / GST views'}
                  {m.key === 'hr' && `Employees · ${counts.leavesPending} leave${counts.leavesPending === 1 ? '' : 's'} pending approval`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Phase 6 — Admin */}
      <div className="mb-10">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-1 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> Phase 6 · Live
            </div>
            <h2 className="font-serif text-2xl">Admin</h2>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {phase6.map(m => {
            const Icon = ICONS[m.icon];
            const count = m.key === 'tally' ? counts.migrations
                       : m.key === 'security' ? counts.users
                       : m.key === 'system' ? counts.activeAlerts
                       : 0;
            return (
              <Link key={m.key} href={m.href} className="group bg-white rounded-xl border border-[color:var(--color-line)] p-5 hover:border-[color:var(--color-ink)] hover:shadow-md transition">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-10 h-10 bg-[color:var(--color-paper)] rounded-md flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                </div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{m.label}</div>
                <div className="editorial-num text-4xl mt-1">{count.toLocaleString('en-IN')}</div>
                <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">
                  {m.key === 'tally' && 'Migration jobs · reconciled with source'}
                  {m.key === 'security' && 'Users across roles & scopes'}
                  {m.key === 'system' && `Active alerts${counts.activeAlerts === 0 ? ' · all green' : ' · action required'}`}
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* All phases complete */}
      <div className="mb-4 p-6 bg-[color:var(--color-ink)] text-white rounded-xl flex items-center justify-between gap-4 flex-wrap">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-mustard)] flex items-center gap-2 mb-1">
            <span className="w-1.5 h-1.5 bg-[color:var(--color-mustard)] rounded-full" />
            All six phases live
          </div>
          <div className="font-serif text-2xl">Full ERP shipped end-to-end.</div>
          <div className="text-sm text-white/70 mt-1">
            20 modules · every buy/sell/close-book/fair/deploy motion covered · localStorage persistence.
          </div>
        </div>
        <div className="text-xs text-white/60 font-mono">
          Roadmap complete
        </div>
      </div>
    </div>
  );
}
