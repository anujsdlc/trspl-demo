'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  Landmark, ArrowLeft, Upload, CheckCircle2, X, Link2, AlertTriangle, Search,
  RefreshCw, Wallet,
} from 'lucide-react';
import {
  loadBankEntries, saveBankEntry, SEED_BANK_ENTRIES,
  loadCoA, loadJVs, SEED_COA, SEED_JVS,
  type BankEntry, type Ledger, type JournalEntry,
} from '@/lib/erp/phase3';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

export function BankReconConsole() {
  const [entries, setEntries] = useState<BankEntry[]>(SEED_BANK_ENTRIES);
  const [ledgers, setLedgers] = useState<Ledger[]>(SEED_COA);
  const [journals, setJournals] = useState<JournalEntry[]>(SEED_JVS);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setEntries(loadBankEntries());
    setLedgers(loadCoA());
    setJournals(loadJVs());
    setHydrated(true);
  }, []);

  const banks = useMemo(() => ledgers.filter(l => l.isBank), [ledgers]);
  const [bankId, setBankId] = useState(banks[0]?.id ?? 'led-1000');
  useEffect(() => {
    if (banks.length > 0 && !banks.find(b => b.id === bankId)) setBankId(banks[0].id);
  }, [banks, bankId]);

  const bankEntries = useMemo(() => entries.filter(e => e.bankLedgerId === bankId), [entries, bankId]);

  const [q, setQ] = useState('');
  const [filter, setFilter] = useState<'all' | 'matched' | 'unmatched'>('all');
  const filtered = useMemo(() => {
    let arr = bankEntries;
    if (filter !== 'all') arr = arr.filter(e => e.matchStatus === filter);
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(e => e.particulars.toLowerCase().includes(s) || (e.chequeRef?.toLowerCase().includes(s) ?? false));
    }
    return arr.slice().sort((a, b) => a.txnDate.localeCompare(b.txnDate));
  }, [bankEntries, q, filter]);

  const stats = useMemo(() => {
    const matched = bankEntries.filter(e => e.matchStatus === 'matched');
    const unmatched = bankEntries.filter(e => e.matchStatus === 'unmatched');
    return {
      total: bankEntries.length,
      matched: matched.length,
      unmatched: unmatched.length,
      credits: bankEntries.reduce((s, e) => s + e.credit, 0),
      debits: bankEntries.reduce((s, e) => s + e.debit, 0),
      unreconciled: unmatched.reduce((s, e) => s + (e.credit - e.debit), 0),
    };
  }, [bankEntries]);

  const bookBalance = useMemo(() => {
    // sum of posted journal impact on this ledger
    let d = 0, c = 0;
    for (const j of journals) {
      if (j.status !== 'posted') continue;
      for (const line of j.lines) {
        if (line.ledgerId !== bankId) continue;
        d += line.debit;
        c += line.credit;
      }
    }
    const led = ledgers.find(l => l.id === bankId);
    if (!led) return 0;
    return led.openingBalance + d - c;
  }, [bankId, journals, ledgers]);

  const bankBalance = useMemo(() => {
    // Use latest balance in file
    const arr = bankEntries.slice().sort((a, b) => b.txnDate.localeCompare(a.txnDate));
    return arr[0]?.balance ?? 0;
  }, [bankEntries]);

  const diff = bankBalance - bookBalance;

  function autoMatchAll() {
    // Naive auto-match: mark all currently-unmatched credits as matched to a
    // pending JV in date-order. In production this would be rule-based.
    const next = entries.map(e => {
      if (e.bankLedgerId !== bankId) return e;
      if (e.matchStatus === 'matched') return e;
      const jv = journals.find(j =>
        j.status === 'posted' &&
        Math.abs(j.date.localeCompare(e.txnDate)) < 4 &&
        j.lines.some(l => l.ledgerId === bankId && Math.abs(l.debit - e.debit) < 1 && Math.abs(l.credit - e.credit) < 1)
      );
      return jv ? { ...e, matchStatus: 'matched' as const, matchedJvId: jv.id } : e;
    });
    next.forEach(saveBankEntry);
    setEntries(loadBankEntries());
  }

  function toggle(id: string) {
    const e = entries.find(x => x.id === id);
    if (!e) return;
    const next: BankEntry = e.matchStatus === 'matched'
      ? { ...e, matchStatus: 'unmatched', matchedJvId: undefined }
      : { ...e, matchStatus: 'matched', matchedJvId: e.matchedJvId ?? 'manual' };
    saveBankEntry(next);
    setEntries(loadBankEntries());
  }

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <Link href="/admin/erp/accounts" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Accounting
      </Link>

      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Landmark className="w-3 h-3" /> Finance
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Bank Reconciliation</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Import statement, auto-match against posted journals, reconcile the delta.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <select value={bankId} onChange={e => setBankId(e.target.value)} className="h-10 px-3 border border-[color:var(--color-line)] rounded-md text-sm bg-white">
            {banks.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
          <label className="h-10 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)] cursor-pointer">
            <Upload className="w-3.5 h-3.5" /> Import statement
            <input type="file" accept=".csv" className="hidden" />
          </label>
          <button onClick={autoMatchAll} className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
            <RefreshCw className="w-3.5 h-3.5" /> Auto-match
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Book balance" value={inr(bookBalance)} />
        <KPI label="Bank statement" value={inr(bankBalance)} />
        <KPI label="Difference" value={inr(diff)} accent={Math.abs(diff) < 1 ? 'success' : 'warn'} />
        <KPI label="Matched entries" value={`${stats.matched}/${stats.total}`} accent="success" />
        <KPI label="Unmatched" value={stats.unmatched.toString()} accent={stats.unmatched > 0 ? 'warn' : undefined} />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search particulars or cheque ref…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', 'matched', 'unmatched'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 h-full capitalize ${filter === f ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{f}</button>
          ))}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${bankEntries.length}` : 'loading…'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Date" className="w-28" />
                <Th label="Particulars" />
                <Th label="Cheque / Ref" className="w-36" />
                <Th label="Debit" className="w-28" align="right" />
                <Th label="Credit" className="w-28" align="right" />
                <Th label="Balance" className="w-32" align="right" />
                <Th label="Match" className="w-40" />
                <th className="w-20"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={8} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No entries.</td></tr>}
              {filtered.map(e => (
                <tr key={e.id} className={`border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30 ${e.matchStatus === 'matched' ? 'bg-[color:var(--color-success)]/5' : ''}`}>
                  <td className="px-3 py-3 font-mono text-xs">{e.txnDate}</td>
                  <td className="px-3 py-3 text-sm">{e.particulars}</td>
                  <td className="px-3 py-3 font-mono text-xs text-[color:var(--color-ink-muted)]">{e.chequeRef ?? '—'}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{e.debit ? inr(e.debit) : ''}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{e.credit ? inr(e.credit) : ''}</td>
                  <td className="px-3 py-3 text-right font-mono text-xs">{inr(e.balance)}</td>
                  <td className="px-3 py-3">
                    {e.matchStatus === 'matched' ? (
                      <div className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-success)]">
                        <CheckCircle2 className="w-3 h-3" /> Matched
                        {e.matchedJvId && <span className="text-[9px] font-mono text-[color:var(--color-ink-muted)]">· {e.matchedJvId}</span>}
                      </div>
                    ) : (
                      <StatusPill status="Unmatched" tone="warning" />
                    )}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <button onClick={() => toggle(e.id)} className="text-xs inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
                      <Link2 className="w-3.5 h-3.5" />
                      {e.matchStatus === 'matched' ? 'Unlink' : 'Link'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {Math.abs(diff) >= 1 && (
        <div className="mt-4 p-4 bg-[color:var(--color-warning)]/10 rounded-lg text-xs text-[color:var(--color-warning)] flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
          <div>
            <div className="font-medium">Reconciliation delta: {inr(Math.abs(diff))}</div>
            The bank statement and book balance don&apos;t agree — inspect unmatched entries and post any missing journals.
          </div>
        </div>
      )}
    </div>
  );
}
