import { ALL_PRODUCTS, stockFor, type Product } from './products';
import { BASE_MEMBERS } from './members';
import { STORES, type Store } from './stores';
import { gstRateFor } from './gst-rates';
import { computeOrderTax } from './order-tax';
import { newMoveId, transferMoves, type StockMove } from './stock-ledger';
import { buildOrders, receiptMoves, suggest, type ReplenishmentOrder } from './replenishment';
import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';

export interface SeedOptions {
  registrations: GSTRegistration[];
  until?: Date;
  weeks?: number;
  ordersPerDay?: number;
  seed?: number;
}

export interface SeedResult {
  orders: Order[];
  moves: StockMove[];
  replenishment: ReplenishmentOrder[];
}

function mulberry32(a: number) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const FIRST = [
  'Aarav', 'Diya', 'Vivaan', 'Ananya', 'Aditya', 'Ishita', 'Arjun', 'Kavya',
  'Rohan', 'Meera', 'Karan', 'Sneha', 'Rahul', 'Priya', 'Nikhil', 'Tara',
  'Siddharth', 'Nisha', 'Varun', 'Anjali', 'Manish', 'Divya', 'Sameer', 'Ritu',
];
const LAST = [
  'Sharma', 'Iyer', 'Nair', 'Patel', 'Reddy', 'Gupta', 'Menon', 'Desai',
  'Bose', 'Kulkarni', 'Rao', 'Singh', 'Chauhan', 'Pillai', 'Joshi', 'Banerjee',
];

const SHIP_CITIES = ['Delhi', 'Mumbai', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata'];

interface Shopper {
  name: string;
  email: string;
  phone: string;
}

function buildShoppers(rand: () => number, count: number): Shopper[] {
  const people: Shopper[] = [];
  const seen = new Set<string>();
  for (const m of BASE_MEMBERS.slice(0, Math.floor(count * 0.75))) {
    const email = m.email.toLowerCase();
    if (seen.has(email)) continue;
    seen.add(email);
    people.push({ name: m.name, email, phone: m.phone });
  }
  while (people.length < count) {
    const first = FIRST[Math.floor(rand() * FIRST.length)];
    const last = LAST[Math.floor(rand() * LAST.length)];
    const email = `${first}.${last}${people.length}`.toLowerCase() + '@example.com';
    if (seen.has(email)) continue;
    seen.add(email);
    people.push({
      name: `${first} ${last}`,
      email,
      phone: `+91 9${Math.floor(rand() * 900000000 + 100000000)}`,
    });
  }
  return people;
}

function pick<T>(rand: () => number, list: T[]): T {
  return list[Math.floor(rand() * list.length)];
}

function orderId(rand: () => number, n: number): string {
  const stamp = (100000 + n).toString(36).toUpperCase().slice(-5);
  const tail = Math.floor(rand() * 46655).toString(36).toUpperCase().padStart(3, '0');
  return `TRS-${stamp}-${tail}`;
}

function dayWeight(date: Date): number {
  const day = date.getDay();
  if (day === 0 || day === 6) return 1.4;
  if (day === 5) return 1.2;
  return 1;
}

export function generateSeed({
  registrations,
  until = new Date(),
  weeks = 6,
  ordersPerDay = 20,
  seed = 20260921,
}: SeedOptions): SeedResult {
  const rand = mulberry32(seed);
  const shoppers = buildShoppers(rand, 160);

  const byBrand = new Map<string, Product[]>();
  for (const p of ALL_PRODUCTS) {
    const bucket = byBrand.get(p.brand) ?? [];
    bucket.push(p);
    byBrand.set(p.brand, bucket);
  }

  const tradingStores: Store[] = [];
  for (const s of STORES) {
    const weight = s.brand === 'RLY' ? 3 : 1;
    for (let i = 0; i < weight; i++) tradingStores.push(s);
  }

  const categoryFor = (id: string) => ALL_PRODUCTS.find(p => p.id === id)?.category;

  const orders: Order[] = [];
  const moves: StockMove[] = [];
  let counter = 0;

  const shelf = new Map<string, number>();
  const shelfKey = (productId: string, storeId: string) => `${productId}::${storeId}`;
  const available = (productId: string, storeId: string) => {
    const key = shelfKey(productId, storeId);
    if (!shelf.has(key)) shelf.set(key, stockFor(productId, storeId));
    return shelf.get(key)!;
  };
  const takeFromShelf = (productId: string, storeId: string, qty: number) => {
    shelf.set(shelfKey(productId, storeId), available(productId, storeId) - qty);
  };
  const putOnShelf = (productId: string, storeId: string, qty: number) => {
    shelf.set(shelfKey(productId, storeId), available(productId, storeId) + qty);
  };

  const start = new Date(until);
  start.setDate(start.getDate() - weeks * 7);

  for (let d = new Date(start); d <= until; d.setDate(d.getDate() + 1)) {
    const day = new Date(d);
    const target = Math.round(ordersPerDay * dayWeight(day) * (0.7 + rand() * 0.6));

    for (let i = 0; i < target; i++) {
      const store = pick(rand, tradingStores);
      const catalogue = byBrand.get(store.brand);
      if (!catalogue || catalogue.length === 0) continue;

      const lineCount = 1 + Math.floor(rand() * 3);
      const chosen = new Set<Product>();
      for (let l = 0; l < lineCount; l++) chosen.add(pick(rand, catalogue));

      const lines: OrderLine[] = [];
      for (const p of chosen) {
        const want = 1 + Math.floor(rand() * 2);
        const qty = Math.min(want, available(p.id, store.id));
        if (qty <= 0) continue;
        takeFromShelf(p.id, store.id, qty);
        lines.push({
          productId: p.id,
          title: p.title,
          sku: p.sku,
          image: p.image,
          qty,
          unitPrice: p.price,
          lineTotal: p.price * qty,
          hsn: p.hsn,
          gstRate: gstRateFor(p.category),
          uqc: 'NOS',
        });
      }
      if (lines.length === 0) continue;

      const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
      const shipped = rand() < 0.12;
      const deliveryFee = shipped && subtotal < 599 ? 49 : 0;

      const placed = new Date(day);
      placed.setHours(6 + Math.floor(rand() * 16), Math.floor(rand() * 60), 0, 0);
      if (placed > until) continue;

      const ageDays = Math.round((until.getTime() - placed.getTime()) / 86_400_000);
      const status: Order['status'] =
        ageDays > 7 ? 'delivered'
        : ageDays > 3 ? 'shipped'
        : ageDays > 1 ? 'packing'
        : 'placed';

      const shopper = pick(rand, shoppers);
      const paymentRoll = rand();
      counter += 1;

      const order: Order = {
        id: orderId(rand, counter),
        placedAt: placed.toISOString(),
        customer: shopper,
        delivery: shipped
          ? {
              method: 'ship',
              city: pick(rand, SHIP_CITIES),
              address: `${10 + Math.floor(rand() * 90)}, Residency Road`,
              pincode: String(110001 + Math.floor(rand() * 500000)).slice(0, 6),
            }
          : { method: 'pickup', storeCode: store.code },
        payment: paymentRoll < 0.45
          ? { method: 'card', maskedCard: `**** **** **** ${1000 + Math.floor(rand() * 8999)}` }
          : paymentRoll < 0.85
            ? { method: 'upi' }
            : { method: 'cod' },
        lines,
        subtotal,
        delivery_fee: deliveryFee,
        discount: 0,
        total: subtotal + deliveryFee,
        pointsEarned: Math.floor(subtotal * 0.05),
        status,
      };

      order.tax = computeOrderTax(order, registrations, categoryFor, store.code);
      orders.push(order);

      for (const line of lines) {
        moves.push({
          id: newMoveId(),
          at: order.placedAt,
          productId: line.productId,
          sku: line.sku,
          storeId: store.id,
          storeCode: store.code,
          qty: -line.qty,
          kind: 'sale',
          ref: order.id,
        });
      }
    }
  }

  const sampleStores = STORES.slice(0, 12);
  for (const store of sampleStores) {
    const catalogue = byBrand.get(store.brand);
    if (!catalogue || catalogue.length === 0) continue;

    const damaged = pick(rand, catalogue);
    const qty = Math.min(1 + Math.floor(rand() * 3), available(damaged.id, store.id));
    if (qty <= 0) continue;
    takeFromShelf(damaged.id, store.id, qty);
    const when = new Date(until);
    when.setDate(when.getDate() - Math.floor(rand() * weeks * 7));
    moves.push({
      id: newMoveId(),
      at: when.toISOString(),
      productId: damaged.id,
      sku: damaged.sku,
      storeId: store.id,
      storeCode: store.code,
      qty: -qty,
      kind: rand() < 0.5 ? 'damage' : 'shrinkage',
      reason: rand() < 0.5 ? 'Damaged in transit' : 'Shop-floor shrinkage',
    });
  }

  for (let i = 0; i < 6; i++) {
    const from = pick(rand, STORES);
    const to = STORES.find(s => s.brand === from.brand && s.id !== from.id);
    const catalogue = byBrand.get(from.brand);
    if (!to || !catalogue || catalogue.length === 0) continue;
    const product = pick(rand, catalogue);
    const qty = Math.min(2 + Math.floor(rand() * 8), available(product.id, from.id));
    if (qty <= 0) continue;
    takeFromShelf(product.id, from.id, qty);
    putOnShelf(product.id, to.id, qty);
    const when = new Date(until);
    when.setDate(when.getDate() - Math.floor(rand() * 14));
    moves.push(...transferMoves({
      productId: product.id,
      sku: product.sku,
      from: { storeId: from.id, storeCode: from.code },
      to: { storeId: to.id, storeCode: to.code },
      qty,
      at: when.toISOString(),
      notes: 'Rebalancing between stores',
    }));
  }

  const stockIndex = new Map<string, number>();
  for (const m of moves) {
    const key = `${m.productId}::${m.storeId}`;
    stockIndex.set(key, (stockIndex.get(key) ?? 0) + m.qty);
  }

  const shortages = suggest({ catalog: ALL_PRODUCTS, stockIndex, orders: [] }).slice(0, 40);
  const replenishment = buildOrders(shortages, new Date(until).toISOString());

  replenishment.forEach((order, i) => {
    const raised = new Date(until);
    raised.setDate(raised.getDate() - (3 + (i % 10)));
    order.raisedAt = raised.toISOString();

    if (i % 3 === 0) {
      const received = new Date(raised);
      received.setDate(received.getDate() + 2);
      order.status = 'received';
      order.receivedAt = received.toISOString();
      for (const line of order.lines) putOnShelf(line.productId, order.storeId, line.qty);
      moves.push(...receiptMoves(order, received.toISOString()));
    } else if (i % 3 === 1) {
      order.status = 'placed';
    }
  });

  moves.sort((a, b) => b.at.localeCompare(a.at));
  orders.sort((a, b) => b.placedAt.localeCompare(a.placedAt));

  return { orders, moves, replenishment };
}
