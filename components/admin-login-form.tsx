'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, Mail, AlertCircle, ArrowRight, Sparkles, Shield } from 'lucide-react';
import { RelayLogo } from './relay-logo';

const DEMO_CREDENTIALS = { email: 'admin@trs.co.in', password: 'Skyline@2026' };

export function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    setTimeout(() => {
      if (email.trim().toLowerCase() === DEMO_CREDENTIALS.email && password === DEMO_CREDENTIALS.password) {
        try {
          localStorage.setItem('trs.admin.auth', JSON.stringify({ email, ts: Date.now() }));
          document.cookie = `trs_admin=1; path=/; max-age=86400`;
        } catch {}
        router.push('/admin');
      } else {
        setError('Wrong email or password. Try the demo credentials on the right.');
        setLoading(false);
      }
    }, 500);
  }

  function fillDemo() {
    setEmail(DEMO_CREDENTIALS.email);
    setPassword(DEMO_CREDENTIALS.password);
  }

  return (
    <div className="fixed inset-0 grid md:grid-cols-2 bg-[color:var(--color-cream)] overflow-auto">
      {/* Left: Form */}
      <div className="flex flex-col justify-center p-8 md:p-16 min-h-screen">
        <div className="max-w-sm w-full mx-auto">
          <Link href="/" className="inline-block mb-12">
            <RelayLogo className="h-10 w-auto" />
          </Link>

          <div className="mb-2 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Console access</div>
          <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">Welcome back.</h1>
          <p className="mt-3 text-sm text-[color:var(--color-ink-muted)]">Sign in to the TRS operations console — inventory, orders, stores, loyalty.</p>

          <form onSubmit={handleSubmit} className="mt-10 space-y-4">
            <div>
              <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Email</label>
              <div className="flex items-center gap-2 h-12 px-4 border border-[color:var(--color-line)] rounded-lg bg-white focus-within:border-[color:var(--color-ink)] transition">
                <Mail className="w-4 h-4 text-[color:var(--color-ink-muted)]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@trs.co.in"
                  autoComplete="email"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] block mb-1.5">Password</label>
              <div className="flex items-center gap-2 h-12 px-4 border border-[color:var(--color-line)] rounded-lg bg-white focus-within:border-[color:var(--color-ink)] transition">
                <Lock className="w-4 h-4 text-[color:var(--color-ink-muted)]" />
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-3 bg-[color:var(--color-crimson)]/10 rounded-md text-xs text-[color:var(--color-crimson)]">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" defaultChecked className="accent-[color:var(--color-crimson)]" />
                <span className="text-[color:var(--color-ink-muted)]">Keep me signed in</span>
              </label>
              <button type="button" className="text-[color:var(--color-crimson)] hover:underline">Forgot password?</button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-lg text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Signing in…' : (<>Sign in to Console <ArrowRight className="w-4 h-4" /></>)}
            </button>

            <div className="pt-4 text-center text-xs text-[color:var(--color-ink-muted)]">
              Need a login? <button type="button" className="underline">Talk to your admin</button>
            </div>
          </form>

          <div className="mt-10 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            <Shield className="w-3 h-3" />
            Protected by MFA · SOC 2 Type II · India DC
          </div>
        </div>
      </div>

      {/* Right: Demo credentials showcase */}
      <div className="hidden md:flex bg-[color:var(--color-ink)] text-[color:var(--color-cream)] p-8 md:p-16 flex-col justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-20" />
        <div className="relative max-w-md">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[color:var(--color-mustard)] mb-4">
            <Sparkles className="w-3 h-3" /> Demo credentials
          </div>
          <h2 className="font-serif text-5xl leading-tight tracking-tight">Try the console with a live demo.</h2>
          <p className="mt-4 text-white/60 leading-relaxed">Instant access — no signup. All data is mock but interactions are real.</p>

          <div className="mt-10 p-6 rounded-xl border border-white/10 bg-white/5 backdrop-blur space-y-4">
            <CredRow label="Email" value={DEMO_CREDENTIALS.email} />
            <CredRow label="Password" value={DEMO_CREDENTIALS.password} />
            <button
              onClick={fillDemo}
              className="w-full h-11 bg-[color:var(--color-mustard)] text-[color:var(--color-ink)] rounded-lg text-sm font-medium hover:bg-white transition"
            >
              Autofill demo credentials →
            </button>
          </div>

          <div className="mt-10 text-[10px] uppercase tracking-widest text-white/40 mb-3">You&apos;ll get access to</div>
          <ul className="space-y-2 text-sm">
            {[
              'Inventory across 51 stores · live',
              '~1,700 SKUs · 7 brands',
              'Store network console · India map',
              'Skyline loyalty program admin',
              'Order routing & fulfilment view',
            ].map(x => (
              <li key={x} className="flex items-center gap-2">
                <div className="w-1 h-1 rounded-full bg-[color:var(--color-mustard)]" />
                {x}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

function CredRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-white/40 mb-1">{label}</div>
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-sm">{value}</div>
        <button
          onClick={() => navigator.clipboard?.writeText(value)}
          className="text-[10px] uppercase tracking-widest text-[color:var(--color-mustard)] hover:text-white transition"
        >
          Copy
        </button>
      </div>
    </div>
  );
}
