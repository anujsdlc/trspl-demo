'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Users,
  Plus,
  Search,
  Download,
  X,
  ArrowUpDown,
  Sparkles,
  TrendingUp,
  Award,
  Plane,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Send,
  Wallet,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  Calendar,
} from 'lucide-react';
import { TIERS, tierFor, type TierKey } from '@/lib/loyalty';
import {
  BASE_MEMBERS,
  loadMembers,
  saveMember,
  updateMember,
  deleteMember,
  newMemberId,
  suggestedPnr,
  tierMeta,
  type Member,
} from '@/lib/members';
import { inr } from '@/lib/utils';
import { ORDERS_STORE_KEY, type Order } from '@/lib/bag';

type SortKey = 'name' | 'tier' | 'points' | 'ytdSpend' | 'joinDate' | 'lastVisit';
type SortDir = 'asc' | 'desc';

const TIER_ORDER: Record<TierKey, number> = { SILVER: 0, GOLD: 1, PLATINUM: 2, BLACK: 3 };
const PAGE_SIZE = 25;

export function LoyaltyMembersConsole() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialId = searchParams.get('id');

  const [members, setMembers] = useState<Member[]>(BASE_MEMBERS);
  const [hydrated, setHydrated] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    setMembers(loadMembers());
    setHydrated(true);
    fetch(`/api/erp/${encodeURIComponent(ORDERS_STORE_KEY)}`, { cache: 'no-store' })
      .then(r => (r.ok ? r.json() : { rows: [] }))
      .then(d => setOrders(Array.isArray(d.rows) ? (d.rows as Order[]) : []))
      .catch(() => {});
  }, []);

  function refresh() {
    setMembers(loadMembers());
  }

  const [query, setQuery] = useState(useSearchParams().get('q') ?? '');
  const [tierFilter, setTierFilter] = useState<TierKey | 'all'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('ytdSpend');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(0);
  const [addOpen, setAddOpen] = useState(false);
  const [activeMemberId, setActiveMemberId] = useState<string | null>(initialId);

  const filtered = useMemo(() => {
    let arr = [...members];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.id.toLowerCase().includes(q) ||
        m.email.toLowerCase().includes(q) ||
        m.phone.toLowerCase().includes(q) ||
        m.city.toLowerCase().includes(q) ||
        (m.boardingPassPnr?.toLowerCase().includes(q) ?? false)
      );
    }
    if (tierFilter !== 'all') arr = arr.filter(m => m.tier === tierFilter);
    arr.sort((a, b) => {
      const mul = sortDir === 'asc' ? 1 : -1;
      switch (sortKey) {
        case 'name': return a.name.localeCompare(b.name) * mul;
        case 'tier': return (TIER_ORDER[a.tier] - TIER_ORDER[b.tier]) * mul;
        case 'points': return (a.points - b.points) * mul;
        case 'ytdSpend': return (a.ytdSpend - b.ytdSpend) * mul;
        case 'joinDate': return a.joinDate.localeCompare(b.joinDate) * mul;
        case 'lastVisit': return a.lastVisit.localeCompare(b.lastVisit) * mul;
      }
    });
    return arr;
  }, [members, query, tierFilter, sortKey, sortDir]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  useEffect(() => { if (page >= totalPages) setPage(0); }, [totalPages, page]);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const activeMember = useMemo(
    () => (activeMemberId ? members.find(m => m.id === activeMemberId) ?? null : null),
    [activeMemberId, members]
  );

  const tierCounts = useMemo(() => {
    const map: Record<TierKey, number> = { SILVER: 0, GOLD: 0, PLATINUM: 0, BLACK: 0 };
    for (const m of members) map[m.tier]++;
    return map;
  }, [members]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir(key === 'name' ? 'asc' : 'desc'); }
  }

  function handleAdd(m: Member) {
    saveMember(m);
    refresh();
    setAddOpen(false);
    setActiveMemberId(m.id);
  }

  function handleUpdate(id: string, patch: Partial<Member>) {
    updateMember(id, patch);
    refresh();
  }

  function handleDelete(id: string) {
    if (!confirm('Delete this member from the programme? This can be reversed by clearing the browser cache.')) return;
    deleteMember(id);
    refresh();
    if (activeMemberId === id) setActiveMemberId(null);
  }

  function exportCsv() {
    const headers = ['id', 'name', 'email', 'phone', 'city', 'tier', 'points', 'ytdSpend', 'lifetimeSpend', 'joinDate', 'lastVisit', 'visits', 'favouriteStore', 'boardingPassPnr'];
    const rows = filtered.map(m => headers.map(h => {
      const v = (m as unknown as Record<string, string | number | undefined>)[h];
      return v === undefined ? '' : String(v);
    }).map(c => /[",\n]/.test(c) ? `"${c.replace(/"/g, '""')}"` : c).join(','));
    const csv = headers.join(',') + '\n' + rows.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skyline-members-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  useEffect(() => {
    const current = searchParams.get('id') || null;
    if (current === activeMemberId) return;
    const params = new URLSearchParams(searchParams);
    if (activeMemberId) params.set('id', activeMemberId);
    else params.delete('id');
    router.replace(`?${params.toString()}`, { scroll: false });
  }, [activeMemberId, router, searchParams]);

  return (
    <div className="px-6 py-6 max-w-[1800px]">
      <div className="mb-6">
        <Link href="/admin/loyalty" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
          <ArrowLeft className="w-3 h-3" /> Loyalty Console
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-2">
              <Users className="w-3 h-3" /> Skyline Programme
            </div>
            <h1 className="font-serif text-4xl leading-tight tracking-tight">All Members</h1>
            <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">
              {members.length.toLocaleString('en-IN')} on file
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={exportCsv} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
              <Download className="w-3.5 h-3.5" /> Export {filtered.length !== members.length ? 'filtered' : 'all'}
            </button>
            <button onClick={() => setAddOpen(true)} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add member
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {TIERS.map(t => (
          <button
            key={t.key}
            onClick={() => setTierFilter(f => f === t.key ? 'all' : t.key)}
            className={`text-left p-4 bg-white rounded-lg border transition ${tierFilter === t.key ? 'border-[color:var(--color-ink)] shadow-sm' : 'border-[color:var(--color-line)] hover:border-[color:var(--color-line-strong)]'}`}
          >
            <div className={`h-1 rounded-full bg-gradient-to-r ${t.gradient} mb-2`} />
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{t.name}</div>
            <div className="editorial-num text-2xl mt-1">{tierCounts[t.key].toLocaleString('en-IN')}</div>
            <div className="text-[10px] font-mono text-[color:var(--color-ink-muted)]">
              {t.earn} pts/₹100 · {t.discount}% off
            </div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input
            value={query}
            onChange={e => { setQuery(e.target.value); setPage(0); }}
            placeholder="Search by name, member ID, email, phone, city, or PNR…"
            className="flex-1 bg-transparent text-sm focus:outline-none"
          />
          {query && <button onClick={() => setQuery('')}><X className="w-3.5 h-3.5" /></button>}
        </div>

        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          <button
            onClick={() => setTierFilter('all')}
            className={`px-3 h-full transition ${tierFilter === 'all' ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}
          >
            All tiers
          </button>
          {TIERS.map(t => (
            <button
              key={t.key}
              onClick={() => setTierFilter(t.key)}
              className={`px-3 h-full transition capitalize ${tierFilter === t.key ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}
            >
              {t.key.toLowerCase()}
            </button>
          ))}
        </div>

        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {filtered.length.toLocaleString('en-IN')} of {members.length.toLocaleString('en-IN')}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <SortHead label="Member" active={sortKey === 'name'} dir={sortDir} onClick={() => toggleSort('name')} />
                <th className="text-left px-3 py-2.5 w-44">Member ID</th>
                <th className="text-left px-3 py-2.5 w-28">Contact</th>
                <th className="text-left px-3 py-2.5 w-24">City</th>
                <SortHead label="Tier" active={sortKey === 'tier'} dir={sortDir} onClick={() => toggleSort('tier')} className="w-24" />
                <SortHead label="Points" active={sortKey === 'points'} dir={sortDir} onClick={() => toggleSort('points')} align="right" className="w-24" />
                <SortHead label="YTD spend" active={sortKey === 'ytdSpend'} dir={sortDir} onClick={() => toggleSort('ytdSpend')} align="right" className="w-28" />
                <SortHead label="Joined" active={sortKey === 'joinDate'} dir={sortDir} onClick={() => toggleSort('joinDate')} className="w-28" />
                <SortHead label="Last visit" active={sortKey === 'lastVisit'} dir={sortDir} onClick={() => toggleSort('lastVisit')} className="w-28" />
                <th className="w-16"></th>
              </tr>
            </thead>
            <tbody>
              {paged.length === 0 && (
                <tr>
                  <td colSpan={10} className="px-4 py-12 text-center text-sm text-[color:var(--color-ink-muted)]">
                    No members match this filter.
                  </td>
                </tr>
              )}
              {paged.map(m => {
                const tier = tierMeta(m.tier);
                return (
                  <tr
                    key={m.id}
                    onClick={() => setActiveMemberId(m.id)}
                    className={`border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30 transition cursor-pointer ${activeMemberId === m.id ? 'bg-[color:var(--color-paper)]/40' : ''}`}
                  >
                    <td className="px-4 py-2.5">
                      <div className="flex items-center gap-3">
                        <Avatar name={m.name} tier={m.tier} />
                        <div>
                          <div className="font-medium leading-tight">{m.name}</div>
                          {m.createdInSession && (
                            <div className="text-[9px] uppercase tracking-widest text-[color:var(--color-crimson)] font-mono">Added just now</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{m.id}</td>
                    <td className="px-3 py-2.5 text-[11px] text-[color:var(--color-ink-soft)]">
                      <div className="truncate max-w-[160px]" title={m.email}>{m.email}</div>
                      <div className="font-mono text-[10px]">{m.phone}</div>
                    </td>
                    <td className="px-3 py-2.5 text-xs">{m.city}</td>
                    <td className="px-3 py-2.5">
                      <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.gradient} ${tier.textOn}`}>{m.tier}</span>
                    </td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{m.points.toLocaleString('en-IN')}</td>
                    <td className="px-3 py-2.5 text-right font-mono text-xs">{inr(m.ytdSpend)}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-[color:var(--color-ink-muted)]">{m.joinDate}</td>
                    <td className="px-3 py-2.5 text-xs font-mono text-[color:var(--color-ink-muted)]">{m.lastVisit}</td>
                    <td className="px-2 py-2.5 text-right">
                      <button
                        onClick={e => { e.stopPropagation(); setActiveMemberId(m.id); }}
                        className="p-1 hover:bg-[color:var(--color-paper)] rounded"
                        title="View card"
                      >
                        <MoreHorizontal className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-[color:var(--color-line)] flex items-center justify-between text-xs">
          <div className="text-[color:var(--color-ink-muted)] font-mono">
            {hydrated ? `${page * PAGE_SIZE + 1}–${Math.min((page + 1) * PAGE_SIZE, filtered.length)} of ${filtered.length}` : 'loading…'}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(p => Math.max(0, p - 1))}
              disabled={page === 0}
              className="h-8 w-8 border border-[color:var(--color-line)] rounded flex items-center justify-center disabled:opacity-40 hover:bg-[color:var(--color-paper)]"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="px-2 font-mono text-[color:var(--color-ink-muted)]">page {page + 1} / {totalPages}</span>
            <button
              onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="h-8 w-8 border border-[color:var(--color-line)] rounded flex items-center justify-center disabled:opacity-40 hover:bg-[color:var(--color-paper)]"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {addOpen && <AddMemberModal onClose={() => setAddOpen(false)} onSave={handleAdd} existing={members} />}
      {activeMember && (
        <MemberDetailDrawer
          member={activeMember}
          orders={orders}
          onClose={() => setActiveMemberId(null)}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

function SortHead({ label, active, dir, onClick, align, className }: {
  label: string; active: boolean; dir: SortDir; onClick: () => void; align?: 'right'; className?: string;
}) {
  return (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className || ''}`}>
      <button onClick={onClick} className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] inline-flex items-center gap-1 hover:text-[color:var(--color-ink)]">
        {label}
        <ArrowUpDown className={`w-3 h-3 ${active ? 'text-[color:var(--color-ink)]' : 'text-[color:var(--color-ink-faint)]'}`} />
      </button>
    </th>
  );
}

function Avatar({ name, tier }: { name: string; tier: TierKey }) {
  const t = tierMeta(tier);
  const initials = name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  return (
    <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} ${t.textOn} flex items-center justify-center text-[11px] font-mono font-medium`}>
      {initials}
    </div>
  );
}

function AddMemberModal({ onClose, onSave, existing }: { onClose: () => void; onSave: (m: Member) => void; existing: Member[] }) {
  const existingIds = useMemo(() => new Set(existing.map(m => m.id)), [existing]);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [city, setCity] = useState('Bangalore');
  const [tier, setTier] = useState<TierKey>('SILVER');
  const [initialPoints, setInitialPoints] = useState(250);
  const [initialSpend, setInitialSpend] = useState(0);
  const [linkPnr, setLinkPnr] = useState(false);
  const [pnr, setPnr] = useState('');
  const [id, setId] = useState(() => newMemberId());
  const [error, setError] = useState('');

  const suggestedTier = tierFor(initialSpend).key;
  useEffect(() => { setTier(suggestedTier); }, [suggestedTier]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email address'); return; }
    if (existingIds.has(id)) { setError('Member ID collides with an existing member — click regenerate.'); return; }
    const today = new Date().toISOString().slice(0, 10);
    onSave({
      id,
      name: name.trim(),
      email: email.trim().toLowerCase(),
      phone: phone.trim(),
      city,
      tier,
      points: initialPoints,
      ytdSpend: initialSpend,
      lifetimeSpend: initialSpend,
      joinDate: today,
      lastVisit: today,
      visits: 0,
      favouriteStore: '',
      boardingPassPnr: linkPnr ? pnr.toUpperCase() : undefined,
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Skyline Programme</div>
            <div className="font-serif text-2xl leading-tight">Enrol a new member</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>

        <div className="p-6 space-y-4 text-sm">
          {error && (
            <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Full name</Label>
              <input value={name} onChange={e => setName(e.target.value)} required
                     className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white" />
            </div>
            <div>
              <Label>City</Label>
              <select value={city} onChange={e => setCity(e.target.value)}
                      className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white">
                {['Bangalore', 'Delhi', 'Mumbai', 'Gurgaon', 'Kochi', 'Hyderabad', 'Chennai', 'Pune', 'Goa', 'Indore', 'Kolkata', 'Bhubaneshwar'].map(c => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Email</Label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                     className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white" />
            </div>
            <div>
              <Label>Phone</Label>
              <input value={phone} onChange={e => setPhone(e.target.value)} required
                     className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm font-mono bg-white" />
            </div>
          </div>

          <div>
            <Label>Member ID (auto-generated)</Label>
            <div className="flex items-center gap-2">
              <input value={id} readOnly
                     className="flex-1 h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-[color:var(--color-paper)] font-mono" />
              <button type="button" onClick={() => setId(newMemberId())}
                      className="h-10 px-3 border border-[color:var(--color-line)] rounded-md text-xs hover:bg-[color:var(--color-paper)]">
                Regenerate
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Initial points balance</Label>
              <input type="number" min={0} value={initialPoints} onChange={e => setInitialPoints(Math.max(0, Number(e.target.value)))}
                     className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm font-mono bg-white" />
              <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-1">Default 250 = sign-up welcome bonus.</div>
            </div>
            <div>
              <Label>Opening spend (YTD)</Label>
              <input type="number" min={0} value={initialSpend} onChange={e => setInitialSpend(Math.max(0, Number(e.target.value)))}
                     className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm font-mono bg-white" />
              <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-1">Determines starting tier.</div>
            </div>
          </div>

          <div>
            <Label>Tier</Label>
            <div className="grid grid-cols-4 gap-2">
              {TIERS.map(t => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTier(t.key)}
                  className={`h-10 rounded-md text-xs uppercase tracking-widest transition border ${tier === t.key ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)] border-[color:var(--color-ink)]' : 'border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]'}`}
                >
                  {t.key}
                </button>
              ))}
            </div>
            <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-1">
              Suggested from spend: <span className="font-mono">{suggestedTier}</span>. Override manually if needed.
            </div>
          </div>

          <div className="p-3 border border-[color:var(--color-line)] rounded-md space-y-2">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input type="checkbox" checked={linkPnr} onChange={e => { setLinkPnr(e.target.checked); if (e.target.checked && !pnr) setPnr(suggestedPnr()); }}
                     className="accent-[color:var(--color-crimson)]" />
              <Plane className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
              Link a boarding pass PNR for airport-linked earn bonuses
            </label>
            {linkPnr && (
              <div className="flex items-center gap-2 pl-6">
                <input value={pnr} onChange={e => setPnr(e.target.value.toUpperCase())} maxLength={6}
                       className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm font-mono uppercase bg-white w-32" />
                <button type="button" onClick={() => setPnr(suggestedPnr())}
                        className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]">
                  Suggest
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-between items-center">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            Skyline · {tier} · {initialPoints.toLocaleString('en-IN')} pts
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
            <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" /> Enrol member
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1.5">{children}</div>;
}

function MemberDetailDrawer({ member, orders, onClose, onUpdate, onDelete }: {
  member: Member;
  orders: Order[];
  onClose: () => void;
  onUpdate: (id: string, patch: Partial<Member>) => void;
  onDelete: (id: string) => void;
}) {
  const tier = tierMeta(member.tier);
  const next = TIERS.find(t => t.threshold > member.ytdSpend);
  const toNext = next ? next.threshold - member.ytdSpend : 0;
  const [adjustOpen, setAdjustOpen] = useState<'add' | 'redeem' | null>(null);
  const [editMode, setEditMode] = useState(false);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div className="w-full max-w-2xl bg-[color:var(--color-cream)] h-full overflow-y-auto shadow-2xl animate-slide-in-right" onClick={e => e.stopPropagation()}>
        <div className="sticky top-0 z-10 bg-[color:var(--color-cream)] border-b border-[color:var(--color-line)] px-6 py-4 flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Member · {member.id}</div>
            <div className="font-serif text-2xl leading-tight">{member.name}</div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={() => setEditMode(v => !v)} className="p-2 hover:bg-white rounded" title="Edit member">
              <Edit2 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(member.id)} className="p-2 hover:bg-white rounded text-[color:var(--color-danger)]" title="Remove member">
              <Trash2 className="w-4 h-4" />
            </button>
            <button onClick={onClose} className="p-2 hover:bg-white rounded"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <MemberCard member={member} />

          <div className="grid grid-cols-3 gap-3">
            <StatBlock label="Points balance" value={member.points.toLocaleString('en-IN')} sub={`= ${inr(Math.floor(member.points * 0.5))} redeemable`} accent />
            <StatBlock label="YTD spend" value={inr(member.ytdSpend)} sub={`Tier: ${tier.name}`} />
            <StatBlock label="Lifetime spend" value={inr(member.lifetimeSpend)} sub={`${member.visits} visits`} />
          </div>

          {next ? (
            <div className="p-4 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="text-[color:var(--color-ink-muted)]">Progress to <span className="font-medium">{next.name}</span></span>
                <span className="font-mono">{inr(toNext)} to go</span>
              </div>
              <div className="h-2 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                <div
                  className={`h-full bg-gradient-to-r ${next.gradient}`}
                  style={{ width: `${Math.max(6, Math.min(100, (member.ytdSpend / next.threshold) * 100))}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="p-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-lg text-xs">
              <TrendingUp className="w-3.5 h-3.5 inline mr-2 text-[color:var(--color-mustard)]" />
              At the highest tier — Skyline Black perks apply for the full membership year.
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setAdjustOpen('add')} className="h-10 border border-[color:var(--color-line)] rounded-md text-sm font-medium hover:bg-white inline-flex items-center justify-center gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Add points
            </button>
            <button onClick={() => setAdjustOpen('redeem')} className="h-10 border border-[color:var(--color-line)] rounded-md text-sm font-medium hover:bg-white inline-flex items-center justify-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" /> Redeem points
            </button>
          </div>

          {adjustOpen && (
            <AdjustPointsPanel
              member={member}
              mode={adjustOpen}
              onCancel={() => setAdjustOpen(null)}
              onApply={patch => { onUpdate(member.id, patch); setAdjustOpen(null); }}
            />
          )}

          <div className="bg-white rounded-lg border border-[color:var(--color-line)]">
            <div className="px-5 py-3 border-b border-[color:var(--color-line)] flex items-center justify-between">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Profile</div>
              <button onClick={() => setEditMode(v => !v)} className="text-[10px] uppercase tracking-widest text-[color:var(--color-crimson)] hover:underline">
                {editMode ? 'Done' : 'Edit'}
              </button>
            </div>
            <div className="p-5 grid grid-cols-2 gap-4 text-sm">
              <ProfileField icon={Mail} label="Email" value={member.email} editable={editMode}
                            onSave={v => onUpdate(member.id, { email: v })} />
              <ProfileField icon={Phone} label="Phone" value={member.phone} editable={editMode} mono
                            onSave={v => onUpdate(member.id, { phone: v })} />
              <ProfileField icon={MapPin} label="City" value={member.city} editable={editMode}
                            onSave={v => onUpdate(member.id, { city: v })} />
              <ProfileField icon={Award} label="Favourite store" value={member.favouriteStore || '—'} editable={editMode}
                            onSave={v => onUpdate(member.id, { favouriteStore: v })} />
              <ProfileField icon={Calendar} label="Joined" value={member.joinDate} mono />
              <ProfileField icon={Plane} label="Boarding-pass PNR" value={member.boardingPassPnr || 'not linked'} mono editable={editMode}
                            onSave={v => onUpdate(member.id, { boardingPassPnr: v.trim() ? v.toUpperCase() : undefined })} />
            </div>
          </div>

          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-2">
              <Sparkles className="w-3 h-3" /> {tier.name} perks
            </div>
            <ul className="space-y-1.5 text-xs">
              {tier.perks.map(p => (
                <li key={p} className="flex items-start gap-2">
                  <CheckCircle2 className="w-3 h-3 text-[color:var(--color-success)] mt-0.5 shrink-0" />
                  <span>{p}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Recent activity</div>
            <ActivityFeed member={member} orders={orders} />
          </div>

          <button className="w-full h-10 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center justify-center gap-2">
            <Send className="w-3.5 h-3.5" /> Send welcome email + digital card
          </button>
        </div>
      </div>
    </div>
  );
}

function StatBlock({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className={`p-4 bg-white rounded-lg border ${accent ? 'border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)]'}`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      <div className="editorial-num text-2xl">{value}</div>
      {sub && <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono mt-1">{sub}</div>}
    </div>
  );
}

function ProfileField({ icon: Icon, label, value, editable, mono, onSave }: {
  icon: React.ElementType; label: string; value: string; editable?: boolean; mono?: boolean; onSave?: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-1.5">
        <Icon className="w-3 h-3" /> {label}
      </div>
      {editable && onSave ? (
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          onBlur={() => draft !== value && onSave(draft)}
          className={`w-full h-9 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white ${mono ? 'font-mono' : ''}`}
        />
      ) : (
        <div className={`text-sm ${mono ? 'font-mono text-xs' : ''}`}>{value}</div>
      )}
    </div>
  );
}

function AdjustPointsPanel({ member, mode, onCancel, onApply }: {
  member: Member; mode: 'add' | 'redeem'; onCancel: () => void; onApply: (patch: Partial<Member>) => void;
}) {
  const [qty, setQty] = useState(mode === 'add' ? 500 : 200);
  const [reason, setReason] = useState('');
  const cap = mode === 'redeem' ? member.points : 100000;
  const newBalance = mode === 'add' ? member.points + qty : Math.max(0, member.points - qty);
  const canSubmit = qty > 0 && qty <= cap && (mode === 'add' ? true : member.points >= qty);

  return (
    <div className="p-4 bg-white rounded-lg border border-[color:var(--color-ink)]">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">
        {mode === 'add' ? 'Credit points to member' : 'Redeem points'}
      </div>
      <div className="grid grid-cols-[1fr_auto] items-end gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Quantity</div>
          <input
            type="number"
            value={qty}
            onChange={e => setQty(Math.max(0, Math.min(cap, Number(e.target.value))))}
            className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm font-mono"
          />
        </div>
        <div className="text-right text-xs">
          <div className="text-[color:var(--color-ink-muted)]">New balance</div>
          <div className="font-mono text-lg">{newBalance.toLocaleString('en-IN')}</div>
        </div>
      </div>
      <div className="mt-3">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Reason</div>
        <select value={reason} onChange={e => setReason(e.target.value)}
                className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white">
          <option value="">Select…</option>
          {(mode === 'add'
            ? ['Sign-up bonus', 'Anniversary bonus', 'Referral credit', 'Goodwill / recovery', 'Campaign entry', 'Manual correction']
            : ['Reward redemption', 'Store voucher', 'Charity donation', 'Manual correction']
          ).map(r => <option key={r}>{r}</option>)}
        </select>
      </div>
      <div className="mt-4 flex justify-end gap-2">
        <button onClick={onCancel} className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs">Cancel</button>
        <button
          disabled={!canSubmit}
          onClick={() => onApply({ points: newBalance })}
          className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] disabled:opacity-40"
        >
          {mode === 'add' ? `+ Credit ${qty.toLocaleString('en-IN')} pts` : `− Redeem ${qty.toLocaleString('en-IN')} pts`}
        </button>
      </div>
    </div>
  );
}

function ActivityFeed({ member, orders }: { member: Member; orders: Order[] }) {
  const mine = useMemo(
    () => orders
      .filter(o => o.customer.email.toLowerCase() === member.email.toLowerCase())
      .sort((a, b) => b.placedAt.localeCompare(a.placedAt))
      .slice(0, 5),
    [orders, member.email],
  );

  return (
    <div className="space-y-2 text-xs">
      {mine.map(o => (
        <div key={o.id} className="flex items-center gap-3 py-1.5 border-b border-[color:var(--color-line)] last:border-0">
          <div className="text-[9px] font-mono uppercase tracking-widest w-16 text-[color:var(--color-ink-muted)]">earn</div>
          <div className="flex-1">
            <div>Earned +{o.pointsEarned.toLocaleString('en-IN')} pts · {inr(o.total)}</div>
            <div className="text-[color:var(--color-ink-muted)] text-[11px]">
              {o.delivery.method === 'pickup' ? o.delivery.storeCode : o.delivery.city} · {o.id} · {o.status}
            </div>
          </div>
          <div className="text-[10px] font-mono text-[color:var(--color-ink-faint)]">
            {new Date(o.placedAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      ))}
      {mine.length === 0 && (
        <div className="py-2 text-[color:var(--color-ink-muted)]">
          No orders have been placed against this member yet.
        </div>
      )}
      <div className="flex items-center gap-3 py-1.5">
        <div className="text-[9px] font-mono uppercase tracking-widest w-16 text-[color:var(--color-ink-muted)]">join</div>
        <div className="flex-1">
          <div>Joined the programme</div>
          <div className="text-[color:var(--color-ink-muted)] text-[11px]">{member.favouriteStore}</div>
        </div>
        <div className="text-[10px] font-mono text-[color:var(--color-ink-faint)]">{member.joinDate}</div>
      </div>
    </div>
  );
}

function MemberCard({ member }: { member: Member }) {
  const tier = tierMeta(member.tier);
  return (
    <div className="relative max-w-[440px] mx-auto">
      <div className="absolute -inset-6 bg-[color:var(--color-crimson)]/12 blur-3xl rounded-full -z-10" />
      <div className="holo aspect-[1.586/1] rounded-[22px] px-7 py-6 text-white shadow-[0_20px_60px_-20px_rgba(196,33,39,0.5)] relative overflow-hidden">
        <div className="relative z-10 flex items-start justify-between">
          <div>
            <div className="text-[9px] uppercase tracking-[0.35em] text-white/55 font-mono">Travel Retail Services</div>
            <div className="font-serif text-[26px] mt-1 tracking-tight leading-none">Skyline</div>
          </div>
          <div className="text-right">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/55 font-mono">{tier.name}</div>
            <div className="mt-1 inline-flex items-center gap-1 text-white/90">
              <Sparkles className="w-3 h-3" />
              <span className="text-[10px] font-mono uppercase tracking-wider">{tier.earn}× base rate</span>
            </div>
          </div>
        </div>
        <div className="relative z-10 mt-5">
          <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-mono">Member</div>
          <div className="font-serif text-[19px] mt-1 leading-tight">{member.name}</div>
          <div className="font-mono text-[11px] mt-1.5 text-white/65 tracking-wider">{member.id}</div>
        </div>
        <div className="relative z-10 mt-4 flex items-end justify-between gap-4">
          <div className="min-w-0">
            <div className="text-[9px] uppercase tracking-[0.25em] text-white/45 font-mono">Points balance</div>
            <div className="editorial-num text-[32px] leading-none mt-1">
              {member.points.toLocaleString('en-IN')}
            </div>
            <div className="text-[10px] text-white/45 font-mono mt-1 tracking-wider">Member since {member.joinDate}</div>
          </div>
          <div className="shrink-0 w-[72px] h-[72px] bg-white rounded-lg p-2 shadow-inner">
            <QRPattern seed={member.id} />
          </div>
        </div>
        <Plane className="absolute top-8 right-32 w-8 h-8 text-white/10 rotate-45 pointer-events-none" />
      </div>
    </div>
  );
}

function QRPattern({ seed }: { seed: string }) {
  const size = 21;
  const cells: boolean[][] = [];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = ((hash << 5) - hash + seed.charCodeAt(i)) | 0;
  for (let y = 0; y < size; y++) {
    cells[y] = [];
    for (let x = 0; x < size; x++) {
      hash = (hash * 1103515245 + 12345) & 0x7fffffff;
      cells[y][x] = (hash % 100) > 55;
    }
  }
  const finder: [number, number][] = [[0, 0], [0, size - 7], [size - 7, 0]];
  for (const [oy, ox] of finder) {
    for (let y = 0; y < 7; y++) for (let x = 0; x < 7; x++) {
      const edge = y === 0 || y === 6 || x === 0 || x === 6;
      const inner = y >= 2 && y <= 4 && x >= 2 && x <= 4;
      cells[oy + y][ox + x] = edge || inner;
    }
  }
  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full">
      <rect width={size} height={size} fill="white" />
      {cells.flatMap((row, y) => row.map((on, x) =>
        on ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill="black" /> : null
      ))}
    </svg>
  );
}
