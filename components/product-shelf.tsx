import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, ArrowUpRight, Tag, Sparkles } from 'lucide-react';
import { BookCard } from './book-card';
import type { Product } from '@/lib/products';

interface ProductShelfProps {
  kicker?: string;
  title: string;
  subtitle?: string;
  href: string;
  viewAllLabel?: string;
  products: Product[];
  /** Tone of the section — controls background and typography accents. */
  tone?: 'default' | 'offer' | 'dark';
  /** Icon shown next to the kicker. */
  Icon?: React.ElementType;
  /** Max products to show inline (view-all card links to the rest). */
  limit?: number;
}

export function ProductShelf({
  kicker,
  title,
  subtitle,
  href,
  viewAllLabel = 'View all',
  products,
  tone = 'default',
  Icon,
  limit = 10,
}: ProductShelfProps) {
  const items = products.slice(0, limit);
  const total = products.length;

  const wrap =
    tone === 'offer'
      ? 'bg-[color:var(--color-crimson-soft)]'
      : tone === 'dark'
      ? 'bg-[color:var(--color-ink)] text-white'
      : '';

  return (
    <section className={`${wrap} py-10 md:py-14`}>
      <div className="container-editorial">
        {/* Header */}
        <div className="flex items-end justify-between gap-4 mb-6 md:mb-8">
          <div className="min-w-0">
            {kicker && (
              <div className={`text-[10px] uppercase tracking-[0.3em] mb-2 flex items-center gap-2 ${tone === 'dark' ? 'text-white/60' : 'text-[color:var(--color-crimson)]'}`}>
                {Icon && <Icon className="w-3 h-3" />}
                {kicker}
              </div>
            )}
            <h2 className={`font-serif text-3xl md:text-5xl leading-[0.95] tracking-tight ${tone === 'dark' ? 'text-white' : ''}`}>
              {title}
            </h2>
            {subtitle && (
              <p className={`mt-2 text-sm md:text-base max-w-xl ${tone === 'dark' ? 'text-white/70' : 'text-[color:var(--color-ink-muted)]'}`}>
                {subtitle}
              </p>
            )}
          </div>

          <Link
            href={href}
            className={`hidden md:inline-flex items-center gap-1.5 text-sm border-b pb-0.5 transition group shrink-0 ${
              tone === 'dark'
                ? 'border-white/50 text-white hover:text-[color:var(--color-mustard)] hover:border-[color:var(--color-mustard)]'
                : 'border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)] hover:border-[color:var(--color-crimson)]'
            }`}
          >
            {viewAllLabel}
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
          </Link>
        </div>

        {/* Rail — grid on desktop, mobile-scroll on <768px */}
        <div className="mobile-scroll tight grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6 items-stretch">
          {items.map(p => (
            <div key={p.id} className="flex flex-col">
              <BookCard product={p} size="sm" showStock={false} />
            </div>
          ))}
          <ViewAllCard href={href} label={viewAllLabel} tone={tone} total={total - items.length} />
        </div>
      </div>
    </section>
  );
}

function ViewAllCard({ href, label, tone, total }: { href: string; label: string; tone: 'default' | 'offer' | 'dark'; total: number }) {
  const bg =
    tone === 'dark'
      ? 'bg-white/5 border-white/15 text-white hover:bg-white/10'
      : tone === 'offer'
      ? 'bg-white border-[color:var(--color-crimson)]/30 hover:border-[color:var(--color-crimson)]'
      : 'bg-[color:var(--color-paper)] border-[color:var(--color-line)] hover:border-[color:var(--color-ink)]';
  return (
    <Link
      href={href}
      className={`group relative flex flex-col justify-between rounded-md border ${bg} p-4 aspect-[2/3] max-h-[340px] transition`}
    >
      <div className="flex items-start justify-between">
        <div className={`text-[10px] uppercase tracking-widest ${tone === 'dark' ? 'text-white/60' : 'text-[color:var(--color-ink-muted)]'}`}>
          Explore
        </div>
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center transition group-hover:scale-110 ${
            tone === 'dark' ? 'bg-white text-[color:var(--color-ink)]' : 'bg-[color:var(--color-crimson)] text-white'
          }`}
        >
          <ArrowUpRight className="w-4 h-4" />
        </div>
      </div>
      <div>
        <div className={`font-serif text-2xl leading-tight ${tone === 'dark' ? 'text-white' : ''}`}>
          {label}
        </div>
        {total > 0 && (
          <div className={`text-xs mt-1 font-mono ${tone === 'dark' ? 'text-white/50' : 'text-[color:var(--color-ink-muted)]'}`}>
            +{total} more
          </div>
        )}
      </div>
    </Link>
  );
}

/* --- A specialised "Pick from the terminal" hero card, used inline as a
       shelf on the homepage. Kept in this file to co-locate the merchandising
       building blocks. --------------------------------------------------- */
export function TerminalPickShelf({ storeCode, storeLabel, city, picks }: {
  storeCode: string;
  storeLabel: string;
  city: string;
  picks: Product[];
}) {
  return (
    <section className="container-editorial py-10 md:py-14">
      <div className="rounded-2xl bg-[color:var(--color-ink)] text-white overflow-hidden">
        <div className="grid md:grid-cols-[1.1fr_2fr] gap-6 md:gap-10 p-6 md:p-10 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-mustard)] mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> Pick from the terminal
            </div>
            <h2 className="font-serif text-3xl md:text-5xl leading-[0.95] tracking-tight">
              Ready when you land at <span className="italic">{storeLabel}</span>.
            </h2>
            <p className="mt-4 text-sm md:text-base text-white/70 max-w-md">
              Reserve now — collect at <span className="text-white font-mono">{storeCode}</span> in {city}. Skip the queue post-security.
            </p>
            <Link
              href={`/browse?store=${storeCode}`}
              className="mt-6 inline-flex items-center gap-2 h-11 px-5 bg-white text-[color:var(--color-ink)] rounded-full text-sm font-medium hover:bg-[color:var(--color-mustard)] transition"
            >
              Shop the terminal <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="mobile-scroll tight grid grid-cols-3 gap-3 md:gap-4">
            {picks.slice(0, 5).map(p => (
              <Link key={p.id} href={`/product/${p.id}`} className="group block">
                <div className="relative aspect-[3/4] rounded-md overflow-hidden bg-white/5">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    sizes="(max-width: 768px) 42vw, 200px"
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  {p.bogo && (
                    <div className="absolute top-1.5 left-1.5 bg-[color:var(--color-crimson)] text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                      1+1
                    </div>
                  )}
                </div>
                <div className="mt-2 text-xs text-white line-clamp-1">{p.title}</div>
                <div className="text-[10px] text-white/60 font-mono">₹{p.price.toLocaleString('en-IN')}</div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* --- Category tile carousel — the "shop by department" quick-access row that
       appears just under the hero. --------------------------------------- */
export function CategoryTileRow({ tiles }: { tiles: { label: string; href: string; image: string; icon?: React.ElementType }[] }) {
  return (
    <section className="container-editorial py-6 md:py-10">
      <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-4 flex items-center gap-2">
        <Tag className="w-3 h-3" /> Shop by department
      </div>
      <div className="mobile-scroll tight grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
        {tiles.map(t => (
          <Link key={t.label} href={t.href} className="group flex flex-col items-center gap-2 text-center">
            <div className="w-full aspect-square rounded-full overflow-hidden bg-[color:var(--color-paper)] border border-[color:var(--color-line)] relative group-hover:border-[color:var(--color-crimson)] transition">
              <Image src={t.image} alt={t.label} fill sizes="100px" className="object-cover group-hover:scale-105 transition" />
            </div>
            <div className="text-xs md:text-sm font-medium">{t.label}</div>
          </Link>
        ))}
      </div>
    </section>
  );
}
