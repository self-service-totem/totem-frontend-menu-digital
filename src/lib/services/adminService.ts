import { getCollection, setCollection, insertOne, updateOne, findById } from '@/lib/mock-db';
import type { DbCategory, DbProduct, DbTable, Branch, Tenant, KioskDevice, DbOrder } from '@/lib/types';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';

function delay<T>(val: T, ms = 150): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

function now() {
  return new Date().toISOString();
}

// ─── Categories ──────────────────────────────────────────────────────────────

export const categoryService = {
  async list(): Promise<DbCategory[]> {
    return delay(
      getCollection<DbCategory>('categories').sort((a, b) => a.order - b.order),
    );
  },
  async create(data: Omit<DbCategory, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt'>): Promise<DbCategory> {
    const cat: DbCategory = {
      id: `cat-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    return delay(insertOne('categories', cat));
  },
  async update(id: string, patch: Partial<DbCategory>): Promise<DbCategory | null> {
    return delay(updateOne<DbCategory>('categories', id, patch));
  },
  async reorder(ids: string[]): Promise<void> {
    const cats = getCollection<DbCategory>('categories');
    ids.forEach((id, idx) => {
      const c = cats.find((x) => x.id === id);
      if (c) c.order = idx + 1;
    });
    setCollection('categories', cats);
    return delay(undefined as unknown as void);
  },
};

// ─── Products ────────────────────────────────────────────────────────────────

export const productService = {
  async list(): Promise<DbProduct[]> {
    return delay(getCollection<DbProduct>('products'));
  },
  async create(data: Omit<DbProduct, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt'>): Promise<DbProduct> {
    const prod: DbProduct = {
      id: `prod-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    return delay(insertOne('products', prod));
  },
  async update(id: string, patch: Partial<DbProduct>): Promise<DbProduct | null> {
    return delay(updateOne<DbProduct>('products', id, patch));
  },
  async getById(id: string): Promise<DbProduct | null> {
    return delay(findById<DbProduct>('products', id));
  },
};

// ─── Tables ──────────────────────────────────────────────────────────────────

export const tableService = {
  async list(): Promise<DbTable[]> {
    return delay(
      getCollection<DbTable>('tables').sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    );
  },
  async create(data: Omit<DbTable, 'id' | 'tenantId' | 'branchId' | 'createdAt' | 'updatedAt' | 'validationCode' | 'status'>): Promise<DbTable> {
    const table: DbTable = {
      id: `table-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      status: 'EMPTY',
      validationCode: Math.random().toString(36).slice(2, 6).toUpperCase(),
      createdAt: now(),
      updatedAt: now(),
      ...data,
    };
    return delay(insertOne('tables', table));
  },
  async update(id: string, patch: Partial<DbTable>): Promise<DbTable | null> {
    return delay(updateOne<DbTable>('tables', id, patch));
  },
  async regenerateCode(id: string): Promise<DbTable | null> {
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    return delay(updateOne<DbTable>('tables', id, { validationCode: code }));
  },
};

// ─── Tenant settings ─────────────────────────────────────────────────────────

export const tenantService = {
  async get(): Promise<Tenant | null> {
    return delay(getCollection<Tenant>('tenants')[0] ?? null);
  },
  async update(patch: Partial<Tenant>): Promise<Tenant | null> {
    const tenant = getCollection<Tenant>('tenants')[0];
    if (!tenant) return delay(null);
    return delay(updateOne<Tenant>('tenants', tenant.id, patch));
  },
};

// ─── Branch settings ─────────────────────────────────────────────────────────

export const branchService = {
  async get(): Promise<Branch | null> {
    return delay(getCollection<Branch>('branches')[0] ?? null);
  },
  async update(patch: Partial<Branch>): Promise<Branch | null> {
    const branch = getCollection<Branch>('branches')[0];
    if (!branch) return delay(null);
    return delay(updateOne<Branch>('branches', branch.id, patch));
  },
};

// ─── Orders ──────────────────────────────────────────────────────────────────

export const adminOrderService = {
  async list(): Promise<DbOrder[]> {
    return delay(
      getCollection<DbOrder>('orders').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },
};

// ─── Kiosk devices ───────────────────────────────────────────────────────────

export const kioskDeviceService = {
  async list(): Promise<KioskDevice[]> {
    return delay(getCollection<KioskDevice>('kioskDevices'));
  },
};
