import { getCollection, updateOne, insertOne } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type { DbTable, WaiterCall, DbOrder, Payment, MockUser } from '@/lib/types';

function delay<T>(val: T, ms = 200): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

export interface FloorTable extends DbTable {
  activeOrderCount: number;
  unpaidAmount: number;
  pendingCallCount: number;
  hasReadyOrders: boolean;
  customerNames: string[];
}

export const waiterStaffService = {
  async listTables(): Promise<DbTable[]> {
    return delay(
      getCollection<DbTable>('tables')
        .filter((t) => t.active)
        .sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    );
  },

  async getFloorState(): Promise<FloorTable[]> {
    const tables = getCollection<DbTable>('tables').filter((t) => t.active);
    const allOrders = getCollection<DbOrder>('orders').filter((o) => o.status !== 'CANCELED');
    const allCalls = getCollection<WaiterCall>('waiterCalls');

    const enriched: FloorTable[] = tables.map((table) => {
      const activeOrders = allOrders.filter(
        (o) => o.tableId === table.id && o.status !== 'DELIVERED' && o.status !== 'CLOSED',
      );
      const pendingCalls = allCalls.filter(
        (c) => c.tableId === table.id && (c.status === 'PENDING' || c.status === 'ACKNOWLEDGED'),
      );
      const unpaidOrders = allOrders.filter(
        (o) => o.tableId === table.id && o.paymentStatus !== 'PAID',
      );
      const sessionOrders = allOrders.filter(
        (o) => o.tableId === table.id && o.status !== 'CLOSED' && o.status !== 'CANCELED',
      );

      return {
        ...table,
        activeOrderCount: activeOrders.length,
        unpaidAmount: unpaidOrders.reduce((s, o) => s + (o.total - o.paidAmount), 0),
        pendingCallCount: pendingCalls.length,
        hasReadyOrders: activeOrders.some((o) => o.status === 'READY'),
        customerNames: [...new Set(sessionOrders.map((o) => o.customerName))],
      };
    });

    return delay(
      enriched.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })),
    );
  },

  async getTableOrders(tableId: string): Promise<DbOrder[]> {
    return delay(
      getCollection<DbOrder>('orders').filter(
        (o) => o.tableId === tableId && o.status !== 'CANCELED' && o.status !== 'DELIVERED',
      ),
    );
  },

  async listCalls(): Promise<WaiterCall[]> {
    return delay(
      getCollection<WaiterCall>('waiterCalls').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async listWaiters(): Promise<MockUser[]> {
    return delay(
      getCollection<MockUser>('mockUsers').filter(
        (u) => u.role === 'WAITER' && (u.branchId === BRANCH_ID || u.branchId === null),
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

    updateOne<DbTable>('tables', tableId, { status: 'WAITING_FOR_PAYMENT', updatedAt: now });
    return delay(undefined as unknown as void);
  },

  async assignWaiter(tableId: string, waiterName: string): Promise<void> {
    updateOne<DbTable>('tables', tableId, {
      assignedWaiterName: waiterName,
      updatedAt: new Date().toISOString(),
    });
    return delay(undefined as unknown as void);
  },

  async setGuestCount(tableId: string, count: number): Promise<void> {
    updateOne<DbTable>('tables', tableId, {
      guestCount: count,
      updatedAt: new Date().toISOString(),
    });
    return delay(undefined as unknown as void);
  },

  async openTable(tableId: string): Promise<void> {
    updateOne<DbTable>('tables', tableId, {
      status: 'OCCUPIED',
      updatedAt: new Date().toISOString(),
    });
    return delay(undefined as unknown as void);
  },

  async markServed(tableId: string): Promise<void> {
    updateOne<DbTable>('tables', tableId, {
      status: 'ORDER_IN_PROGRESS',
      updatedAt: new Date().toISOString(),
    });
    return delay(undefined as unknown as void);
  },

  async closeTable(tableId: string): Promise<void> {
    updateOne<DbTable>('tables', tableId, {
      status: 'EMPTY',
      guestCount: 0,
      updatedAt: new Date().toISOString(),
    });
    return delay(undefined as unknown as void);
  },
};
