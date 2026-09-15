import booksRaw from './books-curated.json';
import type { StoreBrand } from './stores';

export type Category =
  | 'manga' | 'fiction' | 'non-fiction' | 'children' | 'books' | 'stationery' | 'toys'
  | 'confectionery' | 'sweets' | 'tech' | 'cashmere' | 'travel' | 'gifts';

export interface Product {
  id: string;
  sku: string;
  title: string;
  subtitle?: string;
  brand: StoreBrand;
  category: Category;
  image: string;
  price: number;
  compare?: number | null;
  tags: string[];
  isbn?: string;
  hsn?: string;
  weight?: string;
  bestBefore?: string;
  featured?: boolean;
  fssai?: string;
}

// Fix "Crossword.in" authors → treat as no author
function cleanAuthor(a: string): string | undefined {
  if (!a || a === 'Unknown' || a.toLowerCase().includes('crossword')) return undefined;
  return a;
}

const books: Product[] = (booksRaw as Array<Record<string, unknown>>).map((b, i) => ({
  id: `bk-${b.id}`,
  sku: (b.sku as string) || `BK${1000 + i}`,
  title: (b.title as string).replace(/\s*\[\]\s*/g, ' — ').replace(/\s+/g, ' ').trim(),
  subtitle: cleanAuthor(b.author as string),
  brand: 'RLY',
  category: b.category as Category,
  image: b.image as string,
  price: b.price as number,
  compare: b.compare as number | null,
  tags: [b.category as string],
  hsn: '4901',
  isbn: `978-${1000000 + (Number(b.id) % 100000000)}`.substring(0, 17),
  featured: i < 20,
}));

// Curated non-book SKUs — matches TRS brand mix
const chocolates: Product[] = [
  { id: 'cb-001', sku: 'CB-FRR-24', title: 'Ferrero Rocher T24', subtitle: 'Assorted 24-piece box', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1582058091505-f87a2e55a40f?w=800&q=80', price: 899, compare: 999, tags: ['chocolate', 'gifting', 'bestseller'], hsn: '1806', weight: '300g', bestBefore: '2027-03', fssai: '10012011000123', featured: true },
  { id: 'cb-002', sku: 'CB-LNT-EX', title: 'Lindt Excellence 70% Dark', subtitle: 'Swiss dark chocolate bar', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1623428187969-5da2dcea5ebf?w=800&q=80', price: 425, tags: ['chocolate', 'dark', 'premium'], hsn: '1806', weight: '100g', bestBefore: '2027-01', fssai: '10012011000124' },
  { id: 'cb-003', sku: 'CB-MLK-WHL', title: 'Milka Whole Hazelnut', subtitle: 'Alpine milk chocolate', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1621762005150-c81a0a5aae10?w=800&q=80', price: 275, tags: ['chocolate', 'milk'], hsn: '1806', weight: '100g', bestBefore: '2026-11', fssai: '10012011000125' },
  { id: 'cb-004', sku: 'CB-TBL-ML', title: 'Toblerone Milk Bar', subtitle: 'Swiss triangular chocolate', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1635402617262-5e2ec2db3663?w=800&q=80', price: 499, tags: ['chocolate', 'gifting'], hsn: '1806', weight: '360g', bestBefore: '2027-02', fssai: '10012011000126', featured: true },
  { id: 'cb-005', sku: 'CB-KIT-JP', title: 'Kit Kat Matcha (Japan)', subtitle: 'Imported green tea flavor', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1587132137056-bfbf0166836e?w=800&q=80', price: 799, compare: 899, tags: ['chocolate', 'imported', 'limited'], hsn: '1806', weight: '135g', bestBefore: '2026-09', fssai: '10012011000127' },
  { id: 'gld-001', sku: 'GLD-ASS-B', title: "Glädje Assorted Box", subtitle: 'Signature TRS chocolates', brand: 'GLD', category: 'confectionery', image: 'https://images.unsplash.com/photo-1546241072-48010ad2862c?w=800&q=80', price: 1299, tags: ['chocolate', 'premium', 'signature'], hsn: '1806', weight: '250g', bestBefore: '2026-12', fssai: '10012011000128', featured: true },
];

const mishta: Product[] = [
  { id: 'ms-001', sku: 'MS-KAJU-500', title: 'Kaju Katli Premium', subtitle: 'Fresh cashew fudge · 500g', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1615832494873-b0c52d519696?w=800&q=80', price: 899, tags: ['sweets', 'indian', 'gifting'], hsn: '1704', weight: '500g', bestBefore: '2026-04', fssai: '10012011000201', featured: true },
  { id: 'ms-002', sku: 'MS-MOTI-L', title: 'Motichoor Laddoo Box', subtitle: 'Handmade · 12 pieces', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1605197181294-df4b60e19a0d?w=800&q=80', price: 549, tags: ['sweets', 'festive'], hsn: '1704', weight: '400g', bestBefore: '2026-02', fssai: '10012011000202' },
  { id: 'ms-003', sku: 'MS-SNDS-M', title: 'Sondesh Traveller Pack', subtitle: 'Bengali sweet · vacuum sealed', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1600735540962-45c3d9b9f16f?w=800&q=80', price: 649, tags: ['sweets', 'bengali', 'travel-safe'], hsn: '1704', weight: '250g', bestBefore: '2026-03', fssai: '10012011000203' },
  { id: 'sm-001', sku: 'SM-GB-500', title: 'Signature Gift Basket', subtitle: 'Chocolates + Nuts + Sweets', brand: 'SML', category: 'gifts', image: 'https://images.unsplash.com/photo-1512909006721-3d6018887383?w=800&q=80', price: 2499, tags: ['gifting', 'hamper', 'premium'], hsn: '2106', weight: '1.2kg', bestBefore: '2026-08', fssai: '10012011000301', featured: true },
];

const tech: Product[] = [
  { id: 'mt-001', sku: 'MT-JBL-F5', title: 'JBL Flip 5 Portable Speaker', subtitle: 'Waterproof · 12hr battery', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&q=80', price: 9999, compare: 12999, tags: ['audio', 'speaker', 'jbl'], hsn: '8518', featured: true },
  { id: 'mt-002', sku: 'MT-SNS-M4', title: 'Sennheiser Momentum 4', subtitle: 'Wireless ANC headphones', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&q=80', price: 32999, compare: 34990, tags: ['audio', 'headphones', 'premium'], hsn: '8518', featured: true },
  { id: 'mt-003', sku: 'MT-MRS-EMB', title: 'Marshall Emberton II', subtitle: 'Portable bluetooth speaker', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&q=80', price: 15999, tags: ['audio', 'speaker'], hsn: '8518' },
  { id: 'mt-004', sku: 'MT-SKY-IND', title: 'Skullcandy Indy Evo', subtitle: 'True wireless earbuds', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&q=80', price: 4999, compare: 6999, tags: ['audio', 'earbuds'], hsn: '8518' },
  { id: 'mt-005', sku: 'MT-PB-20K', title: '20000mAh Power Bank PD', subtitle: 'Fast charge · 22.5W', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=800&q=80', price: 2499, tags: ['power', 'travel'], hsn: '8507', featured: true },
  { id: 'mt-006', sku: 'MT-CBL-USB', title: 'Braided USB-C Cable 1.5m', subtitle: '100W PD · Nylon braided', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&q=80', price: 799, tags: ['cable', 'travel-essential'], hsn: '8544' },
  { id: 'mt-007', sku: 'MT-NCK-PL', title: 'Memory Foam Neck Pillow', subtitle: 'Travel · cooling gel', brand: 'MTC', category: 'travel', image: 'https://images.unsplash.com/photo-1585909695284-32d2985ac9c0?w=800&q=80', price: 1299, tags: ['travel', 'comfort'], hsn: '9404' },
  { id: 'mt-008', sku: 'MT-BAG-CB', title: 'Cabin Trolley 55cm', subtitle: 'Hard-shell · TSA lock', brand: 'MTC', category: 'travel', image: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&q=80', price: 6999, compare: 8999, tags: ['travel', 'bag'], hsn: '4202', featured: true },
];

const cashmere: Product[] = [
  { id: 'ps-001', sku: 'PS-SCF-CH', title: 'Pure Cashmere Shawl · Charcoal', subtitle: 'Woven in Ladakh · 100% pashmina', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1601924582970-9238bcb495d9?w=800&q=80', price: 14999, tags: ['luxury', 'shawl', 'winter'], hsn: '6214', featured: true },
  { id: 'ps-002', sku: 'PS-SCF-IV', title: 'Ivory Ring Stole', subtitle: 'Featherweight · 200g', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=800&q=80', price: 8999, tags: ['luxury', 'stole'] },
  { id: 'ps-003', sku: 'PS-SWT-RS', title: 'Cashmere Turtleneck', subtitle: 'Merlot · Fine gauge', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1608234807905-4466023792f5?w=800&q=80', price: 19999, tags: ['luxury', 'sweater'], featured: true },
  { id: 'ps-004', sku: 'PS-SCF-BL', title: 'Cobalt Silk-Cashmere Wrap', subtitle: 'Hand-loomed · 80/20 blend', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?w=800&q=80', price: 11999, tags: ['luxury', 'wrap'] },
];

export const ALL_PRODUCTS: Product[] = [...books, ...chocolates, ...mishta, ...tech, ...cashmere];

export const PRODUCTS_BY_CATEGORY: Record<Category, Product[]> = {
  manga: [], fiction: [], 'non-fiction': [], children: [], books: [], stationery: [], toys: [],
  confectionery: [], sweets: [], tech: [], cashmere: [], travel: [], gifts: [],
};
for (const p of ALL_PRODUCTS) PRODUCTS_BY_CATEGORY[p.category]?.push(p);

export const PRODUCTS_BY_BRAND: Record<StoreBrand, Product[]> = {
  RLY: [], CB: [], MSH: [], SML: [], PSH: [], GLD: [], MTC: [],
};
for (const p of ALL_PRODUCTS) PRODUCTS_BY_BRAND[p.brand]?.push(p);

export const FEATURED = ALL_PRODUCTS.filter(p => p.featured);
export const MANGA = PRODUCTS_BY_CATEGORY.manga;
export const FICTION = PRODUCTS_BY_CATEGORY.fiction;
export const NONFIC = PRODUCTS_BY_CATEGORY['non-fiction'];

export function getProduct(id: string) {
  return ALL_PRODUCTS.find(p => p.id === id);
}

// Deterministic per-store stock generation
export function stockFor(productId: string, storeId: string): number {
  const seed = productId.split('').reduce((a, c) => a + c.charCodeAt(0), 0)
             + storeId.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const r = (seed * 9301 + 49297) % 233280 / 233280;
  if (r < 0.15) return 0;
  if (r < 0.3) return Math.floor(r * 20) + 1;
  return Math.floor(r * 80) + 5;
}

export function totalStock(productId: string, storeIds: string[]): number {
  return storeIds.reduce((sum, id) => sum + stockFor(productId, id), 0);
}
