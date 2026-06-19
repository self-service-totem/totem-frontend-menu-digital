import { getCollection, insertOne, updateOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { DbProduct, DbCategory, DbOrder, KitchenTicket, QueueTicket, CartItem } from '@/lib/types';

function delay<T>(val: T, ms = 200): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

export const kioskService = {
  async listCategories(): Promise<DbCategory[]> {
    return delay(
      getCollection<DbCategory>('categories')
        .filter((c) => c.active)
        .sort((a, b) => a.order - b.order),
    );
  },

  async listProducts(categoryId?: string): Promise<DbProduct[]> {
    const all = getCollection<DbProduct>('products').filter((p) => p.available);
    return delay(categoryId ? all.filter((p) => p.categoryId === categoryId) : all);
  },

  async placeOrder(
    customerName: string,
    items: CartItem[],
    _serviceType: 'EAT_IN' | 'TAKEAWAY',
  ): Promise<{ order: DbOrder; queueTicket: QueueTicket }> {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const serviceFee = +(subtotal * 0.1).toFixed(2);
    const total = +(subtotal + serviceFee).toFixed(2);
    const now = new Date().toISOString();
    const orderId = `order-kiosk-${Date.now()}`;
    const orderNumber = `#K${Math.floor(1000 + Math.random() * 9000)}`;

    const order: DbOrder = {
      id: orderId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      customerName,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        note: i.note,
      })),
      subtotal: +subtotal.toFixed(2),
      serviceFee,
      total,
      status: 'SENT_TO_KITCHEN',
      paymentStatus: 'PAID',
      paidAmount: total,
      source: 'KIOSK',
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    insertOne('orders', order);

    const ticket: KitchenTicket = {
      id: `kt-kiosk-${Date.now()}`,
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

    const ticketNumbers = getCollection<QueueTicket>('queueTickets').map((t) => t.ticketNumber);
    const nextNumber = ticketNumbers.length > 0 ? Math.max(...ticketNumbers) + 1 : 1;

    const queueTicket: QueueTicket = {
      id: `qt-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      orderNumber,
      ticketNumber: nextNumber,
      customerName,
      status: 'WAITING',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('queueTickets', queueTicket);

    return delay({ order, queueTicket });
  },

  /** Crea una orden en efectivo pendiente de cobro en caja.
   *  No genera ticket de cocina ni turno — se generan al confirmar el pago. */
  async placeCashOrder(
    customerName: string,
    items: CartItem[],
  ): Promise<{ order: DbOrder }> {
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
    const serviceFee = +(subtotal * 0.1).toFixed(2);
    const total = +(subtotal + serviceFee).toFixed(2);
    const now = new Date().toISOString();
    const orderId = `order-kiosk-${Date.now()}`;
    const orderNumber = `#K${Math.floor(1000 + Math.random() * 9000)}`;

    const order: DbOrder = {
      id: orderId,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      customerName,
      items: items.map((i) => ({
        productId: i.productId,
        name: i.name,
        quantity: i.quantity,
        unitPrice: i.unitPrice,
        note: i.note,
      })),
      subtotal: +subtotal.toFixed(2),
      serviceFee,
      total,
      status: 'CREATED',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      source: 'KIOSK',
      orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    insertOne('orders', order);

    return delay({ order });
  },

  /** Devuelve los pedidos kiosk en efectivo que esperan ser cobrados en caja. */
  listPendingCashOrders(): DbOrder[] {
    return getCollection<DbOrder>('orders')
      .filter((o) => o.source === 'KIOSK' && o.paymentStatus === 'UNPAID')
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  },

  /** Devuelve los pedidos kiosk pagados hoy (cualquier método). */
  listPaidKioskOrdersToday(): (DbOrder & { ticketNumber?: number })[] {
    const today = new Date().toISOString().slice(0, 10);
    const orders = getCollection<DbOrder>('orders')
      .filter((o) => o.source === 'KIOSK' && o.paymentStatus === 'PAID' && o.createdAt.startsWith(today))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const queueTickets = getCollection<QueueTicket>('queueTickets');
    return orders.map((o) => ({
      ...o,
      ticketNumber: queueTickets.find((q) => q.orderId === o.id)?.ticketNumber,
    }));
  },

  /** Marca el pedido como pagado, envía a cocina y genera el turno. */
  async confirmCashPayment(orderId: string): Promise<{ order: DbOrder; queueTicket: QueueTicket }> {
    const now = new Date().toISOString();
    const source = getCollection<DbOrder>('orders').find((o) => o.id === orderId);
    if (!source) throw new Error(`Order ${orderId} not found`);

    const order = updateOne<DbOrder>('orders', orderId, {
      paymentStatus: 'PAID',
      paidAmount: source.total,
      status: 'SENT_TO_KITCHEN',
    })!;

    const kitchenTicket: KitchenTicket = {
      id: `kt-kiosk-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      orderNumber: order.orderNumber,
      items: order.items,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('kitchenTickets', kitchenTicket);

    const ticketNumbers = getCollection<QueueTicket>('queueTickets').map((t) => t.ticketNumber);
    const nextNumber = ticketNumbers.length > 0 ? Math.max(...ticketNumbers) + 1 : 1;

    const queueTicket: QueueTicket = {
      id: `qt-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId,
      orderNumber: order.orderNumber,
      ticketNumber: nextNumber,
      customerName: order.customerName,
      status: 'WAITING',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('queueTickets', queueTicket);

    return delay({ order, queueTicket });
  },
};
