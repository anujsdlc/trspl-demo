import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import { CheckoutView } from '@/components/checkout-view';
import { BagProvider } from '@/components/bag-provider';
import { ALL_PRODUCTS } from '@/lib/products';
import { loadOrders, saveBag } from '@/lib/bag';
import { DEMO_MEMBER, pointsForBasket, tierFor } from '@/lib/loyalty';
import { fieldFor } from '../helpers';

const CHEAP = ALL_PRODUCTS.find(p => p.price <= 200) ?? ALL_PRODUCTS[0];
const EXPENSIVE = ALL_PRODUCTS.find(p => p.price >= 1000) ?? ALL_PRODUCTS[1];

function seedBag(entries: Array<{ productId: string; qty: number }>) {
  saveBag(entries.map(e => ({ ...e, addedAt: '2026-01-01T00:00:00.000Z' })));
}

function renderCheckout() {
  return render(
    <BagProvider>
      <CheckoutView />
    </BagProvider>
  );
}

// The form has native `required` + type="email" attributes, so a plain click
// on submit is blocked by browser-level validation before our JS handler
// runs. Trigger the submit event directly so we can exercise the JS logic.
function submitForm() {
  const form = document.querySelector('form');
  if (!form) throw new Error('no form on the page');
  fireEvent.submit(form);
}

async function fillContact(user: ReturnType<typeof userEvent.setup>) {
  await user.type(fieldFor('Full name'), 'Ada Lovelace');
  await user.clear(fieldFor('Phone'));
  await user.type(fieldFor('Phone'), '+91 9876543210');
  await user.type(fieldFor('Email'), 'ada@example.com');
}

describe('CheckoutView — empty state', () => {
  it('shows the empty-bag prompt when nothing is in the bag', async () => {
    renderCheckout();
    expect(await screen.findByText(/your bag is empty/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /start shopping/i })).toHaveAttribute('href', '/browse');
  });
});

describe('CheckoutView — summary math', () => {
  it('picks free delivery for pickup and earns at the shopper tier', async () => {
    seedBag([{ productId: EXPENSIVE.id, qty: 1 }]);
    renderCheckout();

    await screen.findByRole('button', { name: /place order/i });
    expect(screen.getAllByText(/^free$/i).length).toBeGreaterThan(0);
    const expectedPoints = pointsForBasket(
      [{ amount: EXPENSIVE.price, category: EXPENSIVE.category }],
      tierFor(DEMO_MEMBER.ytdSpend),
    );
    expect(
      screen.getByText(new RegExp(`\\+${expectedPoints.toLocaleString('en-IN')} pts`))
    ).toBeInTheDocument();
  });
});

describe('CheckoutView — form validation', () => {
  it('rejects an invalid email', async () => {
    seedBag([{ productId: CHEAP.id, qty: 1 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await user.type(fieldFor('Full name'), 'Bob');
    await user.type(fieldFor('Phone'), '9876543210');
    await user.type(fieldFor('Email'), 'not-an-email');
    await user.type(fieldFor('Card number'), '4242 4242 4242 4242');
    submitForm();

    expect(await screen.findByText(/valid email/i)).toBeInTheDocument();
  });

  it('rejects a short phone number', async () => {
    seedBag([{ productId: CHEAP.id, qty: 1 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await user.type(fieldFor('Full name'), 'Bob');
    await user.clear(fieldFor('Phone'));
    await user.type(fieldFor('Phone'), '12');
    await user.type(fieldFor('Email'), 'bob@example.com');
    await user.type(fieldFor('Card number'), '4242 4242 4242 4242');
    submitForm();

    expect(await screen.findByText(/valid phone/i)).toBeInTheDocument();
  });

  it('requires a 6-digit pincode when shipping', async () => {
    seedBag([{ productId: EXPENSIVE.id, qty: 1 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await user.click(screen.getByRole('button', { name: /ship home/i }));
    await fillContact(user);
    await user.type(fieldFor('Delivery address'), '221B Baker Street');
    await user.type(fieldFor('Pincode'), '12');
    await user.type(fieldFor('Card number'), '4242 4242 4242 4242');
    submitForm();

    expect(await screen.findByText(/pincode required/i)).toBeInTheDocument();
  });

  it('rejects a short card number', async () => {
    seedBag([{ productId: CHEAP.id, qty: 1 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await fillContact(user);
    await user.type(fieldFor('Card number'), '4242 4242');
    submitForm();

    expect(await screen.findByText(/valid card number/i)).toBeInTheDocument();
  });

  it('accepts UPI without asking for a card number', async () => {
    seedBag([{ productId: CHEAP.id, qty: 1 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await fillContact(user);
    await user.click(screen.getByRole('button', { name: 'UPI' }));
    expect(screen.queryByText('Card number')).not.toBeInTheDocument();
    expect(screen.getByText('UPI ID')).toBeInTheDocument();
  });
});

describe('CheckoutView — order placement', () => {
  it('persists the order and pushes to the confirmation page', async () => {
    seedBag([{ productId: EXPENSIVE.id, qty: 2 }]);
    renderCheckout();
    const user = userEvent.setup();
    await screen.findByRole('button', { name: /place order/i });

    await fillContact(user);
    await user.click(screen.getByRole('button', { name: 'UPI' }));
    submitForm();

    await waitFor(() => expect(loadOrders()).toHaveLength(1), { timeout: 3000 });
    const order = loadOrders()[0];
    expect(order.lines).toHaveLength(1);
    expect(order.lines[0].qty).toBe(2);
    expect(order.total).toBe(EXPENSIVE.price * 2);
    expect(order.payment.method).toBe('upi');
    expect(order.customer.email).toBe('ada@example.com');

    const { push } = useRouter();
    expect(push).toHaveBeenCalledWith(`/orders/${order.id}`);
  });
});
