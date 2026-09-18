'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useFavourites } from './favourites';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadUploadedProducts } from '@/lib/inventory-store';
import { BookCard } from './book-card';
import { Heart, ArrowUpRight } from 'lucide-react';

export function FavouritesView() {
  const { favs } = useFavourites();
  const [uploaded, setUploaded] = useState<Product[]>([]);
  useEffect(() => { setUploaded(loadUploadedProducts()); }, []);
  const items = [...uploaded, ...ALL_PRODUCTS].filter(p => favs.has(p.id));

  return (
    <div className="container-editorial py-12 md:py-20">
      <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
        <div>
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-3">
            <Heart className="w-3 h-3 fill-[color:var(--color-crimson)]" /> Your shelf
          </div>
          <h1 className="font-serif text-5xl md:text-7xl leading-none tracking-tighter">
            {items.length === 0 ? (
              <>Nothing saved <span className="italic">yet.</span></>
            ) : (
              <>Saved for <span className="italic">later.</span></>
            )}
          </h1>
        </div>
        {items.length > 0 && (
          <div className="text-sm text-[color:var(--color-ink-muted)] font-mono">
            {items.length} {items.length === 1 ? 'item' : 'items'} · synced across devices when signed in
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <div className="py-24 text-center max-w-md mx-auto">
          <div className="w-16 h-16 mx-auto rounded-full bg-[color:var(--color-paper)] flex items-center justify-center mb-6">
            <Heart className="w-6 h-6 text-[color:var(--color-ink-muted)]" />
          </div>
          <div className="text-lg text-[color:var(--color-ink-soft)] leading-relaxed">
            Tap the heart on any book, gadget, or gift to save it here. We&apos;ll ping you when the price drops.
          </div>
          <Link href="/browse" className="mt-8 inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson)] transition">
            Start browsing <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 md:gap-8">
          {items.map(p => <BookCard key={p.id} product={p} storeCount={((p.id.length * 7) % 22) + 4} />)}
        </div>
      )}
    </div>
  );
}
