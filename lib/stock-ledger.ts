import { stockFor } from './products';
import { STORES } from './stores';

const STORE_IDS = new Set(STORES.map(s => s.id));

export function openingBalance(productId: string, locationId: string): number {
  return STORE_IDS.has(locationId) ? stockFor(productId, locationId) : 0;
}

export const STOCK_MOVES_KEY = 'trs.stock.moves.v1';

export type MoveKind =
  | 'receipt'
  | 'sale'
  | 'adjustment'
  | 'damage'
  | 'shrinkage'
  | 'transfer-out'
  | 'transfer-in'
  | 'return';

export interface StockMove {
  id: string;
  at: string;
  productId: string;
  sku: string;
  storeId: string;
  storeCode: string;
  qty: number;
  kind: MoveKind;
  reason?: string;
  ref?: string;
  notes?: string;
}

export const MOVE_KIND_LABEL: Record<MoveKind, string> = {
  receipt: 'Receipt',
  sale: 'Sale',
  adjustment: 'Adjustment',
  damage: 'Damage',
  shrinkage: 'Shrinkage',
  'transfer-out': 'Transfer out',
  'transfer-in': 'Transfer in',
  return: 'Customer return',
};

export function moveKey(productId: string, storeId: string): string {
  return `${productId}::${storeId}`;
}

export function deltaIndex(moves: StockMove[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const m of moves) {
    const key = moveKey(m.productId, m.storeId);
    index.set(key, (index.get(key) ?? 0) + m.qty);
  }
  return index;
}

export function onHand(productId: string, storeId: string, index: Map<string, number>): number {
  const opening = openingBalance(productId, storeId);
  return Math.max(0, opening + (index.get(moveKey(productId, storeId)) ?? 0));
}

export function onHandAcross(productId: string, storeIds: string[], index: Map<string, number>): number {
  return storeIds.reduce((sum, id) => sum + onHand(productId, id, index), 0);
}

let moveCounter = 0;
export function newMoveId(): string {
  moveCounter += 1;
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 6);
  return `mv-${stamp}-${moveCounter.toString(36)}${rand}`;
}

export function transferMoves(input: {
  productId: string;
  sku: string;
  from: { storeId: string; storeCode: string };
  to: { storeId: string; storeCode: string };
  qty: number;
  ref?: string;
  notes?: string;
  at?: string;
}): [StockMove, StockMove] {
  const at = input.at ?? new Date().toISOString();
  const ref = input.ref ?? `TRF-${Date.now().toString(36).toUpperCase()}`;
  const base = { productId: input.productId, sku: input.sku, at, ref, notes: input.notes };
  return [
    { ...base, id: newMoveId(), storeId: input.from.storeId, storeCode: input.from.storeCode, qty: -Math.abs(input.qty), kind: 'transfer-out' },
    { ...base, id: newMoveId(), storeId: input.to.storeId, storeCode: input.to.storeCode, qty: Math.abs(input.qty), kind: 'transfer-in' },
  ];
}
