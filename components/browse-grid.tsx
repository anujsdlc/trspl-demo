'use client';

import { useEffect, useMemo, useState } from 'react';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { loadMoves } from '@/lib/stock-ledger.client';
import { deltaIndex, onHand, onHandAcross } from '@/lib/stock-ledger';
import { BRAND_META, STORES } from '@/lib/stores';
import { BookCard } from './book-card';
import { X, SlidersHorizontal } from 'lucide-react';
import { inr } from '@/lib/utils';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'snacks', label: 'Snacks' },
  { key: 'drinks', label: 'Drinks' },
  { key: 'tech', label: 'Tech' },
  { key: 'travel', label: 'Travel essentials' },
  { key: 'personal-care', label: 'Wellness' },
  { key: 'magazines', label: 'Magazines' },
  { key: 'gifts', label: 'Gifts' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'non-fiction', label: 'Non-Fiction' },
  { key: 'manga', label: 'Manga' },
  { key: 'children', label: "Children's" },
  { key: 'books', label: 'General books' },
  { key: 'confectionery', label: 'Chocolates' },
  { key: 'sweets', label: 'Indian Sweets' },
  { key: 'cashmere', label: 'Cashmere' },
  { key: 'stationery', label: 'Stationery' },
];

const BRANDS: { key: string; label: string; color?: string }[] = [
  { key: 'all', label: 'All brands' },
  ...Object.entries(BRAND_META).map(([k, v]) => ({ key: k, label: v.name, color: v.color })),
];

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'bestseller', label: 'Bestsellers' },
  { key: 'new', label: 'New arrivals' },
  { key: 'price-asc', label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'name', label: 'A → Z' },
];

const OFFERS = [
  { key: 'all', label: 'Everything' },
  { key: 'bogo', label: 'Buy 1 Get 1 Free' },
  { key: 'reduced', label: 'Reduced price' },
];

const PAGE_SIZE = 60;
const ALL_STORE_IDS = STORES.map(s => s.id);

export interface BrowseGridProps {
  initialCat: string;
  initialBrand: string;
  initialQuery?: string;
  initialSort?: string;
  initialOffer?: string;
  initialStore?: string;
}

export function BrowseGrid({
  initialCat, initialBrand, initialQuery = '', initialSort = 'featured',
  initialOffer = 'all', initialStore = 'all',
}: BrowseGridProps) {
  const [cat, setCat] = useState(initialCat);
  const [brand, setBrand] = useState(initialBrand);
  const [sort, setSort] = useState(SORTS.some(s => s.key === initialSort) ? initialSort : 'featured');
  const [query, setQuery] = useState(initialQuery);
  const [offer, setOffer] = useState(OFFERS.some(o => o.key === initialOffer) ? initialOffer : 'all');
  const [store, setStore] = useState(STORES.some(s => s.id === initialStore) ? initialStore : 'all');
  const [priceMax, setPriceMax] = useState<number>(50000);
  const [inStock, setInStock] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [page, setPage] = useState(1);

  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  useEffect(() => { loadClientCatalog().then(setCatalog); }, []);

  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  useEffect(() => { loadMoves().then(moves => setStockIndex(deltaIndex(moves))); }, []);

  const filtered = useMemo(() => {
    let arr = [...catalog];
    if (cat !== 'all') arr = arr.filter(p => p.category === cat);
    if (brand !== 'all') arr = arr.filter(p => p.brand === brand);
    arr = arr.filter(p => p.price <= priceMax);

    const q = query.trim().toLowerCase();
    if (q) {
      arr = arr.filter(p =>
        p.title.toLowerCase().includes(q) ||
        (p.subtitle ?? '').toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.tags ?? []).some(t => t.toLowerCase().includes(q)),
      );
    }

    if (offer === 'bogo') arr = arr.filter(p => p.bogo);
    else if (offer === 'reduced') arr = arr.filter(p => p.compare != null && p.compare > p.price);

    if (inStock) {
      arr = store === 'all'
        ? arr.filter(p => onHandAcross(p.id, ALL_STORE_IDS, stockIndex) > 0)
        : arr.filter(p => onHand(p.id, store, stockIndex) > 0);
    } else if (store !== 'all') {
      arr = arr.filter(p => onHand(p.id, store, stockIndex) > 0);
    }

    switch (sort) {
      case 'price-asc': arr.sort((a, b) => a.price - b.price); break;
      case 'price-desc': arr.sort((a, b) => b.price - a.price); break;
      case 'name': arr.sort((a, b) => a.title.localeCompare(b.title)); break;
      case 'bestseller': arr.sort((a, b) => (b.bestseller ? 1 : 0) - (a.bestseller ? 1 : 0)); break;
      case 'new': arr.sort((a, b) => (b.newArrival ? 1 : 0) - (a.newArrival ? 1 : 0)); break;
      default:
        arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return arr;
  }, [catalog, cat, brand, sort, priceMax, query, offer, store, inStock, stockIndex]);

  const filterSignature = `${cat}|${brand}|${sort}|${priceMax}|${query}|${offer}|${store}|${inStock}`;
  const [lastSignature, setLastSignature] = useState(filterSignature);
  if (filterSignature !== lastSignature) {
    setLastSignature(filterSignature);
    setPage(1);
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice(0, currentPage * PAGE_SIZE);

  const facetCategoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of catalog) map.set(p.category, (map.get(p.category) || 0) + 1);
    return map;
  }, [catalog]);

  const facetBrandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of catalog) map.set(p.brand, (map.get(p.brand) || 0) + 1);
    return map;
  }, [catalog]);

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-16">
      <aside className={`${mobileOpen ? 'fixed inset-0 z-50 bg-[color:var(--color-cream)] p-6 overflow-auto' : 'hidden md:block'} md:sticky md:top-32 md:h-fit`}>
        {mobileOpen && (
          <div className="flex justify-between items-center mb-8">
            <div className="font-serif text-2xl">Filters</div>
            <button onClick={() => setMobileOpen(false)}><X /></button>
          </div>
        )}
        <FacetGroup title="Category">
          {CATEGORIES.map(c => (
            <FacetRow key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} count={c.key === 'all' ? catalog.length : facetCategoryCounts.get(c.key)}>
              {c.label}
            </FacetRow>
          ))}
        </FacetGroup>

        <FacetGroup title="Brand">
          {BRANDS.map(b => (
            <FacetRow key={b.key} active={brand === b.key} onClick={() => setBrand(b.key)} count={b.key === 'all' ? catalog.length : facetBrandCounts.get(b.key)}>
              <span className="flex items-center gap-2">
                {b.color && <span className="w-2 h-2 rounded-full" style={{ background: b.color }} />}
                {b.label}
              </span>
            </FacetRow>
          ))}
        </FacetGroup>

        <FacetGroup title="Price">
          <div className="text-sm mb-2">Up to <span className="font-mono">{inr(priceMax)}</span></div>
          <input type="range" min={100} max={50000} step={100} value={priceMax} onChange={e => setPriceMax(Number(e.target.value))} className="w-full accent-[color:var(--color-crimson)]" />
          <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-ink-muted)] mt-1">
            <span>₹100</span><span>₹50,000</span>
          </div>
        </FacetGroup>

        <FacetGroup title="Offer">
          {OFFERS.map(o => (
            <FacetRow key={o.key} active={offer === o.key} onClick={() => setOffer(o.key)}>
              {o.label}
            </FacetRow>
          ))}
        </FacetGroup>

        <FacetGroup title="Store">
          <select
            value={store}
            onChange={e => setStore(e.target.value)}
            className="w-full bg-transparent border-b border-[color:var(--color-ink)] py-1 text-sm focus:outline-none"
          >
            <option value="all">Any store</option>
            {STORES.map(s => <option key={s.id} value={s.id}>{s.code} · {s.location}</option>)}
          </select>
        </FacetGroup>

        <FacetGroup title="Availability">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="accent-[color:var(--color-crimson)]" />
            {store === 'all' ? 'In stock at any store' : 'In stock at this store'}
          </label>
        </FacetGroup>

        <button
          onClick={() => {
            setCat('all'); setBrand('all'); setPriceMax(50000); setSort('featured');
            setQuery(''); setOffer('all'); setStore('all'); setInStock(false);
          }}
          className="mt-6 text-xs underline text-[color:var(--color-ink-muted)]"
        >
          Reset all
        </button>
      </aside>

      <main>
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[color:var(--color-line)] flex-wrap gap-3">
          <div className="text-sm text-[color:var(--color-ink-muted)] font-mono">
            {filtered.length.toLocaleString()} results
            {query.trim() && <> for <span className="text-[color:var(--color-ink)]">“{query.trim()}”</span></>}
          </div>
          <div className="flex items-center gap-3">
            <input
              type="search"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search this shelf"
              aria-label="Search the catalog"
              className="h-9 px-3 w-44 md:w-56 bg-transparent border-b border-[color:var(--color-ink)] text-sm focus:outline-none"
            />
            <button onClick={() => setMobileOpen(true)} className="md:hidden inline-flex items-center gap-2 h-9 px-4 border border-[color:var(--color-ink)] rounded-full text-xs">
              <SlidersHorizontal className="w-3.5 h-3.5" /> Filters
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[color:var(--color-ink-muted)]">Sort</span>
              <select value={sort} onChange={e => setSort(e.target.value)} className="bg-transparent border-b border-[color:var(--color-ink)] py-1 pr-6 text-sm focus:outline-none">
                {SORTS.map(s => <option key={s.key} value={s.key}>{s.label}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {visible.map(p => (
            <BookCard key={p.id} product={p} storeCount={((p.id.length * 7) % 22) + 4} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <div className="font-serif text-3xl mb-2">Nothing on this shelf.</div>
            <div className="text-[color:var(--color-ink-muted)]">Try loosening a filter.</div>
          </div>
        )}
        {filtered.length > 0 && (
          <div className="mt-12 flex flex-col items-center gap-4">
            <div className="text-sm text-[color:var(--color-ink-muted)] font-mono">
              Showing {visible.length.toLocaleString()} of {filtered.length.toLocaleString()}
            </div>
            {visible.length < filtered.length && (
              <button
                onClick={() => setPage(p => p + 1)}
                className="h-10 px-6 border border-[color:var(--color-ink)] rounded-full text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-cream)] transition"
              >
                Load {Math.min(PAGE_SIZE, filtered.length - visible.length)} more
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

function FacetGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-8">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">{title}</div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}

function FacetRow({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between text-sm py-1.5 transition ${active ? 'text-[color:var(--color-crimson)] font-medium' : 'hover:text-[color:var(--color-ink)]'}`}
    >
      <span className="text-left">{children}</span>
      {count !== undefined && <span className="text-[10px] font-mono text-[color:var(--color-ink-faint)]">{count}</span>}
    </button>
  );
}
