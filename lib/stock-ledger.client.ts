import { STOCK_MOVES_KEY, type StockMove } from './stock-ledger';

const endpoint = `/api/erp/${encodeURIComponent(STOCK_MOVES_KEY)}`;

export async function loadMoves(): Promise<StockMove[]> {
  if (typeof window === 'undefined') return [];
  try {
    const res = await fetch(endpoint, { cache: 'no-store' });
    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data.rows) ? (data.rows as StockMove[]) : [];
  } catch {
    return [];
  }
}

export async function appendMoves(moves: StockMove[]): Promise<StockMove[]> {
  if (typeof window === 'undefined') throw new Error('Stock moves can only be posted from the browser.');
  if (moves.length === 0) return loadMoves();

  const existing = await loadMoves();
  const next = [...moves, ...existing];
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows: next }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) {
    throw new Error(data.error || `Stock ledger returned ${res.status}.`);
  }
  return next;
}
