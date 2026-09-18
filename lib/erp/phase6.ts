import { readList, writeList, upsertRow as upsertStore, deleteRow as deleteStore, readSingle, writeSingle } from './store';

// ERP Phase 6 — Admin data layer.
// Tally migration jobs, Security (users, roles, audit trail), System (company,
// backups, alerts).



// ---------------------------------------------------------------------------
// Tally migration
// ---------------------------------------------------------------------------

export type TallyEntity =
  | 'ledgers' | 'customers' | 'suppliers' | 'items'
  | 'tax-structure' | 'opening-balances'
  | 'ar' | 'ap' | 'opening-stock';

export type MigrationStatus = 'queued' | 'validating' | 'ready' | 'migrated' | 'reconciled' | 'failed';

export interface TallyMigrationJob {
  id: string;
  entity: TallyEntity;
  fileName: string;
  uploadedBy: string;
  uploadedAt: string;
  rowCount: number;
  successCount: number;
  warningCount: number;
  errorCount: number;
  tallyTotal: number;
  erpTotal: number;
  diff: number;
  status: MigrationStatus;
  notes?: string;
}

const MIG_KEY = 'trs.erp.tally-migrations.v1';

export const SEED_MIGRATIONS: TallyMigrationJob[] = [
  { id: 'mig-001', entity: 'ledgers',           fileName: 'tally-export-ledgers-2026-03-31.xml', uploadedBy: 'Vaibhav Hariyani', uploadedAt: '2026-04-05 09:12', rowCount: 412, successCount: 411, warningCount: 1, errorCount: 0, tallyTotal: 0,        erpTotal: 0,        diff: 0, status: 'reconciled', notes: '1 duplicate ledger merged manually' },
  { id: 'mig-002', entity: 'customers',         fileName: 'tally-parties-customers.xlsx',        uploadedBy: 'Vaibhav Hariyani', uploadedAt: '2026-04-05 10:44', rowCount: 288, successCount: 287, warningCount: 1, errorCount: 0, tallyTotal: 0,        erpTotal: 0,        diff: 0, status: 'reconciled' },
  { id: 'mig-003', entity: 'suppliers',         fileName: 'tally-parties-suppliers.xlsx',        uploadedBy: 'Vaibhav Hariyani', uploadedAt: '2026-04-05 11:03', rowCount: 74,  successCount: 74,  warningCount: 0, errorCount: 0, tallyTotal: 0,        erpTotal: 0,        diff: 0, status: 'reconciled' },
  { id: 'mig-004', entity: 'items',             fileName: 'tally-stock-items.xlsx',              uploadedBy: 'Umesh Gupta',       uploadedAt: '2026-04-06 14:20', rowCount: 8420, successCount: 8412, warningCount: 6, errorCount: 2, tallyTotal: 0,        erpTotal: 0,        diff: 0, status: 'reconciled', notes: '2 items skipped — HSN required' },
  { id: 'mig-005', entity: 'tax-structure',     fileName: 'tally-tax-masters.xml',               uploadedBy: 'Vaibhav Hariyani', uploadedAt: '2026-04-06 15:10', rowCount: 22,  successCount: 22,  warningCount: 0, errorCount: 0, tallyTotal: 0,        erpTotal: 0,        diff: 0, status: 'reconciled' },
  { id: 'mig-006', entity: 'opening-balances',  fileName: 'tally-opening-balances-2026.xlsx',    uploadedBy: 'Vaibhav Hariyani', uploadedAt: '2026-04-07 09:55', rowCount: 41,  successCount: 41,  warningCount: 0, errorCount: 0, tallyTotal: 44820000, erpTotal: 44820000, diff: 0, status: 'reconciled' },
  { id: 'mig-007', entity: 'ar',                fileName: 'tally-outstanding-ar.xlsx',           uploadedBy: 'Priya S.',         uploadedAt: '2026-04-07 12:32', rowCount: 168, successCount: 165, warningCount: 3, errorCount: 0, tallyTotal: 8420000,  erpTotal: 8420000,  diff: 0, status: 'reconciled', notes: '3 stale bills flagged — pending customer confirmation' },
  { id: 'mig-008', entity: 'ap',                fileName: 'tally-outstanding-ap.xlsx',           uploadedBy: 'Priya S.',         uploadedAt: '2026-04-07 13:18', rowCount: 96,  successCount: 96,  warningCount: 0, errorCount: 0, tallyTotal: 5210000,  erpTotal: 5210000,  diff: 0, status: 'reconciled' },
  { id: 'mig-009', entity: 'opening-stock',     fileName: 'tally-opening-stock-by-title.xlsx',   uploadedBy: 'Sunil Sharma',    uploadedAt: '2026-04-08 11:44', rowCount: 8420, successCount: 8380, warningCount: 32, errorCount: 8, tallyTotal: 25700000, erpTotal: 25698140, diff: -1860, status: 'reconciled', notes: '8 rows in dead SKUs · rounded down' },
  { id: 'mig-010', entity: 'opening-stock',     fileName: 'tally-godown-transfer-in.xlsx',       uploadedBy: 'Sunil Sharma',    uploadedAt: '2026-09-14 16:22', rowCount: 240, successCount: 236, warningCount: 4, errorCount: 0, tallyTotal: 1200000,  erpTotal: 1198420, diff: -1580, status: 'ready', notes: 'Awaiting warehouse manager sign-off' },
];

export async function loadMigrations(): Promise<TallyMigrationJob[]> { return readList<TallyMigrationJob>(MIG_KEY, SEED_MIGRATIONS); }
export async function saveMigration(m: TallyMigrationJob): Promise<void> { await upsertStore<TallyMigrationJob>(MIG_KEY, SEED_MIGRATIONS, m); }
export async function deleteMigration(id: string): Promise<void> { await deleteStore(MIG_KEY, SEED_MIGRATIONS, id); }

// ---------------------------------------------------------------------------
// Security — users, roles, audit
// ---------------------------------------------------------------------------

export type UserStatus = 'active' | 'invited' | 'locked' | 'disabled';

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: string[];      // 'module.action'
  builtIn: boolean;
}

export interface User {
  id: string;
  code: string;
  name: string;
  email: string;
  phone: string;
  roleId: string;
  branchScope: string[];
  gstinScope: string[];
  status: UserStatus;
  twoFactorEnabled: boolean;
  lastLoginAt?: string;
  lastLoginIp?: string;
  failedLoginAttempts: number;
  passwordChangedAt: string;
}

export interface AuditEvent {
  id: string;
  at: string;
  userId: string;
  action: string;     // 'update' | 'create' | 'delete' | 'login' | 'export'
  module: string;
  entity?: string;
  ip: string;
}

const ROLE_KEY = 'trs.erp.roles.v1';
const USER_KEY = 'trs.erp.users.v1';
const AUDIT_KEY = 'trs.erp.audit.v1';

export const SEED_ROLES: Role[] = [
  { id: 'role-001', name: 'Super Admin',             description: 'Full access across every module and every branch.',                 permissions: ['*'],  builtIn: true },
  { id: 'role-002', name: 'Finance Manager',         description: 'Accounting, GST, bank recon, and read-only sales/purchase.',        permissions: ['accounts.*', 'gst.*', 'bank-recon.*', 'sales.read', 'purchase.read', 'reports.*'], builtIn: true },
  { id: 'role-003', name: 'Branch Manager',          description: 'Full transactional access limited to assigned branch.',              permissions: ['sales.*', 'purchase.*', 'inventory.*', 'reports.*', 'customers.*', 'suppliers.read'], builtIn: true },
  { id: 'role-004', name: 'Buying Executive',        description: 'Create + edit POs, manage suppliers.',                                permissions: ['purchase.*', 'suppliers.*', 'inventory.read'], builtIn: false },
  { id: 'role-005', name: 'Sales Executive',         description: 'Create quotes, sales orders; read-only customer + inventory.',       permissions: ['sales.write', 'crm.*', 'customers.write', 'inventory.read'], builtIn: false },
  { id: 'role-006', name: 'Warehouse Supervisor',    description: 'Warehouse in/out, stock counts, and GRN.',                            permissions: ['warehouses.*', 'inventory.*', 'purchase.grn'], builtIn: false },
  { id: 'role-007', name: 'HR Executive',            description: 'Employee master, attendance, leave workflow.',                       permissions: ['hr.*'], builtIn: false },
  { id: 'role-008', name: 'Auditor (read-only)',      description: 'Read access to accounts, GST, and audit trail. No writes.',           permissions: ['accounts.read', 'gst.read', 'reports.read', 'audit.read'], builtIn: true },
];

export const SEED_USERS: User[] = [
  { id: 'usr-001', code: 'U-001', name: 'Dhananjay Singh',    email: 'dhananjay@trs.co.in', phone: '+91 98110 40010', roleId: 'role-001', branchScope: ['*'], gstinScope: ['*'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-17 09:12', lastLoginIp: '203.0.113.14',  failedLoginAttempts: 0, passwordChangedAt: '2026-07-18' },
  { id: 'usr-002', code: 'U-002', name: 'Vaibhav Hariyani',    email: 'vaibhav@trs.co.in',    phone: '+91 98111 20090', roleId: 'role-002', branchScope: ['br-001'], gstinScope: ['*'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-17 08:44', lastLoginIp: '203.0.113.17',  failedLoginAttempts: 0, passwordChangedAt: '2026-08-01' },
  { id: 'usr-003', code: 'U-003', name: 'Sunita Yadav',        email: 'sunita@trs.co.in',      phone: '+91 98112 30045', roleId: 'role-007', branchScope: ['br-001'], gstinScope: ['gst-001'], status: 'active', twoFactorEnabled: false, lastLoginAt: '2026-09-16 17:20', lastLoginIp: '203.0.113.19', failedLoginAttempts: 0, passwordChangedAt: '2026-06-10' },
  { id: 'usr-004', code: 'U-004', name: 'Abhisek Verma',       email: 'abhisek@trs.co.in',    phone: '+91 98453 01001', roleId: 'role-003', branchScope: ['br-002'], gstinScope: ['gst-002'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-17 10:22', lastLoginIp: '203.0.113.21', failedLoginAttempts: 0, passwordChangedAt: '2026-07-30' },
  { id: 'usr-005', code: 'U-005', name: 'Rahul Tomar',         email: 'rahul.tomar@trs.co.in', phone: '+91 98110 44210', roleId: 'role-003', branchScope: ['br-001', 'br-003', 'br-007'], gstinScope: ['gst-001', 'gst-003', 'gst-007'], status: 'active', twoFactorEnabled: true, lastLoginAt: '2026-09-17 09:55', lastLoginIp: '203.0.113.22', failedLoginAttempts: 0, passwordChangedAt: '2026-08-11' },
  { id: 'usr-006', code: 'U-006', name: 'Umesh Gupta',         email: 'umesh@trs.co.in',       phone: '+91 98111 55066', roleId: 'role-004', branchScope: ['br-001'], gstinScope: ['gst-001'], status: 'active', twoFactorEnabled: false, lastLoginAt: '2026-09-17 08:10', lastLoginIp: '203.0.113.28', failedLoginAttempts: 0, passwordChangedAt: '2026-05-04' },
  { id: 'usr-007', code: 'U-007', name: 'Nikita Sarang',       email: 'nikita@trs.co.in',      phone: '+91 96400 22102', roleId: 'role-005', branchScope: ['br-002'], gstinScope: ['gst-002'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-16 22:11', lastLoginIp: '203.0.113.33', failedLoginAttempts: 0, passwordChangedAt: '2026-08-20' },
  { id: 'usr-008', code: 'U-008', name: 'Sunil Sharma',        email: 'sunil@trs.co.in',       phone: '+91 98115 33099', roleId: 'role-006', branchScope: ['br-001'], gstinScope: ['gst-001'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-17 10:12', lastLoginIp: '203.0.113.34', failedLoginAttempts: 0, passwordChangedAt: '2026-06-18' },
  { id: 'usr-009', code: 'U-009', name: 'Ravi Kumar',          email: 'ravi.k@trs.co.in',      phone: '+91 94470 55889', roleId: 'role-006', branchScope: ['br-005'], gstinScope: ['gst-005'], status: 'active', twoFactorEnabled: false, lastLoginAt: '2026-09-15 14:32', lastLoginIp: '203.0.113.41', failedLoginAttempts: 2, passwordChangedAt: '2026-04-11' },
  { id: 'usr-010', code: 'U-010', name: 'Priya S.',            email: 'priya@trs.co.in',       phone: '+91 98200 11111', roleId: 'role-002', branchScope: ['br-003'], gstinScope: ['gst-003'], status: 'active', twoFactorEnabled: true,  lastLoginAt: '2026-09-17 09:04', lastLoginIp: '203.0.113.44', failedLoginAttempts: 0, passwordChangedAt: '2026-09-01' },
  { id: 'usr-011', code: 'U-011', name: 'External Auditor',     email: 'partner@sr-batliboi.com', phone: '+91 22 6754 1000', roleId: 'role-008', branchScope: ['*'], gstinScope: ['*'], status: 'active', twoFactorEnabled: true, lastLoginAt: '2026-09-16 15:18', lastLoginIp: '203.0.113.66', failedLoginAttempts: 0, passwordChangedAt: '2026-09-10' },
  { id: 'usr-012', code: 'U-012', name: 'B. Chatterjee',       email: 'bc@trs.co.in',          phone: '+91 90520 33001', roleId: 'role-003', branchScope: ['br-007'], gstinScope: ['gst-007'], status: 'active', twoFactorEnabled: false, lastLoginAt: '2026-09-14 20:14', lastLoginIp: '203.0.113.71', failedLoginAttempts: 5, passwordChangedAt: '2026-02-14' },
  { id: 'usr-013', code: 'U-013', name: 'Neeraj D. (Intern)',    email: 'neeraj@trs.co.in',      phone: '+91 88220 40021', roleId: 'role-008', branchScope: ['br-001'], gstinScope: ['gst-001'], status: 'invited', twoFactorEnabled: false, failedLoginAttempts: 0, passwordChangedAt: '2026-09-16' },
];

export const SEED_AUDIT: AuditEvent[] = [
  { id: 'evt-001', at: '2026-09-17 10:22', userId: 'usr-004', action: 'update', module: 'sales',     entity: 'SO-2026-0311', ip: '203.0.113.21' },
  { id: 'evt-002', at: '2026-09-17 10:14', userId: 'usr-005', action: 'create', module: 'crm',       entity: 'L-2026-0190', ip: '203.0.113.22' },
  { id: 'evt-003', at: '2026-09-17 10:03', userId: 'usr-002', action: 'export', module: 'gst',       entity: 'GSTR1-2026-09-Delhi', ip: '203.0.113.17' },
  { id: 'evt-004', at: '2026-09-17 09:55', userId: 'usr-005', action: 'update', module: 'sales',     entity: 'SO-2026-0313', ip: '203.0.113.22' },
  { id: 'evt-005', at: '2026-09-17 09:44', userId: 'usr-008', action: 'create', module: 'inventory', entity: 'STK-ADJ-2026-088', ip: '203.0.113.34' },
  { id: 'evt-006', at: '2026-09-17 09:12', userId: 'usr-001', action: 'login',  module: 'auth',      ip: '203.0.113.14' },
  { id: 'evt-007', at: '2026-09-17 08:44', userId: 'usr-002', action: 'login',  module: 'auth',      ip: '203.0.113.17' },
  { id: 'evt-008', at: '2026-09-17 08:22', userId: 'usr-002', action: 'update', module: 'accounts',  entity: 'JV-2026-0250',   ip: '203.0.113.17' },
  { id: 'evt-009', at: '2026-09-17 08:11', userId: 'usr-010', action: 'create', module: 'accounts',  entity: 'JV-2026-0249',   ip: '203.0.113.44' },
  { id: 'evt-010', at: '2026-09-16 22:11', userId: 'usr-007', action: 'update', module: 'crm',       entity: 'L-2026-0187',   ip: '203.0.113.33' },
  { id: 'evt-011', at: '2026-09-16 21:11', userId: 'usr-012', action: 'login-failed', module: 'auth', ip: '203.0.113.71' },
  { id: 'evt-012', at: '2026-09-16 21:10', userId: 'usr-012', action: 'login-failed', module: 'auth', ip: '203.0.113.71' },
  { id: 'evt-013', at: '2026-09-16 20:14', userId: 'usr-012', action: 'login',  module: 'auth',      ip: '203.0.113.71' },
];

export async function loadRoles(): Promise<Role[]> { return readList<Role>(ROLE_KEY, SEED_ROLES); }
export async function saveRole(r: Role): Promise<void> { await upsertStore<Role>(ROLE_KEY, SEED_ROLES, r); }
export async function loadUsers(): Promise<User[]> { return readList<User>(USER_KEY, SEED_USERS); }
export async function saveUser(u: User): Promise<void> { await upsertStore<User>(USER_KEY, SEED_USERS, u); }
export async function deleteUser(id: string): Promise<void> { await deleteStore(USER_KEY, SEED_USERS, id); }
export async function loadAudit(): Promise<AuditEvent[]> { return readList<AuditEvent>(AUDIT_KEY, SEED_AUDIT); }

// ---------------------------------------------------------------------------
// System — company config + backups + alerts
// ---------------------------------------------------------------------------

export interface Company {
  legalName: string;
  tradeName: string;
  cin: string;
  pan: string;
  registeredAddress: string;
  contactEmail: string;
  contactPhone: string;
  invoicePrefix: string;
  fiscalYearStart: string;
  timezone: string;
  currency: string;
}

export const DEFAULT_COMPANY: Company = {
  legalName: 'Travel Retail Services Private Limited',
  tradeName: 'TRS',
  cin: 'U52511DL2018PTC123456',
  pan: 'AABCT1332L',
  registeredAddress: 'A-14, Okhla Industrial Estate Phase II, New Delhi 110020',
  contactEmail: 'ops@trs.co.in',
  contactPhone: '+91 11 4000 8100',
  invoicePrefix: 'INV',
  fiscalYearStart: '2026-04-01',
  timezone: 'Asia/Kolkata',
  currency: 'INR',
};

const COMP_KEY = 'trs.erp.company.v1';

export async function loadCompany(): Promise<Company> { return readSingle<Company>(COMP_KEY, DEFAULT_COMPANY); }
export async function saveCompany(c: Company): Promise<void> { await writeSingle<Company>(COMP_KEY, c); }

export interface Backup {
  id: string;
  runAt: string;
  sizeMB: number;
  status: 'success' | 'failed' | 'running';
  location: 'primary' | 'offsite-s3' | 'cold-storage';
  retentionDays: number;
  duration: string;
}

export const SEED_BACKUPS: Backup[] = [
  { id: 'bkp-001', runAt: '2026-09-17 03:00', sizeMB: 4820, status: 'success', location: 'primary',      retentionDays: 30,  duration: '00:14:22' },
  { id: 'bkp-002', runAt: '2026-09-17 03:15', sizeMB: 4820, status: 'success', location: 'offsite-s3',   retentionDays: 90,  duration: '00:04:11' },
  { id: 'bkp-003', runAt: '2026-09-16 03:00', sizeMB: 4788, status: 'success', location: 'primary',      retentionDays: 30,  duration: '00:14:05' },
  { id: 'bkp-004', runAt: '2026-09-16 03:15', sizeMB: 4788, status: 'success', location: 'offsite-s3',   retentionDays: 90,  duration: '00:04:20' },
  { id: 'bkp-005', runAt: '2026-09-15 03:00', sizeMB: 4762, status: 'success', location: 'primary',      retentionDays: 30,  duration: '00:14:33' },
  { id: 'bkp-006', runAt: '2026-09-14 03:00', sizeMB: 4749, status: 'success', location: 'primary',      retentionDays: 30,  duration: '00:14:12' },
  { id: 'bkp-007', runAt: '2026-09-14 03:15', sizeMB: 4749, status: 'failed',  location: 'offsite-s3',   retentionDays: 90,  duration: '00:00:44' },
  { id: 'bkp-008', runAt: '2026-09-13 03:00', sizeMB: 4740, status: 'success', location: 'primary',      retentionDays: 30,  duration: '00:14:08' },
  { id: 'bkp-009', runAt: '2026-09-01 03:15', sizeMB: 4620, status: 'success', location: 'cold-storage', retentionDays: 730, duration: '00:04:52' },
];

const BKP_KEY = 'trs.erp.backups.v1';
export async function loadBackups(): Promise<Backup[]> { return readList<Backup>(BKP_KEY, SEED_BACKUPS); }

export interface SystemAlert {
  id: string;
  at: string;
  level: 'info' | 'warning' | 'critical';
  category: string;
  message: string;
  resolved: boolean;
}

const ALT_KEY = 'trs.erp.alerts.v1';
export const SEED_ALERTS: SystemAlert[] = [
  { id: 'alt-001', at: '2026-09-14 03:16', level: 'warning', category: 'Backup',       message: 'Offsite-s3 backup failed — retry scheduled, check IAM permissions', resolved: true },
  { id: 'alt-002', at: '2026-09-16 21:11', level: 'critical', category: 'Security',    message: 'usr-012 (B. Chatterjee) — 5 consecutive failed logins from 203.0.113.71', resolved: false },
  { id: 'alt-003', at: '2026-09-17 07:04', level: 'info',    category: 'Monitoring',   message: 'CPU on primary DB reached 68% for 4 minutes (threshold 80%)', resolved: true },
  { id: 'alt-004', at: '2026-09-17 08:22', level: 'warning', category: 'Certificate',  message: 'SSL cert for api.trs.co.in expires in 21 days', resolved: false },
  { id: 'alt-005', at: '2026-09-17 10:11', level: 'info',    category: 'Deployment',   message: 'Blue-green cutover complete — build 2.4.1 · 0 errors post-deploy', resolved: true },
];
export async function loadAlerts(): Promise<SystemAlert[]> { return readList<SystemAlert>(ALT_KEY, SEED_ALERTS); }
export async function saveAlert(a: SystemAlert): Promise<void> { await upsertStore<SystemAlert>(ALT_KEY, SEED_ALERTS, a); }
