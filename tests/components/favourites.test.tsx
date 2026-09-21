import { describe, it, expect } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import { FavouritesProvider, useFavourites } from '@/components/favourites';

function wrapper({ children }: { children: React.ReactNode }) {
  return <FavouritesProvider>{children}</FavouritesProvider>;
}

describe('FavouritesProvider', () => {
  it('starts with an empty set', () => {
    const { result } = renderHook(() => useFavourites(), { wrapper });
    expect(result.current.count).toBe(0);
    expect(result.current.isFav('bk-1')).toBe(false);
  });

  it('toggle adds a product on first click and removes it on the second', () => {
    const { result } = renderHook(() => useFavourites(), { wrapper });

    act(() => { result.current.toggle('bk-1'); });
    expect(result.current.isFav('bk-1')).toBe(true);
    expect(result.current.count).toBe(1);

    act(() => { result.current.toggle('bk-1'); });
    expect(result.current.isFav('bk-1')).toBe(false);
    expect(result.current.count).toBe(0);
  });

  it('supports many favourites in parallel', () => {
    const { result } = renderHook(() => useFavourites(), { wrapper });
    act(() => {
      result.current.toggle('a');
      result.current.toggle('b');
      result.current.toggle('c');
    });
    expect(result.current.count).toBe(3);
    expect(['a', 'b', 'c'].every(id => result.current.isFav(id))).toBe(true);
  });

  it('persists to localStorage across mounts', async () => {
    const { result, unmount } = renderHook(() => useFavourites(), { wrapper });
    act(() => { result.current.toggle('bk-fav'); });
    unmount();

    const { result: r2 } = renderHook(() => useFavourites(), { wrapper });
    await waitFor(() => expect(r2.current.isFav('bk-fav')).toBe(true));
  });

  it('reads existing favourites from localStorage on mount', async () => {
    localStorage.setItem('trs.favs.v1', JSON.stringify(['prev-1', 'prev-2']));

    const { result } = renderHook(() => useFavourites(), { wrapper });
    await waitFor(() => expect(result.current.count).toBe(2));
    expect(result.current.isFav('prev-1')).toBe(true);
    expect(result.current.isFav('prev-2')).toBe(true);
  });
});
