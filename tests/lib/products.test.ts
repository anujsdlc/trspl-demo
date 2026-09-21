import { describe, it, expect } from 'vitest';
import {
  ALL_PRODUCTS, PRODUCTS_BY_CATEGORY, PRODUCTS_BY_BRAND, FEATURED,
  getProduct, stockFor, totalStock,
} from '@/lib/products';

describe('product catalog', () => {
  it('loads a non-empty catalog', () => {
    expect(ALL_PRODUCTS.length).toBeGreaterThan(100);
  });

  it('has unique ids and skus across the catalog', () => {
    const ids = new Set(ALL_PRODUCTS.map(p => p.id));
    const skus = new Set(ALL_PRODUCTS.map(p => p.sku));
    expect(ids.size).toBe(ALL_PRODUCTS.length);
    expect(skus.size).toBe(ALL_PRODUCTS.length);
  });

  it('every product has a positive price', () => {
    for (const p of ALL_PRODUCTS) {
      expect(p.price).toBeGreaterThan(0);
    }
  });

  it('categorised map partitions the catalog', () => {
    const partitioned = Object.values(PRODUCTS_BY_CATEGORY).reduce((s, arr) => s + arr.length, 0);
    expect(partitioned).toBe(ALL_PRODUCTS.length);
  });

  it('brand-indexed map partitions the catalog', () => {
    const partitioned = Object.values(PRODUCTS_BY_BRAND).reduce((s, arr) => s + arr.length, 0);
    expect(partitioned).toBe(ALL_PRODUCTS.length);
  });

  it('FEATURED contains only products flagged featured=true', () => {
    expect(FEATURED.length).toBeGreaterThan(0);
    for (const p of FEATURED) expect(p.featured).toBe(true);
  });
});

describe('getProduct', () => {
  it('returns a product for a real id', () => {
    const first = ALL_PRODUCTS[0];
    expect(getProduct(first.id)?.sku).toBe(first.sku);
  });

  it('returns undefined for an unknown id', () => {
    expect(getProduct('nope-does-not-exist')).toBeUndefined();
  });
});

describe('stockFor', () => {
  it('is deterministic — same inputs give same output', () => {
    const a = stockFor('bk-123', 'RLY-BLR-04');
    const b = stockFor('bk-123', 'RLY-BLR-04');
    expect(a).toBe(b);
  });

  it('varies across products and stores', () => {
    const a = stockFor('bk-123', 'RLY-BLR-04');
    const b = stockFor('bk-999', 'RLY-BLR-04');
    const c = stockFor('bk-123', 'RLY-DEL-01');
    // Not strictly guaranteed, but with the deterministic seed at least one
    // pair must differ across 3 samples for a healthy distribution.
    expect([a === b, a === c].every(Boolean)).toBe(false);
  });

  it('returns non-negative integers', () => {
    for (let i = 0; i < 50; i += 1) {
      const s = stockFor(`p-${i}`, `store-${i}`);
      expect(s).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(s)).toBe(true);
    }
  });
});

describe('totalStock', () => {
  it('sums stockFor across the given store ids', () => {
    const stores = ['s-1', 's-2', 's-3'];
    const expected = stores.reduce((sum, s) => sum + stockFor('bk-1', s), 0);
    expect(totalStock('bk-1', stores)).toBe(expected);
  });

  it('returns 0 for an empty store list', () => {
    expect(totalStock('bk-1', [])).toBe(0);
  });
});
