import { parseCSV, type CSVRow } from './csv';

export const TALLY_BATCHES_KEY = 'trs.tally.batches.v1';

export type TallyImportType = 'parties' | 'stock-items' | 'opening-stock';

export const IMPORT_TYPE_LABEL: Record<TallyImportType, string> = {
  parties: 'Parties (ledgers)',
  'stock-items': 'Stock items',
  'opening-stock': 'Opening stock',
};

export const EXPECTED_COLUMNS: Record<TallyImportType, string[]> = {
  parties: ['Ledger Name', 'Under', 'GSTIN', 'State', 'Alias', 'Contact Person'],
  'stock-items': ['Stock Item', 'Under', 'Unit', 'Rate', 'ISBN'],
  'opening-stock': ['Item Name', 'Opening Qty', 'Opening Value'],
};

export type RowStatus = 'ok' | 'warning' | 'error';

export interface RowIssue {
  column?: string;
  severity: 'warning' | 'error';
  message: string;
}

export interface StagedRow {
  index: number;
  raw: CSVRow;
  status: RowStatus;
  issues: RowIssue[];
}

export interface TallyBatch {
  id: string;
  reference: string;
  type: TallyImportType;
  fileName: string;
  createdAt: string;
  importedAt?: string;
  status: 'staged' | 'imported' | 'cancelled';
  rows: StagedRow[];
  ignoredColumns: string[];
  storeCode?: string;
}

const GSTIN_CHARS = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const GSTIN_SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

export const STATE_BY_CODE: Record<string, string> = {
  '01': 'Jammu and Kashmir', '02': 'Himachal Pradesh', '03': 'Punjab', '04': 'Chandigarh',
  '05': 'Uttarakhand', '06': 'Haryana', '07': 'Delhi', '08': 'Rajasthan',
  '09': 'Uttar Pradesh', '10': 'Bihar', '11': 'Sikkim', '12': 'Arunachal Pradesh',
  '13': 'Nagaland', '14': 'Manipur', '15': 'Mizoram', '16': 'Tripura',
  '17': 'Meghalaya', '18': 'Assam', '19': 'West Bengal', '20': 'Jharkhand',
  '21': 'Odisha', '22': 'Chhattisgarh', '23': 'Madhya Pradesh', '24': 'Gujarat',
  '27': 'Maharashtra', '29': 'Karnataka', '30': 'Goa', '31': 'Lakshadweep',
  '32': 'Kerala', '33': 'Tamil Nadu', '34': 'Puducherry', '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana', '37': 'Andhra Pradesh', '38': 'Ladakh',
};

export function gstinCheckDigit(first14: string): string {
  let sum = 0;
  for (let i = 0; i < 14; i++) {
    const value = GSTIN_CHARS.indexOf(first14[i]);
    if (value < 0) return '';
    const factor = i % 2 === 0 ? 1 : 2;
    const product = value * factor;
    sum += Math.floor(product / 36) + (product % 36);
  }
  return GSTIN_CHARS[(36 - (sum % 36)) % 36];
}

export function isValidGstin(gstin: string): boolean {
  const g = gstin.trim().toUpperCase();
  if (!GSTIN_SHAPE.test(g)) return false;
  if (!STATE_BY_CODE[g.slice(0, 2)]) return false;
  return gstinCheckDigit(g.slice(0, 14)) === g[14];
}

function sameState(a: string, b: string): boolean {
  const norm = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
  return norm(a) === norm(b);
}

export function isValidIsbn13(isbn: string): boolean {
  const digits = isbn.replace(/[^0-9]/g, '');
  if (digits.length !== 13) return false;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += Number(digits[i]) * (i % 2 === 0 ? 1 : 3);
  }
  return (10 - (sum % 10)) % 10 === Number(digits[12]);
}

export function parseAmount(raw: string): number | undefined {
  const cleaned = (raw ?? '').replace(/[, ]/g, '').trim();
  if (cleaned === '') return undefined;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : undefined;
}

export interface ValidateContext {
  existingItems?: Set<string>;
  existingParties?: Set<string>;
  itemsWithOpening?: Set<string>;
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
}

export interface ParseResult {
  rows: StagedRow[];
  headers: string[];
  ignoredColumns: string[];
  missingColumns: string[];
}

export function parseTally(
  text: string,
  type: TallyImportType,
  context: ValidateContext = {},
): ParseResult {
  const { headers, rows } = parseCSV(stripBom(text));
  const expected = EXPECTED_COLUMNS[type];
  const ignoredColumns = headers.filter(h => h && !expected.includes(h));
  const missingColumns = expected.filter(c => !headers.includes(c));

  const seen = new Set<string>();
  const staged: StagedRow[] = rows.map((raw, index) => {
    const issues = validateRow(raw, type, context, seen);
    const status: RowStatus =
      issues.some(i => i.severity === 'error') ? 'error'
      : issues.some(i => i.severity === 'warning') ? 'warning'
      : 'ok';
    return { index, raw, status, issues };
  });

  return { rows: staged, headers, ignoredColumns, missingColumns };
}

function validateRow(
  raw: CSVRow,
  type: TallyImportType,
  context: ValidateContext,
  seen: Set<string>,
): RowIssue[] {
  const issues: RowIssue[] = [];

  if (type === 'parties') {
    const name = (raw['Ledger Name'] ?? '').trim();
    if (!name) issues.push({ column: 'Ledger Name', severity: 'error', message: 'A ledger needs a name' });

    const key = name.toLowerCase();
    if (name && seen.has(key)) {
      issues.push({ column: 'Ledger Name', severity: 'error', message: 'This ledger appears twice in the file' });
    } else if (name) {
      seen.add(key);
    }
    if (name && context.existingParties?.has(key)) {
      issues.push({ column: 'Ledger Name', severity: 'warning', message: 'A party of this name is already on file' });
    }

    const under = (raw['Under'] ?? '').trim();
    if (!/sundry (debtors|creditors)/i.test(under)) {
      issues.push({ column: 'Under', severity: 'warning', message: 'Not under Sundry Debtors or Creditors — it will not become a customer or supplier' });
    }

    const gstin = (raw['GSTIN'] ?? '').trim().toUpperCase();
    if (gstin) {
      if (!GSTIN_SHAPE.test(gstin)) {
        issues.push({ column: 'GSTIN', severity: 'error', message: 'Not the shape of a GSTIN' });
      } else if (!STATE_BY_CODE[gstin.slice(0, 2)]) {
        issues.push({ column: 'GSTIN', severity: 'error', message: `${gstin.slice(0, 2)} is not a GST state code` });
      } else if (gstinCheckDigit(gstin.slice(0, 14)) !== gstin[14]) {
        issues.push({ column: 'GSTIN', severity: 'error', message: 'Check digit does not match — the GSTIN is mistyped' });
      } else {
        const fromGstin = STATE_BY_CODE[gstin.slice(0, 2)];
        const stated = (raw['State'] ?? '').trim();
        if (!stated) {
          issues.push({ column: 'State', severity: 'warning', message: `Blank — taken as ${fromGstin} from the GSTIN` });
        } else if (!sameState(stated, fromGstin)) {
          issues.push({ column: 'State', severity: 'warning', message: `Spelt "${stated}"; the GSTIN says ${fromGstin}, which wins` });
        }
      }
    } else {
      issues.push({ column: 'GSTIN', severity: 'warning', message: 'No GSTIN — treated as unregistered' });
    }
  }

  if (type === 'stock-items') {
    const name = (raw['Stock Item'] ?? '').trim();
    if (!name) issues.push({ column: 'Stock Item', severity: 'error', message: 'An item needs a name' });

    const key = name.toLowerCase();
    if (name && seen.has(key)) {
      issues.push({ column: 'Stock Item', severity: 'error', message: 'This item appears twice in the file' });
    } else if (name) {
      seen.add(key);
    }
    if (name && context.existingItems?.has(key)) {
      issues.push({ column: 'Stock Item', severity: 'warning', message: 'An item of this name is already in the catalogue' });
    }

    const rate = parseAmount(raw['Rate'] ?? '');
    if (rate === undefined) {
      issues.push({ column: 'Rate', severity: 'error', message: 'Rate is not a number' });
    } else if (rate <= 0) {
      issues.push({ column: 'Rate', severity: 'error', message: 'Rate must be more than zero' });
    }

    if (!(raw['Unit'] ?? '').trim()) {
      issues.push({ column: 'Unit', severity: 'warning', message: 'No unit — taken as Nos' });
    }

    const isbn = (raw['ISBN'] ?? '').trim();
    if (isbn && !isValidIsbn13(isbn)) {
      issues.push({ column: 'ISBN', severity: 'error', message: 'ISBN-13 check digit does not match' });
    }
  }

  if (type === 'opening-stock') {
    const name = (raw['Item Name'] ?? '').trim();
    if (!name) issues.push({ column: 'Item Name', severity: 'error', message: 'A balance needs an item' });

    const key = name.toLowerCase();
    if (name && seen.has(key)) {
      issues.push({ column: 'Item Name', severity: 'error', message: 'This item appears twice in the file' });
    } else if (name) {
      seen.add(key);
    }
    if (name && context.itemsWithOpening?.has(key)) {
      issues.push({ column: 'Item Name', severity: 'error', message: 'This item already carries an opening balance' });
    }
    if (name && context.existingItems && !context.existingItems.has(key)) {
      issues.push({ column: 'Item Name', severity: 'warning', message: 'Not in the catalogue — import the stock items first' });
    }

    const qty = parseAmount(raw['Opening Qty'] ?? '');
    if (qty === undefined) {
      issues.push({ column: 'Opening Qty', severity: 'error', message: 'Quantity is not a number' });
    } else if (qty < 0) {
      issues.push({ column: 'Opening Qty', severity: 'error', message: 'An opening balance cannot be negative' });
    }

    const value = parseAmount(raw['Opening Value'] ?? '');
    if (value === undefined) {
      issues.push({ column: 'Opening Value', severity: 'error', message: 'Value is not a number' });
    } else if (qty !== undefined && qty > 0 && value === 0) {
      issues.push({ column: 'Opening Value', severity: 'warning', message: 'Quantity with no value — the item will cost nothing' });
    }
  }

  return issues;
}

export function revalidate(batch: TallyBatch, context: ValidateContext = {}): TallyBatch {
  const seen = new Set<string>();
  const rows = batch.rows.map(row => {
    const issues = validateRow(row.raw, batch.type, context, seen);
    const status: RowStatus =
      issues.some(i => i.severity === 'error') ? 'error'
      : issues.some(i => i.severity === 'warning') ? 'warning'
      : 'ok';
    return { ...row, issues, status };
  });
  return { ...batch, rows };
}

export interface BatchSummary {
  total: number;
  ok: number;
  warning: number;
  error: number;
  importable: number;
}

export function summarise(batch: TallyBatch): BatchSummary {
  const total = batch.rows.length;
  const error = batch.rows.filter(r => r.status === 'error').length;
  const warning = batch.rows.filter(r => r.status === 'warning').length;
  return { total, ok: total - error - warning, warning, error, importable: total - error };
}

export function canImport(batch: TallyBatch): { ok: true } | { ok: false; reason: string } {
  if (batch.status === 'imported') return { ok: false, reason: 'This batch has already been imported.' };
  if (batch.status === 'cancelled') return { ok: false, reason: 'This batch was cancelled.' };
  const s = summarise(batch);
  if (s.total === 0) return { ok: false, reason: 'There is nothing in this batch.' };
  if (s.error > 0) {
    return { ok: false, reason: `${s.error} ${s.error === 1 ? 'row has' : 'rows have'} an error. Correct or remove them first.` };
  }
  if (batch.type === 'opening-stock' && !batch.storeCode) {
    return { ok: false, reason: 'Say which store the opening balances were counted at.' };
  }
  return { ok: true };
}

export interface ImportedParty {
  name: string;
  alias?: string;
  gstin?: string;
  state?: string;
  stateCode?: string;
  contact?: string;
  role: 'customer' | 'supplier' | 'other';
}

export function partiesFrom(batch: TallyBatch): ImportedParty[] {
  return batch.rows
    .filter(r => r.status !== 'error')
    .map(r => {
      const gstin = (r.raw['GSTIN'] ?? '').trim().toUpperCase();
      const code = gstin.slice(0, 2);
      const under = (r.raw['Under'] ?? '').toLowerCase();
      return {
        name: (r.raw['Ledger Name'] ?? '').trim(),
        alias: (r.raw['Alias'] ?? '').trim() || undefined,
        gstin: gstin || undefined,
        state: STATE_BY_CODE[code] ?? ((r.raw['State'] ?? '').trim() || undefined),
        stateCode: STATE_BY_CODE[code] ? code : undefined,
        contact: (r.raw['Contact Person'] ?? '').trim() || undefined,
        role: under.includes('debtor') ? 'customer' : under.includes('creditor') ? 'supplier' : 'other',
      };
    });
}

export interface ImportedItem {
  name: string;
  group?: string;
  unit: string;
  rate: number;
  isbn?: string;
}

export function itemsFrom(batch: TallyBatch): ImportedItem[] {
  return batch.rows
    .filter(r => r.status !== 'error')
    .map(r => ({
      name: (r.raw['Stock Item'] ?? '').trim(),
      group: (r.raw['Under'] ?? '').trim() || undefined,
      unit: (r.raw['Unit'] ?? '').trim() || 'Nos',
      rate: parseAmount(r.raw['Rate'] ?? '') ?? 0,
      isbn: (r.raw['ISBN'] ?? '').trim() || undefined,
    }));
}

export interface ImportedOpening {
  name: string;
  qty: number;
  value: number;
  unitCost: number;
}

export function openingFrom(batch: TallyBatch): ImportedOpening[] {
  return batch.rows
    .filter(r => r.status !== 'error')
    .map(r => {
      const qty = parseAmount(r.raw['Opening Qty'] ?? '') ?? 0;
      const value = parseAmount(r.raw['Opening Value'] ?? '') ?? 0;
      return {
        name: (r.raw['Item Name'] ?? '').trim(),
        qty,
        value,
        unitCost: qty > 0 ? Math.round((value / qty) * 100) / 100 : 0,
      };
    });
}
