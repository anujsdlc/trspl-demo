'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  BookMinus, Landmark, FileText, Scale, TrendingUp, TrendingDown,
  ArrowRight, ArrowUpDown, Layers, Wallet, BadgeDollarSign,
} from 'lucide-react';
import {
  loadCoA, loadJVs, computeBalances, summariseByType, SEED_COA, SEED_JVS,
  type Ledger, type JournalEntry, type LedgerBalance,
} from '@/lib/erp/phase3';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill } from './ui';

type TabKey = 'overview' | 'coa' | 'journals' | 'tb' | 'pl' | 'bs';

export function AccountsConsole() {
  const [tab, setTab] = useState<TabKey>('overview');
  const [ledgers, setLedgers] = useState<Ledger[]>(SEED_COA);
  const [journals, setJournals] = useState<JournalEntry[]>(SEED_JVS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadCoA().then(setLedgers);
    loadJVs().then(setJournals);
    setHydrated(true);
  }, []);

  const balances = useMemo(() => computeBalances(ledgers, journals), [ledgers, journals]);
  const summary = useMemo(() => summariseByType(balances), [balances]);

  const totals = useMemo(() => {
    const assets = summary.asset;
    const liabilities = summary.liability;
    const equity = summary.equity;
    const income = summary.income;
    const expense = summary.expense;
    const profit = income - expense;
    const bsCheck = Math.abs(assets - (liabilities + equity + profit));
    return { assets, liabilities, equity, income, expense, profit, bsCheck };
  }, [summary]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <BookMinus className="w-3 h-3" /> Finance
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Accounting</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Double-entry ledger, journals, trial balance, P&amp;L, and balance sheet — computed live from every posted entry.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/admin/erp/accounts/gst" className="h-10 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <FileText className="w-3.5 h-3.5" /> GST returns
          </Link>
          <Link href="/admin/erp/accounts/bank-recon" className="h-10 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <Landmark className="w-3.5 h-3.5" /> Bank recon
          </Link>
        </div>
      </div>

      {/* KPI band */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
        <KPI label="Total assets" value={inr(totals.assets)} accent="success" />
        <KPI label="Total liabilities" value={inr(totals.liabilities)} accent="crimson" />
        <KPI label="Equity" value={inr(totals.equity)} />
        <KPI label="Net income (YTD)" value={inr(totals.profit)} accent={totals.profit >= 0 ? 'success' : 'danger'} />
        <KPI label="BS check" value={totals.bsCheck < 1 ? 'Balanced' : `Δ ${inr(totals.bsCheck)}`} accent={totals.bsCheck < 1 ? 'success' : 'warn'} />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-6 overflow-x-auto">
        {([
          ['overview', 'Overview', Layers],
          ['coa', 'Chart of Accounts', BookMinus],
          ['journals', 'Journal Entries', FileText],
          ['tb', 'Trial Balance', Scale],
          ['pl', 'P & L', BadgeDollarSign],
          ['bs', 'Balance Sheet', Wallet],
        ] as [TabKey, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button
            key={k}
            onClick={() => setTab(k)}
            className={`h-11 px-4 text-sm transition inline-flex items-center gap-2 border-b-2 ${
              tab === k
                ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]'
                : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
            }`}
          >
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'overview' && <OverviewTab balances={balances} journals={journals} totals={totals} />}
      {tab === 'coa' && <CoATab ledgers={ledgers} balances={balances} hydrated={hydrated} />}
      {tab === 'journals' && <JournalsTab journals={journals} ledgers={ledgers} />}
      {tab === 'tb' && <TrialBalanceTab balances={balances} />}
      {tab === 'pl' && <PLTab balances={balances} />}
      {tab === 'bs' && <BSTab balances={balances} profit={totals.profit} />}
    </div>
  );
}

// ============================================================================

function OverviewTab({ balances, journals, totals }: { balances: LedgerBalance[]; journals: JournalEntry[]; totals: { income: number; expense: number; profit: number; assets: number; liabilities: number; equity: number } }) {
  const bank = balances.filter(b => b.ledger.isBank);
  const bankTotal = bank.reduce((s, b) => s + b.closingBalance, 0);
  const recent = journals.slice(0, 6);

  const income = balances.filter(b => b.ledger.type === 'income').sort((a, b) => b.closingBalance - a.closingBalance).slice(0, 5);
  const expense = balances.filter(b => b.ledger.type === 'expense').sort((a, b) => b.closingBalance - a.closingBalance).slice(0, 5);

  return (
    <div className="grid md:grid-cols-3 gap-4">
      <div className="md:col-span-2 space-y-4">
        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
            <TrendingUp className="w-3 h-3 text-[color:var(--color-success)]" /> Top income accounts
          </div>
          <div className="space-y-2">
            {income.map(b => (
              <div key={b.ledger.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{b.ledger.name}</span>
                <span className="font-mono text-[color:var(--color-success)]">{inr(b.closingBalance)}</span>
              </div>
            ))}
            {income.length === 0 && <div className="text-xs text-[color:var(--color-ink-muted)]">No income posted yet.</div>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
            <TrendingDown className="w-3 h-3 text-[color:var(--color-danger)]" /> Top expense accounts
          </div>
          <div className="space-y-2">
            {expense.map(b => (
              <div key={b.ledger.id} className="flex items-center justify-between text-sm">
                <span className="truncate">{b.ledger.name}</span>
                <span className="font-mono text-[color:var(--color-danger)]">{inr(b.closingBalance)}</span>
              </div>
            ))}
            {expense.length === 0 && <div className="text-xs text-[color:var(--color-ink-muted)]">No expenses posted yet.</div>}
          </div>
        </div>
        <div className="bg-white rounded-xl border border-[color:var(--color-line)]">
          <div className="p-5 border-b border-[color:var(--color-line)] flex items-center justify-between">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Recent journals</div>
            <div className="text-xs text-[color:var(--color-ink-muted)] font-mono">{journals.length} on file</div>
          </div>
          <div className="divide-y divide-[color:var(--color-line)] text-sm">
            {recent.map(j => (
              <div key={j.id} className="p-4 flex items-start gap-3">
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] font-mono w-24">{j.date}</div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{j.jvNumber}</div>
                  <div className="text-xs text-[color:var(--color-ink-muted)] line-clamp-1">{j.narration}</div>
                </div>
                <div className="font-mono text-sm text-right">
                  <div>{inr(j.totalDebit)}</div>
                  {j.autoPosted && <div className="text-[10px] text-[color:var(--color-crimson)]">auto-posted</div>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <div className="bg-[color:var(--color-ink)] text-white rounded-xl p-5">
          <div className="text-[10px] uppercase tracking-widest text-white/60 mb-2">Cash + bank</div>
          <div className="editorial-num text-4xl">{inr(bankTotal)}</div>
          <div className="text-xs text-white/60 mt-1">across {bank.length} accounts</div>
          <div className="mt-4 space-y-2">
            {bank.map(b => (
              <div key={b.ledger.id} className="flex items-center justify-between text-xs">
                <span className="truncate">{b.ledger.name.replace(' — Current Account', '')}</span>
                <span className="font-mono">{inr(b.closingBalance)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">P&amp;L snapshot</div>
          <div className="text-xs space-y-1.5">
            <Row label="Income" value={inr(totals.income)} />
            <Row label="Expenses" value={inr(totals.expense)} />
            <div className="border-t border-[color:var(--color-line)] pt-2 flex items-center justify-between">
              <span className={totals.profit >= 0 ? 'text-[color:var(--color-success)] font-medium' : 'text-[color:var(--color-danger)] font-medium'}>Net</span>
              <span className={`font-mono ${totals.profit >= 0 ? 'text-[color:var(--color-success)]' : 'text-[color:var(--color-danger)]'}`}>{inr(totals.profit)}</span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Balance sheet snapshot</div>
          <div className="text-xs space-y-1.5">
            <Row label="Assets" value={inr(totals.assets)} />
            <Row label="Liabilities" value={inr(totals.liabilities)} />
            <Row label="Equity" value={inr(totals.equity)} />
            <Row label="Retained (YTD)" value={inr(totals.profit)} />
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================

function CoATab({ ledgers, balances, hydrated }: { ledgers: Ledger[]; balances: LedgerBalance[]; hydrated: boolean }) {
  const balanceById = useMemo(() => new Map(balances.map(b => [b.ledger.id, b])), [balances]);
  const byGroup = useMemo(() => {
    const m = new Map<string, Ledger[]>();
    for (const l of ledgers) {
      const arr = m.get(l.group) ?? [];
      arr.push(l);
      m.set(l.group, arr);
    }
    return [...m.entries()];
  }, [ledgers]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs">
        <div className="text-[color:var(--color-ink-muted)]">{hydrated ? `${ledgers.length} ledgers across ${byGroup.length} groups` : 'loading…'}</div>
      </div>
      {byGroup.map(([group, arr]) => (
        <div key={group} className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--color-line)] flex items-center justify-between bg-[color:var(--color-paper)]/40">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{group}</div>
            <div className="text-xs text-[color:var(--color-ink-muted)] font-mono">{arr.length} ledger{arr.length !== 1 ? 's' : ''}</div>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <th className="text-left px-3 py-2 w-20">Code</th>
                <th className="text-left px-3 py-2">Ledger</th>
                <th className="text-left px-3 py-2 w-20">Type</th>
                <th className="text-right px-3 py-2 w-32">Opening</th>
                <th className="text-right px-3 py-2 w-24">Debit</th>
                <th className="text-right px-3 py-2 w-24">Credit</th>
                <th className="text-right px-3 py-2 w-32">Closing</th>
              </tr>
            </thead>
            <tbody>
              {arr.map(l => {
                const b = balanceById.get(l.id);
                return (
                  <tr key={l.id} className="border-t border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30">
                    <td className="px-3 py-2 font-mono text-xs">{l.code}</td>
                    <td className="px-3 py-2">{l.name}</td>
                    <td className="px-3 py-2">
                      <span className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] capitalize">{l.type}</span>
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-[color:var(--color-ink-muted)]">{inr(l.openingBalance)}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{b?.totalDebit ? inr(b.totalDebit) : '—'}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{b?.totalCredit ? inr(b.totalCredit) : '—'}</td>
                    <td className="px-3 py-2 text-right font-mono font-medium">{inr(b?.closingBalance ?? 0)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ))}
    </div>
  );
}

// ============================================================================

function JournalsTab({ journals, ledgers }: { journals: JournalEntry[]; ledgers: Ledger[] }) {
  const ledgerById = useMemo(() => new Map(ledgers.map(l => [l.id, l])), [ledgers]);
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
            <Th label="JV #" className="w-40" />
            <Th label="Date" className="w-24" />
            <Th label="Narration" />
            <Th label="Debit" align="right" className="w-32" />
            <Th label="Credit" align="right" className="w-32" />
            <Th label="Status" className="w-24" />
          </tr>
        </thead>
        <tbody>
          {journals.map(j => (
            <>
              <tr key={j.id} className="border-b border-[color:var(--color-line)] hover:bg-[color:var(--color-paper)]/30">
                <td className="px-3 py-3 font-mono text-xs">
                  <div className="font-medium">{j.jvNumber}</div>
                  {j.reference && <div className="text-[10px] text-[color:var(--color-ink-muted)]">Ref: {j.reference}</div>}
                </td>
                <td className="px-3 py-3 font-mono text-xs">{j.date}</td>
                <td className="px-3 py-3 text-xs">{j.narration}</td>
                <td className="px-3 py-3 text-right font-mono text-xs">{inr(j.totalDebit)}</td>
                <td className="px-3 py-3 text-right font-mono text-xs">{inr(j.totalCredit)}</td>
                <td className="px-3 py-3">
                  <StatusPill status={j.status} tone={j.status === 'posted' ? 'success' : j.status === 'draft' ? 'warning' : 'danger'} />
                  {j.autoPosted && <span className="ml-1 text-[9px] uppercase tracking-widest text-[color:var(--color-crimson)]">auto</span>}
                </td>
              </tr>
              {j.lines.map((l, i) => {
                const led = ledgerById.get(l.ledgerId);
                return (
                  <tr key={`${j.id}-${i}`} className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/20">
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[color:var(--color-ink-muted)]">&nbsp;</td>
                    <td className="px-3 py-1.5 font-mono text-[10px] text-[color:var(--color-ink-muted)]">{led?.code}</td>
                    <td className="px-3 py-1.5 text-[11px] pl-6">↳ {led?.name}{l.narration ? ` — ${l.narration}` : ''}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px]">{l.debit ? inr(l.debit) : ''}</td>
                    <td className="px-3 py-1.5 text-right font-mono text-[11px]">{l.credit ? inr(l.credit) : ''}</td>
                    <td className="px-3 py-1.5"></td>
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================

function TrialBalanceTab({ balances }: { balances: LedgerBalance[] }) {
  const totalDr = balances.reduce((s, b) => s + b.totalDebit, 0);
  const totalCr = balances.reduce((s, b) => s + b.totalCredit, 0);
  return (
    <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
            <th className="text-left px-3 py-2.5 w-20">Code</th>
            <th className="text-left px-3 py-2.5">Ledger</th>
            <th className="text-left px-3 py-2.5 w-32">Group</th>
            <th className="text-right px-3 py-2.5 w-32">Debit</th>
            <th className="text-right px-3 py-2.5 w-32">Credit</th>
          </tr>
        </thead>
        <tbody>
          {balances.filter(b => b.totalDebit || b.totalCredit || b.ledger.openingBalance !== 0).sort((a, b) => a.ledger.code.localeCompare(b.ledger.code)).map(b => (
            <tr key={b.ledger.id} className="border-b border-[color:var(--color-line)]">
              <td className="px-3 py-2 font-mono text-xs">{b.ledger.code}</td>
              <td className="px-3 py-2 text-sm">{b.ledger.name}</td>
              <td className="px-3 py-2 text-xs text-[color:var(--color-ink-muted)]">{b.ledger.group}</td>
              <td className="px-3 py-2 text-right font-mono text-sm">{b.ledger.nature === 'debit' ? inr(Math.max(0, b.closingBalance)) : ''}</td>
              <td className="px-3 py-2 text-right font-mono text-sm">{b.ledger.nature === 'credit' ? inr(Math.max(0, b.closingBalance)) : ''}</td>
            </tr>
          ))}
          <tr className="bg-[color:var(--color-paper)]/40 font-medium">
            <td colSpan={3} className="px-3 py-3 text-right text-xs uppercase tracking-widest">Totals</td>
            <td className="px-3 py-3 text-right font-mono">{inr(totalDr)}</td>
            <td className="px-3 py-3 text-right font-mono">{inr(totalCr)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

// ============================================================================

function PLTab({ balances }: { balances: LedgerBalance[] }) {
  const income = balances.filter(b => b.ledger.type === 'income');
  const expenses = balances.filter(b => b.ledger.type === 'expense');
  const totalIncome = income.reduce((s, b) => s + b.closingBalance, 0);
  const totalExpense = expenses.reduce((s, b) => s + b.closingBalance, 0);
  const net = totalIncome - totalExpense;
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-success)]">Income</div>
        <table className="w-full text-sm">
          <tbody>
            {income.map(b => (
              <tr key={b.ledger.id} className="border-b border-[color:var(--color-line)] last:border-0">
                <td className="px-3 py-2">
                  <div>{b.ledger.name}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{b.ledger.code}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono">{inr(b.closingBalance)}</td>
              </tr>
            ))}
            <tr className="bg-[color:var(--color-paper)]/40 font-medium">
              <td className="px-3 py-3 text-right text-xs uppercase tracking-widest">Total income</td>
              <td className="px-3 py-3 text-right font-mono text-[color:var(--color-success)]">{inr(totalIncome)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-danger)]">Expenses</div>
        <table className="w-full text-sm">
          <tbody>
            {expenses.map(b => (
              <tr key={b.ledger.id} className="border-b border-[color:var(--color-line)] last:border-0">
                <td className="px-3 py-2">
                  <div>{b.ledger.name}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{b.ledger.code}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono">{inr(b.closingBalance)}</td>
              </tr>
            ))}
            <tr className="bg-[color:var(--color-paper)]/40 font-medium">
              <td className="px-3 py-3 text-right text-xs uppercase tracking-widest">Total expenses</td>
              <td className="px-3 py-3 text-right font-mono text-[color:var(--color-danger)]">{inr(totalExpense)}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div className="md:col-span-2 bg-[color:var(--color-ink)] text-white rounded-lg p-6 flex items-center justify-between">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-white/60">Net income / (loss)</div>
          <div className="editorial-num text-5xl mt-1">{inr(net)}</div>
        </div>
        <div className="text-right text-xs text-white/60">
          <div>Income · {inr(totalIncome)}</div>
          <div>Expenses · {inr(totalExpense)}</div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================

function BSTab({ balances, profit }: { balances: LedgerBalance[]; profit: number }) {
  const assets = balances.filter(b => b.ledger.type === 'asset');
  const liabilities = balances.filter(b => b.ledger.type === 'liability');
  const equity = balances.filter(b => b.ledger.type === 'equity');
  const totalAssets = assets.reduce((s, b) => s + b.closingBalance, 0);
  const totalLiab = liabilities.reduce((s, b) => s + b.closingBalance, 0);
  const totalEquity = equity.reduce((s, b) => s + b.closingBalance, 0) + profit;

  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Assets</div>
        <BSSection rows={assets} />
        <div className="px-3 py-3 bg-[color:var(--color-paper)]/40 border-t border-[color:var(--color-line)] flex items-center justify-between font-medium">
          <span className="text-xs uppercase tracking-widest">Total assets</span>
          <span className="font-mono">{inr(totalAssets)}</span>
        </div>
      </div>
      <div className="space-y-4">
        <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Liabilities</div>
          <BSSection rows={liabilities} />
          <div className="px-3 py-3 bg-[color:var(--color-paper)]/40 border-t border-[color:var(--color-line)] flex items-center justify-between font-medium">
            <span className="text-xs uppercase tracking-widest">Total liabilities</span>
            <span className="font-mono">{inr(totalLiab)}</span>
          </div>
        </div>
        <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
          <div className="px-4 py-3 border-b border-[color:var(--color-line)] text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Equity</div>
          <BSSection rows={equity} />
          <div className="px-3 py-2 flex items-center justify-between border-t border-[color:var(--color-line)] text-xs">
            <span>Retained earnings (YTD)</span>
            <span className="font-mono">{inr(profit)}</span>
          </div>
          <div className="px-3 py-3 bg-[color:var(--color-paper)]/40 border-t border-[color:var(--color-line)] flex items-center justify-between font-medium">
            <span className="text-xs uppercase tracking-widest">Total equity</span>
            <span className="font-mono">{inr(totalEquity)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function BSSection({ rows }: { rows: LedgerBalance[] }) {
  return (
    <table className="w-full text-sm">
      <tbody>
        {rows.map(b => (
          <tr key={b.ledger.id} className="border-b border-[color:var(--color-line)] last:border-0">
            <td className="px-3 py-2">
              <div>{b.ledger.name}</div>
              <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{b.ledger.code}</div>
            </td>
            <td className="px-3 py-2 text-right font-mono">{inr(b.closingBalance)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-ink-muted)]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
