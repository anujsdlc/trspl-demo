import type { StoreBrand } from './stores';
import { gstinCheckDigit, STATE_BY_CODE } from './tally';

export interface BrandSupplier {
  name: string;
  gstinBase: string;
  stateCode: string;
}

const SUPPLIERS: Record<StoreBrand, BrandSupplier> = {
  RLY: { name: 'Relay Distribution India Pvt Ltd', gstinBase: '07AAGCR4417P1Z', stateCode: '07' },
  CB:  { name: 'Choco Bay Confectionery Pvt Ltd',  gstinBase: '27AAJCC8821M1Z', stateCode: '27' },
  MSH: { name: 'Mishta Sweets & Namkeen LLP',      gstinBase: '19AALFM3390K1Z', stateCode: '19' },
  SML: { name: 'Smilen Gifting Pvt Ltd',           gstinBase: '29AAKCS5512Q1Z', stateCode: '29' },
  PSH: { name: 'Pashma Cashmere Mills Pvt Ltd',    gstinBase: '01AABCP7734J1Z', stateCode: '01' },
  GLD: { name: "Glady's Chocolatier Pvt Ltd",      gstinBase: '30AAFCG6690N1Z', stateCode: '30' },
  MTC: { name: 'Motech Accessories Pvt Ltd',       gstinBase: '33AAHCM2205R1Z', stateCode: '33' },
};

export interface SupplierRegistration {
  name: string;
  gstin: string;
  state: string;
  stateCode: string;
}

export function supplierFor(brand: StoreBrand): SupplierRegistration {
  const s = SUPPLIERS[brand];
  return {
    name: s.name,
    gstin: s.gstinBase + gstinCheckDigit(s.gstinBase),
    state: STATE_BY_CODE[s.stateCode] ?? 'Unknown',
    stateCode: s.stateCode,
  };
}

export function allSuppliers(): SupplierRegistration[] {
  return (Object.keys(SUPPLIERS) as StoreBrand[]).map(supplierFor);
}
