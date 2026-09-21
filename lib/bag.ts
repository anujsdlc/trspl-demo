import { newMoveId, type StockMove } from './stock-ledger';
import type { OrderTax } from './order-tax';

export interface BagItem {
  productId: string;
  qty: number;
  addedAt: string;
  storeCode?: string;
}

const BAG_KEY = 'trs.bag.v1';
const ORDERS_KEY = 'trs.orders.v1';

function isBrowser() { return typeof window !== 'undefined'; }

export function loadBag(): BagItem[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(BAG_KEY);
    return raw ? (JSON.parse(raw) as BagItem[]) : [];
  } catch { return []; }
}

export function saveBag(items: BagItem[]) {
  if (!isBrowser()) return;
  localStorage.setItem(BAG_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event('trs:bag-changed'));
}

export interface OrderLine {
  productId: string;
  title: string;
  sku: string;
  image: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  hsn?: string;
  gstRate?: number;
  uqc?: string;
}

export interface Order {
  id: string;
  placedAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  delivery: {
    method: 'pickup' | 'ship';
    storeCode?: string;
    address?: string;
    pincode?: string;
    city?: string;
  };
  payment: {
    method: 'card' | 'upi' | 'cod';
    maskedCard?: string;
  };
  lines: OrderLine[];
  subtotal: number;
  delivery_fee: number;
  discount: number;
  total: number;
  pointsEarned: number;
  status: 'placed' | 'packing' | 'shipped' | 'delivered' | 'cancelled';
  tax?: OrderTax;
}

export function loadOrders(): Order[] {
  if (!isBrowser()) return [];
  try {
    const raw = localStorage.getItem(ORDERS_KEY);
    return raw ? (JSON.parse(raw) as Order[]) : [];
  } catch { return []; }
}

export function saveOrder(order: Order) {
  if (!isBrowser()) return;
  const rest = loadOrders();
  localStorage.setItem(ORDERS_KEY, JSON.stringify([order, ...rest]));
}

export function findOrder(id: string): Order | undefined {
  return loadOrders().find(o => o.id === id);
}

export const ORDERS_STORE_KEY = 'trs.orders.v1';

export function saleMoves(order: Order, storeIdFor: (code: string) => string | undefined): StockMove[] {
  const storeCode = order.delivery.storeCode;
  if (!storeCode) return [];
  const storeId = storeIdFor(storeCode);
  if (!storeId) return [];
  return order.lines.map(l => ({
    id: newMoveId(),
    at: order.placedAt,
    productId: l.productId,
    sku: l.sku,
    storeId,
    storeCode,
    qty: -l.qty,
    kind: 'sale' as const,
    ref: order.id,
  }));
}

export async function publishOrder(order: Order): Promise<boolean> {
  if (!isBrowser()) return false;
  try {
    const res = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' });
    const data = res.ok ? await res.json() : { rows: null };
    const rows: Order[] = Array.isArray(data.rows) ? data.rows : [];
    const next = [order, ...rows.filter(o => o.id !== order.id)];
    const put = await fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, {
      method: 'PUT',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ rows: next }),
    });
    return put.ok;
  } catch {
    return false;
  }
}

export function newOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TRS-${stamp}-${rand}`;
}
