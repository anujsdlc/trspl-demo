import type { Category } from './products';

export const GST_RATE_BY_CATEGORY: Record<Category, number> = {
  books: 0,
  fiction: 0,
  'non-fiction': 0,
  children: 0,
  manga: 0,
  magazines: 0,

  confectionery: 18,
  sweets: 5,
  snacks: 12,
  drinks: 12,
  'personal-care': 18,
  tech: 18,
  stationery: 12,
  toys: 12,
  travel: 18,
  gifts: 18,
  cashmere: 12,
};

export function gstRateFor(category: Category): number {
  return GST_RATE_BY_CATEGORY[category] ?? 18;
}

export function extractTax(inclusive: number, rate: number): { taxable: number; tax: number } {
  const taxable = Math.round((inclusive / (1 + rate / 100)) * 100) / 100;
  return { taxable, tax: Math.round((inclusive - taxable) * 100) / 100 };
}
