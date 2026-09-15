'use client';

import { useState, useMemo } from 'react';
import { calculatePoints, TIERS, CATEGORY_MULTIPLIER } from '@/lib/loyalty';
import { inr } from '@/lib/utils';

export function PointsCalculator() {
  const [amount, setAmount] = useState(3500);
  const [category, setCategory] = useState('books');
  const [tierIdx, setTierIdx] = useState(2);
  const tier = TIERS[tierIdx];

  const result = useMemo(() => calculatePoints({ amount, category, tier }), [amount, category, tier]);
  const rupeeValue = Math.floor(result.total * 0.5);

  return (
    <div className="rounded-2xl border border-[color:var(--color-line)] bg-white p-6 md:p-8">
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-baseline mb-2">
            <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Order amount</label>
            <span className="editorial-num text-2xl">{inr(amount)}</span>
          </div>
          <input type="range" min={100} max={30000} step={100} value={amount} onChange={e => setAmount(Number(e.target.value))} className="w-full accent-[color:var(--color-crimson)]" />
          <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-ink-muted)] mt-1">
            <span>₹100</span><span>₹30,000</span>
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2 block">Category</label>
          <div className="flex flex-wrap gap-2">
            {Object.entries(CATEGORY_MULTIPLIER).map(([k, v]) => (
              <button
                key={k}
                onClick={() => setCategory(k)}
                className={`text-xs px-3 py-1.5 rounded-full border transition ${category === k ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)] border-[color:var(--color-ink)]' : 'border-[color:var(--color-line)] hover:border-[color:var(--color-ink)]'}`}
              >
                {k} · {v.mult}×
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2 block">Membership tier</label>
          <div className="grid grid-cols-4 gap-2">
            {TIERS.map((t, i) => (
              <button
                key={t.key}
                onClick={() => setTierIdx(i)}
                className={`text-xs py-2 rounded-md border transition ${tierIdx === i ? 'bg-[color:var(--color-crimson)] text-white border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)] hover:border-[color:var(--color-ink)]'}`}
              >
                {t.name.split(' ')[1]}
              </button>
            ))}
          </div>
        </div>

        {/* Result */}
        <div className="pt-6 border-t border-[color:var(--color-line)]">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">You will earn</div>
          <div className="flex items-baseline gap-3">
            <span className="editorial-num text-6xl md:text-7xl text-[color:var(--color-crimson)]">{result.total.toLocaleString('en-IN')}</span>
            <span className="text-sm text-[color:var(--color-ink-muted)]">points</span>
          </div>
          <div className="mt-1 text-sm text-[color:var(--color-ink-muted)]">
            = <span className="font-mono text-[color:var(--color-ink)]">{inr(rupeeValue)}</span> off your next order
          </div>
          <div className="mt-6 space-y-1.5">
            {result.breakdown.map((b, i) => (
              <div key={i} className="flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)]">
                <div className="w-1 h-1 rounded-full bg-[color:var(--color-crimson)]" />
                {b}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
