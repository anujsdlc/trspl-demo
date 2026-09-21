// Client-side catalog fetcher. Pulls uploaded products + ERP book master
// through the same /api/erp/[key] route the ERP consoles already use, then
// merges with the bundled seed catalog.

import { ALL_PRODUCTS, type Product } from './products';
import { SEED_BOOK_MASTER, type BookMaster } from './erp/foundations';
import {
  BOOK_MASTER_KEY, UPLOADED_PRODUCTS_KEY, bookMasterToProduct, mergeCatalog,
} from './catalog';

async function fetchRows<T>(key: string): Promise<T[]> {
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(key)}`, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.rows) ? (data.rows as T[]) : [];
  } catch { return []; }
}

/** Merged catalog for use in client components (browse grid, search, bag, favourites). */
export async function loadClientCatalog(): Promise<Product[]> {
  if (typeof window === 'undefined') return ALL_PRODUCTS;
  const [uploaded, bookMasterRaw] = await Promise.all([
    fetchRows<Product>(UPLOADED_PRODUCTS_KEY),
    fetchRows<BookMaster>(BOOK_MASTER_KEY),
  ]);
  const bookMaster = (bookMasterRaw.length ? bookMasterRaw : SEED_BOOK_MASTER)
    .filter(b => b.status === 'active')
    .map(bookMasterToProduct);
  return mergeCatalog(uploaded, bookMaster, ALL_PRODUCTS);
}
