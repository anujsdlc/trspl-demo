// Lightweight CSV parser/serializer + templates for TRS bulk uploads

export type CSVRow = Record<string, string>;

export function parseCSV(text: string): { headers: string[]; rows: CSVRow[] } {
  const lines = text.replace(/\r\n?/g, '\n').split('\n').filter(l => l.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitLine(lines[0]).map(h => h.trim());
  const rows: CSVRow[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cells = splitLine(lines[i]);
    const row: CSVRow = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = (cells[j] || '').trim();
    }
    rows.push(row);
  }
  return { headers, rows };
}

function splitLine(line: string): string[] {
  const out: string[] = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (c === ',' && !inQuotes) {
      out.push(cur); cur = '';
    } else cur += c;
  }
  out.push(cur);
  return out;
}

export function toCSV(headers: string[], rows: CSVRow[]): string {
  const escape = (s: string) => /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  const head = headers.map(escape).join(',');
  const body = rows.map(r => headers.map(h => escape(r[h] || '')).join(',')).join('\n');
  return head + '\n' + body;
}

export function downloadCSV(filename: string, headers: string[], rows: CSVRow[]) {
  const csv = toCSV(headers, rows);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// === Bulk upload modes ===

export type BulkMode = 'products' | 'stock' | 'price' | 'transfer';

export interface BulkModeSpec {
  key: BulkMode;
  title: string;
  desc: string;
  headers: string[];
  sample: CSVRow[];
}

export const BULK_MODES: Record<BulkMode, BulkModeSpec> = {
  products: {
    key: 'products',
    title: 'New products',
    desc: 'Add new SKUs to the catalog. Assign to a brand and set initial stock at multiple stores.',
    headers: ['sku', 'title', 'subtitle', 'brand', 'category', 'price', 'compare_price', 'hsn', 'weight', 'best_before', 'fssai', 'initial_stock_stores'],
    sample: [
      { sku: 'BK-NEW-001', title: 'The Song of Achilles', subtitle: 'Madeline Miller', brand: 'RLY', category: 'fiction', price: '499', compare_price: '599', hsn: '4901', weight: '', best_before: '', fssai: '', initial_stock_stores: 's001:15;s002:12;s003:20' },
      { sku: 'CB-NEW-001', title: 'Ferrero Rocher T30', subtitle: 'Assorted 30-piece box', brand: 'CB', category: 'confectionery', price: '1199', compare_price: '', hsn: '1806', weight: '375g', best_before: '2027-06', fssai: '10012011000199', initial_stock_stores: 's027:24;s028:18;s029:20' },
      { sku: 'MT-NEW-001', title: 'JBL Charge 5', subtitle: 'Portable speaker · 20hr battery', brand: 'MTC', category: 'tech', price: '15999', compare_price: '17999', hsn: '8518', weight: '', best_before: '', fssai: '', initial_stock_stores: 's049:5;s050:4' },
      { sku: 'PS-NEW-001', title: 'Silk-Cashmere Reversible Scarf', subtitle: 'Ivory & Charcoal · 200g', brand: 'PSH', category: 'cashmere', price: '12999', compare_price: '', hsn: '6214', weight: '200g', best_before: '', fssai: '', initial_stock_stores: 's043:3' },
    ],
  },
  stock: {
    key: 'stock',
    title: 'Stock adjustment',
    desc: 'Update on-hand quantity for existing SKUs at one or more stores. Supports add / set / remove.',
    headers: ['sku', 'store_code', 'action', 'quantity', 'reason', 'batch', 'notes'],
    sample: [
      { sku: 'BK1000', store_code: 'RLY-BLR-04', action: 'add', quantity: '12', reason: 'Supplier receipt', batch: 'PO-4821', notes: 'From publisher shipment' },
      { sku: 'CB-FRR-24', store_code: 'CB-DEL-29', action: 'set', quantity: '48', reason: 'Physical count reconciliation', batch: '', notes: '' },
      { sku: 'MT-JBL-F5', store_code: 'MTC-COK-49', action: 'remove', quantity: '2', reason: 'Damaged in transit', batch: '', notes: 'Rain damage — return to supplier' },
    ],
  },
  price: {
    key: 'price',
    title: 'Price update',
    desc: 'Update selling and compare prices across the network. Effective date supported for scheduled changes.',
    headers: ['sku', 'new_price', 'new_compare_price', 'effective_date', 'reason'],
    sample: [
      { sku: 'BK1000', new_price: '449', new_compare_price: '499', effective_date: '2026-09-20', reason: 'Diwali promotion' },
      { sku: 'CB-LNT-EX', new_price: '399', new_compare_price: '450', effective_date: '2026-09-16', reason: 'Weekly special' },
      { sku: 'MT-SNS-M4', new_price: '31999', new_compare_price: '34990', effective_date: '2026-09-16', reason: 'Price match' },
    ],
  },
  transfer: {
    key: 'transfer',
    title: 'Store transfers',
    desc: 'Move stock between stores in bulk — rebalance inventory across the network with tracking numbers.',
    headers: ['sku', 'from_store_code', 'to_store_code', 'quantity', 'expected_arrival', 'notes'],
    sample: [
      { sku: 'BK1000', from_store_code: 'RLY-BLR-04', to_store_code: 'RLY-BLR-05', quantity: '10', expected_arrival: '2026-09-18', notes: '' },
      { sku: 'CB-FRR-24', from_store_code: 'CB-DEL-29', to_store_code: 'CB-GOI-27', quantity: '18', expected_arrival: '2026-09-19', notes: 'For Diwali gift boxes' },
      { sku: 'MT-JBL-F5', from_store_code: 'MTC-COK-49', to_store_code: 'MTC-IDR-50', quantity: '4', expected_arrival: '2026-09-18', notes: '' },
    ],
  },
};

// === Validation ===

export type Severity = 'ok' | 'warning' | 'error';

export interface ValidationResult {
  row: number;
  cell?: string;
  severity: Severity;
  message: string;
}

export interface ValidatedRow {
  index: number;
  raw: CSVRow;
  status: Severity;
  issues: ValidationResult[];
}

interface ValidateOpts {
  mode: BulkMode;
  validSKUs: Set<string>;
  validStores: Set<string>;
  validBrands: string[];
  validCategories: string[];
}

export function validate(rows: CSVRow[], opts: ValidateOpts): ValidatedRow[] {
  const { mode, validSKUs, validStores, validBrands, validCategories } = opts;
  return rows.map((r, idx) => {
    const issues: ValidationResult[] = [];
    const row = idx + 2; // +1 for 1-based, +1 for header

    if (mode === 'products') {
      if (!r.sku) issues.push({ row, cell: 'sku', severity: 'error', message: 'SKU is required' });
      else if (validSKUs.has(r.sku)) issues.push({ row, cell: 'sku', severity: 'error', message: 'SKU already exists — use stock or price update instead' });
      if (!r.title) issues.push({ row, cell: 'title', severity: 'error', message: 'Title is required' });
      if (!validBrands.includes(r.brand)) issues.push({ row, cell: 'brand', severity: 'error', message: `Brand must be one of ${validBrands.join(', ')}` });
      if (!validCategories.includes(r.category)) issues.push({ row, cell: 'category', severity: 'error', message: `Unknown category "${r.category}"` });
      const price = parseFloat(r.price);
      if (isNaN(price) || price <= 0) issues.push({ row, cell: 'price', severity: 'error', message: 'Price must be a positive number' });
      if (r.compare_price) {
        const cp = parseFloat(r.compare_price);
        if (isNaN(cp) || cp < price) issues.push({ row, cell: 'compare_price', severity: 'warning', message: 'Compare price should be higher than selling price' });
      }
      if (r.brand === 'CB' || r.brand === 'MSH' || r.brand === 'GLD') {
        if (!r.fssai) issues.push({ row, cell: 'fssai', severity: 'warning', message: 'FSSAI number recommended for food SKUs' });
        if (!r.best_before) issues.push({ row, cell: 'best_before', severity: 'warning', message: 'Best-before date recommended for perishables' });
      }
      // parse initial stock
      if (r.initial_stock_stores) {
        for (const chunk of r.initial_stock_stores.split(';')) {
          const [store] = chunk.split(':');
          if (store && !validStores.has(store.trim())) {
            issues.push({ row, cell: 'initial_stock_stores', severity: 'error', message: `Store "${store}" does not exist` });
          }
        }
      }
    }

    if (mode === 'stock') {
      if (!validSKUs.has(r.sku)) issues.push({ row, cell: 'sku', severity: 'error', message: `SKU "${r.sku}" not found in catalog` });
      if (!validStores.has(r.store_code)) issues.push({ row, cell: 'store_code', severity: 'error', message: `Store code "${r.store_code}" invalid` });
      if (!['add', 'remove', 'set'].includes(r.action)) issues.push({ row, cell: 'action', severity: 'error', message: 'Action must be add / remove / set' });
      const q = parseInt(r.quantity, 10);
      if (isNaN(q) || q < 0) issues.push({ row, cell: 'quantity', severity: 'error', message: 'Quantity must be a non-negative integer' });
      if (!r.reason) issues.push({ row, cell: 'reason', severity: 'warning', message: 'Reason recommended for audit trail' });
    }

    if (mode === 'price') {
      if (!validSKUs.has(r.sku)) issues.push({ row, cell: 'sku', severity: 'error', message: `SKU "${r.sku}" not found` });
      const p = parseFloat(r.new_price);
      if (isNaN(p) || p <= 0) issues.push({ row, cell: 'new_price', severity: 'error', message: 'Invalid price' });
      if (r.new_compare_price) {
        const cp = parseFloat(r.new_compare_price);
        if (isNaN(cp) || cp < p) issues.push({ row, cell: 'new_compare_price', severity: 'warning', message: 'Compare price should exceed selling price' });
      }
      if (r.effective_date) {
        const d = new Date(r.effective_date);
        if (isNaN(d.getTime())) issues.push({ row, cell: 'effective_date', severity: 'error', message: 'Invalid date format (use YYYY-MM-DD)' });
      }
    }

    if (mode === 'transfer') {
      if (!validSKUs.has(r.sku)) issues.push({ row, cell: 'sku', severity: 'error', message: `SKU not found` });
      if (!validStores.has(r.from_store_code)) issues.push({ row, cell: 'from_store_code', severity: 'error', message: 'From-store code invalid' });
      if (!validStores.has(r.to_store_code)) issues.push({ row, cell: 'to_store_code', severity: 'error', message: 'To-store code invalid' });
      if (r.from_store_code === r.to_store_code) issues.push({ row, cell: 'to_store_code', severity: 'error', message: 'From and To stores cannot be the same' });
      const q = parseInt(r.quantity, 10);
      if (isNaN(q) || q <= 0) issues.push({ row, cell: 'quantity', severity: 'error', message: 'Quantity must be positive' });
    }

    const status: Severity =
      issues.some(i => i.severity === 'error') ? 'error' :
      issues.some(i => i.severity === 'warning') ? 'warning' : 'ok';

    return { index: idx, raw: r, status, issues };
  });
}
