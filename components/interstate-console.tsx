'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { ALL_PRODUCTS, type Product } from '@/lib/products';
import { loadClientCatalog } from '@/lib/catalog.client';
import { STORES, BRAND_META } from '@/lib/stores';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import { loadMoves, appendMoves } from '@/lib/stock-ledger.client';
import { deltaIndex, onHand } from '@/lib/stock-ledger';
import { gstRateFor } from '@/lib/gst-rates';
import {
  INTERSTATE_KEY, EWAY_THRESHOLD, EWAY_PATTERN, draftTransfer, canDispatch, canReceive,
  dispatchMoves, receiptMoves, needsEwayBill,
  type InterstateTransfer, type InterstateLine,
} from '@/lib/interstate';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import {
  RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, Download, ArrowLeft,
  Truck, PackageCheck, XCircle, Plus, Trash2, FileText, ArrowRight, Printer,
} from 'lucide-react';

const endpoint = `/api/erp/${encodeURIComponent(INTERSTATE_KEY)}`;

async function readTransfers(): Promise<InterstateTransfer[]> {
  const res = await fetch(endpoint, { cache: 'no-store' });
  if (!res.ok) throw new Error(`Transfer store returned ${res.status}.`);
  const data = await res.json();
  return Array.isArray(data.rows) ? (data.rows as InterstateTransfer[]) : [];
}

async function writeTransfers(rows: InterstateTransfer[]): Promise<void> {
  const res = await fetch(endpoint, {
    method: 'PUT',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ rows }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.ok === false) throw new Error(data.error || `Transfer store returned ${res.status}.`);
}

const STATUS_STYLE: Record<InterstateTransfer['status'], string> = {
  draft: 'bg-[color:var(--color-ink)]/10',
  dispatched: 'bg-amber-100 text-amber-800',
  received: 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]',
  cancelled: 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]',
};

export function InterstateConsole() {
  const [catalog, setCatalog] = useState<Product[]>(ALL_PRODUCTS);
  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  const [transfers, setTransfers] = useState<InterstateTransfer[]>([]);
  const [stockIndex, setStockIndex] = useState<Map<string, number>>(new Map());
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const [fromId, setFromId] = useState(STORES[0].id);
  const [toId, setToId] = useState(STORES.find(s => s.stateCode !== STORES[0].stateCode)!.id);
  const [sku, setSku] = useState('');
  const [qty, setQty] = useState(1);
  const [lines, setLines] = useState<InterstateLine[]>([]);
  const [eway, setEway] = useState('');
  const [vehicle, setVehicle] = useState('');
  const [transporter, setTransporter] = useState('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [cat, gst, rows, moves] = await Promise.all([
        loadClientCatalog(), loadGST(), readTransfers(), loadMoves(),
      ]);
      setCatalog(cat);
      setRegistrations(gst);
      setTransfers(rows);
      setStockIndex(deltaIndex(moves));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the transfers.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const from = STORES.find(s => s.id === fromId)!;
  const to = STORES.find(s => s.id === toId)!;

  const sourceCatalog = useMemo(
    () => catalog.filter(p => p.brand === from.brand),
    [catalog, from.brand],
  );

  const addLine = () => {
    const product = sourceCatalog.find(p => p.sku === sku);
    if (!product) return;
    const have = onHand(product.id, from.id, stockIndex);
    if (qty > have) {
      setError(`Only ${have} of ${product.sku} on hand at ${from.code}.`);
      return;
    }
    setError(null);
    setLines(prev => [
      ...prev.filter(l => l.productId !== product.id),
      {
        productId: product.id, sku: product.sku, title: product.title,
        qty, unitPrice: product.price, hsn: product.hsn, gstRate: gstRateFor(product.category),
      },
    ]);
    setSku('');
    setQty(1);
  };

  const preview = useMemo(
    () => draftTransfer({ from, to, lines, registrations, sequence: transfers.length + 1 }),
    [from, to, lines, registrations, transfers.length],
  );

  const raise = async () => {
    if (!preview.ok) return;
    setBusy(true);
    setError(null);
    try {
      const transfer: InterstateTransfer = {
        ...preview.transfer,
        ewayBillNo: eway || undefined,
        ewayBillDate: eway ? new Date().toISOString() : undefined,
        vehicleNo: vehicle || undefined,
        transporter: transporter || undefined,
      };
      const next = [transfer, ...transfers];
      await writeTransfers(next);
      setTransfers(next);
      setLines([]);
      setEway('');
      setVehicle('');
      setTransporter('');
      setNotice(`${transfer.reference} raised — tax invoice ${transfer.taxInvoiceNo} for ${inr(transfer.total)}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The transfer was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const act = async (id: string, action: 'dispatch' | 'receive' | 'cancel') => {
    const transfer = transfers.find(t => t.id === id);
    if (!transfer) return;

    if (action === 'dispatch') {
      const guard = canDispatch(transfer, stockIndex);
      if (!guard.ok) { setError(guard.reason); return; }
    }
    if (action === 'receive') {
      const guard = canReceive(transfer);
      if (!guard.ok) { setError(guard.reason); return; }
    }

    setBusy(true);
    setError(null);
    const previous = transfers;
    const at = new Date().toISOString();

    const updated = transfers.map(t => {
      if (t.id !== id) return t;
      if (action === 'dispatch') return { ...t, status: 'dispatched' as const, dispatchedAt: at };
      if (action === 'receive') {
        return {
          ...t,
          status: 'received' as const,
          receivedAt: at,
          vendorBillNo: `${t.toStateCode}-VB-${new Date(at).getFullYear()}-${t.reference.split('/').pop()}`,
        };
      }
      return { ...t, status: 'cancelled' as const };
    });

    try {
      await writeTransfers(updated);
      setTransfers(updated);

      if (action === 'dispatch') {
        const all = await appendMoves(dispatchMoves(transfer, at));
        setStockIndex(deltaIndex(all));
        setNotice(`${transfer.reference} dispatched — stock left ${transfer.fromStoreCode} and is in transit.`);
      } else if (action === 'receive') {
        const all = await appendMoves(receiptMoves(transfer, at));
        setStockIndex(deltaIndex(all));
        setNotice(`${transfer.reference} received at ${transfer.toStoreCode} — vendor bill booked under ${transfer.toGstin}.`);
      } else {
        setNotice(`${transfer.reference} cancelled.`);
      }
    } catch (err) {
      setTransfers(previous);
      setError(err instanceof Error ? err.message : 'The change was not saved.');
    } finally {
      setBusy(false);
    }
  };

  const setEwayOn = async (id: string, value: string) => {
    const updated = transfers.map(t => (t.id === id ? { ...t, ewayBillNo: value, ewayBillDate: new Date().toISOString() } : t));
    setTransfers(updated);
    try {
      await writeTransfers(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The e-way bill was not saved.');
    }
  };

  const exportCsv = () => {
    downloadCSV(
      'trs-interstate-transfers.csv',
      ['reference', 'tax_invoice', 'vendor_bill', 'from_store', 'from_gstin', 'to_store', 'to_gstin', 'taxable', 'igst', 'total', 'eway_bill', 'status'],
      transfers.map(t => ({
        reference: t.reference,
        tax_invoice: t.taxInvoiceNo,
        vendor_bill: t.vendorBillNo ?? '',
        from_store: t.fromStoreCode,
        from_gstin: t.fromGstin,
        to_store: t.toStoreCode,
        to_gstin: t.toGstin,
        taxable: String(t.taxableValue),
        igst: String(t.igst),
        total: String(t.total),
        eway_bill: t.ewayBillNo ?? '',
        status: t.status,
      })),
    );
  };

  const transit = transfers.filter(t => t.status === 'dispatched');

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin/inventory" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Inventory
      </NextLink>

      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Compliance</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Inter-state transfers</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            Two registrations are two taxpayers. Moving stock across a state line is a supply: the sending
            registration raises a tax invoice carrying IGST, the receiving one books the bill against it, and an
            e-way bill travels with anything over {inr(EWAY_THRESHOLD)}.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCsv} disabled={transfers.length === 0} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
        </div>
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

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile label="Transfers" value={transfers.length.toString()} />
        <Tile label="In transit" value={transit.length.toString()} />
        <Tile label="IGST raised" value={inr(transfers.filter(t => t.status !== 'cancelled').reduce((s, t) => s + t.igst, 0))} />
        <Tile label="Awaiting e-way bill" value={transfers.filter(t => t.status === 'draft' && needsEwayBill(t.total) && !t.ewayBillNo).length.toString()} />
      </div>

      <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white mb-8">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">New consignment</div>

        <div className="grid md:grid-cols-2 gap-4 mb-4">
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">From</div>
            <select value={fromId} onChange={e => { setFromId(e.target.value); setLines([]); }} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white">
              {STORES.map(s => <option key={s.id} value={s.id}>{s.code} · {s.state}</option>)}
            </select>
          </label>
          <label className="block">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">To</div>
            <select value={toId} onChange={e => setToId(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white">
              {STORES.map(s => <option key={s.id} value={s.id}>{s.code} · {s.state}</option>)}
            </select>
          </label>
        </div>

        {!preview.ok && lines.length > 0 && (
          <div className="mb-4 p-3 rounded-md border border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10 text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-warning)]" />
            <span>{preview.reason}</span>
          </div>
        )}
        {from.stateCode === to.stateCode && (
          <div className="mb-4 p-3 rounded-md border border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-sm flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              {from.code} and {to.code} are both in {from.state}. No tax document is due — move this as an{' '}
              <NextLink href="/admin/inventory" className="underline">ordinary store transfer</NextLink>.
            </span>
          </div>
        )}

        <div className="flex items-end gap-2 flex-wrap mb-4">
          <label className="block flex-1 min-w-[220px]">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Product ({BRAND_META[from.brand].name})</div>
            <select value={sku} onChange={e => setSku(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white">
              <option value="">Choose a SKU…</option>
              {sourceCatalog.slice(0, 200).map(p => (
                <option key={p.id} value={p.sku}>
                  {p.sku} · {p.title} ({onHand(p.id, from.id, stockIndex)} on hand)
                </option>
              ))}
            </select>
          </label>
          <label className="block w-28">
            <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Quantity</div>
            <input type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, Number(e.target.value)))} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm text-center font-mono" />
          </label>
          <button onClick={addLine} disabled={!sku} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white disabled:opacity-40">
            <Plus className="w-3.5 h-3.5" /> Add line
          </button>
        </div>

        {lines.length > 0 && (
          <div className="border border-[color:var(--color-line)] rounded-lg overflow-hidden mb-4">
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <tr>
                  <Th>SKU</Th><Th>Product</Th><Th right>Qty</Th><Th right>Rate</Th><Th right>Value</Th><Th right>GST</Th><Th />
                </tr>
              </thead>
              <tbody>
                {lines.map(l => (
                  <tr key={l.productId} className="border-t border-[color:var(--color-line)]">
                    <Td mono>{l.sku}</Td>
                    <Td><span className="truncate block max-w-[280px]">{l.title}</span></Td>
                    <Td right mono>{l.qty}</Td>
                    <Td right mono>{inr(l.unitPrice)}</Td>
                    <Td right mono>{inr(l.unitPrice * l.qty)}</Td>
                    <Td right mono>{l.gstRate}%</Td>
                    <Td right>
                      <button onClick={() => setLines(prev => prev.filter(x => x.productId !== l.productId))} aria-label="Remove line">
                        <Trash2 className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)]" />
                      </button>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {preview.ok && lines.length > 0 && (
          <>
            <div className="grid md:grid-cols-3 gap-3 mb-4 text-sm">
              <Summary label={`Taxable value · ${preview.transfer.fromState} → ${preview.transfer.toState}`} value={inr(preview.transfer.taxableValue)} />
              <Summary label="IGST" value={inr(preview.transfer.igst)} />
              <Summary label="Invoice total" value={inr(preview.transfer.total)} strong />
            </div>

            {needsEwayBill(preview.transfer.total) && (
              <div className="mb-4 p-3 rounded-md border border-[color:var(--color-warning)] bg-[color:var(--color-warning)]/10 text-xs flex items-start gap-2">
                <AlertTriangle className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:var(--color-warning)]" />
                Over {inr(EWAY_THRESHOLD)} — this consignment cannot be dispatched without an e-way bill.
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-3 mb-4">
              <label className="block">
                <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">E-way bill number</div>
                <input value={eway} onChange={e => setEway(e.target.value.replace(/\D/g, '').slice(0, 12))} placeholder="12 digits" className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm font-mono" />
              </label>
              <label className="block">
                <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Vehicle number</div>
                <input value={vehicle} onChange={e => setVehicle(e.target.value.toUpperCase())} placeholder="KA01AB1234" className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm font-mono" />
              </label>
              <label className="block">
                <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Transporter</div>
                <input value={transporter} onChange={e => setTransporter(e.target.value)} className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm" />
              </label>
            </div>

            <button onClick={raise} disabled={busy} className="h-10 px-5 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50">
              {busy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <FileText className="w-3.5 h-3.5" />}
              Raise transfer and tax invoice
            </button>
          </>
        )}
      </div>

      <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
        <div className="p-4 border-b border-[color:var(--color-line)]">
          <div className="text-sm font-medium">Consignments</div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">{transit.length} in transit · {transfers.length} in total</div>
        </div>
        {transfers.length === 0 ? (
          <div className="py-16 text-center text-sm text-[color:var(--color-ink-muted)]">
            Nothing has moved between registrations yet.
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <tr>
                <Th>Reference</Th><Th>Route</Th><Th>E-way bill</Th>
                <Th right>Taxable</Th><Th right>IGST</Th><Th right>Total</Th><Th>Status</Th><Th right>Action</Th>
              </tr>
            </thead>
            <tbody>
              {transfers.map(t => (
                <Fragment key={t.id}>
                  <tr onClick={() => setOpen(open === t.id ? null : t.id)} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/50 cursor-pointer">
                    <Td mono>{t.reference}</Td>
                    <Td>
                      <span className="inline-flex items-center gap-1.5 text-xs">
                        <span className="font-mono">{t.fromStoreCode}</span>
                        <ArrowRight className="w-3 h-3 text-[color:var(--color-ink-muted)]" />
                        <span className="font-mono">{t.toStoreCode}</span>
                      </span>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{t.fromState} → {t.toState}</div>
                    </Td>
                    <Td>
                      {t.ewayBillNo
                        ? <span className="font-mono text-xs">{t.ewayBillNo}</span>
                        : needsEwayBill(t.total)
                          ? <span className="text-xs text-[color:var(--color-danger)]">required</span>
                          : <span className="text-xs text-[color:var(--color-ink-muted)]">not required</span>}
                    </Td>
                    <Td right mono>{inr(t.taxableValue)}</Td>
                    <Td right mono>{inr(t.igst)}</Td>
                    <Td right mono>{inr(t.total)}</Td>
                    <Td>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${STATUS_STYLE[t.status]}`}>{t.status}</span>
                    </Td>
                    <Td right>
                      <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                        {t.status === 'draft' && (
                          <>
                            <button onClick={() => act(t.id, 'dispatch')} disabled={busy} className="h-8 px-3 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                              <Truck className="w-3 h-3" /> Dispatch
                            </button>
                            <button onClick={() => act(t.id, 'cancel')} disabled={busy} className="h-8 px-2 text-xs text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)]">
                              <XCircle className="w-3 h-3" />
                            </button>
                          </>
                        )}
                        {t.status === 'dispatched' && (
                          <button onClick={() => act(t.id, 'receive')} disabled={busy} className="h-8 px-3 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs inline-flex items-center gap-1.5 disabled:opacity-50">
                            <PackageCheck className="w-3 h-3" /> Receive
                          </button>
                        )}
                        {t.status === 'received' && t.receivedAt && (
                          <span className="text-xs text-[color:var(--color-ink-muted)]">{new Date(t.receivedAt).toLocaleDateString('en-IN')}</span>
                        )}
                      </div>
                    </Td>
                  </tr>

                  {open === t.id && (
                    <tr className="border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                      <td colSpan={8} className="px-4 py-4">
                        <div className="grid md:grid-cols-3 gap-6">
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Documents</div>
                            <a
                              href={`/print/transfer/${encodeURIComponent(t.reference)}`}
                              target="_blank"
                              rel="noreferrer"
                              className="h-8 px-3 mb-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white"
                            >
                              <Printer className="w-3.5 h-3.5" /> Invoice &amp; challan
                            </a>
                            <Doc label="Tax invoice" value={t.taxInvoiceNo} sub={`raised by ${t.fromGstin}`} />
                            <Doc label="Vendor bill" value={t.vendorBillNo ?? 'on receipt'} sub={`booked by ${t.toGstin}`} />
                            {t.vehicleNo && <Doc label="Vehicle" value={t.vehicleNo} sub={t.transporter ?? ''} />}
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Lines</div>
                            <div className="space-y-1">
                              {t.lines.map(l => (
                                <div key={l.productId} className="flex justify-between text-xs gap-3">
                                  <span className="truncate">{l.title}</span>
                                  <span className="font-mono shrink-0">{l.qty} × {inr(l.unitPrice)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">E-way bill</div>
                            {t.status === 'draft' ? (
                              <input
                                defaultValue={t.ewayBillNo ?? ''}
                                onBlur={e => {
                                  const v = e.target.value.replace(/\D/g, '').slice(0, 12);
                                  if (v && !EWAY_PATTERN.test(v)) { setError('An e-way bill number is twelve digits.'); return; }
                                  if (v !== (t.ewayBillNo ?? '')) setEwayOn(t.id, v);
                                }}
                                placeholder="12 digits"
                                className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm font-mono bg-white"
                              />
                            ) : (
                              <div className="font-mono text-sm">{t.ewayBillNo ?? '—'}</div>
                            )}
                            {t.dispatchedAt && (
                              <div className="mt-2 text-xs text-[color:var(--color-ink-muted)]">
                                Left {t.fromStoreCode} on {new Date(t.dispatchedAt).toLocaleDateString('en-IN')}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function Doc({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="mb-2">
      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{label}</div>
      <div className="font-mono text-xs">{value}</div>
      {sub && <div className="text-[10px] text-[color:var(--color-ink-muted)]">{sub}</div>}
    </div>
  );
}

function Summary({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`px-3 py-2 rounded-md border border-[color:var(--color-line)] ${strong ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'bg-[color:var(--color-paper)]'}`}>
      <div className="text-[10px] uppercase tracking-widest opacity-70">{label}</div>
      <div className="font-mono">{value}</div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-[color:var(--color-line)] rounded-xl bg-white">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-normal ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Td({ children, right, mono }: { children?: React.ReactNode; right?: boolean; mono?: boolean }) {
  return <td className={`px-4 py-3 ${right ? 'text-right' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>;
}
