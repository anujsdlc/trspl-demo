import type { Order } from './bag';
import type { CreditNote } from './credit-notes';
import type { InterstateTransfer } from './interstate';
import type { GSTRegistration } from './erp/foundations';
import { STORES, BRAND_META, type Store } from './stores';

export type DocumentKind = 'tax-invoice' | 'credit-note' | 'delivery-challan';

export const DOCUMENT_TITLE: Record<DocumentKind, string> = {
  'tax-invoice': 'Tax Invoice',
  'credit-note': 'Credit Note',
  'delivery-challan': 'Delivery Challan',
};

export interface Party {
  name: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
  address?: string;
  lines: string[];
}

export interface DocumentLine {
  description: string;
  sku: string;
  hsn: string;
  qty: number;
  uqc: string;
  unitPrice: number;
  taxableValue: number;
  rate: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface PrintDocument {
  kind: DocumentKind;
  title: string;
  number: string;
  date: string;
  against?: string;

  seller: Party;
  buyer: Party;
  origin?: { brand: string; storeCode: string; location: string; airportCode?: string };

  placeOfSupply?: string;
  reverseCharge: boolean;

  lines: DocumentLine[];
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  roundOff: number;
  total: number;
  amountInWords: string;

  transport?: { ewayBillNo?: string; vehicleNo?: string; transporter?: string };
  notes: string[];
}

const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen',
  'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function twoDigits(n: number): string {
  if (n < 20) return ONES[n];
  const t = Math.floor(n / 10);
  const o = n % 10;
  return TENS[t] + (o ? ` ${ONES[o]}` : '');
}

export function amountInWords(amount: number): string {
  const rupees = Math.floor(Math.abs(amount));
  const paise = Math.round((Math.abs(amount) - rupees) * 100);

  if (rupees === 0 && paise === 0) return 'Rupees Zero only';

  const parts: string[] = [];
  const crore = Math.floor(rupees / 10000000);
  const lakh = Math.floor((rupees % 10000000) / 100000);
  const thousand = Math.floor((rupees % 100000) / 1000);
  const hundred = Math.floor((rupees % 1000) / 100);
  const rest = rupees % 100;

  if (crore) parts.push(`${twoDigits(crore)} Crore`);
  if (lakh) parts.push(`${twoDigits(lakh)} Lakh`);
  if (thousand) parts.push(`${twoDigits(thousand)} Thousand`);
  if (hundred) parts.push(`${ONES[hundred]} Hundred`);
  if (rest) parts.push(twoDigits(rest));

  const head = parts.length > 0 ? parts.join(' ') : 'Zero';
  const sign = amount < 0 ? 'Minus ' : '';
  const tail = paise > 0 ? ` and ${twoDigits(paise)} Paise` : '';
  return `${sign}Rupees ${head}${tail} only`;
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

function sellerFrom(registration: GSTRegistration): Party {
  return {
    name: registration.legalName,
    gstin: registration.gstin,
    state: registration.state,
    stateCode: registration.stateCode,
    address: registration.address,
    lines: [registration.address, `${registration.state} ${registration.pincode}`].filter(Boolean),
  };
}

function originFrom(store: Store | undefined) {
  if (!store) return undefined;
  return {
    brand: BRAND_META[store.brand].name,
    storeCode: store.code,
    location: store.location,
    airportCode: store.airportCode,
  };
}

export function invoiceFromOrder(
  order: Order,
  registrations: GSTRegistration[],
): PrintDocument | undefined {
  const tax = order.tax;
  if (!tax) return undefined;
  const registration = registrations.find(r => r.id === tax.registrationId);
  if (!registration) return undefined;

  const store = order.delivery.method === 'pickup'
    ? STORES.find(s => s.code === order.delivery.storeCode)
    : undefined;

  const lines: DocumentLine[] = order.lines.map(l => {
    const rate = l.gstRate ?? 0;
    const taxableValue = money(l.lineTotal / (1 + rate / 100));
    const taxAmount = money(l.lineTotal - taxableValue);
    const interState = tax.igst > 0;
    return {
      description: l.title,
      sku: l.sku,
      hsn: l.hsn ?? '—',
      qty: l.qty,
      uqc: l.uqc ?? 'NOS',
      unitPrice: l.unitPrice,
      taxableValue,
      rate,
      cgst: interState ? 0 : money(taxAmount / 2),
      sgst: interState ? 0 : money(taxAmount - money(taxAmount / 2)),
      igst: interState ? taxAmount : 0,
      total: l.lineTotal,
    };
  });

  const taxableValue = money(lines.reduce((t, l) => t + l.taxableValue, 0));
  const cgst = money(lines.reduce((t, l) => t + l.cgst, 0));
  const sgst = money(lines.reduce((t, l) => t + l.sgst, 0));
  const igst = money(lines.reduce((t, l) => t + l.igst, 0));
  const gross = money(taxableValue + cgst + sgst + igst);
  const rounded = Math.round(gross);

  return {
    kind: 'tax-invoice',
    title: DOCUMENT_TITLE['tax-invoice'],
    number: order.id,
    date: order.placedAt,
    seller: sellerFrom(registration),
    buyer: {
      name: order.customer.name || 'Walk-in customer',
      lines: order.delivery.method === 'ship'
        ? [order.delivery.address ?? '', `${order.delivery.city ?? ''} ${order.delivery.pincode ?? ''}`.trim()].filter(Boolean)
        : ['Collected at the counter'],
      state: tax.placeOfSupply.state,
      stateCode: tax.placeOfSupply.stateCode,
    },
    origin: originFrom(store),
    placeOfSupply: `${tax.placeOfSupply.stateCode} — ${tax.placeOfSupply.state}`,
    reverseCharge: false,
    lines,
    taxableValue,
    cgst,
    sgst,
    igst,
    roundOff: money(rounded - gross),
    total: rounded,
    amountInWords: amountInWords(rounded),
    notes: ['Prices are inclusive of GST. Tax shown has been extracted from the amount charged.'],
  };
}

export function documentFromCreditNote(
  note: CreditNote,
  registrations: GSTRegistration[],
): PrintDocument | undefined {
  const registration = registrations.find(r => r.id === note.registrationId);
  if (!registration) return undefined;

  const store = note.restockStoreCode
    ? STORES.find(s => s.code === note.restockStoreCode)
    : undefined;

  const lines: DocumentLine[] = note.lines.map(l => {
    const taxableValue = money(l.lineTotal / (1 + l.gstRate / 100));
    const taxAmount = money(l.lineTotal - taxableValue);
    const interState = note.igst > 0;
    return {
      description: l.title,
      sku: l.sku,
      hsn: l.hsn ?? '—',
      qty: l.qty,
      uqc: l.uqc ?? 'NOS',
      unitPrice: l.unitPrice,
      taxableValue,
      rate: l.gstRate,
      cgst: interState ? 0 : money(taxAmount / 2),
      sgst: interState ? 0 : money(taxAmount - money(taxAmount / 2)),
      igst: interState ? taxAmount : 0,
      total: l.lineTotal,
    };
  });

  const taxableValue = money(lines.reduce((t, l) => t + l.taxableValue, 0));
  const cgst = money(lines.reduce((t, l) => t + l.cgst, 0));
  const sgst = money(lines.reduce((t, l) => t + l.sgst, 0));
  const igst = money(lines.reduce((t, l) => t + l.igst, 0));
  const gross = money(taxableValue + cgst + sgst + igst);
  const rounded = Math.round(gross);

  return {
    kind: 'credit-note',
    title: DOCUMENT_TITLE['credit-note'],
    number: note.number,
    date: note.issuedAt,
    against: note.againstDocument,
    seller: sellerFrom(registration),
    buyer: {
      name: 'Walk-in customer',
      lines: ['Against the document named above'],
      state: note.placeOfSupply.state,
      stateCode: note.placeOfSupply.stateCode,
    },
    origin: originFrom(store),
    placeOfSupply: `${note.placeOfSupply.stateCode} — ${note.placeOfSupply.state}`,
    reverseCharge: false,
    lines,
    taxableValue,
    cgst,
    sgst,
    igst,
    roundOff: money(rounded - gross),
    total: rounded,
    amountInWords: amountInWords(rounded),
    notes: [`Raised because: ${note.reason.replace('-', ' ')}.`],
  };
}

export function documentFromTransfer(
  transfer: InterstateTransfer,
  registrations: GSTRegistration[],
): PrintDocument | undefined {
  const seller = registrations.find(r => r.id === transfer.fromRegistrationId);
  const buyer = registrations.find(r => r.id === transfer.toRegistrationId);
  if (!seller || !buyer) return undefined;

  const store = STORES.find(s => s.id === transfer.fromStoreId);

  const lines: DocumentLine[] = transfer.lines.map(l => {
    const taxableValue = money(l.unitPrice * l.qty);
    return {
      description: l.title,
      sku: l.sku,
      hsn: l.hsn ?? '—',
      qty: l.qty,
      uqc: 'NOS',
      unitPrice: l.unitPrice,
      taxableValue,
      rate: l.gstRate,
      cgst: 0,
      sgst: 0,
      igst: money(taxableValue * (l.gstRate / 100)),
      total: money(taxableValue * (1 + l.gstRate / 100)),
    };
  });

  const gross = money(transfer.taxableValue + transfer.igst);
  const rounded = Math.round(gross);

  return {
    kind: 'delivery-challan',
    title: `${DOCUMENT_TITLE['tax-invoice']} & ${DOCUMENT_TITLE['delivery-challan']}`,
    number: transfer.taxInvoiceNo,
    date: transfer.dispatchedAt ?? transfer.raisedAt,
    against: transfer.reference,
    seller: sellerFrom(seller),
    buyer: {
      name: buyer.legalName,
      gstin: buyer.gstin,
      state: buyer.state,
      stateCode: buyer.stateCode,
      address: buyer.address,
      lines: [buyer.address, `${buyer.state} ${buyer.pincode}`].filter(Boolean),
    },
    origin: originFrom(store),
    placeOfSupply: `${transfer.toStateCode} — ${transfer.toState}`,
    reverseCharge: false,
    lines,
    taxableValue: transfer.taxableValue,
    cgst: 0,
    sgst: 0,
    igst: transfer.igst,
    roundOff: money(rounded - gross),
    total: rounded,
    amountInWords: amountInWords(rounded),
    transport: {
      ewayBillNo: transfer.ewayBillNo,
      vehicleNo: transfer.vehicleNo,
      transporter: transfer.transporter,
    },
    notes: [
      `Consigned to ${transfer.toStoreCode}.`,
      'Supply between two registrations of the same legal entity. IGST applies.',
    ],
  };
}
