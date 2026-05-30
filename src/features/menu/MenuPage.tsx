import { useEffect, useMemo, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { Category, Product } from '@/types';
import { menuService } from '@/services';
import { mapCategoriesResponseToViewModels, mapProductsResponseToViewModels } from '@/lib/jsonapi';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { AppHeader } from '@/components/layout/AppHeader';
import { SearchBar } from '@/components/common/SearchBar';
import { CategoryCarousel } from '@/components/menu/CategoryCarousel';
import { ProductSection } from '@/components/menu/ProductSection';
import { EmptyState } from '@/components/common/EmptyState';
import { ProductDetailModal } from '@/features/product-detail/ProductDetailModal';

export function MenuPage() {
  const params = useParams();
  // Supports both /menu/:tableId (legacy) and /menu/:branchId/table/:tableId (new)
  const tableIdParam = params.tableId ?? params.branchId;
  const [searchParams, setSearchParams] = useSearchParams();
  const { menuContext, tableId, customer, setTableId, loading } = useSession();
  const { t } = useLabels();

  const openProductId = searchParams.get('product');

  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  // Sincroniza el tableId del QR/URL con la sesión.
  useEffect(() => {
    if (tableIdParam && tableIdParam !== tableId) setTableId(tableIdParam);
  }, [tableIdParam, tableId, setTableId]);

  useEffect(() => {
    Promise.all([menuService.listCategories(), menuService.listProducts()]).then(
      ([catsResponse, prodsResponse]) => {
        setCategories(mapCategoriesResponseToViewModels(catsResponse));
        setProducts(mapProductsResponseToViewModels(prodsResponse));
      },
    );
  }, []);

  const handleOpenProduct = (product: Product) => {
    setSearchParams({ product: product.id });
  };

  const handleCloseProduct = () => {
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    let list = products.filter((p) => p.available);
    if (activeCategory) list = list.filter((p) => p.categoryId === activeCategory);
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.description?.toLowerCase().includes(q) ?? false),
      );
    }
    return list;
  }, [products, activeCategory, search]);

  const featured = useMemo(
    () => filtered.filter((p) => p.featured).slice(0, 4),
    [filtered],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, Product[]>();
    for (const p of filtered) {
      const arr = map.get(p.categoryId) ?? [];
      arr.push(p);
      map.set(p.categoryId, arr);
    }
    return categories
      .filter((c) => map.has(c.id))
      .map((c) => ({ category: c, products: map.get(c.id)! }));
  }, [filtered, categories]);

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
        onChange={setSearch}
        placeholder={t('menu.searchPlaceholder')}
      />

      <CategoryCarousel
        categories={categories}
        activeId={activeCategory}
        onSelect={setActiveCategory}
      />

      {/* Promotions: loaded from promotionService when available */}

      {filtered.length === 0 ? (
        <EmptyState
          icon="bi-search"
          title={t('menu.empty')}
          description={t('menu.emptyDesc')}
        />
      ) : search ? (
        <ProductSection
          title={`${t('menu.results')} (${filtered.length})`}
          products={filtered}
          onOpen={handleOpenProduct}
        />
      ) : (
        <>
          {!activeCategory && featured.length > 0 && (
            <ProductSection
              title={t('menu.featured')}
              products={featured}
              onOpen={handleOpenProduct}
                  featured
            />
          )}
          {grouped.map(({ category, products: prods }) => (
            <ProductSection
              key={category.id}
              title={category.name}
              products={prods}
              onOpen={handleOpenProduct}
                />
          ))}
        </>
      )}

      {openProductId && (
        <ProductDetailModal productId={openProductId} onClose={handleCloseProduct} />
      )}
    </div>
  );
}
