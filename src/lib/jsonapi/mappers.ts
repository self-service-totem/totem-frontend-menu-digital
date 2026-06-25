// Mapper functions: JSON:API resource → UI view model.
// The UI layer calls these after receiving a service response.
// This isolates the JSON:API contract from the component props shape.

import type { JsonApiCollectionResponse, JsonApiResponse, JsonApiResource } from './types';
import type { MenuContext, Category, Product } from '@/lib/types';

// ─── Attribute shapes (mirror future backend contract) ────────────────────────

export interface MenuContextAttributes {
  tableId: string;
  tableName: string;
  restaurantName: string;
  language: string;
  currency: string;
  serviceFeeRate: number;
  tableValidationCode?: string;
}

export interface BusinessAttributes {
  slug: string;
  name: string;
  currency: string;
  serviceFeeRate: number;
  logoUrl?: string;
}

export interface TableAttributes {
  number: string;
  businessId: string;
  branchId: string;
  active: boolean;
}

export interface CategoryAttributes {
  name: string;
  imageUrl: string;
  order: number;
  active: boolean;
  branchId: string;
}

export interface ProductAttributes {
  name: string;
  description?: string;
  price: number;
  imageUrl: string;
  categoryId: string;
  featured: boolean;
  available: boolean;
  branchId: string;
}

// ─── MenuContext mapper ───────────────────────────────────────────────────────

export function mapMenuContextResponseToViewModel(
  response: JsonApiResponse<MenuContextAttributes>,
): MenuContext {
  const { attributes } = response.data;
  return {
    tableId: attributes.tableId,
    tableName: attributes.tableName,
    restaurantName: attributes.restaurantName,
    language: attributes.language,
    currency: attributes.currency as MenuContext['currency'],
    serviceFeeRate: attributes.serviceFeeRate,
    tableValidationCode: attributes.tableValidationCode,
  };
}

// ─── Category mappers ─────────────────────────────────────────────────────────

export function mapCategoryResourceToViewModel(
  resource: JsonApiResource<CategoryAttributes>,
): Category {
  return {
    id: resource.id,
    name: resource.attributes.name,
    imageUrl: resource.attributes.imageUrl,
    order: resource.attributes.order,
  };
}

export function mapCategoriesResponseToViewModels(
  response: JsonApiCollectionResponse<CategoryAttributes>,
): Category[] {
  return response.data.map(mapCategoryResourceToViewModel);
}

// ─── Product mappers ──────────────────────────────────────────────────────────

export function mapProductResourceToViewModel(
  resource: JsonApiResource<ProductAttributes>,
): Product {
  return {
    id: resource.id,
    name: resource.attributes.name,
    description: resource.attributes.description,
    price: resource.attributes.price,
    imageUrl: resource.attributes.imageUrl,
    categoryId: resource.attributes.categoryId,
    featured: resource.attributes.featured,
    available: resource.attributes.available,
  };
}

export function mapProductsResponseToViewModels(
  response: JsonApiCollectionResponse<ProductAttributes>,
): Product[] {
  return response.data.map(mapProductResourceToViewModel);
}

export function mapProductResponseToViewModel(
  response: JsonApiResponse<ProductAttributes>,
): Product {
  return mapProductResourceToViewModel(response.data);
}
