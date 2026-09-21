import type { Order, OrderLine } from './bag';
import type { GSTRegistration } from './erp/foundations';
import type { Category } from './products';
import { STORES } from './stores';
import { gstRateFor, extractTax } from './gst-rates';
import {
  registrationForStoreCode, placeOfSupplyForStore, placeOfSupplyForCity,
  taxSplit, type TaxSplit, type PlaceOfSupply,
} from './registrations';

export interface OrderTax {
  registrationId: string;
  gstin: string;
  tradeName?: string;
  supplierState: string;
  supplierStateCode: string;
  placeOfSupply: PlaceOfSupply;
  splits: TaxSplit[];
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  tax: number;
}

export type CategoryLookup = (productId: string) => Category | undefined;

export function computeOrderTax(
  order: Pick<Order, 'lines' | 'delivery'>,
  registrations: GSTRegistration[],
  categoryFor: CategoryLookup,
  fulfilStoreCode?: string,
): OrderTax | undefined {
  const storeCode = order.delivery.method === 'pickup'
    ? order.delivery.storeCode
    : fulfilStoreCode;
  if (!storeCode) return undefined;

  const store = STORES.find(s => s.code === storeCode || s.id === storeCode);
  if (!store) return undefined;

  const registration = registrationForStoreCode(storeCode, registrations);
  if (!registration) return undefined;

  const place = order.delivery.method === 'pickup'
    ? placeOfSupplyForStore(store)
    : placeOfSupplyForCity(order.delivery.city ?? '');
  if (!place) return undefined;

  const byRate = new Map<number, number>();
  for (const line of order.lines as OrderLine[]) {
    const category = categoryFor(line.productId);
    const rate = category ? gstRateFor(category) : 18;
    byRate.set(rate, (byRate.get(rate) ?? 0) + line.lineTotal);
  }

  const splits: TaxSplit[] = [];
  for (const [rate, inclusive] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
    const { taxable } = extractTax(inclusive, rate);
    splits.push(taxSplit(taxable, rate, registration.stateCode, place.stateCode));
  }

  const sum = (pick: (s: TaxSplit) => number) => Math.round(splits.reduce((t, s) => t + pick(s), 0) * 100) / 100;

  return {
    registrationId: registration.id,
    gstin: registration.gstin,
    tradeName: registration.tradeName,
    supplierState: registration.state,
    supplierStateCode: registration.stateCode,
    placeOfSupply: place,
    splits,
    taxable: sum(s => s.taxable),
    cgst: sum(s => s.cgst),
    sgst: sum(s => s.sgst),
    igst: sum(s => s.igst),
    tax: sum(s => s.total),
  };
}
