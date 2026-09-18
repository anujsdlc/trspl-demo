'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Lock, Users, Shield, Activity, Search, X, ShieldCheck, ShieldAlert,
  Key, LogIn, Building2, Plus, Edit2, Trash2, AlertTriangle,
} from 'lucide-react';
import {
  loadUsers, saveUser, deleteUser, SEED_USERS,
  loadRoles, saveRole, SEED_ROLES,
  loadAudit, SEED_AUDIT,
  type User, type UserStatus, type Role, type AuditEvent,
} from '@/lib/erp/phase6';
import { loadBranches, SEED_BRANCHES, type Branch } from '@/lib/erp/foundations';
import { KPI, Th, StatusPill } from './ui';

type Tab = 'users' | 'roles' | 'audit' | 'policy';

const USER_TONE: Record<UserStatus, 'success' | 'warning' | 'danger' | 'muted'> = {
  active: 'success', invited: 'warning', locked: 'danger', disabled: 'muted',
};

export function SecurityConsole() {
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>(SEED_USERS);
  const [roles, setRoles] = useState<Role[]>(SEED_ROLES);
  const [audit, setAudit] = useState<AuditEvent[]>(SEED_AUDIT);
  const [branches, setBranches] = useState(SEED_BRANCHES);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    loadUsers().then(setUsers);
    loadRoles().then(setRoles);
    loadAudit().then(setAudit);
    loadBranches().then(setBranches);
    setHydrated(true);
  }, []);
  function refresh() { loadUsers().then(setUsers); loadRoles().then(setRoles); }

  const kpi = useMemo(() => ({
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    twofa: users.filter(u => u.twoFactorEnabled).length,
    locked: users.filter(u => u.status === 'locked' || u.failedLoginAttempts >= 3).length,
  }), [users]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <Lock className="w-3 h-3" /> Admin
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Security &amp; Access</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Users, roles, scoped access (branch / GSTIN / warehouse), audit trail, and password policies.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Total users" value={kpi.total.toString()} />
        <KPI label="Active" value={kpi.active.toString()} accent="success" />
        <KPI label="2FA enabled" value={`${kpi.twofa}/${kpi.total}`} accent={kpi.twofa === kpi.total ? 'success' : 'warn'} />
        <KPI label="Locked / risk" value={kpi.locked.toString()} accent={kpi.locked > 0 ? 'danger' : undefined} />
      </div>

      <div className="flex items-center gap-1 border-b border-[color:var(--color-line)] mb-4 overflow-x-auto">
        {([
          ['users', 'Users', Users],
          ['roles', 'Roles', Shield],
          ['audit', 'Audit trail', Activity],
          ['policy', 'Password policy', Key],
        ] as [Tab, string, React.ElementType][]).map(([k, label, Icon]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-11 px-4 text-sm inline-flex items-center gap-2 border-b-2 transition ${
            tab === k ? 'border-[color:var(--color-crimson)] text-[color:var(--color-crimson)]' : 'border-transparent text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-ink)]'
          }`}>
            <Icon className="w-3.5 h-3.5" /> {label}
          </button>
        ))}
      </div>

      {tab === 'users' && <UsersTab users={users} roles={roles} branches={branches} hydrated={hydrated} onSave={u => { saveUser(u); refresh(); }} onDelete={id => { if (confirm('Delete user?')) { deleteUser(id); refresh(); } }} />}
      {tab === 'roles' && <RolesTab roles={roles} users={users} />}
      {tab === 'audit' && <AuditTab audit={audit} users={users} />}
      {tab === 'policy' && <PolicyTab />}
    </div>
  );
}

function UsersTab({ users, roles, branches, hydrated, onSave, onDelete }: {
  users: User[]; roles: Role[]; branches: Branch[];
  hydrated: boolean;
  onSave: (u: User) => void; onDelete: (id: string) => void;
}) {
  const roleById = useMemo(() => new Map(roles.map(r => [r.id, r])), [roles]);
  const branchById = useMemo(() => new Map(branches.map(b => [b.id, b])), [branches]);
  const [q, setQ] = useState('');

  const filtered = useMemo(() => {
    if (!q) return users;
    const s = q.toLowerCase();
    return users.filter(u =>
      u.name.toLowerCase().includes(s) || u.email.toLowerCase().includes(s) || u.code.toLowerCase().includes(s) ||
      (roleById.get(u.roleId)?.name.toLowerCase().includes(s) ?? false)
    );
  }, [users, q, roleById]);

  return (
    <>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search name, email, code, role…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5">
          <Plus className="w-3.5 h-3.5" /> Invite user
        </button>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${users.length}` : 'loading…'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
              <Th label="Code" className="w-20" />
              <Th label="User" />
              <Th label="Role" className="w-40" />
              <Th label="Scope" className="w-52" />
              <Th label="Last login" className="w-40" />
              <Th label="2FA" className="w-16 text-center" />
              <Th label="Status" className="w-24" />
              <th className="w-16"></th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} className={`border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30 ${u.failedLoginAttempts >= 3 ? 'bg-[color:var(--color-danger)]/5' : ''}`}>
                <td className="px-3 py-3 font-mono text-xs">{u.code}</td>
                <td className="px-3 py-3">
                  <div className="font-medium">{u.name}</div>
                  <div className="text-[11px] text-[color:var(--color-ink-muted)]">{u.email} · {u.phone}</div>
                </td>
                <td className="px-3 py-3 text-xs">
                  <div>{roleById.get(u.roleId)?.name ?? u.roleId}</div>
                  {roleById.get(u.roleId)?.builtIn && <div className="text-[10px] text-[color:var(--color-ink-muted)]">built-in</div>}
                </td>
                <td className="px-3 py-3 text-xs">
                  <div className="flex flex-wrap gap-1">
                    {u.branchScope.includes('*') ? (
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[color:var(--color-crimson)]/10 text-[color:var(--color-crimson)]"><Building2 className="w-3 h-3" /> All branches</span>
                    ) : (
                      u.branchScope.map(id => <span key={id} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]">{branchById.get(id)?.code ?? id}</span>)
                    )}
                    {u.gstinScope.includes('*') && (
                      <span className="text-[10px] uppercase tracking-widest px-1.5 py-0.5 rounded bg-[color:var(--color-crimson)]/10 text-[color:var(--color-crimson)]">All GSTINs</span>
                    )}
                  </div>
                </td>
                <td className="px-3 py-3 text-xs">
                  <div className="font-mono">{u.lastLoginAt ?? '—'}</div>
                  <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{u.lastLoginIp ?? ''}</div>
                  {u.failedLoginAttempts >= 3 && (
                    <div className="text-[10px] text-[color:var(--color-danger)] font-mono flex items-center gap-0.5 mt-0.5">
                      <AlertTriangle className="w-3 h-3" /> {u.failedLoginAttempts} failed attempts
                    </div>
                  )}
                </td>
                <td className="px-3 py-3 text-center">
                  {u.twoFactorEnabled
                    ? <ShieldCheck className="w-4 h-4 text-[color:var(--color-success)] mx-auto" />
                    : <ShieldAlert className="w-4 h-4 text-[color:var(--color-warning)] mx-auto" />}
                </td>
                <td className="px-3 py-3">
                  <StatusPill status={u.status} tone={USER_TONE[u.status]} />
                </td>
                <td className="px-3 py-3 text-right">
                  <button onClick={() => onDelete(u.id)} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

function RolesTab({ roles, users }: { roles: Role[]; users: User[] }) {
  const usersByRole = useMemo(() => {
    const m = new Map<string, number>();
    for (const u of users) m.set(u.roleId, (m.get(u.roleId) ?? 0) + 1);
    return m;
  }, [users]);
  return (
    <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
      {roles.map(r => (
        <div key={r.id} className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
          <div className="flex items-start justify-between mb-2">
            <div>
              <div className="font-serif text-xl">{r.name}</div>
              <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{r.id}</div>
            </div>
            {r.builtIn && <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]">built-in</span>}
          </div>
          <p className="text-xs text-[color:var(--color-ink-soft)] mt-1 mb-4">{r.description}</p>
          <div className="mb-3 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Permissions</div>
          <div className="flex flex-wrap gap-1">
            {r.permissions.map(p => (
              <span key={p} className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[color:var(--color-paper)]">{p}</span>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-[color:var(--color-line)] flex items-center justify-between text-xs">
            <span className="text-[color:var(--color-ink-muted)]">Assigned to</span>
            <span className="font-medium">{usersByRole.get(r.id) ?? 0} user{(usersByRole.get(r.id) ?? 0) === 1 ? '' : 's'}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function AuditTab({ audit, users }: { audit: AuditEvent[]; users: User[] }) {
  const userById = useMemo(() => new Map(users.map(u => [u.id, u])), [users]);
  const [q, setQ] = useState('');
  const filtered = useMemo(() => {
    if (!q) return audit;
    const s = q.toLowerCase();
    return audit.filter(e => e.module.includes(s) || e.action.includes(s) || (e.entity?.toLowerCase().includes(s) ?? false) || e.ip.includes(s) || (userById.get(e.userId)?.name.toLowerCase().includes(s) ?? false));
  }, [audit, q, userById]);
  return (
    <>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search action, module, entity, user, IP…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {filtered.length} of {audit.length} events
        </div>
      </div>
      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
              <Th label="Timestamp" className="w-40" />
              <Th label="User" />
              <Th label="Action" className="w-32" />
              <Th label="Module" className="w-28" />
              <Th label="Entity" className="w-56" />
              <Th label="IP" className="w-32" />
            </tr>
          </thead>
          <tbody>
            {filtered.map(e => {
              const u = userById.get(e.userId);
              const failed = e.action === 'login-failed';
              return (
                <tr key={e.id} className={`border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30 ${failed ? 'bg-[color:var(--color-danger)]/5' : ''}`}>
                  <td className="px-3 py-2 font-mono text-xs">{e.at}</td>
                  <td className="px-3 py-2 text-xs">
                    <div>{u?.name ?? e.userId}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">{u?.code}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded ${
                      failed ? 'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]' :
                      e.action === 'login' ? 'bg-[color:var(--color-cobalt)]/10 text-[color:var(--color-cobalt)]' :
                      e.action === 'export' ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                      'bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]'
                    }`}>{e.action}</span>
                  </td>
                  <td className="px-3 py-2 text-xs capitalize">{e.module}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.entity ?? '—'}</td>
                  <td className="px-3 py-2 font-mono text-xs">{e.ip}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

function PolicyTab() {
  return (
    <div className="grid md:grid-cols-2 gap-4">
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
          <Key className="w-3 h-3" /> Password policy
        </div>
        <div className="space-y-2 text-sm">
          <PolicyRow label="Minimum length" value="12 characters" />
          <PolicyRow label="Must include" value="Upper, lower, number, symbol" />
          <PolicyRow label="Rotation" value="Every 90 days" />
          <PolicyRow label="Prevent reuse" value="Last 6 passwords" />
          <PolicyRow label="Failed-attempt lockout" value="After 5 tries · 30 min unlock" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
          <ShieldCheck className="w-3 h-3" /> Session &amp; auth
        </div>
        <div className="space-y-2 text-sm">
          <PolicyRow label="Session timeout" value="30 min idle" />
          <PolicyRow label="Concurrent sessions" value="Blocked · latest wins" />
          <PolicyRow label="Two-factor for Admins" value="Mandatory" />
          <PolicyRow label="Two-factor for others" value="Recommended · nudge weekly" />
          <PolicyRow label="SSO" value="Google Workspace OIDC" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
          <LogIn className="w-3 h-3" /> Access controls
        </div>
        <div className="space-y-2 text-sm">
          <PolicyRow label="Branch-scoped access" value="Enforced per user" />
          <PolicyRow label="GSTIN-scoped access" value="Enforced per user" />
          <PolicyRow label="Warehouse-scoped access" value="Enforced per user" />
          <PolicyRow label="Record-level rules" value="Branch + GSTIN + warehouse" />
        </div>
      </div>
      <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 flex items-center gap-1.5">
          <Activity className="w-3 h-3" /> Audit &amp; monitoring
        </div>
        <div className="space-y-2 text-sm">
          <PolicyRow label="Audit retention" value="7 years" />
          <PolicyRow label="Immutable log" value="Write-once storage" />
          <PolicyRow label="Suspicious activity alerts" value="On" />
          <PolicyRow label="Data-export approval" value="Finance Manager + above" />
        </div>
      </div>
    </div>
  );
}

function PolicyRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-[color:var(--color-line)] pb-2 last:border-0 last:pb-0">
      <span className="text-[color:var(--color-ink-muted)]">{label}</span>
      <span className="font-mono text-xs">{value}</span>
    </div>
  );
}
