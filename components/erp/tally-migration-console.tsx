'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  FileInput, Upload, CheckCircle2, AlertTriangle, XCircle, RefreshCw,
  Users, Truck, Package, Landmark, BookMinus, Wallet, Layers,
} from 'lucide-react';
import {
  loadMigrations, saveMigration, SEED_MIGRATIONS,
  type TallyMigrationJob, type TallyEntity, type MigrationStatus,
} from '@/lib/erp/phase6';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

const ENTITY_META: Record<TallyEntity, { label: string; icon: React.ElementType }> = {
  'ledgers':           { label: 'Chart of Accounts',     icon: BookMinus },
  'customers':         { label: 'Customers',             icon: Users },
  'suppliers':         { label: 'Suppliers',             icon: Truck },
  'items':             { label: 'Stock items',           icon: Package },
  'tax-structure':     { label: 'Tax structure',         icon: Landmark },
  'opening-balances':  { label: 'Opening balances',      icon: Wallet },
  'ar':                { label: 'Outstanding AR',        icon: Wallet },
  'ap':                { label: 'Outstanding AP',        icon: Wallet },
  'opening-stock':     { label: 'Opening stock',         icon: Layers },
};

const STATUS_TONE: Record<MigrationStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  queued: 'muted', validating: 'warning', ready: 'info', migrated: 'info', reconciled: 'success', failed: 'danger',
};

export function TallyMigrationConsole() {
  const [rows, setRows] = useState<TallyMigrationJob[]>(SEED_MIGRATIONS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setRows(loadMigrations()); setHydrated(true); }, []);
  function refresh() { setRows(loadMigrations()); }

  const kpi = useMemo(() => ({
    reconciled: rows.filter(r => r.status === 'reconciled').length,
    pending: rows.filter(r => ['ready', 'migrated', 'validating', 'queued'].includes(r.status)).length,
    errors: rows.reduce((s, r) => s + r.errorCount, 0),
    totalDiff: rows.reduce((s, r) => s + r.diff, 0),
  }), [rows]);

  const entities = Object.keys(ENTITY_META) as TallyEntity[];

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <FileInput className="w-3 h-3" /> Admin
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Tally Data Migration</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            One-time migration wizard from Tally. Ledgers, parties, stock items, opening balances, and outstandings — each reconciled against the Tally source before go-live.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Upload className="w-4 h-4" /> Upload Tally export
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Reconciled" value={kpi.reconciled.toString()} accent="success" />
        <KPI label="Pending" value={kpi.pending.toString()} accent={kpi.pending > 0 ? 'warn' : undefined} />
        <KPI label="Errors" value={kpi.errors.toString()} accent={kpi.errors > 0 ? 'danger' : undefined} />
        <KPI label="Net reconciliation delta" value={kpi.totalDiff === 0 ? 'Balanced' : `Δ ${inr(Math.abs(kpi.totalDiff))}`} accent={kpi.totalDiff === 0 ? 'success' : 'warn'} />
      </div>

      {/* Entity summary cards */}
      <div className="grid md:grid-cols-3 gap-3 mb-6">
        {entities.map(e => {
          const jobs = rows.filter(r => r.entity === e);
          const latest = jobs[0];
          const totalRows = jobs.reduce((s, j) => s + j.rowCount, 0);
          const Icon = ENTITY_META[e].icon;
          return (
            <div key={e} className="bg-white rounded-xl border border-[color:var(--color-line)] p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-md bg-[color:var(--color-paper)] flex items-center justify-center">
                    <Icon className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{ENTITY_META[e].label}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono capitalize">{e.replace('-', ' ')}</div>
                  </div>
                </div>
                {latest && <StatusPill status={latest.status} tone={STATUS_TONE[latest.status]} />}
              </div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">
                {latest ? `${totalRows.toLocaleString('en-IN')} rows migrated · latest ${latest.uploadedAt}` : 'no migrations yet'}
              </div>
            </div>
          );
        })}
      </div>

      {/* Job history table */}
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Migration jobs</div>
          <div className="text-xs text-[color:var(--color-ink-muted)] font-mono">{hydrated ? `${rows.length} total` : 'loading…'}</div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Entity" className="w-40" />
                <Th label="File" />
                <Th label="Uploaded" className="w-40" />
                <Th label="Rows" className="w-20" align="right" />
                <Th label="OK / warn / err" className="w-32 text-center" />
                <Th label="Tally total" className="w-32" align="right" />
                <Th label="ERP total" className="w-32" align="right" />
                <Th label="Δ" className="w-24" align="right" />
                <Th label="Status" className="w-28" />
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 && <tr><td colSpan={10} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No migration jobs yet.</td></tr>}
              {rows.map(r => (
                <tr key={r.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-3 py-3 text-xs">
                    <div className="capitalize">{ENTITY_META[r.entity].label}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{r.entity}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="text-xs font-mono truncate max-w-[240px]">{r.fileName}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)]">by {r.uploadedBy}</div>
                    {r.notes && <div className="text-[10px] text-[color:var(--color-warning)] mt-0.5">{r.notes}</div>}
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{r.uploadedAt}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{r.rowCount.toLocaleString('en-IN')}</td>
                  <td className="px-3 py-3 text-center">
                    <div className="inline-flex items-center gap-1 text-[10px] font-mono">
                      <span className="inline-flex items-center gap-0.5 text-[color:var(--color-success)]"><CheckCircle2 className="w-3 h-3" /> {r.successCount.toLocaleString('en-IN')}</span>
                      {r.warningCount > 0 && <span className="inline-flex items-center gap-0.5 text-[color:var(--color-warning)]"><AlertTriangle className="w-3 h-3" /> {r.warningCount}</span>}
                      {r.errorCount > 0 && <span className="inline-flex items-center gap-0.5 text-[color:var(--color-danger)]"><XCircle className="w-3 h-3" /> {r.errorCount}</span>}
                    </div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{r.tallyTotal ? inr(r.tallyTotal) : '—'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{r.erpTotal ? inr(r.erpTotal) : '—'}</td>
                  <td className={`px-3 py-3 text-right font-mono text-xs ${r.diff === 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-warning)]'}`}>
                    {r.diff === 0 ? '✓' : (r.diff < 0 ? `−${inr(Math.abs(r.diff))}` : inr(r.diff))}
                  </td>
                  <td className="px-3 py-3">
                    <StatusPill status={r.status} tone={STATUS_TONE[r.status]} />
                  </td>
                  <td className="px-3 py-3 text-right">
                    {r.status === 'ready' && (
                      <button
                        onClick={() => { saveMigration({ ...r, status: 'reconciled' }); refresh(); }}
                        className="text-xs text-[color:var(--color-crimson)] hover:underline inline-flex items-center gap-1"
                      >
                        <RefreshCw className="w-3 h-3" /> Reconcile
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
