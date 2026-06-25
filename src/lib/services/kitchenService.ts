import { getCollection, updateOne, findById, insertOne, BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type {
  KitchenTicket,
  KitchenTicketStatus,
  QueueTicket,
  DbOrder,
  DbTable,
  FullOrderStatus,
  Payment,
} from '@/lib/types';

function delay<T>(val: T, ms = 200): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

// Maps kitchen ticket status → order status
const TICKET_TO_ORDER: Partial<Record<KitchenTicketStatus, FullOrderStatus>> = {
  PREPARING: 'PREPARING',
  READY: 'READY',
  DELIVERED: 'DELIVERED',
};

// Maps kitchen ticket status → table status (for table-service orders)
function nextTableStatus(
  kitchenStatus: KitchenTicketStatus,
): DbTable['status'] | null {
  switch (kitchenStatus) {
    case 'PREPARING':
      return 'WAITING_FOR_KITCHEN';
    case 'READY':
      return 'READY_TO_SERVE';
    case 'DELIVERED':
      return 'WAITING_FOR_PAYMENT';
    default:
      return null;
  }
}

export const kitchenService = {
  async listTickets(filter?: KitchenTicketStatus | 'ALL'): Promise<KitchenTicket[]> {
    const all = getCollection<KitchenTicket>('kitchenTickets').filter(
      (t) => t.status !== 'DELIVERED' && t.status !== 'CANCELED',
    );
    const filtered =
      !filter || filter === 'ALL' ? all : all.filter((t) => t.status === filter);
    return delay(filtered.sort((a, b) => a.createdAt.localeCompare(b.createdAt)));
  },

  async getTicket(id: string): Promise<KitchenTicket | null> {
    return delay(findById<KitchenTicket>('kitchenTickets', id));
  },

  async updateStatus(id: string, newStatus: KitchenTicketStatus): Promise<KitchenTicket | null> {
    const updated = updateOne<KitchenTicket>('kitchenTickets', id, { status: newStatus });
    if (!updated) return delay(null);

    // 1. Propagate to DbOrder
    const orderStatus = TICKET_TO_ORDER[newStatus];
    if (orderStatus) {
      updateOne<DbOrder>('orders', updated.orderId, { status: orderStatus });
    }

    // 2. Propagate to DbTable (only for table-service orders that have a tableId)
    const order = findById<DbOrder>('orders', updated.orderId);
    if (order?.tableId) {
      const tableStatus = nextTableStatus(newStatus);
      if (tableStatus) {
        updateOne<DbTable>('tables', order.tableId, { status: tableStatus });
      }
    }

    // 3. When READY: update QueueTicket → CALLED so Queue Display highlights it
    if (newStatus === 'READY') {
      const tickets = getCollection<QueueTicket>('queueTickets');
      const qt = tickets.find((t) => t.orderId === updated.orderId);
      if (qt) {
        updateOne<QueueTicket>('queueTickets', qt.id, { status: 'CALLED' });
      }
    }

    // 4. When DELIVERED: update QueueTicket → COMPLETED + auto-create Payment if none exists
    if (newStatus === 'DELIVERED') {
      const queueTickets = getCollection<QueueTicket>('queueTickets');
      const qt = queueTickets.find((t) => t.orderId === updated.orderId);
      if (qt) {
        updateOne<QueueTicket>('queueTickets', qt.id, { status: 'COMPLETED' });
      }

      // Ensure Cashier can see the order without requiring the customer to request the bill
      const deliveredOrder = findById<DbOrder>('orders', updated.orderId);
      if (deliveredOrder && deliveredOrder.paymentStatus === 'UNPAID') {
        const alreadyHasPayment = getCollection<Payment>('payments').some(
          (p) => p.orderId === deliveredOrder.id,
        );
        if (!alreadyHasPayment) {
          const now = new Date().toISOString();
          insertOne<Payment>('payments', {
            id: `pay-delivered-${Date.now()}`,
            tenantId: TENANT_ID,
            branchId: BRANCH_ID,
            orderId: deliveredOrder.id,
            orderNumber: deliveredOrder.orderNumber,
            tableId: deliveredOrder.tableId,
            tableNumber: deliveredOrder.tableNumber,
            customerName: deliveredOrder.customerName,
            total: deliveredOrder.total,
            paidAmount: 0,
            status: 'UNPAID',
            createdAt: now,
            updatedAt: now,
          });
        }
      }
    }

    return delay(updated);
  },
};
