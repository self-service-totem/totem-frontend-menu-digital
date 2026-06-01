// F7: Delivery mode
import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { DeliveryOrder, DbOrder, KitchenTicket, DeliveryAddress, DbOrderItem } from '@/lib/types';

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

const DELIVERY_FEE = 8.9;
const ESTIMATED_MINUTES = 40;

export const deliveryService = {
  async createDeliveryOrder(params: {
    customerName: string;
    customerPhone: string;
    address: DeliveryAddress;
    items: DbOrderItem[];
  }): Promise<{ order: DbOrder; delivery: DeliveryOrder }> {
    const now = new Date().toISOString();
    const subtotal = params.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const total = +(subtotal + DELIVERY_FEE).toFixed(2);
    const orderId = `order-del-${Date.now()}`;
    const orderNumber = `#D${Math.floor(1000 + Math.random() * 9000)}`;

    const order: DbOrder = {
      id: orderId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      customerName: params.customerName,
      items: params.items.map((i) => ({ ...i, customerName: params.customerName })),
      subtotal: +subtotal.toFixed(2),
      serviceFee: 0,
      total,
      status: 'SENT_TO_KITCHEN',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      source: 'DELIVERY',
      orderNumber,
      deliveryAddress: params.address,
      deliveryFee: DELIVERY_FEE,
      createdAt: now,
      updatedAt: now,
    };
    insertOne('orders', order);

    const ticket: KitchenTicket = {
      id: `kt-del-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      orderNumber,
      items: order.items,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('kitchenTickets', ticket);

    const delivery: DeliveryOrder = {
      id: `del-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      address: params.address,
      fee: DELIVERY_FEE,
      estimatedMinutes: ESTIMATED_MINUTES,
      status: 'ACCEPTED',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('deliveryOrders', delivery);

    return delay({ order, delivery });
  },

  async listDeliveries(): Promise<DeliveryOrder[]> {
    return delay(
      getCollection<DeliveryOrder>('deliveryOrders').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async updateDeliveryStatus(id: string, status: DeliveryOrder['status']): Promise<DeliveryOrder | null> {
    return delay(updateOne<DeliveryOrder>('deliveryOrders', id, { status }));
  },

  getDeliveryFee(): number {
    return DELIVERY_FEE;
  },

  getEstimatedMinutes(): number {
    return ESTIMATED_MINUTES;
  },
};
