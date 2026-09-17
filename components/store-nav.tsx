'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { Search, Heart, ShoppingBag, User, MapPin, Menu, X, Plane } from 'lucide-react';
import { useFavourites } from './favourites';
import { RelayLogo } from './relay-logo';
import { SearchOverlay } from './search-overlay';

export function StoreNav() {
  const { count } = useFavourites();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setSearchOpen(v => !v);
      }
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT' && document.activeElement?.tagName !== 'TEXTAREA') {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      {/* Announcement ticker */}
      <div className="bg-[color:var(--color-ink)] text-[color:var(--color-cream)] text-[11px] uppercase tracking-[0.2em] overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-2">
          {Array(2).fill(0).map((_, i) => (
            <div key={i} className="flex gap-12 pr-12 shrink-0">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-[color:var(--color-mustard)] rounded-full pulse-dot" />Live · Inventory synced across 51 stores</span>
              <span>· Free delivery over ₹599 ·</span>
              <span>· Join Skyline Silver, get 250 points instant ·</span>
              <span>· Reserve online, pick up at boarding ·</span>
              <span>· Same-day dispatch from nearest store ·</span>
              <span>· English · हिन्दी · मराठी coming soon ·</span>
            </div>
          ))}
        </div>
      </div>

      <header className="sticky top-0 z-40 bg-[color:var(--color-cream)]/90 backdrop-blur-xl border-b border-[color:var(--color-line)]">
        {/* Row 1: Logo · Search · Utility */}
        <div className="border-b border-[color:var(--color-line)]/70">
          <div className="container-editorial flex items-center gap-6 h-16 md:h-18">
            <Link href="/" className="flex items-center gap-3 shrink-0">
              <RelayLogo className="h-9 md:h-11 w-auto" />
              <div className="hidden md:block leading-tight border-l border-[color:var(--color-line-strong)] pl-3">
                <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)] font-medium">by Travel Retail</div>
                <div className="text-[10px] uppercase tracking-[0.2em] text-[color:var(--color-ink-muted)] -mt-0.5">Services · India</div>
              </div>
            </Link>

            <button
              onClick={() => setSearchOpen(true)}
              className="hidden md:flex flex-1 max-w-xl items-center gap-3 h-11 px-5 bg-white hover:bg-[color:var(--color-paper)] rounded-full border border-[color:var(--color-line)] text-sm text-[color:var(--color-ink-muted)] transition"
              aria-label="Search"
            >
              <Search className="w-4 h-4" />
              <span className="flex-1 text-left">Search snacks, drinks, tech, books, gifts…</span>
              <span className="text-[10px] font-mono border border-[color:var(--color-line-strong)] rounded px-1.5 py-0.5">⌘K</span>
            </button>

            <div className="ml-auto flex items-center gap-2 md:gap-3">
              <button className="hidden lg:flex items-center gap-2 px-3 h-10 text-xs bg-[color:var(--color-paper)] hover:bg-[color:var(--color-paper-warm)] rounded-full transition border border-[color:var(--color-line)]">
                <MapPin className="w-3.5 h-3.5" />
                <span className="text-[color:var(--color-ink-muted)]">Deliver to</span>
                <span className="font-medium">560300 · BLR</span>
              </button>
              <button onClick={() => setSearchOpen(true)} className="md:hidden p-2 hover:bg-[color:var(--color-paper)] rounded-full transition" aria-label="Search">
                <Search className="w-5 h-5" />
              </button>
              <Link href="/favourites" className="p-2.5 hover:bg-[color:var(--color-paper)] rounded-full transition relative" aria-label="Favourites">
                <Heart className="w-5 h-5" />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-[color:var(--color-crimson)] text-white text-[10px] rounded-full flex items-center justify-center font-bold heart-pop">{count}</span>
                )}
              </Link>
              <Link href="/admin" className="hidden md:flex items-center gap-2 px-3 h-10 text-xs rounded-full border border-[color:var(--color-ink)] hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-cream)] transition">
                <User className="w-3.5 h-3.5" />
                Admin
              </Link>
              <button className="relative p-2.5 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full hover:bg-[color:var(--color-crimson)] transition" aria-label="Bag">
                <ShoppingBag className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] text-[10px] rounded-full flex items-center justify-center font-bold">0</span>
              </button>
              <button className="lg:hidden p-2" onClick={() => setOpen(!open)} aria-label="Menu">
                {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: Categories */}
        <div className="container-editorial h-11 hidden lg:flex items-center justify-between">
          <nav className="flex items-center gap-6 text-[13px] tracking-tight">
            <Link href="/browse?cat=snacks" className="hover:text-[color:var(--color-crimson)] transition">Snacks</Link>
            <Link href="/browse?cat=drinks" className="hover:text-[color:var(--color-crimson)] transition">Drinks</Link>
            <Link href="/browse?cat=tech" className="hover:text-[color:var(--color-crimson)] transition">Tech</Link>
            <Link href="/browse?cat=travel" className="hover:text-[color:var(--color-crimson)] transition">Travel</Link>
            <Link href="/browse" className="hover:text-[color:var(--color-crimson)] transition font-medium">Books</Link>
            <Link href="/browse?cat=gifts" className="hover:text-[color:var(--color-crimson)] transition">Gifts</Link>
            <Link href="/browse?cat=personal-care" className="hover:text-[color:var(--color-crimson)] transition">Wellness</Link>
            <span className="text-[color:var(--color-line-strong)]">·</span>
            <Link href="/browse?brand=CB" className="hover:text-[color:var(--color-crimson)] transition">Choco Bay</Link>
            <Link href="/browse?brand=MTC" className="hover:text-[color:var(--color-crimson)] transition">Motech</Link>
            <Link href="/browse?brand=PSH" className="hover:text-[color:var(--color-crimson)] transition">Pashma</Link>
            <span className="text-[color:var(--color-line-strong)]">·</span>
            <Link href="/loyalty" className="hover:text-[color:var(--color-crimson)] transition font-medium inline-flex items-center gap-1.5">
              Skyline
              <span className="text-[9px] px-1.5 py-0.5 bg-[color:var(--color-crimson)] text-white rounded-full uppercase tracking-wider font-bold">Join</span>
            </Link>
          </nav>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] font-mono flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full pulse-dot" />
            Live inventory · 51 stores synced
          </div>
        </div>

        <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />

        {open && (
          <div className="lg:hidden border-t border-[color:var(--color-line)] bg-[color:var(--color-cream)]">
            <nav className="container-editorial py-6 flex flex-col gap-4 text-lg font-serif">
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
    </>
  );
}

export function StoreFooter() {
  return (
    <footer className="bg-[color:var(--color-ink)] text-[color:var(--color-cream)] mt-32">
      <div className="container-editorial py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10">
          <div className="col-span-2 md:col-span-2">
            <div className="mb-6">
              <RelayLogo className="h-12 w-auto" />
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-2">by Travel Retail Services</div>
            </div>
            <p className="font-serif text-3xl md:text-4xl leading-tight max-w-md text-balance">
              A convenience store for people who are always <span className="italic text-[color:var(--color-crimson)]">between gates</span>.
            </p>
            <div className="mt-8 flex items-center gap-3 text-xs text-white/60 font-mono">
              <Plane className="w-3.5 h-3.5" />
              51 stores · 12 cities · one loyalty card
            </div>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Shop</div>
            <ul className="space-y-2.5">
              <li>Snacks &amp; Drinks</li><li>Tech accessories</li><li>Travel essentials</li><li>Books &amp; Magazines</li><li>Gifts</li><li>Wellness</li>
            </ul>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Skyline</div>
            <ul className="space-y-2.5">
              <li>How it works</li><li>Tiers &amp; benefits</li><li>Redeem points</li><li>Refer a friend</li><li>Airport perks</li>
            </ul>
          </div>
          <div className="text-xs">
            <div className="text-[10px] uppercase tracking-widest text-white/40 mb-4">Help</div>
            <ul className="space-y-2.5">
              <li>Track order</li><li>Store locator</li><li>Return policy</li><li>Grievance officer</li><li>Contact us</li>
            </ul>
          </div>
        </div>

        <div className="mt-16 pt-8 border-t border-white/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-[11px] text-white/40 font-mono">
          <div>© 2026 Travel Retail Services Pvt. Ltd. · CIN: U52100DL2018PTC334211 · FSSAI: 10012011000123</div>
          <div className="flex gap-6">
            <span>Privacy</span><span>Terms</span><span>Refund policy</span><span>DPDP</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
