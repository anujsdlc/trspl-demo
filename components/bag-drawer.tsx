'use client';

import Link from 'next/link';
import { X, Minus, Plus, Trash2, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { useBag } from './bag-provider';
import { SafeImage } from './safe-image';
import { inr } from '@/lib/utils';

interface BagDrawerProps {
  open: boolean;
  onClose: () => void;
}

const FREE_DELIVERY_THRESHOLD = 599;
const DELIVERY_FEE = 49;

export function BagDrawer({ open, onClose }: BagDrawerProps) {
  const { items, subtotal, updateQty, remove, productFor } = useBag();

  if (!open) return null;

  const delivery = subtotal >= FREE_DELIVERY_THRESHOLD || subtotal === 0 ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;
  const toFreeDelivery = Math.max(0, FREE_DELIVERY_THRESHOLD - subtotal);
  const pointsEarned = Math.floor(subtotal * 0.05);

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex justify-end animate-fade-in" onClick={onClose}>
      <div
        className="w-full max-w-md bg-white h-full overflow-hidden flex flex-col shadow-2xl animate-slide-in-right"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-[color:var(--color-line)] flex items-center justify-between">
          <div>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] flex items-center gap-1.5">
              <ShoppingBag className="w-3 h-3" /> Your bag
            </div>
            <div className="font-serif text-2xl leading-tight">{items.length} {items.length === 1 ? 'item' : 'items'}</div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-[color:var(--color-paper)] rounded" aria-label="Close">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Empty state */}
        {items.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
            <div className="w-16 h-16 rounded-full bg-[color:var(--color-paper)] flex items-center justify-center">
              <ShoppingBag className="w-6 h-6 text-[color:var(--color-ink-muted)]" />
            </div>
            <div>
              <div className="font-serif text-xl">Your bag is empty.</div>
              <div className="text-sm text-[color:var(--color-ink-muted)] mt-1">Add something from the shelf — reserve now, collect at your gate.</div>
            </div>
            <Link
              href="/browse"
              onClick={onClose}
              className="mt-2 inline-flex items-center gap-2 h-11 px-5 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson-deep)] transition"
            >
              Start shopping <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        )}

        {/* Items list */}
        {items.length > 0 && (
          <>
            {/* Progress to free delivery */}
            {subtotal > 0 && subtotal < FREE_DELIVERY_THRESHOLD && (
              <div className="px-6 py-3 bg-[color:var(--color-crimson-soft)]/60 border-b border-[color:var(--color-line)]">
                <div className="text-xs mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-[color:var(--color-crimson)]" />
                  Add <span className="font-mono font-medium">{inr(toFreeDelivery)}</span> more for free delivery
                </div>
                <div className="h-1 bg-white rounded-full overflow-hidden">
                  <div className="h-full bg-[color:var(--color-crimson)] rounded-full transition-all" style={{ width: `${Math.min(100, (subtotal / FREE_DELIVERY_THRESHOLD) * 100)}%` }} />
                </div>
              </div>
            )}
            {subtotal >= FREE_DELIVERY_THRESHOLD && (
              <div className="px-6 py-2.5 bg-[color:var(--color-success)]/10 text-[color:var(--color-success)] text-xs border-b border-[color:var(--color-line)] flex items-center gap-1.5">
                <Sparkles className="w-3 h-3" /> You&apos;ve unlocked free delivery.
              </div>
            )}

            <div className="flex-1 overflow-y-auto divide-y divide-[color:var(--color-line)]">
              {items.map(item => {
                const p = productFor(item.productId);
                if (!p) return null;
                return (
                  <div key={item.productId} className="px-6 py-4 flex gap-3">
                    <div className="relative w-16 h-20 shrink-0 bg-[color:var(--color-paper)] rounded overflow-hidden">
                      <SafeImage src={p.image} alt={p.title} fallbackSeed={p.title} fill sizes="64px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-sm font-medium leading-tight line-clamp-2">{p.title}</div>
                          {p.subtitle && <div className="text-[11px] text-[color:var(--color-ink-muted)] line-clamp-1">{p.subtitle}</div>}
                          <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)] mt-0.5">{p.sku}</div>
                        </div>
                        <button
                          onClick={() => remove(item.productId)}
                          className="p-1 text-[color:var(--color-ink-muted)] hover:text-[color:var(--color-danger)] transition"
                          aria-label="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <div className="flex items-center border border-[color:var(--color-line)] rounded-md">
                          <button
                            onClick={() => updateQty(item.productId, item.qty - 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[color:var(--color-paper)]"
                            aria-label="Decrease"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <div className="w-8 text-center font-mono text-sm">{item.qty}</div>
                          <button
                            onClick={() => updateQty(item.productId, item.qty + 1)}
                            className="w-7 h-7 flex items-center justify-center hover:bg-[color:var(--color-paper)]"
                            aria-label="Increase"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="font-medium">{inr(p.price * item.qty)}</div>
                          {item.qty > 1 && (
                            <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">
                              {inr(p.price)} each
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Summary + checkout */}
            <div className="border-t border-[color:var(--color-line)] px-6 py-4 space-y-2 bg-[color:var(--color-paper)]/40">
              <Row label="Subtotal" value={inr(subtotal)} />
              <Row label={delivery === 0 ? 'Delivery (Free)' : 'Delivery'} value={delivery === 0 ? '₹0' : inr(delivery)} />
              <Row label="Skyline points earned" value={`+${pointsEarned.toLocaleString('en-IN')} pts`} accent />
              <div className="pt-2 border-t border-[color:var(--color-line)] flex items-center justify-between">
                <div className="text-sm">Total</div>
                <div className="font-serif text-2xl">{inr(total)}</div>
              </div>
              <Link
                href="/checkout"
                onClick={onClose}
                className="mt-3 flex items-center justify-center gap-2 h-12 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson-deep)] transition"
              >
                Checkout · {inr(total)} <ArrowRight className="w-4 h-4" />
              </Link>
              <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono text-center pt-1">
                Reserved from your nearest store · GST-compliant invoice included
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function Row({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className={accent ? 'text-[color:var(--color-crimson)] flex items-center gap-1' : 'text-[color:var(--color-ink-muted)]'}>
        {accent && <Sparkles className="w-3 h-3" />}
        {label}
      </span>
      <span className={`font-mono ${accent ? 'text-[color:var(--color-crimson)] font-medium' : ''}`}>{value}</span>
    </div>
  );
}
