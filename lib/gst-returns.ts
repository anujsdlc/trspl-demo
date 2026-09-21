import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';
import type { InterstateTransfer } from './interstate';
import type { ReplenishmentOrder } from './replenishment';
import { creditSection, type CreditNote } from './credit-notes';
import { taxSplit, isInterState } from './registrations';

export const B2CL_THRESHOLD = 250000;

export type Gstr1Section = 'b2b' | 'b2cl' | 'b2cs' | 'nil' | 'cdnr' | 'cdnur';

export interface Gstr1Row {
  section: Gstr1Section;
  placeOfSupply: string;
  placeOfSupplyCode: string;
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  invoices: number;
  issue?: string;
}

export interface HsnRow {
  hsn: string;
  description: string;
  uqc: string;
  rate: number;
  qty: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface DocumentRow {
  nature: string;
  from: string;
  to: string;
  total: number;
  cancelled: number;
  net: number;
}

export interface Gstr3b {
  outwardTaxable: { taxable: number; igst: number; cgst: number; sgst: number };
  outwardNil: { taxable: number };
  inwardCredit: { igst: number; cgst: number; sgst: number; total: number };
  netPayable: number;
  caveats: string[];
}

export interface EinvoiceCheck {
  orderId: string;
  placedAt: string;
  total: number;
  ready: boolean;
  issues: string[];
}

export interface ReturnPeriod {
  period: string;
}

export function scopeOrders(
  orders: Order[],
  registration: GSTRegistration,
  period: string,
): Order[] {
  return orders.filter(o =>
    o.status !== 'cancelled' &&
    o.tax?.registrationId === registration.id &&
    o.placedAt.slice(0, 7) === period,
  );
}

function lineRate(line: OrderLine): number {
  return line.gstRate ?? 0;
}

export function scopeOutwardTransfers(
  transfers: InterstateTransfer[],
  registration: GSTRegistration,
  period: string,
): InterstateTransfer[] {
  return transfers.filter(t =>
    t.fromRegistrationId === registration.id &&
    (t.status === 'dispatched' || t.status === 'received') &&
    (t.dispatchedAt ?? t.raisedAt).slice(0, 7) === period,
  );
}

export function scopeSupplierBills(
  orders: ReplenishmentOrder[],
  registration: GSTRegistration,
  period: string,
): ReplenishmentOrder[] {
  return orders.filter(o =>
    o.status === 'received' &&
    o.storeStateCode === registration.stateCode &&
    (o.receivedAt ?? o.raisedAt).slice(0, 7) === period,
  );
}

export function scopeInwardTransfers(
  transfers: InterstateTransfer[],
  registration: GSTRegistration,
  period: string,
): InterstateTransfer[] {
  return transfers.filter(t =>
    t.toRegistrationId === registration.id &&
    t.status === 'received' &&
    (t.receivedAt ?? t.raisedAt).slice(0, 7) === period,
  );
}

export function sectionFor(order: Order): 'b2cs' | 'b2cl' | 'nil' {
  const tax = order.tax;
  if (!tax) return 'b2cs';
  const taxed = order.lines.some(l => lineRate(l) > 0);
  if (!taxed) return 'nil';
  const interState = isInterState(tax.supplierStateCode, tax.placeOfSupply.stateCode);
  if (interState && order.total > B2CL_THRESHOLD) return 'b2cl';
  return 'b2cs';
}

export function buildGstr1(
  orders: Order[],
  registration: GSTRegistration,
  transfers: InterstateTransfer[] = [],
  creditNotes: CreditNote[] = [],
): Gstr1Row[] {
  const buckets = new Map<string, Gstr1Row>();

  for (const order of orders) {
    const tax = order.tax;
    if (!tax) continue;
    const section = sectionFor(order);

    const byRate = new Map<number, number>();
    for (const line of order.lines) {
      const rate = lineRate(line);
      byRate.set(rate, (byRate.get(rate) ?? 0) + line.lineTotal);
    }

    for (const [rate, inclusive] of byRate) {
      const taxable = Math.round((inclusive / (1 + rate / 100)) * 100) / 100;
      const split = taxSplit(taxable, rate, tax.supplierStateCode, tax.placeOfSupply.stateCode);
      const effective: Gstr1Section = rate === 0 ? 'nil' : section;
      const key = `${effective}|${tax.placeOfSupply.stateCode}|${rate}`;
      const row = buckets.get(key) ?? {
        section: effective,
        placeOfSupply: tax.placeOfSupply.state,
        placeOfSupplyCode: tax.placeOfSupply.stateCode,
        rate,
        taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0,
      };
      row.taxable = Math.round((row.taxable + split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst + split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst + split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst + split.igst) * 100) / 100;
      row.invoices += 1;
      buckets.set(key, row);
    }
  }

  for (const t of transfers) {
    for (const split of t.splits) {
      if (split.rate === 0) continue;
      const key = `b2b|${t.toStateCode}|${split.rate}`;
      const row = buckets.get(key) ?? {
        section: 'b2b' as Gstr1Section,
        placeOfSupply: t.toState,
        placeOfSupplyCode: t.toStateCode,
        rate: split.rate,
        taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0,
      };
      row.taxable = Math.round((row.taxable + split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst + split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst + split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst + split.igst) * 100) / 100;
      row.invoices += 1;
      buckets.set(key, row);
    }
  }

  for (const note of creditNotes) {
    const where = creditSection(note);
    for (const split of note.splits) {
      if (where === 'b2cs-net') {
        const key = `b2cs|${note.placeOfSupply.stateCode}|${split.rate}`;
        const row = buckets.get(key);
        if (!row) continue;
        row.taxable = Math.round((row.taxable - split.taxable) * 100) / 100;
        row.cgst = Math.round((row.cgst - split.cgst) * 100) / 100;
        row.sgst = Math.round((row.sgst - split.sgst) * 100) / 100;
        row.igst = Math.round((row.igst - split.igst) * 100) / 100;
        continue;
      }

      const key = `${where}|${note.placeOfSupply.stateCode}|${split.rate}`;
      const row = buckets.get(key) ?? {
        section: where as Gstr1Section,
        placeOfSupply: note.placeOfSupply.state,
        placeOfSupplyCode: note.placeOfSupply.stateCode,
        rate: split.rate,
        taxable: 0, cgst: 0, sgst: 0, igst: 0, invoices: 0,
      };
      row.taxable = Math.round((row.taxable - split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst - split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst - split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst - split.igst) * 100) / 100;
      row.invoices += 1;
      buckets.set(key, row);
    }
  }

  const order: Gstr1Section[] = ['b2b', 'b2cl', 'b2cs', 'nil', 'cdnr', 'cdnur'];
  return [...buckets.values()].sort(
    (a, b) => order.indexOf(a.section) - order.indexOf(b.section) || a.rate - b.rate,
  );
}

export function buildHsnSummary(
  orders: Order[],
  registration: GSTRegistration,
  transfers: InterstateTransfer[] = [],
  creditNotes: CreditNote[] = [],
): HsnRow[] {
  const buckets = new Map<string, HsnRow>();

  for (const order of orders) {
    const tax = order.tax;
    if (!tax) continue;
    for (const line of order.lines) {
      const rate = lineRate(line);
      const hsn = line.hsn || '—';
      const key = `${hsn}|${rate}`;
      const taxable = Math.round((line.lineTotal / (1 + rate / 100)) * 100) / 100;
      const split = taxSplit(taxable, rate, tax.supplierStateCode, tax.placeOfSupply.stateCode);
      const row = buckets.get(key) ?? {
        hsn,
        description: line.title,
        uqc: line.uqc || 'NOS',
        rate,
        qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0,
      };
      row.qty += line.qty;
      row.taxable = Math.round((row.taxable + split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst + split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst + split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst + split.igst) * 100) / 100;
      row.total = Math.round((row.taxable + row.cgst + row.sgst + row.igst) * 100) / 100;
      buckets.set(key, row);
    }
  }

  for (const t of transfers) {
    for (const line of t.lines) {
      const hsn = line.hsn || '—';
      const key = `${hsn}|${line.gstRate}`;
      const taxable = Math.round(line.unitPrice * line.qty * 100) / 100;
      const split = taxSplit(taxable, line.gstRate, t.fromStateCode, t.toStateCode);
      const row = buckets.get(key) ?? {
        hsn, description: line.title, uqc: 'NOS', rate: line.gstRate,
        qty: 0, taxable: 0, cgst: 0, sgst: 0, igst: 0, total: 0,
      };
      row.qty += line.qty;
      row.taxable = Math.round((row.taxable + split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst + split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst + split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst + split.igst) * 100) / 100;
      row.total = Math.round((row.taxable + row.cgst + row.sgst + row.igst) * 100) / 100;
      buckets.set(key, row);
    }
  }

  for (const note of creditNotes) {
    for (const line of note.lines) {
      const hsn = line.hsn || '—';
      const key = `${hsn}|${line.gstRate}`;
      const row = buckets.get(key);
      if (!row) continue;
      const taxable = Math.round((line.lineTotal / (1 + line.gstRate / 100)) * 100) / 100;
      const split = taxSplit(taxable, line.gstRate, note.supplierStateCode, note.placeOfSupply.stateCode);
      row.qty -= line.qty;
      row.taxable = Math.round((row.taxable - split.taxable) * 100) / 100;
      row.cgst = Math.round((row.cgst - split.cgst) * 100) / 100;
      row.sgst = Math.round((row.sgst - split.sgst) * 100) / 100;
      row.igst = Math.round((row.igst - split.igst) * 100) / 100;
      row.total = Math.round((row.taxable + row.cgst + row.sgst + row.igst) * 100) / 100;
    }
  }

  return [...buckets.values()].sort((a, b) => b.taxable - a.taxable);
}

export function buildDocumentsIssued(
  orders: Order[],
  transfers: InterstateTransfer[] = [],
  creditNotes: CreditNote[] = [],
): DocumentRow[] {
  const rows: DocumentRow[] = [];

  if (orders.length > 0) {
    const ids = orders.map(o => o.id).sort();
    rows.push({
      nature: 'Invoices for outward supply',
      from: ids[0],
      to: ids[ids.length - 1],
      total: ids.length,
      cancelled: 0,
      net: ids.length,
    });
  }

  if (transfers.length > 0) {
    const nums = transfers.map(t => t.taxInvoiceNo).sort();
    rows.push({
      nature: 'Invoices for outward supply — stock transfer',
      from: nums[0],
      to: nums[nums.length - 1],
      total: nums.length,
      cancelled: 0,
      net: nums.length,
    });
  }

  if (creditNotes.length > 0) {
    const nums = creditNotes.map(n => n.number).sort();
    rows.push({
      nature: 'Credit notes',
      from: nums[0],
      to: nums[nums.length - 1],
      total: nums.length,
      cancelled: 0,
      net: nums.length,
    });
  }

  return rows;
}

export function buildGstr3b(
  rows: Gstr1Row[],
  inwardTransfers: InterstateTransfer[] = [],
  supplierBills: ReplenishmentOrder[] = [],
): Gstr3b {
  const taxed = rows.filter(r => r.rate > 0);
  const nil = rows.filter(r => r.rate === 0);
  const sum = (list: Gstr1Row[], pick: (r: Gstr1Row) => number) =>
    Math.round(list.reduce((t, r) => t + pick(r), 0) * 100) / 100;

  const outwardTaxable = {
    taxable: sum(taxed, r => r.taxable),
    igst: sum(taxed, r => r.igst),
    cgst: sum(taxed, r => r.cgst),
    sgst: sum(taxed, r => r.sgst),
  };

  const round = (n: number) => Math.round(n * 100) / 100;
  const transferIgst = inwardTransfers.reduce((t, x) => t + x.igst, 0);
  const billIgst = supplierBills.reduce((t, x) => t + (x.igst ?? 0), 0);
  const billCgst = supplierBills.reduce((t, x) => t + (x.cgst ?? 0), 0);
  const billSgst = supplierBills.reduce((t, x) => t + (x.sgst ?? 0), 0);

  const inwardCredit = {
    igst: round(transferIgst + billIgst),
    cgst: round(billCgst),
    sgst: round(billSgst),
    total: round(transferIgst + billIgst + billCgst + billSgst),
  };

  const outwardTax = outwardTaxable.igst + outwardTaxable.cgst + outwardTaxable.sgst;

  return {
    outwardTaxable,
    outwardNil: { taxable: sum(nil, r => r.taxable) },
    inwardCredit,
    netPayable: Math.round(Math.max(0, outwardTax - inwardCredit.total) * 100) / 100,
    caveats: [
      'Credit is counted on goods received — distributor purchases and stock from another registration.',
      'Inward supplies liable to reverse charge (3.1(d)) are not tracked.',
      'Filing happens on the portal. This prepares and reconciles the numbers.',
    ],
  };
}

const INVOICE_NUMBER = /^[A-Za-z0-9/-]{1,16}$/;

export function checkEinvoice(order: Order): EinvoiceCheck {
  const issues: string[] = [];

  if (!order.tax) {
    issues.push('No GST registration could be attributed to this order');
  } else if (!order.tax.placeOfSupply.stateCode) {
    issues.push('No place of supply');
  }

  for (const line of order.lines) {
    if (!line.hsn) {
      issues.push(`Line "${line.title}" has no HSN code`);
      break;
    }
  }
  for (const line of order.lines) {
    if (!line.uqc) {
      issues.push(`Line "${line.title}" has no unit of measure`);
      break;
    }
  }

  if (!INVOICE_NUMBER.test(order.id)) {
    issues.push(`Invoice number "${order.id}" is not a form the portal accepts`);
  }
  if (order.total <= 0) {
    issues.push('Invoice total is zero');
  }
  if (order.delivery.method === 'ship' && !order.delivery.pincode) {
    issues.push('Delivered order has no pin code');
  }

  return {
    orderId: order.id,
    placedAt: order.placedAt,
    total: order.total,
    ready: issues.length === 0,
    issues,
  };
}

export function exportGstr1Json(
  rows: Gstr1Row[],
  registration: GSTRegistration,
  period: string,
): Record<string, unknown> {
  const [year, month] = period.split('-');
  const b2cs = rows.filter(r => r.section === 'b2cs' && r.rate > 0).map(r => ({
    sply_ty: r.igst > 0 ? 'INTER' : 'INTRA',
    pos: r.placeOfSupplyCode,
    typ: 'OE',
    rt: r.rate,
    txval: r.taxable,
    iamt: r.igst || undefined,
    camt: r.cgst || undefined,
    samt: r.sgst || undefined,
  }));
  const nil = rows.filter(r => r.rate === 0);

  return {
    gstin: registration.gstin,
    fp: `${month}${year}`,
    version: 'GST3.0.4',
    hash: 'hash',
    b2cs,
    nil: nil.length > 0 ? {
      inv: [{
        sply_ty: 'INTRB2C',
        nil_amt: nil.reduce((t, r) => t + r.taxable, 0),
        expt_amt: 0,
        ngsup_amt: 0,
      }],
    } : undefined,
  };
}
