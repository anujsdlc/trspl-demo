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
    headers: ['sku', 'title', 'subtitle', 'brand', 'category', 'price', 'compare_price', 'hsn', 'weight', 'best_before', 'fssai', 'image', 'initial_stock_stores'],
    sample: [
      { sku: 'BK-NEW-001', title: 'The Song of Achilles', subtitle: 'Madeline Miller', brand: 'RLY', category: 'fiction', price: '499', compare_price: '599', hsn: '4901', weight: '', best_before: '', fssai: '', image: '', initial_stock_stores: 's001:15;s002:12;s003:20' },
      { sku: 'CB-NEW-001', title: 'Ferrero Rocher T30', subtitle: 'Assorted 30-piece box', brand: 'CB', category: 'confectionery', price: '1199', compare_price: '', hsn: '1806', weight: '375g', best_before: '2027-06', fssai: '10012011000199', image: 'https://images.unsplash.com/photo-1598881265033-aaceb3dc4c47?w=800&h=1000&fit=crop&q=90', initial_stock_stores: 's027:24;s028:18;s029:20' },
      { sku: 'MT-NEW-001', title: 'JBL Charge 5', subtitle: 'Portable speaker · 20hr battery', brand: 'MTC', category: 'tech', price: '15999', compare_price: '17999', hsn: '8518', weight: '', best_before: '', fssai: '', image: '', initial_stock_stores: 's049:5;s050:4' },
      { sku: 'PS-NEW-001', title: 'Silk-Cashmere Reversible Scarf', subtitle: 'Ivory & Charcoal · 200g', brand: 'PSH', category: 'cashmere', price: '12999', compare_price: '', hsn: '6214', weight: '200g', best_before: '', fssai: '', image: '', initial_stock_stores: 's043:3' },
    ],
  },
  stock: {
    key: 'stock',
    title: 'Stock adjustment',
    desc: 'Update on-hand quantity for existing SKUs at one or more stores. Supports add / set / remove.',
    headers: ['sku', 'store_code', 'action', 'quantity', 'reason', 'batch', 'notes'],
    sample: [
      { sku: 'RLY-MNG-0001', store_code: 'RLY-BLR-05', action: 'add', quantity: '12', reason: 'Supplier receipt', batch: 'PO-4821', notes: 'From publisher shipment' },
      { sku: 'CB-FRR-24', store_code: 'CB-DEL-30', action: 'set', quantity: '48', reason: 'Physical count reconciliation', batch: '', notes: '' },
      { sku: 'MT-JBL-F5', store_code: 'MTC-COK-50', action: 'remove', quantity: '2', reason: 'Damaged in transit', batch: '', notes: 'Rain damage — return to supplier' },
    ],
  },
  price: {
    key: 'price',
    title: 'Price update',
    desc: 'Update selling and compare prices across the network. Effective date supported for scheduled changes.',
    headers: ['sku', 'new_price', 'new_compare_price', 'effective_date', 'reason'],
    sample: [
      { sku: 'RLY-MNG-0001', new_price: '799', new_compare_price: '899', effective_date: '2026-10-01', reason: 'Diwali promotion' },
      { sku: 'CB-LNT-EX', new_price: '399', new_compare_price: '450', effective_date: '2026-10-01', reason: 'Weekly special' },
      { sku: 'MT-SNS-M4', new_price: '31999', new_compare_price: '34990', effective_date: '2026-10-01', reason: 'Price match' },
    ],
  },
  transfer: {
    key: 'transfer',
    title: 'Store transfers',
    desc: 'Move stock between stores in bulk — rebalance inventory across the network with tracking numbers.',
    headers: ['sku', 'from_store_code', 'to_store_code', 'quantity', 'expected_arrival', 'notes'],
    sample: [
      { sku: 'RLY-MNG-0001', from_store_code: 'RLY-BLR-05', to_store_code: 'RLY-BLR-06', quantity: '10', expected_arrival: '2026-10-01', notes: '' },
      { sku: 'CB-FRR-24', from_store_code: 'CB-DEL-30', to_store_code: 'CB-GOI-28', quantity: '18', expected_arrival: '2026-10-02', notes: 'For Diwali gift boxes' },
      { sku: 'MT-JBL-F5', from_store_code: 'MTC-COK-50', to_store_code: 'MTC-IDR-51', quantity: '4', expected_arrival: '2026-10-01', notes: '' },
    ],
  },
};

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
  onHandFor?: (sku: string, storeCode: string) => number;
}

export function validate(rows: CSVRow[], opts: ValidateOpts): ValidatedRow[] {
  const { mode, validSKUs, validStores, validBrands, validCategories, onHandFor } = opts;
  return rows.map((r, idx) => {
    const issues: ValidationResult[] = [];
    const row = idx + 2;

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
      if (r.image && !/^(https?:\/\/|data:image\/)/i.test(r.image.trim())) {
        issues.push({ row, cell: 'image', severity: 'warning', message: 'Not a URL — attach the picture folder instead, or a placeholder is used' });
      }

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
      if (onHandFor && r.action === 'remove' && !isNaN(q) && validSKUs.has(r.sku) && validStores.has(r.store_code)) {
        const have = onHandFor(r.sku, r.store_code);
        if (q > have) {
          issues.push({ row, cell: 'quantity', severity: 'error', message: `Only ${have} on hand at ${r.store_code}` });
        }
      }
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
      if (onHandFor && !isNaN(q) && validSKUs.has(r.sku) && validStores.has(r.from_store_code)) {
        const have = onHandFor(r.sku, r.from_store_code);
        if (q > have) {
          issues.push({ row, cell: 'quantity', severity: 'error', message: `Only ${have} on hand at ${r.from_store_code}` });
        }
      }
    }

    const status: Severity =
      issues.some(i => i.severity === 'error') ? 'error' :
      issues.some(i => i.severity === 'warning') ? 'warning' : 'ok';

    return { index: idx, raw: r, status, issues };
  });
}

export const HEADER_ALIASES: Record<BulkMode, Record<string, string>> = {
  products: {
    'name': 'title',
    'product name': 'title',
    'sales price': 'price',
    'list price': 'price',
    'cost': 'cost',
    'ean-13': 'sku',
    'ean13': 'sku',
    'barcode': 'sku',
    'internal reference': 'sku',
    'default_code': 'sku',
    'brand': 'product_brand',
    'retail category': 'category',
    'l10n_in_hsn_code': 'hsn',
    'hsn code': 'hsn',
    'image': 'image',
    'image_1920': 'image',
    'vendors/vendor': 'supplier',
    'vendors/unit price': 'cost',
  },
  stock: {
    'stock item': 'sku',
    'item name': 'sku',
    'location': 'store_code',
    'warehouse': 'store_code',
    'qty': 'quantity',
    'quantity on hand': 'quantity',
  },
  price: {
    'stock item': 'sku',
    'sales price': 'new_price',
    'list price': 'new_price',
  },
  transfer: {
    'stock item': 'sku',
    'source location': 'from_store_code',
    'destination location': 'to_store_code',
    'qty': 'quantity',
  },
};

export const CATEGORY_ALIASES: Record<string, string> = {
  'audio': 'tech',
  'electronics': 'tech',
  'books': 'books',
  'book': 'books',
  'stationery': 'stationery',
  'chocolate': 'confectionery',
  'chocolates': 'confectionery',
  'confectionery': 'confectionery',
  'mithai': 'sweets',
  'indian sweets': 'sweets',
  'sweets': 'sweets',
  'travel essentials': 'travel',
  'travel': 'travel',
  'bags': 'travel',
  'luggage': 'travel',
  'gifting': 'gifts',
  'gifts': 'gifts',
  'toys': 'toys',
  'wellness': 'personal-care',
  'personal care': 'personal-care',
  'magazines': 'magazines',
  'snacks': 'snacks',
  'dry fruits': 'snacks',
  'drinks': 'drinks',
  'beverages': 'drinks',
  'cashmere': 'cashmere',
  'apparel': 'cashmere',
};

const BANNER_BY_CATEGORY: Record<string, string> = {
  confectionery: 'CB',
  sweets: 'MSH',
  cashmere: 'PSH',
  tech: 'MTC',
};

export interface NormaliseResult {
  rows: CSVRow[];
  mappedColumns: [string, string][];
  mappedValues: [string, string][];
  foreign: boolean;
}

function isUrl(value: string): boolean {
  return /^(https?:\/\/|data:image\/)/i.test(value.trim());
}

export function normaliseRows(headers: string[], rows: CSVRow[], mode: BulkMode): NormaliseResult {
  const aliases = HEADER_ALIASES[mode];
  const expected = new Set(BULK_MODES[mode].headers);
  const mappedColumns: [string, string][] = [];
  const rename = new Map<string, string>();

  for (const h of headers) {
    if (!h || expected.has(h)) continue;
    const target = aliases[h.trim().toLowerCase()];
    if (target && target !== h) {
      rename.set(h, target);
      mappedColumns.push([h, target]);
    }
  }

  const seenValues = new Set<string>();
  const mappedValues: [string, string][] = [];

  const out = rows.map(row => {
    const next: CSVRow = {};
    for (const [key, value] of Object.entries(row)) {
      next[rename.get(key) ?? key] = value;
    }

    if (mode === 'products') {
      const raw = (next.category ?? '').trim();
      if (raw && !expected.has(raw)) {
        const mapped = CATEGORY_ALIASES[raw.toLowerCase()];
        if (mapped && mapped !== raw) {
          next.category = mapped;
          const note = `${raw} → ${mapped}`;
          if (!seenValues.has(note)) { seenValues.add(note); mappedValues.push([raw, mapped]); }
        }
      }

      if (!next.brand) {
        const banner = BANNER_BY_CATEGORY[next.category] ?? 'RLY';
        next.brand = banner;
        const note = `brand → ${banner}`;
        if (!seenValues.has(note)) { seenValues.add(note); mappedValues.push(['brand', banner]); }
      }

      if (!next.subtitle && next.product_brand) next.subtitle = next.product_brand;

      if (next.image && !isUrl(next.image)) next.image = '';
    }

    return next;
  });

  return { rows: out, mappedColumns, mappedValues, foreign: mappedColumns.length > 0 };
}
