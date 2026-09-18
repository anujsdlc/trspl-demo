// ERP Phase 5 — Insight data layer (HR + Attendance only; Reports aggregate
// live from Phase 2/3/4 data).

function isBrowser() { return typeof window !== 'undefined'; }
function read<T>(key: string, fallback: T[]): T[] {
  if (!isBrowser()) return fallback;
  try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) as T[] : fallback; } catch { return fallback; }
}
function write<T>(key: string, rows: T[]) { if (isBrowser()) localStorage.setItem(key, JSON.stringify(rows)); }
function upsert<T extends { id: string }>(key: string, seed: T[], row: T) {
  const rows = read<T>(key, seed);
  const idx = rows.findIndex(r => r.id === row.id);
  if (idx >= 0) rows[idx] = row; else rows.unshift(row);
  write(key, rows);
}
function del<T extends { id: string }>(key: string, seed: T[], id: string) {
  write(key, read<T>(key, seed).filter(r => r.id !== id));
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

export type EmployeeType = 'permanent' | 'contract' | 'consultant' | 'intern';

export interface Employee {
  id: string;
  code: string;
  name: string;
  designation: string;
  department: string;
  branchId: string;
  type: EmployeeType;
  joinDate: string;
  reportsTo?: string;
  email: string;
  phone: string;
  monthlyGross: number;
  status: 'active' | 'on-leave' | 'notice' | 'exited';
  documentsComplete: boolean;
  pfNumber?: string;
  bankAccount?: string;
  pan?: string;
}

const EMP_KEY = 'trs.erp.employees.v1';

export const SEED_EMPLOYEES: Employee[] = [
  { id: 'emp-001', code: 'TRS-001', name: 'Dhananjay Singh',    designation: 'COO & Business Head',       department: 'Leadership',  branchId: 'br-001', type: 'permanent', joinDate: '2018-03-01', email: 'dhananjay@trs.co.in', phone: '+91 98110 40010', monthlyGross: 640000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/001',   bankAccount: 'HDFC ****1234',   pan: 'ABCPS1234K' },
  { id: 'emp-002', code: 'TRS-002', name: 'Vaibhav Hariyani',    designation: 'Finance Manager',           department: 'Finance',     branchId: 'br-001', type: 'permanent', joinDate: '2019-06-15', reportsTo: 'emp-001', email: 'vaibhav@trs.co.in',    phone: '+91 98111 20090', monthlyGross: 185000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/002', bankAccount: 'HDFC ****5698',  pan: 'ABDPH2345M' },
  { id: 'emp-003', code: 'TRS-003', name: 'Sunita Yadav',        designation: 'Senior Manager · HR',        department: 'HR',           branchId: 'br-001', type: 'permanent', joinDate: '2020-01-20', reportsTo: 'emp-001', email: 'sunita@trs.co.in',    phone: '+91 98112 30045', monthlyGross: 165000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/003', bankAccount: 'ICICI ****4590', pan: 'AGZPS3456N' },
  { id: 'emp-004', code: 'TRS-004', name: 'Abhisek Verma',       designation: 'Regional Manager — South',  department: 'Sales',       branchId: 'br-002', type: 'permanent', joinDate: '2020-08-11', reportsTo: 'emp-001', email: 'abhisek@trs.co.in',   phone: '+91 98453 01001', monthlyGross: 195000, status: 'active', documentsComplete: true, pfNumber: 'KA/BLR/45001/004', bankAccount: 'HDFC ****9012',  pan: 'AABPV4567P' },
  { id: 'emp-005', code: 'TRS-005', name: 'Rahul Tomar',         designation: 'Regional Manager — EWN',     department: 'Sales',       branchId: 'br-001', type: 'permanent', joinDate: '2020-10-05', reportsTo: 'emp-001', email: 'rahul.tomar@trs.co.in', phone: '+91 98110 44210', monthlyGross: 195000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/005', bankAccount: 'HDFC ****3456',  pan: 'AAOPT5678Q' },
  { id: 'emp-006', code: 'TRS-006', name: 'Manoj Kumar',         designation: 'Buying Head',                department: 'Buying',      branchId: 'br-001', type: 'permanent', joinDate: '2019-11-04', reportsTo: 'emp-001', email: 'manoj@trs.co.in',      phone: '+91 98115 22011', monthlyGross: 175000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/006', bankAccount: 'HDFC ****7890',  pan: 'AAKPM6789R' },
  { id: 'emp-007', code: 'TRS-007', name: 'Umesh Gupta',         designation: 'Manager — Buying, Books',    department: 'Buying',      branchId: 'br-001', type: 'permanent', joinDate: '2021-02-20', reportsTo: 'emp-006', email: 'umesh@trs.co.in',      phone: '+91 98111 55066', monthlyGross: 105000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/007', bankAccount: 'SBI ****2244',   pan: 'AAKPG7890S' },
  { id: 'emp-008', code: 'TRS-008', name: 'Nikita Sarang',       designation: 'Manager — Marketing & CS',   department: 'Marketing',   branchId: 'br-002', type: 'permanent', joinDate: '2022-05-11', reportsTo: 'emp-004', email: 'nikita@trs.co.in',    phone: '+91 96400 22102', monthlyGross: 98000,  status: 'active', documentsComplete: true, pfNumber: 'KA/BLR/45001/008', bankAccount: 'ICICI ****6603',  pan: 'ABRPS8901T' },
  { id: 'emp-009', code: 'TRS-009', name: 'Zoya Malik',          designation: 'Manager — VM & Training',    department: 'Retail Ops',   branchId: 'br-001', type: 'permanent', joinDate: '2021-08-30', reportsTo: 'emp-001', email: 'zoya@trs.co.in',       phone: '+91 98185 66011', monthlyGross: 95000,  status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/009', bankAccount: 'HDFC ****4488',  pan: 'AXRPM9012U' },
  { id: 'emp-010', code: 'TRS-010', name: 'Shubham Jaiswal',     designation: 'Sr. Manager — Business Dev',  department: 'Sales',       branchId: 'br-001', type: 'permanent', joinDate: '2019-04-01', reportsTo: 'emp-001', email: 'shubham@trs.co.in',   phone: '+91 98107 88011', monthlyGross: 145000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/010', bankAccount: 'HDFC ****1122',  pan: 'AAPPJ0123V' },
  { id: 'emp-011', code: 'TRS-011', name: 'Sunil Sharma',        designation: 'Sr. Manager — Supply Chain', department: 'Supply Chain', branchId: 'br-001', type: 'permanent', joinDate: '2018-09-15', reportsTo: 'emp-001', email: 'sunil@trs.co.in',      phone: '+91 98115 33099', monthlyGross: 155000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/011', bankAccount: 'ICICI ****3312',  pan: 'AKKPS1234W' },
  { id: 'emp-012', code: 'TRS-012', name: 'Amit Kumar',          designation: 'Manager — IT',                department: 'Technology',    branchId: 'br-001', type: 'permanent', joinDate: '2020-11-20', reportsTo: 'emp-001', email: 'amit@trs.co.in',       phone: '+91 98110 44499', monthlyGross: 128000, status: 'active', documentsComplete: true, pfNumber: 'DL/CPM/78921/012', bankAccount: 'HDFC ****5566',  pan: 'AZKPK2345X' },
  { id: 'emp-013', code: 'TRS-013', name: 'Rahul Tomar (Field)',  designation: 'Field Sales Executive',       department: 'Sales',       branchId: 'br-002', type: 'contract',   joinDate: '2023-04-01', reportsTo: 'emp-004', email: 'rt.field@trs.co.in',  phone: '+91 98453 22110', monthlyGross: 42000,  status: 'active', documentsComplete: false, bankAccount: 'SBI ****7712',   pan: 'AJRPT3456Y' },
  { id: 'emp-014', code: 'TRS-014', name: 'Kavitha S.',           designation: 'Store Supervisor',            department: 'Retail Ops',   branchId: 'br-002', type: 'permanent',  joinDate: '2022-01-10', reportsTo: 'emp-004', email: 'kavitha@trs.co.in',   phone: '+91 90140 22334', monthlyGross: 48000,  status: 'active', documentsComplete: true, pfNumber: 'KA/BLR/45001/014', bankAccount: 'HDFC ****9034',  pan: 'AXAPS4567Z' },
  { id: 'emp-015', code: 'TRS-015', name: 'Ravi Kumar',           designation: 'Warehouse Supervisor',        department: 'Supply Chain', branchId: 'br-005', type: 'permanent',  joinDate: '2021-06-01', reportsTo: 'emp-011', email: 'ravi.k@trs.co.in',   phone: '+91 94470 55889', monthlyGross: 52000,  status: 'active', documentsComplete: true, pfNumber: 'KL/COK/33001/015', bankAccount: 'SBI ****4432',   pan: 'AKZPR5678A' },
  { id: 'emp-016', code: 'TRS-016', name: 'Priya S.',             designation: 'Accountant',                   department: 'Finance',     branchId: 'br-003', type: 'permanent',  joinDate: '2022-04-11', reportsTo: 'emp-002', email: 'priya@trs.co.in',    phone: '+91 98200 11111', monthlyGross: 62000,  status: 'active', documentsComplete: true, pfNumber: 'MH/BOM/22001/016', bankAccount: 'HDFC ****8899', pan: 'AAKPS6789B' },
  { id: 'emp-017', code: 'TRS-017', name: 'Neeraj D.',            designation: 'Data Analyst',                 department: 'Technology',    branchId: 'br-001', type: 'intern',     joinDate: '2026-07-15', reportsTo: 'emp-012', email: 'neeraj@trs.co.in',   phone: '+91 88220 40021', monthlyGross: 25000,  status: 'active', documentsComplete: false, pan: 'ATAPD7890C' },
  { id: 'emp-018', code: 'TRS-018', name: 'B. Chatterjee',        designation: 'Sub-Branch Manager',           department: 'Sales',       branchId: 'br-007', type: 'permanent',  joinDate: '2024-06-30', reportsTo: 'emp-005', email: 'bc@trs.co.in',       phone: '+91 90520 33001', monthlyGross: 82000,  status: 'active', documentsComplete: true, pfNumber: 'WB/CCU/11001/018', bankAccount: 'ICICI ****5522',  pan: 'AKZPC8901D' },
];

export function loadEmployees(): Employee[] { return read(EMP_KEY, SEED_EMPLOYEES); }
export function saveEmployee(e: Employee) { upsert(EMP_KEY, SEED_EMPLOYEES, e); }
export function deleteEmployee(id: string) { del(EMP_KEY, SEED_EMPLOYEES, id); }

// ---------------------------------------------------------------------------
// Attendance summary — one row per employee per month
// ---------------------------------------------------------------------------

export interface AttendanceRow {
  id: string;
  employeeId: string;
  period: string; // YYYY-MM
  workingDays: number;
  present: number;
  paidLeave: number;
  unpaidLeave: number;
  sickLeave: number;
  weekOff: number;
  latePunches: number;
  fieldDays: number;
}

const ATT_KEY = 'trs.erp.attendance.v1';

export const SEED_ATTENDANCE: AttendanceRow[] = [
  { id: 'att-001', employeeId: 'emp-001', period: '2026-09', workingDays: 26, present: 24, paidLeave: 2, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 5 },
  { id: 'att-002', employeeId: 'emp-002', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 1, fieldDays: 0 },
  { id: 'att-003', employeeId: 'emp-003', period: '2026-09', workingDays: 26, present: 25, paidLeave: 1, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 2, fieldDays: 0 },
  { id: 'att-004', employeeId: 'emp-004', period: '2026-09', workingDays: 26, present: 23, paidLeave: 0, unpaidLeave: 0, sickLeave: 1, weekOff: 4, latePunches: 0, fieldDays: 12 },
  { id: 'att-005', employeeId: 'emp-005', period: '2026-09', workingDays: 26, present: 25, paidLeave: 0, unpaidLeave: 1, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 14 },
  { id: 'att-006', employeeId: 'emp-006', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 2 },
  { id: 'att-007', employeeId: 'emp-007', period: '2026-09', workingDays: 26, present: 24, paidLeave: 2, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 3, fieldDays: 1 },
  { id: 'att-008', employeeId: 'emp-008', period: '2026-09', workingDays: 26, present: 22, paidLeave: 4, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 2, fieldDays: 6 },
  { id: 'att-009', employeeId: 'emp-009', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 4 },
  { id: 'att-010', employeeId: 'emp-010', period: '2026-09', workingDays: 26, present: 25, paidLeave: 1, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 1, fieldDays: 8 },
  { id: 'att-011', employeeId: 'emp-011', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 3 },
  { id: 'att-012', employeeId: 'emp-012', period: '2026-09', workingDays: 26, present: 24, paidLeave: 2, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 0 },
  { id: 'att-013', employeeId: 'emp-013', period: '2026-09', workingDays: 26, present: 20, paidLeave: 0, unpaidLeave: 6, sickLeave: 0, weekOff: 4, latePunches: 4, fieldDays: 18 },
  { id: 'att-014', employeeId: 'emp-014', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 1, fieldDays: 0 },
  { id: 'att-015', employeeId: 'emp-015', period: '2026-09', workingDays: 26, present: 25, paidLeave: 1, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 0 },
  { id: 'att-016', employeeId: 'emp-016', period: '2026-09', workingDays: 26, present: 25, paidLeave: 0, unpaidLeave: 0, sickLeave: 1, weekOff: 4, latePunches: 2, fieldDays: 0 },
  { id: 'att-017', employeeId: 'emp-017', period: '2026-09', workingDays: 26, present: 24, paidLeave: 2, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 3, fieldDays: 0 },
  { id: 'att-018', employeeId: 'emp-018', period: '2026-09', workingDays: 26, present: 26, paidLeave: 0, unpaidLeave: 0, sickLeave: 0, weekOff: 4, latePunches: 0, fieldDays: 6 },
];

export function loadAttendance(): AttendanceRow[] { return read(ATT_KEY, SEED_ATTENDANCE); }
export function saveAttendance(a: AttendanceRow) { upsert(ATT_KEY, SEED_ATTENDANCE, a); }

// ---------------------------------------------------------------------------
// Leave applications
// ---------------------------------------------------------------------------

export type LeaveType = 'casual' | 'sick' | 'earned' | 'unpaid' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface LeaveApplication {
  id: string;
  employeeId: string;
  type: LeaveType;
  from: string;
  to: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  approvedBy?: string;
  decisionAt?: string;
  balanceBefore: number;
  balanceAfter: number;
}

const LV_KEY = 'trs.erp.leave.v1';

export const SEED_LEAVES: LeaveApplication[] = [
  { id: 'lv-001', employeeId: 'emp-008', type: 'casual',   from: '2026-09-19', to: '2026-09-20', days: 2, reason: 'Family function',       status: 'pending',  appliedAt: '2026-09-15', balanceBefore: 6, balanceAfter: 4 },
  { id: 'lv-002', employeeId: 'emp-013', type: 'unpaid',   from: '2026-09-22', to: '2026-09-25', days: 4, reason: 'Personal',              status: 'pending',  appliedAt: '2026-09-16', balanceBefore: 0, balanceAfter: 0 },
  { id: 'lv-003', employeeId: 'emp-014', type: 'sick',     from: '2026-09-11', to: '2026-09-11', days: 1, reason: 'Fever',                 status: 'approved', appliedAt: '2026-09-11', approvedBy: 'emp-004', decisionAt: '2026-09-11', balanceBefore: 8, balanceAfter: 7 },
  { id: 'lv-004', employeeId: 'emp-003', type: 'earned',   from: '2026-10-02', to: '2026-10-07', days: 4, reason: 'Vacation with family',  status: 'approved', appliedAt: '2026-09-09', approvedBy: 'emp-001', decisionAt: '2026-09-10', balanceBefore: 14, balanceAfter: 10 },
  { id: 'lv-005', employeeId: 'emp-017', type: 'casual',   from: '2026-09-16', to: '2026-09-17', days: 2, reason: 'Convocation',           status: 'approved', appliedAt: '2026-09-08', approvedBy: 'emp-012', decisionAt: '2026-09-09', balanceBefore: 6, balanceAfter: 4 },
  { id: 'lv-006', employeeId: 'emp-016', type: 'sick',     from: '2026-09-16', to: '2026-09-16', days: 1, reason: 'Medical checkup',       status: 'approved', appliedAt: '2026-09-15', approvedBy: 'emp-002', decisionAt: '2026-09-15', balanceBefore: 6, balanceAfter: 5 },
  { id: 'lv-007', employeeId: 'emp-010', type: 'earned',   from: '2026-11-04', to: '2026-11-08', days: 4, reason: 'Wedding travel',        status: 'pending',  appliedAt: '2026-09-17', balanceBefore: 12, balanceAfter: 8 },
];

export function loadLeaves(): LeaveApplication[] { return read(LV_KEY, SEED_LEAVES); }
export function saveLeave(l: LeaveApplication) { upsert(LV_KEY, SEED_LEAVES, l); }
