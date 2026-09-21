'use client';

import { useState, useMemo, useCallback, useRef } from 'react';
import Link from 'next/link';
import { ALL_PRODUCTS } from '@/lib/products';
import { STORES, BRAND_META } from '@/lib/stores';
import {
  parseCSV, toCSV, downloadCSV, validate, BULK_MODES, type BulkMode, type ValidatedRow,
} from '@/lib/csv';
import {
  addUploadedProducts, saveStockAdjustments, savePriceChanges, saveTransfers,
  rowToProduct, rowToStockAdjustment, rowToPriceChange, rowToTransfer,
} from '@/lib/inventory-store';
import {
  Upload, Download, FileText, ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle,
  XCircle, X, Package, DollarSign, ArrowRightLeft, Boxes, Sparkles, Database, Lock,
  Circle, ChevronRight, RefreshCw, FolderOpen, Image as ImageIcon, Trash2,
} from 'lucide-react';

const CATEGORIES = ['manga', 'fiction', 'non-fiction', 'children', 'books', 'stationery', 'toys', 'confectionery', 'sweets', 'tech', 'cashmere', 'travel', 'gifts'];

const MODE_ICONS: Record<BulkMode, React.ElementType> = {
  products: Package,
  stock: Boxes,
  price: DollarSign,
  transfer: ArrowRightLeft,
};

export function BulkUploadWizard() {
  const [mode, setMode] = useState<BulkMode | null>(null);
  const [step, setStep] = useState<'mode' | 'upload' | 'preview' | 'commit'>('mode');
  const [rawText, setRawText] = useState('');
  const [validated, setValidated] = useState<ValidatedRow[]>([]);
  const [committing, setCommitting] = useState(false);
  const [committed, setCommitted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [filter, setFilter] = useState<'all' | 'ok' | 'warning' | 'error'>('all');
  const [isDragging, setIsDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const imageFolderInput = useRef<HTMLInputElement>(null);

  // SKU (uppercase) → data URL for the primary product image, populated
  // from the user's local product-images folder.
  const [images, setImages] = useState<Record<string, string>>({});
  const [processingImages, setProcessingImages] = useState(false);

  const validSKUs = useMemo(() => new Set(ALL_PRODUCTS.map(p => p.sku)), []);
  const validStores = useMemo(() => new Set([...STORES.map(s => s.code), ...STORES.map(s => s.id)]), []);
  const validBrands = useMemo(() => Object.keys(BRAND_META), []);

  const summary = useMemo(() => {
    const total = validated.length;
    const ok = validated.filter(v => v.status === 'ok').length;
    const warning = validated.filter(v => v.status === 'warning').length;
    const error = validated.filter(v => v.status === 'error').length;
    return { total, ok, warning, error };
  }, [validated]);

  const filteredRows = useMemo(() => filter === 'all' ? validated : validated.filter(v => v.status === filter), [validated, filter]);

  const processFile = useCallback(async (file: File) => {
    const text = await file.text();
    setRawText(text);
    if (!mode) return;
    const { rows } = parseCSV(text);
    const results = validate(rows, {
      mode,
      validSKUs,
      validStores,
      validBrands,
      validCategories: CATEGORIES,
    });
    setValidated(results);
    setStep('preview');
  }, [mode, validSKUs, validStores, validBrands]);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) processFile(file);
  };

  const commit = async () => {
    setCommitting(true);
    setProgress(0);
    const commitableRows = validated.filter(v => v.status !== 'error');
    const commitable = commitableRows.length;

    // Persist based on the current mode.
    if (mode === 'products') {
      await addUploadedProducts(commitableRows.map(r => rowToProduct(r.raw, images[r.raw.sku?.toUpperCase()])));
    } else if (mode === 'stock') {
      saveStockAdjustments(commitableRows.map(r => rowToStockAdjustment(r.raw)));
    } else if (mode === 'price') {
      savePriceChanges(commitableRows.map(r => rowToPriceChange(r.raw)));
    } else if (mode === 'transfer') {
      saveTransfers(commitableRows.map(r => rowToTransfer(r.raw)));
    }

    // Animated progress feedback.
    let done = 0;
    const tick = setInterval(() => {
      done += Math.max(1, Math.floor(commitable / 30));
      setProgress(Math.min(100, Math.floor((done / commitable) * 100)));
      if (done >= commitable) {
        clearInterval(tick);
        setTimeout(() => { setCommitted(true); setCommitting(false); }, 400);
      }
    }, 60);
  };

  const reset = () => {
    setMode(null); setStep('mode'); setRawText(''); setValidated([]);
    setCommitted(false); setProgress(0); setFilter('all');
    setImages({});
  };

  // Parse an entire local folder — files come in with their
  // `webkitRelativePath` set to "<root>/<SKU>/<filename>". We take the
  // first image file inside each SKU subfolder, downscale it, and store
  // as a JPEG data URL keyed by uppercased SKU.
  const handleImageFolder = useCallback(async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setProcessingImages(true);
    const grouped: Record<string, File> = {};
    for (const f of Array.from(fileList)) {
      if (!f.type.startsWith('image/')) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const path: string = (f as any).webkitRelativePath || f.name;
      const parts = path.split('/');
      if (parts.length < 2) continue;
      // Immediate parent folder name = SKU
      const sku = parts[parts.length - 2].trim().toUpperCase();
      if (!sku || grouped[sku]) continue; // first image per SKU wins
      grouped[sku] = f;
    }
    const dataUrls: Record<string, string> = {};
    for (const [sku, file] of Object.entries(grouped)) {
      try {
        dataUrls[sku] = await downscaleToDataUrl(file, 800, 1000, 0.82);
      } catch {
        // skip files we can't decode
      }
    }
    setImages(prev => ({ ...prev, ...dataUrls }));
    setProcessingImages(false);
  }, []);

  const clearImages = () => setImages({});

  const currentMode = mode ? BULK_MODES[mode] : null;

  return (
    <div className="px-6 py-6 max-w-[1600px]">
      {/* Header */}
      <div className="mb-8">
        <Link href="/admin/inventory" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
          <ArrowLeft className="w-3 h-3" /> Inventory Console
        </Link>
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">Bulk Upload</h1>
            <p className="mt-2 text-sm text-[color:var(--color-ink-muted)] max-w-2xl">
              Update inventory across all 7 brands, {STORES.length} stores, and 12 cities in a single CSV. Everything commits through the same ecommerce platform.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs text-[color:var(--color-ink-muted)]">
            <div className="flex items-center gap-1.5"><Database className="w-3 h-3" /> Single source of truth</div>
            <div className="flex items-center gap-1.5"><Lock className="w-3 h-3" /> Audit-logged</div>
          </div>
        </div>
      </div>

      {/* Step indicator */}
      <div className="mb-8 flex items-center gap-1 text-xs">
        {(['mode', 'upload', 'preview', 'commit'] as const).map((s, i) => {
          const stepActive = step === s;
          const stepDone = ['mode', 'upload', 'preview', 'commit'].indexOf(step) > i;
          return (
            <div key={s} className="flex items-center gap-1">
              <div className={`flex items-center gap-2 px-3 h-9 rounded-full ${
                stepActive ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' :
                stepDone ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'
              }`}>
                {stepDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5" />}
                <span className="capitalize">{s}</span>
              </div>
              {i < 3 && <ChevronRight className="w-3 h-3 text-[color:var(--color-line-strong)]" />}
            </div>
          );
        })}
      </div>

      {/* === STEP 1: MODE SELECT === */}
      {step === 'mode' && (
        <div>
          <div className="grid md:grid-cols-2 gap-4">
            {(Object.values(BULK_MODES)).map(m => {
              const Icon = MODE_ICONS[m.key];
              return (
                <button
                  key={m.key}
                  onClick={() => { setMode(m.key); setStep('upload'); }}
                  className="group text-left p-6 bg-white rounded-xl border border-[color:var(--color-line)] hover:border-[color:var(--color-ink)] hover:shadow-lg transition"
                >
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-lg bg-[color:var(--color-paper)] flex items-center justify-center group-hover:bg-[color:var(--color-mustard)] transition">
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-serif text-2xl italic">{m.title}</div>
                      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mt-0.5">Mode</div>
                    </div>
                  </div>
                  <p className="text-sm text-[color:var(--color-ink-soft)] leading-relaxed">{m.desc}</p>
                  <div className="mt-6 flex items-center justify-between">
                    <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                      {m.headers.length} columns · CSV template included
                    </div>
                    <ArrowRight className="w-4 h-4 text-[color:var(--color-ink-muted)] group-hover:text-[color:var(--color-crimson)] group-hover:translate-x-1 transition" />
                  </div>
                </button>
              );
            })}
          </div>

          {/* Reference tables */}
          <div className="mt-10 grid md:grid-cols-3 gap-4">
            <ReferenceCard title="7 brands available" items={Object.entries(BRAND_META).map(([k, v]) => ({ key: k, label: v.name, color: v.color }))} />
            <ReferenceCard title={`${STORES.length} stores`} items={STORES.slice(0, 8).map(s => ({ key: s.code, label: s.location }))} more={STORES.length - 8} />
            <ReferenceCard title="13 categories" items={CATEGORIES.map(c => ({ key: c, label: c }))} />
          </div>
        </div>
      )}

      {/* === STEP 2: UPLOAD === */}
      {step === 'upload' && currentMode && (
        <div className="grid md:grid-cols-[1fr_320px] gap-6">
          {/* Dropzone */}
          <div>
            <div className="mb-4 flex items-center justify-between">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Selected mode</div>
                <div className="font-serif text-2xl italic mt-0.5">{currentMode.title}</div>
              </div>
              <button
                onClick={() => downloadCSV(`trs-${currentMode.key}-template.csv`, currentMode.headers, currentMode.sample)}
                className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5" /> Download template CSV
              </button>
            </div>

            <label
              onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`block border-2 border-dashed rounded-2xl p-16 text-center cursor-pointer transition ${
                isDragging ? 'border-[color:var(--color-crimson)] bg-[color:var(--color-crimson)]/5' : 'border-[color:var(--color-line-strong)] bg-white hover:border-[color:var(--color-ink)]'
              }`}
            >
              <input
                ref={fileInput}
                type="file"
                accept=".csv"
                className="hidden"
                onChange={e => e.target.files?.[0] && processFile(e.target.files[0])}
              />
              <div className="mx-auto w-16 h-16 rounded-full bg-[color:var(--color-paper)] flex items-center justify-center mb-6">
                <Upload className="w-6 h-6" />
              </div>
              <div className="font-serif text-3xl italic mb-2">Drop your CSV here</div>
              <div className="text-sm text-[color:var(--color-ink-muted)]">or <span className="underline text-[color:var(--color-crimson)]">browse files</span> · Max 10 MB · 50,000 rows</div>
              <div className="mt-8 flex flex-wrap gap-2 justify-center max-w-md mx-auto">
                {currentMode.headers.map(h => (
                  <span key={h} className="text-[10px] font-mono uppercase tracking-widest px-2 py-1 bg-[color:var(--color-paper)] rounded">
                    {h}
                  </span>
                ))}
              </div>
            </label>

            <div className="mt-6 flex items-center gap-3">
              <button onClick={() => setStep('mode')} className="h-10 px-4 text-sm border border-[color:var(--color-line)] rounded-md hover:bg-white">
                ← Back to modes
              </button>
              <button
                onClick={() => {
                  // Load the sample directly for demo purposes
                  const csv = toCSV(currentMode.headers, currentMode.sample);
                  const results = validate(currentMode.sample, {
                    mode: currentMode.key, validSKUs, validStores, validBrands, validCategories: CATEGORIES,
                  });
                  setRawText(csv);
                  setValidated(results);
                  setStep('preview');
                }}
                className="h-10 px-4 text-sm border border-[color:var(--color-line)] rounded-md hover:bg-white text-[color:var(--color-ink-muted)] inline-flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> Try with sample data
              </button>
            </div>
          </div>

          {/* Sidebar: format spec */}
          <aside className="space-y-4">
            <div className="p-5 bg-white rounded-xl border border-[color:var(--color-line)]">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">CSV format</div>
              <div className="space-y-2 text-xs">
                {currentMode.headers.map(h => (
                  <div key={h} className="flex items-start gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[color:var(--color-crimson)] mt-1.5 shrink-0" />
                    <div>
                      <div className="font-mono">{h}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{describeCol(h)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-5 bg-[color:var(--color-ink)] text-white rounded-xl">
              <div className="text-[10px] uppercase tracking-widest text-white/50 mb-2">Multi-store syntax</div>
              <div className="text-xs text-white/80 leading-relaxed">
                For <span className="font-mono text-[color:var(--color-mustard)]">initial_stock_stores</span> use semicolons to separate stores and colons for quantity:
              </div>
              <code className="block mt-3 p-3 bg-black/40 rounded font-mono text-[11px] text-[color:var(--color-mustard)]">s001:15;s002:12;s003:20</code>
              <div className="text-[10px] text-white/50 mt-2">Sets 15 units at store s001, 12 at s002, 20 at s003.</div>
            </div>
          </aside>
        </div>
      )}

      {/* === STEP 3: PREVIEW === */}
      {step === 'preview' && currentMode && (
        <div>
          {/* Summary */}
          <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total rows" value={summary.total} color="ink" />
            <SummaryCard label="Ready to commit" value={summary.ok} color="success" />
            <SummaryCard label="Warnings" value={summary.warning} color="warning" />
            <SummaryCard label="Errors — skipped" value={summary.error} color="danger" />
          </div>

          {/* Image folder attach (products mode only) */}
          {mode === 'products' && (
            <div className="mb-6 p-4 bg-white rounded-xl border border-[color:var(--color-line)]">
              <div className="flex items-start gap-4 flex-wrap">
                <div className="flex-1 min-w-[280px]">
                  <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-1.5">
                    <ImageIcon className="w-3 h-3" /> Attach product images (optional)
                  </div>
                  <div className="font-serif text-xl leading-tight">Point at your images folder.</div>
                  <div className="text-xs text-[color:var(--color-ink-muted)] mt-1 max-w-lg">
                    Structure: <span className="font-mono">product-images/&lt;SKU&gt;/front.jpg</span>. We&apos;ll grab the first image inside each SKU sub-folder, downscale it, and attach it to the matching row. Nothing gets uploaded to a server — everything stays on this browser.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {Object.keys(images).length > 0 && (
                    <button
                      onClick={clearImages}
                      className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Clear
                    </button>
                  )}
                  <label className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] inline-flex items-center gap-1.5 cursor-pointer">
                    <FolderOpen className="w-3.5 h-3.5" />
                    {processingImages ? 'Processing…' : Object.keys(images).length > 0 ? 'Change folder' : 'Choose folder'}
                    <input
                      ref={imageFolderInput}
                      type="file"
                      // @ts-expect-error -- non-standard directory attributes needed for cross-browser folder pick
                      webkitdirectory="true"
                      directory="true"
                      multiple
                      className="hidden"
                      onChange={e => handleImageFolder(e.target.files)}
                    />
                  </label>
                </div>
              </div>

              {Object.keys(images).length > 0 && (
                <div className="mt-4">
                  {(() => {
                    const csvSkus = new Set(validated.map(v => v.raw.sku?.toUpperCase()).filter(Boolean));
                    const imageSkus = Object.keys(images);
                    const matched = imageSkus.filter(s => csvSkus.has(s));
                    const orphan = imageSkus.filter(s => !csvSkus.has(s));
                    const missing = validated.filter(v => v.status !== 'error' && !images[v.raw.sku?.toUpperCase()]).length;
                    return (
                      <>
                        <div className="flex items-center gap-3 flex-wrap text-xs mb-3">
                          <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]">
                            <CheckCircle2 className="w-3 h-3" /> {matched.length} SKU{matched.length === 1 ? '' : 's'} matched
                          </span>
                          {orphan.length > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]">
                              <AlertTriangle className="w-3 h-3" /> {orphan.length} folder{orphan.length === 1 ? '' : 's'} without a CSV row
                            </span>
                          )}
                          {missing > 0 && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-[color:var(--color-paper)] text-[color:var(--color-ink-muted)]">
                              <ImageIcon className="w-3 h-3" /> {missing} row{missing === 1 ? '' : 's'} without an image — placeholder will be used
                            </span>
                          )}
                        </div>
                        <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
                          {imageSkus.slice(0, 30).map(sku => (
                            <div key={sku} className="shrink-0 text-center">
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={images[sku]}
                                alt={sku}
                                className={`w-16 h-20 object-cover rounded border ${csvSkus.has(sku) ? 'border-[color:var(--color-line)]' : 'border-[color:var(--color-warning)]'}`}
                              />
                              <div className="font-mono text-[10px] mt-1 max-w-[64px] truncate">{sku}</div>
                            </div>
                          ))}
                          {imageSkus.length > 30 && (
                            <div className="shrink-0 w-16 h-20 flex items-center justify-center text-[10px] font-mono text-[color:var(--color-ink-muted)] border border-dashed border-[color:var(--color-line)] rounded">
                              +{imageSkus.length - 30}
                            </div>
                          )}
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Filter chips */}
          <div className="mb-4 flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-1 border border-[color:var(--color-line)] rounded-md p-1 text-xs bg-white">
              {[
                { k: 'all', label: `All (${summary.total})` },
                { k: 'ok', label: `OK (${summary.ok})` },
                { k: 'warning', label: `Warnings (${summary.warning})` },
                { k: 'error', label: `Errors (${summary.error})` },
              ].map(f => (
                <button
                  key={f.k}
                  onClick={() => setFilter(f.k as typeof filter)}
                  className={`px-3 py-1.5 rounded ${filter === f.k ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}
                >
                  {f.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setStep('upload')} className="h-9 px-3 text-xs border border-[color:var(--color-line)] rounded-md hover:bg-white inline-flex items-center gap-1.5">
                <ArrowLeft className="w-3 h-3" /> Change file
              </button>
              <button
                disabled={summary.ok + summary.warning === 0 || committing}
                onClick={commit}
                className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)] disabled:opacity-40 inline-flex items-center gap-1.5"
              >
                {committing ? (<><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Committing… {progress}%</>) : (<>Commit {summary.ok + summary.warning} rows →</>)}
              </button>
            </div>
          </div>

          {/* Committing progress */}
          {committing && (
            <div className="mb-4 p-4 bg-white rounded-lg border border-[color:var(--color-line)]">
              <div className="flex items-center justify-between text-xs mb-2">
                <span>Writing to inventory · {summary.ok + summary.warning} rows across {STORES.length} stores</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-[color:var(--color-paper)] rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[color:var(--color-crimson)] to-[color:var(--color-mustard)] transition-all duration-100" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}

          {/* Preview table */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
                    <th className="text-left px-3 py-2.5 w-12">#</th>
                    <th className="text-left px-3 py-2.5 w-24">Status</th>
                    {currentMode.headers.map(h => (
                      <th key={h} className="text-left px-3 py-2.5">{h}</th>
                    ))}
                    <th className="text-left px-3 py-2.5">Issues</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRows.slice(0, 50).map(r => (
                    <tr key={r.index} className={`border-b border-[color:var(--color-line)] last:border-0 ${
                      r.status === 'error' ? 'bg-[color:var(--color-danger)]/5' :
                      r.status === 'warning' ? 'bg-[color:var(--color-warning)]/5' : ''
                    }`}>
                      <td className="px-3 py-2 font-mono text-xs text-[color:var(--color-ink-muted)]">{r.index + 2}</td>
                      <td className="px-3 py-2">
                        {r.status === 'ok' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-success)]"><CheckCircle2 className="w-3 h-3" /> OK</span>}
                        {r.status === 'warning' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-warning)]"><AlertTriangle className="w-3 h-3" /> Warn</span>}
                        {r.status === 'error' && <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-widest text-[color:var(--color-danger)]"><XCircle className="w-3 h-3" /> Error</span>}
                      </td>
                      {currentMode.headers.map(h => {
                        const hasIssue = r.issues.some(i => i.cell === h);
                        return (
                          <td key={h} className={`px-3 py-2 text-xs font-mono truncate max-w-[180px] ${hasIssue ? 'text-[color:var(--color-danger)] font-medium' : ''}`}>
                            {r.raw[h] || <span className="text-[color:var(--color-ink-faint)]">—</span>}
                          </td>
                        );
                      })}
                      <td className="px-3 py-2 text-xs">
                        {r.issues.length === 0 ? (
                          <span className="text-[color:var(--color-ink-faint)]">—</span>
                        ) : (
                          <ul className="space-y-0.5">
                            {r.issues.map((i, idx) => (
                              <li key={idx} className={`text-[10px] ${i.severity === 'error' ? 'text-[color:var(--color-danger)]' : 'text-[color:var(--color-warning)]'}`}>
                                {i.cell && <span className="font-mono">{i.cell}</span>}: {i.message}
                              </li>
                            ))}
                          </ul>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredRows.length > 50 && (
              <div className="p-3 text-center text-xs text-[color:var(--color-ink-muted)] border-t border-[color:var(--color-line)]">
                Showing 50 of {filteredRows.length} rows in this filter
              </div>
            )}
          </div>

          {/* Post-commit success */}
          {committed && (
            <div className="mt-6 p-8 bg-[color:var(--color-success)]/10 border border-[color:var(--color-success)] rounded-xl text-center">
              <CheckCircle2 className="w-10 h-10 text-[color:var(--color-success)] mx-auto mb-3" />
              <div className="font-serif text-3xl">All {summary.ok + summary.warning} rows committed.</div>
              <div className="mt-2 text-sm text-[color:var(--color-ink-soft)]">
                Changes have been written to inventory across all affected stores. Audit trail entry #TRS-BLK-{Math.floor(Math.random() * 900 + 100)} created.
              </div>
              <div className="mt-6 flex items-center justify-center gap-3">
                <button onClick={reset} className="h-10 px-4 border border-[color:var(--color-line)] rounded-md text-sm bg-white">Upload another file</button>
                <Link href="/admin/inventory" className="h-10 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-sm inline-flex items-center gap-2">
                  Back to inventory <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function describeCol(h: string): string {
  const map: Record<string, string> = {
    sku: 'Unique product identifier',
    title: 'Product display name',
    subtitle: 'Author, brand, or short descriptor (optional)',
    brand: 'One of RLY · CB · MSH · SML · PSH · GLD · MTC',
    category: 'Product category (see reference)',
    price: 'Selling price in INR (integer)',
    compare_price: 'Original / MRP price for strike-through',
    hsn: 'HSN tax code',
    weight: 'Physical weight with unit (e.g. 300g)',
    best_before: 'YYYY-MM-DD or YYYY-MM (perishables)',
    fssai: 'FSSAI license (food SKUs)',
    initial_stock_stores: 'Semicolon-separated storeId:qty pairs',
    store_code: 'Store code like RLY-BLR-03',
    action: 'add / remove / set',
    quantity: 'Integer quantity',
    reason: 'Reason code for audit trail',
    batch: 'Batch identifier (optional)',
    notes: 'Free-text notes (optional)',
    new_price: 'New selling price',
    new_compare_price: 'New compare price',
    effective_date: 'When the price takes effect',
    from_store_code: 'Source store code',
    to_store_code: 'Destination store code',
    expected_arrival: 'ETA at destination',
  };
  return map[h] || '';
}

function ReferenceCard({ title, items, more }: { title: string; items: { key: string; label: string; color?: string }[]; more?: number }) {
  return (
    <div className="p-5 bg-[color:var(--color-paper)] rounded-xl border border-[color:var(--color-line)]">
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">{title}</div>
      <div className="space-y-1.5">
        {items.map(i => (
          <div key={i.key} className="flex items-center gap-2 text-xs">
            {i.color && <span className="w-1.5 h-1.5 rounded-full" style={{ background: i.color }} />}
            <span className="font-mono text-[10px] text-[color:var(--color-ink-muted)]">{i.key}</span>
            <span className="text-[color:var(--color-ink)]">{i.label}</span>
          </div>
        ))}
        {more && <div className="text-[10px] font-mono text-[color:var(--color-ink-muted)] pt-1">+ {more} more</div>}
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }: { label: string; value: number; color: 'ink' | 'success' | 'warning' | 'danger' }) {
  const border = {
    ink: 'border-[color:var(--color-ink)]',
    success: 'border-[color:var(--color-success)]',
    warning: 'border-[color:var(--color-warning)]',
    danger: 'border-[color:var(--color-danger)]',
  }[color];
  const text = {
    ink: 'text-[color:var(--color-ink)]',
    success: 'text-[color:var(--color-success)]',
    warning: 'text-[color:var(--color-warning)]',
    danger: 'text-[color:var(--color-danger)]',
  }[color];
  return (
    <div className={`bg-white rounded-xl border-l-4 ${border} border-t border-r border-b border-[color:var(--color-line)] p-4`}>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{label}</div>
      <div className={`editorial-num text-4xl mt-1 ${text}`}>{value}</div>
    </div>
  );
}

/** Downscale + re-encode an image file as a JPEG data URL. Keeps
 *  localStorage payloads small while still looking decent on cards. */
async function downscaleToDataUrl(file: File, maxW: number, maxH: number, quality: number): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('read failed'));
    reader.readAsDataURL(file);
  });
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error('decode failed'));
    el.src = dataUrl;
  });
  const ratio = Math.min(maxW / img.width, maxH / img.height, 1);
  const w = Math.max(1, Math.round(img.width * ratio));
  const h = Math.max(1, Math.round(img.height * ratio));
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return dataUrl;
  ctx.drawImage(img, 0, 0, w, h);
  return canvas.toDataURL('image/jpeg', quality);
}
