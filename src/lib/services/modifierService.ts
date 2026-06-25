// F1: Product modifier groups
import { getCollection, insertOne, updateOne, findWhere, setCollection } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { ModifierGroup } from '@/lib/types';

function delay<T>(v: T, ms = 150): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

export const modifierService = {
  async listForProduct(productId: string): Promise<ModifierGroup[]> {
    return delay(findWhere<ModifierGroup>('modifierGroups', (g) => g.productId === productId));
  },

  async create(
    data: Omit<ModifierGroup, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt'>,
  ): Promise<ModifierGroup> {
    const now = new Date().toISOString();
    const group: ModifierGroup = {
      id: `mg-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      createdAt: now,
      updatedAt: now,
      ...data,
    };
    return delay(insertOne('modifierGroups', group));
  },

  async update(id: string, patch: Partial<ModifierGroup>): Promise<ModifierGroup | null> {
    return delay(updateOne<ModifierGroup>('modifierGroups', id, patch));
  },

  async delete(id: string): Promise<void> {
    const all = getCollection<ModifierGroup>('modifierGroups').filter((g) => g.id !== id);
    setCollection('modifierGroups', all);
    return delay(undefined as unknown as void);
  },
};
