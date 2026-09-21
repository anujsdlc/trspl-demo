'use client';

import { Fragment, useEffect, useMemo, useState } from 'react';
import NextLink from 'next/link';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import { coverage, storesForRegistration, taxSplit } from '@/lib/registrations';
import { STORES, BRAND_META } from '@/lib/stores';
import { downloadCSV } from '@/lib/csv';
import { inr } from '@/lib/utils';
import {
  RefreshCw, AlertCircle, AlertTriangle, CheckCircle2, Download,
  Building2, MapPin, ArrowRight,
} from 'lucide-react';

export function RegistrationsConsole() {
  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      setRegistrations(await loadGST());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the registrations.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { refresh(); }, []);

  const view = useMemo(() => coverage(registrations), [registrations]);
  const placed = view.rows.reduce((n, r) => n + r.storeCount, 0);
  const orphaned = view.unregistered.reduce((n, r) => n + r.stores.length, 0);

  const exportCoverage = () => {
    downloadCSV(
      'trs-registration-coverage.csv',
      ['gstin', 'trade_name', 'state', 'state_code', 'store_code', 'store_city', 'store_brand'],
      view.rows.flatMap(r =>
        r.stores.map(s => ({
          gstin: r.registration.gstin,
          trade_name: r.registration.tradeName ?? '',
          state: r.registration.state,
          state_code: r.registration.stateCode,
          store_code: s.code,
          store_city: s.city,
          store_brand: BRAND_META[s.brand].name,
        })),
      ),
    );
  };

  return (
    <div className="px-6 py-8 max-w-[1600px]">
      <div className="flex items-end justify-between mb-8 flex-wrap gap-4">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Compliance</div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">GST registrations</h1>
          <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
            One registration per state, each its own taxpayer. A store belongs to the registration of the state it
            stands in — a consequence of where it is, not a setting.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={refresh} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
          <button onClick={exportCoverage} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            <Download className="w-3.5 h-3.5" /> Export coverage
          </button>
          <NextLink href="/admin/registrations/tally" className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-2 bg-white">
            Tally migration
          </NextLink>
          <NextLink href="/admin/registrations/returns" className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium inline-flex items-center gap-2">
            GST returns <ArrowRight className="w-3.5 h-3.5" />
          </NextLink>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Tile label="Registrations" value={view.rows.length.toString()} />
        <Tile label="Stores placed" value={`${placed} of ${STORES.length}`} />
        <Tile label="Stores unplaced" value={orphaned.toString()} tone={orphaned > 0 ? 'danger' : 'ok'} />
        <Tile label="Registrations with no store" value={view.empty.length.toString()} tone={view.empty.length > 0 ? 'warn' : 'ok'} />
      </div>

      {orphaned > 0 ? (
        <div className="mb-6 p-5 rounded-xl border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/5">
          <div className="flex items-start gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
            <div>
              <div className="font-medium text-sm">{orphaned} stores stand in a state with no registration.</div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">
                They cannot raise a compliant tax invoice until one exists for that state.
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {view.unregistered.map(u => (
              <div key={u.stateCode} className="text-sm flex items-baseline gap-2 flex-wrap">
                <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-white border border-[color:var(--color-line)]">{u.stateCode}</span>
                <span className="font-medium">{u.state}</span>
                <span className="text-[color:var(--color-ink-muted)] text-xs">
                  {u.stores.map(s => s.code).join(' · ')}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-6 p-4 rounded-xl border border-[color:var(--color-line)] bg-[color:var(--color-paper)] text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[color:var(--color-success)]" />
          Every store stands in a state that has an active registration.
        </div>
      )}

      <div className="border border-[color:var(--color-line)] rounded-xl bg-white overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-[color:var(--color-paper)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            <tr>
              <th className="px-4 py-2.5 text-left font-normal">GSTIN</th>
              <th className="px-4 py-2.5 text-left font-normal">Trade name</th>
              <th className="px-4 py-2.5 text-left font-normal">State</th>
              <th className="px-4 py-2.5 text-right font-normal">Stores</th>
              <th className="px-4 py-2.5 text-left font-normal">E-invoice</th>
              <th className="px-4 py-2.5 text-left font-normal">E-way bill</th>
              <th className="px-4 py-2.5 text-left font-normal">Status</th>
            </tr>
          </thead>
          <tbody>
            {view.rows.map(({ registration: r, storeCount }) => (
              <Fragment key={r.id}>
                <tr
                  onClick={() => setOpen(open === r.id ? null : r.id)}
                  className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/50 cursor-pointer"
                >
                  <td className="px-4 py-3 font-mono text-xs">{r.gstin}</td>
                  <td className="px-4 py-3">{r.tradeName ?? r.legalName}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-[color:var(--color-paper)] mr-2">{r.stateCode}</span>
                    {r.state}
                  </td>
                  <td className={`px-4 py-3 text-right font-mono ${storeCount === 0 ? 'text-[color:var(--color-ink-faint)]' : ''}`}>{storeCount}</td>
                  <td className="px-4 py-3 text-xs">{r.einvoiceEnabled ? 'Enabled' : '—'}</td>
                  <td className="px-4 py-3 text-xs">{r.ewaybillEnabled ? 'Enabled' : '—'}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] uppercase tracking-wider ${
                      r.status === 'active' ? 'bg-[color:var(--color-success)]/15 text-[color:var(--color-success)]' : 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]'
                    }`}>{r.status}</span>
                  </td>
                </tr>
                {open === r.id && (
                  <tr className="border-t border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">
                            Stores under this registration
                          </div>
                          {storeCount === 0 ? (
                            <div className="text-sm text-[color:var(--color-ink-muted)]">
                              No store trades under it yet.
                            </div>
                          ) : (
                            <div className="flex flex-wrap gap-1.5">
                              {storesForRegistration(r).map(s => (
                                <span key={s.id} className="inline-flex items-center gap-1.5 text-xs px-2 py-1 rounded-md bg-white border border-[color:var(--color-line)]">
                                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND_META[s.brand].color }} />
                                  <span className="font-mono">{s.code}</span>
                                  <span className="text-[color:var(--color-ink-muted)]">{s.location}</span>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div>
                          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">
                            What a ₹1,000 supply at 18% carries
                          </div>
                          <TaxExample stateCode={r.stateCode} />
                          <div className="mt-3 text-xs text-[color:var(--color-ink-muted)] flex items-start gap-1.5">
                            <MapPin className="w-3 h-3 mt-0.5 shrink-0" />
                            {r.address}, {r.pincode}
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TaxExample({ stateCode }: { stateCode: string }) {
  const within = taxSplit(1000, 18, stateCode, stateCode);
  const outside = taxSplit(1000, 18, stateCode, stateCode === '07' ? '29' : '07');
  return (
    <div className="space-y-2 text-sm">
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-white border border-[color:var(--color-line)]">
        <span className="text-xs">Inside the state</span>
        <span className="font-mono text-xs">
          CGST {inr(within.cgst)} + SGST {inr(within.sgst)}
        </span>
      </div>
      <div className="flex items-center justify-between gap-3 px-3 py-2 rounded-md bg-white border border-[color:var(--color-line)]">
        <span className="text-xs inline-flex items-center gap-1">
          Out of state <ArrowRight className="w-3 h-3" />
        </span>
        <span className="font-mono text-xs">IGST {inr(outside.igst)}</span>
      </div>
    </div>
  );
}

function Tile({ label, value, tone }: { label: string; value: string; tone?: 'ok' | 'warn' | 'danger' }) {
  const colour =
    tone === 'danger' ? 'text-[color:var(--color-danger)]' :
    tone === 'warn' ? 'text-amber-700' : '';
  return (
    <div className="p-4 border border-[color:var(--color-line)] rounded-xl bg-white">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-1.5">
        <Building2 className="w-3 h-3" /> {label}
      </div>
      <div className={`font-serif text-2xl ${colour}`}>{value}</div>
    </div>
  );
}
