import { describe, it, expect } from 'vitest';
import {
  TIERS, tierFor, nextTier, calculatePoints, pointsForBasket, REDEMPTION, CATEGORY_MULTIPLIER,
} from '@/lib/loyalty';

describe('tierFor', () => {
  it('returns Silver at the bottom of the ladder', () => {
    expect(tierFor(0).key).toBe('SILVER');
    expect(tierFor(14_999).key).toBe('SILVER');
  });

  it('promotes through Gold, Platinum, and Black at each threshold', () => {
    expect(tierFor(15_000).key).toBe('GOLD');
    expect(tierFor(39_999).key).toBe('GOLD');
    expect(tierFor(40_000).key).toBe('PLATINUM');
    expect(tierFor(99_999).key).toBe('PLATINUM');
    expect(tierFor(100_000).key).toBe('BLACK');
    expect(tierFor(1_000_000).key).toBe('BLACK');
  });
});

describe('nextTier', () => {
  it('returns the neighbour above for every tier except the top', () => {
    expect(nextTier(TIERS[0])?.key).toBe('GOLD');
    expect(nextTier(TIERS[1])?.key).toBe('PLATINUM');
    expect(nextTier(TIERS[2])?.key).toBe('BLACK');
    expect(nextTier(TIERS[3])).toBeUndefined();
  });
});

describe('calculatePoints', () => {
  const silver = TIERS[0];
  const gold = TIERS[1];
  const black = TIERS[3];

  it('applies the base rate for uncategorized purchases', () => {
    const r = calculatePoints({ amount: 1_000, tier: silver });
    // 1000/100 * 5 = 50 base, no category mult, no volume bonus.
    expect(r.base).toBe(50);
    expect(r.multiplied).toBe(50);
    expect(r.total).toBe(50);
    expect(r.volume).toBe(0);
  });

  it('multiplies by the category factor', () => {
    const r = calculatePoints({ amount: 1_000, tier: silver, category: 'tech' });
    // Base 50 * 3 (tech mult) = 150, still under first volume tier.
    expect(r.multiplied).toBe(150);
    expect(r.total).toBe(150);
  });

  it('applies the volume bonus for higher-value orders', () => {
    const r = calculatePoints({ amount: 6_000, tier: silver });
    // Base 6000/100 * 5 = 300, no cat mult, volume 1.25 → 375
    expect(r.base).toBe(300);
    expect(r.multiplied).toBe(300);
    expect(r.total).toBe(375);
    expect(r.volume).toBe(75);
  });

  it('stacks tier earn rate, category multiplier, and volume together', () => {
    const r = calculatePoints({ amount: 12_000, tier: gold, category: 'cashmere' });
    // Gold 8 pts/₹100 → 12000/100 * 8 = 960 base.
    // Cashmere 4× → 3840.
    // Volume 12000 ≥ 10000 → 1.5× → 5760.
    expect(r.base).toBe(960);
    expect(r.multiplied).toBe(3840);
    expect(r.total).toBe(5760);
  });

  it('gives Black tier its 4× base advantage over Silver', () => {
    const s = calculatePoints({ amount: 1_000, tier: TIERS[0] });
    const b = calculatePoints({ amount: 1_000, tier: black });
    expect(b.total).toBe(s.total * 4);
  });

  it('produces a human-readable breakdown when bonuses apply', () => {
    const r = calculatePoints({ amount: 6_000, tier: silver, category: 'books' });
    expect(r.breakdown.join(' | ')).toContain('pts per ₹100');
    expect(r.breakdown.some(x => x.includes('2×'))).toBe(true);
    expect(r.breakdown.some(x => x.includes('Volume'))).toBe(true);
  });
});

describe('pointsForBasket', () => {
  it('matches calculatePoints when the basket holds one category', () => {
    for (const tier of TIERS) {
      for (const [amount, category] of [[399, 'fiction'], [12999, 'cashmere'], [2499, 'tech']] as [number, string][]) {
        expect(pointsForBasket([{ amount, category }], tier)).toBe(calculatePoints({ amount, category, tier }).total);
      }
    }
  });

  it('earns each line at its own category multiplier', () => {
    const tier = TIERS[0];
    const mixed = pointsForBasket([{ amount: 1000, category: 'fiction' }, { amount: 1000, category: 'cashmere' }], tier);
    const flat = pointsForBasket([{ amount: 2000, category: 'fiction' }], tier);
    expect(mixed).toBeGreaterThan(flat);
  });

  it('applies the volume bonus to the basket total, not to each line', () => {
    const tier = TIERS[0];
    const split = pointsForBasket([{ amount: 3000, category: 'stationery' }, { amount: 3000, category: 'stationery' }], tier);
    expect(split).toBe(pointsForBasket([{ amount: 6000, category: 'stationery' }], tier));
  });

  it('rewards a higher tier for the same basket', () => {
    const lines = [{ amount: 5000, category: 'fiction' }];
    expect(pointsForBasket(lines, TIERS[3])).toBeGreaterThan(pointsForBasket(lines, TIERS[0]));
  });
});

describe('program constants', () => {
  it('has thresholds in strictly ascending order', () => {
    for (let i = 1; i < TIERS.length; i += 1) {
      expect(TIERS[i].threshold).toBeGreaterThan(TIERS[i - 1].threshold);
    }
  });

  it('has earn rates that increase with tier', () => {
    for (let i = 1; i < TIERS.length; i += 1) {
      expect(TIERS[i].earn).toBeGreaterThan(TIERS[i - 1].earn);
    }
  });

  it('caps redemption at 20% of order value with a 200-point minimum', () => {
    expect(REDEMPTION.capPerOrder).toBe(0.2);
    expect(REDEMPTION.minPoints).toBe(200);
    expect(REDEMPTION.ratio).toBe(0.5);
  });

  it('has known category multipliers wired up', () => {
    expect(CATEGORY_MULTIPLIER.tech.mult).toBe(3);
    expect(CATEGORY_MULTIPLIER.cashmere.mult).toBe(4);
    expect(CATEGORY_MULTIPLIER.books.mult).toBe(2);
  });
});
