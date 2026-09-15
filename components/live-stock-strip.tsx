'use client';

import { useEffect, useState } from 'react';
import { BOOK_STORES } from '@/lib/stores';
import { MapPin, Zap } from 'lucide-react';

const EVENTS = [
  (s: string) => ({ type: 'reserved', text: `1× "Atomic Habits" reserved`,        store: s }),
  (s: string) => ({ type: 'sold',     text: `2× "Ikigai" sold at counter`,        store: s }),
  (s: string) => ({ type: 'sync',     text: `stock synced · 47 SKUs updated`,     store: s }),
  (s: string) => ({ type: 'lowstock', text: `low-stock alert · Ferrero Rocher T24`, store: s }),
  (s: string) => ({ type: 'reserved', text: `1× "One Piece Vol 105" reserved`,   store: s }),
  (s: string) => ({ type: 'sold',     text: `3× Milka Whole Hazelnut sold`,       store: s }),
  (s: string) => ({ type: 'transfer', text: `stock transfer received · 12 units`, store: s }),
  (s: string) => ({ type: 'sync',     text: `end-of-day count reconciled`,        store: s }),
];

const TYPE_COLOR: Record<string, string> = {
  reserved:  'bg-[color:var(--color-mustard)]',
  sold:      'bg-[color:var(--color-success)]',
  sync:      'bg-[color:var(--color-cobalt)]',
  lowstock:  'bg-[color:var(--color-warning)]',
  transfer:  'bg-[color:var(--color-mint)]',
};

interface Event { id: number; type: string; text: string; store: string; time: number; }

export function LiveStockStrip() {
  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    // Seed
    const seed: Event[] = [];
    for (let i = 0; i < 6; i++) {
      const s = BOOK_STORES[Math.floor(Math.random() * BOOK_STORES.length)];
      const ev = EVENTS[i % EVENTS.length](s.code);
      seed.push({ id: Date.now() + i, ...ev, time: Date.now() - (i * 3500) });
    }
    setEvents(seed);

    const interval = setInterval(() => {
      const s = BOOK_STORES[Math.floor(Math.random() * BOOK_STORES.length)];
      const ev = EVENTS[Math.floor(Math.random() * EVENTS.length)](s.code);
      setEvents(prev => [{ id: Date.now(), ...ev, time: Date.now() }, ...prev.slice(0, 5)]);
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="bg-[color:var(--color-paper)] border-y border-[color:var(--color-line)] py-10 relative overflow-hidden">
      <div className="container-editorial">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-6">
          <Zap className="w-3 h-3 text-[color:var(--color-crimson)]" />
          <span>Live stock activity — across 51 stores</span>
          <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full pulse-dot" />
        </div>
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-3">
          {events.map((e, i) => (
            <div
              key={e.id}
              className="flex items-center gap-4 py-3 border-b border-[color:var(--color-line)] last:border-0 group"
              style={{ opacity: 1 - (i * 0.08) }}
            >
              <div className={`w-2 h-2 rounded-full ${TYPE_COLOR[e.type] || 'bg-gray-400'} ${i === 0 ? 'pulse-dot' : ''}`} />
              <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)] uppercase tracking-wider w-16">
                {e.type}
              </div>
              <div className="text-sm flex-1 truncate">{e.text}</div>
              <div className="text-[11px] font-mono text-[color:var(--color-ink-muted)] flex items-center gap-1 shrink-0">
                <MapPin className="w-3 h-3" />
                {e.store}
              </div>
              <div className="text-[10px] font-mono text-[color:var(--color-ink-faint)] w-14 text-right shrink-0">
                {i === 0 ? 'now' : `${Math.max(1, Math.floor((Date.now() - e.time) / 1000))}s ago`}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
