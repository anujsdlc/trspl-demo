'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Wifi, WifiOff, Plus, Search, X, Laptop, Smartphone, Tablet, RefreshCw,
  AlertTriangle, CheckCircle2, Copy, HardDrive, Clock,
} from 'lucide-react';
import {
  loadDevices, saveDevice, deleteDevice, SEED_DEVICES,
  loadOfflineTxns, saveOfflineTxn, SEED_OFFLINE_TXNS,
  type OfflineDevice, type DeviceStatus, type OfflineTxn,
} from '@/lib/erp/phase4';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

const STATUS_TONE: Record<DeviceStatus, 'success' | 'warning' | 'muted' | 'danger'> = {
  online: 'success', 'sync-pending': 'warning', offline: 'muted', blocked: 'danger',
};

const DEVICE_ICON = { laptop: Laptop, tablet: Tablet, phone: Smartphone };

export function OfflinePOSConsole() {
  const [devices, setDevices] = useState<OfflineDevice[]>(SEED_DEVICES);
  const [txns, setTxns] = useState<OfflineTxn[]>(SEED_OFFLINE_TXNS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setDevices(loadDevices());
    setTxns(loadOfflineTxns());
    setHydrated(true);
  }, []);
  function refresh() {
    setDevices(loadDevices());
    setTxns(loadOfflineTxns());
  }

  const [tab, setTab] = useState<'devices' | 'sync' | 'conflicts'>('devices');
  const [q, setQ] = useState('');

  const kpi = useMemo(() => ({
    online: devices.filter(d => d.status === 'online').length,
    offline: devices.filter(d => d.status === 'offline').length,
    pending: devices.reduce((s, d) => s + d.pendingTransactions, 0),
    conflicts: devices.reduce((s, d) => s + d.pendingConflicts, 0),
  }), [devices]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Wifi className="w-3 h-3" /> Field Ops
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Offline Billing App</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Browser-based billing installed on laptops, tablets, and phones. Captures invoices offline and syncs to the central ERP when connectivity resumes.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Register device
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Devices online" value={kpi.online.toString()} accent="success" />
        <KPI label="Offline" value={kpi.offline.toString()} accent={kpi.offline > 0 ? 'warn' : undefined} />
        <KPI label="Pending sync" value={kpi.pending.toString()} accent={kpi.pending > 0 ? 'warn' : undefined} />
        <KPI label="Sync conflicts" value={kpi.conflicts.toString()} accent={kpi.conflicts > 0 ? 'danger' : undefined} />
      </div>

      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-4 overflow-x-auto">
        {([
          ['devices', 'Devices', HardDrive],
          ['sync', 'Pending sync', RefreshCw],
          ['conflicts', 'Conflicts', AlertTriangle],
        ] as [typeof tab, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-11 px-4 text-sm inline-flex items-center gap-2 border-b-2 transition ${
            tab === k ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
          }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
            {k === 'conflicts' && kpi.conflicts > 0 && (
              <span className="text-[9px] font-mono bg-[color:var(--color-danger)] text-white px-1.5 py-0.5 rounded-full">{kpi.conflicts}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'devices' && <DevicesTab devices={devices} q={q} setQ={setQ} hydrated={hydrated} onSync={d => { saveDevice({ ...d, lastSyncAt: new Date().toISOString().slice(0, 16).replace('T', ' '), pendingTransactions: 0, status: 'online', masterDataAgeDays: 0 }); refresh(); }} />}
      {tab === 'sync' && <SyncTab txns={txns.filter(t => t.status === 'pending')} devices={devices} onSync={t => { saveOfflineTxn({ ...t, status: 'synced', syncedAt: new Date().toISOString().slice(0, 16).replace('T', ' ') }); refresh(); }} />}
      {tab === 'conflicts' && <ConflictsTab txns={txns.filter(t => t.status === 'conflict' || t.status === 'duplicate')} devices={devices} onResolve={t => { saveOfflineTxn({ ...t, status: 'synced', syncedAt: new Date().toISOString().slice(0, 16).replace('T', ' '), conflictReason: undefined }); refresh(); }} />}
    </div>
  );
}

function DevicesTab({ devices, q, setQ, hydrated, onSync }: { devices: OfflineDevice[]; q: string; setQ: (s: string) => void; hydrated: boolean; onSync: (d: OfflineDevice) => void }) {
  const filtered = useMemo(() => {
    if (!q) return devices;
    const s = q.toLowerCase();
    return devices.filter(d => d.name.toLowerCase().includes(s) || d.code.toLowerCase().includes(s) || d.assignedTo.toLowerCase().includes(s));
  }, [devices, q]);
  return (
    <>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search device, code, assignee…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${devices.length}` : 'loading…'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && <div className="col-span-full py-16 text-center text-[color:var(--color-ink-muted)]">No devices match.</div>}
        {filtered.map(d => {
          const Icon = DEVICE_ICON[d.type];
          return (
            <div key={d.id} className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-md bg-[color:var(--color-paper)] flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-mono text-xs text-[color:var(--color-ink-muted)]">{d.code}</div>
                    <div className="font-medium">{d.name}</div>
                    <div className="text-[11px] text-[color:var(--color-ink-muted)]">{d.assignedTo}</div>
                  </div>
                </div>
                <StatusPill status={d.status} tone={STATUS_TONE[d.status]} />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-4 text-xs">
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Last sync</div><div className="font-mono">{d.lastSyncAt}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">App version</div><div className="font-mono">{d.appVersion}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Master data age</div><div className="font-mono flex items-center gap-1"><Clock className="w-3 h-3" /> {d.masterDataAgeDays}d</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Storage used</div><div className="font-mono">{d.storageUsedMB} MB</div></div>
              </div>
              {(d.pendingTransactions > 0 || d.pendingConflicts > 0) && (
                <div className="mt-4 flex flex-wrap gap-1.5 text-[10px]">
                  {d.pendingTransactions > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]"><RefreshCw className="w-3 h-3" /> {d.pendingTransactions} pending</span>}
                  {d.pendingConflicts > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]"><AlertTriangle className="w-3 h-3" /> {d.pendingConflicts} conflicts</span>}
                </div>
              )}
              <div className="mt-4 flex items-center gap-2">
                <button onClick={() => onSync(d)} disabled={d.status === 'online' && d.pendingTransactions === 0} className="h-9 px-3 text-xs bg-[color:var(--color-ink)] text-white rounded-md hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed">
                  <RefreshCw className="w-3.5 h-3.5" /> Force sync
                </button>
                <button className="h-9 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)] inline-flex items-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> Copy install link
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}

function SyncTab({ txns, devices, onSync }: { txns: OfflineTxn[]; devices: OfflineDevice[]; onSync: (t: OfflineTxn) => void }) {
  const devById = new Map(devices.map(d => [d.id, d]));
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
            <Th label="Ref #" className="w-52" />
            <Th label="Device" />
            <Th label="Offline timestamp" className="w-40" />
            <Th label="Customer" />
            <Th label="Items" className="w-16" align="right" />
            <Th label="Amount" className="w-28" align="right" />
            <Th label="Method" className="w-20" />
            <th className="w-24"></th>
          </tr>
        </thead>
        <tbody>
          {txns.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">Nothing pending — all synced.</td></tr>}
          {txns.map(t => {
            const d = devById.get(t.deviceId);
            return (
              <tr key={t.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                <td className="px-3 py-3 font-mono text-xs">{t.refNumber}</td>
                <td className="px-3 py-3 text-xs">
                  <div>{d?.name ?? t.deviceId}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{d?.code}</div>
                </td>
                <td className="px-3 py-3 font-mono text-xs">{t.createdAtOffline}</td>
                <td className="px-3 py-3 text-xs">{t.customer}</td>
                <td className="px-3 py-3 text-right font-mono text-xs">{t.itemsCount}</td>
                <td className="px-3 py-3 text-right font-mono">{inr(t.amount)}</td>
                <td className="px-3 py-3">
                  <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]">{t.paymentMethod}</span>
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => onSync(t)} className="text-xs text-[color:var(--color-crimson)] hover:underline inline-flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Sync now
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function ConflictsTab({ txns, devices, onResolve }: { txns: OfflineTxn[]; devices: OfflineDevice[]; onResolve: (t: OfflineTxn) => void }) {
  const devById = new Map(devices.map(d => [d.id, d]));
  return (
    <div className="space-y-3">
      {txns.length === 0 && <div className="p-10 text-center text-[color:var(--color-ink-muted)] bg-white rounded-lg border border-[color:var(--color-line)]">Zero conflicts — devices are clean.</div>}
      {txns.map(t => {
        const d = devById.get(t.deviceId);
        const isDup = t.status === 'duplicate';
        return (
          <div key={t.id} className="bg-white rounded-lg border border-[color:var(--color-line)] p-4 flex items-start gap-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isDup ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' : 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]'}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="font-mono text-xs">{t.refNumber}</div>
                  <div className="text-sm font-medium mt-0.5">{d?.name}</div>
                  <div className="text-xs text-[color:var(--color-ink-muted)]">{t.customer} · {t.createdAtOffline}</div>
                </div>
                <div className="text-right">
                  <div className="font-mono">{inr(t.amount)}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] uppercase tracking-widest">{t.paymentMethod}</div>
                </div>
              </div>
              <div className={`mt-2 text-xs p-2 rounded ${isDup ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' : 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]'}`}>
                {t.conflictReason}
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button onClick={() => onResolve(t)} className="h-9 px-3 text-xs bg-[color:var(--color-ink)] text-white rounded-md hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Accept & sync
                </button>
                <button className="h-9 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]">Reject</button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
