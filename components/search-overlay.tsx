'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { ALL_PRODUCTS, MANGA, FICTION, PRODUCTS_BY_BRAND } from '@/lib/products';
import { BRAND_META } from '@/lib/stores';
import { Search, X, ArrowUpRight, Sparkles, Flame } from 'lucide-react';
import { inr } from '@/lib/utils';

const TRENDING = [
  { q: 'Atomic Habits',   hot: true },
  { q: 'One Piece',       hot: true },
  { q: 'Ikigai' },
  { q: 'Ferrero Rocher' },
  { q: 'Berserk' },
  { q: 'JBL Flip 5',      hot: true },
  { q: 'Pashma cashmere' },
  { q: 'Kaju Katli' },
  { q: 'Marshall Emberton' },
];

const MOODS = [
  { label: 'for the 6am flight',   cat: 'non-fiction', bg: '#F1E71D', ink: '#0A0A0A' },
  { label: 'for the layover',      cat: 'fiction',     bg: '#FF5B3E', ink: '#fff' },
  { label: 'window seat vibes',    cat: 'manga',       bg: '#A8E6B7', ink: '#0A0A0A' },
  { label: 'gift back home',       cat: 'cashmere',    bg: '#B02936', ink: '#fff' },
  { label: 'boarding-gate snack',  cat: 'confectionery', bg: '#6B4423', ink: '#fff' },
  { label: 'tech for the trip',    cat: 'tech',        bg: '#2E4BFF', ink: '#fff' },
];

export function SearchOverlay({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 50);
      const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
      window.addEventListener('keydown', onKey);
      document.body.style.overflow = 'hidden';
      return () => {
        window.removeEventListener('keydown', onKey);
        document.body.style.overflow = '';
      };
    }
  }, [open, onClose]);

  const results = useMemo(() => {
    if (!q.trim()) return [];
    const query = q.toLowerCase().trim();
    return ALL_PRODUCTS
      .filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        p.subtitle?.toLowerCase().includes(query) ||
        p.tags.some(t => t.toLowerCase().includes(query))
      )
      .slice(0, 8);
  }, [q]);

  if (!open) return null;

  const featured = FICTION.slice(0, 4);

  return (
    <div className="fixed inset-0 z-[60] bg-[color:var(--color-cream)] overflow-hidden flex flex-col animate-in fade-in duration-200">
      {/* Top bar */}
      <div className="border-b border-[color:var(--color-line)]">
        <div className="container-editorial flex items-center justify-between h-14">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)]">
            <Sparkles className="w-3 h-3 text-[color:var(--color-crimson)]" />
            Instant search across {ALL_PRODUCTS.length.toLocaleString()} products · 51 stores
          </div>
          <button
            onClick={onClose}
            className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]"
          >
            <span className="border border-[color:var(--color-line-strong)] rounded px-1.5 py-0.5">esc</span>
            close
          </button>
        </div>
      </div>

      {/* Massive input */}
      <div className="container-editorial pt-10 md:pt-16 pb-6">
        <div className="relative">
          <input
            ref={inputRef}
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="What are you reading today?"
            className="w-full font-serif text-5xl md:text-8xl leading-[0.95] tracking-tighter bg-transparent focus:outline-none placeholder:text-[color:var(--color-line-strong)] italic"
          />
          {q && (
            <button
              onClick={() => setQ('')}
              className="absolute top-1/2 -translate-y-1/2 right-0 w-10 h-10 md:w-12 md:h-12 flex items-center justify-center bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full hover:bg-[color:var(--color-crimson)] transition"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        {/* Cursor underline */}
        <div className="mt-2 h-1 w-full bg-[color:var(--color-ink)] relative overflow-hidden rounded-full">
          <div className="absolute inset-y-0 left-0 w-1/3 bg-[color:var(--color-crimson)] sync-slide" />
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto pb-16">
        <div className="container-editorial">
          {!q.trim() ? (
            <div className="grid md:grid-cols-[1fr_1fr] gap-12 md:gap-20 pt-6">
              {/* Trending */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-6 flex items-center gap-2">
                  <Flame className="w-3.5 h-3.5 text-[color:var(--color-crimson)]" />
                  Trending searches
                </div>
                <div className="space-y-2">
                  {TRENDING.map((t, i) => (
                    <button
                      key={t.q}
                      onClick={() => setQ(t.q)}
                      className="group w-full flex items-center gap-4 py-3 border-b border-[color:var(--color-line)] hover:border-[color:var(--color-ink)] transition text-left"
                    >
                      <span className="editorial-num text-2xl text-[color:var(--color-ink-muted)] w-8">{String(i + 1).padStart(2, '0')}</span>
                      <span className="font-serif text-2xl md:text-3xl italic flex-1 group-hover:text-[color:var(--color-crimson)] transition">{t.q}</span>
                      {t.hot && (
                        <span className="text-[10px] uppercase tracking-widest px-2 py-1 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] rounded-full font-bold">
                          hot
                        </span>
                      )}
                      <ArrowUpRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Moods + featured */}
              <div>
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-6">
                  Shop by mood
                </div>
                <div className="flex flex-wrap gap-2 mb-12">
                  {MOODS.map((m, i) => (
                    <Link
                      key={m.label}
                      href={`/browse?cat=${m.cat}`}
                      onClick={onClose}
                      style={{
                        background: m.bg,
                        color: m.ink,
                        transform: `rotate(${(i % 2 === 0 ? -1 : 1) * 0.8}deg)`,
                      }}
                      className="inline-flex items-center gap-2 h-10 px-4 rounded-full font-serif text-base italic hover:scale-110 transition-transform"
                    >
                      {m.label}
                    </Link>
                  ))}
                </div>

                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-6">
                  You might want to read
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {featured.map(p => (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      onClick={onClose}
                      className="group flex gap-3 p-3 border border-[color:var(--color-line)] rounded-lg hover:border-[color:var(--color-ink)] hover:bg-white transition"
                    >
                      <div className="w-14 h-20 relative bg-[color:var(--color-paper)] rounded shrink-0 overflow-hidden">
                        <Image src={p.image} alt="" fill sizes="60px" className="object-cover" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-medium leading-tight line-clamp-2 group-hover:text-[color:var(--color-crimson)] transition">{p.title}</div>
                        <div className="text-xs font-mono mt-1">{inr(p.price)}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          ) : results.length === 0 ? (
            <div className="pt-16 pb-24 text-center">
              <div className="font-serif text-6xl md:text-8xl italic leading-none tracking-tighter">Nothing.</div>
              <div className="mt-6 text-lg text-[color:var(--color-ink-muted)] max-w-md mx-auto">
                No matches for &quot;<span className="italic">{q}</span>&quot;. Try trending, or ask us to source it.
              </div>
              <div className="mt-8">
                <button
                  onClick={() => setQ('')}
                  className="inline-flex items-center gap-2 h-11 px-5 border border-[color:var(--color-ink)] rounded-full text-sm hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-cream)] transition"
                >
                  Clear search
                </button>
              </div>
            </div>
          ) : (
            <div className="pt-6">
              <div className="flex items-center justify-between mb-6">
                <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)]">
                  {results.length} results for <span className="italic font-serif text-lg text-[color:var(--color-ink)]">&quot;{q}&quot;</span>
                </div>
                <Link
                  href={`/browse?q=${encodeURIComponent(q)}`}
                  onClick={onClose}
                  className="text-xs border-b border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)] hover:border-[color:var(--color-crimson)] transition"
                >
                  See all in browse →
                </Link>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {results.map(p => {
                  const meta = BRAND_META[p.brand];
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.id}`}
                      onClick={onClose}
                      className="group flex items-center gap-4 p-4 border border-[color:var(--color-line)] rounded-xl bg-white hover:border-[color:var(--color-ink)] hover:shadow-lg transition"
                    >
                      <div className="w-16 h-20 relative bg-[color:var(--color-paper)] rounded shrink-0 overflow-hidden book-cover">
                        <Image src={p.image} alt="" fill sizes="64px" className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: meta.color }} />
                          {meta.name} · {p.category}
                        </div>
                        <div className="font-serif text-lg leading-tight mt-1 line-clamp-2 group-hover:text-[color:var(--color-crimson)] transition">{p.title}</div>
                        <div className="mt-1.5 flex items-center gap-3">
                          <span className="text-sm font-mono font-medium">{inr(p.price)}</span>
                          {p.compare && p.compare > p.price && (
                            <span className="text-xs text-[color:var(--color-ink-faint)] line-through">{inr(p.compare)}</span>
                          )}
                          <span className="text-[10px] text-[color:var(--color-success)] font-mono ml-auto">In stock</span>
                        </div>
                      </div>
                      <ArrowUpRight className="w-5 h-5 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:-translate-y-1 group-hover:translate-x-1 transition" />
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom hint */}
      <div className="border-t border-[color:var(--color-line)] bg-white">
        <div className="container-editorial h-11 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-[color:var(--color-ink-muted)]">
          <div className="flex items-center gap-4">
            <span>↵ open</span>
            <span>↑↓ navigate</span>
            <span>⌘K toggle</span>
          </div>
          <div>Search — powered by TRS live inventory</div>
        </div>
      </div>
    </div>
  );
}
