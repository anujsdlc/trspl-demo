import { type Product } from './products';
import { STORES, type StoreBrand } from './stores';
import { onHand, newMoveId, type StockMove } from './stock-ledger';
import { gstRateFor } from './gst-rates';
import { taxSplit, type TaxSplit } from './registrations';
import { supplierFor } from './suppliers';

export const REPLENISHMENT_KEY = 'trs.replenishment.orders.v1';

const REORDER_LEVELS: Record<string, number> = {
  bk: 8, cb: 20, ms: 15, mt: 5, ps: 3, sm: 12, gld: 8,
};

export function reorderLevel(productId: string): number {
  return REORDER_LEVELS[productId.split('-')[0]] ?? 10;
}

export function targetLevel(productId: string): number {
  return reorderLevel(productId) * 2;
}

export interface Suggestion {
  productId: string;
  sku: string;
  title: string;
  brand: StoreBrand;
  storeId: string;
  storeCode: string;
  storeLocation: string;
  onHand: number;
  reorderAt: number;
  onOrder: number;
  suggestedQty: number;
  unitPrice: number;
  gstRate: number;
}

export type ReplenishmentStatus = 'draft' | 'placed' | 'received' | 'cancelled';

export interface ReplenishmentLine {
  productId: string;
  sku: string;
  title: string;
  qty: number;
  unitPrice: number;
  gstRate: number;
}

export interface ReplenishmentOrder {
  id: string;
  reference: string;
  supplier: string;
  supplierGstin?: string;
  supplierState?: string;
  supplierStateCode?: string;
  brand: StoreBrand;
  storeId: string;
  storeCode: string;
  storeLocation: string;
  storeStateCode?: string;
  raisedAt: string;
  receivedAt?: string;
  status: ReplenishmentStatus;
  lines: ReplenishmentLine[];
  splits?: TaxSplit[];
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  total: number;
}

export function onOrderIndex(orders: ReplenishmentOrder[]): Map<string, number> {
  const index = new Map<string, number>();
  for (const o of orders) {
    if (o.status !== 'draft' && o.status !== 'placed') continue;
    for (const l of o.lines) {
      const key = `${l.productId}::${o.storeId}`;
      index.set(key, (index.get(key) ?? 0) + l.qty);
    }
  }
  return index;
}

export interface SuggestOptions {
  catalog: Product[];
  stockIndex: Map<string, number>;
  orders: ReplenishmentOrder[];
  brands?: StoreBrand[];
  storeIds?: string[];
}

export function suggest({ catalog, stockIndex, orders, brands = [], storeIds = [] }: SuggestOptions): Suggestion[] {
  const onOrder = onOrderIndex(orders);
  const rows: Suggestion[] = [];

  const stores = STORES.filter(s => {
    if (brands.length > 0 && !brands.includes(s.brand)) return false;
    if (storeIds.length > 0 && !storeIds.includes(s.id)) return false;
    return true;
  });

  for (const product of catalog) {
    for (const store of stores) {
      if (store.brand !== product.brand) continue;
      const have = onHand(product.id, store.id, stockIndex);
      const reorderAt = reorderLevel(product.id);
      if (have > reorderAt) continue;

      const already = onOrder.get(`${product.id}::${store.id}`) ?? 0;
      const suggestedQty = targetLevel(product.id) - have - already;
      if (suggestedQty <= 0) continue;

      rows.push({
        productId: product.id,
        sku: product.sku,
        title: product.title,
        brand: product.brand,
        storeId: store.id,
        storeCode: store.code,
        storeLocation: store.location,
        onHand: have,
        reorderAt,
        onOrder: already,
        suggestedQty,
        unitPrice: product.price,
        gstRate: gstRateFor(product.category),
      });
    }
  }

  return rows.sort((a, b) => (a.onHand - a.reorderAt) - (b.onHand - b.reorderAt));
}

export function buildOrders(rows: Suggestion[], at = new Date().toISOString()): ReplenishmentOrder[] {
  const grouped = new Map<string, Suggestion[]>();
  for (const r of rows) {
    const key = `${r.storeId}::${r.brand}`;
    const bucket = grouped.get(key) ?? [];
    bucket.push(r);
    grouped.set(key, bucket);
  }

  const stamp = Date.now().toString(36).toUpperCase().slice(-4);
  let seq = 0;

  return [...grouped.values()].map(bucket => {
    seq += 1;
    const head = bucket[0];
    const store = STORES.find(s => s.id === head.storeId);
    const supplier = supplierFor(head.brand);

    const lines: ReplenishmentLine[] = bucket.map(r => ({
      productId: r.productId,
      sku: r.sku,
      title: r.title,
      qty: r.suggestedQty,
      unitPrice: r.unitPrice,
      gstRate: r.gstRate,
    }));

    const byRate = new Map<number, number>();
    for (const l of lines) byRate.set(l.gstRate, (byRate.get(l.gstRate) ?? 0) + l.qty * l.unitPrice);

    const splits: TaxSplit[] = [];
    for (const [rate, taxable] of [...byRate.entries()].sort((a, b) => a[0] - b[0])) {
      splits.push(taxSplit(taxable, rate, supplier.stateCode, store?.stateCode ?? supplier.stateCode));
    }
    const round = (n: number) => Math.round(n * 100) / 100;
    const taxableValue = round(splits.reduce((t, x) => t + x.taxable, 0));
    const cgst = round(splits.reduce((t, x) => t + x.cgst, 0));
    const sgst = round(splits.reduce((t, x) => t + x.sgst, 0));
    const igst = round(splits.reduce((t, x) => t + x.igst, 0));

    return {
      id: `rep-${stamp}-${seq}`,
      reference: `REP-${stamp}-${String(seq).padStart(2, '0')}`,
      supplier: supplier.name,
      supplierGstin: supplier.gstin,
      supplierState: supplier.state,
      supplierStateCode: supplier.stateCode,
      brand: head.brand,
      storeId: head.storeId,
      storeCode: head.storeCode,
      storeLocation: head.storeLocation,
      storeStateCode: store?.stateCode,
      raisedAt: at,
      status: 'draft',
      lines,
      splits,
      taxableValue,
      cgst,
      sgst,
      igst,
      total: round(taxableValue + cgst + sgst + igst),
    };
  });
}

export function receiptMoves(order: ReplenishmentOrder, at = new Date().toISOString()): StockMove[] {
  return order.lines.map(l => ({
    id: newMoveId(),
    at,
    productId: l.productId,
    sku: l.sku,
    storeId: order.storeId,
    storeCode: order.storeCode,
    qty: l.qty,
    kind: 'receipt' as const,
    reason: `Replenishment from ${order.supplier}`,
    ref: order.reference,
  }));
}
