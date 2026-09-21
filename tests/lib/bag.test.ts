import { describe, it, expect, beforeEach } from 'vitest';
import { loadBag, saveBag, loadOrders, saveOrder, findOrder, newOrderId, type Order } from '@/lib/bag';

function sampleOrder(id: string, subtotal = 500): Order {
  return {
    id,
    placedAt: '2026-09-21T10:00:00.000Z',
    customer: { name: 'A', email: 'a@b.co', phone: '+91 98' },
    delivery: { method: 'pickup', storeCode: 'RLY-BLR-04' },
    payment: { method: 'upi' },
    lines: [],
    subtotal,
    delivery_fee: 0,
    discount: 0,
    total: subtotal,
    pointsEarned: 25,
    status: 'placed',
  };
}

describe('bag persistence', () => {
  it('returns [] when no bag exists', () => {
    expect(loadBag()).toEqual([]);
  });

  it('round-trips items through localStorage', () => {
    saveBag([{ productId: 'bk-1', qty: 2, addedAt: '2026-01-01' }]);
    expect(loadBag()).toEqual([{ productId: 'bk-1', qty: 2, addedAt: '2026-01-01' }]);
  });

  it('recovers gracefully from corrupted JSON', () => {
    localStorage.setItem('trs.bag.v1', '{not json');
    expect(loadBag()).toEqual([]);
  });

  it('fires the trs:bag-changed event so listeners can react', () => {
    let calls = 0;
    const handler = () => { calls += 1; };
    window.addEventListener('trs:bag-changed', handler);
    saveBag([]);
    saveBag([{ productId: 'x', qty: 1, addedAt: '' }]);
    window.removeEventListener('trs:bag-changed', handler);
    expect(calls).toBe(2);
  });
});

describe('orders', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('starts with no orders', () => {
    expect(loadOrders()).toEqual([]);
    expect(findOrder('anything')).toBeUndefined();
  });

  it('stores newest orders at the head of the list', () => {
    saveOrder(sampleOrder('A'));
    saveOrder(sampleOrder('B'));
    const orders = loadOrders();
    expect(orders.map(o => o.id)).toEqual(['B', 'A']);
  });

  it('findOrder retrieves by id', () => {
    saveOrder(sampleOrder('TRS-42', 999));
    const found = findOrder('TRS-42');
    expect(found?.subtotal).toBe(999);
  });
});

describe('newOrderId', () => {
  it('returns TRS-prefixed uppercase ids', () => {
    const id = newOrderId();
    expect(id).toMatch(/^TRS-[A-Z0-9]{5}-[A-Z0-9]{3}$/);
  });

  it('produces unique ids across successive calls', () => {
    const ids = new Set<string>();
    for (let i = 0; i < 30; i += 1) ids.add(newOrderId());
    expect(ids.size).toBe(30);
  });
});
