import { STORES, type Store } from './stores';
import type { GSTRegistration } from './erp/foundations';
import { registrationForStore, taxSplit, type TaxSplit } from './registrations';
import { newMoveId, onHand, type StockMove } from './stock-ledger';

export const INTERSTATE_KEY = 'trs.interstate.transfers.v1';

export const EWAY_THRESHOLD = 50000;

export type InterstateStatus = 'draft' | 'dispatched' | 'received' | 'cancelled';

export interface InterstateLine {
  productId: string;
  sku: string;
  title: string;
  qty: number;
  unitPrice: number;
  hsn?: string;
  gstRate: number;
}

export interface InterstateTransfer {
  id: string;
  reference: string;
  taxInvoiceNo: string;
  vendorBillNo?: string;

  fromStoreId: string;
  fromStoreCode: string;
  toStoreId: string;
  toStoreCode: string;

  fromRegistrationId: string;
  fromGstin: string;
  fromState: string;
  fromStateCode: string;
  toRegistrationId: string;
  toGstin: string;
  toState: string;
  toStateCode: string;

  lines: InterstateLine[];
  splits: TaxSplit[];
  taxableValue: number;
  igst: number;
  total: number;

  status: InterstateStatus;
  raisedAt: string;
  dispatchedAt?: string;
  receivedAt?: string;

  ewayBillNo?: string;
  ewayBillDate?: string;
  vehicleNo?: string;
  transporter?: string;
}

export const EWAY_PATTERN = /^\d{12}$/;

export function needsEwayBill(total: number): boolean {
  return total > EWAY_THRESHOLD;
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface DraftInput {
  from: Store;
  to: Store;
  lines: InterstateLine[];
  registrations: GSTRegistration[];
  at?: string;
  sequence?: number;
}

export type DraftResult =
  | { ok: true; transfer: InterstateTransfer }
  | { ok: false; reason: string };

export function draftTransfer({
  from, to, lines, registrations, at = new Date().toISOString(), sequence = 1,
}: DraftInput): DraftResult {
  if (from.id === to.id) {
    return { ok: false, reason: 'Source and destination are the same store.' };
  }
  if (from.stateCode === to.stateCode) {
    return {
      ok: false,
      reason: `${from.code} and ${to.code} are both in ${from.state}. Move this as an ordinary store transfer — no tax document is due.`,
    };
  }
  if (lines.length === 0) {
    return { ok: false, reason: 'Nothing to send.' };
  }
  if (lines.some(l => l.qty <= 0)) {
    return { ok: false, reason: 'Every line needs a quantity of at least one.' };
  }

  const fromReg = registrationForStore(from, registrations);
  if (!fromReg) {
    return { ok: false, reason: `${from.state} has no active GST registration, so ${from.code} cannot raise a tax invoice.` };
  }
  const toReg = registrationForStore(to, registrations);
  if (!toReg) {
    return { ok: false, reason: `${to.state} has no active GST registration, so ${to.code} cannot book the bill.` };
  }

  const byRate = new Map<number, number>();
  for (const l of lines) {
    byRate.set(l.gstRate, (byRate.get(l.gstRate) ?? 0) + l.unitPrice * l.qty);
  }

  const splits: TaxSplit[] = [];
  for (const [rate, taxable] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    splits.push(taxSplit(taxable, rate, fromReg.stateCode, toReg.stateCode));
  }

  const taxableValue = money(splits.reduce((t, s) => t + s.taxable, 0));
  const igst = money(splits.reduce((t, s) => t + s.igst, 0));
  const year = new Date(at).getFullYear();
  const serial = String(sequence).padStart(4, '0');

  return {
    ok: true,
    transfer: {
      id: `ist-${Date.now().toString(36)}-${serial}`,
      reference: `IST/${year}/${serial}`,
      taxInvoiceNo: `${fromReg.stateCode}-TI-${year}-${serial}`,

      fromStoreId: from.id,
      fromStoreCode: from.code,
      toStoreId: to.id,
      toStoreCode: to.code,

      fromRegistrationId: fromReg.id,
      fromGstin: fromReg.gstin,
      fromState: fromReg.state,
      fromStateCode: fromReg.stateCode,
      toRegistrationId: toReg.id,
      toGstin: toReg.gstin,
      toState: toReg.state,
      toStateCode: toReg.stateCode,

      lines,
      splits,
      taxableValue,
      igst,
      total: money(taxableValue + igst),

      status: 'draft',
      raisedAt: at,
    },
  };
}

export type GuardResult = { ok: true } | { ok: false; reason: string };

export function canDispatch(
  transfer: InterstateTransfer,
  stockIndex: Map<string, number>,
): GuardResult {
  if (transfer.status !== 'draft') {
    return { ok: false, reason: `This transfer is already ${transfer.status}.` };
  }
  for (const line of transfer.lines) {
    const have = onHand(line.productId, transfer.fromStoreId, stockIndex);
    if (line.qty > have) {
      return { ok: false, reason: `Only ${have} of ${line.sku} on hand at ${transfer.fromStoreCode}.` };
    }
  }
  if (needsEwayBill(transfer.total)) {
    if (!transfer.ewayBillNo) {
      return {
        ok: false,
        reason: `A consignment over ₹${EWAY_THRESHOLD.toLocaleString('en-IN')} cannot move without an e-way bill.`,
      };
    }
    if (!EWAY_PATTERN.test(transfer.ewayBillNo)) {
      return { ok: false, reason: 'An e-way bill number is twelve digits.' };
    }
  }
  return { ok: true };
}

export function canReceive(transfer: InterstateTransfer): GuardResult {
  if (transfer.status !== 'dispatched') {
    return { ok: false, reason: `Only a dispatched transfer can be received; this one is ${transfer.status}.` };
  }
  return { ok: true };
}

export function dispatchMoves(transfer: InterstateTransfer, at: string): StockMove[] {
  return transfer.lines.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: transfer.fromStoreId,
    storeCode: transfer.fromStoreCode,
    qty: -l.qty,
    kind: 'transfer-out' as const,
    reason: `Inter-state transfer to ${transfer.toStoreCode}`,
    ref: transfer.reference,
  }));
}

export function receiptMoves(transfer: InterstateTransfer, at: string): StockMove[] {
  return transfer.lines.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: transfer.toStoreId,
    storeCode: transfer.toStoreCode,
    qty: l.qty,
    kind: 'transfer-in' as const,
    reason: `Inter-state transfer from ${transfer.fromStoreCode}`,
    ref: transfer.reference,
  }));
}

export function inTransit(transfers: InterstateTransfer[]): InterstateTransfer[] {
  return transfers.filter(t => t.status === 'dispatched');
}

export function storeById(id: string): Store | undefined {
  return STORES.find(s => s.id === id);
}
