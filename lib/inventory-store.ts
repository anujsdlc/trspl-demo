import type { Product, Category } from './products';
import type { StoreBrand } from './stores';
import { UPLOADED_PRODUCTS_KEY } from './catalog';

function isBrowser() { return typeof window !== 'undefined'; }

async function fetchUploaded(): Promise<Product[]> {
  if (!isBrowser()) return [];
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(UPLOADED_PRODUCTS_KEY)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.rows) ? (data.rows as Product[]) : [];
  } catch { return []; }
}

async function writeUploaded(rows: Product[]): Promise<void> {
  if (!isBrowser()) throw new Error('Products can only be uploaded from the browser.');
  const res = await fetch(`/api/erp/${encodeURIComponent(UPLOADED_PRODUCTS_KEY)}`, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Upload store returned ${res.status}.`);
  }
}

export async function loadUploadedProducts(): Promise<Product[]> {
  return fetchUploaded();
}

export async function addUploadedProducts(products: Product[]): Promise<void> {
  const existing = await fetchUploaded();
  const existingSkus = new Set(existing.map(p => p.sku));
  const fresh = products.filter(p => !existingSkus.has(p.sku));
  await writeUploaded([...fresh, ...existing]);
}

export async function clearUploadedProducts(): Promise<void> {
  await writeUploaded([]);
}

const PRICE_KEY = 'trs.inventory.prices.v1';

function readLocal<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function writeLocal<T>(key: string, rows: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(rows));
}

export interface PriceChange {
  sku: string;
  newPrice: number;
  newComparePrice?: number;
  effectiveDate?: string;
  reason?: string;
  timestamp: string;
}

export function savePriceChanges(items: PriceChange[]) {
  writeLocal(PRICE_KEY, [...items, ...readLocal<PriceChange>(PRICE_KEY)]);
}

export function loadPriceChanges(): PriceChange[] {
  return readLocal<PriceChange>(PRICE_KEY);
}

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format';

function usableImage(value: string | undefined): string | undefined {
  const v = (value ?? '').trim();
  return /^(https?:\/\/|data:image\/)/i.test(v) ? v : undefined;
}

export function rowToProduct(row: Record<string, string>, imageOverride?: string): Product {
  const compare = row.compare_price ? Number(row.compare_price) : null;
  return {
    id: `up-${row.sku.toLowerCase()}`,
    sku: row.sku,
    title: row.title,
    subtitle: row.subtitle || undefined,
    brand: row.brand as StoreBrand,
    category: row.category as Category,
    image: imageOverride ?? usableImage(row.image) ?? PLACEHOLDER_IMAGE,
    price: Number(row.price),
    compare: compare && !Number.isNaN(compare) ? compare : undefined,
    tags: [row.category],
    hsn: row.hsn || undefined,
    weight: row.weight || undefined,
    bestBefore: row.best_before || undefined,
    fssai: row.fssai || undefined,
    newArrival: true,
  };
}

export function rowToPriceChange(row: Record<string, string>): PriceChange {
  return {
    sku: row.sku,
    newPrice: Number(row.new_price),
    newComparePrice: row.new_compare_price ? Number(row.new_compare_price) : undefined,
    effectiveDate: row.effective_date,
    reason: row.reason,
    timestamp: new Date().toISOString(),
  };
}
