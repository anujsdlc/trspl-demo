import { describe, it, expect } from 'vitest';
import { inr, pct, pluralize, truncate, relativeTime, cn } from '@/lib/utils';

describe('inr', () => {
  it('formats amounts with Indian grouping and rupee symbol', () => {
    expect(inr(0)).toBe('₹0');
    expect(inr(500)).toBe('₹500');
    expect(inr(1234)).toBe('₹1,234');
    expect(inr(123456)).toBe('₹1,23,456');
    expect(inr(1000000)).toBe('₹10,00,000');
  });

  it('drops fractional paise', () => {
    expect(inr(999.99)).toBe('₹1,000');
    expect(inr(499.4)).toBe('₹499');
  });
});

describe('pct', () => {
  it('rounds and appends the % suffix', () => {
    expect(pct(0)).toBe('0%');
    expect(pct(12.3)).toBe('12%');
    expect(pct(12.6)).toBe('13%');
    expect(pct(100)).toBe('100%');
  });
});

describe('pluralize', () => {
  it('uses the singular form for exactly 1', () => {
    expect(pluralize(1, 'item', 'items')).toBe('1 item');
  });

  it('uses the plural form for 0 and >1', () => {
    expect(pluralize(0, 'item', 'items')).toBe('0 items');
    expect(pluralize(2, 'book', 'books')).toBe('2 books');
    expect(pluralize(15000, 'point', 'points')).toBe('15,000 points');
  });
});

describe('truncate', () => {
  it('leaves short strings alone', () => {
    expect(truncate('hi', 10)).toBe('hi');
    expect(truncate('exactly-10', 10)).toBe('exactly-10');
  });

  it('appends an ellipsis when clipping', () => {
    expect(truncate('this is a long title', 10)).toBe('this is a…');
  });
});

describe('relativeTime', () => {
  it('formats seconds, minutes, hours, and days', () => {
    expect(relativeTime(5_000)).toBe('5s ago');
    expect(relativeTime(90_000)).toBe('1m ago');
    expect(relativeTime(60 * 60 * 1000)).toBe('1h ago');
    expect(relativeTime(3 * 24 * 60 * 60 * 1000)).toBe('3d ago');
  });
});

describe('cn', () => {
  it('merges class names and deduplicates conflicting tailwind classes', () => {
    expect(cn('p-2', 'p-4')).toBe('p-4');
    expect(cn('text-red-500', false && 'text-blue-500', 'font-bold')).toBe('text-red-500 font-bold');
  });
});
