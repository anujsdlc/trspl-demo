import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { CheckoutView } from '@/components/checkout-view';

export default function CheckoutPage() {
  return (
    <FavouritesProvider>
      <StoreNav />
      <CheckoutView />
      <StoreFooter />
    </FavouritesProvider>
  );
}
