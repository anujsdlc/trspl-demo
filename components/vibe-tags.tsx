import Link from 'next/link';

const VIBES = [
  { label: 'for the 6am flight', href: '/browse?cat=non-fiction', bg: 'var(--color-mustard)', ink: 'var(--color-ink)' },
  { label: 'for the layover', href: '/browse?cat=fiction', bg: 'var(--color-coral)', ink: '#fff' },
  { label: 'for the crying-baby row', href: '/browse?cat=tech', bg: 'var(--color-ink)', ink: 'var(--color-cream)' },
  { label: 'for the window seat', href: '/browse?cat=manga', bg: 'var(--color-mint)', ink: 'var(--color-ink)' },
  { label: 'for the return trip', href: '/browse?cat=confectionery', bg: 'var(--color-crimson)', ink: '#fff' },
  { label: 'for the guilty pleasure', href: '/browse?cat=fiction', bg: 'var(--color-cobalt)', ink: '#fff' },
  { label: 'for the girlfriend back home', href: '/browse?cat=cashmere', bg: '#B02936', ink: '#fff' },
  { label: 'read in one flight', href: '/browse?cat=fiction', bg: 'var(--color-lime)', ink: 'var(--color-ink)' },
];

export function VibeTags() {
  return (
    <section className="py-16 md:py-24 border-y border-[color:var(--color-line)] bg-[color:var(--color-cream)] overflow-hidden">
      <div className="container-editorial mb-8">
        <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">Shop by mood</div>
        <h2 className="font-serif text-4xl md:text-6xl leading-none tracking-tighter">
          What kind of <span className="italic">journey</span> are you having?
        </h2>
      </div>
      <div className="flex flex-wrap gap-3 px-6 md:px-12 max-w-[1400px] mx-auto">
        {VIBES.map((v, i) => (
          <Link
            key={v.label}
            href={v.href}
            style={{ background: v.bg, color: v.ink, transform: `rotate(${(i % 2 === 0 ? -1 : 1) * (Math.random() * 0.8 + 0.4)}deg)` }}
            className="inline-flex items-center gap-2 h-11 md:h-12 px-5 md:px-6 rounded-full font-serif text-lg md:text-xl italic hover:scale-105 transition-transform"
          >
            {v.label}
          </Link>
        ))}
      </div>
    </section>
  );
}
