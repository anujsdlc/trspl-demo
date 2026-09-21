import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';
import type { Product } from './products';
import type { Store } from './stores';
import { gstRateFor } from './gst-rates';
import { computeOrderTax } from './order-tax';
import { newMoveId, onHand, type StockMove } from './stock-ledger';

export const TILL_SESSIONS_KEY = 'trs.till.sessions.v1';

export type TillStatus = 'open' | 'closed';
export type TillPayment = 'cash' | 'card' | 'upi';

export interface TillSession {
  id: string;
  reference: string;
  storeId: string;
  storeCode: string;
  storeName: string;
  registrationId?: string;
  gstin?: string;
  cashier: string;
  status: TillStatus;
  openedAt: string;
  closedAt?: string;
  openingFloat: number;
  orderIds: string[];
  countedCash?: number;
  expectedCash?: number;
  difference?: number;
}

export interface TillTotals {
  orders: number;
  units: number;
  takings: number;
  cash: number;
  card: number;
  upi: number;
  expectedCash: number;
}

export type TillResult<T> = { ok: true; value: T } | { ok: false; reason: string };

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export function openSession(
  store: Store,
  cashier: string,
  openingFloat: number,
  sessions: TillSession[],
  registrations: GSTRegistration[],
  at = new Date().toISOString(),
): TillResult<TillSession> {
  if (sessions.some(s => s.storeId === store.id && s.status === 'open')) {
    return { ok: false, reason: `The till at ${store.code} is already open. Close it before starting another shift.` };
  }
  if (!cashier.trim()) {
    return { ok: false, reason: 'A shift needs a cashier.' };
  }
  if (openingFloat < 0) {
    return { ok: false, reason: 'An opening float cannot be negative.' };
  }

  const registration = registrations.find(r => r.stateCode === store.stateCode && r.status === 'active');
  const year = new Date(at).getFullYear();
  const serial = String(sessions.length + 1).padStart(4, '0');

  return {
    ok: true,
    value: {
      id: `till-${Date.now().toString(36)}-${serial}`,
      reference: `POS/${year}/${serial}`,
      storeId: store.id,
      storeCode: store.code,
      storeName: store.location,
      registrationId: registration?.id,
      gstin: registration?.gstin,
      cashier: cashier.trim(),
      status: 'open',
      openedAt: at,
      openingFloat: money(openingFloat),
      orderIds: [],
    },
  };
}

export interface BasketLine {
  product: Product;
  qty: number;
}

export function ringUp(
  session: TillSession,
  store: Store,
  basket: BasketLine[],
  payment: TillPayment,
  registrations: GSTRegistration[],
  stockIndex: Map<string, number>,
  orderId: string,
  at = new Date().toISOString(),
): TillResult<{ order: Order; moves: StockMove[] }> {
  if (session.status !== 'open') {
    return { ok: false, reason: 'This shift is closed.' };
  }
  if (basket.length === 0) {
    return { ok: false, reason: 'Nothing on the counter.' };
  }

  for (const item of basket) {
    if (item.qty <= 0) {
      return { ok: false, reason: `${item.product.sku} needs a quantity of at least one.` };
    }
    const have = onHand(item.product.id, store.id, stockIndex);
    if (item.qty > have) {
      return { ok: false, reason: `Only ${have} of ${item.product.sku} on the shelf at ${store.code}.` };
    }
  }

  const lines: OrderLine[] = basket.map(({ product, qty }) => ({
    productId: product.id,
    title: product.title,
    sku: product.sku,
    image: product.image,
    qty,
    unitPrice: product.price,
    lineTotal: money(product.price * qty),
    hsn: product.hsn,
    gstRate: gstRateFor(product.category),
    uqc: 'NOS',
  }));

  const subtotal = money(lines.reduce((t, l) => t + l.lineTotal, 0));

  const order: Order = {
    id: orderId,
    placedAt: at,
    customer: { name: 'Walk-in', email: '', phone: '' },
    delivery: { method: 'pickup', storeCode: store.code },
    payment: payment === 'cash' ? { method: 'cod' } : { method: payment },
    lines,
    subtotal,
    delivery_fee: 0,
    discount: 0,
    total: subtotal,
    pointsEarned: Math.floor(subtotal * 0.05),
    status: 'delivered',
  };

  order.tax = computeOrderTax(order, registrations, id => basket.find(b => b.product.id === id)?.product.category, store.code);

  const moves: StockMove[] = lines.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: store.id,
    storeCode: store.code,
    qty: -l.qty,
    kind: 'sale' as const,
    reason: `Till ${session.reference}`,
    ref: order.id,
  }));

  return { ok: true, value: { order, moves } };
}

export function tillTotals(session: TillSession, orders: Order[]): TillTotals {
  const mine = orders.filter(o => session.orderIds.includes(o.id) && o.status !== 'cancelled');

  let cash = 0, card = 0, upi = 0, units = 0;
  for (const o of mine) {
    units += o.lines.reduce((t, l) => t + l.qty, 0);
    if (o.payment.method === 'cod') cash += o.total;
    else if (o.payment.method === 'card') card += o.total;
    else upi += o.total;
  }

  return {
    orders: mine.length,
    units,
    takings: money(cash + card + upi),
    cash: money(cash),
    card: money(card),
    upi: money(upi),
    expectedCash: money(session.openingFloat + cash),
  };
}

export function closeSession(
  session: TillSession,
  orders: Order[],
  countedCash: number,
  at = new Date().toISOString(),
): TillResult<TillSession> {
  if (session.status !== 'open') {
    return { ok: false, reason: 'This shift is already closed.' };
  }
  if (!Number.isFinite(countedCash) || countedCash < 0) {
    return { ok: false, reason: 'Count the drawer before closing.' };
  }

  const totals = tillTotals(session, orders);
  return {
    ok: true,
    value: {
      ...session,
      status: 'closed',
      closedAt: at,
      countedCash: money(countedCash),
      expectedCash: totals.expectedCash,
      difference: money(countedCash - totals.expectedCash),
    },
  };
}

export function openSessionFor(storeId: string, sessions: TillSession[]): TillSession | undefined {
  return sessions.find(s => s.storeId === storeId && s.status === 'open');
}

export function newTillOrderId(reference: string, n: number): string {
  const shift = reference.split('/').pop() ?? '0001';
  return `TRS-${shift}-${String(n).padStart(3, '0')}`;
}
