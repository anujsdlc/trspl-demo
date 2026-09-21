import Link from 'next/link';
import { TIERS, CATEGORY_MULTIPLIER, VOLUME_TIERS, REDEMPTION, tierFor } from '@/lib/loyalty';
import { BASE_MEMBERS } from '@/lib/members';
import { inr } from '@/lib/utils';
import { Award, Users, TrendingUp, Gift, Sparkles, Target, Zap, MoreHorizontal, ArrowRight } from 'lucide-react';

function activeBoosters() {
  const categories = Object.entries(CATEGORY_MULTIPLIER)
    .filter(([, v]) => v.mult > 1)
    .sort((a, b) => b[1].mult - a[1].mult)
    .slice(0, 4)
    .map(([, v]) => ({
      name: v.label,
      run: 'Ongoing',
      status: 'live' as const,
      earn: `${v.mult}x points`,
    }));

  const volume = VOLUME_TIERS
    .filter(v => v.bonus > 1)
    .map(v => ({
      name: v.label,
      run: 'Ongoing',
      status: 'live' as const,
      earn: `+${Math.round((v.bonus - 1) * 100)}%`,
    }));

  return [...categories, ...volume];
}

export default function LoyaltyAdmin() {
  const members = BASE_MEMBERS;
  const total = members.length;

  const monthStart = new Date();
  monthStart.setDate(1);
  const monthNew = members.filter(m => new Date(m.joinDate) >= monthStart).length;

  const pointsHeld = members.reduce((sum, m) => sum + m.points, 0);
  const ytdSpend = members.reduce((sum, m) => sum + m.ytdSpend, 0);
  const lifetimeSpend = members.reduce((sum, m) => sum + m.lifetimeSpend, 0);
  const avgSpend = total > 0 ? Math.round(ytdSpend / total) : 0;
  const pointsValue = Math.round(pointsHeld * REDEMPTION.ratio);

  const tierCounts = new Map<string, number>();
  for (const m of members) {
    const key = tierFor(m.ytdSpend).key;
    tierCounts.set(key, (tierCounts.get(key) ?? 0) + 1);
  }

  const topMembers = [...members]
    .sort((a, b) => b.ytdSpend - a.ytdSpend)
    .slice(0, 8);

  const campaigns = activeBoosters();

  return (
    <div className="px-6 py-6 max-w-[1800px]">
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-2">
            <Award className="w-3 h-3" /> Skyline Programme
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Loyalty Console</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/loyalty/members" className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs hover:bg-[color:var(--color-paper)] inline-flex items-center gap-1.5">
            <Users className="w-3.5 h-3.5" /> All members <ArrowRight className="w-3 h-3" />
          </Link>

        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <BigKPI label="Members" value={total.toLocaleString('en-IN')} delta="on file" icon={Users} accent />
        <BigKPI label="Joined this month" value={monthNew.toLocaleString('en-IN')} delta="since the 1st" icon={TrendingUp} />
        <BigKPI label="Points held" value={pointsHeld.toLocaleString('en-IN')} delta={`${inr(pointsValue)} if redeemed`} icon={Sparkles} />
        <BigKPI label="Lifetime spend" value={inr(lifetimeSpend)} delta={`${inr(ytdSpend)} this year`} icon={Gift} />
        <BigKPI label="Average spend" value={inr(avgSpend)} delta="per member, YTD" icon={Target} />
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
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
              {TIERS.map(t => {
                const count = tierCounts.get(t.key) ?? 0;
                const share = total > 0 ? Math.round((count / total) * 100) : 0;
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

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] overflow-hidden">
            <div className="p-6 border-b border-[color:var(--color-line)] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Members</div>
                <div className="font-serif text-2xl mt-1">Top Skyliners</div>
              </div>
              <Link href="/admin/loyalty/members" className="text-xs border-b border-[color:var(--color-ink)] hover:text-[color:var(--color-crimson)] inline-flex items-center gap-1">
                All members <ArrowRight className="w-3 h-3" />
              </Link>
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
                {topMembers.map(m => {
                  const tier = tierFor(m.ytdSpend);
                  return (
                    <tr key={m.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                      <td className="px-4 py-2.5 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{m.id}</td>
                      <td className="px-3 py-2.5 text-xs font-medium">{m.name}</td>
                      <td className="px-3 py-2.5 text-xs">{m.city}</td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-gradient-to-r ${tier.gradient} ${tier.textOn}`}>{tier.key}</span>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{m.points.toLocaleString('en-IN')}</td>
                      <td className="px-3 py-2.5 text-right font-mono text-xs">{inr(m.ytdSpend)}</td>
                      <td className="px-2 py-2.5">
                        <Link href={`/admin/loyalty/members?id=${m.id}`} className="p-1 hover:bg-[color:var(--color-paper)] rounded inline-flex" title="View card">
                          <MoreHorizontal className="w-3.5 h-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)]">
            <div className="p-5 border-b border-[color:var(--color-line)] flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Live campaigns</div>
                <div className="font-serif text-lg mt-0.5">Active earn boosters</div>
              </div>
              <Zap className="w-4 h-4 text-[color:var(--color-crimson)]" />
            </div>
            <div className="p-3 space-y-2">
              {campaigns.map(c => (
                <div key={c.name} className="p-3 border border-[color:var(--color-line)] rounded-md hover:bg-[color:var(--color-paper)]/40 transition">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium">{c.name}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-0.5">Applied by the points engine</div>
                    </div>
                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded ${c.status === 'live' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' : 'bg-[color:var(--color-line)] text-[color:var(--color-ink-muted)]'}`}>{c.status}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px]">
                    <span className="font-mono text-[color:var(--color-crimson)]">{c.earn}</span>
                    <span className="text-[color:var(--color-ink-muted)]">{c.run}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Programme rules</div>
            <div className="font-serif text-lg mb-4">Earn multipliers</div>
            <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
              {Object.entries(CATEGORY_MULTIPLIER).map(([k, v]) => (
                <div key={k} className="flex items-center justify-between text-xs py-1.5 border-b border-[color:var(--color-line)] last:border-0">
                  <span className="capitalize text-[color:var(--color-ink-soft)]">{k.replace('-', ' ')}</span>
                  <span className="font-mono text-[color:var(--color-crimson)] font-medium">{v.mult}×</span>
                </div>
              ))}
            </div>
          </div>

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
