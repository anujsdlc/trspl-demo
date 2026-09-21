import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';
import type { Store } from './stores';
import { computeOrderTax, type CategoryLookup } from './order-tax';
import { newMoveId, onHand, type StockMove } from './stock-ledger';

export const EXHIBITIONS_KEY = 'trs.exhibitions.v1';

export type ExhibitionStatus = 'draft' | 'running' | 'closed' | 'cancelled';

export type LossReason = 'damaged' | 'shoplifted' | 'sampling' | 'unaccounted';

export const LOSS_REASON_LABEL: Record<LossReason, string> = {
  damaged: 'Damaged on the stall',
  shoplifted: 'Shoplifted',
  sampling: 'Given away as samples',
  unaccounted: 'Unaccounted for',
};

export interface ExhibitionLine {
  productId: string;
  sku: string;
  title: string;
  unitPrice: number;
  gstRate: number;
  hsn?: string;
  qtySent: number;
  qtySold: number;
  qtyReturned: number;
  qtyShort: number;
  lossReason?: LossReason;
}

export type ExpenseCategory = 'stall' | 'staff' | 'transport' | 'fit-out' | 'other';

export interface ExhibitionExpense {
  id: string;
  label: string;
  category: ExpenseCategory;
  amount: number;
}

export interface Exhibition {
  id: string;
  reference: string;
  name: string;
  venue: string;
  city: string;

  storeId: string;
  storeCode: string;
  stallId: string;
  registrationId?: string;
  gstin?: string;

  startDate: string;
  endDate: string;
  status: ExhibitionStatus;

  lines: ExhibitionLine[];
  expenses: ExhibitionExpense[];

  issuedAt?: string;
  closedAt?: string;
  settlementOrderId?: string;
}

export type ExhibitionResult<T> =
  | { ok: true; value: T }
  | { ok: false; reason: string };

function ok<T>(value: T): ExhibitionResult<T> { return { ok: true, value }; }
function no<T>(reason: string): ExhibitionResult<T> { return { ok: false, reason }; }

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export function stallIdFor(exhibitionId: string): string {
  return `stall:${exhibitionId}`;
}

export function createExhibition(input: {
  name: string;
  venue: string;
  city: string;
  store: Store;
  startDate: string;
  endDate: string;
  registrations: GSTRegistration[];
  sequence?: number;
  at?: string;
}): ExhibitionResult<Exhibition> {
  const { name, venue, city, store, startDate, endDate, registrations, sequence = 1, at = new Date().toISOString() } = input;
  if (!name.trim()) return no('A fair needs a name.');
  if (!venue.trim()) return no('A fair needs a venue.');
  if (new Date(endDate) < new Date(startDate)) return no('A fair cannot end before it starts.');

  const registration = registrations.find(r => r.stateCode === store.stateCode && r.status === 'active');
  const year = new Date(at).getFullYear();
  const id = `exh-${Date.now().toString(36)}-${sequence}`;

  return ok({
    id,
    reference: `EXH/${year}/${String(sequence).padStart(4, '0')}`,
    name: name.trim(),
    venue: venue.trim(),
    city,
    storeId: store.id,
    storeCode: store.code,
    stallId: stallIdFor(id),
    registrationId: registration?.id,
    gstin: registration?.gstin,
    startDate,
    endDate,
    status: 'draft',
    lines: [],
    expenses: [],
  });
}

export function issueMoves(
  exhibition: Exhibition,
  stockIndex: Map<string, number>,
  at = new Date().toISOString(),
): ExhibitionResult<StockMove[]> {
  if (exhibition.status === 'closed' || exhibition.status === 'cancelled') {
    return no(`This fair is ${exhibition.status}.`);
  }
  if (exhibition.lines.length === 0) return no('Nothing has been picked for the stall.');

  const moves: StockMove[] = [];
  for (const line of exhibition.lines) {
    if (line.qtySent <= 0) continue;
    const have = onHand(line.productId, exhibition.storeId, stockIndex);
    if (line.qtySent > have) {
      return no(`Only ${have} of ${line.sku} on hand at ${exhibition.storeCode}.`);
    }
    const base = {
      at, productId: line.productId, sku: line.sku,
      ref: exhibition.reference,
      reason: `Issued to ${exhibition.name}`,
    };
    moves.push(
      { ...base, id: newMoveId(), storeId: exhibition.storeId, storeCode: exhibition.storeCode, qty: -line.qtySent, kind: 'transfer-out' },
      { ...base, id: newMoveId(), storeId: exhibition.stallId, storeCode: exhibition.reference, qty: line.qtySent, kind: 'transfer-in' },
    );
  }
  if (moves.length === 0) return no('Nothing to issue.');
  return ok(moves);
}

export function returnMoves(
  exhibition: Exhibition,
  at = new Date().toISOString(),
): ExhibitionResult<StockMove[]> {
  const moves: StockMove[] = [];
  for (const line of exhibition.lines) {
    if (line.qtyReturned <= 0) continue;
    if (line.qtyReturned > line.qtySent - line.qtySold - line.qtyShort) {
      return no(`More of ${line.sku} is being returned than the stall can still hold.`);
    }
    const base = {
      at, productId: line.productId, sku: line.sku,
      ref: exhibition.reference,
      reason: `Returned from ${exhibition.name}`,
    };
    moves.push(
      { ...base, id: newMoveId(), storeId: exhibition.stallId, storeCode: exhibition.reference, qty: -line.qtyReturned, kind: 'transfer-out' },
      { ...base, id: newMoveId(), storeId: exhibition.storeId, storeCode: exhibition.storeCode, qty: line.qtyReturned, kind: 'transfer-in' },
    );
  }
  if (moves.length === 0) return no('Nothing to return.');
  return ok(moves);
}

export function scrapMoves(
  exhibition: Exhibition,
  at = new Date().toISOString(),
): StockMove[] {
  const moves: StockMove[] = [];
  for (const line of exhibition.lines) {
    if (line.qtyShort <= 0) continue;
    moves.push({
      id: newMoveId(),
      at,
      productId: line.productId,
      sku: line.sku,
      storeId: exhibition.stallId,
      storeCode: exhibition.reference,
      qty: -line.qtyShort,
      kind: line.lossReason === 'damaged' ? 'damage' : 'shrinkage',
      reason: LOSS_REASON_LABEL[line.lossReason ?? 'unaccounted'],
      ref: exhibition.reference,
    });
  }
  return moves;
}

export function settle(
  exhibition: Exhibition,
  registrations: GSTRegistration[],
  categoryFor: CategoryLookup,
  at = new Date().toISOString(),
): ExhibitionResult<{ order: Order; moves: StockMove[] }> {
  const sold = exhibition.lines.filter(l => l.qtySold > 0);
  if (sold.length === 0) return no('Nothing was sold at this fair.');
  if (exhibition.settlementOrderId) return no('This fair has already been settled.');

  const lines: OrderLine[] = sold.map(l => ({
    productId: l.productId,
    title: l.title,
    sku: l.sku,
    image: '',
    qty: l.qtySold,
    unitPrice: l.unitPrice,
    lineTotal: money(l.unitPrice * l.qtySold),
    hsn: l.hsn,
    gstRate: l.gstRate,
    uqc: 'NOS',
  }));

  const subtotal = money(lines.reduce((t, l) => t + l.lineTotal, 0));
  const order: Order = {
    id: `${exhibition.reference.replace(/\//g, '-')}-SETTLE`,
    placedAt: at,
    customer: { name: `${exhibition.name} — counter takings`, email: '', phone: '' },
    delivery: { method: 'pickup', storeCode: exhibition.storeCode },
    payment: { method: 'cod' },
    lines,
    subtotal,
    delivery_fee: 0,
    discount: 0,
    total: subtotal,
    pointsEarned: 0,
    status: 'delivered',
  };
  order.tax = computeOrderTax(order, registrations, categoryFor, exhibition.storeCode);

  const moves: StockMove[] = sold.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: exhibition.stallId,
    storeCode: exhibition.reference,
    qty: -l.qtySold,
    kind: 'sale' as const,
    reason: `Sold at ${exhibition.name}`,
    ref: order.id,
  }));

  return ok({ order, moves });
}

export interface Reconciliation {
  sent: number;
  sold: number;
  returned: number;
  short: number;
  unaccounted: number;
  reconciled: boolean;
  missingReasons: string[];
}

export function reconcile(exhibition: Exhibition): Reconciliation {
  let sent = 0, sold = 0, returned = 0, short = 0;
  const missingReasons: string[] = [];

  for (const l of exhibition.lines) {
    sent += l.qtySent;
    sold += l.qtySold;
    returned += l.qtyReturned;
    short += l.qtyShort;
    if (l.qtyShort > 0 && !l.lossReason) missingReasons.push(l.sku);
  }

  const unaccounted = sent - sold - returned - short;
  return {
    sent, sold, returned, short, unaccounted,
    reconciled: unaccounted === 0 && missingReasons.length === 0,
    missingReasons,
  };
}

export interface ExhibitionResultSummary {
  sales: number;
  lossValue: number;
  expenses: number;
  net: number;
}

export function summarise(exhibition: Exhibition): ExhibitionResultSummary {
  const sales = money(exhibition.lines.reduce((t, l) => t + l.unitPrice * l.qtySold, 0));
  const lossValue = money(exhibition.lines.reduce((t, l) => t + l.unitPrice * l.qtyShort, 0));
  const expenses = money(exhibition.expenses.reduce((t, e) => t + e.amount, 0));
  return { sales, lossValue, expenses, net: money(sales - lossValue - expenses) };
}

export function canClose(exhibition: Exhibition): ExhibitionResult<true> {
  if (exhibition.status === 'closed') return no('This fair is already closed.');
  if (exhibition.status === 'cancelled') return no('This fair was cancelled.');

  const r = reconcile(exhibition);
  if (r.unaccounted !== 0) {
    return no(`${Math.abs(r.unaccounted)} ${Math.abs(r.unaccounted) === 1 ? 'unit is' : 'units are'} unaccounted for. Record them as sold, returned or written off first.`);
  }
  if (r.missingReasons.length > 0) {
    return no(`A write-off needs a reason: ${r.missingReasons.join(', ')}.`);
  }
  if (!exhibition.settlementOrderId && r.sold > 0) {
    return no('Settle what the fair sold before closing it.');
  }
  return ok(true as const);
}
