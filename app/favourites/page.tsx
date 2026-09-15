import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { FavouritesView } from '@/components/favourites-view';

export default function FavouritesPage() {
  return (
    <FavouritesProvider>
      <StoreNav />
      <FavouritesView />
      <StoreFooter />
    </FavouritesProvider>
  );
}
