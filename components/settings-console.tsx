'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, Check, RefreshCw, RotateCcw, Save, Database } from 'lucide-react';

export const SETTINGS_KEY = 'trs.admin.settings.v1';

export interface AdminSettings {
  companyName: string;
  supportEmail: string;
  freeDeliveryThreshold: number;
  deliveryFee: number;
  lowStockThreshold: number;
  pointsPerHundred: number;
  currencyLocale: string;
}

export const DEFAULT_SETTINGS: AdminSettings = {
  companyName: 'TRS Retail Private Limited',
  supportEmail: 'support@trs.co.in',
  freeDeliveryThreshold: 599,
  deliveryFee: 49,
  lowStockThreshold: 10,
  pointsPerHundred: 5,
  currencyLocale: 'en-IN',
};

const NUMERIC: (keyof AdminSettings)[] = [
  'freeDeliveryThreshold', 'deliveryFee', 'lowStockThreshold', 'pointsPerHundred',
];

export function SettingsConsole() {
  const [settings, setSettings] = useState<AdminSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [backend, setBackend] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/erp/${encodeURIComponent(SETTINGS_KEY)}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`Settings store returned ${res.status}.`);
      const data = await res.json();
      setBackend(data.backend ?? null);
      if (data.rows && typeof data.rows === 'object') {
        setSettings({ ...DEFAULT_SETTINGS, ...(data.rows as Partial<AdminSettings>) });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not read the settings store.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      const res = await fetch(`/api/erp/${encodeURIComponent(SETTINGS_KEY)}`, {
        method: 'PUT',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ rows: settings }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || data.ok === false) throw new Error(data.error || `Settings store returned ${res.status}.`);
      setBackend(data.backend ?? backend);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'The settings were not saved.');
    } finally {
      setSaving(false);
    }
  };

  const update = (key: keyof AdminSettings, raw: string) => {
    setSettings(s => ({
      ...s,
      [key]: NUMERIC.includes(key) ? Math.max(0, Number(raw) || 0) : raw,
    }));
  };

  return (
    <div className="px-6 py-8 max-w-3xl">
      <div className="mb-8">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">Head Office · Settings</div>
        <h1 className="font-serif text-4xl leading-tight tracking-tight">Console settings</h1>
        <p className="mt-2 text-sm text-[color:var(--color-ink-muted)]">
          Stored server-side, shared by everyone who opens this console.
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 rounded-lg border border-[color:var(--color-danger)] bg-[color:var(--color-danger)]/10 text-sm flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0 text-[color:var(--color-danger)]" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="py-24 text-center text-sm text-[color:var(--color-ink-muted)]">Reading the settings store…</div>
      ) : (
        <>
          <Section title="Company">
            <Field label="Registered name" value={settings.companyName} onChange={v => update('companyName', v)} />
            <Field label="Support email" value={settings.supportEmail} onChange={v => update('supportEmail', v)} type="email" />
          </Section>

          <Section title="Storefront">
            <Field label="Free delivery above (₹)" value={String(settings.freeDeliveryThreshold)} onChange={v => update('freeDeliveryThreshold', v)} type="number" />
            <Field label="Delivery fee (₹)" value={String(settings.deliveryFee)} onChange={v => update('deliveryFee', v)} type="number" />
          </Section>

          <Section title="Operations">
            <Field label="Low-stock threshold (units)" value={String(settings.lowStockThreshold)} onChange={v => update('lowStockThreshold', v)} type="number" />
            <Field label="Base points per ₹100" value={String(settings.pointsPerHundred)} onChange={v => update('pointsPerHundred', v)} type="number" />
          </Section>

          <div className="flex items-center gap-3 mt-8">
            <button
              onClick={save}
              disabled={saving}
              className="h-10 px-5 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm inline-flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? 'Saving…' : 'Save settings'}
            </button>
            <button
              onClick={() => setSettings(DEFAULT_SETTINGS)}
              className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm bg-white inline-flex items-center gap-2"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Restore defaults
            </button>
            {saved && (
              <span className="text-sm text-[color:var(--color-success)] inline-flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Saved
              </span>
            )}
          </div>

          {backend && (
            <div className="mt-8 pt-4 border-t border-[color:var(--color-line)] text-xs text-[color:var(--color-ink-muted)] inline-flex items-center gap-2">
              <Database className="w-3.5 h-3.5" />
              Persistence backend: <span className="font-mono">{backend}</span>
              {backend === 'file' && <span>· local <span className="font-mono">.data/</span> store, no cloud credentials configured</span>}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-6 p-5 border border-[color:var(--color-line)] rounded-xl bg-white">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">{title}</div>
      <div className="grid md:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void; type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="h-9 px-3 w-full border border-[color:var(--color-line)] rounded-md text-sm bg-white focus:outline-none focus:border-[color:var(--color-ink)]"
      />
    </label>
  );
}
