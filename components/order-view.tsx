'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Package,
  MapPin,
  Truck,
  Sparkles,
  ArrowRight,
  ArrowLeft,
} from 'lucide-react';
import { findOrder, type Order } from '@/lib/bag';
import { SafeImage } from './safe-image';
import { inr } from '@/lib/utils';

export function OrderView({ id }: { id: string }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    setOrder(findOrder(id) ?? null);
    setHydrated(true);
  }, [id]);

  if (!hydrated) return <div className="container-editorial py-24 text-center text-[color:var(--color-ink-muted)]">Loading…</div>;
  if (!order) {
    return (
      <div className="container-editorial py-24 text-center">
        <h1 className="font-serif text-3xl">Order not found.</h1>
        <p className="text-[color:var(--color-ink-muted)] mt-2">The order ID doesn&apos;t match anything on this device.</p>
        <Link href="/browse" className="mt-6 inline-flex items-center gap-2 h-11 px-5 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium">
          Continue shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="container-editorial py-8 md:py-16">
      <Link href="/" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Back to Relay
      </Link>

      <div className="text-center max-w-2xl mx-auto py-8">
        <div className="w-14 h-14 rounded-full bg-[color:var(--color-success)]/10 flex items-center justify-center mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7 text-[color:var(--color-success)]" />
        </div>
        <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight">
          Order placed. <span className="italic text-[color:var(--color-crimson)]">Thank you.</span>
        </h1>
        <p className="mt-3 text-[color:var(--color-ink-muted)]">
          {order.delivery.method === 'pickup'
            ? `Reserved at ${order.delivery.storeCode}. Show your order ID at the counter — collection window is 24h.`
            : `Shipping to ${order.delivery.city} · ${order.delivery.pincode}. You'll get a tracking link on ${order.customer.email}.`}
        </p>
        <div className="mt-4 inline-flex items-center gap-3 px-4 h-10 bg-[color:var(--color-paper)] rounded-full text-xs font-mono">
          Order ID <span className="font-medium tracking-widest">{order.id}</span>
        </div>
      </div>

      <div className="grid lg:grid-cols-[1fr_380px] gap-8 mt-8">
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-4">Status</div>
            <ol className="grid grid-cols-4 gap-2">
              {(['Placed', 'Packing', 'Ready', 'Delivered'] as const).map((label, i) => {
                const done = i === 0;
                return (
                  <li key={label} className="text-center">
                    <div className={`h-1 rounded-full ${done ? 'bg-[color:var(--color-crimson)]' : 'bg-[color:var(--color-line)]'}`} />
                    <div className={`mt-2 text-[10px] uppercase tracking-widest ${done ? 'text-[color:var(--color-crimson)] font-medium' : 'text-[color:var(--color-ink-muted)]'}`}>{label}</div>
                  </li>
                );
              })}
            </ol>
            <div className="mt-6 space-y-3 text-sm">
              <TimelineRow icon={CheckCircle2} title="Order placed" sub={new Date(order.placedAt).toLocaleString('en-IN')} live />
              <TimelineRow icon={Package} title="Preparing at store" sub="Store team will pick and pack" />
              {order.delivery.method === 'pickup' ? (
                <TimelineRow icon={MapPin} title="Ready for pickup" sub={`At ${order.delivery.storeCode}`} />
              ) : (
                <TimelineRow icon={Truck} title="Out for delivery" sub={`Rider assigned in ${order.delivery.city ?? 'your city'}`} />
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">{order.lines.length} item(s)</div>
              <div className="text-[11px] font-mono text-[color:var(--color-ink-muted)]">GST invoice on the way</div>
            </div>
            <div className="divide-y divide-[color:var(--color-line)]">
              {order.lines.map(line => (
                <div key={line.productId} className="flex gap-3 py-3">
                  <div className="relative w-16 h-20 shrink-0 bg-[color:var(--color-paper)] rounded overflow-hidden">
                    <SafeImage src={line.image} alt={line.title} fallbackSeed={line.title} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium leading-tight line-clamp-2">{line.title}</div>
                    <div className="font-mono text-[10px] text-[color:var(--color-ink-faint)] mt-0.5">{line.sku}</div>
                    <div className="text-xs text-[color:var(--color-ink-muted)] mt-1">Qty {line.qty} · {inr(line.unitPrice)} each</div>
                  </div>
                  <div className="text-sm font-mono">{inr(line.lineTotal)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[color:var(--color-ink)] text-white rounded-xl p-6">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-white/60 mb-2">
              <Sparkles className="w-3 h-3 text-[color:var(--color-crimson-soft)]" /> Skyline Programme
            </div>
            <div className="font-serif text-2xl leading-tight">You just earned <span className="text-[color:var(--color-crimson-soft)]">{order.pointsEarned.toLocaleString('en-IN')} points</span>.</div>
            <div className="text-sm text-white/70 mt-1">Credited within a minute of pickup / delivery.</div>
            <Link href="/loyalty" className="mt-4 inline-flex items-center gap-2 h-10 px-4 bg-white text-[color:var(--color-ink)] rounded-full text-xs font-medium">
              See your Skyline card <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        <aside className="space-y-6">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">Payment</div>
            <div className="space-y-1.5 text-sm">
              <Row label="Subtotal" value={inr(order.subtotal)} />
              <Row label="Delivery" value={order.delivery_fee === 0 ? 'Free' : inr(order.delivery_fee)} />
              <div className="border-t border-[color:var(--color-line)] pt-2 flex items-center justify-between">
                <div>Total</div>
                <div className="font-serif text-xl">{inr(order.total)}</div>
              </div>
              <div className="text-[11px] text-[color:var(--color-ink-muted)] font-mono pt-2">
                Paid via {order.payment.method.toUpperCase()}{order.payment.maskedCard ? ` · ${order.payment.maskedCard}` : ''}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3">
              {order.delivery.method === 'pickup' ? 'Pickup' : 'Ship to'}
            </div>
            <div className="text-sm">
              <div className="font-medium">{order.customer.name}</div>
              <div className="text-xs text-[color:var(--color-ink-muted)] font-mono">{order.customer.phone}</div>
              <div className="text-xs text-[color:var(--color-ink-muted)]">{order.customer.email}</div>
              {order.delivery.method === 'pickup' ? (
                <div className="mt-3 text-xs">
                  <div className="font-mono">{order.delivery.storeCode}</div>
                  <div className="text-[color:var(--color-ink-muted)]">Show order ID at the counter</div>
                </div>
              ) : (
                <div className="mt-3 text-xs">
                  <div>{order.delivery.address}</div>
                  <div className="text-[color:var(--color-ink-muted)]">{order.delivery.city} · {order.delivery.pincode}</div>
                </div>
              )}
            </div>
          </div>

          <Link href="/browse" className="w-full h-11 border border-[color:var(--color-ink)] rounded-full text-sm font-medium hover:bg-[color:var(--color-ink)] hover:text-white transition flex items-center justify-center gap-2">
            Continue shopping <ArrowRight className="w-4 h-4" />
          </Link>
        </aside>
      </div>
    </div>
  );
}

function TimelineRow({ icon: Icon, title, sub, live }: { icon: React.ElementType; title: string; sub: string; live?: boolean }) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${live ? 'bg-[color:var(--color-crimson)] text-white' : 'bg-[color:var(--color-paper)] text-[color:var(--color-ink-muted)]'}`}>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-[11px] text-[color:var(--color-ink-muted)]">{sub}</div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[color:var(--color-ink-muted)]">{label}</span>
      <span className="font-mono">{value}</span>
    </div>
  );
}
