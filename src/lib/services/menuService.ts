import { getCollection } from '@/lib/mock-db';
import type { DbCategory, DbProduct } from '@/lib/types';
import { toJsonApiCollectionResponse, toJsonApiResponse } from '@/lib/jsonapi';
import type {
  JsonApiCollectionResponse,
  JsonApiResponse,
  CategoryAttributes,
  ProductAttributes,
} from '@/lib/jsonapi';
import { delay } from './api';

// GET /v1/public/menu/categories?branchId=...
// Returns JSON:API collection. Callers use mapCategoriesResponseToViewModels().
export const menuService = {
  async listCategories(): Promise<JsonApiCollectionResponse<CategoryAttributes>> {
    const rows = getCollection<DbCategory>('categories')
      .filter((c) => c.active)
      .sort((a, b) => a.order - b.order);

    const resources = rows.map((c) => ({
      type: 'category' as const,
      id: c.id,
      attributes: {
        name: c.name,
        imageUrl: c.imageUrl,
        order: c.order,
        active: c.active,
        branchId: c.branchId,
      } satisfies CategoryAttributes,
    }));

    return delay(toJsonApiCollectionResponse(resources));
  },

  async listProducts(): Promise<JsonApiCollectionResponse<ProductAttributes>> {
    const rows = getCollection<DbProduct>('products');

    const resources = rows.map((p) => ({
      type: 'product' as const,
      id: p.id,
      attributes: {
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        featured: p.featured ?? false,
        available: p.available,
        branchId: p.branchId,
      } satisfies ProductAttributes,
      relationships: {
        category: { data: { type: 'category', id: p.categoryId } },
      },
    }));

    return delay(toJsonApiCollectionResponse(resources));
  },

  async getProduct(id: string): Promise<JsonApiResponse<ProductAttributes> | null> {
    const p = getCollection<DbProduct>('products').find((x) => x.id === id);
    if (!p) return delay(null);

    const resource = {
      type: 'product' as const,
      id: p.id,
      attributes: {
        name: p.name,
        description: p.description,
        price: p.price,
        imageUrl: p.imageUrl,
        categoryId: p.categoryId,
        featured: p.featured ?? false,
        available: p.available,
        branchId: p.branchId,
      } satisfies ProductAttributes,
      relationships: {
        category: { data: { type: 'category', id: p.categoryId } },
      },
    };

    return delay(toJsonApiResponse(resource));
  },
};
