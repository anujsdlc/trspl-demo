'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, MapPin, ShieldCheck, Truck, Package } from 'lucide-react';
import { SafeImage } from './safe-image';
import { ProductActions } from './product-actions';
import { loadUploadedProducts } from '@/lib/inventory-store';
import { STORES, BRAND_META } from '@/lib/stores';
import { CATEGORY_MULTIPLIER, TIERS } from '@/lib/loyalty';
import { inr } from '@/lib/utils';
import type { Product } from '@/lib/products';

/**
 * Rendered by the product page when the server-side lookup can't
 * find a product with the given ID in the static catalog. We check
 * localStorage for products added via the bulk-upload wizard and
 * render them here.
 */
export function UploadedProductFallback({ id }: { id: string }) {
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  useEffect(() => {
    const uploaded = loadUploadedProducts();
    setProduct(uploaded.find(p => p.id === id) ?? null);
  }, [id]);

  if (product === undefined) {
    return <div className="container-editorial py-24 text-center text-[color:var(--color-ink-muted)]">Loading…</div>;
  }
  if (product === null) {
    return (
      <div className="container-editorial py-24 text-center">
        <h1 className="font-serif text-4xl leading-tight">Product not found.</h1>
        <p className="text-[color:var(--color-ink-muted)] mt-2">The item you&apos;re looking for isn&apos;t on the shelf right now.</p>
        <Link href="/browse" className="mt-6 inline-flex items-center gap-2 h-11 px-5 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium">
          Back to the shelf
        </Link>
      </div>
    );
  }

  const brandMeta = BRAND_META[product.brand];
  const relevantStores = STORES.filter(s => s.brand === product.brand);
  const catMult = CATEGORY_MULTIPLIER[product.category]?.mult ?? 1;
  const baseTier = TIERS[0];
  const platinumTier = TIERS[2];
  const basePoints = Math.floor((product.price / 100) * baseTier.earn * catMult);
  const platinumPoints = Math.floor((product.price / 100) * platinumTier.earn * catMult);

  return (
    <div className="container-editorial py-8 md:py-12">
      <nav className="flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)] mb-8">
        <Link href="/" className="hover:text-[color:var(--color-ink)] inline-flex items-center gap-1">
          <ArrowLeft className="w-3 h-3" /> Home
        </Link>
        <span>/</span>
        <Link href={`/browse?cat=${product.category}`} className="hover:text-[color:var(--color-ink)] capitalize">{product.category}</Link>
        <span>/</span>
        <span className="text-[color:var(--color-ink)] truncate">{product.title}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-8 md:gap-16">
        <div className="md:sticky md:top-32 md:h-fit">
          <div className="aspect-[3/4] max-h-[720px] bg-[color:var(--color-paper)] rounded-xl overflow-hidden relative book-cover">
            <SafeImage src={product.image} alt={product.title} fallbackSeed={product.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
            {product.newArrival && (
              <div className="absolute top-4 left-4 bg-[color:var(--color-crimson)] text-white text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                Just added
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="text-[10px] uppercase tracking-[0.3em] mb-3 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: brandMeta.color }} />
            <span className="text-[color:var(--color-ink-muted)]">{brandMeta.name}</span>
            <span className="text-[color:var(--color-ink-faint)]">·</span>
            <span className="text-[color:var(--color-ink-muted)] capitalize">{product.category}</span>
          </div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">{product.title}</h1>
          {product.subtitle && <p className="mt-2 text-[color:var(--color-ink-soft)]">{product.subtitle}</p>}

          <div className="mt-6 flex items-baseline gap-3">
            <div className="font-serif text-4xl">{inr(product.price)}</div>
            {product.compare && product.compare > product.price && (
              <div className="text-[color:var(--color-ink-faint)] line-through">{inr(product.compare)}</div>
            )}
          </div>

          <ProductActions product={product} />

          <div className="mt-8 space-y-3 text-sm text-[color:var(--color-ink-soft)]">
            <Row icon={MapPin} title="Available at" value={`${relevantStores.length} stores across ${new Set(relevantStores.map(s => s.city)).size} cities`} />
            <Row icon={Truck} title="Delivery" value="Same-day dispatch from nearest store · free above ₹599" />
            <Row icon={Package} title="Reserve now" value="Pick up post-security or ship to your address" />
            <Row icon={ShieldCheck} title="GST invoice" value="Included with every order" />
          </div>

          <div className="mt-8 p-4 rounded-lg bg-[color:var(--color-paper)] border border-[color:var(--color-line)] text-sm">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1.5">Skyline points on this order</div>
            <div className="flex items-baseline gap-3">
              <div className="font-mono">Silver <span className="font-medium">{basePoints}</span> pts</div>
              <div className="font-mono text-[color:var(--color-crimson)]">Platinum <span className="font-medium">{platinumPoints}</span> pts</div>
            </div>
          </div>

          {product.hsn && (
            <div className="mt-8 grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
              <div className="text-[color:var(--color-ink-muted)]">HSN</div><div className="font-mono">{product.hsn}</div>
              {product.weight && <><div className="text-[color:var(--color-ink-muted)]">Weight</div><div>{product.weight}</div></>}
              {product.bestBefore && <><div className="text-[color:var(--color-ink-muted)]">Best before</div><div>{product.bestBefore}</div></>}
              {product.fssai && <><div className="text-[color:var(--color-ink-muted)]">FSSAI</div><div className="font-mono">{product.fssai}</div></>}
              <div className="text-[color:var(--color-ink-muted)]">SKU</div><div className="font-mono">{product.sku}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon: Icon, title, value }: { icon: React.ElementType; title: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-[color:var(--color-paper)] flex items-center justify-center shrink-0">
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{title}</div>
        <div className="text-sm">{value}</div>
      </div>
    </div>
  );
}
