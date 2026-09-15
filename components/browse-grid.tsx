'use client';

import { useMemo, useState } from 'react';
import { ALL_PRODUCTS, type Category } from '@/lib/products';
import { BRAND_META, type StoreBrand } from '@/lib/stores';
import { BookCard } from './book-card';
import { Filter, X, SlidersHorizontal } from 'lucide-react';
import { inr } from '@/lib/utils';

const CATEGORIES: { key: string; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'fiction', label: 'Fiction' },
  { key: 'non-fiction', label: 'Non-Fiction' },
  { key: 'manga', label: 'Manga' },
  { key: 'children', label: "Children's" },
  { key: 'books', label: 'General' },
  { key: 'tech', label: 'Tech' },
  { key: 'confectionery', label: 'Chocolates' },
  { key: 'sweets', label: 'Indian Sweets' },
  { key: 'cashmere', label: 'Cashmere' },
  { key: 'travel', label: 'Travel' },
  { key: 'stationery', label: 'Stationery' },
];

const BRANDS: { key: string; label: string; color?: string }[] = [
  { key: 'all', label: 'All brands' },
  ...Object.entries(BRAND_META).map(([k, v]) => ({ key: k, label: v.name, color: v.color })),
];

const SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'price-asc', label: 'Price: Low → High' },
  { key: 'price-desc', label: 'Price: High → Low' },
  { key: 'name', label: 'A → Z' },
];

export function BrowseGrid({ initialCat, initialBrand }: { initialCat: string; initialBrand: string }) {
  const [cat, setCat] = useState(initialCat);
  const [brand, setBrand] = useState(initialBrand);
  const [sort, setSort] = useState('featured');
  const [priceMax, setPriceMax] = useState<number>(50000);
  const [inStock, setInStock] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  const filtered = useMemo(() => {
    let arr = [...ALL_PRODUCTS];
    if (cat !== 'all') arr = arr.filter(p => p.category === cat);
    if (brand !== 'all') arr = arr.filter(p => p.brand === brand);
    arr = arr.filter(p => p.price <= priceMax);
    switch (sort) {
      case 'price-asc': arr.sort((a, b) => a.price - b.price); break;
      case 'price-desc': arr.sort((a, b) => b.price - a.price); break;
      case 'name': arr.sort((a, b) => a.title.localeCompare(b.title)); break;
      default:
        arr.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0));
    }
    return arr;
  }, [cat, brand, sort, priceMax]);

  const facetCategoryCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of ALL_PRODUCTS) map.set(p.category, (map.get(p.category) || 0) + 1);
    return map;
  }, []);

  const facetBrandCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of ALL_PRODUCTS) map.set(p.brand, (map.get(p.brand) || 0) + 1);
    return map;
  }, []);

  return (
    <div className="grid md:grid-cols-[240px_1fr] gap-8 md:gap-16">
      {/* Sidebar filters */}
      <aside className={`${mobileOpen ? 'fixed inset-0 z-50 bg-[color:var(--color-cream)] p-6 overflow-auto' : 'hidden md:block'} md:sticky md:top-32 md:h-fit`}>
        {mobileOpen && (
          <div className="flex justify-between items-center mb-8">
            <div className="font-serif text-2xl">Filters</div>
            <button onClick={() => setMobileOpen(false)}><X /></button>
          </div>
        )}
        <FacetGroup title="Category">
          {CATEGORIES.map(c => (
            <FacetRow key={c.key} active={cat === c.key} onClick={() => setCat(c.key)} count={c.key === 'all' ? ALL_PRODUCTS.length : facetCategoryCounts.get(c.key)}>
              {c.label}
            </FacetRow>
          ))}
        </FacetGroup>

        <FacetGroup title="Brand">
          {BRANDS.map(b => (
            <FacetRow key={b.key} active={brand === b.key} onClick={() => setBrand(b.key)} count={b.key === 'all' ? ALL_PRODUCTS.length : facetBrandCounts.get(b.key)}>
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

        <FacetGroup title="Availability">
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="accent-[color:var(--color-crimson)]" />
            In stock at any store
          </label>
        </FacetGroup>

        <button onClick={() => { setCat('all'); setBrand('all'); setPriceMax(50000); setSort('featured'); }} className="mt-6 text-xs underline text-[color:var(--color-ink-muted)]">
          Reset all
        </button>
      </aside>

      <main>
        {/* Sort + count bar */}
        <div className="flex items-center justify-between mb-8 pb-4 border-b border-[color:var(--color-line)] flex-wrap gap-3">
          <div className="text-sm text-[color:var(--color-ink-muted)] font-mono">
            {filtered.length.toLocaleString()} results
          </div>
          <div className="flex items-center gap-3">
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

        {/* Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
          {filtered.slice(0, 60).map(p => (
            <BookCard key={p.id} product={p} storeCount={((p.id.length * 7) % 22) + 4} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-32 text-center">
            <div className="font-serif text-3xl mb-2">Nothing on this shelf.</div>
            <div className="text-[color:var(--color-ink-muted)]">Try loosening a filter.</div>
          </div>
        )}
        {filtered.length > 60 && (
          <div className="mt-12 text-center text-sm text-[color:var(--color-ink-muted)] font-mono">
            Showing 60 of {filtered.length.toLocaleString()} — pagination coming soon
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
