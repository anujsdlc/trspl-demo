'use client';

import { useState, useMemo } from 'react';
import { STORES, BRAND_META, type Store, type StoreBrand } from '@/lib/stores';
import { ALL_PRODUCTS, stockFor, PRODUCTS_BY_BRAND } from '@/lib/products';
import { inr } from '@/lib/utils';
import { MapPin, Search, RefreshCw, Zap, TrendingUp, AlertCircle, Package, Users, Clock, Building2, CheckCircle2, XCircle } from 'lucide-react';

// Approx India map bounds
const MAP_BOUNDS = { latMin: 8, latMax: 32, lngMin: 68, lngMax: 92 };

function projectCoord([lat, lng]: [number, number], w: number, h: number) {
  const x = ((lng - MAP_BOUNDS.lngMin) / (MAP_BOUNDS.lngMax - MAP_BOUNDS.lngMin)) * w;
  const y = ((MAP_BOUNDS.latMax - lat) / (MAP_BOUNDS.latMax - MAP_BOUNDS.latMin)) * h;
  return [x, y];
}

export function StoreConsole() {
  const [query, setQuery] = useState('');
  const [brandFilter, setBrandFilter] = useState<StoreBrand | 'all'>('all');
  const [selectedStore, setSelectedStore] = useState<Store | null>(STORES[0]);

  const filtered = useMemo(() => {
    let arr = [...STORES];
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(s => s.code.toLowerCase().includes(q) || s.city.toLowerCase().includes(q) || s.location.toLowerCase().includes(q));
    }
    if (brandFilter !== 'all') arr = arr.filter(s => s.brand === brandFilter);
    return arr;
  }, [query, brandFilter]);

  // Per-brand rollup for the top cards
  const brandRollup = useMemo(() => {
    return Object.entries(BRAND_META).map(([code, meta]) => {
      const stores = STORES.filter(s => s.brand === code);
      const rev = stores.reduce((sum, s) => sum + ((s.id.charCodeAt(1) * 7) % 30 + 10) * 1000, 0);
      return { code: code as StoreBrand, meta, count: stores.length, rev };
    });
  }, []);

  // Per-store synthetic stats
  function storeStats(s: Store) {
    const brandProducts = PRODUCTS_BY_BRAND[s.brand].slice(0, 40);
    const stockUnits = brandProducts.reduce((sum, p) => sum + stockFor(p.id, s.id), 0);
    const stockValue = brandProducts.reduce((sum, p) => sum + stockFor(p.id, s.id) * p.price, 0);
    const lowStockCount = brandProducts.filter(p => stockFor(p.id, s.id) > 0 && stockFor(p.id, s.id) < 5).length;
    const outStockCount = brandProducts.filter(p => stockFor(p.id, s.id) === 0).length;
    const seed = s.id.charCodeAt(1) + s.id.charCodeAt(2);
    const todaysOrders = (seed % 40) + 3;
    const todaysRevenue = todaysOrders * ((seed % 20 + 10) * 100);
    const staffCount = (seed % 4) + 2;
    return { stockUnits, stockValue, lowStockCount, outStockCount, todaysOrders, todaysRevenue, staffCount };
  }

  return (
    <div className="px-6 py-6 max-w-[1800px]">
      {/* Header */}
      <div className="flex items-end justify-between mb-6 flex-wrap gap-3">
        <div>
          <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1 flex items-center gap-2">
            <Building2 className="w-3 h-3" /> Store network
            <span className="flex items-center gap-1.5 ml-2">
              <span className="w-1.5 h-1.5 bg-[color:var(--color-success)] rounded-full pulse-dot" />
              <span className="font-mono">{STORES.filter(s => s.status === 'live').length} of {STORES.length} live</span>
            </span>
          </div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight">Store Console · 51 locations</h1>
        </div>
        <div className="flex items-center gap-2">
          <button className="h-9 px-3 border border-[color:var(--color-line)] rounded-md text-xs inline-flex items-center gap-1.5 hover:bg-[color:var(--color-paper)]">
            <RefreshCw className="w-3.5 h-3.5" /> Force resync
          </button>
          <button className="h-9 px-4 bg-[color:var(--color-ink)] text-[color:var(--color-cream)] rounded-md text-xs font-medium hover:bg-[color:var(--color-crimson)]">
            + New store
          </button>
        </div>
      </div>

      {/* Brand rollup */}
      <div className="grid grid-cols-2 md:grid-cols-7 gap-3 mb-6">
        {brandRollup.map(b => (
          <div key={b.code} className="bg-white rounded-lg border border-[color:var(--color-line)] p-4 hover:border-[color:var(--color-line-strong)] transition">
            <div className="flex items-center justify-between mb-3">
              <div className="w-2 h-2 rounded-full" style={{ background: b.meta.color }} />
              <div className="text-[10px] font-mono text-[color:var(--color-ink-muted)]">{b.count}</div>
            </div>
            <div className="text-xs font-medium">{b.meta.name}</div>
            <div className="text-[10px] text-[color:var(--color-ink-muted)] mt-0.5">{inr(b.rev)} today</div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_400px] gap-6">
        {/* Left: Map + Table */}
        <div className="space-y-6">
          {/* India map */}
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Geographic distribution</div>
                <div className="font-serif text-2xl mt-1">India network</div>
              </div>
              <div className="flex items-center gap-4 text-[10px] font-mono">
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--color-success)]" /> Live</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--color-warning)]" /> Syncing</div>
                <div className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[color:var(--color-line-strong)]" /> Offline</div>
              </div>
            </div>
            <IndiaMap stores={filtered} selectedId={selectedStore?.id} onSelect={setSelectedStore} />
          </div>

          {/* Filter bar */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] p-3 flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 h-9 px-3 bg-[color:var(--color-paper)] rounded-md border border-[color:var(--color-line)] flex-1 min-w-[240px]">
              <Search className="w-3.5 h-3.5 text-[color:var(--color-ink-muted)]" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search by code, city, or airport…" className="flex-1 bg-transparent text-sm focus:outline-none" />
            </div>
            <div className="flex items-center gap-1 border border-[color:var(--color-line)] rounded-md p-1">
              <button onClick={() => setBrandFilter('all')} className={`text-xs px-2 py-1 rounded ${brandFilter === 'all' ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}>All</button>
              {Object.entries(BRAND_META).map(([k, v]) => (
                <button key={k} onClick={() => setBrandFilter(k as StoreBrand)} className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${brandFilter === k ? 'bg-[color:var(--color-ink)] text-[color:var(--color-cream)]' : 'hover:bg-[color:var(--color-paper)]'}`}>
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: v.color }} />
                  {v.name}
                </button>
              ))}
            </div>
          </div>

          {/* Store table */}
          <div className="bg-white rounded-lg border border-[color:var(--color-line)] overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[color:var(--color-line)] bg-[color:var(--color-paper)]/40">
                  {['Code', 'Location', 'Brand', 'Type', 'Manager', 'Hours', 'Status'].map(h => (
                    <th key={h} className="text-left px-3 py-2.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => (
                  <tr
                    key={s.id}
                    onClick={() => setSelectedStore(s)}
                    className={`border-b border-[color:var(--color-line)] last:border-0 cursor-pointer hover:bg-[color:var(--color-paper)]/30 transition ${selectedStore?.id === s.id ? 'bg-[color:var(--color-crimson)]/5' : ''}`}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{s.code}</td>
                    <td className="px-3 py-2">
                      <div className="text-xs">{s.location}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)]">{s.pincode} · {s.airportCode || 'landside'}</div>
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ background: BRAND_META[s.brand].color }} />
                        {BRAND_META[s.brand].name}
                      </div>
                    </td>
                    <td className="px-3 py-2 text-xs text-[color:var(--color-ink-muted)] capitalize">{s.type}</td>
                    <td className="px-3 py-2 text-xs">{s.mgr}</td>
                    <td className="px-3 py-2 text-[10px] font-mono text-[color:var(--color-ink-muted)]">{s.hours}</td>
                    <td className="px-3 py-2">
                      <div className="flex items-center gap-1.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          s.status === 'live' ? 'bg-[color:var(--color-success)]' :
                          s.status === 'sync' ? 'bg-[color:var(--color-warning)] pulse-dot' :
                          'bg-[color:var(--color-danger)]'
                        }`} />
                        <span className="text-[10px] uppercase tracking-widest">{s.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Store detail */}
        <div className="space-y-4">
          {selectedStore && (() => {
            const meta = BRAND_META[selectedStore.brand];
            const stats = storeStats(selectedStore);
            return (
              <>
                <div className="bg-white rounded-xl border border-[color:var(--color-line)] overflow-hidden">
                  {/* Brand accent header */}
                  <div className="h-24 p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${meta.color} 0%, ${meta.color}CC 100%)` }}>
                    <div className="text-[10px] uppercase tracking-widest text-white/70 font-mono">{meta.name} · {meta.category}</div>
                    <div className="font-serif text-2xl text-white mt-1">{selectedStore.location}</div>
                    <div className="absolute bottom-3 right-4 text-[9px] font-mono uppercase tracking-widest text-white/60">{selectedStore.code}</div>
                  </div>
                  <div className="p-5 space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Live status</div>
                      <div className={`text-xs px-2 py-1 rounded flex items-center gap-1.5 ${
                        selectedStore.status === 'live' ? 'bg-[color:var(--color-success)]/10 text-[color:var(--color-success)]' :
                        selectedStore.status === 'sync' ? 'bg-[color:var(--color-warning)]/10 text-[color:var(--color-warning)]' :
                        'bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)]'
                      }`}>
                        {selectedStore.status === 'live' ? <CheckCircle2 className="w-3 h-3" /> : selectedStore.status === 'sync' ? <RefreshCw className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                        {selectedStore.status}
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <MetaCell label="Manager" value={selectedStore.mgr} icon={Users} />
                      <MetaCell label="Hours" value={selectedStore.hours} icon={Clock} />
                      <MetaCell label="Terminal" value={selectedStore.terminal} icon={Building2} />
                      <MetaCell label="Pincode" value={selectedStore.pincode} icon={MapPin} />
                    </div>

                    <div className="pt-4 border-t border-[color:var(--color-line)] space-y-3">
                      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Today at a glance</div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <div className="text-[10px] text-[color:var(--color-ink-muted)]">Orders</div>
                          <div className="editorial-num text-2xl">{stats.todaysOrders}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-[color:var(--color-ink-muted)]">Revenue</div>
                          <div className="editorial-num text-2xl">{inr(stats.todaysRevenue)}</div>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[color:var(--color-line)]">
                      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Inventory health</div>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between"><span className="text-[color:var(--color-ink-muted)]">Units on hand</span><span className="font-mono">{stats.stockUnits.toLocaleString('en-IN')}</span></div>
                        <div className="flex justify-between"><span className="text-[color:var(--color-ink-muted)]">Stock value</span><span className="font-mono">{inr(stats.stockValue)}</span></div>
                        <div className="flex justify-between text-[color:var(--color-warning)]"><span>Low stock SKUs</span><span className="font-mono">{stats.lowStockCount}</span></div>
                        <div className="flex justify-between text-[color:var(--color-danger)]"><span>Out of stock SKUs</span><span className="font-mono">{stats.outStockCount}</span></div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-[color:var(--color-line)]">
                      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-2">Delivery zone</div>
                      <div className="text-xs">
                        Serviceable pincodes: <span className="font-mono">{selectedStore.pincode.substring(0, 3)}xxx</span>
                      </div>
                      <div className="text-xs text-[color:var(--color-ink-muted)] mt-1">Radius: ~12 km · Cut-off: 21:00 · Est delivery: same day</div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 pt-4 border-t border-[color:var(--color-line)]">
                      <button className="h-9 border border-[color:var(--color-ink)] rounded-md text-xs font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition">Open store console</button>
                      <button className="h-9 border border-[color:var(--color-line)] rounded-md text-xs font-medium hover:bg-[color:var(--color-paper)]">Print picklist</button>
                    </div>
                  </div>
                </div>

                {/* Sync log */}
                <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
                  <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">
                    <Zap className="w-3 h-3" /> Recent sync events
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {[
                      { t: 'Stock delta pushed · 47 SKUs', ago: '12s' },
                      { t: 'POS transaction · Ferrero Rocher × 2', ago: '48s' },
                      { t: 'Batch received · L4728 · 30 units', ago: '3m' },
                      { t: 'Order routed here · #TRS-4821', ago: '5m' },
                      { t: 'Picklist printed', ago: '7m' },
                      { t: 'End-of-day count reconciled', ago: '2h' },
                    ].map((e, i) => (
                      <div key={i} className="flex items-center justify-between py-1 border-b border-[color:var(--color-line)] last:border-0">
                        <span>{e.t}</span>
                        <span className="text-[10px] font-mono text-[color:var(--color-ink-muted)]">{e.ago} ago</span>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            );
          })()}
        </div>
      </div>
    </div>
  );
}

function MetaCell({ label, value, icon: Icon }: { label: string; value: string; icon: React.ElementType }) {
  return (
    <div className="p-2.5 border border-[color:var(--color-line)] rounded-md">
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm mt-1">{value}</div>
    </div>
  );
}

function IndiaMap({ stores, selectedId, onSelect }: { stores: Store[]; selectedId?: string; onSelect: (s: Store) => void }) {
  const W = 500;
  const H = 560;
  return (
    <div className="relative">
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto max-h-[560px]">
        {/* India silhouette (approximate) */}
        <path
          d="M 240 40 Q 200 35 185 55 L 165 75 Q 145 90 130 120 L 115 155 Q 100 175 90 210 L 85 250 Q 90 285 100 320 L 110 345 Q 125 370 130 400 L 140 445 Q 160 475 200 490 L 240 505 Q 275 515 300 525 Q 295 490 285 460 L 275 430 Q 290 395 305 365 L 320 340 Q 345 315 365 285 L 380 260 Q 395 235 400 205 L 410 175 Q 415 145 410 115 L 400 95 Q 390 75 375 65 L 345 55 Q 315 45 285 42 Z"
          fill="var(--color-paper)"
          stroke="var(--color-line-strong)"
          strokeWidth="1.5"
        />
        {/* Grid overlay */}
        <g opacity="0.15">
          {Array.from({ length: 8 }, (_, i) => (
            <line key={`v${i}`} x1={(i / 8) * W} y1={0} x2={(i / 8) * W} y2={H} stroke="var(--color-ink)" strokeWidth="0.5" />
          ))}
          {Array.from({ length: 10 }, (_, i) => (
            <line key={`h${i}`} x1={0} y1={(i / 10) * H} x2={W} y2={(i / 10) * H} stroke="var(--color-ink)" strokeWidth="0.5" />
          ))}
        </g>

        {/* Store markers */}
        {stores.map(s => {
          const [x, y] = projectCoord(s.coords, W, H);
          const isSelected = s.id === selectedId;
          const meta = BRAND_META[s.brand];
          return (
            <g key={s.id} onClick={() => onSelect(s)} style={{ cursor: 'pointer' }}>
              {isSelected && (
                <circle cx={x} cy={y} r="16" fill={meta.color} opacity="0.2" className="pulse-dot" />
              )}
              <circle
                cx={x}
                cy={y}
                r={isSelected ? 6 : 4}
                fill={meta.color}
                stroke={s.status === 'live' ? '#fff' : s.status === 'sync' ? 'var(--color-warning)' : 'var(--color-danger)'}
                strokeWidth={isSelected ? 2 : 1.5}
                className="hover:scale-125 transition-transform"
              />
              {isSelected && (
                <text x={x + 10} y={y - 6} fontSize="9" fontFamily="monospace" fill="var(--color-ink)">{s.code}</text>
              )}
            </g>
          );
        })}
      </svg>

      {/* Info overlay */}
      <div className="absolute top-3 left-3 text-[10px] font-mono text-[color:var(--color-ink-muted)] bg-white/80 backdrop-blur px-2 py-1 rounded">
        {stores.length} stores plotted
      </div>
    </div>
  );
}
