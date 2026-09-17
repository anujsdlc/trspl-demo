'use client';

import Image from 'next/image';
import Link from 'next/link';
import { Heart, MapPin } from 'lucide-react';
import { useFavourites } from './favourites';
import type { Product } from '@/lib/products';
import { inr } from '@/lib/utils';

interface Props {
  product: Product;
  size?: 'sm' | 'md' | 'lg';
  showStock?: boolean;
  storeCount?: number;
}

export function BookCard({ product, size = 'md', showStock = true, storeCount = 8 }: Props) {
  const { toggle, isFav } = useFavourites();
  const fav = isFav(product.id);

  const heights: Record<string, string> = {
    sm: 'aspect-[2/3] max-h-[220px]',
    md: 'aspect-[2/3] max-h-[340px]',
    lg: 'aspect-[2/3] max-h-[460px]',
  };
  const titleSize = size === 'lg' ? 'text-base md:text-lg' : size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="group book-card">
      <Link href={`/product/${product.id}`} className="block">
        <div className={`relative w-full ${heights[size]} bg-gradient-to-br from-[color:var(--color-paper)] to-[color:var(--color-paper-warm)] rounded-md overflow-hidden book-cover`}>
          <Image
            src={product.image}
            alt={product.title}
            fill
            sizes="(max-width: 768px) 45vw, (max-width: 1200px) 25vw, 200px"
            className="object-cover"
          />
          {product.compare && product.compare > product.price && (
            <div className="absolute top-2 left-2 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] text-[10px] font-bold uppercase tracking-wider px-2 py-1 rounded-sm">
              -{Math.round(((product.compare - product.price) / product.compare) * 100)}%
            </div>
          )}
          <button
            onClick={(e) => { e.preventDefault(); toggle(product.id); }}
            className="absolute top-2 right-2 w-9 h-9 flex items-center justify-center bg-white hover:bg-white rounded-full transition shadow-[0_2px_8px_rgba(0,0,0,0.15),0_1px_2px_rgba(0,0,0,0.1)]"
            aria-label="Save"
          >
            <Heart
              className={`w-[18px] h-[18px] transition ${fav ? 'heart-pop' : ''}`}
              strokeWidth={2.25}
              style={{
                fill: fav ? 'var(--color-crimson)' : 'none',
                stroke: fav ? 'var(--color-crimson)' : 'var(--color-ink)',
              }}
            />
          </button>
        </div>
      </Link>
      <div className="mt-3 space-y-1">
        <Link href={`/product/${product.id}`}>
          <h3 className={`${titleSize} font-medium leading-tight line-clamp-2 group-hover:text-[color:var(--color-crimson)] transition`}>{product.title}</h3>
        </Link>
        {product.subtitle && (
          <p className="text-xs text-[color:var(--color-ink-muted)] line-clamp-1">{product.subtitle}</p>
        )}
        <div className="flex items-baseline gap-2 pt-1">
          <span className="font-medium">{inr(product.price)}</span>
          {product.compare && product.compare > product.price && (
            <span className="text-xs text-[color:var(--color-ink-faint)] line-through">{inr(product.compare)}</span>
          )}
        </div>
        {showStock && (
          <div className="flex items-center gap-1 text-[10px] text-[color:var(--color-ink-muted)] pt-1">
            <MapPin className="w-3 h-3" />
            <span>In stock at {storeCount} stores</span>
            <span className="w-1 h-1 rounded-full bg-[color:var(--color-success)] pulse-dot ml-1" />
          </div>
        )}
      </div>
    </div>
  );
}
