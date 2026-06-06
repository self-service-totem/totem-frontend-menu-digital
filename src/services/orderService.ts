import type { Bill, BillCustomer, BillItem, CartItem, Order, PlaceOrderRequest } from '@/types';
import { delay } from './api';
import {
  insertOne,
  updateOne,
  getCollection,
  BRANCH_ID,
  TENANT_ID,
} from '@/lib/mock-db';
import type { DbOrder, DbTable, KitchenTicket, Payment, Branch } from '@/lib/types';

export interface CloseBillResponse {
  ok: true;
  ticketId: string;
}

export const orderService = {
  // POST /v1/public/tables/{tableId}/orders
  async placeOrder(
    tableId: string,
    payload: PlaceOrderRequest,
    cartItems: CartItem[],
  ): Promise<Order> {
    const branch = getCollection<Branch>('branches')[0];
    const serviceFeeRate = branch?.serviceFeeRate ?? 0.1;
    const subtotal = cartItems.reduce((acc, it) => acc + it.unitPrice * it.quantity, 0);
    const serviceFee = +(subtotal * serviceFeeRate).toFixed(2);
    const total = +(subtotal + serviceFee).toFixed(2);
    const now = new Date().toISOString();
    const order: Order = {
      id: `order-${Date.now()}`,
      orderNumber: `#${Math.floor(1000 + Math.random() * 9000)}`,
      customerName: payload.customerName,
      items: cartItems.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        note: it.note,
      })),
      subtotal: +subtotal.toFixed(2),
      serviceFee,
      total,
      status: 'pending',
      createdAt: now,
    };

    // Resolve table from mock-db
    const tables = getCollection<DbTable>('tables');
    const table = tables.find((t) => t.id === tableId || t.number === tableId);

    const dbOrder: DbOrder = {
      id: order.id,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      tableId: table?.id ?? tableId,
      tableNumber: table?.number ?? tableId,
      customerName: payload.customerName,
      items: order.items.map((it) => ({
        productId: it.productId,
        name: it.name,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        note: it.note,
        customerName: payload.customerName,
      })),
      subtotal: order.subtotal,
      serviceFee: order.serviceFee,
      total: order.total,
      status: 'SENT_TO_KITCHEN',
      paymentStatus: 'UNPAID',
      paidAmount: 0,
      source: 'MENU',
      orderNumber: order.orderNumber,
      createdAt: now,
      updatedAt: now,
    };
    insertOne('orders', dbOrder);

    // Create kitchen ticket
    const ticket: KitchenTicket = {
      id: `kt-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId: order.id,
      orderNumber: order.orderNumber,
      tableNumber: table?.number ?? tableId,
      items: dbOrder.items,
      status: 'NEW',
      createdAt: now,
      updatedAt: now,
    };
    insertOne('kitchenTickets', ticket);

    // Update table status to ORDER_IN_PROGRESS
    if (table) {
      updateOne<DbTable>('tables', table.id, { status: 'ORDER_IN_PROGRESS' });
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[orderService.placeOrder]', tableId, order.orderNumber);
    }
    return delay(order, 400);
  },

  // GET /v1/public/customers/me/orders — reads real orders from mock-db for the current session
  async listMyOrders(customerName?: string): Promise<Order[]> {
    const dbOrders = getCollection<DbOrder>('orders').filter(
      (o) => !customerName || o.customerName === customerName,
    ).sort((a, b) => b.createdAt.localeCompare(a.createdAt));

    const orders: Order[] = dbOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      customerName: o.customerName,
      items: o.items,
      subtotal: o.subtotal,
      serviceFee: o.serviceFee,
      total: o.total,
      status: o.status === 'CLOSED' ? 'closed' : o.status === 'DELIVERED' ? 'delivered' : o.status === 'PREPARING' ? 'preparing' : 'pending',
      createdAt: o.createdAt,
    }));
    return delay(orders);
  },

  // GET /v1/public/tables/{tableId}/bill
  // Reads real orders from mock-db and builds the bill dynamically.
  async getBill(tableId: string): Promise<Bill> {
    const tables = getCollection<DbTable>('tables');
    const table = tables.find((t) => t.id === tableId || t.number === tableId);
    const tableIdResolved = table?.id ?? tableId;
    const tableNumber = table?.number ?? tableId;

    const orders = getCollection<DbOrder>('orders').filter(
      (o) =>
        o.tableId === tableIdResolved &&
        o.status !== 'CANCELED' &&
        o.status !== 'CLOSED',
    );

    // Group by customerName
    const customerMap = new Map<string, BillItem[]>();
    for (const order of orders) {
      const existing = customerMap.get(order.customerName) ?? [];
      for (const item of order.items) {
        existing.push({
          productId: item.productId,
          productName: item.name,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: +(item.unitPrice * item.quantity).toFixed(2),
          notes: item.note,
        });
      }
      customerMap.set(order.customerName, existing);
    }

    const realCustomers: BillCustomer[] = [...customerMap.entries()].map(([name, items]) => ({
      customerName: name,
      items,
      subtotal: +items.reduce((s, i) => s + i.total, 0).toFixed(2),
    }));

    // Demo padding: when there is only 1 real customer (or none), add placeholder
    // tablemates so the Mesa tab always shows a realistic multi-person scenario.
    // localStorage is per-browser; a real backend would remove the need for this.
    const realNames = new Set(realCustomers.map((c) => c.customerName));
    const DEMO_TABLEMATES: BillCustomer[] = [
      {
        customerName: 'Pepe',
        items: [
          { productId: 'prod-entrada-mirante', productName: 'Entrada Mirante', quantity: 1, unitPrice: 42.0, total: 42.0 },
          { productId: 'prod-suco-laranja', productName: 'Suco de laranja', quantity: 1, unitPrice: 12.0, total: 12.0 },
        ],
        subtotal: 54.0,
      },
      {
        customerName: 'Juan',
        items: [
          { productId: 'prod-carne-de-sol', productName: 'Carne de sol c/ aipim', quantity: 1, unitPrice: 78.9, total: 78.9 },
        ],
        subtotal: 78.9,
      },
    ];

    const demoToAdd = realCustomers.length <= 1
      ? DEMO_TABLEMATES.filter((d) => !realNames.has(d.customerName))
      : [];

    const customers = [...realCustomers, ...demoToAdd];
    const subtotal = +customers.reduce((s, c) => s + c.subtotal, 0).toFixed(2);
    const serviceFee = +(subtotal * 0.1).toFixed(2);

    return delay({
      tableId: tableIdResolved,
      tableName: `Mesa ${tableNumber}`,
      customers,
      subtotal,
      serviceFee,
      tableTotal: +(subtotal + serviceFee).toFixed(2),
    });
  },

  // POST /v1/public/tables/{tableId}/bill/close-request
  // Creates a pending Payment visible to the Cashier.
  async requestCloseBill(
    tableId: string,
    payload: { customerName: string },
  ): Promise<CloseBillResponse> {
    const tables = getCollection<DbTable>('tables');
    const table = tables.find((t) => t.id === tableId || t.number === tableId);
    const tableIdResolved = table?.id ?? tableId;

    // Find all unpaid orders for this table
    const orders = getCollection<DbOrder>('orders').filter(
      (o) => o.tableId === tableIdResolved && o.paymentStatus === 'UNPAID',
    );

    const now = new Date().toISOString();
    const ticketId = `cb-${Date.now()}`;

    // Create one Payment per unpaid order (if not already created)
    const existingPayments = getCollection<Payment>('payments');
    for (const order of orders) {
      const alreadyExists = existingPayments.some((p) => p.orderId === order.id);
      if (!alreadyExists) {
        const payment: Payment = {
          id: `pay-${Date.now()}-${order.id}`,
          tenantId: TENANT_ID,
          branchId: BRANCH_ID,
          orderId: order.id,
          orderNumber: order.orderNumber,
          tableId: tableIdResolved,
          tableNumber: table?.number ?? tableId,
          customerName: payload.customerName || order.customerName,
          total: order.total,
          paidAmount: 0,
          status: 'UNPAID',
          createdAt: now,
          updatedAt: now,
        };
        insertOne('payments', payment);
      }
    }

    // Update table status → WAITING_FOR_PAYMENT
    if (table) {
      updateOne<DbTable>('tables', table.id, { status: 'WAITING_FOR_PAYMENT' });
    }

    if (import.meta.env.DEV) {
      // eslint-disable-next-line no-console
      console.info('[orderService.requestCloseBill]', tableId, payload);
    }
    return delay({ ok: true as const, ticketId }, 350);
  },
};
