import { describe, it, expect } from 'vitest';
import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BagProvider, useBag } from '@/components/bag-provider';
import { ALL_PRODUCTS } from '@/lib/products';
import { saveBag } from '@/lib/bag';

const P1 = ALL_PRODUCTS[0];
const P2 = ALL_PRODUCTS[1];

function wrapper({ children }: { children: React.ReactNode }) {
  return <BagProvider>{children}</BagProvider>;
}

describe('BagProvider', () => {
  it('starts empty for a fresh visitor', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));
    expect(result.current.items).toEqual([]);
    expect(result.current.subtotal).toBe(0);
  });

  it('adds items and increments the count + subtotal', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id); });
    expect(result.current.count).toBe(1);
    expect(result.current.subtotal).toBe(P1.price);
    expect(result.current.isInBag(P1.id)).toBe(true);
  });

  it('re-adding an existing product increments the quantity', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id); });
    act(() => { result.current.add(P1.id, 2); });

    expect(result.current.items).toHaveLength(1);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(P1.price * 3);
  });

  it('holds separate lines for different products', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id); });
    act(() => { result.current.add(P2.id, 2); });

    expect(result.current.items).toHaveLength(2);
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(P1.price + P2.price * 2);
  });

  it('updateQty sets a new quantity and drops the line at 0', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id, 3); });
    act(() => { result.current.updateQty(P1.id, 5); });
    expect(result.current.count).toBe(5);

    act(() => { result.current.updateQty(P1.id, 0); });
    expect(result.current.items).toEqual([]);
    expect(result.current.isInBag(P1.id)).toBe(false);
  });

  it('remove pulls a specific product line', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id); });
    act(() => { result.current.add(P2.id); });
    act(() => { result.current.remove(P1.id); });

    expect(result.current.items.map(i => i.productId)).toEqual([P2.id]);
  });

  it('clear empties the bag', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id); });
    act(() => { result.current.add(P2.id, 2); });
    act(() => { result.current.clear(); });

    expect(result.current.items).toEqual([]);
    expect(result.current.count).toBe(0);
    expect(result.current.subtotal).toBe(0);
  });

  it('persists to localStorage across mounts', async () => {
    const { result, unmount } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add(P1.id, 4); });
    unmount();

    const { result: r2 } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(r2.current.count).toBe(4));
    expect(r2.current.items[0].productId).toBe(P1.id);
  });

  it('hydrates from a pre-existing bag on mount', async () => {
    saveBag([{ productId: P2.id, qty: 7, addedAt: '2026-01-01T00:00:00.000Z' }]);

    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(7));
    expect(result.current.subtotal).toBe(P2.price * 7);
  });

  it('ignores unknown product ids in the subtotal computation', async () => {
    const { result } = renderHook(() => useBag(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(0));

    act(() => { result.current.add('nonexistent-sku', 3); });
    expect(result.current.count).toBe(3);
    expect(result.current.subtotal).toBe(0);
  });

  it('exposes the same view to concurrent consumers of the context', async () => {
    function Consumer() {
      const bag = useBag();
      return (
        <div>
          <span data-testid="count">{bag.count}</span>
          <button onClick={() => bag.add(P1.id)}>add</button>
        </div>
      );
    }
    render(<BagProvider><Consumer /></BagProvider>);
    await waitFor(() => expect(screen.getByTestId('count')).toHaveTextContent('0'));

    const user = userEvent.setup();
    await user.click(screen.getByText('add'));
    expect(screen.getByTestId('count')).toHaveTextContent('1');
  });
});
