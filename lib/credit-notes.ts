import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';
import type { InterstateTransfer } from './interstate';
import { taxSplit, type TaxSplit } from './registrations';
import { newMoveId, type StockMove } from './stock-ledger';
import { STORES } from './stores';

export const CREDIT_NOTES_KEY = 'trs.credit-notes.v1';

export type CreditReason = 'return' | 'cancellation' | 'price-revision' | 'damage';

export const CREDIT_REASON_LABEL: Record<CreditReason, string> = {
  return: 'Goods returned',
  cancellation: 'Order cancelled after invoicing',
  'price-revision': 'Price revised down',
  damage: 'Damaged in transit',
};

export interface CreditNoteLine {
  productId: string;
  sku: string;
  title: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
  hsn?: string;
  gstRate: number;
  uqc?: string;
}

export type CreditAgainst =
  | { kind: 'order'; orderId: string; section: 'b2cs' | 'b2cl' | 'nil' }
  | { kind: 'transfer'; transferId: string; reference: string };

export interface CreditNote {
  id: string;
  number: string;
  issuedAt: string;

  against: CreditAgainst;
  againstDocument: string;

  registrationId: string;
  gstin: string;
  supplierStateCode: string;
  placeOfSupply: { state: string; stateCode: string };

  reason: CreditReason;
  lines: CreditNoteLine[];
  splits: TaxSplit[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;

  restockStoreId?: string;
  restockStoreCode?: string;
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export type CreditResult =
  | { ok: true; note: CreditNote }
  | { ok: false; reason: string };

export interface CreditAgainstOrderInput {
  order: Order;
  quantities: Record<string, number>;
  reason: CreditReason;
  section: 'b2cs' | 'b2cl' | 'nil';
  existing?: CreditNote[];
  restock?: boolean;
  at?: string;
  sequence?: number;
}

export function creditedQuantities(orderId: string, notes: CreditNote[]): Map<string, number> {
  const used = new Map<string, number>();
  for (const n of notes) {
    if (n.against.kind !== 'order' || n.against.orderId !== orderId) continue;
    for (const l of n.lines) {
      used.set(l.productId, (used.get(l.productId) ?? 0) + l.qty);
    }
  }
  return used;
}

export function creditAgainstOrder({
  order, quantities, reason, section, existing = [],
  restock = true, at = new Date().toISOString(), sequence = 1,
}: CreditAgainstOrderInput): CreditResult {
  const tax = order.tax;
  if (!tax) {
    return { ok: false, reason: 'This order was never attributed to a registration, so nothing can be credited against it.' };
  }
  if (order.status === 'cancelled') {
    return { ok: false, reason: 'This order was cancelled and never invoiced.' };
  }

  const already = creditedQuantities(order.id, existing);
  const lines: CreditNoteLine[] = [];

  for (const line of order.lines as OrderLine[]) {
    const want = Math.floor(quantities[line.productId] ?? 0);
    if (want <= 0) continue;
    const remaining = line.qty - (already.get(line.productId) ?? 0);
    if (remaining <= 0) {
      return { ok: false, reason: `${line.sku} has already been credited in full.` };
    }
    if (want > remaining) {
      return { ok: false, reason: `Only ${remaining} of ${line.sku} is left to credit on ${order.id}.` };
    }
    lines.push({
      productId: line.productId,
      sku: line.sku,
      title: line.title,
      qty: want,
      unitPrice: line.unitPrice,
      lineTotal: money(line.unitPrice * want),
      hsn: line.hsn,
      gstRate: line.gstRate ?? 0,
      uqc: line.uqc,
    });
  }

  if (lines.length === 0) {
    return { ok: false, reason: 'Nothing selected to credit.' };
  }

  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.gstRate, (byRate.get(l.gstRate) ?? 0) + l.lineTotal);

  const splits: TaxSplit[] = [];
  for (const [rate, inclusive] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    const taxable = money(inclusive / (1 + rate / 100));
    splits.push(taxSplit(taxable, rate, tax.supplierStateCode, tax.placeOfSupply.stateCode));
  }

  const sum = (pick: (s: TaxSplit) => number) => money(splits.reduce((t, x) => t + pick(x), 0));
  const storeCode = order.delivery.method === 'pickup' ? order.delivery.storeCode : undefined;
  const store = storeCode ? STORES.find(x => x.code === storeCode) : undefined;
  const year = new Date(at).getFullYear();

  return {
    ok: true,
    note: {
      id: `cn-${Date.now().toString(36)}-${sequence}`,
      number: `CN/${year}/${String(sequence).padStart(4, '0')}`,
      issuedAt: at,
      against: { kind: 'order', orderId: order.id, section },
      againstDocument: order.id,
      registrationId: tax.registrationId,
      gstin: tax.gstin,
      supplierStateCode: tax.supplierStateCode,
      placeOfSupply: tax.placeOfSupply,
      reason,
      lines,
      splits,
      taxable: sum(s => s.taxable),
      cgst: sum(s => s.cgst),
      sgst: sum(s => s.sgst),
      igst: sum(s => s.igst),
      total: money(lines.reduce((t, l) => t + l.lineTotal, 0)),
      restockStoreId: restock && store ? store.id : undefined,
      restockStoreCode: restock && store ? store.code : undefined,
    },
  };
}

export function creditAgainstTransfer(
  transfer: InterstateTransfer,
  quantities: Record<string, number>,
  reason: CreditReason,
  at = new Date().toISOString(),
  sequence = 1,
): CreditResult {
  if (transfer.status === 'draft' || transfer.status === 'cancelled') {
    return { ok: false, reason: 'Nothing has been invoiced on this transfer yet.' };
  }

  const lines: CreditNoteLine[] = [];
  for (const l of transfer.lines) {
    const want = Math.floor(quantities[l.productId] ?? 0);
    if (want <= 0) continue;
    if (want > l.qty) {
      return { ok: false, reason: `Only ${l.qty} of ${l.sku} was sent on ${transfer.reference}.` };
    }
    lines.push({
      productId: l.productId, sku: l.sku, title: l.title, qty: want,
      unitPrice: l.unitPrice, lineTotal: money(l.unitPrice * want),
      hsn: l.hsn, gstRate: l.gstRate, uqc: 'NOS',
    });
  }
  if (lines.length === 0) return { ok: false, reason: 'Nothing selected to credit.' };

  const byRate = new Map<number, number>();
  for (const l of lines) byRate.set(l.gstRate, (byRate.get(l.gstRate) ?? 0) + l.lineTotal);

  const splits: TaxSplit[] = [];
  for (const [rate, taxable] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    splits.push(taxSplit(taxable, rate, transfer.fromStateCode, transfer.toStateCode));
  }
  const sum = (pick: (s: TaxSplit) => number) => money(splits.reduce((t, x) => t + pick(x), 0));
  const year = new Date(at).getFullYear();

  return {
    ok: true,
    note: {
      id: `cn-${Date.now().toString(36)}-${sequence}`,
      number: `CN/${year}/${String(sequence).padStart(4, '0')}`,
      issuedAt: at,
      against: { kind: 'transfer', transferId: transfer.id, reference: transfer.reference },
      againstDocument: transfer.taxInvoiceNo,
      registrationId: transfer.fromRegistrationId,
      gstin: transfer.fromGstin,
      supplierStateCode: transfer.fromStateCode,
      placeOfSupply: { state: transfer.toState, stateCode: transfer.toStateCode },
      reason,
      lines,
      splits,
      taxable: sum(s => s.taxable),
      cgst: sum(s => s.cgst),
      sgst: sum(s => s.sgst),
      igst: sum(s => s.igst),
      total: money(sum(s => s.taxable) + sum(s => s.cgst) + sum(s => s.sgst) + sum(s => s.igst)),
    },
  };
}

export function creditSection(note: CreditNote): 'cdnr' | 'cdnur' | 'b2cs-net' {
  if (note.against.kind === 'transfer') return 'cdnr';
  if (note.against.section === 'b2cl') return 'cdnur';
  return 'b2cs-net';
}

export function restockMoves(note: CreditNote, at = note.issuedAt): StockMove[] {
  if (!note.restockStoreCode || !note.restockStoreId) return [];
  if (note.reason === 'price-revision') return [];
  if (note.reason === 'damage') return [];
  return note.lines.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: note.restockStoreId!,
    storeCode: note.restockStoreCode!,
    qty: l.qty,
    kind: 'return' as const,
    reason: CREDIT_REASON_LABEL[note.reason],
    ref: note.number,
  }));
}

export function scopeCreditNotes(
  notes: CreditNote[],
  registration: GSTRegistration,
  period: string,
): CreditNote[] {
  return notes.filter(n =>
    n.registrationId === registration.id &&
    n.issuedAt.slice(0, 7) === period,
  );
}
