import type { Category, Product } from '@/types';
import { mockCategories, mockProducts } from '@/mocks';
import { delay } from './api';

export const menuService = {
  async listCategories(): Promise<Category[]> {
    return delay(mockCategories);
  },
  async listProducts(): Promise<Product[]> {
    return delay(mockProducts);
  },
  async getProduct(id: string): Promise<Product | undefined> {
    return delay(mockProducts.find((p) => p.id === id));
  },
};
