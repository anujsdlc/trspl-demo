'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
  Search, Heart, ShoppingBag, User, MapPin, Menu, X, Plane, Home,
  LayoutGrid, Award,
} from 'lucide-react';
import { useFavourites } from './favourites';
import { useBag } from './bag-provider';
import { BagDrawer } from './bag-drawer';
import { RelayLogo } from './relay-logo';
import { SearchOverlay } from './search-overlay';

/* =========================================================================
   Top nav — red brand header. All rows share the Relay red background so the
   brand carries over the entire top slab. Content is white with subtle
   transparency for muted labels.
   ========================================================================= */
export function StoreNav() {
  const { count } = useFavourites();
  const { count: bagCount } = useBag();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [bagOpen, setBagOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(v => !v); }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault(); setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Announcement ticker */}
      <div className="bg-[color:var(--color-crimson-deep)] text-white/90 text-[11px] uppercase tracking-[0.2em] overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-2">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex gap-12 pr-12 shrink-0">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-white rounded-full pulse-dot" />Live · Inventory synced across 51 stores</span>
              <span>· Free delivery over ₹599 ·</span>
              <span>· Join Skyline Silver, get 250 points instant ·</span>
              <span>· Reserve online, pick up at boarding ·</span>
              <span>· Same-day dispatch from nearest store ·</span>
              <span>· Buy 1 Get 1 free on select snacks ·</span>
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[color:var(--color-crimson)] text-white shadow-[0_1px_0_rgba(255,255,255,0.12)]">
        {/* Row 1: Logo · Search · Utility */}
        <div className="border-b border-white/10">
          <div className="container-editorial flex items-center gap-6 h-16 md:h-18">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <RelayLogo className="h-9 md:h-11 w-auto" />
              <div className="hidden md:block leading-tight border-l border-white/25 pl-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 font-medium">by Travel Retail</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-white/70 -mt-0.5">Services · India</div>
              </div>
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-xl items-center gap-3 h-11 px-5 bg-white/12 hover:bg-white/20 rounded-full border border-white/20 text-sm text-white/80 transition backdrop-blur-sm"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search snacks, drinks, tech, books, gifts…</span>
              <span className="text-[10px] font-mono border border-white/40 rounded px-1.5 py-0.5">⌘K</span>
            </button>

            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <button className="hidden lg:flex items-center gap-2 px-3 h-10 text-xs bg-white/12 hover:bg-white/20 rounded-full transition border border-white/15">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-white/70">Deliver to</span>
                <span className="font-medium">560300 · BLR</span>
              </button>
              <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 hover:bg-white/15 rounded-full transition text-white" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
              <Link href="/favourites" className="relative w-10 h-10 flex items-center justify-center hover:bg-white/15 rounded-full transition text-white" aria-label="Favourites">
                <Heart className="w-5 h-5" strokeWidth={2} />
                {count > 0 && (
                  <span className="absolute top-0 right-0 min-w-[18px] h-[18px] px-1 bg-white text-[color:var(--color-crimson)] text-[10px] rounded-full flex items-center justify-center font-bold heart-pop leading-none">{count}</span>
                )}
              </Link>
              <Link href="/admin" className="hidden md:flex items-center gap-2 px-3 h-10 text-xs rounded-full border border-white/40 hover:bg-white hover:text-[color:var(--color-crimson)] transition">
                <User className="w-3.5 h-3.5" />
                Admin
              </Link>
              <button
                onClick={() => setBagOpen(true)}
                className="relative w-10 h-10 flex items-center justify-center bg-white text-[color:var(--color-crimson)] rounded-full hover:bg-[color:var(--color-cream)] transition"
                aria-label="Bag"
              >
                <ShoppingBag className="w-5 h-5" strokeWidth={2} />
                {bagCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[color:var(--color-ink)] text-white text-[10px] rounded-full flex items-center justify-center font-bold leading-none">
                    {bagCount}
                  </span>
                )}
              </button>
              <button className="lg:hidden p-2 text-white" onClick={() => setOpen(!open)} aria-label="Menu">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Categories */}
        <div className="container-editorial h-11 hidden lg:flex items-center justify-between">
          <nav className="flex items-center gap-6 text-[13px] tracking-tight">
            {[
              { href: '/browse?cat=snacks', label: 'Snacks' },
              { href: '/browse?cat=drinks', label: 'Drinks' },
              { href: '/browse?cat=tech', label: 'Tech' },
              { href: '/browse?cat=travel', label: 'Travel' },
              { href: '/browse', label: 'Books', bold: true },
              { href: '/browse?cat=gifts', label: 'Gifts' },
              { href: '/browse?cat=personal-care', label: 'Wellness' },
            ].map(l => (
              <Link key={l.label} href={l.href} className={`text-white/90 hover:text-white hover:underline underline-offset-4 transition ${l.bold ? 'font-medium' : ''}`}>{l.label}</Link>
            ))}
            <span className="text-white/40">·</span>
            {[
              { href: '/browse?brand=CB', label: 'Choco Bay' },
              { href: '/browse?brand=MTC', label: 'Motech' },
              { href: '/browse?brand=PSH', label: 'Pashma' },
            ].map(l => (
              <Link key={l.label} href={l.href} className="text-white/85 hover:text-white hover:underline underline-offset-4 transition">{l.label}</Link>
            ))}
            <span className="text-white/40">·</span>
            <Link href="/loyalty" className="text-white/95 hover:text-white transition font-medium inline-flex items-center gap-1.5">
              Skyline
              <span className="text-[9px] px-1.5 py-0.5 bg-white text-[color:var(--color-crimson)] rounded-full uppercase tracking-wider font-bold">Join</span>
            </Link>
          </nav>
          <div className="text-[10px] uppercase tracking-widest text-white/75 font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-white rounded-full pulse-dot" />
            Live inventory · 51 stores synced
          </div>
        </div>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

        {/* Mobile sheet menu */}
        {open && (
          <div className="lg:hidden border-t border-white/15 bg-[color:var(--color-crimson-deep)]">
            <nav className="container-editorial py-6 flex flex-col gap-4 text-lg font-serif text-white">
              <Link href="/browse?cat=snacks" onClick={() => setOpen(false)}>Snacks &amp; Drinks</Link>
              <Link href="/browse?cat=tech" onClick={() => setOpen(false)}>Tech accessories</Link>
              <Link href="/browse?cat=travel" onClick={() => setOpen(false)}>Travel essentials</Link>
              <Link href="/browse" onClick={() => setOpen(false)}>Books &amp; Magazines</Link>
              <Link href="/browse?cat=gifts" onClick={() => setOpen(false)}>Gifts &amp; Souvenirs</Link>
              <Link href="/browse?cat=personal-care" onClick={() => setOpen(false)}>Wellness</Link>
              <Link href="/browse?brand=CB" onClick={() => setOpen(false)}>Choco Bay chocolates</Link>
              <Link href="/browse?brand=PSH" onClick={() => setOpen(false)}>Pashma cashmere</Link>
              <Link href="/loyalty" onClick={() => setOpen(false)}>Skyline Loyalty</Link>
              <Link href="/admin" onClick={() => setOpen(false)}>Admin Console</Link>
            </nav>
          </div>
        )}
      </header>

      {/* Persistent bottom nav for mobile — always visible on <md viewports */}
      <MobileBottomNav bagCount={bagCount} onOpenBag={() => setBagOpen(true)} />

      {/* Bag drawer */}
      <BagDrawer open={bagOpen} onClose={() => setBagOpen(false)} />
    </>
  );
}

/* =========================================================================
   Mobile bottom nav — Amazon/Zomato-style persistent bar on mobile.
   ========================================================================= */
function MobileBottomNav({ bagCount, onOpenBag }: { bagCount: number; onOpenBag: () => void }) {
  const path = usePathname();
  const { count } = useFavourites();
  const items: {
    label: string; icon: React.ElementType;
    match: (p: string) => boolean;
    href?: string; onClick?: () => void; badge?: number;
  }[] = [
    { href: '/',            label: 'Home',       icon: Home,        match: (p: string) => p === '/' },
    { href: '/browse',      label: 'Shop',       icon: LayoutGrid,  match: (p: string) => p.startsWith('/browse') || p.startsWith('/product') },
    {                       label: 'Bag',        icon: ShoppingBag, match: () => false, onClick: onOpenBag, badge: bagCount },
    { href: '/favourites',  label: 'Saved',      icon: Heart,       match: (p: string) => p.startsWith('/favourites'), badge: count },
    { href: '/admin/login', label: 'Account',    icon: User,        match: (p: string) => p.startsWith('/admin') },
  ];
  return (
    <>
      <nav
        className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-lg border-t border-[color:var(--color-line)] shadow-[0_-1px_2px_rgba(0,0,0,0.04),0_-10px_30px_rgba(0,0,0,0.06)]"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0)' }}
        aria-label="Primary"
      >
        <ul className="grid grid-cols-5 h-16">
          {items.map(item => {
            const active = item.match(path);
            const Icon = item.icon;
            const inner = (
              <div className={`h-full w-full flex flex-col items-center justify-center gap-1 relative ${
                active ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'
              }`}>
                <div className="relative w-6 h-6 flex items-center justify-center">
                  <Icon
                    className="w-5 h-5"
                    strokeWidth={active ? 2.4 : 2}
                    fill={item.label === 'Saved' && item.badge && item.badge > 0 ? 'currentColor' : 'none'}
                  />
                  {item.badge && item.badge > 0 && (
                    <span className="absolute -top-1 -right-2 min-w-[16px] h-[16px] px-1 bg-[color:var(--color-crimson)] text-white text-[9px] rounded-full flex items-center justify-center font-bold leading-none">
                      {item.badge}
                    </span>
                  )}
                </div>
                <span className={`text-[10px] uppercase tracking-wider ${active ? 'font-semibold' : ''}`}>{item.label}</span>
                {active && (
                  <span className="absolute top-0 inset-x-4 h-0.5 bg-[color:var(--color-crimson)] rounded-full" />
                )}
              </div>
            );
            return (
              <li key={item.label}>
                {item.href ? (
                  <Link href={item.href} className="h-full block">{inner}</Link>
                ) : (
                  <button onClick={item.onClick} className="h-full w-full">{inner}</button>
                )}
              </li>
            );
          })}
        </ul>
      </nav>
      {/* spacer so page content isn't hidden under the fixed bar */}
      <div className="md:hidden h-16" aria-hidden />
    </>
  );
}

/* =========================================================================
   Footer — red brand block.
   ========================================================================= */
export function StoreFooter() {
  return (
    <footer className="bg-[color:var(--color-crimson)] text-white mt-24 md:mt-32">
      <div className="container-editorial py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-2">
            <div className="mb-6">
              <RelayLogo className="h-12 w-auto" />
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/70 mt-2">by Travel Retail Services</div>
            </div>
            <p className="font-serif text-3xl md:text-4xl leading-tight max-w-md text-balance">
              A convenience store for people who are always <span className="italic text-white/85 underline decoration-white/40 underline-offset-4">between gates</span>.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-white/85 font-mono">
              <Plane className="w-3.5 h-3.5" />
              51 stores · 12 cities · one loyalty card
            </div>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/60 mb-4">Shop</div>
            <ul className="space-y-2.5 text-white/90">
              <li>Snacks &amp; Drinks</li><li>Tech accessories</li><li>Travel essentials</li><li>Books &amp; Magazines</li><li>Gifts</li><li>Wellness</li>
            </ul>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/60 mb-4">Skyline</div>
            <ul className="space-y-2.5 text-white/90">
              <li>How it works</li><li>Tiers &amp; benefits</li><li>Redeem points</li><li>Refer a friend</li><li>Airport perks</li>
            </ul>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/60 mb-4">Company</div>
            <ul className="space-y-2.5 text-white/90">
              <li>About TRS</li><li>Careers</li><li>Airports we serve</li><li>Press</li><li>Contact</li>
            </ul>
          </div>
        </div>
        <div className="mt-12 pt-6 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-[10px] uppercase tracking-widest text-white/60">
          <div>© Travel Retail Services Private Limited · India</div>
          <div>Travel · Read · Refresh</div>
        </div>
      </div>
    </footer>
  );
}
