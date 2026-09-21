'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Package,
  Receipt,
  ShoppingCart,
  FileText,
  Download,
  Wallet,
  MapPin,
  Trophy,
} from 'lucide-react';
import {
  loadPOs,
  loadSOs,
  loadSuppliers,
  loadCustomers,
  SEED_POS,
  SEED_SOS,
  SEED_SUPPLIERS,
  SEED_CUSTOMERS,
  type PurchaseOrder,
  type SalesOrder,
  type Supplier,
  type Customer,
} from '@/lib/erp/phase2';
import {
  loadBookMaster,
  loadBranches,
  loadGST,
  SEED_BOOK_MASTER,
  SEED_BRANCHES,
  SEED_GST,
  type BookMaster,
  type Branch,
  type GSTRegistration,
} from '@/lib/erp/foundations';
import { loadJVs, loadCoA, computeBalances, summariseByType, SEED_JVS, SEED_COA } from '@/lib/erp/phase3';
import { loadExhibitions, SEED_EXHIBITIONS, type ExhibitionEvent } from '@/lib/erp/phase4';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import { KPI, Th, StatusPill } from './ui';

type Tab = 'management' | 'sales' | 'purchase' | 'stock' | 'gst' | 'exhibitions';

export function ReportsConsole() {
  const [tab, setTab] = useState<Tab>('management');
  const [pos, setPOs] = useState(SEED_POS);
  const [sos, setSOs] = useState(SEED_SOS);
  const [suppliers, setSuppliers] = useState(SEED_SUPPLIERS);
  const [customers, setCustomers] = useState(SEED_CUSTOMERS);
  const [books, setBooks] = useState(SEED_BOOK_MASTER);
  const [branches, setBranches] = useState(SEED_BRANCHES);
  const [jvs, setJVs] = useState(SEED_JVS);
  const [coa, setCoA] = useState(SEED_COA);
  const [exhibitions, setExhibitions] = useState(SEED_EXHIBITIONS);
  const [gstRegs, setGstRegs] = useState(SEED_GST);

  useEffect(() => {
    loadPOs().then(setPOs);
    loadSOs().then(setSOs);
    loadSuppliers().then(setSuppliers);
    loadCustomers().then(setCustomers);
    loadBookMaster().then(setBooks);
    loadBranches().then(setBranches);
    loadJVs().then(setJVs);
    loadCoA().then(setCoA);
    loadExhibitions().then(setExhibitions);
    loadGST().then(setGstRegs);
  }, []);

  const balances = useMemo(() => computeBalances(coa, jvs), [coa, jvs]);
  const summary = useMemo(() => summariseByType(balances), [balances]);

  const kpi = useMemo(() => ({
    revenue: sos.reduce((s, r) => s + r.total, 0),
    receivables: sos.reduce((s, r) => s + (r.total - r.amountReceived), 0),
    payables: pos.filter(p => p.status !== 'closed').reduce((s, p) => s + p.total, 0),
    profit: summary.income - summary.expense,
    inventory: coa.find(l => l.code === '1200')?.openingBalance ?? 0,
  }), [sos, pos, summary, coa]);

  const exportCurrentView = () => {
    downloadCSV(
      `trs-report-${tab}.csv`,
      ['metric', 'value'],
      [
        { metric: 'View', value: tab },
        { metric: 'Sales (YTD)', value: String(kpi.revenue) },
        { metric: 'Receivables', value: String(kpi.receivables) },
        { metric: 'Purchase pipeline', value: String(kpi.payables) },
        { metric: 'Net income', value: String(kpi.profit) },
        { metric: 'Inventory value', value: String(kpi.inventory) },
        { metric: 'Sales orders', value: String(sos.length) },
        { metric: 'Purchase orders', value: String(pos.length) },
      ],
    );
  };

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <BarChart3 className="w-3 h-3" /> Insight
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Reports &amp; Dashboards</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            One place for management, sales, purchase, stock, GST, and exhibition reporting — computed live from every prior phase.
          </p>
        </div>
        <button onClick={exportCurrentView} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
          <Download className="w-3.5 h-3.5" /> Export current view
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Sales (YTD)" value={inr(kpi.revenue)} accent="success" />
        <KPI label="Receivables" value={inr(kpi.receivables)} accent={kpi.receivables > 0 ? 'warn' : undefined} />
        <KPI label="Purchase pipeline" value={inr(kpi.payables)} />
        <KPI label="Net income" value={inr(kpi.profit)} accent={kpi.profit >= 0 ? 'success' : 'danger'} />
        <KPI label="Inventory value" value={inr(kpi.inventory)} />
      </div>

      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-6 overflow-x-auto">
        {([
          ['management', 'Management', TrendingUp],
          ['sales', 'Sales', Receipt],
          ['purchase', 'Purchase', ShoppingCart],
          ['stock', 'Stock', Package],
          ['gst', 'GST', FileText],
          ['exhibitions', 'Exhibitions', Trophy],
        ] as [Tab, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-11 px-4 text-sm inline-flex items-center gap-2 border-b-2 transition ${
            tab === k ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
          }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'management' && <ManagementTab sos={sos} pos={pos} branches={branches} customers={customers} balances={balances} />}
      {tab === 'sales' && <SalesTab sos={sos} customers={customers} />}
      {tab === 'purchase' && <PurchaseTab pos={pos} suppliers={suppliers} />}
      {tab === 'stock' && <StockTab books={books} branches={branches} />}
      {tab === 'gst' && <GSTTab sos={sos} gstRegs={gstRegs} />}
      {tab === 'exhibitions' && <ExhibitionsTab exhibitions={exhibitions} />}
    </div>
  );
}

function ManagementTab({ sos, pos, branches, customers, balances }: {
  sos: SalesOrder[]; pos: PurchaseOrder[];
  branches: Branch[];
  customers: Customer[];
  balances: ReturnType<typeof computeBalances>;
}) {
  const salesByBranch = useMemo(() => {
    const map = new Map<string, number>();
    for (const so of sos) map.set(so.branchId, (map.get(so.branchId) ?? 0) + so.total);
    return branches.map(b => ({ name: b.name, code: b.code, total: map.get(b.id) ?? 0 })).sort((a, b) => b.total - a.total).slice(0, 8);
  }, [sos, branches]);
  const maxBranch = Math.max(...salesByBranch.map(s => s.total), 1);

  const topCustomers = useMemo(() =>
    customers.slice().sort((a, b) => b.ytdRevenue - a.ytdRevenue).slice(0, 6),
    [customers]
  );

  const ageingBuckets = useMemo(() => {
    const buckets = { '0-30': 0, '31-60': 0, '61-90': 0, '90+': 0 };
    const now = Date.now();
    for (const so of sos) {
      const due = so.total - so.amountReceived;
      if (due <= 0) continue;
      const age = Math.floor((now - new Date(so.orderDate).getTime()) / (86400000));
      if (age <= 30) buckets['0-30'] += due;
      else if (age <= 60) buckets['31-60'] += due;
      else if (age <= 90) buckets['61-90'] += due;
      else buckets['90+'] += due;
    }
    return buckets;
  }, [sos]);

  const cashPosition = balances.filter(b => b.ledger.isBank).reduce((s, b) => s + b.closingBalance, 0);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4 flex items-center gap-1.5">
            <MapPin className="w-3 h-3" /> Branch performance — sales (YTD)
          </div>
          <div className="space-y-3">
            {salesByBranch.map(b => (
              <div key={b.code}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="truncate">{b.name}</span>
                  <span className="font-mono">{inr(b.total)}</span>
                </div>
                <div className="h-2 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                  <div className="h-full bg-[color:var(--color-crimson)] rounded-full" style={{ width: `${(b.total / maxBranch) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Top customers (YTD)</div>
          <div className="space-y-2">
            {topCustomers.map(c => (
              <div key={c.id} className="flex items-center justify-between text-sm">
                <div>
                  <div>{c.name}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{c.code} · {c.type}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{inr(c.ytdRevenue)}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)]">{c.ordersCount} orders</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[color:var(--color-ink)] text-white rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2 flex items-center gap-1.5">
            <Wallet className="w-3 h-3" /> Cash position
          </div>
          <div className="editorial-num text-4xl">{inr(cashPosition)}</div>
          <div className="text-xs text-white/60 mt-1">across all bank ledgers</div>
        </div>

        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Receivables ageing</div>
          <div className="space-y-2 text-xs">
            {(Object.entries(ageingBuckets) as [string, number][]).map(([k, v]) => (
              <div key={k} className="flex items-center justify-between">
                <span className="text-[color:var(--color-ink-muted)]">{k} days</span>
                <span className={`font-mono ${k === '90+' && v > 0 ? 'text-[color:var(--color-danger)]' : k === '61-90' && v > 0 ? 'text-[color:var(--color-warning)]' : ''}`}>{inr(v)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Purchase pipeline</div>
          <div className="space-y-1.5 text-xs">
            {(['draft', 'placed', 'partial', 'received', 'billed'] as const).map(s => {
              const count = pos.filter(p => p.status === s).length;
              return (
                <div key={s} className="flex items-center justify-between">
                  <span className="text-[color:var(--color-ink-muted)] capitalize">{s}</span>
                  <span className="font-mono">{count}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function SalesTab({ sos, customers }: { sos: SalesOrder[]; customers: Customer[] }) {
  const custById = useMemo(() => new Map(customers.map(c => [c.id, c])), [customers]);
  const topTitles = useMemo(() => {
    const map = new Map<string, { title: string; qty: number; value: number }>();
    for (const so of sos) {
      for (const l of so.lines) {
        const cur = map.get(l.title) ?? { title: l.title, qty: 0, value: 0 };
        cur.qty += l.qty;
        cur.value += l.qty * l.unitPrice * (1 - l.discount / 100);
        map.set(l.title, cur);
      }
    }
    return [...map.values()].sort((a, b) => b.value - a.value).slice(0, 8);
  }, [sos]);

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="md:col-span-2 bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Sales register</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="SO #" className="w-40" />
                <Th label="Date" className="w-24" />
                <Th label="Customer" />
                <Th label="Invoice" className="w-40" />
                <Th label="Subtotal" align="right" className="w-32" />
                <Th label="GST" align="right" className="w-24" />
                <Th label="Total" align="right" className="w-32" />
                <Th label="Received" align="right" className="w-32" />
                <Th label="Status" className="w-24" />
              </tr>
            </thead>
            <tbody>
              {sos.map(so => (
                <tr key={so.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-3 py-2 font-mono text-xs">{so.soNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs">{so.orderDate}</td>
                  <td className="px-3 py-2 text-xs">{custById.get(so.customerId)?.name ?? so.customerId}</td>
                  <td className="px-3 py-2 font-mono text-xs">{so.invoiceNumber ?? '—'}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{inr(so.subtotal - so.discountTotal)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{inr(so.gstTotal)}</td>
                  <td className="px-3 py-2 text-right font-mono">{inr(so.total)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{inr(so.amountReceived)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={so.status} tone={so.status === 'paid' ? 'success' : so.status === 'invoiced' || so.status === 'delivered' ? 'warning' : 'info'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4 flex items-center gap-1.5">
          <Trophy className="w-3 h-3" /> Top-selling titles
        </div>
        <div className="space-y-3">
          {topTitles.map((t, i) => (
            <div key={t.title} className="flex items-center gap-3">
              <div className="text-lg font-serif w-6 text-center text-[color:var(--color-ink-muted)]">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-sm truncate">{t.title}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{t.qty} units</div>
              </div>
              <div className="font-mono text-sm">{inr(t.value)}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Customer segments</div>
        <div className="space-y-2">
          {(['school', 'dealer', 'distributor', 'institution', 'retail'] as const).map(type => {
            const segment = customers.filter(c => c.type === type);
            const revenue = segment.reduce((s, c) => s + c.ytdRevenue, 0);
            const totalRevenue = customers.reduce((s, c) => s + c.ytdRevenue, 0);
            const pct = totalRevenue > 0 ? (revenue / totalRevenue) * 100 : 0;
            return (
              <div key={type}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="capitalize">{type}</span>
                  <span className="font-mono">{inr(revenue)} · {pct.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                  <div className="h-full bg-[color:var(--color-crimson)] rounded-full" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function PurchaseTab({ pos, suppliers }: { pos: PurchaseOrder[]; suppliers: Supplier[] }) {
  const supById = useMemo(() => new Map(suppliers.map(s => [s.id, s])), [suppliers]);
  const topSuppliers = useMemo(() => {
    const map = new Map<string, number>();
    for (const po of pos) map.set(po.supplierId, (map.get(po.supplierId) ?? 0) + po.total);
    return [...map.entries()].map(([id, total]) => ({ supplier: supById.get(id), total })).filter(e => e.supplier).sort((a, b) => b.total - a.total).slice(0, 6);
  }, [pos, supById]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Purchase register</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="PO #" className="w-36" />
                <Th label="Date" className="w-24" />
                <Th label="Supplier" />
                <Th label="Lines" className="w-16" align="right" />
                <Th label="Subtotal" align="right" className="w-32" />
                <Th label="Total" align="right" className="w-32" />
                <Th label="Status" className="w-20" />
              </tr>
            </thead>
            <tbody>
              {pos.map(po => (
                <tr key={po.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-3 py-2 font-mono text-xs">{po.poNumber}</td>
                  <td className="px-3 py-2 font-mono text-xs">{po.orderDate}</td>
                  <td className="px-3 py-2 text-xs">{supById.get(po.supplierId)?.name ?? po.supplierId}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{po.lines.length}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{inr(po.subtotal - po.discountTotal)}</td>
                  <td className="px-3 py-2 text-right font-mono">{inr(po.total)}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={po.status} tone={po.status === 'billed' || po.status === 'closed' ? 'success' : po.status === 'partial' ? 'warning' : 'info'} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4 flex items-center gap-1.5">
          <Trophy className="w-3 h-3" /> Top suppliers
        </div>
        <div className="space-y-3">
          {topSuppliers.map(t => (
            <div key={t.supplier!.id} className="flex items-center justify-between">
              <div className="min-w-0">
                <div className="text-sm truncate">{t.supplier!.name}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono capitalize">{t.supplier!.type}</div>
              </div>
              <div className="font-mono text-sm">{inr(t.total)}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function StockTab({ books, branches }: { books: BookMaster[]; branches: Branch[] }) {
  const stockValue = books.reduce((s, b) => s + (b.mrp * 45), 0);
  const byBoard = useMemo(() => {
    const map = new Map<string, { count: number; value: number }>();
    for (const b of books) {
      const cur = map.get(b.board) ?? { count: 0, value: 0 };
      cur.count += 1;
      cur.value += b.mrp * 45;
      map.set(b.board, cur);
    }
    return [...map.entries()].sort((a, b) => b[1].value - a[1].value);
  }, [books]);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Stock by title</div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="ISBN" className="w-36" />
                <Th label="Title" />
                <Th label="Board" className="w-24" />
                <Th label="Class" className="w-16" />
                <Th label="MRP" align="right" className="w-24" />
                <Th label="Est. Stock" align="right" className="w-24" />
                <Th label="Value" align="right" className="w-32" />
              </tr>
            </thead>
            <tbody>
              {books.slice(0, 12).map(b => (
                <tr key={b.id} className="border-b border-[color:var(--color-line)] last:border-0">
                  <td className="px-3 py-2 font-mono text-xs">{b.isbn}</td>
                  <td className="px-3 py-2 text-xs">{b.title}</td>
                  <td className="px-3 py-2 text-xs">{b.board}</td>
                  <td className="px-3 py-2 font-mono text-xs">{b.class}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{inr(b.mrp)}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">45</td>
                  <td className="px-3 py-2 text-right font-mono">{inr(b.mrp * 45)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[color:var(--color-ink)] text-white rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2 flex items-center gap-1.5">
            <Package className="w-3 h-3" /> Total stock value
          </div>
          <div className="editorial-num text-3xl">{inr(stockValue)}</div>
          <div className="text-xs text-white/60 mt-1">{books.length} titles · 45 avg units each</div>
        </div>

        <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Stock by board</div>
          <div className="space-y-2 text-xs">
            {byBoard.map(([board, v]) => (
              <div key={board} className="flex items-center justify-between">
                <span>{board}</span>
                <div className="text-right">
                  <div className="font-mono">{inr(v.value)}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)]">{v.count} titles</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function GSTTab({ sos, gstRegs }: { sos: SalesOrder[]; gstRegs: GSTRegistration[] }) {
  const byState = useMemo(() => {
    const map = new Map<string, { invoices: number; taxable: number; gst: number; total: number }>();
    for (const so of sos) {
      if (!['invoiced', 'delivered', 'paid'].includes(so.status)) continue;
      const reg = gstRegs.find(g => g.id === so.gstinId);
      if (!reg) continue;
      const cur = map.get(reg.state) ?? { invoices: 0, taxable: 0, gst: 0, total: 0 };
      cur.invoices += 1;
      cur.taxable += so.subtotal - so.discountTotal;
      cur.gst += so.gstTotal;
      cur.total += so.total;
      map.set(reg.state, cur);
    }
    return [...map.entries()];
  }, [sos, gstRegs]);

  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">GST register — outward supplies by state</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
            <Th label="State" />
            <Th label="Invoices" align="right" className="w-24" />
            <Th label="Taxable value" align="right" className="w-36" />
            <Th label="GST" align="right" className="w-32" />
            <Th label="Total" align="right" className="w-36" />
          </tr>
        </thead>
        <tbody>
          {byState.map(([state, v]) => (
            <tr key={state} className="border-b border-[color:var(--color-line)] last:border-0">
              <td className="px-3 py-2">{state}</td>
              <td className="px-3 py-2 text-right font-mono text-xs">{v.invoices}</td>
              <td className="px-3 py-2 text-right font-mono">{inr(v.taxable)}</td>
              <td className="px-3 py-2 text-right font-mono text-xs">{inr(v.gst)}</td>
              <td className="px-3 py-2 text-right font-mono">{inr(v.total)}</td>
            </tr>
          ))}
          {byState.length === 0 && <tr><td colSpan={5} className="px-4 py-8 text-center text-[color:var(--color-ink-muted)]">No GST-eligible invoices in the period.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}

function ExhibitionsTab({ exhibitions }: { exhibitions: ExhibitionEvent[] }) {
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Event performance</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
            <Th label="Event" />
            <Th label="Dates" className="w-40" />
            <Th label="Issued" align="right" className="w-24" />
            <Th label="Sold" align="right" className="w-24" />
            <Th label="Sold value" align="right" className="w-32" />
            <Th label="Expenses" align="right" className="w-28" />
            <Th label="Margin" align="right" className="w-28" />
            <Th label="Status" className="w-24" />
          </tr>
        </thead>
        <tbody>
          {exhibitions.map(ev => {
            const issued = ev.lines.reduce((s, l) => s + l.qtyIssued, 0);
            const sold = ev.lines.reduce((s, l) => s + l.qtySold, 0);
            const soldValue = ev.lines.reduce((s, l) => s + l.qtySold * l.unitPrice * (1 - l.discount / 100), 0);
            const margin = soldValue - ev.totalExpenses;
            return (
              <tr key={ev.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                <td className="px-3 py-2">
                  <div className="font-medium">{ev.name}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{ev.code}</div>
                </td>
                <td className="px-3 py-2 font-mono text-xs">{ev.startDate} → {ev.endDate}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{issued}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{sold}</td>
                <td className="px-3 py-2 text-right font-mono">{inr(soldValue)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-[color:var(--color-ink-muted)]">{inr(ev.totalExpenses)}</td>
                <td className={`px-3 py-2 text-right font-mono ${margin >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>{inr(margin)}</td>
                <td className="px-3 py-2">
                  <StatusPill status={ev.status} tone={ev.status === 'settled' ? 'success' : ev.status === 'live' ? 'warning' : 'info'} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
