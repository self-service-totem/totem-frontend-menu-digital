// F10: Aggregator (iFood / Rappi / Uber Eats) mock
import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { AggregatorSettings, DbOrder, KitchenTicket, AggregatorPlatform, DbProduct } from '@/lib/types';

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

const PLATFORM_NAMES: Record<AggregatorPlatform, string> = {
  IFOOD: 'iFood',
  RAPPI: 'Rappi',
  UBER_EATS: 'Uber Eats',
  DIRECT: 'Direto',
};

const PLATFORM_COLORS: Record<AggregatorPlatform, string> = {
  IFOOD: '#ea1d2c',
  RAPPI: '#ff441f',
  UBER_EATS: '#06c167',
  DIRECT: '#6b7280',
};

export const aggregatorService = {
  async listSettings(): Promise<AggregatorSettings[]> {
    return delay(
      getCollection<AggregatorSettings>('aggregatorSettings').filter((s) => s.branchId === BRANCH_ID),
    );
  },

  async updateSettings(id: string, patch: Partial<AggregatorSettings>): Promise<AggregatorSettings | null> {
    return delay(updateOne<AggregatorSettings>('aggregatorSettings', id, patch));
  },

  /** Simulate an incoming order from an aggregator platform */
  async simulateIncomingOrder(platform: AggregatorPlatform): Promise<DbOrder> {
    const products = getCollection<DbProduct>('products').filter((p) => p.available).slice(0, 3);
    const now = new Date().toISOString();
    const orderId = `order-agg-${Date.now()}`;
    const orderNumber = `#${PLATFORM_NAMES[platform].charAt(0)}${Math.floor(1000 + Math.random() * 9000)}`;

    const items = products.slice(0, 2).map((p) => ({
      productId: p.id,
      name: p.name,
      quantity: Math.ceil(Math.random() * 2),
      unitPrice: p.price,
      customerName: 'Cliente Online',
    }));

    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const total = +subtotal.toFixed(2);

    const order: DbOrder = {
      id: orderId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      customerName: `Cliente ${PLATFORM_NAMES[platform]}`,
      items,
      subtotal: total,
      serviceFee: 0,
      total,
      status: 'SENT_TO_KITCHEN',
      paymentStatus: 'PAID',
      paidAmount: total,
      source: platform,
      platform,
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    insertOne('orders', order);

    const ticket: KitchenTicket = {
      id: `kt-agg-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      orderNumber,
      items,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('kitchenTickets', ticket);

    return delay(order);
  },

  getPlatformName(platform: AggregatorPlatform): string {
    return PLATFORM_NAMES[platform];
  },

  getPlatformColor(platform: AggregatorPlatform): string {
    return PLATFORM_COLORS[platform];
  },
};
