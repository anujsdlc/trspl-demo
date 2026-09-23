'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ShoppingBag,
  Store,
  Truck,
  CreditCard,
  Smartphone,
  Banknote,
  ArrowRight,
  ShieldCheck,
  Check,
  Sparkles,
  ArrowLeft,
} from 'lucide-react';
import { useBag } from './bag-provider';
import { SafeImage } from './safe-image';
import { saveOrder, publishOrder, saleMoves, newOrderId, type OrderLine, type Order } from '@/lib/bag';
import { appendMoves } from '@/lib/stock-ledger.client';
import { computeOrderTax } from '@/lib/order-tax';
import { gstRateFor } from '@/lib/gst-rates';
import { loadGST, SEED_GST, type GSTRegistration } from '@/lib/erp/foundations';
import { STORES } from '@/lib/stores';
import { inr } from '@/lib/utils';
import { DEMO_MEMBER, pointsForBasket, tierFor } from '@/lib/loyalty';

const RELAY_STORES = STORES.filter(s => s.brand === 'RLY').slice(0, 12);
const FREE_DELIVERY_THRESHOLD = 599;
const DELIVERY_FEE = 49;

export function CheckoutView() {
  const router = useRouter();
  const { items, subtotal, productFor, clear } = useBag();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 ');
  const [method, setMethod] = useState<'pickup' | 'ship'>('pickup');
  const [storeCode, setStoreCode] = useState(RELAY_STORES[0].code);
  const [address, setAddress] = useState('');
  const [pincode, setPincode] = useState('');
  const [city, setCity] = useState('Bangalore');
  const [payment, setPayment] = useState<'card' | 'upi' | 'cod'>('card');
  const [cardNumber, setCardNumber] = useState('');
  const [placing, setPlacing] = useState(false);
  const [error, setError] = useState('');

  const [registrations, setRegistrations] = useState<GSTRegistration[]>(SEED_GST);
  useEffect(() => { loadGST().then(setRegistrations); }, []);

  const delivery = method === 'pickup' ? 0 : subtotal >= FREE_DELIVERY_THRESHOLD ? 0 : DELIVERY_FEE;
  const total = subtotal + delivery;
  const tier = tierFor(DEMO_MEMBER.ytdSpend);
  const pointsEarned = pointsForBasket(
    items.map(i => {
      const product = productFor(i.productId);
      return { amount: (product?.price ?? 0) * i.qty, category: product?.category };
    }),
    tier,
  );

  if (items.length === 0) {
    return (
      <div className="container-editorial py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-[color:var(--color-paper)] flex items-center justify-center mx-auto mb-4">
          <ShoppingBag className="w-6 h-6 text-[color:var(--color-ink-muted)]" />
        </div>
        <h1 className="font-serif text-3xl">Your bag is empty.</h1>
        <p className="text-[color:var(--color-ink-muted)] mt-2">Add something to check out.</p>
        <Link href="/browse" className="mt-6 inline-flex items-center gap-2 h-11 px-5 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium">
          Start shopping <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  function place(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) { setError('Name is required'); return; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { setError('Enter a valid email'); return; }
    if (phone.trim().length < 8) { setError('Enter a valid phone number'); return; }
    if (method === 'ship' && (!address.trim() || pincode.length !== 6)) {
      setError('Delivery address + 6-digit pincode required'); return;
    }
    if (payment === 'card' && cardNumber.replace(/\s/g, '').length < 15) {
      setError('Enter a valid card number'); return;
    }

    setPlacing(true);

    const lines: OrderLine[] = items.map(item => {
      const p = productFor(item.productId)!;
      return {
        productId: p.id, title: p.title, sku: p.sku, image: p.image,
        qty: item.qty, unitPrice: p.price, lineTotal: p.price * item.qty,
        hsn: p.hsn, gstRate: gstRateFor(p.category), uqc: 'NOS',
      };
    });

    const id = newOrderId();
    const order: Order = {
      id,
      placedAt: new Date().toISOString(),
      customer: { name: name.trim(), email: email.trim().toLowerCase(), phone: phone.trim() },
      delivery: method === 'pickup'
        ? { method: 'pickup', storeCode }
        : { method: 'ship', address: address.trim(), pincode, city },
      payment: {
        method: payment,
        maskedCard: payment === 'card' ? `**** **** **** ${cardNumber.replace(/\s/g, '').slice(-4)}` : undefined,
      },
      lines,
      subtotal, delivery_fee: delivery, discount: 0, total, pointsEarned,
      status: 'placed',
    };

    order.tax = computeOrderTax(
      order,
      registrations,
      id => productFor(id)?.category,
      storeCode,
    );

    setTimeout(() => {
      saveOrder(order);
      void publishOrder(order);
      const moves = saleMoves(order, code => STORES.find(s => s.code === code)?.id);
      if (moves.length > 0) void appendMoves(moves).catch(() => {});
      clear();
      router.push(`/orders/${id}`);
    }, 900);
  }

  return (
    <div className="container-editorial py-8 md:py-12">
      <Link href="/browse" className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-3 inline-flex items-center gap-1 hover:text-[color:var(--color-crimson)]">
        <ArrowLeft className="w-3 h-3" /> Continue shopping
      </Link>
      <h1 className="font-serif text-4xl md:text-5xl leading-tight tracking-tight mb-8">Checkout</h1>

      <form onSubmit={place} className="grid lg:grid-cols-[1fr_400px] gap-8">
        <div className="space-y-8">
          <Section title="Your details" icon={ShieldCheck}>
            <div className="grid md:grid-cols-2 gap-3">
              <Field label="Full name"><input value={name} onChange={e => setName(e.target.value)} required className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
              <Field label="Phone"><input value={phone} onChange={e => setPhone(e.target.value)} required className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            </div>
            <Field label="Email"><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
          </Section>

          <Section title="Delivery" icon={Truck}>
            <div className="grid grid-cols-2 gap-3">
              <MethodTile active={method === 'pickup'} onClick={() => setMethod('pickup')} icon={Store} title="Pick up at store" hint="Reserve now, collect at your gate. Free.">
                Free
              </MethodTile>
              <MethodTile active={method === 'ship'} onClick={() => setMethod('ship')} icon={Truck} title="Ship home" hint="Same-day BLR/DEL/BOM/HYD.">
                {subtotal >= FREE_DELIVERY_THRESHOLD ? 'Free' : inr(DELIVERY_FEE)}
              </MethodTile>
            </div>

            {method === 'pickup' && (
              <Field label="Pick-up store">
                <select value={storeCode} onChange={e => setStoreCode(e.target.value)} className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm">
                  {RELAY_STORES.map(s => <option key={s.id} value={s.code}>{s.code} · {s.location}</option>)}
                </select>
              </Field>
            )}

            {method === 'ship' && (
              <div className="space-y-3">
                <Field label="Delivery address"><textarea value={address} onChange={e => setAddress(e.target.value)} rows={2} className="w-full px-3 py-2 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Pincode"><input value={pincode} onChange={e => setPincode(e.target.value.replace(/\D/g, ''))} maxLength={6} className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
                  <Field label="City"><input value={city} onChange={e => setCity(e.target.value)} className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
                </div>
              </div>
            )}
          </Section>

          <Section title="Payment" icon={CreditCard}>
            <div className="grid grid-cols-3 gap-3">
              <PayTile active={payment === 'card'} onClick={() => setPayment('card')} icon={CreditCard} label="Card" />
              <PayTile active={payment === 'upi'} onClick={() => setPayment('upi')} icon={Smartphone} label="UPI" />
              <PayTile active={payment === 'cod'} onClick={() => setPayment('cod')} icon={Banknote} label="Cash" />
            </div>

            {payment === 'card' && (
              <>
                <Field label="Card number">
                  <input
                    value={cardNumber}
                    onChange={e => setCardNumber(formatCard(e.target.value))}
                    placeholder="4242 4242 4242 4242"
                    maxLength={19}
                    className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono"
                  />
                </Field>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Expiry"><input placeholder="MM/YY" maxLength={5} className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
                  <Field label="CVC"><input placeholder="123" maxLength={4} className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
                  <Field label="Name on card"><input className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm" /></Field>
                </div>
              </>
            )}
            {payment === 'upi' && (
              <Field label="UPI ID"><input placeholder="yourname@okhdfcbank" className="w-full h-11 px-3 border border-[color:var(--color-line)] rounded-md bg-white text-sm font-mono" /></Field>
            )}
            {payment === 'cod' && (
              <div className="p-3 bg-[color:var(--color-paper)] rounded-md text-xs text-[color:var(--color-ink-soft)]">
                Pay in cash at pickup. Keep exact change if possible.
              </div>
            )}

            <div className="flex items-start gap-2 text-[11px] text-[color:var(--color-ink-muted)] pt-2">
              <ShieldCheck className="w-3.5 h-3.5 mt-0.5 shrink-0 text-[color:var(--color-success)]" />
              <span>All demo transactions — no real charge is made. Card details are not stored.</span>
            </div>
          </Section>
        </div>

        <aside className="lg:sticky lg:top-32 self-start">
          <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-5 space-y-4">
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">Order summary</div>
            <div className="divide-y divide-[color:var(--color-line)] max-h-64 overflow-y-auto -mx-1">
              {items.map(item => {
                const p = productFor(item.productId);
                if (!p) return null;
                return (
                  <div key={item.productId} className="flex gap-2 px-1 py-2">
                    <div className="relative w-12 h-14 shrink-0 bg-[color:var(--color-paper)] rounded overflow-hidden">
                      <SafeImage src={p.image} alt={p.title} fallbackSeed={p.title} fill sizes="48px" className="object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium leading-tight line-clamp-2">{p.title}</div>
                      <div className="text-[10px] text-[color:var(--color-ink-muted)] font-mono">Qty {item.qty}</div>
                    </div>
                    <div className="text-xs font-mono">{inr(p.price * item.qty)}</div>
                  </div>
                );
              })}
            </div>
            <div className="border-t border-[color:var(--color-line)] pt-3 space-y-1.5 text-sm">
              <Row label="Subtotal" value={inr(subtotal)} />
              <Row label={delivery === 0 ? 'Delivery' : 'Delivery'} value={delivery === 0 ? 'Free' : inr(delivery)} />
              <Row label="Skyline points" value={`+${pointsEarned.toLocaleString('en-IN')} pts`} accent />
              <div className="border-t border-[color:var(--color-line)] pt-2 flex items-center justify-between">
                <div className="text-sm">Total</div>
                <div className="font-serif text-2xl">{inr(total)}</div>
              </div>
            </div>

            {error && <div className="p-3 bg-[color:var(--color-danger)]/10 text-[color:var(--color-danger)] rounded-md text-xs">{error}</div>}

            <button
              type="submit"
              disabled={placing}
              className="w-full h-12 bg-[color:var(--color-crimson)] text-white rounded-full text-sm font-medium hover:bg-[color:var(--color-crimson-deep)] transition disabled:opacity-50 inline-flex items-center justify-center gap-2"
            >
              {placing ? 'Placing order…' : <>Place order · {inr(total)} <ArrowRight className="w-4 h-4" /></>}
            </button>
            <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] text-center font-mono">
              GST · Free returns · Reserve now
            </div>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Section({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-[color:var(--color-line)] p-6 space-y-4">
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)]">
        <Icon className="w-3 h-3" /> {title}
      </div>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-[color:var(--color-ink-muted)] mb-1">{label}</div>
      {children}
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

function MethodTile({ active, onClick, icon: Icon, title, hint, children }: { active: boolean; onClick: () => void; icon: React.ElementType; title: string; hint: string; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-lg border transition ${active ? 'border-[color:var(--color-ink)] bg-[color:var(--color-paper)]/40 shadow-sm' : 'border-[color:var(--color-line)] hover:border-[color:var(--color-line-strong)]'}`}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${active ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'}`} />
        {active && <Check className="w-4 h-4 text-[color:var(--color-crimson)]" />}
      </div>
      <div className="font-medium text-sm">{title}</div>
      <div className="text-[11px] text-[color:var(--color-ink-muted)]">{hint}</div>
      <div className="mt-2 text-xs font-mono">{children}</div>
    </button>
  );
}

function PayTile({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: React.ElementType; label: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-14 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition ${active ? 'border-[color:var(--color-ink)] bg-[color:var(--color-paper)]/40 shadow-sm' : 'border-[color:var(--color-line)] hover:border-[color:var(--color-line-strong)]'}`}
    >
      <Icon className={`w-4 h-4 ${active ? 'text-[color:var(--color-crimson)]' : 'text-[color:var(--color-ink-muted)]'}`} />
      <span className="text-[10px] uppercase tracking-widest">{label}</span>
    </button>
  );
}

function formatCard(v: string): string {
  const digits = v.replace(/\D/g, '').slice(0, 19);
  return digits.replace(/(.{4})/g, '$1 ').trim();
}
