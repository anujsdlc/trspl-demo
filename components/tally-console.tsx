'use client';

import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import NextLink from 'next/link';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES } from '@/lib/stores';
import { loadMoves, appendMoves } from '@/lib/stock-ledger.client';
import { deltaIndex, onHand, newMoveId, type StockMove } from '@/lib/stock-ledger';
import { addUploadedProducts } from '@/lib/inventory-store';
import {
  TALLY_BATCHES_KEY, IMPORT_TYPE_LABEL, EXPECTED_COLUMNS,
  parseTally, revalidate, summarise, canImport,
  partiesFrom, itemsFrom, openingFrom,
  type TallyBatch, type TallyImportType,
} from '@/lib/tally';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import {
  RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, ArrowLeft, Upload,
  Download, XCircle, FileInput, PackageCheck,
} from 'lucide-react';

const endpoint = `/api/erp/${encodeURIComponent(TALLY_BATCHES_KEY)}`;
const PARTIES_KEY = 'trs.tally.parties.v1';

async function readBatches(): Promise<TallyBatch[]> {
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) return [];
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as TallyBatch[]) : [];
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

const TYPES: TallyImportType[] = ['parties', 'stock-items', 'opening-stock'];

export function TallyConsole() {
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [batches, setBatches] = useState<TallyBatch[]>([]);
  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [type, setType] = useState<TallyImportType>('parties');
  const [storeCode, setStoreCode] = useState(STORES[0].code);
  const [openId, setOpenId] = useState<string | null>(null);
  const fileInput = useRef<HTMLInputElement>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, rows, moves] = await Promise.all([loadClientCatalog(), readBatches(), loadMoves()]);
      setCatalog(cat);
      setBatches(rows);
      setStockIndex(deltaIndex(moves));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the batches.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const context = useMemo(() => ({
    existingItems: new Set(catalog.map(p => p.title.toLowerCase())),
    existingParties: new Set<string>(),
    itemsWithOpening: new Set(
      batches
        .filter(b => b.type === 'opening-stock' && b.status === 'imported')
        .flatMap(b => b.rows.map(r => (r.raw['Item Name'] ?? '').trim().toLowerCase())),
    ),
  }), [catalog, batches]);

  const open = batches.find(b => b.id === openId);

  const stage = async (file: File) => {
    setBusy(true);
    setError(null);
    try {
      const text = await file.text();
      const parsed = parseTally(text, type, context);
      if (parsed.missingColumns.length > 0) {
        setError(`This file is missing ${parsed.missingColumns.join(', ')} — is it a ${IMPORT_TYPE_LABEL[type]} export?`);
        return;
      }
      const batch: TallyBatch = {
        id: `tb-${Date.now().toString(36)}`,
        reference: `TALLY/${new Date().getFullYear()}/${String(batches.length + 1).padStart(4, '0')}`,
        type,
        fileName: file.name,
        createdAt: new Date().toISOString(),
        status: 'staged',
        rows: parsed.rows,
        ignoredColumns: parsed.ignoredColumns,
        storeCode: type === 'opening-stock' ? storeCode : undefined,
      };
      const next = [batch, ...batches];
      await writeRows(endpoint, next);
      setBatches(next);
      setOpenId(batch.id);
      const s = summarise(batch);
      setNotice(`${batch.reference} staged — ${s.total} rows, ${s.error} with an error, ${s.warning} to look at.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The file could not be read.');
    } finally {
      setBusy(false);
      if (fileInput.current) fileInput.current.value = '';
    }
  };

  const correct = async (batchId: string, rowIndex: number, column: string, value: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch || batch.status !== 'staged') return;
    const rows = batch.rows.map(r =>
      r.index === rowIndex ? { ...r, raw: { ...r.raw, [column]: value } } : r);
    const checked = revalidate({ ...batch, rows }, context);
    const next = batches.map(b => (b.id === batchId ? checked : b));
    setBatches(next);
    try {
      await writeRows(endpoint, next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The correction was not saved.');
    }
  };

  const drop = async (batchId: string, rowIndex: number) => {
    const batch = batches.find(b => b.id === batchId);
    if (!batch || batch.status !== 'staged') return;
    const rows = batch.rows.filter(r => r.index !== rowIndex);
    const next = batches.map(b => (b.id === batchId ? revalidate({ ...batch, rows }, context) : b));
    setBatches(next);
    await writeRows(endpoint, next).catch(() => {});
  };

  const runImport = async (batch: TallyBatch) => {
    const guard = canImport(batch);
    if (!guard.ok) { setError(guard.reason); return; }

    setBusy(true);
    setError(null);
    try {
      let summary = '';

      if (batch.type === 'parties') {
        const parties = partiesFrom(batch);
        const existing = await fetch(`/api/erp/${encodeURIComponent(PARTIES_KEY)}`, { cache: 'no-store' })
          .then(r => (r.ok ? r.json() : { rows: null }))
          .then(d => (Array.isArray(d.rows) ? d.rows : []));
        await writeRows(`/api/erp/${encodeURIComponent(PARTIES_KEY)}`, [...parties, ...existing]);
        const customers = parties.filter(p => p.role === 'customer').length;
        summary = `${parties.length} ledgers — ${customers} customers, ${parties.length - customers} suppliers.`;
      }

      if (batch.type === 'stock-items') {
        const items = itemsFrom(batch);
        await addUploadedProducts(items.map((i, n) => ({
          id: `tally-${batch.id}-${n}`,
          sku: `TLY-${String(n + 1).padStart(4, '0')}`,
          title: i.name,
          subtitle: i.group,
          brand: 'RLY' as const,
          category: 'books' as const,
          image: '',
          price: i.rate,
          tags: [i.group ?? 'tally'].filter(Boolean) as string[],
          isbn: i.isbn,
          newArrival: false,
        })));
        summary = `${items.length} stock items added to the catalogue.`;
      }

      if (batch.type === 'opening-stock') {
        const store = STORES.find(s => s.code === batch.storeCode);
        if (!store) throw new Error('That store no longer exists.');
        const opening = openingFrom(batch);
        const moves: StockMove[] = [];
        const unmatched: string[] = [];
        for (const o of opening) {
          const product = catalog.find(p => p.title.toLowerCase() === o.name.toLowerCase());
          if (!product) { unmatched.push(o.name); continue; }
          const have = onHand(product.id, store.id, stockIndex);
          moves.push({
            id: newMoveId(),
            at: new Date().toISOString(),
            productId: product.id,
            sku: product.sku,
            storeId: store.id,
            storeCode: store.code,
            qty: o.qty - have,
            kind: 'adjustment',
            reason: `Tally opening balance at ${o.unitCost ? inr(o.unitCost) : 'no cost'}`,
            ref: batch.reference,
          });
        }
        if (moves.length > 0) {
          const all = await appendMoves(moves.filter(m => m.qty !== 0));
          setStockIndex(deltaIndex(all));
        }
        summary = `${moves.length} balances counted onto ${store.code}`
          + (unmatched.length > 0 ? `; ${unmatched.length} had no matching item and were skipped.` : '.');
      }

      const next = batches.map(b =>
        b.id === batch.id ? { ...b, status: 'imported' as const, importedAt: new Date().toISOString() } : b);
      await writeRows(endpoint, next);
      setBatches(next);
      setNotice(`${batch.reference} imported — ${summary}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The import did not complete.');
    } finally {
      setBusy(false);
    }
  };

  const cancel = async (batch: TallyBatch) => {
    const next = batches.map(b => (b.id === batch.id ? { ...b, status: 'cancelled' as const } : b));
    setBatches(next);
    await writeRows(endpoint, next).catch(() => {});
  };

  const exportIssues = (batch: TallyBatch) => {
    downloadCSV(
      `${batch.reference.replace(/\//g, '-')}-issues.csv`,
      ['row', 'severity', 'column', 'message'],
      batch.rows.flatMap(r => r.issues.map(i => ({
        row: String(r.index + 2),
        severity: i.severity,
        column: i.column ?? '',
        message: i.message,
      }))),
    );
  };

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin/registrations" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Registrations
      </NextLink>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Migration</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Tally migration</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            A staging area, not a direct importer. Every row is checked before anything reaches the live books —
            a GSTIN that fails its check digit, an ISBN with a transposed pair, the same ledger twice, a second
            opening balance. Rows can be corrected here and re-checked.
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
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Stage an export</div>
        <div className="flex items-end gap-3 flex-wrap">
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">What is in the file</div>
            <select value={type} onChange={e => setType(e.target.value as TallyImportType)} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white min-w-[200px]">
              {TYPES.map(t => <option key={t} value={t}>{IMPORT_TYPE_LABEL[t]}</option>)}
            </select>
          </label>

          {type === 'opening-stock' && (
            <label className="block">
              <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Counted at</div>
              <select value={storeCode} onChange={e => setStoreCode(e.target.value)} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white">
                {STORES.map(s => <option key={s.id} value={s.code}>{s.code} · {s.location}</option>)}
              </select>
            </label>
          )}

          <input
            ref={fileInput}
            type="file"
            accept=".csv,text/csv"
            onChange={e => { const f = e.target.files?.[0]; if (f) stage(f); }}
            className="hidden"
          />
          <button onClick={() => fileInput.current?.click()} disabled={busy} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-2 disabled:opacity-50">
            <Upload className="w-3.5 h-3.5" /> Choose a CSV
          </button>

          <div className="text-xs text-[color:var(--color-ink-muted)] pb-2">
            Expects: {EXPECTED_COLUMNS[type].join(', ')}
          </div>
        </div>
      </div>

      <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
        {batches.length === 0 ? (
          <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">
            <FileInput className="w-8 h-8 mx-auto mb-3 text-[color:var(--color-ink-faint)]" />
            Nothing has been staged yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <Th>Batch</Th><Th>Contains</Th><Th>File</Th>
                <Th right>Rows</Th><Th right>Clean</Th><Th right>Warnings</Th><Th right>Errors</Th>
                <Th>Status</Th><Th right>Action</Th>
              </tr>
            </thead>
            <tbody>
              {batches.map(b => {
                const s = summarise(b);
                return (
                  <Fragment key={b.id}>
                    <tr onClick={() => setOpenId(openId === b.id ? null : b.id)} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/50 cursor-pointer">
                      <Td mono>{b.reference}</Td>
                      <Td>{IMPORT_TYPE_LABEL[b.type]}{b.storeCode && <span className="font-mono text-[10px] text-[color:var(--color-ink-muted)]"> · {b.storeCode}</span>}</Td>
                      <Td><span className="text-xs text-[color:var(--color-ink-muted)]">{b.fileName}</span></Td>
                      <Td right mono>{s.total}</Td>
                      <Td right mono>{s.ok}</Td>
                      <Td right mono className={s.warning > 0 ? 'text-amber-700' : ''}>{s.warning}</Td>
                      <Td right mono className={s.error > 0 ? 'text-[color:var(--color-danger)]' : ''}>{s.error}</Td>
                      <Td>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                          b.status === 'imported' ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]' :
                          b.status === 'cancelled' ? 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]' :
                          'bg-[color:var(--color-ink)]/10'
                        }`}>{b.status}</span>
                      </Td>
                      <Td right>
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {b.status === 'staged' && (
                            <>
                              <button onClick={() => runImport(b)} disabled={busy} className="h-8 px-3 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                                <PackageCheck className="w-3 h-3" /> Import
                              </button>
                              <button onClick={() => cancel(b)} className="h-8 px-2 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)]">
                                <XCircle className="w-3 h-3" />
                              </button>
                            </>
                          )}
                          {b.status === 'imported' && b.importedAt && (
                            <span className="text-xs text-[color:var(--color-ink-muted)]">{new Date(b.importedAt).toLocaleDateString('en-IN')}</span>
                          )}
                        </div>
                      </Td>
                    </tr>

                    {openId === b.id && (
                      <tr className="border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                        <td colSpan={9} className="px-4 py-4">
                          {b.ignoredColumns.length > 0 && (
                            <div className="mb-3 text-xs text-[color:var(--color-ink-muted)]">
                              Columns not used: {b.ignoredColumns.join(', ')}
                            </div>
                          )}
                          {s.error > 0 && (
                            <div className="mb-3 p-3 rounded-md border border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10 text-sm flex items-start gap-2">
                              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-warning)]" />
                              <span>{canImport(b).ok ? '' : (canImport(b) as { reason: string }).reason}</span>
                            </div>
                          )}

                          <div className="flex items-center justify-end mb-2">
                            <button onClick={() => exportIssues(b)} className="h-8 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white">
                              <Download className="w-3 h-3" /> Export the issues
                            </button>
                          </div>

                          <div className="border border-[color:var(--color-line)] rounded-lg overflow-auto bg-white max-h-[480px]">
                            <table className="w-full text-xs">
                              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] sticky top-0">
                                <tr>
                                  <th className="px-3 py-2 text-left font-normal">Row</th>
                                  {EXPECTED_COLUMNS[b.type].map(c => (
                                    <th key={c} className="px-3 py-2 text-left font-normal">{c}</th>
                                  ))}
                                  <th className="px-3 py-2 text-left font-normal">What is wrong</th>
                                  <th className="px-3 py-2"></th>
                                </tr>
                              </thead>
                              <tbody>
                                {b.rows.map(r => (
                                  <tr key={r.index} className={`border-t border-[color:var(--color-line)] ${
                                    r.status === 'error' ? 'bg-[color:var(--color-danger)]/5' :
                                    r.status === 'warning' ? 'bg-amber-50' : ''
                                  }`}>
                                    <td className="px-3 py-2 font-mono text-[color:var(--color-ink-muted)]">{r.index + 2}</td>
                                    {EXPECTED_COLUMNS[b.type].map(c => (
                                      <td key={c} className="px-3 py-1.5">
                                        {b.status === 'staged' ? (
                                          <input
                                            defaultValue={r.raw[c] ?? ''}
                                            onBlur={e => {
                                              if (e.target.value !== (r.raw[c] ?? '')) correct(b.id, r.index, c, e.target.value);
                                            }}
                                            className={`h-7 px-2 w-full min-w-[110px] border rounded text-xs bg-white ${
                                              r.issues.some(i => i.column === c && i.severity === 'error')
                                                ? 'border-[color:var(--color-danger)]'
                                                : r.issues.some(i => i.column === c)
                                                  ? 'border-amber-400'
                                                  : 'border-[color:var(--color-line)]'
                                            }`}
                                          />
                                        ) : (
                                          <span className="font-mono">{r.raw[c] || '—'}</span>
                                        )}
                                      </td>
                                    ))}
                                    <td className="px-3 py-2 text-[color:var(--color-ink-soft)]">
                                      {r.issues.length === 0
                                        ? <span className="text-[color:var(--color-success)]">—</span>
                                        : r.issues.map((i, n) => (
                                            <div key={n} className={i.severity === 'error' ? 'text-[color:var(--color-danger)]' : 'text-amber-700'}>
                                              {i.message}
                                            </div>
                                          ))}
                                    </td>
                                    <td className="px-3 py-2">
                                      {b.status === 'staged' && (
                                        <button onClick={() => drop(b.id, r.index)} aria-label="Drop this row" className="text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)]">
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
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

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-normal ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Td({ children, right, mono, className = '' }: { children?: React.ReactNode; right?: boolean; mono?: boolean; className?: string }) {
  return <td className={`px-4 py-3 ${right ? 'text-right' : ''} ${mono ? 'font-mono text-xs' : ''} ${className}`}>{children}</td>;
}
