import { readList, writeList, upsertRow as upsertStore, deleteRow as deleteStore, readSingle, writeSingle } from './store';

// ERP Phase 4 — Field Ops data layer.
// Exhibitions & Fairs, Offline Billing App, CRM & Leads.



// ---------------------------------------------------------------------------
// Exhibitions & Fairs
// ---------------------------------------------------------------------------

export type ExhibitionStatus = 'draft' | 'approved' | 'live' | 'closed' | 'settled';

export interface ExhibitionLine {
  isbn?: string;
  title: string;
  qtyIssued: number;
  qtySold: number;
  qtyReturned: number;
  qtyShort: number;
  qtyDamaged: number;
  unitPrice: number;
  discount: number;
}

export interface ExhibitionEvent {
  id: string;
  code: string;
  name: string;
  venue: string;
  city: string;
  state: string;
  startDate: string;
  endDate: string;
  branchId: string;
  gstinId: string;
  responsibleStaff: string[];
  approvalNote?: string;
  approvalDate?: string;
  settlementInvoice?: string;
  settlementDate?: string;
  status: ExhibitionStatus;
  lines: ExhibitionLine[];
  totalIssuedValue: number;
  totalSoldValue: number;
  totalSoldQty: number;
  totalExpenses: number;
  netProfit: number;
  notes?: string;
}

const EX_KEY = 'trs.erp.exhibitions.v1';

export const SEED_EXHIBITIONS: ExhibitionEvent[] = [
  {
    id: 'ex-001', code: 'EX-CBSE-DEL-2026',
    name: 'CBSE Book Fair — Pragati Maidan',
    venue: 'Hall 4, Pragati Maidan', city: 'New Delhi', state: 'Delhi',
    startDate: '2026-10-12', endDate: '2026-10-15',
    branchId: 'br-001', gstinId: 'gst-001',
    responsibleStaff: ['Shubham Jaiswal', 'Nikita Sarang'],
    approvalNote: 'AIN-2026-041', approvalDate: '2026-09-28',
    status: 'approved',
    lines: [
      { isbn: '9789389307481', title: 'NCERT Mathematics — Class X', qtyIssued: 400, qtySold: 0, qtyReturned: 0, qtyShort: 0, qtyDamaged: 0, unitPrice: 195, discount: 20 },
      { isbn: '9789390385128', title: 'NCERT Science — Class IX',    qtyIssued: 350, qtySold: 0, qtyReturned: 0, qtyShort: 0, qtyDamaged: 0, unitPrice: 175, discount: 20 },
      { isbn: '9789385165993', title: 'Xam Idea Social Science — Class X', qtyIssued: 300, qtySold: 0, qtyReturned: 0, qtyShort: 0, qtyDamaged: 0, unitPrice: 599, discount: 25 },
    ],
    totalIssuedValue: 322950, totalSoldValue: 0, totalSoldQty: 0, totalExpenses: 42000, netProfit: 0,
    notes: 'Fabricate booth by Oct 10 · dedicated bill counter on-site',
  },
  {
    id: 'ex-002', code: 'EX-K12-BLR-2026',
    name: 'K12 Educators Expo — BIEC',
    venue: 'BIEC Hall 3', city: 'Bengaluru', state: 'Karnataka',
    startDate: '2026-09-22', endDate: '2026-09-24',
    branchId: 'br-002', gstinId: 'gst-002',
    responsibleStaff: ['Abhisek Verma', 'Zoya Malik'],
    approvalNote: 'AIN-2026-038', approvalDate: '2026-09-05',
    status: 'live',
    lines: [
      { isbn: '9789390385401', title: 'Karnataka SSLC Kannada Vachana', qtyIssued: 500, qtySold: 285, qtyReturned: 0, qtyShort: 0, qtyDamaged: 4, unitPrice: 95, discount: 15 },
      { isbn: '9789390385609', title: 'Selina Concise Biology — Class X', qtyIssued: 300, qtySold: 128, qtyReturned: 0, qtyShort: 2, qtyDamaged: 3, unitPrice: 525, discount: 20 },
      { isbn: '9789385165993', title: 'Xam Idea Social Science — Class X', qtyIssued: 240, qtySold: 92, qtyReturned: 0, qtyShort: 0, qtyDamaged: 1, unitPrice: 599, discount: 25 },
    ],
    totalIssuedValue: 358100, totalSoldValue: 130450, totalSoldQty: 505, totalExpenses: 68500, netProfit: 0,
  },
  {
    id: 'ex-003', code: 'EX-KOL-2026',
    name: 'Kolkata Boi Mela — Pre-order Booth',
    venue: 'Central Park, Salt Lake', city: 'Kolkata', state: 'West Bengal',
    startDate: '2026-08-12', endDate: '2026-08-18',
    branchId: 'br-007', gstinId: 'gst-007',
    responsibleStaff: ['B. Chatterjee'],
    approvalNote: 'AIN-2026-029', approvalDate: '2026-08-02',
    settlementInvoice: 'INV-CCU-2026-EX-011', settlementDate: '2026-08-22',
    status: 'settled',
    lines: [
      { isbn: '9789385165726', title: 'Wren & Martin — English Grammar', qtyIssued: 600, qtySold: 480, qtyReturned: 108, qtyShort: 0, qtyDamaged: 12, unitPrice: 340, discount: 30 },
      { isbn: '9789389307856', title: 'NCERT History — Class VIII', qtyIssued: 400, qtySold: 340, qtyReturned: 55, qtyShort: 0, qtyDamaged: 5, unitPrice: 105, discount: 15 },
      { isbn: '9789385165849', title: 'Manorama Yearbook 2026', qtyIssued: 200, qtySold: 172, qtyReturned: 24, qtyShort: 0, qtyDamaged: 4, unitPrice: 550, discount: 25 },
    ],
    totalIssuedValue: 356000, totalSoldValue: 218380, totalSoldQty: 992, totalExpenses: 84000, netProfit: 32380,
    notes: 'Damage claim raised — insurance file #DC-2026-041',
  },
  {
    id: 'ex-004', code: 'EX-CHN-2026',
    name: 'Chennai State School Buying Fair',
    venue: 'Chennai Trade Centre', city: 'Chennai', state: 'Tamil Nadu',
    startDate: '2026-10-28', endDate: '2026-10-31',
    branchId: 'br-008', gstinId: 'gst-008',
    responsibleStaff: ['C. Pillai'],
    status: 'draft',
    lines: [],
    totalIssuedValue: 0, totalSoldValue: 0, totalSoldQty: 0, totalExpenses: 0, netProfit: 0,
    notes: 'Awaiting supplier confirmation for Tamil textbook stock',
  },
  {
    id: 'ex-005', code: 'EX-BBS-2026',
    name: 'Bhubaneshwar Odia Book Week',
    venue: 'IDCO Exhibition Grounds', city: 'Bhubaneshwar', state: 'Odisha',
    startDate: '2026-11-08', endDate: '2026-11-12',
    branchId: 'br-005', gstinId: 'gst-005',
    responsibleStaff: ['R. Mehta'],
    status: 'draft',
    lines: [],
    totalIssuedValue: 0, totalSoldValue: 0, totalSoldQty: 0, totalExpenses: 0, netProfit: 0,
  },
];

export async function loadExhibitions(): Promise<ExhibitionEvent[]> { return readList<ExhibitionEvent>(EX_KEY, SEED_EXHIBITIONS); }
export async function saveExhibition(e: ExhibitionEvent): Promise<void> { await upsertStore<ExhibitionEvent>(EX_KEY, SEED_EXHIBITIONS, e); }
export async function deleteExhibition(id: string): Promise<void> { await deleteStore(EX_KEY, SEED_EXHIBITIONS, id); }

// ---------------------------------------------------------------------------
// Offline Billing App — devices + sync queue
// ---------------------------------------------------------------------------

export type DeviceStatus = 'online' | 'offline' | 'sync-pending' | 'blocked';

export interface OfflineDevice {
  id: string;
  code: string;
  name: string;
  type: 'laptop' | 'tablet' | 'phone';
  assignedTo: string;
  branchId: string;
  os: string;
  appVersion: string;
  lastSyncAt: string;
  pendingTransactions: number;
  pendingConflicts: number;
  status: DeviceStatus;
  storageUsedMB: number;
  masterDataAgeDays: number;
}

const DEV_KEY = 'trs.erp.devices.v1';

export const SEED_DEVICES: OfflineDevice[] = [
  { id: 'dev-001', code: 'DEV-DEL-BILL-01', name: 'Delhi HO Counter Laptop', type: 'laptop', assignedTo: 'Sunil Sharma', branchId: 'br-001', os: 'Windows 11 Pro', appVersion: '2.4.1', lastSyncAt: '2026-09-17 09:42', pendingTransactions: 0, pendingConflicts: 0, status: 'online', storageUsedMB: 148, masterDataAgeDays: 0 },
  { id: 'dev-002', code: 'DEV-DEL-EXPO-02', name: 'Delhi Expo Booth Tablet', type: 'tablet', assignedTo: 'Zoya Malik', branchId: 'br-001', os: 'iPadOS 18', appVersion: '2.4.1', lastSyncAt: '2026-09-16 20:15', pendingTransactions: 42, pendingConflicts: 1, status: 'sync-pending', storageUsedMB: 92, masterDataAgeDays: 1 },
  { id: 'dev-003', code: 'DEV-BLR-COUNTER-01', name: 'Bengaluru Counter Laptop', type: 'laptop', assignedTo: 'Nikita Sarang', branchId: 'br-002', os: 'macOS 15', appVersion: '2.4.1', lastSyncAt: '2026-09-17 10:22', pendingTransactions: 0, pendingConflicts: 0, status: 'online', storageUsedMB: 168, masterDataAgeDays: 0 },
  { id: 'dev-004', code: 'DEV-BLR-EXPO-03', name: 'K12 Expo Booth Tablet',    type: 'tablet', assignedTo: 'Abhisek Verma', branchId: 'br-002', os: 'iPadOS 18', appVersion: '2.4.1', lastSyncAt: '2026-09-17 08:05', pendingTransactions: 18, pendingConflicts: 0, status: 'offline', storageUsedMB: 84, masterDataAgeDays: 1 },
  { id: 'dev-005', code: 'DEV-BOM-COUNTER-01', name: 'Mumbai Counter Laptop', type: 'laptop', assignedTo: 'S. Iyer', branchId: 'br-003', os: 'Windows 11 Pro', appVersion: '2.4.0', lastSyncAt: '2026-09-15 18:40', pendingTransactions: 6, pendingConflicts: 0, status: 'sync-pending', storageUsedMB: 152, masterDataAgeDays: 2 },
  { id: 'dev-006', code: 'DEV-HYD-COUNTER-01', name: 'Hyderabad Counter Laptop', type: 'laptop', assignedTo: 'Vikram Rao', branchId: 'br-004', os: 'Windows 11 Pro', appVersion: '2.4.1', lastSyncAt: '2026-09-17 10:38', pendingTransactions: 0, pendingConflicts: 0, status: 'online', storageUsedMB: 141, masterDataAgeDays: 0 },
  { id: 'dev-007', code: 'DEV-COK-COUNTER-01', name: 'Kochi Counter Laptop', type: 'laptop', assignedTo: 'K. Nair', branchId: 'br-005', os: 'macOS 15', appVersion: '2.4.1', lastSyncAt: '2026-09-17 09:11', pendingTransactions: 3, pendingConflicts: 0, status: 'online', storageUsedMB: 129, masterDataAgeDays: 0 },
  { id: 'dev-008', code: 'DEV-CCU-EXPO-01', name: 'Boi Mela Booth Phone', type: 'phone', assignedTo: 'B. Chatterjee', branchId: 'br-007', os: 'Android 15', appVersion: '2.3.9', lastSyncAt: '2026-09-14 22:12', pendingTransactions: 24, pendingConflicts: 3, status: 'blocked', storageUsedMB: 62, masterDataAgeDays: 3 },
];

export async function loadDevices(): Promise<OfflineDevice[]> { return readList<OfflineDevice>(DEV_KEY, SEED_DEVICES); }
export async function saveDevice(d: OfflineDevice): Promise<void> { await upsertStore<OfflineDevice>(DEV_KEY, SEED_DEVICES, d); }
export async function deleteDevice(id: string): Promise<void> { await deleteStore(DEV_KEY, SEED_DEVICES, id); }

export interface OfflineTxn {
  id: string;
  deviceId: string;
  refNumber: string;
  createdAtOffline: string;
  syncedAt?: string;
  customer: string;
  itemsCount: number;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'upi';
  status: 'pending' | 'synced' | 'conflict' | 'duplicate';
  conflictReason?: string;
}

const TXN_KEY = 'trs.erp.offline-txns.v1';

export const SEED_OFFLINE_TXNS: OfflineTxn[] = [
  { id: 'otxn-001', deviceId: 'dev-002', refNumber: 'DEV-DEL-EXPO-02/OFF/0042', createdAtOffline: '2026-09-16 18:22', customer: 'Walk-in', itemsCount: 3, amount: 1985, paymentMethod: 'upi', status: 'pending' },
  { id: 'otxn-002', deviceId: 'dev-002', refNumber: 'DEV-DEL-EXPO-02/OFF/0041', createdAtOffline: '2026-09-16 18:07', customer: 'Walk-in', itemsCount: 1, amount: 340, paymentMethod: 'cash', status: 'conflict', conflictReason: 'SKU price changed after offline capture' },
  { id: 'otxn-003', deviceId: 'dev-004', refNumber: 'DEV-BLR-EXPO-03/OFF/0018', createdAtOffline: '2026-09-17 07:52', customer: 'Educator Conf. delegate', itemsCount: 4, amount: 2410, paymentMethod: 'card', status: 'pending' },
  { id: 'otxn-004', deviceId: 'dev-005', refNumber: 'DEV-BOM-COUNTER-01/OFF/0091', createdAtOffline: '2026-09-15 18:12', customer: 'Bhavans Vidya Mandir', itemsCount: 6, amount: 8420, paymentMethod: 'card', status: 'pending' },
  { id: 'otxn-005', deviceId: 'dev-008', refNumber: 'DEV-CCU-EXPO-01/OFF/0024', createdAtOffline: '2026-09-14 21:44', customer: 'Walk-in', itemsCount: 2, amount: 1120, paymentMethod: 'cash', status: 'duplicate', conflictReason: 'Same ref submitted twice from device' },
  { id: 'otxn-006', deviceId: 'dev-008', refNumber: 'DEV-CCU-EXPO-01/OFF/0023', createdAtOffline: '2026-09-14 20:15', customer: 'Walk-in', itemsCount: 1, amount: 420, paymentMethod: 'upi', status: 'conflict', conflictReason: 'Inventory delta mismatch' },
  { id: 'otxn-007', deviceId: 'dev-002', refNumber: 'DEV-DEL-EXPO-02/OFF/0040', createdAtOffline: '2026-09-16 17:48', customer: 'DPS Rohini', itemsCount: 12, amount: 14820, paymentMethod: 'card', status: 'synced', syncedAt: '2026-09-16 21:30' },
];

export async function loadOfflineTxns(): Promise<OfflineTxn[]> { return readList<OfflineTxn>(TXN_KEY, SEED_OFFLINE_TXNS); }
export async function saveOfflineTxn(t: OfflineTxn): Promise<void> { await upsertStore<OfflineTxn>(TXN_KEY, SEED_OFFLINE_TXNS, t); }

// ---------------------------------------------------------------------------
// CRM & Leads
// ---------------------------------------------------------------------------

export type LeadSource = 'exhibition' | 'phone' | 'website' | 'referral' | 'walk-in';
export type LeadStage = 'new' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';

export interface LeadActivity {
  at: string;
  type: 'call' | 'email' | 'visit' | 'note' | 'quotation' | 'meeting';
  note: string;
  by: string;
}

export interface Lead {
  id: string;
  code: string;
  name: string;
  contactName: string;
  contactRole?: string;
  phone: string;
  email: string;
  city: string;
  state: string;
  source: LeadSource;
  sourceDetail?: string;
  assignedTo: string;
  stage: LeadStage;
  expectedValue: number;
  probability: number;
  expectedClose: string;
  createdAt: string;
  lastActivityAt: string;
  activities: LeadActivity[];
  notes?: string;
}

const LEAD_KEY = 'trs.erp.leads.v1';

export const SEED_LEADS: Lead[] = [
  {
    id: 'ld-001', code: 'L-2026-0184',
    name: 'Sunshine International School', contactName: 'Deepak Verma', contactRole: 'Purchase Head',
    phone: '+91 98111 22334', email: 'purchase@sunshineintl.edu.in',
    city: 'Ghaziabad', state: 'Uttar Pradesh',
    source: 'exhibition', sourceDetail: 'CBSE Book Fair 2026 · Delhi',
    assignedTo: 'Rahul Tomar',
    stage: 'proposal',
    expectedValue: 640000, probability: 60,
    expectedClose: '2026-10-30',
    createdAt: '2026-09-14', lastActivityAt: '2026-09-16',
    activities: [
      { at: '2026-09-14', type: 'visit', note: 'Booth visit at Pragati Maidan · asked for CBSE Class 6-10 quote', by: 'Zoya Malik' },
      { at: '2026-09-15', type: 'call', note: 'Confirmed order horizon for new session; discount 22% agreed on initial slab', by: 'Rahul Tomar' },
      { at: '2026-09-16', type: 'quotation', note: 'Sent Q-2026-0311 for 1,400 books · 22% slab', by: 'Rahul Tomar' },
    ],
  },
  {
    id: 'ld-002', code: 'L-2026-0185',
    name: 'Vidyagram Books & Stationery', contactName: 'Manoj Agarwal', contactRole: 'Owner',
    phone: '+91 96450 10022', email: 'vidyagram@gmail.com',
    city: 'Jaipur', state: 'Rajasthan',
    source: 'phone', sourceDetail: 'Inbound call from ad',
    assignedTo: 'Rahul Tomar',
    stage: 'qualified',
    expectedValue: 320000, probability: 40,
    expectedClose: '2026-11-15',
    createdAt: '2026-09-08', lastActivityAt: '2026-09-12',
    activities: [
      { at: '2026-09-08', type: 'call', note: 'Wants dealer terms · 45-day credit', by: 'Rahul Tomar' },
      { at: '2026-09-12', type: 'note', note: 'Credit check clear · references verified', by: 'Vaibhav Hariyani' },
    ],
  },
  {
    id: 'ld-003', code: 'L-2026-0186',
    name: 'K.C. Educational Trust', contactName: 'Anil Choudhary', contactRole: 'Trustee',
    phone: '+91 89760 00811', email: 'anil@kctrust.org',
    city: 'Bhopal', state: 'Madhya Pradesh',
    source: 'referral', sourceDetail: 'Referred by Sapna Book House',
    assignedTo: 'Vaibhav Hariyani',
    stage: 'negotiation',
    expectedValue: 1240000, probability: 75,
    expectedClose: '2026-10-08',
    createdAt: '2026-08-28', lastActivityAt: '2026-09-15',
    activities: [
      { at: '2026-08-28', type: 'call', note: 'Referral intro · 4 schools requirement', by: 'Vaibhav Hariyani' },
      { at: '2026-09-02', type: 'meeting', note: 'Physical meet · walked through catalog', by: 'Vaibhav Hariyani' },
      { at: '2026-09-10', type: 'quotation', note: 'Sent Q-2026-0308 · 42% slab', by: 'Vaibhav Hariyani' },
      { at: '2026-09-15', type: 'call', note: 'Requesting 45% slab · escalated to COO', by: 'Vaibhav Hariyani' },
    ],
  },
  {
    id: 'ld-004', code: 'L-2026-0187',
    name: 'Bookworm Central', contactName: 'Priyanka Iyer',
    phone: '+91 90080 00121', email: 'hello@bookworm.co.in',
    city: 'Pune', state: 'Maharashtra',
    source: 'website', sourceDetail: 'Contact form',
    assignedTo: 'Nikita Sarang',
    stage: 'new',
    expectedValue: 180000, probability: 20,
    expectedClose: '2026-11-30',
    createdAt: '2026-09-16', lastActivityAt: '2026-09-16',
    activities: [
      { at: '2026-09-16', type: 'note', note: 'Filled contact form · asked about ICSE Class 8-10 titles', by: 'Nikita Sarang' },
    ],
  },
  {
    id: 'ld-005', code: 'L-2026-0188',
    name: 'Podar International School', contactName: 'Dr. Sujata Vashi', contactRole: 'Academic Head',
    phone: '+91 22 4310 6600', email: 'academics@podar.org',
    city: 'Mumbai', state: 'Maharashtra',
    source: 'exhibition', sourceDetail: 'K12 Expo Bengaluru · met at booth',
    assignedTo: 'Abhisek Verma',
    stage: 'won',
    expectedValue: 460000, probability: 100,
    expectedClose: '2026-09-14',
    createdAt: '2026-08-22', lastActivityAt: '2026-09-14',
    activities: [
      { at: '2026-08-22', type: 'visit', note: 'Booth visit', by: 'Abhisek Verma' },
      { at: '2026-08-29', type: 'quotation', note: 'Sent quote · 22% slab, 30-day credit', by: 'Abhisek Verma' },
      { at: '2026-09-08', type: 'meeting', note: 'Purchase committee approval', by: 'Abhisek Verma' },
      { at: '2026-09-14', type: 'note', note: 'PO received · SO-2026-0316 created', by: 'Abhisek Verma' },
    ],
  },
  {
    id: 'ld-006', code: 'L-2026-0189',
    name: 'Nalanda Academy Group', contactName: 'Ravi Sen',
    phone: '+91 98770 00224', email: 'ravi@nalanda.edu.in',
    city: 'Ahmedabad', state: 'Gujarat',
    source: 'exhibition', sourceDetail: 'Ahmedabad Edu Expo 2025 · cold reactivation',
    assignedTo: 'Nikita Sarang',
    stage: 'lost',
    expectedValue: 220000, probability: 0,
    expectedClose: '2026-08-30',
    createdAt: '2026-06-15', lastActivityAt: '2026-08-30',
    activities: [
      { at: '2026-06-15', type: 'call', note: 'Initial interest', by: 'Nikita Sarang' },
      { at: '2026-07-10', type: 'quotation', note: 'Quote sent', by: 'Nikita Sarang' },
      { at: '2026-08-30', type: 'note', note: 'Went with competitor — 3% higher discount slab offered', by: 'Nikita Sarang' },
    ],
  },
];

export async function loadLeads(): Promise<Lead[]> { return readList<Lead>(LEAD_KEY, SEED_LEADS); }
export async function saveLead(l: Lead): Promise<void> { await upsertStore<Lead>(LEAD_KEY, SEED_LEADS, l); }
export async function deleteLead(id: string): Promise<void> { await deleteStore(LEAD_KEY, SEED_LEADS, id); }
