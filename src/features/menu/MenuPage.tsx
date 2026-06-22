import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Category, Product } from '@/lib/types';
import { menuService } from '@/lib/services';
import { mapCategoriesResponseToViewModels, mapProductsResponseToViewModels } from '@/lib/jsonapi';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryCarousel } from '@/components/menu/CategoryCarousel';
import { ProductSection } from '@/components/menu/ProductSection';
import { MenuSkeleton } from '@/components/menu/MenuSkeleton';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { ProductDetailModal } from '@/features/product-detail/ProductDetailModal';

type LoadStatus = 'loading' | 'ready' | 'error';

export function MenuPage() {
  const params = useParams();
  const tableIdParam = params.tableId ?? params.branchId;
  const [searchParams, setSearchParams] = useSearchParams();
  const { menuContext, tableId, customer, setTableId, loading } = useSession();
  const { t } = useLabels();

  const openProductId = searchParams.get('product');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  // Which category accordion is expanded (null = all collapsed)
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<LoadStatus>('loading');

  useEffect(() => {
    if (tableIdParam && tableIdParam !== tableId) setTableId(tableIdParam);
  }, [tableIdParam, tableId, setTableId]);

  const loadMenu = useCallback(() => {
    setStatus('loading');
    Promise.all([menuService.listCategories(), menuService.listProducts()])
      .then(([catsResponse, prodsResponse]) => {
        setCategories(mapCategoriesResponseToViewModels(catsResponse));
        setProducts(mapProductsResponseToViewModels(prodsResponse));
        setStatus('ready');
      })
      .catch(() => setStatus('error'));
  }, []);

  useEffect(() => {
    loadMenu();
  }, [loadMenu]);

  // Products indexed by category for O(1) lookup
  const productsByCategory = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of products) {
      if (!p.available) continue;
      const arr = map.get(p.categoryId) ?? [];
      arr.push(p);
      map.set(p.categoryId, arr);
    }
    return map;
  }, [products]);

  // Flat search results (when search query is active)
  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return null;
    return products.filter(
      (p) =>
        p.available &&
        (p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false)),
    );
  }, [products, search]);

  const handleOpenProduct = (product: Product) => setSearchParams({ product: product.id });
  const handleCloseProduct = () => setSearchParams({});

  // Toggle accordion — clicking an already-open category collapses it
  const handleToggle = (categoryId: string) => {
    setActiveCategory((prev) => (prev === categoryId ? null : categoryId));
  };

  if (loading || !menuContext) {
    return (
      <div className="ff-page">
        <div className="ff-empty">
          <i className="bi bi-arrow-repeat" />
          <p>{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-page">
      <AppHeader
        businessName={menuContext.restaurantName}
        tableName={menuContext.tableName}
        customerName={customer?.name}
      />

      <SearchBar
        value={search}
        onChange={(v) => {
          setSearch(v);
          if (v) setActiveCategory(null); // clear accordion when searching
        }}
        placeholder={t('menu.searchPlaceholder')}
      />

      {/* Category circles — clicking expands that category's accordion */}
      {!search && status === 'ready' && (
        <CategoryCarousel
          categories={categories}
          activeId={activeCategory}
          onSelect={setActiveCategory}
        />
      )}

      {status === 'loading' && <MenuSkeleton />}

      {status === 'error' && (
        <EmptyState
          icon="bi-wifi-off"
          title={t('menu.loadError')}
          action={<PrimaryButton onClick={loadMenu}>{t('menu.retry')}</PrimaryButton>}
        />
      )}

      {status === 'ready' && (
        searchResults ? (
          searchResults.length === 0 ? (
            <EmptyState icon="bi-search" title={t('menu.empty')} description={t('menu.emptyDesc')} />
          ) : (
            <ProductSection
              title={`${t('menu.results')} (${searchResults.length})`}
              products={searchResults}
              onOpen={handleOpenProduct}
              isExpanded
            />
          )
        ) : (
          // Accordion: all categories collapsed; tapping a banner expands it
          <div className="ff-accordion">
            {categories.map((cat) => (
              <ProductSection
                key={cat.id}
                title={cat.name}
                imageUrl={cat.imageUrl}
                products={productsByCategory.get(cat.id) ?? []}
                isExpanded={activeCategory === cat.id}
                onToggle={() => handleToggle(cat.id)}
                onOpen={handleOpenProduct}
              />
            ))}
          </div>
        )
      )}

      {openProductId && (
        <ProductDetailModal productId={openProductId} onClose={handleCloseProduct} />
      )}
    </div>
  );
}
