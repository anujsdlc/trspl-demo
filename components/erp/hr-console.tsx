'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  UserRound,
  Plus,
  Search,
  X,
  Edit2,
  Trash2,
  Calendar,
  ClipboardCheck,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  loadEmployees,
  saveEmployee,
  deleteEmployee,
  SEED_EMPLOYEES,
  loadAttendance,
  SEED_ATTENDANCE,
  loadLeaves,
  saveLeave,
  SEED_LEAVES,
  type Employee,
  type EmployeeType,
  type LeaveApplication,
  type LeaveStatus,
  type AttendanceRow,
} from '@/lib/erp/phase5';
import { loadBranches, SEED_BRANCHES, type Branch } from '@/lib/erp/foundations';
import { inr } from '@/lib/utils';
import { KPI, Th, StatusPill, Field } from './ui';

type Tab = 'employees' | 'attendance' | 'leaves' | 'payroll';

const TYPES: EmployeeType[] = ['permanent', 'contract', 'consultant', 'intern'];

const LEAVE_TONE: Record<LeaveStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  approved: 'success', pending: 'warning', rejected: 'danger', cancelled: 'muted',
};

export function HRConsole() {
  const [tab, setTab] = useState<Tab>('employees');
  const [employees, setEmployees] = useState<Employee[]>(SEED_EMPLOYEES);
  const [attendance, setAttendance] = useState(SEED_ATTENDANCE);
  const [leaves, setLeaves] = useState(SEED_LEAVES);
  const [branches, setBranches] = useState(SEED_BRANCHES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadEmployees().then(setEmployees);
    loadAttendance().then(setAttendance);
    loadLeaves().then(setLeaves);
    loadBranches().then(setBranches);
    setHydrated(true);
  }, []);

  function refresh() {
    loadEmployees().then(setEmployees);
    loadAttendance().then(setAttendance);
    loadLeaves().then(setLeaves);
  }

  const kpi = useMemo(() => ({
    total: employees.length,
    active: employees.filter(e => e.status === 'active').length,
    pending: leaves.filter(l => l.status === 'pending').length,
    monthlyPayroll: employees.filter(e => e.status === 'active').reduce((s, e) => s + e.monthlyGross, 0),
  }), [employees, leaves]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <UserRound className="w-3 h-3" /> Insight
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">HR &amp; Attendance</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Employee master, monthly attendance summary, leave workflow, and payroll input register.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Headcount" value={kpi.total.toString()} />
        <KPI label="Active" value={kpi.active.toString()} accent="success" />
        <KPI label="Leaves pending" value={kpi.pending.toString()} accent={kpi.pending > 0 ? 'warn' : undefined} />
        <KPI label="Monthly payroll (gross)" value={inr(kpi.monthlyPayroll)} accent="crimson" />
      </div>

      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-4 overflow-x-auto">
        {([
          ['employees', 'Employees', UserRound],
          ['attendance', 'Attendance', ClipboardCheck],
          ['leaves', 'Leaves', Calendar],
          ['payroll', 'Payroll register', TrendingUp],
        ] as [Tab, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-11 px-4 text-sm inline-flex items-center gap-2 border-b-2 transition ${
            tab === k ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
          }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
            {k === 'leaves' && kpi.pending > 0 && (
              <span className="text-[9px] font-mono bg-[color:var(--color-warning)] text-white px-1.5 py-0.5 rounded-full">{kpi.pending}</span>
            )}
          </button>
        ))}
      </div>

      {tab === 'employees' && <EmployeesTab employees={employees} branches={branches} onSave={e => { saveEmployee(e); refresh(); }} onDelete={id => { if (confirm('Delete employee?')) { deleteEmployee(id); refresh(); } }} hydrated={hydrated} />}
      {tab === 'attendance' && <AttendanceTab attendance={attendance} employees={employees} />}
      {tab === 'leaves' && <LeavesTab leaves={leaves} employees={employees} onDecide={(l, s) => { saveLeave({ ...l, status: s, approvedBy: 'emp-001', decisionAt: new Date().toISOString().slice(0, 10) }); refresh(); }} />}
      {tab === 'payroll' && <PayrollTab employees={employees} attendance={attendance} />}
    </div>
  );
}

function EmployeesTab({ employees, branches, onSave, onDelete, hydrated }: {
  employees: Employee[];
  branches: Branch[];
  onSave: (e: Employee) => void;
  onDelete: (id: string) => void;
  hydrated: boolean;
}) {
  const branchById = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const [q, setQ] = useState('');
  const [typeFilter, setTypeFilter] = useState<EmployeeType | 'all'>('all');
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);

  const filtered = useMemo(() => {
    let arr = employees.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(e => e.name.toLowerCase().includes(s) || e.code.toLowerCase().includes(s) || e.designation.toLowerCase().includes(s) || e.department.toLowerCase().includes(s));
    }
    if (typeFilter !== 'all') arr = arr.filter(e => e.type === typeFilter);
    return arr;
  }, [employees, q, typeFilter]);

  return (
    <>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, code, designation, department…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="flex items-center gap-0 border border-[color:var(--color-line)] rounded-md overflow-hidden text-xs h-9">
          {(['all', ...TYPES] as const).map(t => (
            <button key={t} onClick={() => setTypeFilter(t)} className={`px-3 h-full capitalize ${typeFilter === t ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{t}</button>
          ))}
        </div>
        <button onClick={() => setCreating(true)} className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Add employee
        </button>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${employees.length}` : 'loading…'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Code" className="w-24" />
                <Th label="Employee" />
                <Th label="Department" className="w-32" />
                <Th label="Branch" className="w-40" />
                <Th label="Type" className="w-24" />
                <Th label="Joined" className="w-24" />
                <Th label="Monthly gross" align="right" className="w-32" />
                <Th label="Status" className="w-24" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={9} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No employees match.</td></tr>}
              {filtered.map(e => (
                <tr key={e.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-3 py-3 font-mono text-xs">{e.code}</td>
                  <td className="px-3 py-3">
                    <div className="font-medium">{e.name}</div>
                    <div className="text-[11px] text-[color:var(--color-ink-muted)]">{e.designation}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">{e.department}</td>
                  <td className="px-3 py-3 text-xs">
                    <div>{branchById.get(e.branchId)?.name ?? e.branchId}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{branchById.get(e.branchId)?.code}</div>
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] capitalize">{e.type}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{e.joinDate}</td>
                  <td className="px-3 py-3 text-right font-mono">{inr(e.monthlyGross)}</td>
                  <td className="px-3 py-3">
                    <StatusPill status={e.status} tone={e.status === 'active' ? 'success' : e.status === 'on-leave' ? 'warning' : e.status === 'notice' ? 'warning' : 'muted'} />
                    {!e.documentsComplete && <div className="text-[9px] text-[color:var(--color-warning)] mt-0.5">docs missing</div>}
                  </td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditing(e)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => onDelete(e.id)} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && <EmployeeModal branches={branches} row={editing} onClose={() => { setCreating(false); setEditing(null); }} onSave={e => { onSave(e); setCreating(false); setEditing(null); }} />}
    </>
  );
}

function EmployeeModal({ row, branches, onClose, onSave }: { row: Employee | null; branches: Branch[]; onClose: () => void; onSave: (e: Employee) => void }) {
  const [form, setForm] = useState<Employee>(row ?? {
    id: `emp-${Date.now().toString(36)}`, code: '', name: '', designation: '',
    department: 'Sales', branchId: branches[0]?.id ?? 'br-001', type: 'permanent',
    joinDate: new Date().toISOString().slice(0, 10), email: '', phone: '',
    monthlyGross: 50000, status: 'active', documentsComplete: false,
  });
  const [error, setError] = useState('');
  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!form.code.trim() || !form.name.trim() || !form.designation.trim()) { setError('Code, name, and designation are required'); return; }
    onSave(form);
  }
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-2xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{row ? 'Edit employee' : 'New employee'}</div>
            <div className="font-serif text-2xl leading-tight">{form.name || 'Employee'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}
          <div className="grid grid-cols-3 gap-3">
            <Field label="Code"><input value={form.code} onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-xs" /></Field>
            <Field label="Type" className="col-span-2">
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value as EmployeeType })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm capitalize">
                {TYPES.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Name"><input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Designation"><input value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Department">
              <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {['Leadership', 'Finance', 'HR', 'Sales', 'Buying', 'Marketing', 'Retail Ops', 'Supply Chain', 'Technology'].map(d => <option key={d}>{d}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Branch">
            <select value={form.branchId} onChange={e => setForm({ ...form, branchId: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
              {branches.map(b => <option key={b.id} value={b.id}>{b.code} · {b.name}</option>)}
            </select>
          </Field>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Phone"><input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Email" className="col-span-2"><input value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field label="Join date"><input type="date" value={form.joinDate} onChange={e => setForm({ ...form, joinDate: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Monthly gross (₹)"><input type="number" value={form.monthlyGross} onChange={e => setForm({ ...form, monthlyGross: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="PAN"><input value={form.pan ?? ''} onChange={e => setForm({ ...form, pan: e.target.value.toUpperCase() })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
          </div>
          <Field label="Status">
            <div className="grid grid-cols-4 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5">
              {(['active', 'on-leave', 'notice', 'exited'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{row ? 'Save' : 'Add'}</button>
        </div>
      </form>
    </div>
  );
}

function AttendanceTab({ attendance, employees }: { attendance: AttendanceRow[]; employees: Employee[] }) {
  const empById = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const totals = useMemo(() => ({
    avgPresent: attendance.length ? (attendance.reduce((s, a) => s + a.present, 0) / attendance.length).toFixed(1) : '0',
    totalLate: attendance.reduce((s, a) => s + a.latePunches, 0),
    fieldDays: attendance.reduce((s, a) => s + a.fieldDays, 0),
    absent: attendance.reduce((s, a) => s + a.unpaidLeave, 0),
  }), [attendance]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Avg present days" value={totals.avgPresent} />
        <KPI label="Total late punches" value={totals.totalLate.toString()} accent={totals.totalLate > 5 ? 'warn' : undefined} />
        <KPI label="Field days" value={totals.fieldDays.toString()} />
        <KPI label="Unpaid absent" value={totals.absent.toString()} accent={totals.absent > 0 ? 'danger' : undefined} />
      </div>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Employee" />
                <Th label="Period" className="w-24" />
                <Th label="Working" align="right" className="w-20" />
                <Th label="Present" align="right" className="w-20" />
                <Th label="Paid leave" align="right" className="w-24" />
                <Th label="Unpaid" align="right" className="w-20" />
                <Th label="Sick" align="right" className="w-20" />
                <Th label="Late" align="right" className="w-16" />
                <Th label="Field" align="right" className="w-16" />
              </tr>
            </thead>
            <tbody>
              {attendance.map(a => {
                const emp = empById.get(a.employeeId);
                return (
                  <tr key={a.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                    <td className="px-3 py-2">
                      <div>{emp?.name ?? a.employeeId}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{emp?.code} · {emp?.designation}</div>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{a.period}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{a.workingDays}</td>
                    <td className="px-3 py-2 text-right font-mono text-[color:var(--color-success)]">{a.present}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{a.paidLeave}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs text-[color:var(--color-danger)]">{a.unpaidLeave || ''}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{a.sickLeave}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{a.latePunches || ''}</td>
                    <td className="px-3 py-2 text-right font-mono text-xs">{a.fieldDays}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}

function LeavesTab({ leaves, employees, onDecide }: {
  leaves: LeaveApplication[]; employees: Employee[];
  onDecide: (l: LeaveApplication, status: LeaveStatus) => void;
}) {
  const empById = useMemo(() => new Map(employees.map(e => [e.id, e])), [employees]);
  const pending = leaves.filter(l => l.status === 'pending');
  const decided = leaves.filter(l => l.status !== 'pending');

  return (
    <div className="space-y-6">
      {pending.length > 0 && (
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-warning)] mb-3 flex items-center gap-2">
            <AlertTriangle className="w-3 h-3" /> {pending.length} pending
          </div>
          <div className="space-y-2">
            {pending.map(l => {
              const emp = empById.get(l.employeeId);
              return (
                <div key={l.id} className="bg-white rounded-lg border border-[color:var(--color-warning)]/40 p-4 flex flex-wrap items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="font-medium">{emp?.name}</div>
                      <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)] capitalize">{l.type}</span>
                    </div>
                    <div className="text-xs text-[color:var(--color-ink-muted)] mt-1">{l.from} → {l.to} · {l.days} day{l.days !== 1 ? 's' : ''} · Balance {l.balanceBefore} → {l.balanceAfter}</div>
                    <div className="text-xs text-[color:var(--color-ink-soft)] mt-1">{l.reason}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => onDecide(l, 'approved')} className="h-9 px-3 bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] rounded-md text-xs font-medium hover:bg-[color:var(--color-success)]/20 inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                    </button>
                    <button onClick={() => onDecide(l, 'rejected')} className="h-9 px-3 border border-[color:var(--color-danger)] text-[color:var(--color-danger)] rounded-md text-xs hover:bg-[color:var(--color-danger)]/10 inline-flex items-center gap-1.5">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div>
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Decided</div>
        <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                <Th label="Employee" />
                <Th label="Type" className="w-24" />
                <Th label="From" className="w-24" />
                <Th label="To" className="w-24" />
                <Th label="Days" align="right" className="w-16" />
                <Th label="Reason" />
                <Th label="Status" className="w-28" />
              </tr>
            </thead>
            <tbody>
              {decided.map(l => (
                <tr key={l.id} className="border-b border-[color:var(--color-line)] last:border-0">
                  <td className="px-3 py-2 text-xs">
                    <div>{empById.get(l.employeeId)?.name}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{empById.get(l.employeeId)?.code}</div>
                  </td>
                  <td className="px-3 py-2 text-xs capitalize">{l.type}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.from}</td>
                  <td className="px-3 py-2 font-mono text-xs">{l.to}</td>
                  <td className="px-3 py-2 text-right font-mono text-xs">{l.days}</td>
                  <td className="px-3 py-2 text-xs text-[color:var(--color-ink-soft)]">{l.reason}</td>
                  <td className="px-3 py-2">
                    <StatusPill status={l.status} tone={LEAVE_TONE[l.status]} />
                  </td>
                </tr>
              ))}
              {decided.length === 0 && <tr><td colSpan={7} className="px-4 py-8 text-center text-[color:var(--color-ink-muted)]">No decided leaves yet.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function PayrollTab({ employees, attendance }: { employees: Employee[]; attendance: AttendanceRow[] }) {
  const attById = useMemo(() => new Map(attendance.map(a => [a.employeeId, a])), [attendance]);
  const rows = useMemo(() => employees.filter(e => e.status === 'active').map(e => {
    const att = attById.get(e.id);
    const perDay = e.monthlyGross / 30;
    const unpaidDeduction = (att?.unpaidLeave ?? 0) * perDay;
    const grossPayable = e.monthlyGross - unpaidDeduction;
    const pf = e.type === 'permanent' ? Math.min(1800, e.monthlyGross * 0.12) : 0;
    const tds = grossPayable > 100000 ? grossPayable * 0.10 : grossPayable > 50000 ? grossPayable * 0.05 : 0;
    const net = grossPayable - pf - tds;
    return { employee: e, gross: e.monthlyGross, deduction: unpaidDeduction, pf, tds, net };
  }), [employees, attById]);

  const totals = useMemo(() => rows.reduce((acc, r) => ({
    gross: acc.gross + r.gross,
    net: acc.net + r.net,
    pf: acc.pf + r.pf,
    tds: acc.tds + r.tds,
  }), { gross: 0, net: 0, pf: 0, tds: 0 }), [rows]);

  return (
    <>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <KPI label="Gross this month" value={inr(totals.gross)} accent="crimson" />
        <KPI label="Net payable" value={inr(totals.net)} accent="success" />
        <KPI label="PF contribution" value={inr(totals.pf)} />
        <KPI label="TDS deducted" value={inr(totals.tds)} />
      </div>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
              <Th label="Employee" />
              <Th label="Gross" align="right" className="w-32" />
              <Th label="LOP deduction" align="right" className="w-32" />
              <Th label="PF" align="right" className="w-24" />
              <Th label="TDS" align="right" className="w-24" />
              <Th label="Net" align="right" className="w-32" />
            </tr>
          </thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.employee.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                <td className="px-3 py-2">
                  <div>{r.employee.name}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{r.employee.code} · {r.employee.designation}</div>
                </td>
                <td className="px-3 py-2 text-right font-mono">{inr(r.gross)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs text-[color:var(--color-danger)]">{r.deduction ? `−${inr(r.deduction)}` : ''}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{inr(r.pf)}</td>
                <td className="px-3 py-2 text-right font-mono text-xs">{inr(r.tds)}</td>
                <td className="px-3 py-2 text-right font-mono font-medium">{inr(r.net)}</td>
              </tr>
            ))}
            <tr className="bg-[color:var(--color-paper)]/40 font-medium">
              <td className="px-3 py-3 text-xs uppercase tracking-widest">Totals</td>
              <td className="px-3 py-3 text-right font-mono">{inr(totals.gross)}</td>
              <td></td>
              <td className="px-3 py-3 text-right font-mono">{inr(totals.pf)}</td>
              <td className="px-3 py-3 text-right font-mono">{inr(totals.tds)}</td>
              <td className="px-3 py-3 text-right font-mono">{inr(totals.net)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </>
  );
}
