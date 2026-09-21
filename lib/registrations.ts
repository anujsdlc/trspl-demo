import { STORES, stateForCity, type Store } from './stores';
import type { GSTRegistration } from './erp/foundations';

export type TaxComponent = 'cgst-sgst' | 'igst';

export interface TaxSplit {
  component: TaxComponent;
  rate: number;
  taxable: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export interface PlaceOfSupply {
  state: string;
  stateCode: string;
}

export function registrationForStore(
  store: Pick<Store, 'stateCode'>,
  registrations: GSTRegistration[],
): GSTRegistration | undefined {
  return registrations.find(r => r.stateCode === store.stateCode && r.status === 'active');
}

export function registrationForStoreCode(
  storeCode: string,
  registrations: GSTRegistration[],
): GSTRegistration | undefined {
  const store = STORES.find(s => s.code === storeCode || s.id === storeCode);
  return store ? registrationForStore(store, registrations) : undefined;
}

export function storesForRegistration(registration: GSTRegistration): Store[] {
  return STORES.filter(s => s.stateCode === registration.stateCode);
}

export function isInterState(registrationStateCode: string, placeOfSupplyCode: string): boolean {
  return registrationStateCode !== placeOfSupplyCode;
}

function money(n: number): number {
  return Math.round(n * 100) / 100;
}

export function taxSplit(
  taxable: number,
  rate: number,
  registrationStateCode: string,
  placeOfSupplyCode: string,
): TaxSplit {
  const total = money(taxable * (rate / 100));
  if (isInterState(registrationStateCode, placeOfSupplyCode)) {
    return { component: 'igst', rate, taxable: money(taxable), cgst: 0, sgst: 0, igst: total, total };
  }
  const half = money(total / 2);
  return {
    component: 'cgst-sgst',
    rate,
    taxable: money(taxable),
    cgst: money(total - half),
    sgst: half,
    igst: 0,
    total,
  };
}

export function placeOfSupplyForStore(store: Pick<Store, 'state' | 'stateCode'>): PlaceOfSupply {
  return { state: store.state, stateCode: store.stateCode };
}

export function placeOfSupplyForCity(city: string): PlaceOfSupply | undefined {
  return stateForCity(city);
}

export interface CoverageRow {
  registration: GSTRegistration;
  stores: Store[];
  storeCount: number;
}

export interface Coverage {
  rows: CoverageRow[];
  unregistered: { state: string; stateCode: string; stores: Store[] }[];
  empty: GSTRegistration[];
}

export function coverage(registrations: GSTRegistration[]): Coverage {
  const active = registrations.filter(r => r.status === 'active');
  const byState = new Map(active.map(r => [r.stateCode, r]));

  const rows: CoverageRow[] = active.map(registration => {
    const stores = storesForRegistration(registration);
    return { registration, stores, storeCount: stores.length };
  });

  const orphans = new Map<string, { state: string; stateCode: string; stores: Store[] }>();
  for (const store of STORES) {
    if (byState.has(store.stateCode)) continue;
    const bucket = orphans.get(store.stateCode) ?? { state: store.state, stateCode: store.stateCode, stores: [] };
    bucket.stores.push(store);
    orphans.set(store.stateCode, bucket);
  }

  return {
    rows: rows.sort((a, b) => b.storeCount - a.storeCount),
    unregistered: [...orphans.values()].sort((a, b) => b.stores.length - a.stores.length),
    empty: rows.filter(r => r.storeCount === 0).map(r => r.registration),
  };
}
