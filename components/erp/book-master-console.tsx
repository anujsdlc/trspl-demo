'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  BookOpenText, Plus, Search, X, Edit2, Trash2, ArrowUpDown, Filter,
  Barcode, Layers, PenLine,
} from 'lucide-react';
import {
  loadBookMaster, saveBookMaster, deleteBookMaster, SEED_BOOK_MASTER,
  BOARDS, CLASSES, SUBJECTS, LANGUAGES, PUBLISHERS,
  type BookMaster, type Board, type Binding,
} from '@/lib/erp/foundations';
import { inr } from '@/lib/utils';

const BINDINGS: Binding[] = ['paperback', 'hardcover', 'spiral', 'ebook'];

export function BookMasterConsole() {
  const [rows, setRows] = useState<BookMaster[]>(SEED_BOOK_MASTER);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => { loadBookMaster().then(setRows); setHydrated(true); }, []);
  function refresh() { loadBookMaster().then(setRows); }

  const [q, setQ] = useState('');
  const [board, setBoard] = useState<Board | 'all'>('all');
  const [cls, setCls] = useState<string>('all');
  const [subject, setSubject] = useState<string>('all');
  const [publisher, setPublisher] = useState<string>('all');
  const [editing, setEditing] = useState<BookMaster | null>(null);
  const [creating, setCreating] = useState(false);

  const filtered = useMemo(() => {
    let arr = rows.slice();
    if (q) {
      const s = q.toLowerCase();
      arr = arr.filter(r =>
        r.title.toLowerCase().includes(s) ||
        r.isbn.includes(s) ||
        r.barcode.includes(s) ||
        r.publisher.toLowerCase().includes(s) ||
        r.subject.toLowerCase().includes(s) ||
        (r.author?.toLowerCase().includes(s) ?? false)
      );
    }
    if (board !== 'all') arr = arr.filter(r => r.board === board);
    if (cls !== 'all') arr = arr.filter(r => r.class === cls);
    if (subject !== 'all') arr = arr.filter(r => r.subject === subject);
    if (publisher !== 'all') arr = arr.filter(r => r.publisher === publisher);
    return arr;
  }, [rows, q, board, cls, subject, publisher]);

  const kpi = useMemo(() => ({
    titles: rows.length,
    boards: new Set(rows.map(r => r.board)).size,
    publishers: new Set(rows.map(r => r.publisher)).size,
    mrpValue: rows.reduce((s, r) => s + r.mrp, 0),
  }), [rows]);

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      <div className="flex items-end justify-between gap-3 flex-wrap mb-6">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-2">
            <BookOpenText className="w-3 h-3" /> Foundations
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Book Master</h1>
          <p className="text-sm text-[color:var(--color-ink-muted)] mt-1">
            Board · Class · Subject · Edition · Publisher · ISBN · Barcode — the extended title catalog every downstream module refers back to.
          </p>
        </div>
        <button onClick={() => setCreating(true)} className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)] transition inline-flex items-center gap-2">
          <Plus className="w-4 h-4" /> Add title
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <KPI label="Titles on file" value={kpi.titles.toLocaleString('en-IN')} icon={BookOpenText} />
        <KPI label="Boards covered" value={kpi.boards.toString()} icon={Layers} />
        <KPI label="Publishers" value={kpi.publishers.toString()} icon={PenLine} />
        <KPI label="Cover MRP" value={inr(kpi.mrpValue)} icon={Barcode} accent />
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 mb-4 flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] min-w-[280px] flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search title, ISBN, barcode, publisher, author…" className="flex-1 bg-transparent text-sm focus:outline-none" />
          {q && <button onClick={() => setQ('')}><X className="w-3.5 h-3.5" /></button>}
        </div>
        <Facet label="Board" value={board} onChange={v => setBoard(v as Board | 'all')} options={['all', ...BOARDS]} />
        <Facet label="Class" value={cls} onChange={setCls} options={['all', ...CLASSES]} />
        <Facet label="Subject" value={subject} onChange={setSubject} options={['all', ...SUBJECTS]} />
        <Facet label="Publisher" value={publisher} onChange={setPublisher} options={['all', ...PUBLISHERS]} />
        <div className="ml-auto text-xs text-[color:var(--color-ink-muted)] font-mono">
          {hydrated ? `${filtered.length} of ${rows.length}` : 'loading…'}
        </div>
      </div>

      <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                <Th label="ISBN / Barcode" className="w-44" />
                <Th label="Title" />
                <Th label="Board" className="w-24" />
                <Th label="Class" className="w-20" />
                <Th label="Subject" className="w-32" />
                <Th label="Publisher" />
                <Th label="Edition" className="w-24" />
                <Th label="MRP" align="right" className="w-24" />
                <Th label="Landed" align="right" className="w-24" />
                <Th label="GST" align="right" className="w-16" />
                <th className="w-24"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && <tr><td colSpan={11} className="px-4 py-10 text-center text-[color:var(--color-ink-muted)]">No titles match this filter.</td></tr>}
              {filtered.map(b => (
                <tr key={b.id} className="border-b border-[color:var(--color-line)] last:border-0 hover:bg-[color:var(--color-paper)]/30">
                  <td className="px-4 py-3">
                    <div className="font-mono text-xs">{b.isbn}</div>
                    <div className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{b.barcode}</div>
                  </td>
                  <td className="px-3 py-3">
                    <div className="font-medium leading-tight line-clamp-1">{b.title}</div>
                    {b.author && <div className="text-[11px] text-[color:var(--color-ink-muted)] line-clamp-1">by {b.author}</div>}
                  </td>
                  <td className="px-3 py-3">
                    <span className="text-[10px] uppercase tracking-widest px-2 py-0.5 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-soft)]">{b.board}</span>
                  </td>
                  <td className="px-3 py-3 font-mono text-xs">{b.class}</td>
                  <td className="px-3 py-3 text-xs">{b.subject}</td>
                  <td className="px-3 py-3 text-xs">
                    <div>{b.publisher}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)]">{b.language} · {b.binding}</div>
                  </td>
                  <td className="px-3 py-3 text-xs">
                    <div>{b.edition}</div>
                    <div className="text-[10px] text-[color:var(--color-ink-muted)]">{b.academicSession}</div>
                  </td>
                  <td className="px-3 py-3 text-right font-mono">{inr(b.mrp)}</td>
                  <td className="px-3 py-3 text-right font-mono text-[color:var(--color-ink-muted)]">{b.landedCost ? inr(b.landedCost) : '—'}</td>
                  <td className="px-3 py-3 text-right font-mono">{b.gstRate}%</td>
                  <td className="px-3 py-3 text-right">
                    <div className="inline-flex items-center gap-1">
                      <button onClick={() => setEditing(b)} className="p-1.5 hover:bg-[color:var(--color-paper)] rounded"><Edit2 className="w-3.5 h-3.5" /></button>
                      <button onClick={() => { if (confirm(`Delete "${b.title}"?`)) { deleteBookMaster(b.id); refresh(); } }} className="p-1.5 hover:bg-[color:var(--color-danger)]/10 rounded text-[color:var(--color-danger)]"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {(creating || editing) && (
        <BookMasterModal
          book={editing}
          onClose={() => { setCreating(false); setEditing(null); }}
          onSave={b => { saveBookMaster(b); refresh(); setCreating(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function KPI({ label, value, icon: Icon, accent }: { label: string; value: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={`bg-white rounded-lg border p-4 ${accent ? 'border-[color:var(--color-crimson)]' : 'border-[color:var(--color-line)]'}`}>
      <div className="flex items-center justify-between">
        <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
        <Icon className={`w-3.5 h-3.5 ${accent ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'}`} />
      </div>
      <div className="editorial-num text-3xl mt-1">{value}</div>
    </div>
  );
}

function Th({ label, align, className }: { label: string; align?: 'right'; className?: string }) {
  return (
    <th className={`px-3 py-2.5 ${align === 'right' ? 'text-right' : 'text-left'} ${className || ''}`}>
      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        {label} <ArrowUpDown className="w-3 h-3 text-[color:var(--color-ink-faint)]" />
      </span>
    </th>
  );
}

function Facet({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: string[] }) {
  return (
    <div className="relative h-9 flex items-center gap-1.5 px-3 border border-[color:var(--color-line)] rounded-md text-xs hover:bg-[color:var(--color-paper)] cursor-pointer">
      <Filter className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
      <span className="text-[color:var(--color-ink-muted)]">{label}:</span>
      <span className="font-medium capitalize">{value === 'all' ? 'All' : value}</span>
      <select value={value} onChange={e => onChange(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer">
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}

function BookMasterModal({ book, onClose, onSave }: { book: BookMaster | null; onClose: () => void; onSave: (b: BookMaster) => void }) {
  const [form, setForm] = useState<BookMaster>(book ?? {
    id: `bkm-${Date.now().toString(36)}`,
    isbn: '', barcode: '', title: '', board: 'CBSE', class: '10', subject: 'Mathematics',
    edition: '2026', academicSession: '2026-2027', publisher: 'NCERT',
    language: 'English', binding: 'paperback', mrp: 0, gstRate: 0, hsnCode: '4901',
    status: 'active', createdOn: new Date().toISOString().slice(0, 10),
  });
  const [error, setError] = useState('');

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!/^\d{10}(\d{3})?$/.test(form.isbn.replace(/-/g, ''))) { setError('ISBN must be 10 or 13 digits'); return; }
    if (!form.title.trim()) { setError('Title is required'); return; }
    if (form.mrp <= 0) { setError('MRP must be positive'); return; }
    onSave(form);
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4 overflow-y-auto animate-fade-in" onClick={onClose}>
      <form onSubmit={submit} className="w-full max-w-3xl bg-white rounded-xl shadow-2xl my-8 animate-slide-up" onClick={e => e.stopPropagation()}>
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{book ? 'Edit title' : 'New title'}</div>
            <div className="font-serif text-2xl leading-tight">{form.title || 'Book master'}</div>
          </div>
          <button type="button" onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4 text-sm max-h-[70vh] overflow-y-auto">
          {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}

          <div className="grid grid-cols-2 gap-3">
            <Field label="ISBN"><input value={form.isbn} onChange={e => setForm({ ...form, isbn: e.target.value })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="Barcode (GTIN/EAN)"><input value={form.barcode} onChange={e => setForm({ ...form, barcode: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
          </div>

          <Field label="Title"><input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Author(s)"><input value={form.author ?? ''} onChange={e => setForm({ ...form, author: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Publisher">
              <select value={form.publisher} onChange={e => setForm({ ...form, publisher: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {PUBLISHERS.map(p => <option key={p}>{p}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Field label="Board">
              <select value={form.board} onChange={e => setForm({ ...form, board: e.target.value as Board })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {BOARDS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
            <Field label="Class">
              <select value={form.class} onChange={e => setForm({ ...form, class: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {CLASSES.map(c => <option key={c}>{c}</option>)}
              </select>
            </Field>
            <Field label="Subject">
              <select value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {SUBJECTS.map(s => <option key={s}>{s}</option>)}
              </select>
            </Field>
            <Field label="Language">
              <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                {LANGUAGES.map(l => <option key={l}>{l}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <Field label="Edition"><input value={form.edition} onChange={e => setForm({ ...form, edition: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
            <Field label="Academic session"><input value={form.academicSession} onChange={e => setForm({ ...form, academicSession: e.target.value })} placeholder="2026-2027" className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            <Field label="Binding">
              <select value={form.binding} onChange={e => setForm({ ...form, binding: e.target.value as Binding })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm capitalize">
                {BINDINGS.map(b => <option key={b}>{b}</option>)}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <Field label="Pages"><input type="number" min={0} value={form.pages ?? ''} onChange={e => setForm({ ...form, pages: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="MRP (₹)"><input type="number" min={0} value={form.mrp} onChange={e => setForm({ ...form, mrp: Number(e.target.value) })} required className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="Landed cost (₹)"><input type="number" min={0} value={form.landedCost ?? ''} onChange={e => setForm({ ...form, landedCost: e.target.value ? Number(e.target.value) : undefined })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>
            <Field label="GST rate (%)">
              <select value={form.gstRate} onChange={e => setForm({ ...form, gstRate: Number(e.target.value) })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm">
                {[0, 5, 12, 18, 28].map(n => <option key={n} value={n}>{n}%</option>)}
              </select>
            </Field>
          </div>

          <Field label="HSN code"><input value={form.hsnCode} onChange={e => setForm({ ...form, hsnCode: e.target.value })} className="w-full h-10 px-3 border border-[color:var(--color-line)] rounded-md bg-white font-mono text-sm" /></Field>

          <Field label="Status">
            <div className="grid grid-cols-3 gap-1 h-10 border border-[color:var(--color-line)] rounded-md p-0.5 w-fit">
              {(['active', 'oos', 'discontinued'] as const).map(s => (
                <button key={s} type="button" onClick={() => setForm({ ...form, status: s })} className={`px-4 h-full rounded text-xs uppercase tracking-widest transition capitalize ${form.status === s ? 'bg-[color:var(--color-ink)] text-white' : 'hover:bg-[color:var(--color-paper)]'}`}>{s === 'oos' ? 'Out of stock' : s}</button>
              ))}
            </div>
          </Field>
        </div>
        <div className="px-6 py-4 border-t border-[color:var(--color-line)] flex justify-end gap-2">
          <button type="button" onClick={onClose} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm">Cancel</button>
          <button type="submit" className="h-10 px-6 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm font-medium hover:bg-[color:var(--color-crimson)]">{book ? 'Save changes' : 'Add title'}</button>
        </div>
      </form>
    </div>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      {children}
    </div>
  );
}
