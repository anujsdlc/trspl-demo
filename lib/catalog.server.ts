import 'server-only';
import { storeGet } from './server-store';
import { ALL_PRODUCTS, type Product } from './products';
import { SEED_BOOK_MASTER } from './erp/foundations';
import {
  BOOK_MASTER_KEY, UPLOADED_PRODUCTS_KEY, bookMasterToProduct, mergeCatalog,
} from './catalog';
import type { BookMaster } from './erp/foundations';

async function safeGet<T>(key: string): Promise<T[] | null> {
  try {
    const raw = await storeGet<T[]>(key);
    return Array.isArray(raw) ? raw : null;
  } catch (err) {
    console.error(`[catalog] read failed for ${key}:`, err);
    return null;
  }
}

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

export async function getServerProduct(id: string): Promise<Product | undefined> {
  const catalog = await getServerCatalog();
  return catalog.find(p => p.id === id);
}
