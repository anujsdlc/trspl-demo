'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loadBag, saveBag, type BagItem } from '@/lib/bag';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadUploadedProducts } from '@/lib/inventory-store';

interface BagCtx {
  items: BagItem[];
  count: number;
  subtotal: number;
  add: (productId: string, qty?: number) => void;
  remove: (productId: string) => void;
  updateQty: (productId: string, qty: number) => void;
  clear: () => void;
  isInBag: (productId: string) => boolean;
  productsById: Map<string, Product>;
  productFor: (productId: string) => Product | undefined;
}

const BagContext = createContext<BagCtx | null>(null);

export function BagProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<BagItem[]>([]);
  const [uploaded, setUploaded] = useState<Product[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setItems(loadBag());
    setUploaded(loadUploadedProducts());
    setHydrated(true);
    const onChange = () => setItems(loadBag());
    window.addEventListener('trs:bag-changed', onChange);
    window.addEventListener('storage', onChange);
    return () => {
      window.removeEventListener('trs:bag-changed', onChange);
      window.removeEventListener('storage', onChange);
    };
  }, []);

  const productsById = useMemo(
    () => new Map<string, Product>([...ALL_PRODUCTS, ...uploaded].map(p => [p.id, p])),
    [uploaded]
  );

  const persist = useCallback((next: BagItem[]) => {
    setItems(next);
    saveBag(next);
  }, []);

  const add = useCallback((productId: string, qty = 1) => {
    setItems(prev => {
      const idx = prev.findIndex(i => i.productId === productId);
      let next: BagItem[];
      if (idx >= 0) {
        next = [...prev];
        next[idx] = { ...next[idx], qty: next[idx].qty + qty };
      } else {
        next = [{ productId, qty, addedAt: new Date().toISOString() }, ...prev];
      }
      saveBag(next);
      return next;
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems(prev => {
      const next = prev.filter(i => i.productId !== productId);
      saveBag(next);
      return next;
    });
  }, []);

  const updateQty = useCallback((productId: string, qty: number) => {
    setItems(prev => {
      let next: BagItem[];
      if (qty <= 0) {
        next = prev.filter(i => i.productId !== productId);
      } else {
        next = prev.map(i => i.productId === productId ? { ...i, qty } : i);
      }
      saveBag(next);
      return next;
    });
  }, []);

  const clear = useCallback(() => {
    setItems([]);
    saveBag([]);
  }, []);

  const isInBag = useCallback((id: string) => items.some(i => i.productId === id), [items]);

  const count = useMemo(() => (hydrated ? items.reduce((s, i) => s + i.qty, 0) : 0), [items, hydrated]);
  const subtotal = useMemo(() => items.reduce((s, i) => {
    const p = productsById.get(i.productId);
    return s + (p ? p.price * i.qty : 0);
  }, 0), [items, productsById]);

  const value: BagCtx = {
    items, count, subtotal, add, remove, updateQty, clear, isInBag, productsById,
    productFor: id => productsById.get(id),
  };
  return <BagContext.Provider value={value}>{children}</BagContext.Provider>;
}

export function useBag(): BagCtx {
  const ctx = useContext(BagContext);
  if (!ctx) throw new Error('useBag must be used within BagProvider');
  return ctx;
}
