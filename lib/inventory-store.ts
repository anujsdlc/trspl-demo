// Local persistence for bulk-upload commits.
// Products / stock adjustments / price changes / transfers all live in
// localStorage under their own keys so admin actions survive reloads and
// show up in the Inventory Console.

import type { Product, Category } from './products';
import type { StoreBrand } from './stores';

// ---------------------------------------------------------------------------
// New products added via the bulk-upload wizard
// ---------------------------------------------------------------------------

const PRODUCTS_KEY = 'trs.inventory.products.v1';
const STOCK_KEY = 'trs.inventory.stock.v1';
const PRICE_KEY = 'trs.inventory.prices.v1';
const TRANSFER_KEY = 'trs.inventory.transfers.v1';

function isBrowser() { return typeof window !== 'undefined'; }

function read<T>(key: string): T[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : [];
  } catch { return []; }
}

function write<T>(key: string, rows: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(rows));
}

export function loadUploadedProducts(): Product[] { return read<Product>(PRODUCTS_KEY); }

export function addUploadedProducts(products: Product[]) {
  const existing = loadUploadedProducts();
  const existingSkus = new Set(existing.map(p => p.sku));
  const fresh = products.filter(p => !existingSkus.has(p.sku));
  write(PRODUCTS_KEY, [...fresh, ...existing]);
}

export function clearUploadedProducts() { write(PRODUCTS_KEY, []); }

// ---------------------------------------------------------------------------
// Adjustments — stock, price, transfer — logged as audit entries
// ---------------------------------------------------------------------------

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
  write(STOCK_KEY, [...items, ...read<StockAdjustment>(STOCK_KEY)]);
}
export function loadStockAdjustments(): StockAdjustment[] { return read<StockAdjustment>(STOCK_KEY); }

export function savePriceChanges(items: PriceChange[]) {
  write(PRICE_KEY, [...items, ...read<PriceChange>(PRICE_KEY)]);
}
export function loadPriceChanges(): PriceChange[] { return read<PriceChange>(PRICE_KEY); }

export function saveTransfers(items: TransferRecord[]) {
  write(TRANSFER_KEY, [...items, ...read<TransferRecord>(TRANSFER_KEY)]);
}
export function loadTransfers(): TransferRecord[] { return read<TransferRecord>(TRANSFER_KEY); }

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
