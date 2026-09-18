// ERP Phase 3 — Finance data layer.
// Chart of Accounts, Journals, GST returns, Bank reconciliation.

// ---------------------------------------------------------------------------
// Common helpers
// ---------------------------------------------------------------------------

function isBrowser() { return typeof window !== 'undefined'; }

function read<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser()) return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : fallback; } catch { return fallback; }
}

function write<T>(key: string, rows: T[]) {
  if (!isBrowser()) return;
  localStorage.setItem(key, JSON.stringify(rows));
}

function upsertRow<T extends { id: string }>(key: string, seed: T[], row: T) {
  const rows = read<T>(key, seed);
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = row;
  else rows.unshift(row);
  write(key, rows);
}

function deleteRow<T extends { id: string }>(key: string, seed: T[], id: string) {
  const rows = read<T>(key, seed);
  write(key, rows.filter(r => r.id !== id));
}

// ---------------------------------------------------------------------------
// Chart of Accounts
// ---------------------------------------------------------------------------

export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense';
export type AccountNature = 'debit' | 'credit';

export interface Ledger {
  id: string;
  code: string;
  name: string;
  type: AccountType;
  group: string;              // parent grouping name
  nature: AccountNature;      // normal side
  openingBalance: number;     // as of Apr 1
  isBank?: boolean;
  gstinLinked?: string;       // for state-wise GST payable
  status: 'active' | 'archived';
}

const COA_KEY = 'trs.erp.coa.v1';

/** Standard publisher/distributor CoA seeded with realistic groupings. */
export const SEED_COA: Ledger[] = [
  // Assets
  { id: 'led-1000', code: '1000', name: 'HDFC Bank — Current Account (Delhi HO)',  type: 'asset',     group: 'Bank Accounts',        nature: 'debit',  openingBalance: 4820000, isBank: true,  status: 'active' },
  { id: 'led-1001', code: '1001', name: 'ICICI Bank — Current Account (Bengaluru)', type: 'asset',    group: 'Bank Accounts',        nature: 'debit',  openingBalance: 1650000, isBank: true,  status: 'active' },
  { id: 'led-1002', code: '1002', name: 'SBI Bank — Current Account (Mumbai)',       type: 'asset',    group: 'Bank Accounts',        nature: 'debit',  openingBalance: 980000,  isBank: true,  status: 'active' },
  { id: 'led-1010', code: '1010', name: 'Cash on Hand',                              type: 'asset',    group: 'Cash & Cash Equivalents', nature: 'debit', openingBalance: 78000,  status: 'active' },
  { id: 'led-1020', code: '1020', name: 'Petty Cash — Delhi HO',                      type: 'asset',    group: 'Cash & Cash Equivalents', nature: 'debit', openingBalance: 12000,  status: 'active' },
  { id: 'led-1100', code: '1100', name: 'Accounts Receivable — Trade',                type: 'asset',    group: 'Receivables',          nature: 'debit',  openingBalance: 8420000, status: 'active' },
  { id: 'led-1110', code: '1110', name: 'Input GST Receivable — CGST',                type: 'asset',    group: 'Tax Assets',           nature: 'debit',  openingBalance: 240000,  status: 'active' },
  { id: 'led-1111', code: '1111', name: 'Input GST Receivable — SGST',                type: 'asset',    group: 'Tax Assets',           nature: 'debit',  openingBalance: 240000,  status: 'active' },
  { id: 'led-1112', code: '1112', name: 'Input GST Receivable — IGST',                type: 'asset',    group: 'Tax Assets',           nature: 'debit',  openingBalance: 320000,  status: 'active' },
  { id: 'led-1200', code: '1200', name: 'Inventory — Finished Books',                 type: 'asset',    group: 'Current Assets',       nature: 'debit',  openingBalance: 24500000, status: 'active' },
  { id: 'led-1210', code: '1210', name: 'Inventory — In Transit',                     type: 'asset',    group: 'Current Assets',       nature: 'debit',  openingBalance: 1200000, status: 'active' },
  { id: 'led-1500', code: '1500', name: 'Furniture & Fittings',                       type: 'asset',    group: 'Fixed Assets',         nature: 'debit',  openingBalance: 3400000, status: 'active' },
  { id: 'led-1501', code: '1501', name: 'Computers & Peripherals',                    type: 'asset',    group: 'Fixed Assets',         nature: 'debit',  openingBalance: 1850000, status: 'active' },
  { id: 'led-1502', code: '1502', name: 'Accumulated Depreciation',                   type: 'asset',    group: 'Fixed Assets',         nature: 'credit', openingBalance: -1620000, status: 'active' },

  // Liabilities
  { id: 'led-2000', code: '2000', name: 'Accounts Payable — Trade',                    type: 'liability', group: 'Current Liabilities', nature: 'credit', openingBalance: 5210000, status: 'active' },
  { id: 'led-2100', code: '2100', name: 'Output GST Payable — CGST',                   type: 'liability', group: 'Tax Liabilities',     nature: 'credit', openingBalance: 380000,  status: 'active' },
  { id: 'led-2101', code: '2101', name: 'Output GST Payable — SGST',                   type: 'liability', group: 'Tax Liabilities',     nature: 'credit', openingBalance: 380000,  status: 'active' },
  { id: 'led-2102', code: '2102', name: 'Output GST Payable — IGST',                   type: 'liability', group: 'Tax Liabilities',     nature: 'credit', openingBalance: 520000,  status: 'active' },
  { id: 'led-2110', code: '2110', name: 'TDS Payable',                                 type: 'liability', group: 'Tax Liabilities',     nature: 'credit', openingBalance: 84000,   status: 'active' },
  { id: 'led-2120', code: '2120', name: 'Salaries Payable',                            type: 'liability', group: 'Current Liabilities', nature: 'credit', openingBalance: 260000,  status: 'active' },
  { id: 'led-2500', code: '2500', name: 'Long-Term Loan — HDFC Bank',                  type: 'liability', group: 'Long-Term Liabilities', nature: 'credit', openingBalance: 12000000, status: 'active' },

  // Equity
  { id: 'led-3000', code: '3000', name: 'Share Capital',                               type: 'equity',   group: 'Capital',              nature: 'credit', openingBalance: 10000000, status: 'active' },
  { id: 'led-3100', code: '3100', name: 'Retained Earnings',                           type: 'equity',   group: 'Reserves & Surplus',   nature: 'credit', openingBalance: 18240000, status: 'active' },

  // Income
  { id: 'led-4000', code: '4000', name: 'Sales — Books (Zero-rated GST)',              type: 'income',   group: 'Operating Income',     nature: 'credit', openingBalance: 0,        status: 'active' },
  { id: 'led-4010', code: '4010', name: 'Sales — Books (12% GST)',                     type: 'income',   group: 'Operating Income',     nature: 'credit', openingBalance: 0,        status: 'active' },
  { id: 'led-4020', code: '4020', name: 'Sales — Stationery',                          type: 'income',   group: 'Operating Income',     nature: 'credit', openingBalance: 0,        status: 'active' },
  { id: 'led-4100', code: '4100', name: 'Discount Received',                           type: 'income',   group: 'Other Income',         nature: 'credit', openingBalance: 0,        status: 'active' },
  { id: 'led-4200', code: '4200', name: 'Interest Income',                             type: 'income',   group: 'Other Income',         nature: 'credit', openingBalance: 0,        status: 'active' },

  // Expenses
  { id: 'led-5000', code: '5000', name: 'Purchases — Books',                           type: 'expense',  group: 'Cost of Goods Sold',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-5010', code: '5010', name: 'Freight Inwards',                             type: 'expense',  group: 'Cost of Goods Sold',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-5020', code: '5020', name: 'Discount Allowed',                            type: 'expense',  group: 'Cost of Goods Sold',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6000', code: '6000', name: 'Salaries & Wages',                            type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6010', code: '6010', name: 'Rent — Branch Offices',                       type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6020', code: '6020', name: 'Electricity',                                 type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6030', code: '6030', name: 'Freight Outwards',                            type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6040', code: '6040', name: 'Travel & Conveyance',                         type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6050', code: '6050', name: 'Professional Fees',                           type: 'expense',  group: 'Operating Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6100', code: '6100', name: 'Bank Charges',                                type: 'expense',  group: 'Financial Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6110', code: '6110', name: 'Interest on Loan',                            type: 'expense',  group: 'Financial Expenses',   nature: 'debit',  openingBalance: 0,        status: 'active' },
  { id: 'led-6200', code: '6200', name: 'Depreciation',                                type: 'expense',  group: 'Depreciation',         nature: 'debit',  openingBalance: 0,        status: 'active' },
];

export function loadCoA(): Ledger[] { return read(COA_KEY, SEED_COA); }
export function saveLedger(l: Ledger) { upsertRow(COA_KEY, SEED_COA, l); }
export function deleteLedger(id: string) { deleteRow(COA_KEY, SEED_COA, id); }

// ---------------------------------------------------------------------------
// Journal Entries
// ---------------------------------------------------------------------------

export interface JournalLine {
  ledgerId: string;
  debit: number;
  credit: number;
  narration?: string;
}

export interface JournalEntry {
  id: string;
  jvNumber: string;
  date: string;
  reference?: string;       // linked invoice / bill / receipt
  narration: string;
  branchId: string;
  gstinId: string;
  lines: JournalLine[];
  totalDebit: number;
  totalCredit: number;
  status: 'draft' | 'posted' | 'reversed';
  postedBy?: string;
  autoPosted?: boolean;
}

const JV_KEY = 'trs.erp.journals.v1';

export const SEED_JVS: JournalEntry[] = [
  {
    id: 'jv-001', jvNumber: 'JV-2026-0201', date: '2026-08-14',
    reference: 'INV-DEL-2026-0842', narration: 'Sales to Delhi Public School (SO-2026-0311)',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-1100', debit: 150556, credit: 0, narration: 'Receivable — DPS RKP' },
      { ledgerId: 'led-4000', debit: 0, credit: 150556, narration: 'Book sales · zero-rated' },
    ],
    totalDebit: 150556, totalCredit: 150556, status: 'posted', autoPosted: true,
  },
  {
    id: 'jv-002', jvNumber: 'JV-2026-0202', date: '2026-08-18',
    reference: 'REC-2026-0311', narration: 'Payment received from DPS RKP',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-1000', debit: 150556, credit: 0, narration: 'HDFC bank credit' },
      { ledgerId: 'led-1100', debit: 0, credit: 150556, narration: 'AR settle' },
    ],
    totalDebit: 150556, totalCredit: 150556, status: 'posted',
  },
  {
    id: 'jv-003', jvNumber: 'JV-2026-0203', date: '2026-08-22',
    reference: 'INV-BLR-2026-0289', narration: 'Sales to DAV Bengaluru',
    branchId: 'br-002', gstinId: 'gst-002',
    lines: [
      { ledgerId: 'led-1100', debit: 85800, credit: 0 },
      { ledgerId: 'led-4000', debit: 0, credit: 85800 },
    ],
    totalDebit: 85800, totalCredit: 85800, status: 'posted', autoPosted: true,
  },
  {
    id: 'jv-004', jvNumber: 'JV-2026-0210', date: '2026-08-25',
    reference: 'PO-2026-0021', narration: 'Books received from NCERT',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-1200', debit: 199538, credit: 0, narration: 'Inventory addition' },
      { ledgerId: 'led-2000', debit: 0, credit: 199538, narration: 'AP — NCERT' },
    ],
    totalDebit: 199538, totalCredit: 199538, status: 'posted', autoPosted: true,
  },
  {
    id: 'jv-005', jvNumber: 'JV-2026-0221', date: '2026-08-31',
    narration: 'August salaries — HO staff',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-6000', debit: 1240000, credit: 0 },
      { ledgerId: 'led-2110', debit: 0, credit: 124000, narration: 'TDS 10%' },
      { ledgerId: 'led-1000', debit: 0, credit: 1116000, narration: 'Net paid via bank' },
    ],
    totalDebit: 1240000, totalCredit: 1240000, status: 'posted',
  },
  {
    id: 'jv-006', jvNumber: 'JV-2026-0230', date: '2026-09-04',
    reference: 'INV/NCERT/2026/0812', narration: 'Bill booked — NCERT PO-0021',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-5000', debit: 199538, credit: 0, narration: 'Purchase cost' },
      { ledgerId: 'led-2000', debit: 199538, credit: 0, narration: 'Contra AP' },
      { ledgerId: 'led-1000', debit: 0, credit: 199538, narration: 'Bank payment' },
      { ledgerId: 'led-1200', debit: 0, credit: 199538, narration: 'Contra inventory' },
    ],
    totalDebit: 399076, totalCredit: 399076, status: 'posted',
  },
  {
    id: 'jv-007', jvNumber: 'JV-2026-0240', date: '2026-09-12',
    narration: 'August rent — Delhi HO',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-6010', debit: 380000, credit: 0 },
      { ledgerId: 'led-2110', debit: 0, credit: 38000, narration: 'TDS 10%' },
      { ledgerId: 'led-1000', debit: 0, credit: 342000 },
    ],
    totalDebit: 380000, totalCredit: 380000, status: 'posted',
  },
  {
    id: 'jv-008', jvNumber: 'JV-2026-0250', date: '2026-09-14',
    reference: 'INV-COK-2026-0088', narration: 'Sales to Bhavans Mumbai (IGST)',
    branchId: 'br-005', gstinId: 'gst-005',
    lines: [
      { ledgerId: 'led-1100', debit: 187264, credit: 0 },
      { ledgerId: 'led-4010', debit: 0, credit: 167200, narration: 'Book sales · 12%' },
      { ledgerId: 'led-2102', debit: 0, credit: 20064, narration: 'Output IGST 12%' },
    ],
    totalDebit: 187264, totalCredit: 187264, status: 'posted', autoPosted: true,
  },
  {
    id: 'jv-009', jvNumber: 'JV-2026-0260', date: '2026-09-15',
    narration: 'HDFC monthly bank charges',
    branchId: 'br-001', gstinId: 'gst-001',
    lines: [
      { ledgerId: 'led-6100', debit: 4200, credit: 0 },
      { ledgerId: 'led-1000', debit: 0, credit: 4200 },
    ],
    totalDebit: 4200, totalCredit: 4200, status: 'posted',
  },
];

export function loadJVs(): JournalEntry[] { return read(JV_KEY, SEED_JVS); }
export function saveJV(j: JournalEntry) { upsertRow(JV_KEY, SEED_JVS, j); }
export function deleteJV(id: string) { deleteRow(JV_KEY, SEED_JVS, id); }

// ---------------------------------------------------------------------------
// Bank statement entries + reconciliation
// ---------------------------------------------------------------------------

export type BankMatchStatus = 'matched' | 'unmatched' | 'partially-matched';

export interface BankEntry {
  id: string;
  bankLedgerId: string;
  txnDate: string;
  particulars: string;
  chequeRef?: string;
  debit: number;      // debit from bank = money out
  credit: number;     // credit to bank = money in
  balance: number;
  matchStatus: BankMatchStatus;
  matchedJvId?: string;
}

const BANK_KEY = 'trs.erp.bank-entries.v1';

export const SEED_BANK_ENTRIES: BankEntry[] = [
  { id: 'bnk-001', bankLedgerId: 'led-1000', txnDate: '2026-08-18', particulars: 'NEFT credit — DPS RKP', chequeRef: 'DPSRKP/8842',  debit: 0,        credit: 150556, balance: 4970556, matchStatus: 'matched',   matchedJvId: 'jv-002' },
  { id: 'bnk-002', bankLedgerId: 'led-1000', txnDate: '2026-08-25', particulars: 'NEFT credit — DAV Bengaluru', chequeRef: 'DAV/1189', debit: 0,        credit: 85800,  balance: 5056356, matchStatus: 'unmatched' },
  { id: 'bnk-003', bankLedgerId: 'led-1000', txnDate: '2026-08-31', particulars: 'Salary payments — HO staff',              debit: 1116000,   credit: 0,       balance: 3940356, matchStatus: 'matched',   matchedJvId: 'jv-005' },
  { id: 'bnk-004', bankLedgerId: 'led-1000', txnDate: '2026-09-04', particulars: 'NEFT debit — NCERT PO-0021', chequeRef: 'NCERT/24812', debit: 199538, credit: 0,       balance: 3740818, matchStatus: 'matched',   matchedJvId: 'jv-006' },
  { id: 'bnk-005', bankLedgerId: 'led-1000', txnDate: '2026-09-05', particulars: 'NEFT credit — Sapna Book House',           debit: 0,        credit: 240000, balance: 3980818, matchStatus: 'unmatched' },
  { id: 'bnk-006', bankLedgerId: 'led-1000', txnDate: '2026-09-08', particulars: 'NEFT credit — IIMB Library',              debit: 0,        credit: 84000,  balance: 4064818, matchStatus: 'unmatched' },
  { id: 'bnk-007', bankLedgerId: 'led-1000', txnDate: '2026-09-12', particulars: 'Rent transfer — Aug', chequeRef: 'RENT/908', debit: 342000,   credit: 0,       balance: 3722818, matchStatus: 'matched',   matchedJvId: 'jv-007' },
  { id: 'bnk-008', bankLedgerId: 'led-1000', txnDate: '2026-09-14', particulars: 'NEFT credit — Bhavans Mumbai', chequeRef: 'BVM/2288', debit: 0,        credit: 187264, balance: 3910082, matchStatus: 'matched',   matchedJvId: 'jv-008' },
  { id: 'bnk-009', bankLedgerId: 'led-1000', txnDate: '2026-09-15', particulars: 'HDFC — Bank charges',                    debit: 4200,     credit: 0,       balance: 3905882, matchStatus: 'matched',   matchedJvId: 'jv-009' },
  { id: 'bnk-010', bankLedgerId: 'led-1000', txnDate: '2026-09-16', particulars: 'NEFT credit — Crossword Bookstores',      debit: 0,        credit: 320000, balance: 4225882, matchStatus: 'unmatched' },
  { id: 'bnk-011', bankLedgerId: 'led-1001', txnDate: '2026-09-10', particulars: 'Bengaluru rent — Aug',                    debit: 145000,   credit: 0,       balance: 1505000, matchStatus: 'unmatched' },
  { id: 'bnk-012', bankLedgerId: 'led-1002', txnDate: '2026-09-16', particulars: 'Cash deposit — Mumbai counter',           debit: 0,        credit: 68000,  balance: 1048000, matchStatus: 'unmatched' },
];

export function loadBankEntries(): BankEntry[] { return read(BANK_KEY, SEED_BANK_ENTRIES); }
export function saveBankEntry(e: BankEntry) { upsertRow(BANK_KEY, SEED_BANK_ENTRIES, e); }

// ---------------------------------------------------------------------------
// Derived: trial balance / P&L / balance sheet
// ---------------------------------------------------------------------------

export interface LedgerBalance {
  ledger: Ledger;
  totalDebit: number;
  totalCredit: number;
  closingBalance: number;   // signed w.r.t. nature
}

export function computeBalances(ledgers: Ledger[], journals: JournalEntry[]): LedgerBalance[] {
  const byId = new Map(ledgers.map(l => [l.id, l]));
  const debits = new Map<string, number>();
  const credits = new Map<string, number>();
  for (const j of journals) {
    if (j.status !== 'posted') continue;
    for (const line of j.lines) {
      debits.set(line.ledgerId,  (debits.get(line.ledgerId)  ?? 0) + line.debit);
      credits.set(line.ledgerId, (credits.get(line.ledgerId) ?? 0) + line.credit);
    }
  }
  return ledgers.map(l => {
    const d = debits.get(l.id) ?? 0;
    const c = credits.get(l.id) ?? 0;
    // opening balance is expressed positive on the ledger's natural side.
    const opening = l.openingBalance;
    const closing = l.nature === 'debit'
      ? opening + d - c
      : opening + c - d;
    return { ledger: l, totalDebit: d, totalCredit: c, closingBalance: closing };
  });
}

export function summariseByType(balances: LedgerBalance[]) {
  const bucket = { asset: 0, liability: 0, equity: 0, income: 0, expense: 0 };
  for (const b of balances) bucket[b.ledger.type] += b.closingBalance;
  return bucket;
}

// ---------------------------------------------------------------------------
// GST returns — computed from Sales Orders
// ---------------------------------------------------------------------------

export interface GSTRRow {
  gstin: string;
  state: string;
  invoices: number;
  taxableValue: number;
  cgst: number;
  sgst: number;
  igst: number;
  total: number;
}

export function computeGSTR1(salesOrders: {
  gstinId: string;
  invoiceNumber?: string;
  status: string;
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  total: number;
  lines: { gstRate: number }[];
}[], gstRegistrations: { id: string; gstin: string; state: string }[]): GSTRRow[] {
  const byGstin = new Map<string, GSTRRow>();
  for (const reg of gstRegistrations) {
    byGstin.set(reg.id, {
      gstin: reg.gstin, state: reg.state, invoices: 0,
      taxableValue: 0, cgst: 0, sgst: 0, igst: 0, total: 0,
    });
  }
  for (const so of salesOrders) {
    if (!['invoiced', 'delivered', 'paid'].includes(so.status)) continue;
    if (!so.invoiceNumber) continue;
    const row = byGstin.get(so.gstinId);
    if (!row) continue;
    const taxable = so.subtotal - so.discountTotal;
    row.invoices += 1;
    row.taxableValue += taxable;
    // Assume intra-state if any line's gstRate > 0; state-code split not fully modelled here.
    const anyGst = so.lines.some(l => l.gstRate > 0);
    if (anyGst) {
      // Simple split: half CGST, half SGST for intra-state; here treat all as intra by default.
      row.cgst += so.gstTotal / 2;
      row.sgst += so.gstTotal / 2;
    }
    row.total += so.total;
  }
  return [...byGstin.values()].filter(r => r.invoices > 0);
}
