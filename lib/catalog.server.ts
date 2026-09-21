// Server-only catalog reader. Uses @vercel/kv directly rather than fetching
// through the API route — safer and faster inside Server Components.
//
// Not to be imported from client components. If KV isn't configured, all
// reads return empty arrays and we fall back to the bundled seed catalog.

import 'server-only';
import { kv } from '@vercel/kv';
import { ALL_PRODUCTS, type Product } from './products';
import { SEED_BOOK_MASTER } from './erp/foundations';
import {
  BOOK_MASTER_KEY, UPLOADED_PRODUCTS_KEY, bookMasterToProduct, mergeCatalog,
} from './catalog';
import type { BookMaster } from './erp/foundations';

async function safeGet<T>(key: string): Promise<T[] | null> {
  try {
    const raw = await kv.get<T[]>(key);
    return Array.isArray(raw) ? raw : null;
  } catch {
    return null;
  }
}

/** Full merged catalog for use in Server Components. */
export async function getServerCatalog(): Promise<Product[]> {
  const [uploaded, bookMaster] = await Promise.all([
    safeGet<Product>(UPLOADED_PRODUCTS_KEY),
    safeGet<BookMaster>(BOOK_MASTER_KEY),
  ]);
  const bookMasterProducts = (bookMaster ?? SEED_BOOK_MASTER)
    .filter(b => b.status === 'active')
    .map(bookMasterToProduct);
  return mergeCatalog(uploaded ?? [], bookMasterProducts, ALL_PRODUCTS);
}

/** Convenience: look up a single product across every source. */
export async function getServerProduct(id: string): Promise<Product | undefined> {
  const catalog = await getServerCatalog();
  return catalog.find(p => p.id === id);
}
