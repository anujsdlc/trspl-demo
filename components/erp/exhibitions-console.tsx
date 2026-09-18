'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Tent, Plus, Search, X, MapPin, Calendar, Users2, ArrowRight, Package,
  PackageCheck, PackageX, Wallet, AlertTriangle, ClipboardList, FileText,
  TrendingUp,
} from 'lucide-react';
import {
  loadExhibitions, saveExhibition, deleteExhibition, SEED_EXHIBITIONS,
  type ExhibitionEvent, type ExhibitionStatus,
} from '@/lib/erp/phase4';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

const STATUS_TONE: Record<ExhibitionStatus, 'muted' | 'info' | 'warning' | 'success' | 'danger'> = {
  draft: 'muted', approved: 'info', live: 'warning', closed: 'info', settled: 'success',
};

const STATUSES: ExhibitionStatus[] = ['draft', 'approved', 'live', 'closed', 'settled'];

export function ExhibitionsConsole() {
  const [rows, setRows] = useState<ExhibitionEvent[]>(SEED_EXHIBITIONS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setRows(loadExhibitions()); setHydrated(true); }, []);
  function refresh() { setRows(loadExhibitions()); }

  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<ExhibitionStatus | 'all'>('all');
  const [drawer, setDrawer] = useState<ExhibitionEvent | null>(null);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(e =>
        e.name.toLowerCase().includes(s) ||
        e.code.toLowerCase().includes(s) ||
        e.city.toLowerCase().includes(s) ||
        e.venue.toLowerCase().includes(s)
      );
    }
    if (statusFilter !== 'all') arr = arr.filter(e => e.status === statusFilter);
    return arr;
  }, [rows, q, statusFilter]);

  const kpi = useMemo(() => {
    const live = rows.filter(r => r.status === 'live').length;
    const upcoming = rows.filter(r => r.status === 'approved').length;
    const settledYtd = rows.filter(r => r.status === 'settled').reduce((s, r) => s + r.totalSoldValue, 0);
    const netProfitYtd = rows.filter(r => r.status === 'settled').reduce((s, r) => s + r.netProfit, 0);
    return { live, upcoming, settledYtd, netProfitYtd };
  }, [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Tent className="w-3 h-3" /> Field Ops
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Exhibitions &amp; Fairs</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Approval Issue Notes, on-site sales, shortage / damage reconciliation, and settlement invoicing with the correct GSTIN.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> New event
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Live now" value={kpi.live.toString()} accent="crimson" />
        <KPI label="Upcoming approved" value={kpi.upcoming.toString()} accent="warn" />
        <KPI label="Settled sales (YTD)" value={inr(kpi.settledYtd)} accent="success" />
        <KPI label="Net profit (YTD)" value={inr(kpi.netProfitYtd)} accent={kpi.netProfitYtd >= 0 ? 'success' : 'danger'} />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search event, code, city, venue…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', ...STATUSES] as const).map(s => (
            <button key={s} onClick={() => setStatusFilter(s)} className={`px-3 h-full capitalize ${statusFilter === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${rows.length}` : 'loading…'}
        </div>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {filtered.length === 0 && <div className="col-span-full px-4 py-16 text-center text-[color:var(--color-ink-muted)]">No events match this filter.</div>}
        {filtered.map(ev => {
          const soldQty = ev.lines.reduce((s, l) => s + l.qtySold, 0);
          const issuedQty = ev.lines.reduce((s, l) => s + l.qtyIssued, 0);
          const damaged = ev.lines.reduce((s, l) => s + l.qtyDamaged, 0);
          const shortage = ev.lines.reduce((s, l) => s + l.qtyShort, 0);
          const sellThrough = issuedQty ? (soldQty / issuedQty * 100) : 0;
          return (
            <button key={ev.id} onClick={() => setDrawer(ev)} className="text-left bg-white rounded-xl border border-[color:var(--color-line)] hover:border-[color:var(--color-ink)] hover:shadow-md transition p-5">
              <div className="flex items-start justify-between mb-3 gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] mb-0.5">{ev.code}</div>
                  <div className="font-serif text-xl leading-tight">{ev.name}</div>
                </div>
                <StatusPill status={ev.status} tone={STATUS_TONE[ev.status]} />
              </div>
              <div className="text-xs text-[color:var(--color-ink-muted)] flex items-center gap-1.5 mb-1"><MapPin className="w-3 h-3" /> {ev.venue} · {ev.city}</div>
              <div className="text-xs text-[color:var(--color-ink-muted)] flex items-center gap-1.5"><Calendar className="w-3 h-3" /> {ev.startDate} → {ev.endDate}</div>
              <div className="text-xs text-[color:var(--color-ink-muted)] flex items-center gap-1.5 mt-1"><Users2 className="w-3 h-3" /> {ev.responsibleStaff.join(', ') || 'Unassigned'}</div>

              <div className="grid grid-cols-3 gap-2 mt-4">
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Issued</div><div className="font-mono text-sm">{issuedQty}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Sold</div><div className="font-mono text-sm text-[color:var(--color-success)]">{soldQty}</div></div>
                <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Sell-through</div><div className="font-mono text-sm">{sellThrough.toFixed(0)}%</div></div>
              </div>

              {(damaged > 0 || shortage > 0) && (
                <div className="mt-3 flex flex-wrap gap-1.5 text-[10px]">
                  {damaged > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]"><PackageX className="w-3 h-3" /> {damaged} damaged</span>}
                  {shortage > 0 && <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]"><AlertTriangle className="w-3 h-3" /> {shortage} short</span>}
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-[color:var(--color-line)] flex items-center justify-between text-xs">
                <div>
                  <div className="text-[color:var(--color-ink-muted)]">Sold value</div>
                  <div className="font-mono font-medium">{inr(ev.totalSoldValue)}</div>
                </div>
                <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)]" />
              </div>
            </button>
          );
        })}
      </div>

      {drawer && <EventDrawer event={drawer} onClose={() => setDrawer(null)} onSave={e => { saveExhibition(e); refresh(); setDrawer(e); }} />}
    </div>
  );
}

function EventDrawer({ event, onClose, onSave }: { event: ExhibitionEvent; onClose: () => void; onSave: (e: ExhibitionEvent) => void }) {
  const soldQty = event.lines.reduce((s, l) => s + l.qtySold, 0);
  const issuedQty = event.lines.reduce((s, l) => s + l.qtyIssued, 0);
  const damaged = event.lines.reduce((s, l) => s + l.qtyDamaged, 0);
  const shortage = event.lines.reduce((s, l) => s + l.qtyShort, 0);
  const soldValue = event.lines.reduce((s, l) => s + l.qtySold * l.unitPrice * (1 - l.discount / 100), 0);
  const grossMargin = soldValue - event.totalExpenses;

  function approve() { onSave({ ...event, status: 'approved', approvalNote: `AIN-2026-${Math.floor(Math.random() * 999).toString().padStart(3, '0')}`, approvalDate: new Date().toISOString().slice(0, 10) }); }
  function goLive() { onSave({ ...event, status: 'live' }); }
  function close() { onSave({ ...event, status: 'closed' }); }
  function settle() {
    const inv = `INV-EX-2026-${Math.floor(Math.random() * 900 + 100)}`;
    onSave({
      ...event,
      status: 'settled',
      settlementInvoice: inv,
      settlementDate: new Date().toISOString().slice(0, 10),
      totalSoldValue: soldValue,
      totalSoldQty: soldQty,
      netProfit: grossMargin,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-3xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Exhibition · {event.code}</div>
            <div className="font-serif text-2xl">{event.name}</div>
            <div className="text-xs text-[color:var(--color-ink-muted)]">{event.venue} · {event.city} · {event.startDate} → {event.endDate}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Stat band */}
          <div className="grid grid-cols-4 gap-2">
            <MiniStat label="Issued" value={issuedQty.toString()} icon={Package} />
            <MiniStat label="Sold" value={soldQty.toString()} icon={PackageCheck} tone="success" />
            <MiniStat label="Damaged" value={damaged.toString()} icon={PackageX} tone="warn" />
            <MiniStat label="Short" value={shortage.toString()} icon={AlertTriangle} tone="danger" />
          </div>

          <div className="grid grid-cols-3 gap-2">
            <MiniStat label="Sold value" value={inr(soldValue)} icon={Wallet} tone="success" />
            <MiniStat label="On-site expenses" value={inr(event.totalExpenses)} icon={ClipboardList} />
            <MiniStat label="Net margin" value={inr(grossMargin)} icon={TrendingUp} tone={grossMargin >= 0 ? 'success' : 'danger'} />
          </div>

          {/* Lines table */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Stock issued & reconciliation</div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                    <th className="text-left px-3 py-2">Title</th>
                    <th className="text-right px-3 py-2 w-16">Issued</th>
                    <th className="text-right px-3 py-2 w-16">Sold</th>
                    <th className="text-right px-3 py-2 w-16">Returned</th>
                    <th className="text-right px-3 py-2 w-16">Short</th>
                    <th className="text-right px-3 py-2 w-16">Damaged</th>
                    <th className="text-right px-3 py-2 w-24">Line value</th>
                  </tr>
                </thead>
                <tbody>
                  {event.lines.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[color:var(--color-ink-muted)]">No stock issued yet.</td></tr>}
                  {event.lines.map((l, i) => {
                    const lineValue = l.qtySold * l.unitPrice * (1 - l.discount / 100);
                    return (
                      <tr key={i} className="border-b border-[color:var(--color-line)] last:border-0">
                        <td className="px-3 py-2">
                          <div>{l.title}</div>
                          {l.isbn && <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{l.isbn}</div>}
                        </td>
                        <td className="px-3 py-2 text-right font-mono">{l.qtyIssued}</td>
                        <td className="px-3 py-2 text-right font-mono text-[color:var(--color-success)]">{l.qtySold}</td>
                        <td className="px-3 py-2 text-right font-mono">{l.qtyReturned}</td>
                        <td className="px-3 py-2 text-right font-mono text-[color:var(--color-danger)]">{l.qtyShort || ''}</td>
                        <td className="px-3 py-2 text-right font-mono text-[color:var(--color-warning)]">{l.qtyDamaged || ''}</td>
                        <td className="px-3 py-2 text-right font-mono">{inr(lineValue)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Approval + settlement */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-4 space-y-3">
            <div className="grid md:grid-cols-2 gap-3 text-xs">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Approval Issue Note</div>
                <div className="font-mono text-sm">{event.approvalNote ?? '—'}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)]">{event.approvalDate ?? 'awaiting approval'}</div>
              </div>
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Settlement invoice</div>
                <div className="font-mono text-sm">{event.settlementInvoice ?? '—'}</div>
                <div className="text-[10px] text-[color:var(--color-ink-muted)]">{event.settlementDate ?? 'pending close'}</div>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-2">
              <button disabled={event.status !== 'draft'} onClick={approve} className="h-10 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <ClipboardList className="w-3.5 h-3.5" /> Issue AIN
              </button>
              <button disabled={event.status !== 'approved'} onClick={goLive} className="h-10 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <Tent className="w-3.5 h-3.5" /> Go live
              </button>
              <button disabled={event.status !== 'live'} onClick={close} className="h-10 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-paper)] disabled:opacity-40 disabled:cursor-not-allowed">
                <PackageCheck className="w-3.5 h-3.5" /> Close
              </button>
              <button disabled={!['closed', 'live'].includes(event.status)} onClick={settle} className="h-10 bg-[color:var(--color-ink)] text-white rounded-md text-xs font-medium inline-flex items-center justify-center gap-1.5 hover:bg-[color:var(--color-crimson)] disabled:opacity-40 disabled:cursor-not-allowed">
                <FileText className="w-3.5 h-3.5" /> Raise settlement
              </button>
            </div>
          </div>

          {event.notes && (
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)] text-xs text-[color:var(--color-ink-soft)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Notes</div>
              {event.notes}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MiniStat({ label, value, icon: Icon, tone }: { label: string; value: string; icon: React.ElementType; tone?: 'success' | 'warn' | 'danger' }) {
  const color = tone === 'success' ? 'text-[color:var(--color-success)]'
    : tone === 'warn' ? 'text-[color:var(--color-warning)]'
    : tone === 'danger' ? 'text-[color:var(--color-danger)]'
    : 'text-[color:var(--color-ink)]';
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        <Icon className="w-3 h-3" /> {label}
      </div>
      <div className={`font-mono text-lg mt-1 ${color}`}>{value}</div>
    </div>
  );
}
