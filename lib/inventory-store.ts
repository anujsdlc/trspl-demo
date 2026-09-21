// Local persistence for bulk-upload commits.
//
// Products live in Vercel KV so the storefront (server + client) can render
// them. Stock adjustments, price changes, and transfers remain in
// localStorage since they're admin audit logs, not shopper-facing.

import type { Product, Category } from './products';
import type { StoreBrand } from './stores';
import { UPLOADED_PRODUCTS_KEY } from './catalog';

// ---------------------------------------------------------------------------
// Uploaded products — persisted server-side via /api/erp/[key]
// ---------------------------------------------------------------------------

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
  if (!isBrowser()) return;
  try {
    await fetch(`/api/erp/${encodeURIComponent(UPLOADED_PRODUCTS_KEY)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows }),
    });
  } catch {}
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

// ---------------------------------------------------------------------------
// Adjustments — stock, price, transfer — logged in localStorage
// ---------------------------------------------------------------------------

const STOCK_KEY = 'trs.inventory.stock.v1';
const PRICE_KEY = 'trs.inventory.prices.v1';
const TRANSFER_KEY = 'trs.inventory.transfers.v1';

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

export interface StockAdjustment {
  sku: string;
  storeCode: string;
  action: 'add' | 'remove' | 'set';
  quantity: number;
  reason?: string;
  batch?: string;
  notes?: string;
  timestamp: string;
}

export interface PriceChange {
  sku: string;
  newPrice: number;
  newComparePrice?: number;
  effectiveDate?: string;
  reason?: string;
  timestamp: string;
}

export interface TransferRecord {
  sku: string;
  fromStoreCode: string;
  toStoreCode: string;
  quantity: number;
  expectedArrival?: string;
  notes?: string;
  timestamp: string;
}

export function saveStockAdjustments(items: StockAdjustment[]) {
  writeLocal(STOCK_KEY, [...items, ...readLocal<StockAdjustment>(STOCK_KEY)]);
}
export function loadStockAdjustments(): StockAdjustment[] { return readLocal<StockAdjustment>(STOCK_KEY); }

export function savePriceChanges(items: PriceChange[]) {
  writeLocal(PRICE_KEY, [...items, ...readLocal<PriceChange>(PRICE_KEY)]);
}
export function loadPriceChanges(): PriceChange[] { return readLocal<PriceChange>(PRICE_KEY); }

export function saveTransfers(items: TransferRecord[]) {
  writeLocal(TRANSFER_KEY, [...items, ...readLocal<TransferRecord>(TRANSFER_KEY)]);
}
export function loadTransfers(): TransferRecord[] { return readLocal<TransferRecord>(TRANSFER_KEY); }

// ---------------------------------------------------------------------------
// CSV row → domain type converters used by the bulk-upload commit path.
// ---------------------------------------------------------------------------

const PLACEHOLDER_IMAGE = 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format';

export function rowToProduct(row: Record<string, string>, imageOverride?: string): Product {
  const compare = row.compare_price ? Number(row.compare_price) : null;
  return {
    id: `up-${row.sku.toLowerCase()}`,
    sku: row.sku,
    title: row.title,
    subtitle: row.subtitle || undefined,
    brand: row.brand as StoreBrand,
    category: row.category as Category,
    image: imageOverride ?? PLACEHOLDER_IMAGE,
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

export function rowToStockAdjustment(row: Record<string, string>): StockAdjustment {
  return {
    sku: row.sku,
    storeCode: row.store_code,
    action: (row.action as 'add' | 'remove' | 'set') || 'add',
    quantity: Number(row.quantity),
    reason: row.reason,
    batch: row.batch,
    notes: row.notes,
    timestamp: new Date().toISOString(),
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

export function rowToTransfer(row: Record<string, string>): TransferRecord {
  return {
    sku: row.sku,
    fromStoreCode: row.from_store_code,
    toStoreCode: row.to_store_code,
    quantity: Number(row.quantity),
    expectedArrival: row.expected_arrival,
    notes: row.notes,
    timestamp: new Date().toISOString(),
  };
}
