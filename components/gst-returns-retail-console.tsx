'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import {
  scopeOrders, scopeOutwardTransfers, scopeInwardTransfers, scopeSupplierBills,
  buildGstr1, buildHsnSummary, buildDocumentsIssued, buildGstr3b,
  checkEinvoice, exportGstr1Json, type Gstr1Row,
} from '@/lib/gst-returns';
import { INTERSTATE_KEY, type InterstateTransfer } from '@/lib/interstate';
import { CREDIT_NOTES_KEY, scopeCreditNotes, type CreditNote } from '@/lib/credit-notes';
import { REPLENISHMENT_KEY, type ReplenishmentOrder } from '@/lib/replenishment';
import { inr } from '@/lib/utils';
import { downloadCSV } from '@/lib/csv';
import {
  RefreshCw, AlertCircle, Download, FileJson, ArrowLeft,
  CheckCircle2, XCircle, Landmark,
} from 'lucide-react';

type Tab = 'gstr1' | 'gstr3b' | 'hsn' | 'documents' | 'einvoice';

const TABS: { key: Tab; label: string }[] = [
  { key: 'gstr1', label: 'GSTR-1' },
  { key: 'gstr3b', label: 'GSTR-3B' },
  { key: 'hsn', label: 'HSN summary' },
  { key: 'documents', label: 'Documents issued' },
  { key: 'einvoice', label: 'E-invoice readiness' },
];

const SECTION_LABEL: Record<string, string> = {
  b2b: 'B2B — registered buyers',
  b2cl: 'B2CL — large inter-state, unregistered',
  b2cs: 'B2CS — counter sales',
  nil: 'NIL — nil-rated and exempt',
  cdnr: 'CDNR — credit notes, registered',
  cdnur: 'CDNUR — credit notes, unregistered',
};

function lastMonth(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function GstReturnsRetailConsole() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transfers, setTransfers] = useState<InterstateTransfer[]>([]);
  const [notes, setNotes] = useState<CreditNote[]>([]);
  const [purchases, setPurchases] = useState<ReplenishmentOrder[]>([]);
  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [tab, setTab] = useState<Tab>('gstr1');
  const [period, setPeriod] = useState(lastMonth());
  const [registrationId, setRegistrationId] = useState<string>('');

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const [gst, res, tRes, cRes, pRes] = await Promise.all([
        loadGST(),
        fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' }),
        fetch(`/api/erp/${encodeURIComponent(INTERSTATE_KEY)}`, { cache: 'no-store' }),
        fetch(`/api/erp/${encodeURIComponent(CREDIT_NOTES_KEY)}`, { cache: 'no-store' }),
        fetch(`/api/erp/${encodeURIComponent(REPLENISHMENT_KEY)}`, { cache: 'no-store' }),
      ]);
      setRegistrations(gst);
      if (!res.ok) throw new Error(`Order store returned ${res.status}.`);
      const data = await res.json();
      setOrders(Array.isArray(data.rows) ? (data.rows as Order[]) : []);
      const tData = tRes.ok ? await tRes.json() : { rows: null };
      setTransfers(Array.isArray(tData.rows) ? (tData.rows as InterstateTransfer[]) : []);
      const cData = cRes.ok ? await cRes.json() : { rows: null };
      setNotes(Array.isArray(cData.rows) ? (cData.rows as CreditNote[]) : []);
      const pData = pRes.ok ? await pRes.json() : { rows: null };
      setPurchases(Array.isArray(pData.rows) ? (pData.rows as ReplenishmentOrder[]) : []);
      setRegistrationId(prev => prev || gst[0]?.id || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the orders.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const registration = registrations.find(r => r.id === registrationId);

  const scoped = useMemo(
    () => (registration ? scopeOrders(orders, registration, period) : []),
    [orders, registration, period],
  );

  const outward = useMemo(
    () => (registration ? scopeOutwardTransfers(transfers, registration, period) : []),
    [transfers, registration, period],
  );
  const inward = useMemo(
    () => (registration ? scopeInwardTransfers(transfers, registration, period) : []),
    [transfers, registration, period],
  );

  const periodNotes = useMemo(
    () => (registration ? scopeCreditNotes(notes, registration, period) : []),
    [notes, registration, period],
  );

  const gstr1 = useMemo(
    () => (registration ? buildGstr1(scoped, registration, outward, periodNotes) : []),
    [scoped, registration, outward, periodNotes],
  );
  const hsn = useMemo(
    () => (registration ? buildHsnSummary(scoped, registration, outward, periodNotes) : []),
    [scoped, registration, outward, periodNotes],
  );
  const documents = useMemo(() => buildDocumentsIssued(scoped, outward, periodNotes), [scoped, outward, periodNotes]);
  const bills = useMemo(
    () => (registration ? scopeSupplierBills(purchases, registration, period) : []),
    [purchases, registration, period],
  );
  const gstr3b = useMemo(() => buildGstr3b(gstr1, inward, bills), [gstr1, inward, bills]);
  const einvoice = useMemo(() => scoped.map(checkEinvoice), [scoped]);

  const totals = useMemo(() => ({
    taxable: gstr1.reduce((t, r) => t + r.taxable, 0),
    tax: gstr1.reduce((t, r) => t + r.cgst + r.sgst + r.igst, 0),
    invoices: scoped.length + outward.length,
  }), [gstr1, scoped, outward]);

  const downloadJson = () => {
    if (!registration) return;
    const payload = exportGstr1Json(gstr1, registration, period);
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gstr1-${registration.gstin}-${period}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCsv = () => {
    downloadCSV(
      `gstr1-${period}.csv`,
      ['section', 'place_of_supply', 'pos_code', 'rate', 'taxable', 'cgst', 'sgst', 'igst', 'invoices'],
      gstr1.map(r => ({
        section: r.section,
        place_of_supply: r.placeOfSupply,
        pos_code: r.placeOfSupplyCode,
        rate: String(r.rate),
        taxable: String(r.taxable),
        cgst: String(r.cgst),
        sgst: String(r.sgst),
        igst: String(r.igst),
        invoices: String(r.invoices),
      })),
    );
  };

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <NextLink href="/admin/registrations" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Registrations
      </NextLink>

      <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Compliance</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">GST returns</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            Prepared from the orders actually raised, one registration at a time. This prepares and reconciles the
            numbers and exports the JSON the portal&apos;s offline tool reads — filing happens on the portal.
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

      <div className="p-5 border border-[color:var(--color-line)] rounded-xl bg-white mb-6 flex items-end gap-3 flex-wrap">
        <label className="block">
          <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Registration</div>
          <select
            value={registrationId}
            onChange={e => setRegistrationId(e.target.value)}
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none min-w-[260px]"
          >
            {registrations.map(r => (
              <option key={r.id} value={r.id}>{r.stateCode} · {r.tradeName ?? r.legalName} · {r.gstin}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">Period</div>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none"
          />
        </label>
        <div className="ml-auto flex items-center gap-2">
          <button onClick={exportCsv} disabled={gstr1.length === 0} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 bg-white disabled:opacity-40">
            <Download className="w-3.5 h-3.5" /> Export CSV
          </button>
          <button onClick={downloadJson} disabled={gstr1.length === 0} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium inline-flex items-center gap-1.5 disabled:opacity-40">
            <FileJson className="w-3.5 h-3.5" /> Export GSTR-1 JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile label="Invoices" value={totals.invoices.toLocaleString()} />
        <Tile label="Taxable value" value={inr(totals.taxable)} />
        <Tile label="Tax" value={inr(totals.tax)} />
        <Tile label="Would be refused" value={einvoice.filter(e => !e.ready).length.toString()} />
      </div>

      <div className="flex items-center gap-1 mb-4 flex-wrap">
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`h-9 px-3 rounded-md text-sm transition ${tab === t.key ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'border border-[color:var(--color-line)] bg-white'}`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-24 text-center text-sm text-[color:var(--color-ink-muted)]">Reading the orders…</div>
      ) : scoped.length === 0 && outward.length === 0 && inward.length === 0 && periodNotes.length === 0 && bills.length === 0 ? (
        <div className="py-24 text-center">
          <Landmark className="w-8 h-8 mx-auto mb-3 text-[color:var(--color-ink-faint)]" />
          <div className="font-serif text-3xl mb-2">Nothing to report.</div>
          <div className="text-sm text-[color:var(--color-ink-muted)] max-w-md mx-auto">
            Nothing was raised under {registration?.tradeName ?? 'this registration'} in {period} — no counter
            sale, and no stock sent to or received from another registration.
          </div>
        </div>
      ) : (
        <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
          {tab === 'gstr1' && <Gstr1Table rows={gstr1} />}

          {tab === 'gstr3b' && (
            <div className="p-6 space-y-4">
              <Box3b label="3.1(a) Outward taxable supplies" values={[
                ['Taxable value', inr(gstr3b.outwardTaxable.taxable)],
                ['IGST', inr(gstr3b.outwardTaxable.igst)],
                ['CGST', inr(gstr3b.outwardTaxable.cgst)],
                ['SGST', inr(gstr3b.outwardTaxable.sgst)],
              ]} />
              <Box3b label="3.1(c) Nil-rated and exempt outward supplies" values={[
                ['Taxable value', inr(gstr3b.outwardNil.taxable)],
              ]} />
              <Box3b label="4(A)(5) Input tax credit — all other ITC" values={[
                ['IGST', inr(gstr3b.inwardCredit.igst)],
                ['CGST', inr(gstr3b.inwardCredit.cgst)],
                ['SGST', inr(gstr3b.inwardCredit.sgst)],
                ['Credit available', inr(gstr3b.inwardCredit.total)],
              ]} />
              <div className="flex items-center justify-between px-4 py-3 rounded-lg bg-[color:var(--color-ink)] text-[color:var(--color-cream)]">
                <span className="text-sm">Net payable after credit</span>
                <span className="font-mono">{inr(gstr3b.netPayable)}</span>
              </div>
              <div className="pt-2 space-y-1">
                {gstr3b.caveats.map(c => (
                  <div key={c} className="text-xs text-[color:var(--color-ink-muted)] flex items-start gap-1.5">
                    <AlertCircle className="w-3 h-3 mt-0.5 shrink-0" /> {c}
                  </div>
                ))}
              </div>
            </div>
          )}

          {tab === 'hsn' && (
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <tr>
                  <Th>HSN</Th><Th>Description</Th><Th>UQC</Th>
                  <Th right>Rate</Th><Th right>Qty</Th><Th right>Taxable</Th>
                  <Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th><Th right>Total</Th>
                </tr>
              </thead>
              <tbody>
                {hsn.map(r => (
                  <tr key={`${r.hsn}-${r.rate}`} className="border-t border-[color:var(--color-line)]">
                    <Td mono>{r.hsn}</Td>
                    <Td><span className="truncate block max-w-[280px]">{r.description}</span></Td>
                    <Td mono>{r.uqc}</Td>
                    <Td right mono>{r.rate}%</Td>
                    <Td right mono>{r.qty}</Td>
                    <Td right mono>{inr(r.taxable)}</Td>
                    <Td right mono>{inr(r.cgst)}</Td>
                    <Td right mono>{inr(r.sgst)}</Td>
                    <Td right mono>{inr(r.igst)}</Td>
                    <Td right mono>{inr(r.total)}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'documents' && (
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <tr>
                  <Th>Nature of document</Th><Th>From</Th><Th>To</Th>
                  <Th right>Total</Th><Th right>Cancelled</Th><Th right>Net</Th>
                </tr>
              </thead>
              <tbody>
                {documents.map(d => (
                  <tr key={d.nature} className="border-t border-[color:var(--color-line)]">
                    <Td>{d.nature}</Td>
                    <Td mono>{d.from}</Td>
                    <Td mono>{d.to}</Td>
                    <Td right mono>{d.total}</Td>
                    <Td right mono>{d.cancelled}</Td>
                    <Td right mono>{d.net}</Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === 'einvoice' && (
            <table className="w-full text-sm">
              <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <tr>
                  <Th>Invoice</Th><Th>Placed</Th><Th right>Total</Th><Th>Ready</Th><Th>What the portal would refuse</Th>
                </tr>
              </thead>
              <tbody>
                {einvoice.map(e => (
                  <tr key={e.orderId} className="border-t border-[color:var(--color-line)]">
                    <Td mono>{e.orderId}</Td>
                    <Td><span className="text-xs text-[color:var(--color-ink-muted)]">{new Date(e.placedAt).toLocaleDateString('en-IN')}</span></Td>
                    <Td right mono>{inr(e.total)}</Td>
                    <Td>
                      {e.ready
                        ? <span className="inline-flex items-center gap-1 text-[color:var(--color-success)] text-xs"><CheckCircle2 className="w-3.5 h-3.5" /> Yes</span>
                        : <span className="inline-flex items-center gap-1 text-[color:var(--color-danger)] text-xs"><XCircle className="w-3.5 h-3.5" /> No</span>}
                    </Td>
                    <Td>
                      <span className="text-xs text-[color:var(--color-ink-soft)]">{e.issues.join(' · ') || '—'}</span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
}

function Gstr1Table({ rows }: { rows: Gstr1Row[] }) {
  const sections = [...new Set(rows.map(r => r.section))];
  return (
    <table className="w-full text-sm">
      <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        <tr>
          <Th>Place of supply</Th><Th right>Rate</Th><Th right>Taxable</Th>
          <Th right>CGST</Th><Th right>SGST</Th><Th right>IGST</Th><Th right>Invoices</Th>
        </tr>
      </thead>
      <tbody>
        {sections.map(section => (
          <Fragment key={section}>
            <tr className="bg-[color:var(--color-paper)]/60 border-t border-[color:var(--color-line)]">
              <td colSpan={7} className="px-4 py-2 text-[11px] uppercase tracking-widest">
                {SECTION_LABEL[section] ?? section}
              </td>
            </tr>
            {rows.filter(r => r.section === section).map(r => (
              <tr key={`${section}-${r.placeOfSupplyCode}-${r.rate}`} className="border-t border-[color:var(--color-line)]">
                <Td>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[color:var(--color-paper)] mr-2">{r.placeOfSupplyCode}</span>
                  {r.placeOfSupply}
                </Td>
                <Td right mono>{r.rate}%</Td>
                <Td right mono>{inr(r.taxable)}</Td>
                <Td right mono>{inr(r.cgst)}</Td>
                <Td right mono>{inr(r.sgst)}</Td>
                <Td right mono>{inr(r.igst)}</Td>
                <Td right mono>{r.invoices}</Td>
              </tr>
            ))}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function Box3b({ label, values }: { label: string; values: [string, string][] }) {
  return (
    <div className="border border-[color:var(--color-line)] rounded-lg overflow-hidden">
      <div className="px-4 py-2 bg-[color:var(--color-paper)] text-[11px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
      <div className="divide-y divide-[color:var(--color-line)]">
        {values.map(([k, v]) => (
          <div key={k} className="px-4 py-2 flex items-center justify-between text-sm">
            <span className="text-[color:var(--color-ink-muted)]">{k}</span>
            <span className="font-mono">{v}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function Th({ children, right }: { children: React.ReactNode; right?: boolean }) {
  return <th className={`px-4 py-2.5 font-normal ${right ? 'text-right' : 'text-left'}`}>{children}</th>;
}

function Td({ children, right, mono }: { children: React.ReactNode; right?: boolean; mono?: boolean }) {
  return <td className={`px-4 py-2.5 ${right ? 'text-right' : ''} ${mono ? 'font-mono text-xs' : ''}`}>{children}</td>;
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-4 border border-[color:var(--color-line)] rounded-xl bg-white">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      <div className="font-serif text-2xl">{value}</div>
    </div>
  );
}
