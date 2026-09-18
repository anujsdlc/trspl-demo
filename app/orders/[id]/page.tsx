import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { OrderView } from '@/components/order-view';

export default async function OrderPage({ params }: PageProps<'/orders/[id]'>) {
  const { id } = await params;
  return (
    <FavouritesProvider>
      <StoreNav />
      <OrderView id={id} />
      <StoreFooter />
    </FavouritesProvider>
  );
}
