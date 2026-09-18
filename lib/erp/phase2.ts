// ERP Phase 2 — Buy → Sell data layer.
// Suppliers, Customers, Purchase Orders (+ GRN), Sales Orders (+ Invoices).

// ---------------------------------------------------------------------------
// Common helpers
// ---------------------------------------------------------------------------

function isBrowser() { return typeof window !== 'undefined'; }

function read<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T[]) : fallback;
  } catch { return fallback; }
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
// Suppliers
// ---------------------------------------------------------------------------

export type SupplierType = 'publisher' | 'distributor' | 'wholesaler' | 'author-direct' | 'importer';

export interface Supplier {
  id: string;
  code: string;
  name: string;
  type: SupplierType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  panNumber?: string;
  bankName?: string;
  bankAccount?: string;
  bankIfsc?: string;
  creditDays: number;         // net credit days (30/45/60/90)
  creditLimit: number;        // INR
  currentOutstanding: number; // INR
  defaultDiscount: number;    // % on MRP
  rating: 1 | 2 | 3 | 4 | 5;
  status: 'active' | 'blocked' | 'hold';
  since: string;
}

const SUPPLIER_KEY = 'trs.erp.suppliers.v1';

export const SEED_SUPPLIERS: Supplier[] = [
  { id: 'sup-001', code: 'SUP-NCERT', name: 'NCERT — National Council of Educational Research', type: 'publisher',   contactName: 'Rakesh Sharma',   phone: '+91 11 2696 2580', email: 'sales@ncert.nic.in',      address: 'Sri Aurobindo Marg',      city: 'New Delhi', state: 'Delhi',       pincode: '110016', gstin: '07AABCN0165R1Z3', creditDays: 90, creditLimit: 5000000, currentOutstanding: 1240000, defaultDiscount: 15, rating: 5, status: 'active', since: '2018-04-01' },
  { id: 'sup-002', code: 'SUP-SCHAND', name: 'S. Chand & Company Ltd', type: 'publisher',        contactName: 'Suresh Chand',    phone: '+91 11 2367 2080', email: 'schand@schand.com',       address: '7361 Ram Nagar',           city: 'New Delhi', state: 'Delhi',       pincode: '110055', gstin: '07AABCS1234K1ZP', creditDays: 60, creditLimit: 3500000, currentOutstanding: 892000, defaultDiscount: 22, rating: 4, status: 'active', since: '2019-08-15' },
  { id: 'sup-003', code: 'SUP-OUP', name: 'Oxford University Press India', type: 'importer',       contactName: 'Vaishali Gupta',  phone: '+91 11 4593 5000', email: 'india.orders@oup.com',    address: 'YMCA Library Building',   city: 'New Delhi', state: 'Delhi',       pincode: '110001', gstin: '07AACCO1234L1Z2', creditDays: 45, creditLimit: 4200000, currentOutstanding: 385000, defaultDiscount: 20, rating: 5, status: 'active', since: '2020-01-12' },
  { id: 'sup-004', code: 'SUP-BHBHAWAN', name: 'Bharati Bhawan Publishers', type: 'publisher',      contactName: 'K.P. Roy',        phone: '+91 612 220 8020', email: 'orders@bharatibhawan.in', address: 'Thakurbari Rd',            city: 'Patna',     state: 'Bihar',        pincode: '800004', gstin: '10AABCB2345M1Z8', creditDays: 60, creditLimit: 2200000, currentOutstanding: 148000, defaultDiscount: 28, rating: 4, status: 'active', since: '2019-06-20' },
  { id: 'sup-005', code: 'SUP-RS',    name: 'Rachna Sagar Pvt Ltd', type: 'publisher',            contactName: 'Ashish Agarwal',  phone: '+91 11 4074 5555', email: 'sales@rachnasagar.in',    address: '4583 Ansari Road',         city: 'New Delhi', state: 'Delhi',       pincode: '110002', gstin: '07AABCR3456N1ZS', creditDays: 45, creditLimit: 1800000, currentOutstanding: 620000, defaultDiscount: 25, rating: 4, status: 'active', since: '2021-03-04' },
  { id: 'sup-006', code: 'SUP-FRANK', name: 'Frank Bros. & Co', type: 'publisher',                contactName: 'Sunil Frank',     phone: '+91 11 2325 4441', email: 'frank@frankbros.com',     address: 'B-41 Naraina Ind Area',    city: 'New Delhi', state: 'Delhi',       pincode: '110028', gstin: '07AABCF4567P1ZM', creditDays: 60, creditLimit: 1500000, currentOutstanding: 42000, defaultDiscount: 30, rating: 4, status: 'active', since: '2020-11-11' },
  { id: 'sup-007', code: 'SUP-KTBS', name: 'Karnataka Text Book Society',    type: 'publisher',    contactName: 'Manjunath T.',    phone: '+91 80 2226 8300', email: 'sales@ktbs.kar.nic.in',   address: '#4 100 Ft Ring Road',      city: 'Bengaluru', state: 'Karnataka',   pincode: '560085', gstin: '29AAAGK5678Q1Z4', creditDays: 60, creditLimit: 900000,  currentOutstanding: 210000, defaultDiscount: 10, rating: 3, status: 'active', since: '2022-05-29' },
  { id: 'sup-008', code: 'SUP-CBSPUB', name: 'Cambridge Univ. Press India',   type: 'importer',     contactName: 'Anjali Menon',    phone: '+91 22 4300 7500', email: 'india@cambridge.org',     address: 'Nariman Point',            city: 'Mumbai',    state: 'Maharashtra', pincode: '400021', gstin: '27AACCC6789R1Z5', creditDays: 45, creditLimit: 3800000, currentOutstanding: 1105000, defaultDiscount: 18, rating: 5, status: 'active', since: '2020-09-01' },
  { id: 'sup-009', code: 'SUP-OSWAAL', name: 'Oswaal Books', type: 'publisher',                    contactName: 'Ritesh Singh',    phone: '+91 121 249 2000', email: 'help@oswaalbooks.com',    address: '1/11 Sahitya Kunj',        city: 'Agra',      state: 'Uttar Pradesh',pincode: '282002', gstin: '09AABCO7890S1ZE', creditDays: 45, creditLimit: 2400000, currentOutstanding: 780000, defaultDiscount: 32, rating: 5, status: 'active', since: '2021-08-16' },
  { id: 'sup-010', code: 'SUP-VKGB',   name: 'VK Global Publications', type: 'distributor',        contactName: 'Vinit Kumar',     phone: '+91 11 2743 4522', email: 'vk@vkglobal.in',          address: '15/1 Old Rohtak Rd',       city: 'New Delhi', state: 'Delhi',       pincode: '110035', gstin: '07AABCV8901T1Z3', creditDays: 30, creditLimit: 1200000, currentOutstanding: 0,       defaultDiscount: 35, rating: 3, status: 'active', since: '2023-01-08' },
];

export function loadSuppliers(): Supplier[] { return read(SUPPLIER_KEY, SEED_SUPPLIERS); }
export function saveSupplier(s: Supplier) { upsertRow(SUPPLIER_KEY, SEED_SUPPLIERS, s); }
export function deleteSupplier(id: string) { deleteRow(SUPPLIER_KEY, SEED_SUPPLIERS, id); }

// ---------------------------------------------------------------------------
// Customers
// ---------------------------------------------------------------------------

export type CustomerType = 'school' | 'dealer' | 'distributor' | 'retail' | 'institution';

export interface Customer {
  id: string;
  code: string;
  name: string;
  type: CustomerType;
  contactName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  creditDays: number;
  creditLimit: number;
  currentOutstanding: number;
  discountSlab: number;   // % standard discount
  since: string;
  status: 'active' | 'hold' | 'blocked';
  ordersCount: number;
  ytdRevenue: number;
}

const CUSTOMER_KEY = 'trs.erp.customers.v1';

export const SEED_CUSTOMERS: Customer[] = [
  { id: 'cust-001', code: 'SCH-DPS-DEL', name: 'Delhi Public School — R.K. Puram',       type: 'school',      contactName: 'Meera Kaul',     phone: '+91 11 2467 8800', email: 'purchase@dpsrkp.net',      address: 'Sector 12 R.K. Puram',   city: 'New Delhi', state: 'Delhi',       pincode: '110022', gstin: '07AAATD1234K1ZM', creditDays: 45, creditLimit: 800000,  currentOutstanding: 128000, discountSlab: 22, since: '2019-06-15', status: 'active', ordersCount: 68, ytdRevenue: 1424000 },
  { id: 'cust-002', code: 'SCH-DAV-BLR', name: 'DAV Public School — Bengaluru',           type: 'school',      contactName: 'Ravi Kumar',     phone: '+91 80 2260 4400', email: 'stores@davblr.edu.in',      address: 'JP Nagar 6th Phase',      city: 'Bengaluru', state: 'Karnataka',   pincode: '560078', gstin: '29AABTD5678L1ZX', creditDays: 30, creditLimit: 600000,  currentOutstanding: 82000,  discountSlab: 20, since: '2020-01-22', status: 'active', ordersCount: 52, ytdRevenue: 986000 },
  { id: 'cust-003', code: 'SCH-BVB-MUM', name: 'Bhavans Vidya Mandir — Mumbai',           type: 'school',      contactName: 'Anita Rao',      phone: '+91 22 2413 8800', email: 'bvbmum@bvb.edu.in',        address: 'Andheri West',            city: 'Mumbai',    state: 'Maharashtra', pincode: '400058', gstin: '27AABTB2345N1ZR', creditDays: 45, creditLimit: 700000,  currentOutstanding: 44000,  discountSlab: 24, since: '2019-11-10', status: 'active', ordersCount: 41, ytdRevenue: 852000 },
  { id: 'cust-004', code: 'DLR-CROSS',    name: 'Crossword Bookstores',                   type: 'dealer',      contactName: 'Sanjay Bhatia',  phone: '+91 22 6673 6600', email: 'orders@crossword.in',      address: 'Kemps Corner',            city: 'Mumbai',    state: 'Maharashtra', pincode: '400036', gstin: '27AABCC3456O1ZP', creditDays: 60, creditLimit: 2500000, currentOutstanding: 620000, discountSlab: 40, since: '2018-04-01', status: 'active', ordersCount: 340, ytdRevenue: 6800000 },
  { id: 'cust-005', code: 'DLR-SAPNA',    name: 'Sapna Book House',                       type: 'dealer',      contactName: 'H.K. Nathan',    phone: '+91 80 4111 4000', email: 'wholesale@sapnaonline.com', address: '3rd Main Gandhinagar',   city: 'Bengaluru', state: 'Karnataka',   pincode: '560009', gstin: '29AABCS4567P1ZQ', creditDays: 60, creditLimit: 3000000, currentOutstanding: 820000, discountSlab: 42, since: '2018-08-20', status: 'active', ordersCount: 402, ytdRevenue: 7500000 },
  { id: 'cust-006', code: 'DIS-EDCO',      name: 'Edco Distribution South',                type: 'distributor', contactName: 'Krishnan V.',    phone: '+91 44 2461 8800', email: 'ops@edco-south.in',        address: 'Egmore',                  city: 'Chennai',   state: 'Tamil Nadu',  pincode: '600008', gstin: '33AABCE5678Q1ZR', creditDays: 75, creditLimit: 4000000, currentOutstanding: 1245000, discountSlab: 48, since: '2019-02-11', status: 'active', ordersCount: 240, ytdRevenue: 9800000 },
  { id: 'cust-007', code: 'INS-IIMB',      name: 'IIM Bangalore — Library',                type: 'institution', contactName: 'Dr. S. Rajesh',  phone: '+91 80 2699 3000', email: 'library@iimb.ac.in',       address: 'Bannerghatta Road',      city: 'Bengaluru', state: 'Karnataka',   pincode: '560076', gstin: '29AAATI6789R1ZS', creditDays: 30, creditLimit: 500000,  currentOutstanding: 0,       discountSlab: 25, since: '2020-07-01', status: 'active', ordersCount: 22, ytdRevenue: 340000 },
  { id: 'cust-008', code: 'RTL-WALK',      name: 'Walk-in Retail (Cash)',                  type: 'retail',      contactName: '—',              phone: '—',              email: '—',                          address: '—',                       city: '—',         state: '—',           pincode: '—',      creditDays: 0,  creditLimit: 0,       currentOutstanding: 0,       discountSlab: 0,  since: '2018-04-01', status: 'active', ordersCount: 8420, ytdRevenue: 12400000 },
];

export function loadCustomers(): Customer[] { return read(CUSTOMER_KEY, SEED_CUSTOMERS); }
export function saveCustomer(c: Customer) { upsertRow(CUSTOMER_KEY, SEED_CUSTOMERS, c); }
export function deleteCustomer(id: string) { deleteRow(CUSTOMER_KEY, SEED_CUSTOMERS, id); }

// ---------------------------------------------------------------------------
// Purchase Orders + GRN + Bills
// ---------------------------------------------------------------------------

export interface POLine {
  isbn?: string;
  title: string;
  qty: number;
  unitPrice: number;
  discount: number;   // % on unit price
  gstRate: number;    // %
}

export type POStatus = 'draft' | 'placed' | 'partial' | 'received' | 'billed' | 'closed' | 'cancelled';

export interface PurchaseOrder {
  id: string;
  poNumber: string;
  supplierId: string;
  branchId: string;
  gstinId: string;
  orderDate: string;
  expectedDate: string;
  lines: POLine[];
  subtotal: number;
  gstTotal: number;
  discountTotal: number;
  total: number;
  status: POStatus;
  grnNumber?: string;
  grnDate?: string;
  billNumber?: string;
  billDate?: string;
  billAmount?: number;
  notes?: string;
}

const PO_KEY = 'trs.erp.purchase-orders.v1';

export const SEED_POS: PurchaseOrder[] = [
  {
    id: 'po-001', poNumber: 'PO-2026-0021', supplierId: 'sup-001', branchId: 'br-001', gstinId: 'gst-001',
    orderDate: '2026-08-12', expectedDate: '2026-09-05',
    lines: [
      { isbn: '9789389307481', title: 'NCERT Mathematics — Class X', qty: 500, unitPrice: 195, discount: 15, gstRate: 0 },
      { isbn: '9789390385128', title: 'NCERT Science — Class IX',    qty: 400, unitPrice: 175, discount: 15, gstRate: 0 },
      { isbn: '9789389307856', title: 'NCERT History — Class VIII',   qty: 350, unitPrice: 105, discount: 15, gstRate: 0 },
    ],
    subtotal: 234750, gstTotal: 0, discountTotal: 35213, total: 199538,
    status: 'received', grnNumber: 'GRN-2026-0088', grnDate: '2026-09-02',
    billNumber: 'INV/NCERT/2026/0812', billDate: '2026-09-04', billAmount: 199538,
    notes: 'Full pallet delivery to Delhi HO godown',
  },
  {
    id: 'po-002', poNumber: 'PO-2026-0022', supplierId: 'sup-009', branchId: 'br-002', gstinId: 'gst-002',
    orderDate: '2026-08-18', expectedDate: '2026-09-08',
    lines: [
      { isbn: '9789390385704', title: 'Oswaal CBSE Sample Papers — Mathematics Class 12', qty: 200, unitPrice: 480, discount: 32, gstRate: 0 },
    ],
    subtotal: 96000, gstTotal: 0, discountTotal: 30720, total: 65280,
    status: 'billed', grnNumber: 'GRN-2026-0090', grnDate: '2026-09-06',
    billNumber: 'INV/OS/2026/A114', billDate: '2026-09-07', billAmount: 65280,
  },
  {
    id: 'po-003', poNumber: 'PO-2026-0023', supplierId: 'sup-003', branchId: 'br-003', gstinId: 'gst-003',
    orderDate: '2026-08-25', expectedDate: '2026-09-18',
    lines: [
      { isbn: '9781444191707', title: 'Oxford IB Diploma — Economics', qty: 120, unitPrice: 2299, discount: 20, gstRate: 12 },
      { isbn: '9781107636538', title: 'Cambridge IGCSE Business Studies', qty: 80, unitPrice: 1195, discount: 20, gstRate: 12 },
    ],
    subtotal: 371480, gstTotal: 35662, discountTotal: 74296, total: 332846,
    status: 'partial',
    notes: 'Split shipment: 60% air-freighted, balance sea',
  },
  {
    id: 'po-004', poNumber: 'PO-2026-0024', supplierId: 'sup-002', branchId: 'br-002', gstinId: 'gst-002',
    orderDate: '2026-09-02', expectedDate: '2026-09-22',
    lines: [
      { isbn: '9789385165726', title: 'Wren & Martin — High School English Grammar', qty: 800, unitPrice: 340, discount: 22, gstRate: 0 },
    ],
    subtotal: 272000, gstTotal: 0, discountTotal: 59840, total: 212160,
    status: 'placed',
  },
  {
    id: 'po-005', poNumber: 'PO-2026-0025', supplierId: 'sup-004', branchId: 'br-005', gstinId: 'gst-005',
    orderDate: '2026-09-08', expectedDate: '2026-09-28',
    lines: [
      { isbn: '9789385165719', title: 'RS Aggarwal Mathematics — Class XII', qty: 300, unitPrice: 780, discount: 28, gstRate: 0 },
    ],
    subtotal: 234000, gstTotal: 0, discountTotal: 65520, total: 168480,
    status: 'draft',
    notes: 'Awaiting rate confirmation for the new session',
  },
  {
    id: 'po-006', poNumber: 'PO-2026-0026', supplierId: 'sup-005', branchId: 'br-001', gstinId: 'gst-001',
    orderDate: '2026-09-10', expectedDate: '2026-10-01',
    lines: [
      { isbn: '9789389307511', title: 'Together with Physics — Class XII', qty: 240, unitPrice: 895, discount: 25, gstRate: 0 },
    ],
    subtotal: 214800, gstTotal: 0, discountTotal: 53700, total: 161100,
    status: 'placed',
  },
];

export function loadPOs(): PurchaseOrder[] { return read(PO_KEY, SEED_POS); }
export function savePO(p: PurchaseOrder) { upsertRow(PO_KEY, SEED_POS, p); }
export function deletePO(id: string) { deleteRow(PO_KEY, SEED_POS, id); }

// ---------------------------------------------------------------------------
// Sales Orders / Invoices
// ---------------------------------------------------------------------------

export interface SOLine {
  isbn?: string;
  title: string;
  qty: number;
  unitPrice: number;    // MRP
  discount: number;     // %
  gstRate: number;      // %
}

export type SOStatus = 'quotation' | 'confirmed' | 'picked' | 'invoiced' | 'delivered' | 'paid' | 'cancelled';

export interface SalesOrder {
  id: string;
  soNumber: string;
  invoiceNumber?: string;
  customerId: string;
  branchId: string;
  gstinId: string;
  orderDate: string;
  deliveryDate?: string;
  lines: SOLine[];
  subtotal: number;
  discountTotal: number;
  gstTotal: number;
  total: number;
  amountReceived: number;
  status: SOStatus;
  paymentMethod?: 'credit' | 'cash' | 'upi' | 'bank';
  notes?: string;
}

const SO_KEY = 'trs.erp.sales-orders.v1';

export const SEED_SOS: SalesOrder[] = [
  {
    id: 'so-001', soNumber: 'SO-2026-0311', invoiceNumber: 'INV-DEL-2026-0842',
    customerId: 'cust-001', branchId: 'br-001', gstinId: 'gst-001',
    orderDate: '2026-08-14', deliveryDate: '2026-08-18',
    lines: [
      { isbn: '9789389307481', title: 'NCERT Mathematics — Class X', qty: 240, unitPrice: 195, discount: 22, gstRate: 0 },
      { isbn: '9789390385128', title: 'NCERT Science — Class IX',    qty: 220, unitPrice: 175, discount: 22, gstRate: 0 },
      { isbn: '9789385165993', title: 'Xam Idea Social Science — Class X', qty: 180, unitPrice: 599, discount: 22, gstRate: 0 },
    ],
    subtotal: 193020, discountTotal: 42464, gstTotal: 0, total: 150556,
    amountReceived: 150556, status: 'paid', paymentMethod: 'bank',
  },
  {
    id: 'so-002', soNumber: 'SO-2026-0312', invoiceNumber: 'INV-BLR-2026-0289',
    customerId: 'cust-002', branchId: 'br-002', gstinId: 'gst-002',
    orderDate: '2026-08-22', deliveryDate: '2026-08-25',
    lines: [
      { isbn: '9789390385401', title: 'Karnataka SSLC Kannada Vachana', qty: 300, unitPrice: 95, discount: 20, gstRate: 0 },
      { isbn: '9789390385609', title: 'Selina Concise Biology — Class X', qty: 150, unitPrice: 525, discount: 20, gstRate: 0 },
    ],
    subtotal: 107250, discountTotal: 21450, gstTotal: 0, total: 85800,
    amountReceived: 0, status: 'invoiced', paymentMethod: 'credit',
  },
  {
    id: 'so-003', soNumber: 'SO-2026-0313', invoiceNumber: 'INV-MUM-2026-0175',
    customerId: 'cust-005', branchId: 'br-002', gstinId: 'gst-002',
    orderDate: '2026-08-30', deliveryDate: '2026-09-04',
    lines: [
      { isbn: '9789385165726', title: 'Wren & Martin — High School English Grammar', qty: 400, unitPrice: 340, discount: 42, gstRate: 0 },
      { isbn: '9789389307511', title: 'Together with Physics — Class XII', qty: 200, unitPrice: 895, discount: 42, gstRate: 0 },
      { isbn: '9789389345208', title: 'Frank ICSE Chemistry — Class IX', qty: 240, unitPrice: 465, discount: 42, gstRate: 0 },
    ],
    subtotal: 426800, discountTotal: 179256, gstTotal: 0, total: 247544,
    amountReceived: 100000, status: 'delivered', paymentMethod: 'credit',
  },
  {
    id: 'so-004', soNumber: 'SO-2026-0314',
    customerId: 'cust-004', branchId: 'br-003', gstinId: 'gst-003',
    orderDate: '2026-09-05',
    lines: [
      { isbn: '9789385165993', title: 'Xam Idea Social Science — Class X', qty: 240, unitPrice: 599, discount: 40, gstRate: 0 },
      { isbn: '9789390385704', title: 'Oswaal CBSE Sample Papers Class 12 Math', qty: 200, unitPrice: 480, discount: 40, gstRate: 0 },
    ],
    subtotal: 239760, discountTotal: 95904, gstTotal: 0, total: 143856,
    amountReceived: 0, status: 'confirmed', paymentMethod: 'credit',
  },
  {
    id: 'so-005', soNumber: 'SO-2026-0315',
    customerId: 'cust-006', branchId: 'br-008', gstinId: 'gst-008',
    orderDate: '2026-09-08',
    lines: [
      { isbn: '9781107636538', title: 'Cambridge IGCSE Business Studies', qty: 80, unitPrice: 1195, discount: 48, gstRate: 12 },
      { isbn: '9781444191707', title: 'Oxford IB Diploma — Economics',   qty: 60, unitPrice: 2299, discount: 48, gstRate: 12 },
    ],
    subtotal: 233540, discountTotal: 112099, gstTotal: 14573, total: 136014,
    amountReceived: 0, status: 'quotation', paymentMethod: 'credit',
    notes: 'Awaiting PO from customer',
  },
  {
    id: 'so-006', soNumber: 'SO-2026-0316', invoiceNumber: 'INV-COK-2026-0088',
    customerId: 'cust-003', branchId: 'br-005', gstinId: 'gst-005',
    orderDate: '2026-09-12', deliveryDate: '2026-09-14',
    lines: [
      { isbn: '9789385165849', title: 'Manorama Yearbook 2026', qty: 400, unitPrice: 550, discount: 24, gstRate: 12 },
    ],
    subtotal: 220000, discountTotal: 52800, gstTotal: 20064, total: 187264,
    amountReceived: 187264, status: 'paid', paymentMethod: 'bank',
  },
];

export function loadSOs(): SalesOrder[] { return read(SO_KEY, SEED_SOS); }
export function saveSO(s: SalesOrder) { upsertRow(SO_KEY, SEED_SOS, s); }
export function deleteSO(id: string) { deleteRow(SO_KEY, SEED_SOS, id); }
