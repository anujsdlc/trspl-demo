import Link from 'next/link';
import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { LoyaltyCardPreview } from '@/components/loyalty-card';
import { PointsCalculator } from '@/components/points-calculator';
import { TIERS, CATEGORY_MULTIPLIER, VOLUME_TIERS, BONUSES, REDEMPTION, DEMO_MEMBER, tierFor, nextTier } from '@/lib/loyalty';
import { inr } from '@/lib/utils';
import { ArrowUpRight, Award, Zap, Gift, Users, Cake, Plane, Sparkles, RotateCw, TrendingUp, Star, CreditCard, Trophy } from 'lucide-react';

export default function LoyaltyPage() {
  const currentTier = tierFor(DEMO_MEMBER.ytdSpend);
  const next = nextTier(currentTier);
  const progress = next ? Math.min(100, (DEMO_MEMBER.ytdSpend / next.threshold) * 100) : 100;

  return (
    <FavouritesProvider>
      <StoreNav />

      {/* Hero */}
      <section className="container-editorial pt-12 md:pt-20 pb-20">
        <div className="grid md:grid-cols-2 gap-12 md:gap-20 items-center">
          <div>
            <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-6">
              <Award className="w-3.5 h-3.5" /> The Skyline Programme
            </div>
            <h1 className="font-serif text-[13vw] md:text-[7vw] lg:text-[6vw] leading-[0.9] tracking-tighter">
              One card.<br />
              <span className="italic">Every gate.</span>
            </h1>
            <p className="mt-8 text-lg leading-relaxed text-[color:var(--color-ink-soft)] max-w-md">
              A single membership that earns points across all seven Travel Retail brands — Relay, Choco Bay, Mishta, Smilen, Pashma, Glady&apos;s, Motech. In-store or online. Book to boarding.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <button className="inline-flex items-center gap-2 h-12 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson)] transition group">
                Join Skyline — get 250 points
                <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
              </button>
              <button className="inline-flex items-center gap-2 h-12 px-6 border border-[color:var(--color-ink)] rounded-full text-sm font-medium hover:bg-[color:var(--color-ink)] hover:text-[color:var(--color-cream)] transition">
                Already a member? Sign in
              </button>
            </div>
          </div>

          <LoyaltyCardPreview />
        </div>
      </section>

      {/* Member dashboard preview */}
      <section className="bg-[color:var(--color-paper)] py-16 md:py-24 border-y border-[color:var(--color-line)]">
        <div className="container-editorial">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">Your Skyline</div>
          <h2 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-10">Welcome back, {DEMO_MEMBER.name.split(' ')[0]}.</h2>

          <div className="grid md:grid-cols-4 gap-4 md:gap-6">
            <StatCard label="Points balance" value={DEMO_MEMBER.points.toLocaleString('en-IN')} suffix="pts" accent icon={Sparkles} />
            <StatCard label="Current tier" value={currentTier.name.split(' ')[1]} suffix={currentTier.name.split(' ')[0]} icon={Trophy} />
            <StatCard label="YTD spend" value={inr(DEMO_MEMBER.ytdSpend)} suffix="all brands" icon={TrendingUp} />
            <StatCard label="Store visits" value={DEMO_MEMBER.visits.toString()} suffix="this year" icon={Plane} />
          </div>

          {next && (
            <div className="mt-10 p-6 md:p-8 bg-white rounded-xl border border-[color:var(--color-line)]">
              <div className="flex items-baseline justify-between mb-4 flex-wrap gap-2">
                <div>
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Next tier</div>
                  <div className="font-serif text-2xl">{next.name}</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-[color:var(--color-ink-muted)]">Spend {inr(next.threshold - DEMO_MEMBER.ytdSpend)} more this year to unlock</div>
                  <div className="editorial-num text-xl">{Math.round(progress)}<span className="text-sm">%</span></div>
                </div>
              </div>
              <div className="relative h-2 bg-[color:var(--color-paper-warm)] rounded-full overflow-hidden">
                <div className="absolute inset-y-0 left-0 bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] rounded-full" style={{ width: `${progress}%` }} />
              </div>
              <div className="flex justify-between text-[10px] font-mono text-[color:var(--color-ink-muted)] mt-2">
                <span>{inr(0)}</span>
                <span>{inr(next.threshold)}</span>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Tiers */}
      <section className="container-editorial py-24 md:py-32">
        <div className="max-w-3xl mb-16">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-3">Four tiers</div>
          <h2 className="font-serif text-5xl md:text-6xl leading-none tracking-tighter">The higher you fly, the more you earn.</h2>
        </div>

        <div className="grid md:grid-cols-4 gap-4 md:gap-6">
          {TIERS.map(t => (
            <div key={t.key} className={`group rounded-2xl overflow-hidden border border-[color:var(--color-line)] hover:shadow-2xl transition ${t.key === currentTier.key ? 'ring-2 ring-[color:var(--color-crimson)]' : ''}`}>
              {/* Header stripe */}
              <div className={`h-32 bg-gradient-to-br ${t.gradient} p-5 relative overflow-hidden`}>
                <div className={`text-[10px] uppercase tracking-widest font-mono ${t.textOn} opacity-70`}>Tier {TIERS.indexOf(t) + 1}</div>
                <div className={`font-serif text-2xl mt-1 ${t.textOn}`}>{t.name}</div>
                <div className={`mt-3 flex items-baseline gap-1 ${t.textOn}`}>
                  <span className="editorial-num text-4xl">{t.earn}</span>
                  <span className="text-xs opacity-70">pts / ₹100</span>
                </div>
                <Sparkles className={`absolute top-4 right-4 w-4 h-4 ${t.textOn} opacity-30`} />
              </div>
              <div className="p-5">
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">
                  {t.threshold === 0 ? 'Start here — free to join' : `Unlock at ${inr(t.threshold)} annual spend`}
                </div>
                <ul className="space-y-2 text-sm">
                  {t.perks.map((p, i) => (
                    <li key={i} className="flex gap-2">
                      <div className="w-1 h-1 rounded-full bg-[color:var(--color-crimson)] mt-2 shrink-0" />
                      <span className="text-[color:var(--color-ink-soft)] leading-relaxed">{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="mt-5 pt-4 border-t border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex justify-between">
                  <span>Online discount</span>
                  <span className="font-mono text-[color:var(--color-crimson)]">{t.discount}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Earning engine */}
      <section className="bg-[color:var(--color-ink)] text-[color:var(--color-cream)] py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="container-editorial relative">
          <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-mustard)] mb-3">The earning engine</div>
          <h2 className="font-serif text-5xl md:text-6xl leading-none tracking-tighter">Points on <span className="italic text-[color:var(--color-mustard)]">everything.</span></h2>
          <p className="mt-6 text-lg text-white/70 max-w-2xl">Base earn × category multiplier × volume bonus × campaigns. Every rupee compounds.</p>

          <div className="mt-16 grid md:grid-cols-3 gap-6 md:gap-8">
            <EngineCard icon={CreditCard} title="Every purchase" subtitle="Base earn">
              <div className="text-sm">
                <div>Silver: <span className="font-mono text-[color:var(--color-mustard)]">5 pts / ₹100</span></div>
                <div>Gold: <span className="font-mono text-[color:var(--color-mustard)]">8 pts / ₹100</span></div>
                <div>Platinum: <span className="font-mono text-[color:var(--color-mustard)]">12 pts / ₹100</span></div>
                <div>Black: <span className="font-mono text-[color:var(--color-mustard)]">20 pts / ₹100</span></div>
              </div>
              <div className="mt-4 text-xs text-white/60">Works across all 7 brands. Online + in-store combined.</div>
            </EngineCard>

            <EngineCard icon={Gift} title="Type of purchase" subtitle="Category multipliers">
              <ul className="text-sm space-y-1.5">
                {Object.entries(CATEGORY_MULTIPLIER).slice(0, 6).map(([k, v]) => (
                  <li key={k} className="flex items-center justify-between gap-2">
                    <span className="capitalize text-white/70">{k.replace('-', ' ')}</span>
                    <span className="font-mono text-[color:var(--color-mustard)]">{v.mult}×</span>
                  </li>
                ))}
              </ul>
            </EngineCard>

            <EngineCard icon={TrendingUp} title="Volume of purchase" subtitle="Order-value tiers">
              <ul className="text-sm space-y-1.5">
                {VOLUME_TIERS.map(v => (
                  <li key={v.min} className="flex items-center justify-between gap-2">
                    <span className="text-white/70 text-xs">{v.min === 0 ? 'Any order' : `above ${inr(v.min)}`}</span>
                    <span className="font-mono text-[color:var(--color-mustard)]">+{Math.round((v.bonus - 1) * 100)}%</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 text-xs text-white/60">Compounds with category multiplier.</div>
            </EngineCard>

            <EngineCard icon={Users} title="Referrals" subtitle="Bring a friend">
              <div className="editorial-num text-5xl text-[color:var(--color-mustard)]">1,000</div>
              <div className="text-xs text-white/60 mt-1">points per successful referral</div>
              <div className="mt-4 text-sm text-white/70">Your friend gets 500 welcome points instead of the usual 250. Unlimited referrals.</div>
            </EngineCard>

            <EngineCard icon={Cake} title="Birthday & anniversary" subtitle="We remember">
              <div className="text-sm space-y-2">
                <div className="flex justify-between"><span className="text-white/70">Birthday month</span><span className="font-mono text-[color:var(--color-mustard)]">2×</span></div>
                <div className="flex justify-between"><span className="text-white/70">Membership anniversary</span><span className="font-mono text-[color:var(--color-mustard)]">1,500 pts</span></div>
                <div className="flex justify-between"><span className="text-white/70">First purchase</span><span className="font-mono text-[color:var(--color-mustard)]">500 pts</span></div>
                <div className="flex justify-between"><span className="text-white/70">Verified review</span><span className="font-mono text-[color:var(--color-mustard)]">100 pts</span></div>
              </div>
            </EngineCard>

            <EngineCard icon={Plane} title="Airport perks" subtitle="Because we live here">
              <div className="text-sm space-y-2">
                <div>Scan card at any store · <span className="font-mono text-[color:var(--color-mustard)]">+150 pts</span></div>
                <div>3-month spending streak · <span className="font-mono text-[color:var(--color-mustard)]">+750 pts</span></div>
                <div>Boarding-pass linked bonus · <span className="font-mono text-[color:var(--color-mustard)]">+250 pts</span></div>
                <div>Lounge access at Platinum &amp; Black</div>
              </div>
            </EngineCard>
          </div>
        </div>
      </section>

      {/* Points calculator */}
      <section className="container-editorial py-24 md:py-32">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-[color:var(--color-crimson)] mb-3">Try it</div>
            <h2 className="font-serif text-5xl md:text-6xl leading-none tracking-tighter">
              Watch the points <span className="italic">stack.</span>
            </h2>
            <p className="mt-6 text-lg text-[color:var(--color-ink-soft)] max-w-md">
              Change the order and category. See exactly how base earn, category multiplier and volume bonus combine.
            </p>
            <div className="mt-8 flex items-center gap-2 text-xs text-[color:var(--color-ink-muted)]">
              <RotateCw className="w-3 h-3" />
              1 point = ₹{REDEMPTION.ratio} · Min {REDEMPTION.minPoints} pts to redeem · Cap {REDEMPTION.capPerOrder * 100}% per order
            </div>
          </div>
          <PointsCalculator />
        </div>
      </section>

      {/* Redemption + bonuses grid */}
      <section className="container-editorial pb-24 md:pb-32">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-8 md:p-10 bg-[color:var(--color-crimson)] text-white rounded-2xl">
            <Star className="w-5 h-5 mb-4" />
            <div className="text-[10px] uppercase tracking-widest opacity-70">Redemption</div>
            <div className="font-serif text-3xl md:text-4xl mt-2 leading-tight">Every 200 points is ₹100 off.</div>
            <p className="mt-4 text-sm opacity-90 max-w-md">Redeem at checkout on any product across all seven brands, online or at the counter. No expiry as long as you make one purchase per year.</p>
          </div>
          <div className="p-8 md:p-10 bg-[color:var(--color-paper)] rounded-2xl">
            <Zap className="w-5 h-5 mb-4" />
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Bonus catalog</div>
            <div className="mt-4 space-y-2 text-sm">
              {BONUSES.map(b => (
                <div key={b.key} className="flex items-center justify-between gap-2 py-1.5 border-b border-[color:var(--color-line)] last:border-0">
                  <div className="text-[color:var(--color-ink-soft)]">{b.label}</div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-mono uppercase tracking-widest text-[color:var(--color-ink-muted)]">{b.freq}</span>
                    <span className="font-mono text-[color:var(--color-crimson)] font-semibold">
                      {typeof b.points === 'number' ? `+${b.points}` : b.points}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <StoreFooter />
    </FavouritesProvider>
  );
}

function StatCard({ label, value, suffix, icon: Icon, accent }: { label: string; value: string; suffix?: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`p-5 rounded-xl border ${accent ? 'border-[color:var(--color-crimson)] bg-[color:var(--color-crimson)]/5' : 'border-[color:var(--color-line)] bg-white'}`}>
      <div className="flex items-center justify-between mb-8">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        <Icon className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
      </div>
      <div className="editorial-num text-4xl">{value}</div>
      {suffix && <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mt-1">{suffix}</div>}
    </div>
  );
}

function EngineCard({ icon: Icon, title, subtitle, children }: { icon: React.ElementType; title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur">
      <Icon className="w-5 h-5 text-[color:var(--color-mustard)] mb-4" />
      <div className="text-[10px] uppercase tracking-widest text-white/50">{subtitle}</div>
      <div className="font-serif text-2xl mt-1 mb-4">{title}</div>
      {children}
    </div>
  );
}
