import 'server-only';
import { storeGet } from './server-store';
import { ensureTradingHistory } from './demo-bootstrap';
import { STOCK_MOVES_KEY, deltaIndex, type StockMove } from './stock-ledger';

export async function getServerMoves(): Promise<StockMove[]> {
  try {
    await ensureTradingHistory();
    const rows = await storeGet<StockMove[]>(STOCK_MOVES_KEY);
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    console.error('[stock-ledger] read failed:', err);
    return [];
  }
}

export async function getServerStockIndex(): Promise<Map<string, number>> {
  return deltaIndex(await getServerMoves());
}
