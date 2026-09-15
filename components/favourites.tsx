'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';

interface FavCtx {
  favs: Set<string>;
  toggle: (id: string) => void;
  isFav: (id: string) => boolean;
  count: number;
}

const Ctx = createContext<FavCtx | null>(null);

const KEY = 'trs.favs.v1';

export function FavouritesProvider({ children }: { children: React.ReactNode }) {
  const [favs, setFavs] = useState<Set<string>>(new Set());

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setFavs(new Set(JSON.parse(raw)));
    } catch {}
  }, []);

  const persist = useCallback((next: Set<string>) => {
    setFavs(next);
    try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch {}
  }, []);

  const toggle = useCallback((id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      try { localStorage.setItem(KEY, JSON.stringify([...next])); } catch {}
      return next;
    });
  }, []);

  const isFav = useCallback((id: string) => favs.has(id), [favs]);

  return (
    <Ctx.Provider value={{ favs, toggle, isFav, count: favs.size }}>
      {children}
    </Ctx.Provider>
  );
}

export function useFavourites() {
  const c = useContext(Ctx);
  if (!c) throw new Error('FavouritesProvider missing');
  return c;
}
