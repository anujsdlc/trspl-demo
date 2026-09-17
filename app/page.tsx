import Image from 'next/image';
import Link from 'next/link';
import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { BookCard } from '@/components/book-card';
import { LiveStockStrip } from '@/components/live-stock-strip';
import { LoyaltyCardPreview } from '@/components/loyalty-card';
import { VibeTags } from '@/components/vibe-tags';
import { FEATURED, MANGA, FICTION, NONFIC, PRODUCTS_BY_BRAND, ALL_PRODUCTS, type Product } from '@/lib/products';
import { STORES, BRAND_META, type StoreBrand } from '@/lib/stores';
import { ChocoBayMark, PashmaMark, MotechMark, MishtaMark, SmilenMark, GladysMark } from '@/components/brand-marks';
import { RelayLogo } from '@/components/relay-logo';
import { ArrowUpRight, Plane, Sparkles, MapPin, Zap, Package, Award, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const hero = FEATURED.filter(p => p.category !== 'confectionery').slice(0, 4);
  const heroFeature = hero[0];
  const bestsellers = FICTION.slice(0, 12);
  const mangaTop = MANGA.slice(0, 12);
  const nonfic = NONFIC.slice(0, 8);
  const chocolates = PRODUCTS_BY_BRAND.CB.slice(0, 4);
  const tech = PRODUCTS_BY_BRAND.MTC.slice(0, 4);
  const luxury = PRODUCTS_BY_BRAND.PSH.slice(0, 3);
  const relayBooks = PRODUCTS_BY_BRAND.RLY.slice(0, 4);
  const mishta = PRODUCTS_BY_BRAND.MSH.slice(0, 3);
  const smilen = PRODUCTS_BY_BRAND.SML.slice(0, 3);
  const gladys = PRODUCTS_BY_BRAND.GLD.slice(0, 3);

  return (
    <FavouritesProvider>
      <StoreNav />

      {/* === HERO === */}
      <section className="relative overflow-hidden noise-bg min-h-[calc(100vh-96px)] max-h-[calc(100vh-96px)] flex flex-col">
        <div className="container-editorial pt-6 md:pt-10 pb-6 relative flex-1 flex flex-col justify-between">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-8">
            <span className="w-6 h-px bg-[color:var(--color-ink)]" />
            <span>Vol. 01 · Bangalore · Now delivering</span>
            <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] rounded-full font-mono tracking-normal">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-ink)] rounded-full pulse-dot" />
              live
            </span>
          </div>

          <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-center flex-1">
            <div className="md:col-span-7">
              <h1 className="font-serif text-[11vw] md:text-[8vw] lg:text-[6.5vw] leading-[0.9] tracking-tighter text-balance">
                Everything you need.<br />
                <span className="text-[color:var(--color-crimson)]">Right at your gate.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base md:text-lg leading-relaxed text-[color:var(--color-ink-soft)] text-pretty">
                India&apos;s airport convenience store, now online. Snacks, drinks, books, tech, gifts, wellness and travel essentials — reserved the second you tap add-to-bag, ready at the store nearest your gate.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/browse" className="inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson)] transition group">
                  Explore the shelf
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </Link>
                <Link href="/loyalty" className="inline-flex items-center gap-2 h-12 px-6 border border-[color:var(--color-ink)] rounded-full text-sm font-medium hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-cream)] transition">
                  Skyline · Join Free
                </Link>
              </div>
            </div>

            <div className="md:col-span-5 hidden md:block">
              {heroFeature && (
                <div className="relative">
                  <div className="absolute -top-6 -left-2 text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] font-mono z-10">
                    ✦ Editor&apos;s pick this week
                  </div>
                  <div className="relative aspect-[3/4] max-h-[52vh] rounded-lg overflow-hidden bg-gradient-to-br from-[color:var(--color-paper)] to-[color:var(--color-paper-warm)] shadow-2xl book-cover">
                    <Image src={heroFeature.image} alt={heroFeature.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 40vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1 font-mono">In stock · 18 stores</div>
                      <h2 className="font-serif text-xl md:text-2xl leading-tight">{heroFeature.title}</h2>
                    </div>
                  </div>
                  <div className="absolute -bottom-5 -right-3 bg-[color:var(--color-mustard)] px-4 py-2.5 rounded-md shadow-lg rotate-3">
                    <div className="text-[9px] font-mono uppercase tracking-wider text-[color:var(--color-ink)]/60">Reserve now</div>
                    <div className="font-serif text-base leading-none">Pick up post-security</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Hero stats — bottom of viewport */}
          <div className="mt-6 grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
            {[
              { n: '51', l: 'Live stores' },
              { n: '12', l: 'Cities' },
              { n: '1.7K', l: 'SKUs live' },
              { n: '1', l: 'Loyalty card' },
            ].map(s => (
              <div key={s.l} className="border-t border-[color:var(--color-line)] pt-3">
                <div className="editorial-num text-3xl md:text-4xl">{s.n}</div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mt-1">{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Sub-brand marquee */}
        <div className="bg-[color:var(--color-ink)] text-[color:var(--color-cream)] py-4 overflow-hidden">
          <div className="flex whitespace-nowrap animate-marquee-slow">
            {Array(2).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-16 pr-16 shrink-0">
                {Object.entries(BRAND_META).map(([code, meta]) => (
                  <div key={code} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                    <span className="font-serif text-2xl md:text-3xl italic">{meta.name}</span>
                    <span className="text-xs text-white/40 uppercase tracking-widest">{meta.category}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === LIVE INVENTORY BANNER === */}
      <section className="container-editorial py-16 md:py-24">
        <div className="grid md:grid-cols-12 gap-8 items-start">
          <div className="md:col-span-4">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-4 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-crimson)] rounded-full pulse-dot" /> LIVE INVENTORY
            </div>
            <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
              Every shelf. <br />Every store. <br /><span className="italic">Every second.</span>
            </h2>
          </div>
          <div className="md:col-span-8">
            <p className="text-lg leading-relaxed text-[color:var(--color-ink-soft)] max-w-2xl">
              Type a pincode, we check all {STORES.length} stores in under 200ms and route your order from the one closest to you. No warehouse. Just shelves — synced in real time.
            </p>
            <div className="mt-10 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { icon: Zap, l: 'Sync', v: '< 200ms', s: 'Store → web' },
                { icon: Package, l: 'SKUs live', v: ALL_PRODUCTS.length.toLocaleString(), s: 'Across 51 stores' },
                { icon: MapPin, l: 'Cities', v: '12', s: 'From Kochi to Kolkata' },
                { icon: Plane, l: 'Terminals', v: '38', s: 'Airport + landside' },
              ].map((k) => (
                <div key={k.l} className="p-5 border border-[color:var(--color-line)] rounded-lg bg-[color:var(--color-paper)]/40 hover:bg-[color:var(--color-paper)] transition">
                  <k.icon className="w-4 h-4 text-[color:var(--color-crimson)] mb-6" />
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{k.l}</div>
                  <div className="editorial-num text-3xl mt-1">{k.v}</div>
                  <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1">{k.s}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <LiveStockStrip />

      <VibeTags />

      {/* === BESTSELLERS === */}
      <section className="container-editorial py-16 md:py-24">
        <ShelfHeader kicker="Flying off the shelves — literally" title="Bestsellers, no cap." href="/browse?sort=bestseller" />
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8">
          {bestsellers.map(p => <BookCard key={p.id} product={p} storeCount={((p.id.length * 7) % 22) + 4} />)}
        </div>
      </section>

      {/* === MANGA === */}
      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-cream)] py-16 md:py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-30" />
        <div className="container-editorial relative">
          <div className="flex items-end justify-between mb-12 gap-4 flex-wrap">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-mustard)] mb-3 flex items-center gap-2">
                <Sparkles className="w-3 h-3" /> MANGA BESTSELLERS
              </div>
              <h2 className="font-serif text-4xl md:text-6xl leading-none tracking-tight">
                One Piece. Berserk.<br /><span className="italic text-[color:var(--color-mustard)]">Every arc.</span>
              </h2>
            </div>
            <Link href="/browse?cat=manga" className="text-sm border border-white/30 hover:bg-white hover:text-[color:var(--color-ink)] px-5 py-2.5 rounded-full transition inline-flex items-center gap-2">
              Full shelf <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6 md:gap-8" style={{
            ['--color-ink' as string]: '#F5EFE4',
            ['--color-ink-muted' as string]: '#9A9A9A',
            ['--color-ink-faint' as string]: '#6B6B6B',
            ['--color-crimson' as string]: '#F1E71D',
          }}>
            {mangaTop.map(p => <BookCard key={p.id} product={p} storeCount={((p.id.length * 5) % 15) + 6} />)}
          </div>
        </div>
      </section>

      {/* === HOW IT WORKS === */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid md:grid-cols-12 gap-12 items-start">
          <div className="md:col-span-5 md:sticky md:top-32">
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-4">The Relay method</div>
            <h2 className="font-serif text-5xl md:text-6xl leading-[0.95] tracking-tighter">
              Not a warehouse.<br />
              <span className="italic">51 warehouses.</span>
            </h2>
            <p className="mt-6 text-[color:var(--color-ink-soft)] leading-relaxed max-w-md">
              You order. We find the closest store that stocks it. Store staff pack it. A local rider brings it — often the same day.
            </p>
          </div>
          <div className="md:col-span-7 space-y-1">
            {[
              { n: '01', t: 'Type your pincode', d: 'We check delivery zones across all 51 stores in real time.' },
              { n: '02', t: 'Nearest store selected', d: 'Allocation engine picks the store with stock and shortest reach — often 4-8 km away.' },
              { n: '03', t: 'Stock reserved instantly', d: 'The moment payment clears, that book is off the shelf. No overselling.' },
              { n: '04', t: 'Store team packs it', d: 'Picklist prints at the store console. GST-compliant invoice included.' },
              { n: '05', t: 'Local rider delivers', d: 'Same-city rider for BLR/DEL/BOM/HYD. Courier partner elsewhere.' },
              { n: '06', t: 'Points credit + review', d: 'Skyline points land in your wallet. Rate the read. We remember for next time.' },
            ].map((s) => (
              <div key={s.n} className="group grid grid-cols-[80px_1fr] gap-6 py-6 border-b border-[color:var(--color-line)] hover:pl-4 transition-all">
                <div className="editorial-num text-4xl text-[color:var(--color-crimson)]">{s.n}</div>
                <div>
                  <div className="font-serif text-2xl leading-tight">{s.t}</div>
                  <div className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-md">{s.d}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* === NON-FICTION === */}
      <section className="container-editorial py-16 md:py-24">
        <ShelfHeader kicker="Big brain energy" title="Non-fiction to actually finish." href="/browse?cat=non-fiction" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-10">
          {nonfic.map(p => <BookCard key={p.id} product={p} size="lg" storeCount={((p.id.length * 3) % 20) + 5} />)}
        </div>
      </section>

      {/* === CROSS-BRAND === */}
      <section className="bg-[color:var(--color-paper)] py-24 md:py-32">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">The TRS network</div>
              <h2 className="font-serif text-5xl md:text-6xl leading-none tracking-tighter">
                Seven brands.<br /><span className="italic">One journey.</span>
              </h2>
            </div>
            <p className="text-[color:var(--color-ink-muted)] max-w-md">
              Relay is our convenience anchor. Alongside it — Choco Bay chocolates, Mishta sweets, Smilen gifting, Glady&apos;s premium chocolates, Motech tech, and Pashma cashmere. One card. Every gate.
            </p>
          </div>
          <div className="mobile-scroll grid md:grid-cols-3 lg:grid-cols-4 gap-6 md:gap-8">
            <BrandTile brand="RLY" products={relayBooks} />
            <BrandTile brand="MTC" products={tech} />
            <BrandTile brand="CB" products={chocolates} />
            <BrandTile brand="PSH" products={luxury} />
            <BrandTile brand="MSH" products={mishta} />
            <BrandTile brand="SML" products={smilen} />
            <BrandTile brand="GLD" products={gladys} />
          </div>
        </div>
      </section>

      {/* === LOYALTY TEASER === */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-4 flex items-center gap-2">
              <Award className="w-3 h-3" /> SKYLINE MEMBERSHIP
            </div>
            <h2 className="font-serif text-5xl md:text-7xl leading-[0.95] tracking-tighter">
              One card.<br />51 stores.<br /><span className="italic">Every gate.</span>
            </h2>
            <p className="mt-8 text-lg leading-relaxed max-w-md text-[color:var(--color-ink-soft)]">
              Earn on every purchase — a bottle of water at Relay, a Ferrero box at Choco Bay, cashmere at Pashma. Points work across all seven brands. Redeem anywhere.
            </p>
            <div className="mt-10 space-y-3 max-w-md">
              {['Sign-up bonus of 250 points', 'Category multipliers up to 4× on Pashma', 'Referral bonus of 1,000 points per join', 'Volume bonus up to +50% on big orders'].map(x => (
                <div key={x} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-crimson)]" />
                  {x}
                </div>
              ))}
            </div>
            <Link href="/loyalty" className="mt-10 inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson)] transition group">
              See how it works
              <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
            </Link>
          </div>
          <div className="relative">
            <LoyaltyCardPreview />
          </div>
        </div>
      </section>

      <StoreFooter />
    </FavouritesProvider>
  );
}

function ShelfHeader({ kicker, title, href }: { kicker: string; title: string; href: string }) {
  return (
    <div className="flex items-end justify-between mb-10 gap-4 flex-wrap">
      <div>
        <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">{kicker}</div>
        <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">{title}</h2>
      </div>
      <Link href={href} className="text-sm inline-flex items-center gap-1.5 group border-b border-[color:var(--color-ink)] pb-0.5 hover:text-[color:var(--color-crimson)] hover:border-[color:var(--color-crimson)] transition">
        See all <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
      </Link>
    </div>
  );
}

function BrandTile({ brand, products }: { brand: StoreBrand; products: Product[] }) {
  const meta = BRAND_META[brand];
  const cover = products[0];
  if (!cover) return null;
  return (
    <Link href={`/browse?brand=${brand}`} className="group block relative aspect-[3/4] rounded-xl overflow-hidden">
      <Image src={cover.image} alt={meta.name} fill className="object-cover group-hover:scale-105 transition duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between text-white">
        <div className="text-[10px] uppercase tracking-widest font-mono">{meta.category}</div>
        <div className="w-2.5 h-2.5 rounded-full" style={{ background: meta.color }} />
      </div>
      <div className="absolute bottom-6 left-6 right-6 text-white">
        {brand === 'RLY' && <RelayLogo className="h-10 w-auto" />}
        {brand === 'MTC' && <MotechMark className="h-12 w-auto" color="#FFFFFF" />}
        {brand === 'CB'  && <ChocoBayMark className="h-8 w-auto" color="#FFFFFF" />}
        {brand === 'PSH' && <PashmaMark className="h-14 w-auto" color="#FFFFFF" />}
        {brand === 'MSH' && <MishtaMark className="h-12 w-auto" color="#FFFFFF" />}
        {brand === 'SML' && <SmilenMark className="h-12 w-auto" color="#FFFFFF" />}
        {brand === 'GLD' && <GladysMark className="h-12 w-auto" color="#FFFFFF" />}
        <div className="mt-3 flex items-center gap-2 text-sm">
          Shop the collection <ArrowUpRight className="w-4 h-4 group-hover:translate-x-1 group-hover:-translate-y-1 transition" />
        </div>
      </div>
    </Link>
  );
}
