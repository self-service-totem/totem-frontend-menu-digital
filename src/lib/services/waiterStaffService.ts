import { getCollection, updateOne, insertOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { DbTable, WaiterCall, DbOrder, Payment } from '@/lib/types';

function delay<T>(val: T, ms = 200): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

export const waiterStaffService = {
  async listTables(): Promise<DbTable[]> {
    return delay(
      getCollection<DbTable>('tables')
        .filter((t) => t.active)
        .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    );
  },

  async getTableOrders(tableId: string): Promise<DbOrder[]> {
    const orders = getCollection<DbOrder>('orders').filter(
      (o) => o.tableId === tableId && o.status !== 'CANCELED' && o.status !== 'DELIVERED',
    );
    return delay(orders);
  },

  async listCalls(): Promise<WaiterCall[]> {
    return delay(
      getCollection<WaiterCall>('waiterCalls').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async acknowledgeCall(id: string): Promise<WaiterCall | null> {
    return delay(updateOne<WaiterCall>('waiterCalls', id, { status: 'ACKNOWLEDGED' }));
  },

  async resolveCall(id: string): Promise<WaiterCall | null> {
    return delay(updateOne<WaiterCall>('waiterCalls', id, { status: 'RESOLVED' }));
  },

  async requestBill(tableId: string): Promise<void> {
    const table = getCollection<DbTable>('tables').find((t) => t.id === tableId);
    if (!table) return delay(undefined as unknown as void);

    // Find open orders for this table
    const orders = getCollection<DbOrder>('orders').filter(
      (o) => o.tableId === tableId && o.paymentStatus === 'UNPAID',
    );

    const now = new Date().toISOString();
    for (const order of orders) {
      const existing = getCollection<Payment>('payments').find((p) => p.orderId === order.id);
      if (!existing) {
        const payment: Payment = {
          id: `pay-${Date.now()}-${order.id}`,
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableId,
          tableNumber: table.number,
          customerName: order.customerName,
          total: order.total,
          paidAmount: 0,
          status: 'UNPAID',
          createdAt: now,
          updatedAt: now,
        };
        insertOne('payments', payment);
      }
    }

    updateOne<DbTable>('tables', tableId, { status: 'WAITING_FOR_PAYMENT' });
    return delay(undefined as unknown as void);
  },
};
