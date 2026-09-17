'use client';

import { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { useFavourites } from './favourites';
import type { Product } from '@/lib/products';

export function ProductActions({ product }: { product: Product }) {
  const { toggle, isFav } = useFavourites();
  const fav = isFav(product.id);
  const [added, setAdded] = useState(false);

  return (
    <div className="mt-6 flex gap-3">
      <button
        onClick={() => { setAdded(true); setTimeout(() => setAdded(false), 1600); }}
        className={`flex-1 h-14 rounded-full font-medium text-sm inline-flex items-center justify-center gap-2 transition ${
          added
            ? 'bg-[color:var(--color-success)] text-white'
            : 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)] hover:bg-[color:var(--color-crimson)]'
        }`}
      >
        {added ? <><Check className="w-4 h-4" /> Added — reserved at BLR T2-A</> : <><ShoppingBag className="w-4 h-4" /> Add to bag</>}
      </button>
      <button
        onClick={() => toggle(product.id)}
        className={`h-14 w-14 rounded-full border transition inline-flex items-center justify-center ${
          fav ? 'border-[color:var(--color-crimson)] bg-[color:var(--color-crimson)]/5' : 'border-[color:var(--color-ink)] hover:bg-[color:var(--color-paper)]'
        }`}
        aria-label="Favourite"
      >
        <Heart
          className={`w-5 h-5 ${fav ? 'heart-pop' : ''}`}
          strokeWidth={2.25}
          style={{
            fill: fav ? 'var(--color-crimson)' : 'none',
            stroke: fav ? 'var(--color-crimson)' : 'var(--color-ink)',
          }}
        />
      </button>
    </div>
  );
}
