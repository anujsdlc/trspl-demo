import 'server-only';
import { storeGet, storeSet } from './server-store';
import { generateSeed } from './seed-demo';
import { ORDERS_STORE_KEY } from './bag';
import { STOCK_MOVES_KEY } from './stock-ledger';
import { REPLENISHMENT_KEY } from './replenishment';
import { SEED_GST } from './erp/foundations';

export const BOOTSTRAP_KEYS = [ORDERS_STORE_KEY, STOCK_MOVES_KEY, REPLENISHMENT_KEY];

let inFlight: Promise<void> | null = null;

async function fill(): Promise<void> {
  const existing = await storeGet<unknown[]>(ORDERS_STORE_KEY);
  if (Array.isArray(existing) && existing.length > 0) return;

  const { orders, moves, replenishment } = generateSeed({ registrations: SEED_GST });
  await storeSet(ORDERS_STORE_KEY, orders);
  await storeSet(STOCK_MOVES_KEY, moves);
  await storeSet(REPLENISHMENT_KEY, replenishment);
}

export async function ensureTradingHistory(): Promise<void> {
  if (!inFlight) {
    inFlight = fill().catch(err => {
      console.error('[bootstrap] could not open the books:', err);
      inFlight = null;
    });
  }
  await inFlight;
}

export function isBootstrapKey(key: string): boolean {
  return BOOTSTRAP_KEYS.includes(key);
}
