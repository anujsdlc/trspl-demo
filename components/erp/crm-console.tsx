'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  HeartHandshake, Plus, Search, X, Phone, Mail, MapPin, ArrowRight, Trash2,
  UserRound, PhoneCall, Globe, Users2, Tent, CheckCircle2, XCircle,
  FileText, Calendar,
} from 'lucide-react';
import {
  loadLeads, saveLead, deleteLead, SEED_LEADS,
  type Lead, type LeadStage, type LeadSource,
} from '@/lib/erp/phase4';
import { inr } from '@/lib/utils';
import { KPI, StatusPill } from './ui';

const STAGES: LeadStage[] = ['new', 'qualified', 'proposal', 'negotiation', 'won', 'lost'];

const STAGE_COLORS: Record<LeadStage, string> = {
  new: '#86868B', qualified: '#1D1D1F', proposal: '#B45309', negotiation: '#CA0538', won: '#16A34A', lost: '#86868B',
};

const SOURCE_ICON: Record<LeadSource, React.ElementType> = {
  exhibition: Tent, phone: PhoneCall, website: Globe, referral: Users2, 'walk-in': UserRound,
};

export function CRMConsole() {
  const [rows, setRows] = useState<Lead[]>(SEED_LEADS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { setRows(loadLeads()); setHydrated(true); }, []);
  function refresh() { setRows(loadLeads()); }

  const [q, setQ] = useState('');
  const [stageFilter, setStageFilter] = useState<LeadStage | 'all'>('all');
  const [sourceFilter, setSourceFilter] = useState<LeadSource | 'all'>('all');
  const [drawer, setDrawer] = useState<Lead | null>(null);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(l => l.name.toLowerCase().includes(s) || l.contactName.toLowerCase().includes(s) || l.city.toLowerCase().includes(s) || l.code.toLowerCase().includes(s));
    }
    if (stageFilter !== 'all') arr = arr.filter(l => l.stage === stageFilter);
    if (sourceFilter !== 'all') arr = arr.filter(l => l.source === sourceFilter);
    return arr;
  }, [rows, q, stageFilter, sourceFilter]);

  const kpi = useMemo(() => {
    const open = rows.filter(l => !['won', 'lost'].includes(l.stage));
    const weightedPipeline = open.reduce((s, l) => s + l.expectedValue * l.probability / 100, 0);
    const won = rows.filter(l => l.stage === 'won').reduce((s, l) => s + l.expectedValue, 0);
    const lost = rows.filter(l => l.stage === 'lost').reduce((s, l) => s + l.expectedValue, 0);
    const winRate = won + lost > 0 ? (won / (won + lost)) * 100 : 0;
    return { openCount: open.length, weightedPipeline, won, winRate };
  }, [rows]);

  const stageBuckets = useMemo(() => {
    const map = new Map<LeadStage, Lead[]>();
    for (const s of STAGES) map.set(s, []);
    for (const l of filtered) (map.get(l.stage) ?? []).push(l);
    return map;
  }, [filtered]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <HeartHandshake className="w-3 h-3" /> Field Ops
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">CRM &amp; Leads</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Lead capture from exhibitions, phone, web, and referrals — routed to a rep with a stage-wise pipeline and activity log.
          </p>
        </div>
        <button className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> New lead
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Open leads" value={kpi.openCount.toString()} accent="crimson" />
        <KPI label="Weighted pipeline" value={inr(kpi.weightedPipeline)} accent="warn" />
        <KPI label="Won (YTD)" value={inr(kpi.won)} accent="success" />
        <KPI label="Win rate" value={`${kpi.winRate.toFixed(0)}%`} accent={kpi.winRate >= 50 ? 'success' : undefined} />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search lead, contact, city, code…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', ...STAGES] as const).map(s => (
            <button key={s} onClick={() => setStageFilter(s)} className={`px-3 h-full capitalize ${stageFilter === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
          ))}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', 'exhibition', 'phone', 'website', 'referral', 'walk-in'] as const).map(s => (
            <button key={s} onClick={() => setSourceFilter(s as LeadSource | 'all')} className={`px-3 h-full capitalize ${sourceFilter === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s.replace('-', ' ')}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${rows.length}` : 'loading…'}
        </div>
      </div>

      {/* Kanban board */}
      <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {STAGES.map(stage => {
          const bucket = stageBuckets.get(stage) ?? [];
          const stageValue = bucket.reduce((s, l) => s + l.expectedValue, 0);
          return (
            <div key={stage} className="bg-[color:var(--color-paper)]/40 rounded-lg border border-[color:var(--color-line)] flex flex-col min-h-[300px]">
              <div className="px-3 py-3 border-b border-[color:var(--color-line)] flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase tracking-widest flex items-center gap-1.5" style={{ color: STAGE_COLORS[stage] }}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: STAGE_COLORS[stage] }} />
                    {stage}
                  </div>
                  <div className="font-mono text-xs text-[color:var(--color-ink-muted)]">{bucket.length} leads · {inr(stageValue)}</div>
                </div>
              </div>
              <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[500px]">
                {bucket.length === 0 && <div className="text-[11px] text-[color:var(--color-ink-muted)] text-center py-4">empty</div>}
                {bucket.map(lead => {
                  const Icon = SOURCE_ICON[lead.source];
                  return (
                    <button key={lead.id} onClick={() => setDrawer(lead)} className="w-full text-left bg-white rounded-md border border-[color:var(--color-line)] p-3 hover:border-[color:var(--color-ink)] transition">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div className="text-sm font-medium leading-tight line-clamp-1">{lead.name}</div>
                        <Icon className="w-3 h-3 text-[color:var(--color-ink-muted)] shrink-0" />
                      </div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{lead.code}</div>
                      <div className="text-[11px] text-[color:var(--color-ink-muted)] mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {lead.city}</div>
                      <div className="mt-2 flex items-center justify-between text-xs">
                        <span className="font-mono">{inr(lead.expectedValue)}</span>
                        <span className="text-[10px] text-[color:var(--color-ink-muted)]">{lead.probability}%</span>
                      </div>
                      <div className="mt-1 h-1 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ background: STAGE_COLORS[stage], width: `${lead.probability}%` }} />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {drawer && <LeadDrawer lead={drawer} onClose={() => setDrawer(null)} onSave={l => { saveLead(l); refresh(); setDrawer(l); }} onDelete={id => { if (confirm('Delete lead?')) { deleteLead(id); refresh(); setDrawer(null); } }} />}
    </div>
  );
}

function LeadDrawer({ lead, onClose, onSave, onDelete }: { lead: Lead; onClose: () => void; onSave: (l: Lead) => void; onDelete: (id: string) => void }) {
  function moveStage(stage: LeadStage) { onSave({ ...lead, stage, lastActivityAt: new Date().toISOString().slice(0, 10) }); }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{lead.code} · {lead.source}</div>
            <div className="font-serif text-2xl">{lead.name}</div>
            <div className="text-xs text-[color:var(--color-ink-muted)]">{lead.contactName}{lead.contactRole ? ` · ${lead.contactRole}` : ''}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => onDelete(lead.id)} className="p-2 hover:bg-white rounded text-[color:var(--color-danger)]"><Trash2 className="w-4 h-4" /></button>
            <button onClick={onClose} className="p-2 hover:bg-white rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <ContactRow icon={Phone} label="Phone" value={lead.phone} mono />
            <ContactRow icon={Mail} label="Email" value={lead.email} />
            <ContactRow icon={MapPin} label="Location" value={`${lead.city}, ${lead.state}`} />
            <ContactRow icon={UserRound} label="Assigned to" value={lead.assignedTo} />
          </div>

          {/* Deal panel */}
          <div className="p-4 bg-white rounded-lg border border-[color:var(--color-line)]">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Deal</div>
            <div className="grid grid-cols-3 gap-3 text-sm">
              <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Expected value</div><div className="font-mono text-xl">{inr(lead.expectedValue)}</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Probability</div><div className="font-mono text-xl">{lead.probability}%</div></div>
              <div><div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Weighted</div><div className="font-mono text-xl">{inr(lead.expectedValue * lead.probability / 100)}</div></div>
            </div>
            <div className="mt-3 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Expected close: <span className="font-mono">{lead.expectedClose}</span></div>
          </div>

          {/* Stage advance */}
          <div className="p-4 bg-white rounded-lg border border-[color:var(--color-line)]">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Move stage</div>
            <div className="grid grid-cols-3 gap-2">
              {STAGES.map(s => (
                <button
                  key={s}
                  onClick={() => moveStage(s)}
                  disabled={lead.stage === s}
                  className={`h-9 rounded-md text-xs uppercase tracking-widest capitalize transition disabled:opacity-40 ${
                    lead.stage === s
                      ? 'bg-[color:var(--color-ink)] text-white'
                      : 'border border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Activity feed */}
          <div className="p-4 bg-white rounded-lg border border-[color:var(--color-line)]">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Activity log</div>
            <div className="space-y-3">
              {lead.activities.length === 0 && <div className="text-xs text-[color:var(--color-ink-muted)]">No activity yet.</div>}
              {lead.activities.map((a, i) => (
                <div key={i} className="flex gap-3 pb-3 border-b border-[color:var(--color-line)] last:border-0">
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] font-mono w-24 shrink-0">{a.at}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium capitalize">{a.type}</div>
                    <div className="text-xs text-[color:var(--color-ink-soft)]">{a.note}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-0.5">by {a.by}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {lead.sourceDetail && (
            <div className="p-3 bg-white rounded-lg border border-[color:var(--color-line)] text-xs">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-0.5">Source</div>
              {lead.sourceDetail}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-0.5 flex items-center gap-1"><Icon className="w-3 h-3" /> {label}</div>
      <div className={mono ? 'font-mono text-xs' : 'text-sm'}>{value}</div>
    </div>
  );
}
