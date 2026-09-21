'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES } from '@/lib/stores';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import { loadMoves, appendMoves } from '@/lib/stock-ledger.client';
import { deltaIndex, onHand } from '@/lib/stock-ledger';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { gstRateFor } from '@/lib/gst-rates';
import {
  EXHIBITIONS_KEY,
  LOSS_REASON_LABEL,
  createExhibition,
  issueMoves,
  returnMoves,
  scrapMoves,
  settle,
  reconcile,
  summarise,
  canClose,
  type Exhibition,
  type ExhibitionLine,
  type LossReason,
  type ExpenseCategory,
} from '@/lib/exhibition';
import { inr } from '@/lib/utils';
import {
  RefreshCw,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  ArrowLeft,
  Plus,
  Trash2,
  Tent,
  Truck,
  Undo2,
  Receipt,
  Lock,
  PackageX,
} from 'lucide-react';

const endpoint = `/api/erp/${encodeURIComponent(EXHIBITIONS_KEY)}`;
const ordersEndpoint = `/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`;

async function readRows<T>(url: string): Promise<T[]> {
  const res = await fetch(url, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as T[]) : [];
}

async function writeRows(url: string, rows: unknown[]): Promise<void> {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Store returned ${res.status}.`);
}

const EXPENSE_CATEGORIES: ExpenseCategory[] = ['stall', 'staff', 'transport', 'fit-out', 'other'];

export function ExhibitionConsole() {
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  const [fairs, setFairs] = useState<Exhibition[]>([]);
  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [venue, setVenue] = useState('');
  const [storeId, setStoreId] = useState(STORES[0].id);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(1);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, gst, rows, moves] = await Promise.all([
        loadClientCatalog(), loadGST(), readRows<Exhibition>(endpoint), loadMoves(),
      ]);
      setCatalog(cat);
      setRegistrations(gst);
      setFairs(rows);
      setStockIndex(deltaIndex(moves));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the fairs.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const store = STORES.find(s => s.id === storeId)!;
  const open = fairs.find(f => f.id === openId);

  const persist = async (rows: Exhibition[]) => {
    await writeRows(endpoint, rows);
    setFairs(rows);
  };

  const create = async () => {
    setBusy(true);
    setError(null);
    const res = createExhibition({
      name, venue, city: store.city, store, startDate, endDate,
      registrations, sequence: fairs.length + 1,
    });
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      await persist([res.value, ...fairs]);
      setOpenId(res.value.id);
      setName(''); setVenue(''); setStartDate(''); setEndDate('');
      setNotice(`${res.value.reference} created — pick what goes on the stall.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The fair was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const update = async (id: string, patch: Partial<Exhibition>) => {
    const next = fairs.map(f => (f.id === id ? { ...f, ...patch } : f));
    try {
      await persist(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The change was not saved.');
    }
  };

  const setLine = (id: string, productId: string, patch: Partial<ExhibitionLine>) => {
    const fair = fairs.find(f => f.id === id);
    if (!fair) return;
    update(id, { lines: fair.lines.map(l => (l.productId === productId ? { ...l, ...patch } : l)) });
  };

  const addLine = () => {
    if (!open) return;
    const product = catalog.find(p => p.sku === sku);
    if (!product) return;
    const have = onHand(product.id, open.storeId, stockIndex);
    if (qty > have) { setError(`Only ${have} of ${product.sku} on hand at ${open.storeCode}.`); return; }
    setError(null);
    update(open.id, {
      lines: [
        ...open.lines.filter(l => l.productId !== product.id),
        {
          productId: product.id, sku: product.sku, title: product.title,
          unitPrice: product.price, gstRate: gstRateFor(product.category), hsn: product.hsn,
          qtySent: qty, qtySold: 0, qtyReturned: 0, qtyShort: 0,
        },
      ],
    });
    setSku(''); setQty(1);
  };

  const doIssue = async () => {
    if (!open) return;
    setBusy(true);
    setError(null);
    const res = issueMoves(open, stockIndex);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      const all = await appendMoves(res.value);
      setStockIndex(deltaIndex(all));
      await update(open.id, { status: 'running', issuedAt: new Date().toISOString() });
      setNotice(`Stock issued to ${open.reference} — it is on the stall now.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The stock was not issued.');
    } finally {
      setBusy(false);
    }
  };

  const doReturn = async () => {
    if (!open) return;
    setBusy(true);
    setError(null);
    const res = returnMoves(open);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      const all = await appendMoves(res.value);
      setStockIndex(deltaIndex(all));
      setNotice(`Unsold stock returned to ${open.storeCode}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The stock was not returned.');
    } finally {
      setBusy(false);
    }
  };

  const doScrap = async () => {
    if (!open) return;
    const moves = scrapMoves(open);
    if (moves.length === 0) { setError('Nothing is recorded as short.'); return; }
    if (open.lines.some(l => l.qtyShort > 0 && !l.lossReason)) {
      setError('Give every shortfall a reason before writing it off.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const all = await appendMoves(moves);
      setStockIndex(deltaIndex(all));
      setNotice('Shortfall written off the stall.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The write-off was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const doSettle = async () => {
    if (!open) return;
    setBusy(true);
    setError(null);
    const res = settle(open, registrations, id => catalog.find(p => p.id === id)?.category);
    if (!res.ok) { setError(res.reason); setBusy(false); return; }
    try {
      const orders = await readRows<Order>(ordersEndpoint);
      await writeRows(ordersEndpoint, [res.value.order, ...orders]);
      const all = await appendMoves(res.value.moves);
      setStockIndex(deltaIndex(all));
      await update(open.id, { settlementOrderId: res.value.order.id });
      setNotice(`${open.reference} settled — ${inr(res.value.order.total)} reported under ${open.gstin}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The fair was not settled.');
    } finally {
      setBusy(false);
    }
  };

  const doClose = async () => {
    if (!open) return;
    const guard = canClose(open);
    if (!guard.ok) { setError(guard.reason); return; }
    setBusy(true);
    setError(null);
    try {
      await update(open.id, { status: 'closed', closedAt: new Date().toISOString() });
      setNotice(`${open.reference} closed. Every unit is accounted for.`);
    } finally {
      setBusy(false);
    }
  };

  const addExpense = (label: string, category: ExpenseCategory, amount: number) => {
    if (!open || !label.trim() || amount <= 0) return;
    update(open.id, {
      expenses: [...open.expenses, { id: `ex-${Date.now().toString(36)}`, label: label.trim(), category, amount }],
    });
  };

  const sourceCatalog = useMemo(
    () => open ? catalog.filter(p => p.brand === STORES.find(s => s.id === open.storeId)?.brand) : [],
    [catalog, open],
  );

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin/inventory" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Inventory
      </NextLink>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Field operations</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Exhibitions</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            A fair is stock that leaves a store, trades somewhere else, and comes back short. The stall is its own
            location, so at any moment you can say where the units are — and a fair cannot close until every one of
            them is explained.
          </p>
        </div>
        <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}
      {notice && !error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-sm flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-success)]" />
          <span>{notice}</span>
        </div>
      )}

      <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white mb-6">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">New fair</div>
        <div className="grid md:grid-cols-5 gap-3 items-end">
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Name</div>
            <input value={name} onChange={e => setName(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Venue</div>
            <input value={venue} onChange={e => setVenue(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
          </label>
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Drawn from</div>
            <select value={storeId} onChange={e => setStoreId(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white">
              {STORES.map(s => <option key={s.id} value={s.id}>{s.code} · {s.city}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Starts</div>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
          </label>
          <div className="flex gap-2">
            <label className="block flex-1">
              <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Ends</div>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
            </label>
            <button onClick={create} disabled={busy || !name || !venue || !startDate || !endDate} className="h-9 px-3 self-end bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs disabled:opacity-40">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
        {fairs.length === 0 ? (
          <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">
            No fair has been run yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <Th>Reference</Th><Th>Fair</Th><Th>Drawn from</Th><Th>Dates</Th>
                <Th right>Sent</Th><Th right>Sold</Th><Th right>Back</Th><Th right>Short</Th>
                <Th right>Net</Th><Th>Status</Th>
              </tr>
            </thead>
            <tbody>
              {fairs.map(f => {
                const r = reconcile(f);
                const s = summarise(f);
                return (
                  <Fragment key={f.id}>
                    <tr onClick={() => setOpenId(openId === f.id ? null : f.id)} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/50 cursor-pointer">
                      <Td mono>{f.reference}</Td>
                      <Td>
                        <div>{f.name}</div>
                        <div className="text-[10px] text-[color:var(--color-ink-muted)]">{f.venue}</div>
                      </Td>
                      <Td mono>{f.storeCode}</Td>
                      <Td><span className="text-xs text-[color:var(--color-ink-muted)]">{f.startDate} → {f.endDate}</span></Td>
                      <Td right mono>{r.sent}</Td>
                      <Td right mono>{r.sold}</Td>
                      <Td right mono>{r.returned}</Td>
                      <Td right mono className={r.short > 0 ? 'text-[color:var(--color-danger)]' : ''}>{r.short}</Td>
                      <Td right mono className={s.net < 0 ? 'text-[color:var(--color-danger)]' : ''}>{inr(s.net)}</Td>
                      <Td>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                          f.status === 'closed' ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]' :
                          f.status === 'running' ? 'bg-amber-100 text-amber-800' :
                          'bg-[color:var(--color-ink)]/10'
                        }`}>{f.status}</span>
                      </Td>
                    </tr>

                    {openId === f.id && (
                      <tr className="border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                        <td colSpan={10} className="px-4 py-4">
                          {!r.reconciled && f.status !== 'closed' && (
                            <div className="mb-4 p-3 rounded-md border border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10 text-sm flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-warning)]" />
                              <span>
                                {r.unaccounted !== 0
                                  ? `${Math.abs(r.unaccounted)} ${Math.abs(r.unaccounted) === 1 ? 'unit is' : 'units are'} unaccounted for.`
                                  : `A write-off needs a reason: ${r.missingReasons.join(', ')}.`}
                              </span>
                            </div>
                          )}

                          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Count sheet</div>
                          <div className="border border-[color:var(--color-line)] rounded-lg overflow-hidden bg-white mb-4">
                            <table className="w-full text-sm">
                              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                                <tr>
                                  <Th>Product</Th><Th right>Sent</Th><Th right>Sold</Th>
                                  <Th right>Returned</Th><Th right>Short</Th><Th>Reason</Th><Th right>Value sold</Th>
                                </tr>
                              </thead>
                              <tbody>
                                {f.lines.map(l => (
                                  <tr key={l.productId} className="border-t border-[color:var(--color-line)]">
                                    <Td>
                                      <div className="truncate max-w-[260px]">{l.title}</div>
                                      <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{l.sku}</div>
                                    </Td>
                                    <Td right mono>{l.qtySent}</Td>
                                    <Td right><Num value={l.qtySold} disabled={f.status === 'closed'} onChange={v => setLine(f.id, l.productId, { qtySold: v })} /></Td>
                                    <Td right><Num value={l.qtyReturned} disabled={f.status === 'closed'} onChange={v => setLine(f.id, l.productId, { qtyReturned: v })} /></Td>
                                    <Td right><Num value={l.qtyShort} disabled={f.status === 'closed'} onChange={v => setLine(f.id, l.productId, { qtyShort: v })} /></Td>
                                    <Td>
                                      {l.qtyShort > 0 ? (
                                        <select
                                          value={l.lossReason ?? ''}
                                          disabled={f.status === 'closed'}
                                          onChange={e => setLine(f.id, l.productId, { lossReason: (e.target.value || undefined) as LossReason })}
                                          className="h-8 px-2 border border-[color:var(--color-line)] rounded-md text-xs bg-white"
                                        >
                                          <option value="">Why?</option>
                                          {(Object.keys(LOSS_REASON_LABEL) as LossReason[]).map(k => (
                                            <option key={k} value={k}>{LOSS_REASON_LABEL[k]}</option>
                                          ))}
                                        </select>
                                      ) : <span className="text-xs text-[color:var(--color-ink-muted)]">—</span>}
                                    </Td>
                                    <Td right mono>{inr(l.unitPrice * l.qtySold)}</Td>
                                  </tr>
                                ))}
                                {f.lines.length === 0 && (
                                  <tr><td colSpan={7} className="px-4 py-8 text-center text-xs text-[color:var(--color-ink-muted)]">Nothing picked yet.</td></tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {f.status === 'draft' && (
                            <div className="flex items-end gap-2 flex-wrap mb-4">
                              <label className="block flex-1 min-w-[240px]">
                                <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Add from {f.storeCode}</div>
                                <select value={sku} onChange={e => setSku(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white">
                                  <option value="">Choose a SKU…</option>
                                  {sourceCatalog.slice(0, 200).map(p => (
                                    <option key={p.id} value={p.sku}>
                                      {p.sku} · {p.title} ({onHand(p.id, f.storeId, stockIndex)} on hand)
                                    </option>
                                  ))}
                                </select>
                              </label>
                              <label className="block w-24">
                                <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Send</div>
                                <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm text-center font-mono" />
                              </label>
                              <button onClick={addLine} disabled={!sku} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs bg-white disabled:opacity-40">
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}

                          <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="p-4 rounded-lg border border-[color:var(--color-line)] bg-white">
                              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Result</div>
                              <Money label="Sold" value={inr(s.sales)} />
                              <Money label="Written off" value={`− ${inr(s.lossValue)}`} />
                              <Money label="Expenses" value={`− ${inr(s.expenses)}`} />
                              <div className="pt-2 mt-2 border-t border-[color:var(--color-line)]">
                                <Money label="Net" value={inr(s.net)} strong />
                              </div>
                            </div>

                            <div className="p-4 rounded-lg border border-[color:var(--color-line)] bg-white">
                              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Stall expenses</div>
                              {f.expenses.map(e => (
                                <div key={e.id} className="flex items-center justify-between text-sm py-1">
                                  <span>{e.label} <span className="text-[10px] text-[color:var(--color-ink-muted)]">{e.category}</span></span>
                                  <span className="flex items-center gap-2">
                                    <span className="font-mono">{inr(e.amount)}</span>
                                    {f.status !== 'closed' && (
                                      <button onClick={() => update(f.id, { expenses: f.expenses.filter(x => x.id !== e.id) })} aria-label="Remove expense">
                                        <Trash2 className="w-3 h-3 text-[color:var(--color-ink-muted)]" />
                                      </button>
                                    )}
                                  </span>
                                </div>
                              ))}
                              {f.status !== 'closed' && <ExpenseForm onAdd={addExpense} />}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap">
                            {f.status === 'draft' && (
                              <button onClick={doIssue} disabled={busy} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                                <Truck className="w-3.5 h-3.5" /> Issue stock to the stall
                              </button>
                            )}
                            {f.status === 'running' && (
                              <>
                                <button onClick={doReturn} disabled={busy} className="h-9 px-4 border border-[color:var(--color-line)] rounded-md text-xs bg-white inline-flex items-center gap-1.5 disabled:opacity-50">
                                  <Undo2 className="w-3.5 h-3.5" /> Return unsold
                                </button>
                                <button onClick={doScrap} disabled={busy} className="h-9 px-4 border border-[color:var(--color-line)] rounded-md text-xs bg-white inline-flex items-center gap-1.5 disabled:opacity-50">
                                  <PackageX className="w-3.5 h-3.5" /> Write off the shortfall
                                </button>
                                <button onClick={doSettle} disabled={busy || !!f.settlementOrderId} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                                  <Receipt className="w-3.5 h-3.5" /> {f.settlementOrderId ? 'Settled' : 'Settle the takings'}
                                </button>
                                <button onClick={doClose} disabled={busy} className="h-9 px-4 border border-[color:var(--color-line)] rounded-md text-xs bg-white inline-flex items-center gap-1.5 disabled:opacity-50">
                                  <Lock className="w-3.5 h-3.5" /> Close the fair
                                </button>
                              </>
                            )}
                            {f.settlementOrderId && (
                              <span className="text-xs text-[color:var(--color-ink-muted)] font-mono">{f.settlementOrderId}</span>
                            )}
                            {f.status === 'closed' && (
                              <span className="text-xs text-[color:var(--color-ink-muted)] inline-flex items-center gap-1.5">
                                <Tent className="w-3.5 h-3.5" /> Closed — the record is locked.
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function ExpenseForm({ onAdd }: { onAdd: (label: string, category: ExpenseCategory, amount: number) => void }) {
  const [label, setLabel] = useState('');
  const [category, setCategory] = useState<ExpenseCategory>('stall');
  const [amount, setAmount] = useState(0);
  return (
    <div className="flex items-end gap-1.5 mt-2 pt-2 border-t border-[color:var(--color-line)]">
      <input value={label} onChange={e => setLabel(e.target.value)} placeholder="What for" className="h-8 px-2 flex-1 border border-[color:var(--color-line)] rounded-md text-xs" />
      <select value={category} onChange={e => setCategory(e.target.value as ExpenseCategory)} className="h-8 px-2 border border-[color:var(--color-line)] rounded-md text-xs bg-white">
        {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>
      <input type="number" min={0} value={amount} onChange={e => setAmount(Math.max(0, Number(e.target.value)))} className="h-8 px-2 w-20 border border-[color:var(--color-line)] rounded-md text-xs text-right font-mono" />
      <button
        onClick={() => { onAdd(label, category, amount); setLabel(''); setAmount(0); }}
        disabled={!label.trim() || amount <= 0}
        className="h-8 px-2 border border-[color:var(--color-line)] rounded-md text-xs disabled:opacity-40"
      >
        <Plus className="w-3 h-3" />
      </button>
    </div>
  );
}

function Num({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <input
      type="number"
      min={0}
      value={value}
      disabled={disabled}
      onChange={e => onChange(Math.max(0, Number(e.target.value)))}
      className="h-8 w-16 px-2 border border-[color:var(--color-line)] rounded-md text-sm text-center font-mono disabled:opacity-50 disabled:bg-[color:var(--color-paper)]"
    />
  );
}

function Money({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex justify-between text-sm py-0.5">
      <span className={strong ? '' : 'text-[color:var(--color-ink-muted)]'}>{label}</span>
      <span className={`font-mono ${strong ? 'font-medium' : ''}`}>{value}</span>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-normal ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Td({ children, right, mono, className = '' }: { children?: React.ReactNode; right?: boolean; mono?: boolean; className?: string }) {
  return <td className={`px-4 py-3 ${right ? 'text-right' : ''} ${mono ? 'font-mono text-xs' : ''} ${className}`}>{children}</td>;
}
