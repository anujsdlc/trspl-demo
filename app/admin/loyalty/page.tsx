import { TIERS, BONUSES, CATEGORY_MULTIPLIER, VOLUME_TIERS } from '@/lib/loyalty';
import { inr } from '@/lib/utils';
import { Award, Users, TrendingUp, Gift, Sparkles, Target, Zap, Plus, Play, MoreHorizontal, Edit2 } from 'lucide-react';

const MOCK_MEMBERS = [
  { id: 'TRS-8827-4413-9021', name: 'Anjali Krishnan',    tier: 'PLATINUM', points: 12480, ytd: 47200, city: 'Bangalore', join: '2024-04-11' },
  { id: 'TRS-8827-1902-4711', name: 'Rahul Mehta',         tier: 'GOLD',     points: 6220,  ytd: 22400, city: 'Delhi',     join: '2024-06-02' },
  { id: 'TRS-8827-3388-2011', name: 'Sanjay Iyer',         tier: 'BLACK',    points: 34120, ytd: 128500,city: 'Mumbai',    join: '2023-11-19' },
  { id: 'TRS-8827-5501-7729', name: 'Priya Sharma',        tier: 'SILVER',   points: 890,   ytd: 4200,  city: 'Gurgaon',   join: '2025-02-14' },
  { id: 'TRS-8827-9911-4402', name: 'Kavya Nair',          tier: 'PLATINUM', points: 15790, ytd: 62100, city: 'Kochi',     join: '2024-01-08' },
  { id: 'TRS-8827-2244-8801', name: 'Vikram Rao',          tier: 'GOLD',     points: 8830,  ytd: 27600, city: 'Hyderabad', join: '2024-08-22' },
  { id: 'TRS-8827-6677-1155', name: 'Meera Krishnan',      tier: 'SILVER',   points: 1440,  ytd: 6100,  city: 'Chennai',   join: '2025-01-28' },
  { id: 'TRS-8827-4488-9922', name: 'Deepika Bhatt',       tier: 'GOLD',     points: 9210,  ytd: 24800, city: 'Pune',      join: '2024-05-30' },
];

const CAMPAIGNS = [
  { name: '4× on Pashma cashmere', run: 'Sep 12 – Oct 15', status: 'live',      earn: '4× multiplier', engaged: 812 },
  { name: 'Boarding-pass linked bonus', run: 'Ongoing',    status: 'live',      earn: '+250 pts',      engaged: 2140 },
  { name: 'Referral double-down',       run: 'Sep 1 – 30', status: 'live',      earn: '1,500 pts',     engaged: 314 },
  { name: 'Diwali gifting hamper',      run: 'Oct 20 – Nov 5', status: 'draft', earn: '3× on gifts',   engaged: 0 },
];

export default function LoyaltyAdmin() {
  const total = 28412;
  const monthNew = 1847;
  const pointsIssued = 4.2;
  const pointsRedeemed = 1.05;

  return (
    <div className="px-6 py-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-2">
            <Award className="w-3 h-3" /> Skyline Programme
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Loyalty Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs hover:bg-[color:var(--color-paper)]">Export members</button>
          <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
            <Plus className="w-3.5 h-3.5" /> New campaign
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <BigKPI label="Total members" value={total.toLocaleString('en-IN')} delta="+147 today" icon={Users} accent />
        <BigKPI label="New this month" value={monthNew.toLocaleString('en-IN')} delta="+22% vs last" icon={TrendingUp} />
        <BigKPI label="Points issued (mo)" value={`${pointsIssued}M`} delta="₹21L equiv" icon={Sparkles} />
        <BigKPI label="Points redeemed" value={`${pointsRedeemed}M`} delta={`${Math.round((pointsRedeemed/pointsIssued)*100)}% redeem rate`} icon={Gift} />
        <BigKPI label="Avg spend / member" value={inr(8420)} delta="+8% YoY" icon={Target} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {/* Left: Members */}
        <div className="md:col-span-2 space-y-6">
          {/* Tier distribution */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Tier distribution</div>
                <div className="font-serif text-2xl mt-1">{total.toLocaleString('en-IN')} members across 4 tiers</div>
              </div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">Rolling 12-month spend</div>
            </div>
            <TierDistribution />
            <div className="mt-6 grid grid-cols-4 gap-3">
              {TIERS.map((t, i) => {
                const share = [64, 24, 9, 3][i];
                const count = Math.round(total * share / 100);
                return (
                  <div key={t.key} className="text-center">
                    <div className={`h-1 rounded-full bg-gradient-to-r ${t.gradient} mb-2`} />
                    <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{t.name.split(' ')[1]}</div>
                    <div className="editorial-num text-2xl mt-1">{count.toLocaleString('en-IN')}</div>
                    <div className="text-[10px] font-mono text-[color:var(--color-ink-muted)]">{share}%</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Recent members */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-6 border-b border-[color:var(--color-line)] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Members</div>
                <div className="font-serif text-2xl mt-1">Top Skyliners</div>
              </div>
              <button className="text-xs border-b border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)]">All members</button>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                  <th className="text-left px-4 py-2.5">Member ID</th>
                  <th className="text-left px-3 py-2.5">Name</th>
                  <th className="text-left px-3 py-2.5">City</th>
                  <th className="text-left px-3 py-2.5">Tier</th>
                  <th className="text-right px-3 py-2.5">Points</th>
                  <th className="text-right px-3 py-2.5">YTD spend</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {MOCK_MEMBERS.map(m => {
                  const tier = TIERS.find(t => t.key === m.tier)!;
                  return (
                    <tr key={m.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{m.id}</td>
                      <td className="px-3 py-2.5 text-xs font-medium">{m.name}</td>
                      <td className="px-3 py-2.5 text-xs">{m.city}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.gradient} ${tier.textOn}`}>{m.tier}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{m.points.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{inr(m.ytd)}</td>
                      <td className="px-2 py-2.5">
                        <button className="p-1 hover:bg-[color:var(--color-paper)] rounded"><MoreHorizontal className="w-3.5 h-3.5" /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Programme config */}
        <div className="space-y-6">
          {/* Campaigns */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)]">
            <div className="p-5 border-b border-[color:var(--color-line)] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Live campaigns</div>
                <div className="font-serif text-lg mt-0.5">Active earn boosters</div>
              </div>
              <Zap className="w-4 h-4 text-[color:var(--color-crimson)]" />
            </div>
            <div className="p-3 space-y-2">
              {CAMPAIGNS.map(c => (
                <div key={c.name} className="p-3 border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]/40 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-0.5">{c.run}</div>
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'live' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' : 'bg-[color:var(--color-line)] text-[color:var(--color-ink-muted)]'}`}>{c.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[color:var(--color-crimson)]">{c.earn}</span>
                    <span className="text-[color:var(--color-ink-muted)]">{c.engaged.toLocaleString('en-IN')} engaged</span>
                  </div>
                </div>
              ))}
              <button className="w-full h-10 border border-dashed border-[color:var(--color-line-strong)] rounded-md text-xs text-[color:var(--color-ink-muted)] hover:bg-[color:var(--color-paper)] inline-flex items-center justify-center gap-1.5">
                <Plus className="w-3 h-3" /> New campaign
              </button>
            </div>
          </div>

          {/* Programme rules */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Programme rules</div>
            <div className="font-serif text-lg mb-4">Earn multipliers</div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.entries(CATEGORY_MULTIPLIER).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs py-1.5 border-b border-[color:var(--color-line)] last:border-0">
                  <span className="capitalize text-[color:var(--color-ink-soft)]">{k.replace('-', ' ')}</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[color:var(--color-crimson)] font-medium">{v.mult}×</span>
                    <button className="p-0.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3 h-3 text-[color:var(--color-ink-muted)]" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Volume tiers */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Volume bonuses</div>
            <div className="font-serif text-lg mb-4">Big-basket boosters</div>
            <div className="space-y-2">
              {VOLUME_TIERS.map(v => (
                <div key={v.min} className="flex items-center justify-between text-xs">
                  <span className="text-[color:var(--color-ink-soft)]">{v.min === 0 ? 'Any order' : `Above ${inr(v.min)}`}</span>
                  <span className="font-mono text-[color:var(--color-crimson)]">+{Math.round((v.bonus - 1) * 100)}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BigKPI({ label, value, delta, icon: Icon, accent }: { label: string; value: string; delta: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-xl border p-5 ${accent ? 'border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)]'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'}`} />
      </div>
      <div className="editorial-num text-3xl">{value}</div>
      <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-1">{delta}</div>
    </div>
  );
}

function TierDistribution() {
  // Stacked bar showing tier share
  const segments = [
    { key: 'SILVER', share: 64, color: '#94a3b8' },
    { key: 'GOLD', share: 24, color: '#f59e0b' },
    { key: 'PLATINUM', share: 9, color: '#cbd5e1' },
    { key: 'BLACK', share: 3, color: '#171717' },
  ];
  return (
    <div>
      <div className="h-8 rounded-md overflow-hidden flex">
        {segments.map(s => (
          <div key={s.key} style={{ width: `${s.share}%`, background: s.color }} className="hover:opacity-80 transition" title={`${s.key}: ${s.share}%`} />
        ))}
      </div>
    </div>
  );
}
