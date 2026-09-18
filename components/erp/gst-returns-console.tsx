'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  FileText, Download, ArrowLeft, CheckCircle2, Send, AlertTriangle,
} from 'lucide-react';
import { loadSOs, SEED_SOS, loadCustomers, SEED_CUSTOMERS, type SalesOrder } from '@/lib/erp/phase2';
import { loadGST, SEED_GST } from '@/lib/erp/foundations';
import { computeGSTR1 } from '@/lib/erp/phase3';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

export function GSTReturnsConsole() {
  const [sos, setSOs] = useState<SalesOrder[]>(SEED_SOS);
  const [gst, setGst] = useState(SEED_GST);
  const [hydrated, setHydrated] = useState(false);
  const [period, setPeriod] = useState('2026-09');

  useEffect(() => {
    loadSOs().then(setSOs);
    loadGST().then(setGst);
    setHydrated(true);
  }, []);

  const filteredSOs = useMemo(() => sos.filter(s => s.orderDate.startsWith(period)), [sos, period]);
  const gstr1 = useMemo(() => computeGSTR1(filteredSOs, gst), [filteredSOs, gst]);

  const totals = useMemo(() => ({
    invoices: gstr1.reduce((s, r) => s + r.invoices, 0),
    taxable: gstr1.reduce((s, r) => s + r.taxableValue, 0),
    cgst: gstr1.reduce((s, r) => s + r.cgst, 0),
    sgst: gstr1.reduce((s, r) => s + r.sgst, 0),
    igst: gstr1.reduce((s, r) => s + r.igst, 0),
    grand: gstr1.reduce((s, r) => s + r.total, 0),
  }), [gstr1]);

  const totalGST = totals.cgst + totals.sgst + totals.igst;

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <Link href="/admin/erp/accounts" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Accounting
      </Link>

      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <FileText className="w-3 h-3" /> Finance
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">GST Returns</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            GSTR-1 (outward supplies) and GSTR-3B (summary) computed live from posted invoices — one filing per state GSTIN.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Period</label>
          <input
            type="month"
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white font-mono"
          />
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <Download className="w-3.5 h-3.5" /> JSON
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Filings this month" value={gstr1.length.toString()} />
        <KPI label="Invoices" value={totals.invoices.toString()} />
        <KPI label="Taxable value" value={inr(totals.taxable)} />
        <KPI label="Output GST" value={inr(totalGST)} accent="crimson" />
        <KPI label="Grand total" value={inr(totals.grand)} accent="success" />
      </div>

      {/* GSTR-1 tab */}
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden mb-6">
        <div className="px-5 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)]">GSTR-1</div>
            <div className="font-serif text-2xl">Outward supplies — {period}</div>
          </div>
          <div className="flex items-center gap-2">
            <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
            <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Push to portal
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="GSTIN" className="w-44" />
                <Th label="State" />
                <Th label="Invoices" className="w-24" align="right" />
                <Th label="Taxable value" className="w-36" align="right" />
                <Th label="CGST" className="w-28" align="right" />
                <Th label="SGST" className="w-28" align="right" />
                <Th label="IGST" className="w-28" align="right" />
                <Th label="Total" className="w-32" align="right" />
                <th className="w-24 px-3 py-2.5"></th>
              </tr>
            </thead>
            <tbody>
              {gstr1.length === 0 && (
                <tr><td colSpan={9} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No filings for {period}.</td></tr>
              )}
              {gstr1.map(row => (
                <tr key={row.gstin} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-3 py-3 font-mono text-xs">{row.gstin}</td>
                  <td className="px-3 py-3 text-sm">{row.state}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{row.invoices}</td>
                  <td className="px-3 py-3 text-right font-mono">{inr(row.taxableValue)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(row.cgst)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(row.sgst)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(row.igst)}</td>
                  <td className="px-3 py-3 text-right font-mono">{inr(row.total)}</td>
                  <td className="px-3 py-3 text-right">
                    <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-success)]">
                      <CheckCircle2 className="w-3 h-3" /> Ready
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            {gstr1.length > 0 && (
              <tfoot>
                <tr className="bg-[color:var(--color-paper)]/40 font-medium border-t border-[color:var(--color-line)]">
                  <td colSpan={2} className="px-3 py-3 text-right text-xs uppercase tracking-widest">Totals</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{totals.invoices}</td>
                  <td className="px-3 py-3 text-right font-mono">{inr(totals.taxable)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(totals.cgst)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(totals.sgst)}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(totals.igst)}</td>
                  <td className="px-3 py-3 text-right font-mono">{inr(totals.grand)}</td>
                  <td></td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* GSTR-3B summary */}
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-5 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)]">GSTR-3B</div>
            <div className="font-serif text-2xl">Summary return — {period}</div>
          </div>
          <div className="text-xs text-[color:var(--color-ink-muted)]">Auto-computed · verify before submission</div>
        </div>
        <div className="p-6 grid md:grid-cols-3 gap-4">
          <SummaryBlock title="3.1 Outward supplies (taxable)" rows={[
            ['Taxable value', inr(totals.taxable)],
            ['CGST', inr(totals.cgst)],
            ['SGST', inr(totals.sgst)],
            ['IGST', inr(totals.igst)],
          ]} />
          <SummaryBlock title="4. Eligible ITC" rows={[
            ['Purchases (CGST)', inr(0)],
            ['Purchases (SGST)', inr(0)],
            ['Purchases (IGST)', inr(0)],
            ['Net ITC available', inr(0)],
          ]} muted />
          <SummaryBlock title="6.1 Payment of tax" rows={[
            ['Tax payable', inr(totalGST)],
            ['ITC set-off', inr(0)],
            ['Cash ledger', inr(totalGST)],
          ]} accent />
        </div>
        <div className="px-6 pb-6 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 text-[11px] text-[color:var(--color-warning)]">
            <AlertTriangle className="w-3.5 h-3.5" />
            Purchase-side ITC not yet posted for this period — verify Phase 3 accounts before filing.
          </div>
          <div className="flex items-center gap-2">
            <button className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
              <Download className="w-3.5 h-3.5" /> Download JSON
            </button>
            <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
              <Send className="w-3.5 h-3.5" /> Submit to portal
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryBlock({ title, rows, accent, muted }: { title: string; rows: [string, string][]; accent?: boolean; muted?: boolean }) {
  return (
    <div className={`p-4 rounded-lg border ${accent ? 'border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)]'} ${muted ? 'opacity-70' : ''}`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">{title}</div>
      <div className="space-y-1.5 text-sm">
        {rows.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between">
            <span className="text-[color:var(--color-ink-muted)]">{label}</span>
            <span className="font-mono">{value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
