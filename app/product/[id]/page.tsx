import Image from 'next/image';
import Link from 'next/link';
import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { ProductActions } from '@/components/product-actions';
import { UploadedProductFallback } from '@/components/uploaded-product-fallback';
import { ALL_PRODUCTS } from '@/lib/products';
import { getServerCatalog, getServerProduct } from '@/lib/catalog.server';
import { getServerStockIndex } from '@/lib/stock-ledger.server';
import { onHand } from '@/lib/stock-ledger';
import { STORES, BOOK_STORES, BRAND_META } from '@/lib/stores';
import { CATEGORY_MULTIPLIER, TIERS } from '@/lib/loyalty';
import { inr } from '@/lib/utils';
import { ChevronRight, MapPin, Sparkles, Truck, ShieldCheck, Package, RefreshCw } from 'lucide-react';

export const dynamic = 'force-dynamic';

export function generateStaticParams() {
  return ALL_PRODUCTS.slice(0, 20).map(p => ({ id: p.id }));
}

export default async function ProductPage({ params }: PageProps<'/product/[id]'>) {
  const { id } = await params;
  const product = await getServerProduct(id);
  if (!product) {
    return (
      <FavouritesProvider>
        <StoreNav />
        <UploadedProductFallback id={id} />
        <StoreFooter />
      </FavouritesProvider>
    );
  }

  const relevantStores = product.brand === 'RLY' ? BOOK_STORES : STORES.filter(s => s.brand === product.brand);
  const stockIndex = await getServerStockIndex();
  const storeStock = relevantStores.map(s => ({ store: s, qty: onHand(product.id, s.id, stockIndex) })).sort((a, b) => b.qty - a.qty);
  const totalQty = storeStock.reduce((s, x) => s + x.qty, 0);
  const inStockStores = storeStock.filter(x => x.qty > 0).length;
  const nearestInStock = storeStock.find(x => x.qty > 0);

  const brandMeta = BRAND_META[product.brand];
  const catMult = CATEGORY_MULTIPLIER[product.category]?.mult ?? 1;
  const baseTier = TIERS[0];
  const platinumTier = TIERS[2];
  const basePoints = Math.floor((product.price / 100) * baseTier.earn * catMult);
  const platinumPoints = Math.floor((product.price / 100) * platinumTier.earn * catMult);

  const fullCatalog = await getServerCatalog();
  const related = fullCatalog.filter(p => p.category === product.category && p.id !== product.id).slice(0, 8);

  return (
    <FavouritesProvider>
      <StoreNav />

      <div className="container-editorial py-8 md:py-12">
        <nav className="flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)] mb-8">
          <Link href="/" className="hover:text-[color:var(--color-ink)]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href={`/browse?cat=${product.category}`} className="hover:text-[color:var(--color-ink)] capitalize">{product.category}</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[color:var(--color-ink)] truncate">{product.title}</span>
        </nav>

        <div className="grid md:grid-cols-2 gap-8 md:gap-16">
          <div className="md:sticky md:top-32 md:h-fit">
            <div className="aspect-[3/4] max-h-[720px] bg-gradient-to-br from-[color:var(--color-paper)] to-[color:var(--color-paper-warm)] rounded-xl overflow-hidden relative book-cover">
              <Image src={product.image} alt={product.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 50vw" />
              {product.compare && product.compare > product.price && (
                <div className="absolute top-4 left-4 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded-sm">
                  Save {Math.round(((product.compare - product.price) / product.compare) * 100)}%
                </div>
              )}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full" style={{ background: brandMeta.color }} />
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] font-mono">{brandMeta.name} · {product.category}</div>
            </div>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">{product.title}</h1>
            {product.subtitle && (
              <div className="mt-3 text-lg text-[color:var(--color-ink-muted)] italic">by {product.subtitle}</div>
            )}

            <div className="mt-8 flex items-baseline gap-4">
              <span className="editorial-num text-4xl">{inr(product.price)}</span>
              {product.compare && product.compare > product.price && (
                <span className="text-lg text-[color:var(--color-ink-faint)] line-through">{inr(product.compare)}</span>
              )}
            </div>

            <div className="mt-6 p-4 bg-[color:var(--color-paper)] rounded-lg border border-[color:var(--color-line)]">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles className="w-3.5 h-3.5 text-[color:var(--color-crimson)]" />
                <div className="text-[10px] uppercase tracking-widest font-mono">Skyline points on this purchase</div>
              </div>
              <div className="flex items-baseline gap-6 flex-wrap">
                <div>
                  <div className="text-xs text-[color:var(--color-ink-muted)]">Silver base</div>
                  <div className="editorial-num text-2xl">+{basePoints}</div>
                </div>
                <div className="text-[color:var(--color-ink-faint)]">→</div>
                <div>
                  <div className="text-xs text-[color:var(--color-ink-muted)]">Platinum earn</div>
                  <div className="editorial-num text-2xl text-[color:var(--color-crimson)]">+{platinumPoints}</div>
                </div>
                {catMult > 1 && (
                  <div className="ml-auto text-xs text-[color:var(--color-crimson)] font-medium bg-[color:var(--color-crimson)]/10 px-3 py-1.5 rounded-full">
                    Category {catMult}× multiplier
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex items-start gap-3">
              <div className="w-2 h-2 rounded-full bg-[color:var(--color-success)] pulse-dot mt-2" />
              <div>
                <div className="text-sm font-medium">In stock at {inStockStores} stores · {totalQty} units live</div>
                {nearestInStock && (
                  <div className="text-xs text-[color:var(--color-ink-muted)] mt-0.5">
                    Nearest: <span className="font-mono">{nearestInStock.store.code}</span> · {nearestInStock.store.location} · {nearestInStock.qty} units
                  </div>
                )}
              </div>
            </div>

            <ProductActions product={product} />

            <div className="mt-8 grid grid-cols-2 gap-4">
              {[
                { icon: Truck, l: 'Delivery', v: 'Tomorrow · from BLR T2-A' },
                { icon: Package, l: 'Reserve', v: 'Pick up post-security' },
                { icon: RefreshCw, l: 'Returns', v: '7-day easy return' },
                { icon: ShieldCheck, l: 'Warranty', v: 'GST invoice included' },
              ].map(x => (
                <div key={x.l} className="flex items-start gap-3 p-3 border border-[color:var(--color-line)] rounded-md">
                  <x.icon className="w-4 h-4 mt-0.5 text-[color:var(--color-ink-muted)] shrink-0" />
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{x.l}</div>
                    <div className="text-xs mt-0.5">{x.v}</div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4 flex items-center gap-2">
                <MapPin className="w-3 h-3" /> Live stock across {relevantStores.length} stores
              </div>
              <div className="max-h-[280px] overflow-y-auto border border-[color:var(--color-line)] rounded-lg divide-y divide-[color:var(--color-line)]">
                {storeStock.slice(0, 20).map(({ store, qty }) => (
                  <div key={store.id} className="flex items-center justify-between px-4 py-2.5 text-sm">
                    <div className="flex items-center gap-3">
                      <div className={`w-1.5 h-1.5 rounded-full ${qty === 0 ? 'bg-[color:var(--color-line-strong)]' : qty < 5 ? 'bg-[color:var(--color-warning)]' : 'bg-[color:var(--color-success)]'}`} />
                      <div>
                        <div className="text-xs font-mono">{store.code}</div>
                        <div className="text-[10px] text-[color:var(--color-ink-muted)]">{store.location}</div>
                      </div>
                    </div>
                    <div className={`text-xs font-mono ${qty === 0 ? 'text-[color:var(--color-ink-faint)]' : qty < 5 ? 'text-[color:var(--color-warning)]' : ''}`}>
                      {qty === 0 ? 'out' : `${qty} left`}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-10 pt-10 border-t border-[color:var(--color-line)] grid grid-cols-2 gap-4 text-xs">
              <div><span className="text-[color:var(--color-ink-muted)]">SKU</span> <span className="font-mono">{product.sku}</span></div>
              {product.isbn && <div><span className="text-[color:var(--color-ink-muted)]">ISBN</span> <span className="font-mono">{product.isbn}</span></div>}
              {product.hsn && <div><span className="text-[color:var(--color-ink-muted)]">HSN</span> <span className="font-mono">{product.hsn}</span></div>}
              {product.weight && <div><span className="text-[color:var(--color-ink-muted)]">Weight</span> {product.weight}</div>}
              {product.bestBefore && <div><span className="text-[color:var(--color-ink-muted)]">Best before</span> {product.bestBefore}</div>}
              {product.fssai && <div><span className="text-[color:var(--color-ink-muted)]">FSSAI</span> <span className="font-mono">{product.fssai}</span></div>}
            </div>
          </div>
        </div>

        {related.length > 0 && (
          <section className="mt-24 md:mt-32">
            <h2 className="font-serif text-3xl md:text-4xl leading-tight tracking-tight mb-8">You might also like</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              {related.slice(0, 4).map(p => (
                <div key={p.id}>
                  <Link href={`/product/${p.id}`}>
                    <div className="relative aspect-[2/3] rounded-md overflow-hidden book-cover bg-[color:var(--color-paper)]">
                      <Image src={p.image} alt={p.title} fill className="object-cover" sizes="25vw" />
                    </div>
                  </Link>
                  <div className="mt-3 text-sm font-medium line-clamp-2">{p.title}</div>
                  <div className="mt-1 text-sm font-mono">{inr(p.price)}</div>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <StoreFooter />
    </FavouritesProvider>
  );
}
