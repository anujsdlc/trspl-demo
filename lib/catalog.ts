// Unified storefront catalog.
//
// The shopper site draws products from three places, in this priority order:
//   1. Bulk-uploaded products    — admin CSV wizard, stored in KV
//   2. ERP Book Master           — /admin/erp/books, stored in KV
//   3. Static seed catalog       — lib/products.ts (bundled at build time)
//
// Server components should call `getServerCatalog()` (direct KV read).
// Client components should call `getClientCatalog()` (fetches through the
// same /api/erp/[key] route the ERP consoles use).
//
// Both entry points return the same shape: a Product[] sorted so that
// newer / admin-added items appear first.

import { ALL_PRODUCTS, type Product, type Category } from './products';
import type { BookMaster } from './erp/foundations';
import type { StoreBrand } from './stores';

export const UPLOADED_PRODUCTS_KEY = 'catalog.uploaded.v1';
export const BOOK_MASTER_KEY = 'trs.erp.books.v1';

const BOOK_COVER_FALLBACK =
  'https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format';

/** Turn an ERP book-master record into a storefront-shaped Product. */
export function bookMasterToProduct(b: BookMaster): Product {
  const authorOrPublisher = b.author && b.author.trim() ? b.author : `${b.publisher} · Class ${b.class}`;
  const category: Category = 'books';
  const tags = [b.subject, b.board, `class-${b.class}`, b.language]
    .filter(Boolean)
    .map(t => String(t).toLowerCase());
  return {
    id: `bkm-${b.id}`,
    sku: b.barcode || b.isbn,
    title: b.title,
    subtitle: authorOrPublisher,
    brand: 'RLY' as StoreBrand,
    category,
    image: BOOK_COVER_FALLBACK,
    price: b.mrp,
    compare: null,
    tags,
    isbn: b.isbn,
    hsn: b.hsnCode,
    newArrival: false,
  };
}

/**
 * Merge admin/ERP additions with the bundled catalog, deduping by id and sku.
 * Admin-added products win when there's a collision.
 */
export function mergeCatalog(uploaded: Product[], bookMaster: Product[], seed: Product[] = ALL_PRODUCTS): Product[] {
  const seen = new Set<string>();
  const merged: Product[] = [];
  for (const p of [...uploaded, ...bookMaster, ...seed]) {
    if (seen.has(p.id) || seen.has(p.sku)) continue;
    seen.add(p.id);
    seen.add(p.sku);
    merged.push(p);
  }
  return merged;
}
