'use client';

import { useEffect, useState } from 'react';
import {
  Settings2,
  Building,
  Save,
  Database,
  Activity,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Palette,
  Bell,
  AlertTriangle,
  Info,
} from 'lucide-react';
import {
  loadCompany,
  saveCompany,
  DEFAULT_COMPANY,
  loadBackups,
  SEED_BACKUPS,
  loadAlerts,
  saveAlert,
  SEED_ALERTS,
  type Company,
  type Backup,
  type SystemAlert,
} from '@/lib/erp/phase6';
import { KPI, Field, StatusPill } from './ui';

type Tab = 'company' | 'formats' | 'backups' | 'monitoring';

export function SystemConsole() {
  const [tab, setTab] = useState<Tab>('company');
  const [company, setCompany] = useState<Company>(DEFAULT_COMPANY);
  const [backups, setBackups] = useState<Backup[]>(SEED_BACKUPS);
  const [alerts, setAlerts] = useState<SystemAlert[]>(SEED_ALERTS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadCompany().then(setCompany);
    loadBackups().then(setBackups);
    loadAlerts().then(setAlerts);
    setHydrated(true);
  }, []);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Settings2 className="w-3 h-3" /> Admin
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">System Settings</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Company config, branded doc formats, backup status, and infra monitoring.
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-4 overflow-x-auto">
        {([
          ['company', 'Company', Building],
          ['formats', 'Document formats', Palette],
          ['backups', 'Backups', Database],
          ['monitoring', 'Monitoring & alerts', Activity],
        ] as [Tab, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-11 px-4 text-sm inline-flex items-center gap-2 border-b-2 transition ${
            tab === k ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
          }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'company' && <CompanyTab company={company} onChange={setCompany} onSave={() => saveCompany(company)} hydrated={hydrated} />}
      {tab === 'formats' && <FormatsTab />}
      {tab === 'backups' && <BackupsTab backups={backups} />}
      {tab === 'monitoring' && <MonitoringTab alerts={alerts} onResolve={a => { saveAlert({ ...a, resolved: true }); loadAlerts().then(setAlerts); }} />}
    </div>
  );
}

function CompanyTab({ company, onChange, onSave, hydrated }: {
  company: Company;
  onChange: (c: Company) => void;
  onSave: () => void;
  hydrated: boolean;
}) {
  if (!hydrated) return <div className="p-10 text-center text-[color:var(--color-ink-muted)]">Loading…</div>;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6 space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Legal identity</div>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <Field label="Legal name"><input value={company.legalName} onChange={e => onChange({ ...company, legalName: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <Field label="Trade name"><input value={company.tradeName} onChange={e => onChange({ ...company, tradeName: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <Field label="CIN"><input value={company.cin} onChange={e => onChange({ ...company, cin: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          <Field label="PAN"><input value={company.pan} onChange={e => onChange({ ...company, pan: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
        </div>
        <Field label="Registered address"><textarea rows={2} value={company.registeredAddress} onChange={e => onChange({ ...company, registeredAddress: e.target.value })} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Contact email"><input value={company.contactEmail} onChange={e => onChange({ ...company, contactEmail: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <Field label="Contact phone"><input value={company.contactPhone} onChange={e => onChange({ ...company, contactPhone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6 space-y-4">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Business settings</div>
        <div className="grid md:grid-cols-4 gap-3 text-sm">
          <Field label="Invoice prefix"><input value={company.invoicePrefix} onChange={e => onChange({ ...company, invoicePrefix: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
          <Field label="Fiscal year start"><input type="date" value={company.fiscalYearStart} onChange={e => onChange({ ...company, fiscalYearStart: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <Field label="Timezone">
            <select value={company.timezone} onChange={e => onChange({ ...company, timezone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
              <option>Asia/Kolkata</option>
              <option>Asia/Dubai</option>
              <option>Asia/Singapore</option>
              <option>UTC</option>
            </select>
          </Field>
          <Field label="Currency">
            <select value={company.currency} onChange={e => onChange({ ...company, currency: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
              <option>INR</option>
              <option>USD</option>
              <option>AED</option>
            </select>
          </Field>
        </div>
      </div>
      <div className="flex justify-end">
        <button onClick={onSave} className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-2">
          <Save className="w-4 h-4" /> Save company profile
        </button>
      </div>
    </div>
  );
}

function FormatsTab() {
  const templates = [
    { id: 'invoice',      label: 'Tax invoice',       lastUpdated: '2026-08-14', status: 'Active' },
    { id: 'credit-note',  label: 'Credit note',       lastUpdated: '2026-06-02', status: 'Active' },
    { id: 'delivery',     label: 'Delivery challan',  lastUpdated: '2026-05-15', status: 'Active' },
    { id: 'quotation',    label: 'Quotation',         lastUpdated: '2026-04-30', status: 'Active' },
    { id: 'po',           label: 'Purchase order',    lastUpdated: '2026-04-30', status: 'Active' },
    { id: 'grn',          label: 'Goods receipt note',lastUpdated: '2026-04-01', status: 'Active' },
  ];
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {templates.map(t => (
          <div key={t.id} className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="font-serif text-xl">{t.label}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{t.id}</div>
              </div>
              <StatusPill status={t.status.toLowerCase()} tone="success" />
            </div>
            <div className="text-xs text-[color:var(--color-ink-muted)]">Last edited {t.lastUpdated}</div>
            <div className="mt-4 aspect-[210/297] bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] flex flex-col overflow-hidden">
              <div className="h-8 bg-[color:var(--color-crimson)]/85 flex items-center px-3">
                <span className="text-[9px] uppercase tracking-widest text-white font-bold">TRS · {t.label}</span>
              </div>
              <div className="p-3 space-y-1.5">
                <div className="h-1 bg-[color:var(--color-line)] rounded w-3/4" />
                <div className="h-1 bg-[color:var(--color-line)] rounded w-1/2" />
                <div className="h-1 bg-[color:var(--color-line)] rounded w-2/3" />
                <div className="mt-3 h-1 bg-[color:var(--color-ink)] rounded w-1/4" />
                <div className="grid grid-cols-4 gap-1 mt-1">
                  {Array(12).fill(0).map((_, i) => (
                    <div key={i} className="h-1 bg-[color:var(--color-line)] rounded" />
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <button className="h-9 px-3 text-xs bg-[color:var(--color-ink)] text-white rounded-md hover:bg-[color:var(--color-crimson)]">Edit template</button>
              <button className="h-9 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]">Preview</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BackupsTab({ backups }: { backups: Backup[] }) {
  const latestPrimary = backups.find(b => b.location === 'primary' && b.status === 'success');
  const latestOffsite = backups.find(b => b.location === 'offsite-s3' && b.status === 'success');
  const failed = backups.filter(b => b.status === 'failed').length;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Latest primary" value={latestPrimary?.runAt.slice(11) ?? '—'} sub={latestPrimary?.runAt.slice(0, 10)} accent="success" />
        <KPI label="Latest offsite" value={latestOffsite?.runAt.slice(11) ?? '—'} sub={latestOffsite?.runAt.slice(0, 10)} accent="success" />
        <KPI label="Recent failures" value={failed.toString()} accent={failed > 0 ? 'warn' : undefined} />
        <KPI label="Retention" value="30d + 90d + 2yr" sub="daily · weekly · annual" />
      </div>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Backup runs</div>
          <button className="h-9 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)] inline-flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Trigger backup now
          </button>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
              <th className="text-left px-3 py-2.5">Run at</th>
              <th className="text-left px-3 py-2.5">Location</th>
              <th className="text-right px-3 py-2.5 w-24">Size</th>
              <th className="text-right px-3 py-2.5 w-24">Duration</th>
              <th className="text-right px-3 py-2.5 w-24">Retention</th>
              <th className="text-left px-3 py-2.5 w-28">Status</th>
            </tr>
          </thead>
          <tbody>
            {backups.map(b => (
              <tr key={b.id} className="border-b border-[color:var(--color-line)] last:border-0">
                <td className="px-3 py-2 font-mono text-xs">{b.runAt}</td>
                <td className="px-3 py-2 text-xs capitalize">{b.location.replace('-', ' ')}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{(b.sizeMB / 1024).toFixed(2)} GB</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{b.duration}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{b.retentionDays}d</td>
                <td className="px-3 py-2">
                  {b.status === 'success' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-success)]"><CheckCircle2 className="w-3 h-3" /> success</span>}
                  {b.status === 'failed' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-danger)]"><XCircle className="w-3 h-3" /> failed</span>}
                  {b.status === 'running' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-warning)]"><RefreshCw className="w-3 h-3 animate-spin" /> running</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function MonitoringTab({ alerts, onResolve }: { alerts: SystemAlert[]; onResolve: (a: SystemAlert) => void }) {
  const active = alerts.filter(a => !a.resolved);
  const critical = active.filter(a => a.level === 'critical').length;
  const warnings = active.filter(a => a.level === 'warning').length;

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Active alerts" value={active.length.toString()} accent={active.length > 0 ? 'warn' : undefined} />
        <KPI label="Critical" value={critical.toString()} accent={critical > 0 ? 'danger' : undefined} />
        <KPI label="Warnings" value={warnings.toString()} accent={warnings > 0 ? 'warn' : undefined} />
        <KPI label="Uptime (30d)" value="99.98%" accent="success" />
      </div>

      <div className="space-y-3">
        {active.length === 0 && <div className="p-10 text-center text-[color:var(--color-ink-muted)] bg-white rounded-lg border border-[color:var(--color-line)]">All green — no active alerts.</div>}
        {active.map(a => {
          const isCrit = a.level === 'critical';
          const isWarn = a.level === 'warning';
          const Icon = isCrit ? AlertTriangle : isWarn ? Bell : Info;
          const tone = isCrit ? 'danger' : isWarn ? 'warning' : 'info';
          return (
            <div key={a.id} className="bg-white rounded-lg border border-[color:var(--color-line)] p-4 flex items-start gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                isCrit ? 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]' :
                isWarn ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                'bg-[color:var(--color-cobalt)]/10 text-[color:var(--color-cobalt)]'
              }`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 flex-wrap">
                  <div>
                    <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{a.category}</div>
                    <div className="text-sm">{a.message}</div>
                  </div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{a.at}</div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button onClick={() => onResolve(a)} className="h-8 px-3 text-xs bg-[color:var(--color-ink)] text-white rounded-md hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
                    <CheckCircle2 className="w-3 h-3" /> Mark resolved
                  </button>
                  <button className="h-8 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]">Snooze</button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-6">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Resolved history</div>
        <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <th className="text-left px-3 py-2">Time</th>
                <th className="text-left px-3 py-2">Category</th>
                <th className="text-left px-3 py-2">Message</th>
              </tr>
            </thead>
            <tbody>
              {alerts.filter(a => a.resolved).map(a => (
                <tr key={a.id} className="border-b border-[color:var(--color-line)] last:border-0 text-xs text-[color:var(--color-ink-muted)]">
                  <td className="px-3 py-2 font-mono">{a.at}</td>
                  <td className="px-3 py-2">{a.category}</td>
                  <td className="px-3 py-2">{a.message}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
