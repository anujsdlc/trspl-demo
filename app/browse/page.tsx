import { FavouritesProvider } from '@/components/favourites';
import { StoreNav, StoreFooter } from '@/components/store-nav';
import { BrowseGrid } from '@/components/browse-grid';
import { getServerCatalog } from '@/lib/catalog.server';

export const dynamic = 'force-dynamic';

export default async function BrowsePage({ searchParams }: PageProps<'/browse'>) {
  const params = await searchParams;
  const initialCat = (params.cat as string) || 'all';
  const initialBrand = (params.brand as string) || 'all';
  const catalog = await getServerCatalog();

  return (
    <FavouritesProvider>
      <StoreNav />
      <div className="container-editorial py-12 md:py-20">
        <div className="mb-12">
          <div className="text-[11px] uppercase tracking-[0.3em] text-[color:var(--color-ink-muted)] mb-3">Catalog</div>
          <h1 className="font-serif text-5xl md:text-7xl leading-none tracking-tighter">
            The whole shelf. <span className="italic">Filtered.</span>
          </h1>
          <p className="mt-6 text-[color:var(--color-ink-muted)] max-w-xl">
            {catalog.length.toLocaleString()} products across 7 sub-brands. Live inventory across 51 stores.
          </p>
        </div>
        <BrowseGrid initialCat={initialCat} initialBrand={initialBrand} />
      </div>
      <StoreFooter />
    </FavouritesProvider>
  );
}
