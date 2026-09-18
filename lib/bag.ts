// Simple localStorage-backed shopping bag. Every mutation persists so the
// bag survives reloads and the header count stays truthful across tabs.

export interface BagItem {
  productId: string;
  qty: number;
  addedAt: string;
  storeCode?: string; // preferred pickup store
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
  // Notify same-tab listeners.
  window.dispatchEvent(new Event('trs:bag-changed'));
}

// === Orders (placed via checkout) ============================================

export interface OrderLine {
  productId: string;
  title: string;
  sku: string;
  image: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
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

export function newOrderId(): string {
  const stamp = Date.now().toString(36).toUpperCase().slice(-5);
  const rand = Math.random().toString(36).toUpperCase().slice(2, 5);
  return `TRS-${stamp}-${rand}`;
}
