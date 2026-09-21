import booksRaw from './books-curated.json';
import type { StoreBrand } from './stores';

export type Category =
  | 'manga' | 'fiction' | 'non-fiction' | 'children' | 'books' | 'stationery' | 'toys'
  | 'confectionery' | 'sweets' | 'tech' | 'cashmere' | 'travel' | 'gifts'
  | 'snacks' | 'drinks' | 'personal-care' | 'magazines';

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
  bogo?: boolean;
  newArrival?: boolean;
  relayPick?: boolean;
  bestseller?: boolean;
}

function cleanAuthor(a: string): string | undefined {
  if (!a || a === 'Unknown' || a.toLowerCase().includes('crossword')) return undefined;
  return a;
}

const SKU_PREFIX: Partial<Record<Category, string>> = {
  manga: 'MNG', fiction: 'FIC', 'non-fiction': 'NFC',
  children: 'CHD', books: 'BOK', stationery: 'STN', magazines: 'MAG',
};

const skuCounters: Record<string, number> = {};
function shelfSku(category: Category): string {
  const prefix = SKU_PREFIX[category] ?? 'GEN';
  skuCounters[prefix] = (skuCounters[prefix] ?? 0) + 1;
  return `RLY-${prefix}-${String(skuCounters[prefix]).padStart(4, '0')}`;
}

const books: Product[] = (booksRaw as Array<Record<string, unknown>>).map((b, i) => ({
  id: `bk-${b.id}`,
  sku: shelfSku(b.category as Category),
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

const chocolates: Product[] = [
  { id: 'cb-001', sku: 'CB-FRR-24', title: 'Ferrero Rocher T24', subtitle: 'Assorted 24-piece box', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1598881265033-aaceb3dc4c47?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 899, compare: 999, tags: ['chocolate', 'gifting', 'bestseller'], hsn: '1806', weight: '300g', bestBefore: '2027-03', fssai: '10012011000123', featured: true },
  { id: 'cb-002', sku: 'CB-LNT-EX', title: 'Lindt Excellence 70% Dark', subtitle: 'Swiss dark chocolate bar', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1623660053975-cf75a8be0908?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 425, tags: ['chocolate', 'dark', 'premium'], hsn: '1806', weight: '100g', bestBefore: '2027-01', fssai: '10012011000124' },
  { id: 'cb-003', sku: 'CB-MLK-WHL', title: 'Milka Whole Hazelnut', subtitle: 'Alpine milk chocolate', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1732304718527-4af155ca1948?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 275, tags: ['chocolate', 'milk'], hsn: '1806', weight: '100g', bestBefore: '2026-11', fssai: '10012011000125' },
  { id: 'cb-004', sku: 'CB-TBL-ML', title: 'Toblerone Milk Bar', subtitle: 'Swiss triangular chocolate', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1732304718527-4af155ca1948?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 499, tags: ['chocolate', 'gifting'], hsn: '1806', weight: '360g', bestBefore: '2027-02', fssai: '10012011000126', featured: true },
  { id: 'cb-005', sku: 'CB-KIT-JP', title: 'Kit Kat Matcha (Japan)', subtitle: 'Imported green tea flavor', brand: 'CB', category: 'confectionery', image: 'https://images.unsplash.com/photo-1762417582780-f1891ad97181?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 799, compare: 899, tags: ['chocolate', 'imported', 'limited'], hsn: '1806', weight: '135g', bestBefore: '2026-09', fssai: '10012011000127' },
  { id: 'gld-001', sku: 'GLD-ASS-B', title: "Glädje Assorted Box", subtitle: 'Signature TRS chocolates', brand: 'GLD', category: 'confectionery', image: 'https://images.unsplash.com/photo-1788521042909-3a7f486d0321?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 1299, tags: ['chocolate', 'premium', 'signature'], hsn: '1806', weight: '250g', bestBefore: '2026-12', fssai: '10012011000128', featured: true },
];

const mishta: Product[] = [
  { id: 'ms-001', sku: 'MS-KAJU-500', title: 'Kaju Katli Premium', subtitle: 'Fresh cashew fudge · 500g', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1699708263762-00ca477760bd?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 899, tags: ['sweets', 'indian', 'gifting'], hsn: '1704', weight: '500g', bestBefore: '2026-04', fssai: '10012011000201', featured: true },
  { id: 'ms-002', sku: 'MS-MOTI-L', title: 'Motichoor Laddoo Box', subtitle: 'Handmade · 12 pieces', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1695568180070-8b5acead5cf4?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 549, tags: ['sweets', 'festive'], hsn: '1704', weight: '400g', bestBefore: '2026-02', fssai: '10012011000202' },
  { id: 'ms-003', sku: 'MS-SNDS-M', title: 'Sondesh Traveller Pack', subtitle: 'Bengali sweet · vacuum sealed', brand: 'MSH', category: 'sweets', image: 'https://images.unsplash.com/photo-1695568180070-8b5acead5cf4?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 649, tags: ['sweets', 'bengali', 'travel-safe'], hsn: '1704', weight: '250g', bestBefore: '2026-03', fssai: '10012011000203' },
  { id: 'sm-001', sku: 'SM-GB-500', title: 'Signature Gift Basket', subtitle: 'Chocolates + Nuts + Sweets', brand: 'SML', category: 'gifts', image: 'https://images.unsplash.com/photo-1773450970959-cef81e9b1053?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 2499, tags: ['gifting', 'hamper', 'premium'], hsn: '2106', weight: '1.2kg', bestBefore: '2026-08', fssai: '10012011000301', featured: true },
];

const tech: Product[] = [
  { id: 'mt-001', sku: 'MT-JBL-F5', title: 'JBL Flip 5 Portable Speaker', subtitle: 'Waterproof · 12hr battery', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 9999, compare: 12999, tags: ['audio', 'speaker', 'jbl'], hsn: '8518', featured: true },
  { id: 'mt-002', sku: 'MT-SNS-M4', title: 'Sennheiser Momentum 4', subtitle: 'Wireless ANC headphones', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 32999, compare: 34990, tags: ['audio', 'headphones', 'premium'], hsn: '8518', featured: true },
  { id: 'mt-003', sku: 'MT-MRS-EMB', title: 'Marshall Emberton II', subtitle: 'Portable bluetooth speaker', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1699567364860-cf5e05224338?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 15999, tags: ['audio', 'speaker'], hsn: '8518' },
  { id: 'mt-004', sku: 'MT-SKY-IND', title: 'Skullcandy Indy Evo', subtitle: 'True wireless earbuds', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1572569511254-d8f925fe2cbb?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 4999, compare: 6999, tags: ['audio', 'earbuds'], hsn: '8518' },
  { id: 'mt-005', sku: 'MT-PB-20K', title: '20000mAh Power Bank PD', subtitle: 'Fast charge · 22.5W', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 2499, tags: ['power', 'travel'], hsn: '8507', featured: true },
  { id: 'mt-006', sku: 'MT-CBL-USB', title: 'Braided USB-C Cable 1.5m', subtitle: '100W PD · Nylon braided', brand: 'MTC', category: 'tech', image: 'https://images.unsplash.com/photo-1572721546624-05bf65ad7679?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 799, tags: ['cable', 'travel-essential'], hsn: '8544' },
  { id: 'mt-007', sku: 'MT-NCK-PL', title: 'Memory Foam Neck Pillow', subtitle: 'Travel · cooling gel', brand: 'MTC', category: 'travel', image: 'https://images.unsplash.com/photo-1650075989933-a79703a01444?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 1299, tags: ['travel', 'comfort'], hsn: '9404' },
  { id: 'mt-008', sku: 'MT-BAG-CB', title: 'Cabin Trolley 55cm', subtitle: 'Hard-shell · TSA lock', brand: 'MTC', category: 'travel', image: 'https://images.unsplash.com/photo-1783408356226-f44b26446e0d?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 6999, compare: 8999, tags: ['travel', 'bag'], hsn: '4202', featured: true },
];

const relayConvenience: Product[] = [
  { id: 'rly-sn-001', sku: 'RLY-LAY-CS', title: "Lay's Classic Salted", subtitle: 'Party pack · 90g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1641693148759-843d17ceac24?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 60, tags: ['snacks', 'crisps'], hsn: '1905', weight: '90g', bestBefore: '2026-04', fssai: '10012011000401', featured: true, bogo: true, bestseller: true },
  { id: 'rly-sn-002', sku: 'RLY-PRG-OR', title: 'Pringles Original', subtitle: 'Stacked crisps · 165g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1702097034631-4283d8979de6?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 199, tags: ['snacks', 'crisps', 'imported'], hsn: '1905', weight: '165g', bestBefore: '2026-10', fssai: '10012011000402' },
  { id: 'rly-sn-003', sku: 'RLY-HD-BJ', title: "Haldiram's Aloo Bhujia", subtitle: 'Signature savoury · 200g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1596450512748-2dae774fc38a?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 99, tags: ['snacks', 'indian'], hsn: '1905', weight: '200g', bestBefore: '2026-06', fssai: '10012011000403' },
  { id: 'rly-sn-004', sku: 'RLY-KKR-MM', title: 'Kurkure Masala Munch', subtitle: 'Corn puffs · 90g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1669056544004-96abfb7a5008?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 40, tags: ['snacks', 'spicy'], hsn: '1905', weight: '90g', bestBefore: '2026-05', fssai: '10012011000404' },
  { id: 'rly-sn-005', sku: 'RLY-NUT-TR', title: 'Nutty Yogi Trail Mix', subtitle: 'Roasted nuts & berries · 200g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1543158181-1274e5362710?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 349, compare: 399, tags: ['snacks', 'healthy'], hsn: '2008', weight: '200g', bestBefore: '2026-09', fssai: '10012011000405', featured: true, relayPick: true, newArrival: true },
  { id: 'rly-sn-006', sku: 'RLY-POP-SS', title: 'PopCorners Sea Salt', subtitle: 'Popped corn chips · 85g', brand: 'RLY', category: 'snacks', image: 'https://images.unsplash.com/photo-1578849278619-e73505e9610f?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 149, tags: ['snacks', 'gluten-free'], hsn: '1905', weight: '85g', bestBefore: '2026-08', fssai: '10012011000406', bogo: true },

  { id: 'rly-dr-001', sku: 'RLY-AQ-1L', title: 'Aquafina Water', subtitle: 'Purified · 1L', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1616118132534-381148898bb4?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 40, tags: ['drinks', 'water'], hsn: '2201', weight: '1L' },
  { id: 'rly-dr-002', sku: 'RLY-RB-250', title: 'Red Bull Energy Drink', subtitle: 'Original · 250ml', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1560689189-65b6ed6228e7?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 125, tags: ['drinks', 'energy'], hsn: '2202', weight: '250ml', bestBefore: '2027-02', featured: true, bestseller: true, relayPick: true },
  { id: 'rly-dr-003', sku: 'RLY-TRP-OR', title: 'Tropicana Orange', subtitle: 'Chilled juice · 200ml', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 45, tags: ['drinks', 'juice'], hsn: '2009', weight: '200ml', bestBefore: '2026-05' },
  { id: 'rly-dr-004', sku: 'RLY-NES-100', title: 'Nescafé Sunrise Instant', subtitle: 'Rich blend · 100g', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1664002044539-08b9f6273473?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 349, tags: ['drinks', 'coffee'], hsn: '0901', weight: '100g', bestBefore: '2027-04' },
  { id: 'rly-dr-005', sku: 'RLY-CP-MC', title: 'Chai Point Masala Chai', subtitle: 'RTD tea · 250ml', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1568832849324-167c62c7849b?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 79, tags: ['drinks', 'tea', 'indian'], hsn: '0902', weight: '250ml', bestBefore: '2026-07' },
  { id: 'rly-dr-006', sku: 'RLY-BS-VD', title: 'Bisleri Vedica Himalayan', subtitle: 'Mineral water · 750ml', brand: 'RLY', category: 'drinks', image: 'https://images.unsplash.com/photo-1602158335077-18c4fe45f6ca?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 60, tags: ['drinks', 'water', 'premium'], hsn: '2201', weight: '750ml' },

  { id: 'rly-tc-001', sku: 'RLY-AN-45W', title: 'Anker 45W USB-C Charger', subtitle: 'Compact GaN · single port', brand: 'RLY', category: 'tech', image: 'https://images.unsplash.com/photo-1731616103600-3fe7ccdc5a59?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 999, compare: 1299, tags: ['tech', 'charger'], hsn: '8504', featured: true, bestseller: true, relayPick: true },
  { id: 'rly-tc-002', sku: 'RLY-BLK-C1', title: 'Belkin USB-C to USB-C 1m', subtitle: 'Braided · 60W PD', brand: 'RLY', category: 'tech', image: 'https://images.unsplash.com/photo-1572721546624-05bf65ad7679?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 599, tags: ['tech', 'cable'], hsn: '8544', bogo: true },
  { id: 'rly-tc-003', sku: 'RLY-BT-R4', title: 'boAt Rockerz 425', subtitle: 'Wireless neckband · 25h', brand: 'RLY', category: 'tech', image: 'https://images.unsplash.com/photo-1632247541401-3d4a8d516595?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 1999, compare: 2499, tags: ['tech', 'audio'], hsn: '8518', newArrival: true, bestseller: true },
  { id: 'rly-tc-004', sku: 'RLY-PRT-PB', title: 'Portronics Power Bank 10K', subtitle: '10000 mAh · PD 22.5W', brand: 'RLY', category: 'tech', image: 'https://images.unsplash.com/photo-1585995603413-eb35b5f4a50b?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 1299, tags: ['tech', 'power'], hsn: '8507', bestseller: true, relayPick: true },
  { id: 'rly-tc-005', sku: 'RLY-HP-EP', title: 'HP Wired Earphones', subtitle: 'In-ear · 3.5mm', brand: 'RLY', category: 'tech', image: 'https://images.unsplash.com/photo-1533379007656-3a10925da2e2?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 349, tags: ['tech', 'audio', 'wired'], hsn: '8518' },

  { id: 'rly-tr-001', sku: 'RLY-TR-NP', title: 'Inflatable Neck Pillow', subtitle: 'Memory foam · travel case', brand: 'RLY', category: 'travel', image: 'https://images.unsplash.com/photo-1706819399603-428b06afe3fc?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 599, tags: ['travel', 'comfort'], featured: true, bestseller: true, relayPick: true, hsn: '9404' },
  { id: 'rly-tr-002', sku: 'RLY-TR-EMK', title: 'Eye Mask + Earplugs Kit', subtitle: 'Sleep essentials on-board', brand: 'RLY', category: 'travel', image: 'https://images.unsplash.com/photo-1666934209818-cd6a6d08bd8d?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 199, tags: ['travel', 'sleep'], bogo: true, hsn: '6307' },
  { id: 'rly-tr-003', sku: 'RLY-TR-DL', title: 'Digital Luggage Scale', subtitle: 'Weigh up to 50kg', brand: 'RLY', category: 'travel', image: 'https://images.unsplash.com/photo-1593215129811-434e20186220?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 899, tags: ['travel', 'gadget'], hsn: '8423' },
  { id: 'rly-tr-004', sku: 'RLY-TR-TSA', title: 'TSA-Approved Lock', subtitle: 'Combination · steel body', brand: 'RLY', category: 'travel', image: 'https://images.unsplash.com/photo-1587195399841-fc7174360a86?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 349, tags: ['travel', 'security'], hsn: '8301' },
  { id: 'rly-tr-005', sku: 'RLY-TR-PW', title: 'Passport & RFID Wallet', subtitle: 'Vegan leather · card slots', brand: 'RLY', category: 'travel', image: 'https://images.unsplash.com/photo-1637262448017-0fbbec87a898?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 799, compare: 999, tags: ['travel', 'security'], hsn: '8507' },

  { id: 'rly-pc-001', sku: 'RLY-PC-NHC', title: 'Nivea Hand Cream', subtitle: 'Nourishing · 100ml', brand: 'RLY', category: 'personal-care', image: 'https://images.unsplash.com/photo-1638609927040-8a7e97cd9d6a?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 199, tags: ['wellness', 'hands'], hsn: '3304', weight: '100ml' },
  { id: 'rly-pc-002', sku: 'RLY-PC-OSD', title: 'Old Spice Deodorant', subtitle: 'Original · 150ml', brand: 'RLY', category: 'personal-care', image: 'https://images.unsplash.com/photo-1604523412953-ec5f89b57be3?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 299, tags: ['wellness', 'grooming'], hsn: '3307', weight: '150ml' },
  { id: 'rly-pc-003', sku: 'RLY-PC-NFW', title: 'Neutrogena Face Wash', subtitle: 'Deep clean · 100g', brand: 'RLY', category: 'personal-care', image: 'https://images.unsplash.com/photo-1653919198052-546d44e2458e?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 399, tags: ['wellness', 'skincare'], hsn: '3304', weight: '100g' },
  { id: 'rly-pc-004', sku: 'RLY-PC-CT', title: 'Colgate Travel Toothpaste', subtitle: 'Fresh mint · 50g', brand: 'RLY', category: 'personal-care', image: 'https://images.unsplash.com/photo-1594178990090-ca641059a506?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 89, tags: ['wellness', 'travel-size'], hsn: '3306', weight: '50g' },
  { id: 'rly-pc-005', sku: 'RLY-PC-BLB', title: 'Boro Plus Lip Balm', subtitle: 'Nourish & protect', brand: 'RLY', category: 'personal-care', image: 'https://images.unsplash.com/photo-1773452451137-acc5fd1c0dfd?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 79, tags: ['wellness', 'lips'], hsn: '3304' },

  { id: 'rly-mg-001', sku: 'RLY-MG-VG', title: 'Vogue India', subtitle: 'September issue', brand: 'RLY', category: 'magazines', image: 'https://images.unsplash.com/photo-1596382940920-9f73b2d15901?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 250, tags: ['magazine', 'fashion'], hsn: '4902', featured: true, newArrival: true, bestseller: true },
  { id: 'rly-mg-002', sku: 'RLY-MG-FB', title: 'Forbes India', subtitle: 'Latest edition', brand: 'RLY', category: 'magazines', image: 'https://images.unsplash.com/photo-1444653614773-995cb1ef9efa?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 199, tags: ['magazine', 'business'], hsn: '4902' },
  { id: 'rly-mg-003', sku: 'RLY-MG-NG', title: 'National Geographic Traveller', subtitle: 'Latest edition', brand: 'RLY', category: 'magazines', image: 'https://images.unsplash.com/photo-1635621456241-16e4a3a009a0?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 350, tags: ['magazine', 'travel'], hsn: '4902' },
  { id: 'rly-mg-004', sku: 'RLY-MG-GQ', title: 'GQ India', subtitle: 'Style & culture', brand: 'RLY', category: 'magazines', image: 'https://images.unsplash.com/photo-1775193850156-1a60a54f97f4?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 299, tags: ['magazine', 'lifestyle'], hsn: '4902' },
  { id: 'rly-mg-005', sku: 'RLY-MG-OB', title: 'Outlook Business', subtitle: 'Fortnightly · latest', brand: 'RLY', category: 'magazines', image: 'https://images.unsplash.com/photo-1624269305548-1527ef905ff6?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 100, tags: ['magazine', 'business'], hsn: '4902' },

  { id: 'rly-gf-001', sku: 'RLY-GF-IND', title: 'Incredible India — Guide Set', subtitle: 'City walk collection · 3 volumes', brand: 'RLY', category: 'gifts', image: 'https://images.unsplash.com/photo-1503221043305-f7498f8b7888?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 999, tags: ['gift', 'souvenir', 'travel'], hsn: '4901' },
  { id: 'rly-gf-002', sku: 'RLY-GF-MG', title: 'Delhi Airport Souvenir Mug', subtitle: 'Ceramic · dishwasher safe', brand: 'RLY', category: 'gifts', image: 'https://images.unsplash.com/photo-1666445844615-0a3930270f13?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 599, tags: ['gift', 'souvenir'], hsn: '6912' },
  { id: 'rly-gf-003', sku: 'RLY-GF-TJ', title: 'Miniature Taj Mahal', subtitle: 'Hand-finished · 12cm', brand: 'RLY', category: 'gifts', image: 'https://images.unsplash.com/photo-1696887484490-715e7eb0e682?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 799, tags: ['gift', 'souvenir', 'india'], hsn: '9503' },
  { id: 'rly-gf-004', sku: 'RLY-GF-JR', title: 'Traveller Journal', subtitle: 'Leather-bound · lined', brand: 'RLY', category: 'gifts', image: 'https://images.unsplash.com/photo-1654542645651-5196f4931cd6?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 499, tags: ['gift', 'stationery', 'travel'], hsn: '4820' },
];

const cashmere: Product[] = [
  { id: 'ps-001', sku: 'PS-SCF-CH', title: 'Pure Cashmere Shawl · Charcoal', subtitle: 'Woven in Ladakh · 100% pashmina', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1784382358820-c6de5921b6f4?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 14999, tags: ['luxury', 'shawl', 'winter'], hsn: '6214', featured: true },
  { id: 'ps-002', sku: 'PS-SCF-IV', title: 'Ivory Ring Stole', subtitle: 'Featherweight · 200g', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1551381912-4e2e29c7fd17?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 8999, tags: ['luxury', 'stole'], hsn: '6214' },
  { id: 'ps-003', sku: 'PS-SWT-RS', title: 'Cashmere Turtleneck', subtitle: 'Merlot · Fine gauge', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1603906650843-b58e94d9df4d?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 19999, tags: ['luxury', 'sweater'], featured: true, hsn: '6110' },
  { id: 'ps-004', sku: 'PS-SCF-BL', title: 'Cobalt Silk-Cashmere Wrap', subtitle: 'Hand-loomed · 80/20 blend', brand: 'PSH', category: 'cashmere', image: 'https://images.unsplash.com/photo-1567636372197-ddf1604d2766?w=800&h=1000&fit=crop&crop=entropy&q=90&auto=format', price: 11999, tags: ['luxury', 'wrap'], hsn: '6214' },
];

export const ALL_PRODUCTS: Product[] = [...books, ...chocolates, ...mishta, ...tech, ...cashmere, ...relayConvenience];

export const PRODUCTS_BY_CATEGORY: Record<Category, Product[]> = {
  manga: [], fiction: [], 'non-fiction': [], children: [], books: [], stationery: [], toys: [],
  confectionery: [], sweets: [], tech: [], cashmere: [], travel: [], gifts: [],
  snacks: [], drinks: [], 'personal-care': [], magazines: [],
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
