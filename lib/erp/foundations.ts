// ERP Phase 1 — Foundations data layer.
// Branches, warehouses, GST registrations, and the extended book master.
// All persisted in localStorage; each module ships with deterministic seed
// data so screens are populated immediately.

// ---------------------------------------------------------------------------
// Common
// ---------------------------------------------------------------------------

export type Status = 'active' | 'inactive';

function isBrowser() {
  return typeof window !== 'undefined';
}

function read<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser()) return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T[];
  } catch {
    return fallback;
  }
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
// Branches
// ---------------------------------------------------------------------------

export type BranchType = 'HO' | 'branch' | 'sub-branch';

export interface Branch {
  id: string;
  code: string;
  name: string;
  type: BranchType;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstin?: string;
  manager: string;
  phone: string;
  email: string;
  status: Status;
  createdOn: string;
}

const BRANCH_KEY = 'trs.erp.branches.v1';

export const SEED_BRANCHES: Branch[] = [
  { id: 'br-001', code: 'BR-DEL-HO', name: 'Delhi Head Office', type: 'HO', address: 'A-14, Okhla Phase II', city: 'New Delhi', state: 'Delhi', pincode: '110020', gstin: '07AABCT1332L1ZK', manager: 'Dhananjay Singh', phone: '+91 11 4000 8100', email: 'delhi.ho@trs.co.in', status: 'active', createdOn: '2022-04-01' },
  { id: 'br-002', code: 'BR-BLR-01', name: 'Bangalore South Branch', type: 'branch', address: 'Wing A, KIAL Business Park', city: 'Bengaluru', state: 'Karnataka', pincode: '560300', gstin: '29AABCT1332L1Z9', manager: 'Abhisek Verma', phone: '+91 80 4900 2010', email: 'blr.branch@trs.co.in', status: 'active', createdOn: '2022-08-15' },
  { id: 'br-003', code: 'BR-BOM-01', name: 'Mumbai West Branch', type: 'branch', address: 'CST Airport Road, Andheri East', city: 'Mumbai', state: 'Maharashtra', pincode: '400099', gstin: '27AABCT1332L1ZI', manager: 'S. Iyer', phone: '+91 22 4900 6000', email: 'mumbai@trs.co.in', status: 'active', createdOn: '2023-01-04' },
  { id: 'br-004', code: 'BR-HYD-01', name: 'Hyderabad Central Branch', type: 'branch', address: 'GMR Aerocity, RGIA', city: 'Hyderabad', state: 'Telangana', pincode: '500409', gstin: '36AABCT1332L1ZH', manager: 'Vikram Rao', phone: '+91 40 4900 3200', email: 'hyd@trs.co.in', status: 'active', createdOn: '2023-05-22' },
  { id: 'br-005', code: 'BR-COK-01', name: 'Kochi Branch', type: 'branch', address: 'CIAL Terminal 3', city: 'Kochi', state: 'Kerala', pincode: '683111', gstin: '32AABCT1332L1ZE', manager: 'K. Nair', phone: '+91 484 490 1010', email: 'kochi@trs.co.in', status: 'active', createdOn: '2023-11-18' },
  { id: 'br-006', code: 'BR-GOA-01', name: 'Goa MOPA Branch', type: 'branch', address: 'Manohar Intl Airport', city: 'Goa', state: 'Goa', pincode: '403722', gstin: '30AABCT1332L1ZG', manager: 'R. Mehta', phone: '+91 832 490 4400', email: 'goa@trs.co.in', status: 'active', createdOn: '2024-01-11' },
  { id: 'br-007', code: 'BR-CCU-01', name: 'Kolkata Sub-Branch', type: 'sub-branch', address: 'NSCBI Airport T2', city: 'Kolkata', state: 'West Bengal', pincode: '700052', gstin: '19AABCT1332L1ZK', manager: 'B. Chatterjee', phone: '+91 33 4900 8080', email: 'kolkata@trs.co.in', status: 'active', createdOn: '2024-06-30' },
  { id: 'br-008', code: 'BR-CHN-01', name: 'Chennai Landside Branch', type: 'branch', address: 'MAA T4 Concourse', city: 'Chennai', state: 'Tamil Nadu', pincode: '600027', gstin: '33AABCT1332L1ZC', manager: 'C. Pillai', phone: '+91 44 4900 2727', email: 'chennai@trs.co.in', status: 'active', createdOn: '2024-08-05' },
];

export function loadBranches(): Branch[] { return read(BRANCH_KEY, SEED_BRANCHES); }
export function saveBranch(b: Branch) { upsertRow(BRANCH_KEY, SEED_BRANCHES, b); }
export function deleteBranch(id: string) { deleteRow(BRANCH_KEY, SEED_BRANCHES, id); }

// ---------------------------------------------------------------------------
// Warehouses
// ---------------------------------------------------------------------------

export type WarehouseType = 'branch' | 'godown' | 'exhibition' | 'in-transit';

export interface Warehouse {
  id: string;
  code: string;
  name: string;
  type: WarehouseType;
  branchId: string;
  address: string;
  capacitySqft?: number;
  capacityTitles?: number;
  manager: string;
  phone?: string;
  status: Status | 'temporary';
  gstin?: string;
  createdOn: string;
  notes?: string;
}

const WAREHOUSE_KEY = 'trs.erp.warehouses.v1';

export const SEED_WAREHOUSES: Warehouse[] = [
  { id: 'wh-001', code: 'WH-DEL-HO', name: 'Delhi HO Godown', type: 'godown', branchId: 'br-001', address: 'A-14 Basement, Okhla Phase II', capacitySqft: 12000, capacityTitles: 45000, manager: 'Amit Kumar', phone: '+91 98110 40001', status: 'active', gstin: '07AABCT1332L1ZK', createdOn: '2022-04-01' },
  { id: 'wh-002', code: 'WH-DEL-BR', name: 'Delhi Branch Store', type: 'branch', branchId: 'br-001', address: 'A-14 Ground Floor', capacitySqft: 1800, capacityTitles: 6500, manager: 'S. Iyer', status: 'active', gstin: '07AABCT1332L1ZK', createdOn: '2022-04-01' },
  { id: 'wh-003', code: 'WH-BLR-GD', name: 'Bengaluru Central Godown', type: 'godown', branchId: 'br-002', address: 'Whitefield Warehouse Cluster', capacitySqft: 18500, capacityTitles: 62000, manager: 'Abhisek Verma', phone: '+91 96400 22102', status: 'active', gstin: '29AABCT1332L1Z9', createdOn: '2022-09-04' },
  { id: 'wh-004', code: 'WH-BLR-T2', name: 'BLR T2 Store', type: 'branch', branchId: 'br-002', address: 'KIA T2, Airside A', capacitySqft: 900, capacityTitles: 2400, manager: 'Nikita Sarang', status: 'active', gstin: '29AABCT1332L1Z9', createdOn: '2023-01-20' },
  { id: 'wh-005', code: 'WH-BOM-GD', name: 'Mumbai Central Godown', type: 'godown', branchId: 'br-003', address: 'Bhiwandi Yard, Bhiwandi-Nashik Rd', capacitySqft: 22000, capacityTitles: 80000, manager: 'Sunil Sharma', status: 'active', gstin: '27AABCT1332L1ZI', createdOn: '2023-02-10' },
  { id: 'wh-006', code: 'WH-BOM-T2', name: 'Mumbai T2 Store', type: 'branch', branchId: 'br-003', address: 'CSMIA T2 Concourse D', capacitySqft: 1200, capacityTitles: 3800, manager: 'M. Krishnan', status: 'active', gstin: '27AABCT1332L1ZI', createdOn: '2023-03-01' },
  { id: 'wh-007', code: 'WH-HYD-GD', name: 'Hyderabad Godown', type: 'godown', branchId: 'br-004', address: 'Shamshabad Logistics Hub', capacitySqft: 15000, capacityTitles: 50000, manager: 'Vikram Rao', status: 'active', gstin: '36AABCT1332L1ZH', createdOn: '2023-06-15' },
  { id: 'wh-008', code: 'WH-COK-GD', name: 'Kochi Godown', type: 'godown', branchId: 'br-005', address: 'Angamaly Industrial Corridor', capacitySqft: 8500, capacityTitles: 28000, manager: 'K. Nair', status: 'active', gstin: '32AABCT1332L1ZE', createdOn: '2023-12-01' },
  { id: 'wh-009', code: 'WH-EX-CBSE', name: 'Delhi Pragati Maidan Exhibition', type: 'exhibition', branchId: 'br-001', address: 'Hall 4, Pragati Maidan (event-based)', capacityTitles: 5000, manager: 'Shubham Jaiswal', status: 'temporary', gstin: '07AABCT1332L1ZK', createdOn: '2026-08-12', notes: 'CBSE Book Fair — Oct 12–15, 2026' },
  { id: 'wh-010', code: 'WH-EX-BLRK12', name: 'Bengaluru K12 Expo Booth', type: 'exhibition', branchId: 'br-002', address: 'BIEC Hall 3', capacityTitles: 2000, manager: 'Nikita Sarang', status: 'temporary', gstin: '29AABCT1332L1Z9', createdOn: '2026-09-01', notes: 'K12 Educators Expo — Sep 22–24' },
  { id: 'wh-011', code: 'WH-TRN-N1', name: 'North Transit Van #1', type: 'in-transit', branchId: 'br-001', address: 'Route: DEL → CHD → LKN', manager: 'V. Rao', status: 'active', createdOn: '2024-11-04' },
  { id: 'wh-012', code: 'WH-CCU-GD', name: 'Kolkata Sub-Branch Godown', type: 'godown', branchId: 'br-007', address: 'Kaikhali Depot', capacitySqft: 6500, capacityTitles: 22000, manager: 'B. Chatterjee', status: 'active', gstin: '19AABCT1332L1ZK', createdOn: '2024-07-11' },
];

export function loadWarehouses(): Warehouse[] { return read(WAREHOUSE_KEY, SEED_WAREHOUSES); }
export function saveWarehouse(w: Warehouse) { upsertRow(WAREHOUSE_KEY, SEED_WAREHOUSES, w); }
export function deleteWarehouse(id: string) { deleteRow(WAREHOUSE_KEY, SEED_WAREHOUSES, id); }

// ---------------------------------------------------------------------------
// GST registrations (per state, all under the same PAN / firm)
// ---------------------------------------------------------------------------

export interface GSTRegistration {
  id: string;
  gstin: string;
  legalName: string;
  tradeName?: string;
  state: string;
  stateCode: string;
  address: string;
  pincode: string;
  registrationDate: string;
  compositeScheme: boolean;
  ewaybillEnabled: boolean;
  einvoiceEnabled: boolean;
  status: 'active' | 'cancelled' | 'suspended';
  turnoverBucket: 'below-5cr' | '5-20cr' | '20-100cr' | 'above-100cr';
}

const GST_KEY = 'trs.erp.gst.v1';

export const SEED_GST: GSTRegistration[] = [
  { id: 'gst-001', gstin: '07AABCT1332L1ZK', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Delhi', state: 'Delhi', stateCode: '07', address: 'A-14, Okhla Phase II, New Delhi', pincode: '110020', registrationDate: '2022-04-01', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: 'above-100cr' },
  { id: 'gst-002', gstin: '29AABCT1332L1Z9', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Karnataka', state: 'Karnataka', stateCode: '29', address: 'KIAL Business Park, Bengaluru', pincode: '560300', registrationDate: '2022-08-15', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '20-100cr' },
  { id: 'gst-003', gstin: '27AABCT1332L1ZI', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Maharashtra', state: 'Maharashtra', stateCode: '27', address: 'CST Airport Road, Andheri East, Mumbai', pincode: '400099', registrationDate: '2023-01-04', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '20-100cr' },
  { id: 'gst-004', gstin: '36AABCT1332L1ZH', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Telangana', state: 'Telangana', stateCode: '36', address: 'GMR Aerocity, RGIA, Hyderabad', pincode: '500409', registrationDate: '2023-05-22', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '5-20cr' },
  { id: 'gst-005', gstin: '32AABCT1332L1ZE', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Kerala', state: 'Kerala', stateCode: '32', address: 'CIAL Terminal 3, Kochi', pincode: '683111', registrationDate: '2023-11-18', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '5-20cr' },
  { id: 'gst-006', gstin: '30AABCT1332L1ZG', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Goa', state: 'Goa', stateCode: '30', address: 'Manohar Intl Airport, Mopa', pincode: '403722', registrationDate: '2024-01-11', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '5-20cr' },
  { id: 'gst-007', gstin: '19AABCT1332L1ZK', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS West Bengal', state: 'West Bengal', stateCode: '19', address: 'NSCBI Airport T2, Kolkata', pincode: '700052', registrationDate: '2024-06-30', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '5-20cr' },
  { id: 'gst-008', gstin: '33AABCT1332L1ZC', legalName: 'Travel Retail Services Pvt Ltd', tradeName: 'TRS Tamil Nadu', state: 'Tamil Nadu', stateCode: '33', address: 'MAA T4 Concourse', pincode: '600027', registrationDate: '2024-08-05', compositeScheme: false, ewaybillEnabled: true, einvoiceEnabled: true, status: 'active', turnoverBucket: '5-20cr' },
];

export function loadGST(): GSTRegistration[] { return read(GST_KEY, SEED_GST); }
export function saveGST(row: GSTRegistration) { upsertRow(GST_KEY, SEED_GST, row); }
export function deleteGST(id: string) { deleteRow(GST_KEY, SEED_GST, id); }

// ---------------------------------------------------------------------------
// Book master — extended for publisher/distributor domain
// ---------------------------------------------------------------------------

export type Board = 'CBSE' | 'ICSE' | 'IB' | 'IGCSE' | 'State Board' | 'UGC' | 'General';
export type Binding = 'paperback' | 'hardcover' | 'spiral' | 'ebook';

export interface BookMaster {
  id: string;
  isbn: string;
  barcode: string;
  title: string;
  author?: string;
  board: Board;
  class: string;
  subject: string;
  edition: string;
  academicSession: string;
  publisher: string;
  pages?: number;
  language: string;
  binding: Binding;
  mrp: number;
  landedCost?: number;
  gstRate: number;
  hsnCode: string;
  status: 'active' | 'discontinued' | 'oos';
  createdOn: string;
}

const BOOKMASTER_KEY = 'trs.erp.books.v1';

export const SEED_BOOK_MASTER: BookMaster[] = [
  { id: 'bkm-001', isbn: '9789389307481', barcode: '8901234567891', title: 'NCERT Mathematics — Class X', board: 'CBSE',        class: '10',  subject: 'Mathematics', edition: '2026',      academicSession: '2026-2027', publisher: 'NCERT',        pages: 356, language: 'English', binding: 'paperback', mrp: 195,  landedCost: 108, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-04-01' },
  { id: 'bkm-002', isbn: '9789390385128', barcode: '8901234567892', title: 'NCERT Science — Class IX',      board: 'CBSE',        class: '9',   subject: 'Science',     edition: '2026',      academicSession: '2026-2027', publisher: 'NCERT',        pages: 288, language: 'English', binding: 'paperback', mrp: 175,  landedCost: 97,  gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-04-01' },
  { id: 'bkm-003', isbn: '9789385165719', barcode: '8901234567893', title: 'RS Aggarwal Mathematics — Class XII', board: 'CBSE',   class: '12',  subject: 'Mathematics', edition: '3rd',       academicSession: '2026-2027', publisher: 'Bharati Bhawan', pages: 892, language: 'English', binding: 'paperback', mrp: 780,  landedCost: 468, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-05-10' },
  { id: 'bkm-004', isbn: '9789385165726', barcode: '8901234567894', title: 'Wren & Martin — High School English Grammar', board: 'General', class: 'All', subject: 'English', edition: 'Revised 2026', academicSession: '2026-2027', publisher: 'S. Chand',    pages: 620, language: 'English', binding: 'paperback', mrp: 340,  landedCost: 204, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-04-20', author: 'Wren, Martin' },
  { id: 'bkm-005', isbn: '9789389307511', barcode: '8901234567895', title: 'Together with Physics — Class XII', board: 'CBSE',   class: '12',  subject: 'Physics',     edition: '2026',      academicSession: '2026-2027', publisher: 'Rachna Sagar', pages: 720, language: 'English', binding: 'paperback', mrp: 895,  landedCost: 537, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-04-22' },
  { id: 'bkm-006', isbn: '9789389345208', barcode: '8901234567896', title: 'Frank ICSE Chemistry — Class IX', board: 'ICSE',        class: '9',   subject: 'Chemistry',   edition: '2026',      academicSession: '2026-2027', publisher: 'Frank Bros.',  pages: 412, language: 'English', binding: 'paperback', mrp: 465,  landedCost: 279, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-05-04' },
  { id: 'bkm-007', isbn: '9781107636538', barcode: '8901234567897', title: 'Cambridge IGCSE Business Studies', board: 'IGCSE',   class: '9-10', subject: 'Business',   edition: '4th',       academicSession: '2026-2027', publisher: 'Cambridge Univ. Press', pages: 348, language: 'English', binding: 'paperback', mrp: 1195, landedCost: 717, gstRate: 12, hsnCode: '4901', status: 'active', createdOn: '2026-06-11', author: 'Karen Borrington, Peter Stimpson' },
  { id: 'bkm-008', isbn: '9781444191707', barcode: '8901234567898', title: 'Oxford IB Diploma — Economics',   board: 'IB',          class: '11-12', subject: 'Economics', edition: '2nd',       academicSession: '2026-2027', publisher: 'Oxford Univ. Press',    pages: 520, language: 'English', binding: 'paperback', mrp: 2299, landedCost: 1380,gstRate: 12, hsnCode: '4901', status: 'active', createdOn: '2026-06-18', author: 'Jocelyn Blink, Ian Dorton' },
  { id: 'bkm-009', isbn: '9789390385401', barcode: '8901234567899', title: 'Karnataka SSLC Kannada Vachana',  board: 'State Board', class: '10',  subject: 'Kannada',     edition: '2026',      academicSession: '2026-2027', publisher: 'KTBS',         pages: 210, language: 'Kannada', binding: 'paperback', mrp: 95,   landedCost: 55,  gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-05-01' },
  { id: 'bkm-010', isbn: '9789385165849', barcode: '8901234567900', title: 'Manorama Yearbook 2026',           board: 'UGC',         class: 'Reference', subject: 'GK',   edition: '2026',      academicSession: '2026-2027', publisher: 'Malayala Manorama',   pages: 928, language: 'English', binding: 'hardcover', mrp: 550, landedCost: 330, gstRate: 12, hsnCode: '4901', status: 'active', createdOn: '2026-05-25' },
  { id: 'bkm-011', isbn: '9789389345307', barcode: '8901234567901', title: 'Lucent GK 2026',                   board: 'UGC',         class: 'Reference', subject: 'GK',   edition: '2026',      academicSession: '2026-2027', publisher: 'Lucent',       pages: 780, language: 'English', binding: 'paperback', mrp: 320,  landedCost: 192, gstRate: 12, hsnCode: '4901', status: 'active', createdOn: '2026-05-25' },
  { id: 'bkm-012', isbn: '9789390385609', barcode: '8901234567902', title: 'Selina Concise Biology — Class X', board: 'ICSE',        class: '10',  subject: 'Biology',     edition: '2026',      academicSession: '2026-2027', publisher: 'Selina',       pages: 480, language: 'English', binding: 'paperback', mrp: 525,  landedCost: 315, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-05-30' },
  { id: 'bkm-013', isbn: '9789389307856', barcode: '8901234567903', title: 'NCERT History — Class VIII (Our Pasts III)', board: 'CBSE', class: '8', subject: 'History', edition: '2026',      academicSession: '2026-2027', publisher: 'NCERT',        pages: 220, language: 'English', binding: 'paperback', mrp: 105,  landedCost: 58,  gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-04-08' },
  { id: 'bkm-014', isbn: '9789385165993', barcode: '8901234567904', title: 'Xam Idea Social Science — Class X',board: 'CBSE',        class: '10',  subject: 'Social',      edition: '2026',      academicSession: '2026-2027', publisher: 'VK Global',    pages: 660, language: 'English', binding: 'paperback', mrp: 599,  landedCost: 359, gstRate: 0,  hsnCode: '4901', status: 'active', createdOn: '2026-06-01' },
  { id: 'bkm-015', isbn: '9789390385704', barcode: '8901234567905', title: 'Oswaal CBSE Sample Papers Mathematics Class 12', board: 'CBSE', class: '12', subject: 'Mathematics', edition: '2026 revised', academicSession: '2026-2027', publisher: 'Oswaal Books', pages: 420, language: 'English', binding: 'paperback', mrp: 480, landedCost: 288, gstRate: 0, hsnCode: '4901', status: 'active', createdOn: '2026-06-14' },
  { id: 'bkm-016', isbn: '9788131529103', barcode: '8901234567906', title: 'Introduction to Algorithms',        board: 'UGC',         class: 'UG',  subject: 'Computer Sc', edition: '4th',       academicSession: '2026-2027', publisher: 'MIT / PHI',    pages: 1312, language: 'English', binding: 'hardcover', mrp: 1899, landedCost: 1139, gstRate: 12, hsnCode: '4901', status: 'active', createdOn: '2026-07-02', author: 'Cormen, Leiserson, Rivest, Stein' },
];

export function loadBookMaster(): BookMaster[] { return read(BOOKMASTER_KEY, SEED_BOOK_MASTER); }
export function saveBookMaster(b: BookMaster) { upsertRow(BOOKMASTER_KEY, SEED_BOOK_MASTER, b); }
export function deleteBookMaster(id: string) { deleteRow(BOOKMASTER_KEY, SEED_BOOK_MASTER, id); }

export const BOARDS: Board[] = ['CBSE', 'ICSE', 'IB', 'IGCSE', 'State Board', 'UGC', 'General'];
export const CLASSES = ['Pre-KG', 'LKG', 'UKG', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12', 'UG', 'PG', 'Reference', 'All'];
export const SUBJECTS = ['Mathematics', 'Science', 'Physics', 'Chemistry', 'Biology', 'English', 'Hindi', 'Kannada', 'Tamil', 'Marathi', 'Bengali', 'Social', 'History', 'Geography', 'Economics', 'Business', 'Accountancy', 'Computer Sc', 'GK'];
export const LANGUAGES = ['English', 'Hindi', 'Kannada', 'Tamil', 'Marathi', 'Bengali', 'Malayalam', 'Telugu', 'Gujarati'];
export const PUBLISHERS = ['NCERT', 'Bharati Bhawan', 'S. Chand', 'Rachna Sagar', 'Frank Bros.', 'Cambridge Univ. Press', 'Oxford Univ. Press', 'KTBS', 'Malayala Manorama', 'Lucent', 'Selina', 'VK Global', 'Oswaal Books', 'MIT / PHI', 'Arihant', 'Educart'];

// ---------------------------------------------------------------------------
// ERP module registry — used by the ERP shell sidebar
// ---------------------------------------------------------------------------

export interface ERPModule {
  key: string;
  label: string;
  href: string;
  icon: string;
  status: 'live' | 'coming-soon';
  phase: 1 | 2 | 3 | 4 | 5 | 6;
  section: string;
}

export const ERP_MODULES: ERPModule[] = [
  { key: 'dashboard',     label: 'Dashboard',           href: '/admin/erp',                     icon: 'LayoutDashboard', status: 'live',        phase: 1, section: 'Overview' },
  { key: 'branches',      label: 'Branches',            href: '/admin/erp/config/branches',     icon: 'Building2',       status: 'live',        phase: 1, section: 'Foundations' },
  { key: 'warehouses',    label: 'Warehouses',          href: '/admin/erp/config/warehouses',   icon: 'Warehouse',       status: 'live',        phase: 1, section: 'Foundations' },
  { key: 'gst',           label: 'GST Registrations',   href: '/admin/erp/config/gst',          icon: 'Landmark',        status: 'live',        phase: 1, section: 'Foundations' },
  { key: 'books',         label: 'Book Master',         href: '/admin/erp/books',               icon: 'BookOpenText',    status: 'live',        phase: 1, section: 'Foundations' },
  { key: 'purchase',      label: 'Purchase Orders',     href: '/admin/erp/purchase',            icon: 'ShoppingCart',    status: 'live',        phase: 2, section: 'Buy → Sell' },
  { key: 'sales',         label: 'Sales & Invoicing',   href: '/admin/erp/sales',               icon: 'Receipt',         status: 'live',        phase: 2, section: 'Buy → Sell' },
  { key: 'customers',     label: 'Customers',           href: '/admin/erp/sales/customers',     icon: 'Users',           status: 'live',        phase: 2, section: 'Buy → Sell' },
  { key: 'suppliers',     label: 'Suppliers',           href: '/admin/erp/purchase/suppliers',  icon: 'Truck',           status: 'live',        phase: 2, section: 'Buy → Sell' },
  { key: 'accounts',      label: 'Accounting',          href: '/admin/erp/accounts',            icon: 'BookMinus',       status: 'coming-soon', phase: 3, section: 'Finance' },
  { key: 'gst-returns',   label: 'GST Returns',         href: '/admin/erp/accounts/gst',        icon: 'FileText',        status: 'coming-soon', phase: 3, section: 'Finance' },
  { key: 'bank-recon',    label: 'Bank Reconciliation', href: '/admin/erp/accounts/bank-recon', icon: 'Banknote',        status: 'coming-soon', phase: 3, section: 'Finance' },
  { key: 'exhibitions',   label: 'Exhibitions & Fairs', href: '/admin/erp/exhibitions',         icon: 'Tent',            status: 'coming-soon', phase: 4, section: 'Field Ops' },
  { key: 'offline-pos',   label: 'Offline Billing App', href: '/admin/erp/offline',             icon: 'Wifi',            status: 'coming-soon', phase: 4, section: 'Field Ops' },
  { key: 'crm',           label: 'CRM & Leads',         href: '/admin/erp/crm',                 icon: 'HeartHandshake',  status: 'coming-soon', phase: 4, section: 'Field Ops' },
  { key: 'reports',       label: 'Reports & Dashboards',href: '/admin/erp/reports',             icon: 'BarChart3',       status: 'coming-soon', phase: 5, section: 'Insight' },
  { key: 'hr',            label: 'HR & Attendance',     href: '/admin/erp/hr',                  icon: 'UserRound',       status: 'coming-soon', phase: 5, section: 'Insight' },
  { key: 'tally',         label: 'Tally Migration',     href: '/admin/erp/migration/tally',     icon: 'FileInput',       status: 'coming-soon', phase: 6, section: 'Admin' },
  { key: 'security',      label: 'Security & Access',   href: '/admin/erp/security',            icon: 'Lock',            status: 'coming-soon', phase: 6, section: 'Admin' },
  { key: 'system',        label: 'System Settings',     href: '/admin/erp/system',              icon: 'Settings2',       status: 'coming-soon', phase: 6, section: 'Admin' },
];
