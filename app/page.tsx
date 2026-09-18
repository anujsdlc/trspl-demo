import Link from 'next/link';
import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { LoyaltyCardPreview } from '@/components/loyalty-card';
import { SafeImage } from '@/components/safe-image';
import { ProductShelf, TerminalPickShelf, CategoryTileRow } from '@/components/product-shelf';
import {
  FEATURED, MANGA, FICTION, NONFIC, PRODUCTS_BY_BRAND, PRODUCTS_BY_CATEGORY,
  ALL_PRODUCTS, type Product,
} from '@/lib/products';
import { BRAND_META, type StoreBrand } from '@/lib/stores';
import {
  ChocoBayMark, PashmaMark, MotechMark, MishtaMark, SmilenMark, GladysMark,
} from '@/components/brand-marks';
import { RelayLogo } from '@/components/relay-logo';
import {
  ArrowUpRight, Plane, Sparkles, Award, ChevronRight, Tag, Coffee, Utensils,
  Smartphone, ShoppingBag, Zap, Gift, BookOpen,
} from 'lucide-react';

export default function HomePage() {
  // === Hero anchor ===
  const heroFeature = FEATURED[0];

  // === Merchandising slices ===
  const bogo = ALL_PRODUCTS.filter(p => p.bogo);
  const newArrivals = [
    ...ALL_PRODUCTS.filter(p => p.newArrival),
    ...FICTION.slice(0, 6),
  ].slice(0, 10);
  const relayPicks = ALL_PRODUCTS.filter(p => p.relayPick).slice(0, 10);
  const bestsellers = [
    ...FICTION.filter(p => p.featured),
    ...ALL_PRODUCTS.filter(p => p.bestseller),
  ].slice(0, 10);

  const snacks = PRODUCTS_BY_CATEGORY.snacks;
  const drinks = PRODUCTS_BY_CATEGORY.drinks;
  const travelEssentials = PRODUCTS_BY_CATEGORY.travel;
  const wellness = PRODUCTS_BY_CATEGORY['personal-care'];
  const magazines = PRODUCTS_BY_CATEGORY.magazines;

  // Tech from Relay (chargers, cables, power banks, earphones) + Motech premium
  const techShelf = [
    ...PRODUCTS_BY_BRAND.RLY.filter(p => p.category === 'tech'),
    ...PRODUCTS_BY_BRAND.MTC.slice(0, 4),
  ];

  // Gifting = Choco Bay + Mishta + Relay gifts + Smilen + Gladys
  const gifting = [
    ...PRODUCTS_BY_BRAND.CB.slice(0, 4),
    ...PRODUCTS_BY_BRAND.MSH.slice(0, 3),
    ...PRODUCTS_BY_BRAND.SML.slice(0, 2),
    ...PRODUCTS_BY_BRAND.GLD.slice(0, 1),
    ...PRODUCTS_BY_CATEGORY.gifts.filter(p => p.brand === 'RLY'),
  ];

  // Terminal picks — hardcoded to a signature store; a real app would infer
  // from GPS/pincode. Mix snacks, drinks, tech, travel — the impulse cart.
  const terminalPicks = [
    ...snacks.slice(0, 2),
    ...drinks.slice(0, 1),
    ...travelEssentials.slice(0, 1),
    ...techShelf.slice(0, 1),
  ];

  const chocolates = PRODUCTS_BY_BRAND.CB.slice(0, 4);
  const tech = PRODUCTS_BY_BRAND.MTC.slice(0, 4);
  const luxury = PRODUCTS_BY_BRAND.PSH.slice(0, 3);
  const relayBooks = PRODUCTS_BY_BRAND.RLY.slice(0, 4);
  const mishta = PRODUCTS_BY_BRAND.MSH.slice(0, 3);
  const smilen = PRODUCTS_BY_BRAND.SML.slice(0, 3);
  const gladys = PRODUCTS_BY_BRAND.GLD.slice(0, 3);

  const departmentTiles = [
    { label: 'Snacks',    href: '/browse?cat=snacks',        image: 'https://images.unsplash.com/photo-1613919113640-25732ec5e61f?w=400&q=80' },
    { label: 'Drinks',    href: '/browse?cat=drinks',        image: 'https://images.unsplash.com/photo-1613218841863-9420a4e29ea1?w=400&q=80' },
    { label: 'Tech',      href: '/browse?cat=tech',          image: 'https://images.unsplash.com/photo-1587037542794-6ad4433f95a1?w=400&q=80' },
    { label: 'Travel',    href: '/browse?cat=travel',        image: 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=400&q=80' },
    { label: 'Books',     href: '/browse',                   image: 'https://images.unsplash.com/photo-1495640388908-05fa85288e61?w=400&q=80' },
    { label: 'Wellness',  href: '/browse?cat=personal-care', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400&q=80' },
    { label: 'Gifts',     href: '/browse?cat=gifts',         image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=400&q=80' },
    { label: 'Magazines', href: '/browse?cat=magazines',     image: 'https://images.unsplash.com/photo-1594736797933-d0a501ba2fe6?w=400&q=80' },
  ];

  return (
    <FavouritesProvider>
      <StoreNav />

      {/* === HERO === */}
      <section className="relative overflow-hidden noise-bg">
        <div className="container-editorial pt-6 md:pt-10 pb-10 relative">
          <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-6">
            <span className="w-6 h-px bg-[color:var(--color-ink)]" />
            <span>Vol. 01 · Bangalore · Now delivering</span>
            <span className="ml-3 inline-flex items-center gap-1.5 px-2 py-0.5 bg-[color:var(--color-crimson)] text-white rounded-full font-mono tracking-normal">
              <span className="w-1.5 h-1.5 bg-white rounded-full pulse-dot" />
              live
            </span>
          </div>

          <div className="grid md:grid-cols-12 gap-6 md:gap-10 items-center">
            <div className="md:col-span-7">
              <h1 className="font-serif text-[10vw] md:text-[7vw] lg:text-[5.5vw] leading-[0.9] tracking-tighter text-balance">
                Everything you need.<br />
                <span className="text-[color:var(--color-crimson)]">Right at your gate.</span>
              </h1>
              <p className="mt-5 max-w-lg text-base md:text-lg leading-relaxed text-[color:var(--color-ink-soft)] text-pretty">
                India&apos;s airport convenience store, now online. Snacks, drinks, books, tech, gifts, wellness and travel essentials — reserved the second you tap add-to-bag, ready at the store nearest your gate.
              </p>
              <div className="mt-6 flex flex-wrap items-center gap-3">
                <Link href="/browse" className="inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson-deep)] transition group">
                  Shop everything
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </Link>
                <Link href="/loyalty" className="inline-flex items-center gap-2 h-12 px-6 border border-[color:var(--color-ink)] rounded-full text-sm font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition">
                  Skyline · Join Free
                </Link>
              </div>
            </div>

            <div className="md:col-span-5 hidden md:block">
              {heroFeature && (
                <div className="relative">
                  <div className="absolute -top-6 -left-2 text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] font-mono z-10">
                    ✦ Relay Recommends
                  </div>
                  <div className="relative aspect-[3/4] max-h-[52vh] rounded-lg overflow-hidden bg-[color:var(--color-paper)] shadow-2xl book-cover">
                    <SafeImage src={heroFeature.image} alt={heroFeature.title} fallbackSeed={heroFeature.title} fill className="object-cover" priority sizes="(max-width: 768px) 100vw, 40vw" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                    <div className="absolute bottom-0 left-0 right-0 p-5 text-white">
                      <div className="text-[10px] uppercase tracking-widest text-white/70 mb-1 font-mono">In stock · 18 stores</div>
                      <h2 className="font-serif text-xl md:text-2xl leading-tight">{heroFeature.title}</h2>
                    </div>
                  </div>
                  <div className="absolute -bottom-5 -right-3 bg-[color:var(--color-crimson)] text-white px-4 py-2.5 rounded-md shadow-lg rotate-3">
                    <div className="text-[9px] font-mono uppercase tracking-wider opacity-80">Reserve now</div>
                    <div className="font-serif text-base leading-none">Pick up post-security</div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="mt-10 grid grid-cols-3 md:grid-cols-4 gap-3 md:gap-6">
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
      </section>

      {/* === DEPARTMENT TILES — quick access carousel === */}
      <CategoryTileRow tiles={departmentTiles} />

      {/* === RELAY RECOMMENDS — editor's picks === */}
      <ProductShelf
        kicker="Editor's picks"
        title="Relay Recommends."
        subtitle="Hand-picked by our store teams — the small joys that make every transit better."
        href="/browse?sort=featured"
        products={relayPicks.length > 3 ? relayPicks : FEATURED}
        Icon={Sparkles}
      />

      {/* === BUY 1 GET 1 FREE === */}
      {bogo.length > 0 && (
        <ProductShelf
          kicker="Weekly offers"
          title="Buy 1. Get 1 Free."
          subtitle="Grab-and-go pairs that pay for the second one. Ends Sunday midnight."
          href="/browse?offer=bogo"
          products={bogo}
          tone="offer"
          Icon={Tag}
          viewAllLabel="See all offers"
        />
      )}

      {/* === TERMINAL PICK === */}
      <TerminalPickShelf
        storeCode="RLY-BLR-04"
        storeLabel="Bangalore Terminal 2 · Gate A"
        city="Bangalore"
        picks={terminalPicks}
      />

      {/* === BESTSELLERS === */}
      <ProductShelf
        kicker="Flying off the shelves"
        title="Bestsellers this week."
        subtitle="Whether it's crisps or a bestseller — this is what other travellers grabbed today."
        href="/browse?sort=bestseller"
        products={bestsellers}
        Icon={Award}
      />

      {/* === SNACKS === */}
      <ProductShelf
        kicker="Grab & go"
        title="Snack aisle."
        subtitle="Chips, trail mix, corn puffs — the classics and the healthy pivot."
        href="/browse?cat=snacks"
        products={snacks}
        Icon={Utensils}
      />

      {/* === DRINKS === */}
      <ProductShelf
        kicker="Stay hydrated"
        title="Drinks & Refreshments."
        subtitle="Water, energy, juice, coffee, chai. Everything to reset before boarding."
        href="/browse?cat=drinks"
        products={drinks}
        Icon={Coffee}
      />

      {/* === TECH === */}
      <ProductShelf
        kicker="Powered up"
        title="Chargers, buds, powerbanks."
        subtitle="From Anker fast chargers to Sennheiser cans — everything to keep your kit alive."
        href="/browse?cat=tech"
        products={techShelf}
        Icon={Smartphone}
      />

      {/* === TRAVEL ESSENTIALS === */}
      <ProductShelf
        kicker="Boarding-ready"
        title="Travel essentials."
        subtitle="Neck pillows, TSA locks, eye masks, luggage scales — the stuff you forgot to pack."
        href="/browse?cat=travel"
        products={travelEssentials}
        Icon={Plane}
      />

      {/* === GIFTING === */}
      <ProductShelf
        kicker="Coming home?"
        title="Gifting Ideas."
        subtitle="Ferrero boxes, Mishta sweets, cashmere wraps, Gladje signature — one for everyone waiting."
        href="/browse?cat=gifts"
        products={gifting}
        Icon={Gift}
      />

      {/* === NEW ARRIVALS === */}
      <ProductShelf
        kicker="Just landed"
        title="New Arrivals."
        subtitle="Fresh drops across every shelf — books, tech, snacks, magazines."
        href="/browse?sort=new"
        products={newArrivals}
        Icon={Zap}
      />

      {/* === MAGAZINES === */}
      {magazines.length > 0 && (
        <ProductShelf
          kicker="For the flight"
          title="Magazines & Reads."
          subtitle="Vogue, Forbes, Nat Geo Traveller, GQ — pick one, we&apos;ll add a bookmark."
          href="/browse?cat=magazines"
          products={magazines}
          Icon={BookOpen}
        />
      )}

      {/* === WELLNESS === */}
      {wellness.length > 0 && (
        <ProductShelf
          kicker="Personal care"
          title="Wellness aisle."
          subtitle="Deodorant, hand cream, face wash, lip balm — travel-size when needed."
          href="/browse?cat=personal-care"
          products={wellness}
          Icon={ShoppingBag}
        />
      )}

      {/* === CROSS-BRAND (kept, redesigned) === */}
      <section className="bg-[color:var(--color-paper)] py-20 md:py-32">
        <div className="container-editorial">
          <div className="flex items-end justify-between mb-12 flex-wrap gap-4">
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
      <section className="container-editorial py-20 md:py-28">
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
            <div className="mt-8 space-y-3 max-w-md">
              {['Sign-up bonus of 250 points', 'Category multipliers up to 4× on Pashma', 'Referral bonus of 1,000 points per join', 'Volume bonus up to +50% on big orders'].map(x => (
                <div key={x} className="flex items-center gap-3 text-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-crimson)]" />
                  {x}
                </div>
              ))}
            </div>
            <Link href="/loyalty" className="mt-10 inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson-deep)] transition group">
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
      <SafeImage src={cover.image} alt={meta.name} fallbackSeed={meta.name} fill className="object-cover group-hover:scale-105 transition duration-700" sizes="(max-width: 768px) 100vw, 33vw" />
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
