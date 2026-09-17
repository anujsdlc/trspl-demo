'use client';

import { Fragment, useMemo, useState } from 'react';
import Image from 'next/image';
import NextLink from 'next/link';
import { ALL_PRODUCTS, stockFor, PRODUCTS_BY_BRAND, type Product } from '@/lib/products';
import { STORES, BRAND_META, type StoreBrand } from '@/lib/stores';
import { inr } from '@/lib/utils';
import {
  Search, Download, Upload, Filter, ArrowUpDown, AlertTriangle,
  Package, MapPin, Zap, TrendingDown, ChevronDown, ChevronRight, X,
  Plus, Minus, ArrowRightLeft, History, Settings2, RefreshCw, CheckCircle2,
  Sparkles, PackageX, Boxes, Warehouse, FileText, Barcode
} from 'lucide-react';

type SortKey = 'title' | 'sku' | 'stock' | 'price' | 'value';
type SortDir = 'asc' | 'desc';
type StockStatus = 'all' | 'in-stock' | 'low' | 'out';

const REORDER_LEVELS: Record<string, number> = {
  bk: 8, cb: 20, ms: 15, mt: 5, ps: 3, sm: 12, gld: 8,
};

function reorderLevel(id: string) {
  const prefix = id.split('-')[0];
  return REORDER_LEVELS[prefix] ?? 10;
}

interface EnrichedProduct extends Product {
  totalStock: number;
  reserved: number;
  available: number;
  storeStock: { storeId: string; storeCode: string; storeLocation: string; qty: number }[];
  stockValue: number;
  status: 'in-stock' | 'low' | 'out';
  reorderAt: number;
}

export function InventoryConsole() {
  // Enrich all products with per-store stock
  const enriched = useMemo<EnrichedProduct[]>(() => {
    return ALL_PRODUCTS.map(p => {
      const relevantStores = STORES.filter(s => s.brand === p.brand);
      const storeStock = relevantStores.map(s => ({
        storeId: s.id,
        storeCode: s.code,
        storeLocation: s.location,
        qty: stockFor(p.id, s.id),
      }));
      const totalStock = storeStock.reduce((sum, x) => sum + x.qty, 0);
      const reserved = Math.floor(totalStock * 0.08);
      const available = totalStock - reserved;
      const reorderAt = reorderLevel(p.id);
      const status: 'in-stock' | 'low' | 'out' = totalStock === 0 ? 'out' : totalStock < reorderAt * relevantStores.length * 0.5 ? 'low' : 'in-stock';
      return {
        ...p,
        totalStock,
        reserved,
        available,
        storeStock: storeStock.sort((a, b) => b.qty - a.qty),
        stockValue: totalStock * p.price,
        status,
        reorderAt,
      };
    });
  }, []);

  // Filters
  const [query, setQuery] = useState('');
  const [brand, setBrand] = useState<StoreBrand | 'all'>('all');
  const [category, setCategory] = useState<string>('all');
  const [stockStatus, setStockStatus] = useState<StockStatus>('all');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [drawerProduct, setDrawerProduct] = useState<EnrichedProduct | null>(null);
  const [adjustModal, setAdjustModal] = useState<EnrichedProduct | null>(null);
  const [transferModal, setTransferModal] = useState<EnrichedProduct | null>(null);
  const [tab, setTab] = useState<'items' | 'batches' | 'audit' | 'transfers'>('items');

  // Filtered + sorted
  const filtered = useMemo(() => {
    let arr = [...enriched];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(p => p.title.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || (p.isbn?.toLowerCase().includes(q)));
    }
    if (brand !== 'all') arr = arr.filter(p => p.brand === brand);
    if (category !== 'all') arr = arr.filter(p => p.category === category);
    if (stockStatus !== 'all') arr = arr.filter(p => p.status === stockStatus);
    arr.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'sku': return a.sku.localeCompare(b.sku) * mul;
        case 'stock': return (a.totalStock - b.totalStock) * mul;
        case 'price': return (a.price - b.price) * mul;
        case 'value': return (a.stockValue - b.stockValue) * mul;
        default: return a.title.localeCompare(b.title) * mul;
      }
    });
    return arr;
  }, [enriched, query, brand, category, stockStatus, sortKey, sortDir]);

  // KPIs
  const kpi = useMemo(() => {
    const totalSKU = enriched.length;
    const totalStock = enriched.reduce((s, p) => s + p.totalStock, 0);
    const totalValue = enriched.reduce((s, p) => s + p.stockValue, 0);
    const lowStock = enriched.filter(p => p.status === 'low').length;
    const outStock = enriched.filter(p => p.status === 'out').length;
    return { totalSKU, totalStock, totalValue, lowStock, outStock };
  }, [enriched]);

  const categories = useMemo(() => [...new Set(ALL_PRODUCTS.map(p => p.category))], []);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
  }

  function toggleSelect(id: string) {
    setSelected(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  function toggleExpand(id: string) {
    setExpanded(prev => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  }

  return (
    <>
    <div className="px-6 py-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-2">
            <Warehouse className="w-3 h-3" /> Multi-location stock
            <span className="ml-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full pulse-dot" />
              <span className="font-mono">synced 12s ago · {STORES.length} stores</span>
            </span>
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Inventory Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <NextLink href="/admin/inventory/bulk" className="h-9 px-3 border border-[color:var(--color-ink)] bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[color:var(--color-crimson)]">
            <Upload className="w-3.5 h-3.5" /> Bulk upload
          </NextLink>
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <RefreshCw className="w-3.5 h-3.5" /> Recount
          </button>
          <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> Add product
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <MiniKPI label="Total SKUs" value={kpi.totalSKU.toLocaleString('en-IN')} icon={Package} />
        <MiniKPI label="Units on hand" value={kpi.totalStock.toLocaleString('en-IN')} icon={Boxes} />
        <MiniKPI label="Inventory value" value={inr(kpi.totalValue)} icon={Sparkles} accent />
        <MiniKPI label="Low stock" value={kpi.lowStock.toString()} icon={AlertTriangle} warn />
        <MiniKPI label="Out of stock" value={kpi.outStock.toString()} icon={PackageX} danger />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-[color:var(--color-line)] mb-4 text-sm">
        {(['items', 'batches', 'audit', 'transfers'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`pb-3 -mb-px border-b-2 transition capitalize ${tab === t ? 'border-[color:var(--color-ink)] font-medium' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'}`}
          >
            {t === 'items' ? 'All items' : t === 'batches' ? 'Batches & expiry' : t === 'audit' ? 'Audit trail' : 'Transfers'}
            {t === 'items' && <span className="ml-2 text-[10px] font-mono text-[color:var(--color-ink-muted)]">{filtered.length}</span>}
          </button>
        ))}
      </div>

      {tab === 'items' && (
        <>
          {/* Filter bar */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
              <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search by SKU, title, or ISBN…"
                className="flex-1 bg-transparent text-sm focus:outline-none"
              />
              {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5" /></button>}
            </div>

            <FilterPill icon={Filter} label="Brand" value={brand === 'all' ? 'All' : BRAND_META[brand].name}>
              <select value={brand} onChange={e => setBrand(e.target.value as StoreBrand | 'all')} className="absolute inset-0 opacity-0 cursor-pointer">
                <option value="all">All brands</option>
                {Object.entries(BRAND_META).map(([k, v]) => <option key={k} value={k}>{v.name}</option>)}
              </select>
            </FilterPill>

            <FilterPill icon={Filter} label="Category" value={category === 'all' ? 'All' : category}>
              <select value={category} onChange={e => setCategory(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
                <option value="all">All categories</option>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </FilterPill>

            <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
              {(['all', 'in-stock', 'low', 'out'] as const).map(s => (
                <button
                  key={s}
                  onClick={() => setStockStatus(s)}
                  className={`px-3 h-full transition ${stockStatus === s ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}
                >
                  {s === 'all' ? 'All' : s === 'in-stock' ? 'In stock' : s === 'low' ? 'Low' : 'Out'}
                </button>
              ))}
            </div>

            <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
              {filtered.length.toLocaleString('en-IN')} of {enriched.length.toLocaleString('en-IN')}
            </div>
          </div>

          {/* Bulk action bar */}
          {selected.size > 0 && (
            <div className="mb-4 p-3 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-lg flex items-center justify-between text-sm">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="w-4 h-4 text-[color:var(--color-mustard)]" />
                <span>{selected.size} selected</span>
              </div>
              <div className="flex items-center gap-2">
                <button className="h-8 px-3 bg-white/10 hover:bg-white/20 rounded text-xs inline-flex items-center gap-1.5"><ArrowRightLeft className="w-3 h-3" /> Transfer</button>
                <button className="h-8 px-3 bg-white/10 hover:bg-white/20 rounded text-xs inline-flex items-center gap-1.5"><Settings2 className="w-3 h-3" /> Bulk edit</button>
                <button className="h-8 px-3 bg-white/10 hover:bg-white/20 rounded text-xs inline-flex items-center gap-1.5"><Download className="w-3 h-3" /> Export selected</button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-white/60 hover:text-white ml-2">Clear</button>
              </div>
            </div>
          )}

          {/* Data table */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                    <th className="w-10 px-4 py-2.5">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={e => setSelected(e.target.checked ? new Set(filtered.map(f => f.id)) : new Set())}
                        className="accent-[color:var(--color-crimson)]"
                      />
                    </th>
                    <th className="w-8"></th>
                    <SortHead label="Product" active={sortKey === 'title'} dir={sortDir} onClick={() => toggleSort('title')} />
                    <SortHead label="SKU" active={sortKey === 'sku'} dir={sortDir} onClick={() => toggleSort('sku')} className="w-32" />
                    <th className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] w-24">Brand</th>
                    <SortHead label="On hand" active={sortKey === 'stock'} dir={sortDir} onClick={() => toggleSort('stock')} align="right" className="w-24" />
                    <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] w-24">Reserved</th>
                    <th className="text-right px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] w-24">Available</th>
                    <SortHead label="Price" active={sortKey === 'price'} dir={sortDir} onClick={() => toggleSort('price')} align="right" className="w-24" />
                    <SortHead label="Value" active={sortKey === 'value'} dir={sortDir} onClick={() => toggleSort('value')} align="right" className="w-28" />
                    <th className="w-28 px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Status</th>
                    <th className="w-28 px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice(0, 60).map(p => (
                    <Fragment key={p.id}>
                      <tr
                        className={`border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30 transition ${selected.has(p.id) ? 'bg-[color:var(--color-crimson)]/5' : ''}`}
                      >
                        <td className="px-4 py-2.5">
                          <input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} className="accent-[color:var(--color-crimson)]" />
                        </td>
                        <td className="px-1">
                          <button onClick={() => toggleExpand(p.id)} className="p-1 hover:bg-[color:var(--color-paper)] rounded">
                            {expanded.has(p.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                          </button>
                        </td>
                        <td className="px-3 py-2">
                          <button onClick={() => setDrawerProduct(p)} className="flex items-center gap-3 text-left group max-w-md">
                            <div className="w-9 h-12 relative bg-[color:var(--color-paper)] rounded shrink-0 overflow-hidden">
                              <Image src={p.image} alt="" fill sizes="40px" className="object-cover" />
                            </div>
                            <div className="min-w-0">
                              <div className="font-medium leading-tight line-clamp-1 group-hover:text-[color:var(--color-crimson)] transition">{p.title}</div>
                              {p.subtitle && <div className="text-[11px] text-[color:var(--color-ink-muted)] line-clamp-1">{p.subtitle}</div>}
                            </div>
                          </button>
                        </td>
                        <td className="px-3 py-2 font-mono text-[11px] text-[color:var(--color-ink-muted)]">{p.sku}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5 text-xs">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND_META[p.brand].color }} />
                            {BRAND_META[p.brand].name}
                          </div>
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{p.totalStock}</td>
                        <td className="px-3 py-2 text-right font-mono text-[color:var(--color-ink-muted)]">{p.reserved}</td>
                        <td className="px-3 py-2 text-right font-mono font-medium">{p.available}</td>
                        <td className="px-3 py-2 text-right font-mono">{inr(p.price)}</td>
                        <td className="px-3 py-2 text-right font-mono text-[color:var(--color-ink-soft)]">{inr(p.stockValue)}</td>
                        <td className="px-3 py-2">
                          <StockBadge status={p.status} qty={p.totalStock} reorderAt={p.reorderAt * STORES.filter(s => s.brand === p.brand).length * 0.5} />
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1 justify-end">
                            <button onClick={() => setAdjustModal(p)} title="Adjust stock" className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Settings2 className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setTransferModal(p)} title="Transfer" className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><ArrowRightLeft className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                      {expanded.has(p.id) && (
                        <tr className="bg-[color:var(--color-paper)]/30 border-b border-[color:var(--color-line)]">
                          <td colSpan={12} className="px-4 py-4">
                            <ExpandedStockDetail product={p} />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {filtered.length > 60 && (
              <div className="p-4 text-center text-xs text-[color:var(--color-ink-muted)] border-t border-[color:var(--color-line)]">
                Showing 60 of {filtered.length.toLocaleString('en-IN')} · <button className="underline">Load more</button>
              </div>
            )}
          </div>
        </>
      )}

      {tab === 'batches' && <BatchesTab enriched={enriched} />}
      {tab === 'audit' && <AuditTab />}
      {tab === 'transfers' && <TransfersTab />}
    </div>

    {/* Product drawer */}
    {drawerProduct && <ProductDrawer product={drawerProduct} onClose={() => setDrawerProduct(null)} />}
    {adjustModal && <AdjustStockModal product={adjustModal} onClose={() => setAdjustModal(null)} />}
    {transferModal && <TransferModal product={transferModal} onClose={() => setTransferModal(null)} />}
    </>
  );
}

// === Sub-components ===

function MiniKPI({ label, value, icon: Icon, accent, warn, danger }: { label: string; value: string; icon: React.ElementType; accent?: boolean; warn?: boolean; danger?: boolean }) {
  const border = accent ? 'border-[color:var(--color-crimson)]' : warn ? 'border-[color:var(--color-warning)]' : danger ? 'border-[color:var(--color-danger)]' : 'border-[color:var(--color-line)]';
  return (
    <div className={`bg-white rounded-lg border-l-2 ${border} border-t border-r border-b border-[color:var(--color-line)] p-4`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[color:var(--color-crimson)]' : warn ? 'text-[color:var(--color-warning)]' : danger ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-ink-muted)]'}`} />
      </div>
      <div className="editorial-num text-3xl">{value}</div>
    </div>
  );
}

function FilterPill({ icon: Icon, label, value, children }: { icon: React.ElementType; label: string; value: string; children: React.ReactNode }) {
  return (
    <div className="relative h-9 flex items-center gap-1.5 px-3 border border-[color:var(--color-line)] rounded-md text-xs hover:bg-[color:var(--color-paper)] cursor-pointer">
      <Icon className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
      <span className="text-[color:var(--color-ink-muted)]">{label}:</span>
      <span className="font-medium">{value}</span>
      <ChevronDown className="w-3 h-3 text-[color:var(--color-ink-muted)]" />
      {children}
    </div>
  );
}

function SortHead({ label, active, dir, onClick, align, className }: { label: string; active: boolean; dir: SortDir; onClick: () => void; align?: 'right'; className?: string }) {
  return (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className || ''}`}>
      <button onClick={onClick} className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] inline-flex items-center gap-1 hover:text-[color:var(--color-ink)]">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? 'text-[color:var(--color-ink)]' : 'text-[color:var(--color-ink-faint)]'}`} />
      </button>
    </th>
  );
}

function StockBadge({ status, qty, reorderAt }: { status: 'in-stock' | 'low' | 'out'; qty: number; reorderAt: number }) {
  if (status === 'out') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-widest bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]">
        <PackageX className="w-3 h-3" /> Out
      </div>
    );
  }
  if (status === 'low') {
    return (
      <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-widest bg-[color:var(--color-warning)]/15 text-[color:var(--color-warning)]">
        <TrendingDown className="w-3 h-3" /> Low
      </div>
    );
  }
  return (
    <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[10px] uppercase tracking-widest bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]">
      <CheckCircle2 className="w-3 h-3" /> Healthy
    </div>
  );
}

function ExpandedStockDetail({ product }: { product: EnrichedProduct }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-2">
        <MapPin className="w-3 h-3" /> Stock by store · {product.storeStock.length} locations · reorder point {product.reorderAt}/store
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {product.storeStock.map(s => (
          <div key={s.storeId} className="p-2 bg-white border border-[color:var(--color-line)] rounded flex items-center justify-between">
            <div className="min-w-0">
              <div className="font-mono text-[10px] truncate">{s.storeCode}</div>
              <div className="text-[10px] text-[color:var(--color-ink-muted)] truncate">{s.storeLocation}</div>
            </div>
            <div className={`text-sm font-mono font-medium ml-2 ${s.qty === 0 ? 'text-[color:var(--color-ink-faint)]' : s.qty < product.reorderAt ? 'text-[color:var(--color-warning)]' : ''}`}>
              {s.qty || '·'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// === Product drawer ===

function ProductDrawer({ product, onClose }: { product: EnrichedProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Product · {product.sku}</div>
            <div className="font-serif text-lg leading-tight">{product.title}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-1 aspect-[2/3] relative bg-[color:var(--color-paper)] rounded-md overflow-hidden">
              <Image src={product.image} alt={product.title} fill sizes="200px" className="object-cover" />
            </div>
            <div className="col-span-2 space-y-3">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Total stock</div>
                <div className="editorial-num text-4xl">{product.totalStock}</div>
                <div className="text-xs text-[color:var(--color-ink-muted)]">across {product.storeStock.length} stores · {inr(product.stockValue)} value</div>
              </div>
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div><div className="text-[color:var(--color-ink-muted)]">Reserved</div><div className="font-mono">{product.reserved}</div></div>
                <div><div className="text-[color:var(--color-ink-muted)]">Available</div><div className="font-mono">{product.available}</div></div>
                <div><div className="text-[color:var(--color-ink-muted)]">Reorder point</div><div className="font-mono">{product.reorderAt}/store</div></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button className="h-10 border border-[color:var(--color-ink)] rounded-md text-xs font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition inline-flex items-center justify-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add stock</button>
            <button className="h-10 border border-[color:var(--color-ink)] rounded-md text-xs font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition inline-flex items-center justify-center gap-1.5"><ArrowRightLeft className="w-3.5 h-3.5" /> Transfer</button>
            <button className="h-10 border border-[color:var(--color-ink)] rounded-md text-xs font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition inline-flex items-center justify-center gap-1.5"><Barcode className="w-3.5 h-3.5" /> Print label</button>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Stock by store</div>
            <div className="border border-[color:var(--color-line)] rounded-md divide-y divide-[color:var(--color-line)] max-h-80 overflow-y-auto">
              {product.storeStock.map(s => (
                <div key={s.storeId} className="px-3 py-2 flex items-center justify-between text-sm">
                  <div>
                    <div className="font-mono text-xs">{s.storeCode}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)]">{s.storeLocation}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`font-mono ${s.qty === 0 ? 'text-[color:var(--color-ink-faint)]' : ''}`}>{s.qty}</div>
                    <div className="flex gap-1">
                      <button className="w-6 h-6 border border-[color:var(--color-line)] rounded flex items-center justify-center hover:bg-[color:var(--color-paper)]"><Plus className="w-3 h-3" /></button>
                      <button className="w-6 h-6 border border-[color:var(--color-line)] rounded flex items-center justify-center hover:bg-[color:var(--color-paper)]"><Minus className="w-3 h-3" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Attributes</div>
            <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              {product.isbn && <><div className="text-[color:var(--color-ink-muted)]">ISBN</div><div className="font-mono">{product.isbn}</div></>}
              {product.hsn && <><div className="text-[color:var(--color-ink-muted)]">HSN Code</div><div className="font-mono">{product.hsn}</div></>}
              {product.weight && <><div className="text-[color:var(--color-ink-muted)]">Weight</div><div>{product.weight}</div></>}
              {product.bestBefore && <><div className="text-[color:var(--color-ink-muted)]">Best before</div><div>{product.bestBefore}</div></>}
              {product.fssai && <><div className="text-[color:var(--color-ink-muted)]">FSSAI</div><div className="font-mono">{product.fssai}</div></>}
            </div>
          </div>

          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2 flex items-center gap-2">
              <History className="w-3 h-3" /> Recent activity
            </div>
            <div className="space-y-2 text-xs">
              {[
                { t: '2 units sold', s: `at ${product.storeStock[0]?.storeCode}`, when: '4 min ago', tag: 'sale' },
                { t: '1 unit reserved · Order #TRS-4820', s: `at ${product.storeStock[1]?.storeCode}`, when: '18 min ago', tag: 'reserve' },
                { t: '12 units transferred', s: `${product.storeStock[2]?.storeCode} → ${product.storeStock[3]?.storeCode}`, when: '2h ago', tag: 'transfer' },
                { t: 'Price updated · ₹899 → ₹849', s: 'by category manager', when: 'yesterday', tag: 'adjust' },
                { t: 'Stock received · 40 units', s: `at ${product.storeStock[0]?.storeCode}`, when: '3d ago', tag: 'receipt' },
              ].map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-1.5 border-b border-[color:var(--color-line)] last:border-0">
                  <div className="text-[9px] font-mono uppercase tracking-widest w-16 text-[color:var(--color-ink-muted)]">{a.tag}</div>
                  <div className="flex-1">{a.t} <span className="text-[color:var(--color-ink-muted)]">· {a.s}</span></div>
                  <div className="text-[10px] font-mono text-[color:var(--color-ink-faint)]">{a.when}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function AdjustStockModal({ product, onClose }: { product: EnrichedProduct; onClose: () => void }) {
  const [store, setStore] = useState(product.storeStock[0]?.storeId ?? '');
  const [type, setType] = useState<'add' | 'remove' | 'damage' | 'shrinkage'>('add');
  const [qty, setQty] = useState(1);
  const [reason, setReason] = useState('');
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Stock adjustment</div>
            <div className="font-serif text-lg leading-tight line-clamp-1">{product.title}</div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Store</label>
            <select value={store} onChange={e => setStore(e.target.value)} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white">
              {product.storeStock.map(s => <option key={s.storeId} value={s.storeId}>{s.storeCode} · {s.storeLocation} ({s.qty} on hand)</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Adjustment type</label>
            <div className="grid grid-cols-4 gap-2">
              {(['add', 'remove', 'damage', 'shrinkage'] as const).map(t => (
                <button key={t} onClick={() => setType(t)} className={`h-10 rounded-md text-xs capitalize border transition ${type === t ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)] border-[color:var(--color-ink)]' : 'border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]'}`}>{t}</button>
              ))}
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Quantity</label>
            <div className="flex items-center gap-2">
              <button onClick={() => setQty(Math.max(1, qty - 1))} className="w-10 h-10 border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]"><Minus className="w-3.5 h-3.5 mx-auto" /></button>
              <input type="number" value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} className="flex-1 h-10 px-3 border border-[color:var(--color-line)] rounded-md text-center font-mono" />
              <button onClick={() => setQty(qty + 1)} className="w-10 h-10 border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]"><Plus className="w-3.5 h-3.5 mx-auto" /></button>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Reason code</label>
            <select value={reason} onChange={e => setReason(e.target.value)} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white">
              <option value="">Select…</option>
              <option>Physical count reconciliation</option>
              <option>Damaged in transit</option>
              <option>Shop-floor damage</option>
              <option>Return from customer</option>
              <option>Supplier receipt</option>
              <option>Shrinkage / theft</option>
              <option>Expiry write-off</option>
            </select>
          </div>
          <textarea placeholder="Optional notes for audit trail…" rows={3} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md text-sm" />
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button onClick={onClose} className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">Post adjustment</button>
        </div>
      </div>
    </div>
  );
}

function TransferModal({ product, onClose }: { product: EnrichedProduct; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Stock transfer</div>
            <div className="font-serif text-lg leading-tight line-clamp-1">{product.title}</div>
          </div>
          <button onClick={onClose}><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm">
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">From</label>
              <select className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {product.storeStock.filter(s => s.qty > 0).map(s => <option key={s.storeId}>{s.storeCode} ({s.qty})</option>)}
              </select>
            </div>
            <ArrowRightLeft className="w-4 h-4 text-[color:var(--color-ink-muted)] mb-3" />
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">To</label>
              <select className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {product.storeStock.map(s => <option key={s.storeId}>{s.storeCode}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Quantity to transfer</label>
            <input type="number" defaultValue={5} min={1} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-center font-mono text-sm" />
          </div>
          <div>
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Expected arrival</label>
            <input type="date" className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm" />
          </div>
          <div className="p-3 bg-[color:var(--color-paper)] rounded-md text-xs text-[color:var(--color-ink-muted)]">
            Transfer note will be printed at source store and receipt confirmation required at destination. Stock in transit reflects immediately.
          </div>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button onClick={onClose} className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">Create transfer</button>
        </div>
      </div>
    </div>
  );
}

// === Batches tab ===
function BatchesTab({ enriched }: { enriched: EnrichedProduct[] }) {
  const perishable = enriched.filter(p => ['confectionery', 'sweets'].includes(p.category));
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <div className="p-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
        <div>
          <div className="text-sm font-medium">Batch & expiry tracking</div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">FSSAI-compliant · batch, best-before, allergen recording per receipt</div>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
            {['SKU', 'Product', 'Batch', 'Received', 'Best before', 'Days left', 'Qty', 'Store', 'FSSAI'].map(h => (
              <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {perishable.slice(0, 12).map((p, i) => {
            const bb = new Date(p.bestBefore || '2026-06');
            const days = Math.round((bb.getTime() - Date.now()) / 86400000);
            const critical = days < 30;
            return (
              <tr key={p.id} className="border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30">
                <td className="px-3 py-2 font-mono text-xs">{p.sku}</td>
                <td className="px-3 py-2">{p.title}</td>
                <td className="px-3 py-2 font-mono text-xs">B{(1000 + i * 37).toString().substring(0, 4)}</td>
                <td className="px-3 py-2 text-xs">2026-0{(i % 6) + 1}-15</td>
                <td className="px-3 py-2 text-xs">{p.bestBefore}</td>
                <td className={`px-3 py-2 font-mono text-xs ${critical ? 'text-[color:var(--color-danger)] font-medium' : ''}`}>
                  {days}d {critical && <AlertTriangle className="inline w-3 h-3 ml-1" />}
                </td>
                <td className="px-3 py-2 text-right font-mono">{p.totalStock}</td>
                <td className="px-3 py-2 font-mono text-xs">{p.storeStock[0]?.storeCode}</td>
                <td className="px-3 py-2 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{p.fssai}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function AuditTab() {
  const events = [
    { time: '14:22', user: 'A. Kapoor', store: 'RLY-BLR-03', action: 'Stock adjustment', detail: 'One Piece Vol 105 · +12 units · Supplier receipt', ip: '10.14.2.18' },
    { time: '14:15', user: 'S. Iyer', store: 'RLY-DEL-01', action: 'Price change', detail: 'Ferrero Rocher T24 · ₹999 → ₹899', ip: '10.14.2.24' },
    { time: '13:58', user: 'System', store: 'RLY-BOM-01', action: 'Auto-reserve', detail: '1× Atomic Habits · Order TRS-4821', ip: '—' },
    { time: '13:42', user: 'R. Mehta', store: 'RLY-BLR-01', action: 'Transfer created', detail: '12× Milka to RLY-BLR-02', ip: '10.14.2.31' },
    { time: '13:20', user: 'K. Nair', store: 'RLY-COK-01', action: 'Shrinkage recorded', detail: '2× Kit Kat Matcha · Shop-floor damage', ip: '10.14.2.44' },
    { time: '12:55', user: 'P. Sharma', store: 'CB-DEL-02', action: 'Batch received', detail: 'B4321 · Lindt Excellence · 40 units', ip: '10.14.2.51' },
    { time: '12:31', user: 'System', store: 'RLY-HYD-01', action: 'Low-stock alert', detail: 'Ikigai below reorder threshold', ip: '—' },
    { time: '11:48', user: 'M. Krishnan', store: 'MTC-COK-01', action: 'Refund reversal', detail: 'JBL Flip 5 · +1 unit · Return from customer', ip: '10.14.2.62' },
  ];
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <div className="p-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
        <div>
          <div className="text-sm font-medium flex items-center gap-2"><History className="w-4 h-4" /> Audit trail</div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">Every privileged action logged · immutable · exportable for tax audit</div>
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs">
            <option>Today</option><option>Last 7 days</option><option>Last 30 days</option>
          </select>
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> Export</button>
        </div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            <th className="text-left px-3 py-2.5">Time</th>
            <th className="text-left px-3 py-2.5">User</th>
            <th className="text-left px-3 py-2.5">Store</th>
            <th className="text-left px-3 py-2.5">Action</th>
            <th className="text-left px-3 py-2.5">Detail</th>
            <th className="text-left px-3 py-2.5">IP</th>
          </tr>
        </thead>
        <tbody>
          {events.map((e, i) => (
            <tr key={i} className="border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30">
              <td className="px-3 py-2 font-mono text-xs">{e.time}</td>
              <td className="px-3 py-2 text-xs">{e.user}</td>
              <td className="px-3 py-2 font-mono text-xs">{e.store}</td>
              <td className="px-3 py-2 text-xs font-medium">{e.action}</td>
              <td className="px-3 py-2 text-xs text-[color:var(--color-ink-soft)]">{e.detail}</td>
              <td className="px-3 py-2 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{e.ip}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TransfersTab() {
  const transfers = [
    { id: 'TR-2409', from: 'RLY-BLR-01', to: 'RLY-BLR-04', sku: 'Milka Whole Hazelnut × 12', status: 'in-transit', eta: 'Today 18:00' },
    { id: 'TR-2408', from: 'RLY-BOM-01', to: 'RLY-BOM-02', sku: 'Atomic Habits × 6', status: 'received', eta: 'Delivered 12:15' },
    { id: 'TR-2407', from: 'CB-DEL-01', to: 'RLY-DEL-01', sku: 'Lindt Excellence × 24', status: 'dispatched', eta: 'Tomorrow 10:00' },
    { id: 'TR-2406', from: 'RLY-HYD-02', to: 'RLY-HYD-01', sku: 'Ikigai × 8', status: 'in-transit', eta: 'Today 16:30' },
    { id: 'TR-2405', from: 'MTC-COK-01', to: 'MTC-IDR-01', sku: 'JBL Flip 5 × 4', status: 'dispatched', eta: 'Sep 18' },
    { id: 'TR-2404', from: 'RLY-DEL-01', to: 'RLY-GGN-01', sku: 'One Piece Vol 105 × 10', status: 'received', eta: 'Delivered Sep 15' },
  ];
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <div className="p-4 border-b border-[color:var(--color-line)]">
        <div className="text-sm font-medium">Store-to-store transfers</div>
        <div className="text-xs text-[color:var(--color-ink-muted)]">Rebalance stock between stores · confirmation required on receipt</div>
      </div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            <th className="text-left px-3 py-2.5">Transfer #</th>
            <th className="text-left px-3 py-2.5">From</th>
            <th className="text-left px-3 py-2.5">To</th>
            <th className="text-left px-3 py-2.5">Items</th>
            <th className="text-left px-3 py-2.5">ETA</th>
            <th className="text-left px-3 py-2.5">Status</th>
          </tr>
        </thead>
        <tbody>
          {transfers.map(t => (
            <tr key={t.id} className="border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30">
              <td className="px-3 py-2 font-mono text-xs font-medium">{t.id}</td>
              <td className="px-3 py-2 font-mono text-xs">{t.from}</td>
              <td className="px-3 py-2 font-mono text-xs">{t.to}</td>
              <td className="px-3 py-2 text-xs">{t.sku}</td>
              <td className="px-3 py-2 text-xs text-[color:var(--color-ink-muted)]">{t.eta}</td>
              <td className="px-3 py-2">
                <span className={`text-[10px] uppercase tracking-widest px-2 py-1 rounded ${
                  t.status === 'received' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' :
                  t.status === 'in-transit' ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                  'bg-[color:var(--color-cobalt)]/10 text-[color:var(--color-cobalt)]'
                }`}>{t.status}</span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
