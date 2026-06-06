import { getCollection, updateOne, insertOne, findById } from '@/lib/mock-db';
import { BRANCH_ID, TENANT_ID } from '@/lib/mock-db';
import type {
  Payment,
  DbOrder,
  DbTable,
  Invoice,
  Receipt,
  PaymentTransaction,
  PaymentMethod,
} from '@/lib/types';

// ─── Grouped-view types ───────────────────────────────────────────────────────

export interface CustomerGroup {
  name: string;
  orders: DbOrder[];
  payments: Payment[];
  totalDue: number;
  totalPaid: number;
  remaining: number;
  isPaid: boolean;
}

export interface TableGroup {
  table: DbTable;
  customers: CustomerGroup[];
  allOrders: DbOrder[];
  allPayments: Payment[];
  totalDue: number;
  totalPaid: number;
  remaining: number;
  paymentStatus: 'UNPAID' | 'PARTIALLY_PAID' | 'PAID';
  activeOrdersCount: number;
}

function delay<T>(val: T, ms = 200): Promise<T> {
  return new Promise((res) => setTimeout(() => res(val), ms));
}

function nowStr() {
  return new Date().toISOString();
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** After a payment is processed, check if the table is fully paid and close it. */
function maybeCloseTable(tableId: string): void {
  const unpaid = getCollection<Payment>('payments').filter(
    (p) => p.tableId === tableId && p.status !== 'PAID' && p.status !== 'CANCELED',
  );
  if (unpaid.length === 0) {
    // All payments settled — close the table
    updateOne<DbTable>('tables', tableId, { status: 'CLOSED' });
    // Close all associated orders
    getCollection<DbOrder>('orders')
      .filter((o) => o.tableId === tableId && o.status !== 'CANCELED')
      .forEach((o) => updateOne<DbOrder>('orders', o.id, { status: 'CLOSED' }));
  }
}

/** Creates a Payment record for an order if one doesn't already exist. */
function ensurePaymentForOrder(order: DbOrder): Payment {
  const existing = getCollection<Payment>('payments').find((p) => p.orderId === order.id);
  if (existing) return existing;

  const table = order.tableId ? findById<DbTable>('tables', order.tableId) : null;
  const n = nowStr();
  const payment: Payment = {
    id: `pay-auto-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    tenantId: order.tenantId,
    branchId: order.branchId,
    orderId: order.id,
    orderNumber: order.orderNumber,
    tableId: order.tableId,
    tableNumber: order.tableNumber ?? table?.number,
    customerName: order.customerName,
    total: order.total,
    paidAmount: order.paidAmount ?? 0,
    status: (order.paidAmount ?? 0) > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
    createdAt: n,
    updatedAt: n,
  };
  return insertOne('payments', payment);
}

// ─── Queries ──────────────────────────────────────────────────────────────────

export const cashierService = {
  /** Tables that have pending or partially-paid payments */
  async listTablesWithPendingPayments(): Promise<DbTable[]> {
    const payments = getCollection<Payment>('payments');
    const pendingTableIds = new Set(
      payments
        .filter((p) => p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID')
        .map((p) => p.tableId)
        .filter(Boolean) as string[],
    );
    const tables = getCollection<DbTable>('tables').filter(
      (t) => t.status === 'WAITING_FOR_PAYMENT' || pendingTableIds.has(t.id),
    );
    return delay(tables.sort((a, b) => a.number.localeCompare(b.number, undefined, { numeric: true })));
  },

  /** Payments that still have an outstanding balance */
  async listPendingPayments(): Promise<Payment[]> {
    return delay(
      getCollection<Payment>('payments')
        .filter((p) => p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID')
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  },

  async listAllPayments(): Promise<Payment[]> {
    return delay(
      getCollection<Payment>('payments').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async getPayment(id: string): Promise<Payment | null> {
    return delay(findById<Payment>('payments', id));
  },

  async getOrderForPayment(orderId: string): Promise<DbOrder | null> {
    return delay(findById<DbOrder>('orders', orderId));
  },

  /** Payments grouped by table for the Cashier table view */
  async getTablePaymentSummary(tableId: string): Promise<{
    table: DbTable | null;
    payments: Payment[];
    totalDue: number;
    totalPaid: number;
    remaining: number;
  }> {
    const table = findById<DbTable>('tables', tableId);
    const payments = getCollection<Payment>('payments').filter(
      (p) => p.tableId === tableId,
    );
    const totalDue = payments.reduce((s, p) => s + p.total, 0);
    const totalPaid = payments.reduce((s, p) => s + p.paidAmount, 0);
    return delay({ table, payments, totalDue, totalPaid, remaining: +(totalDue - totalPaid).toFixed(2) });
  },

  // ─── Mutations ──────────────────────────────────────────────────────────────

  /** Pay the full remaining amount of a single payment record */
  async markPaid(paymentId: string, method: PaymentMethod): Promise<Payment | null> {
    const payment = findById<Payment>('payments', paymentId);
    if (!payment) return delay(null);

    const remaining = payment.total - (payment.paidAmount ?? 0);
    return cashierService.payAmount(paymentId, remaining, method);
  },

  /** Pay a partial or full custom amount against a payment record */
  async payAmount(
    paymentId: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<Payment | null> {
    const payment = findById<Payment>('payments', paymentId);
    if (!payment) return delay(null);

    const n = nowStr();
    const tx: PaymentTransaction = {
      id: `ptx-${Date.now()}`,
      paymentId,
      method,
      amount: +amount.toFixed(2),
      status: 'PAID',
      createdAt: n,
      updatedAt: n,
    };
    insertOne('paymentTransactions', tx);

    const newPaid = +((payment.paidAmount ?? 0) + amount).toFixed(2);
    const remaining = +(payment.total - newPaid).toFixed(2);
    const newStatus = remaining <= 0 ? 'PAID' : 'PARTIALLY_PAID';

    const updated = updateOne<Payment>('payments', paymentId, {
      paidAmount: newPaid,
      status: newStatus,
      method,
    });

    // Propagate to the linked order
    if (newStatus === 'PAID') {
      updateOne<DbOrder>('orders', payment.orderId, {
        paymentStatus: 'PAID',
        paidAmount: payment.total,
      });
    } else {
      updateOne<DbOrder>('orders', payment.orderId, {
        paymentStatus: 'PARTIALLY_PAID',
        paidAmount: newPaid,
      });
    }

    // Check if the entire table is now settled
    if (payment.tableId) {
      maybeCloseTable(payment.tableId);
    }

    return delay(updated);
  },

  /** Reset a CLOSED table back to EMPTY (end of table lifecycle) */
  async resetTable(tableId: string): Promise<DbTable | null> {
    return delay(updateOne<DbTable>('tables', tableId, { status: 'EMPTY' }));
  },

  // ─── Receipts & Invoices ────────────────────────────────────────────────────

  async generateReceipt(paymentId: string): Promise<Receipt | null> {
    const payment = findById<Payment>('payments', paymentId);
    if (!payment) return delay(null);
    const order = findById<DbOrder>('orders', payment.orderId);
    if (!order) return delay(null);

    const existing = getCollection<Receipt>('receipts').find(
      (r) => r.paymentId === paymentId,
    );
    if (existing) return delay(existing);

    const receipt: Receipt = {
      id: `rec-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId: order.id,
      paymentId,
      number: `REC-${Date.now()}`,
      items: order.items,
      subtotal: order.subtotal,
      serviceFee: order.serviceFee,
      total: (payment.paidAmount ?? 0) > 0 ? (payment.paidAmount ?? 0) : order.total,
      method: payment.method ?? 'CASH',
      createdAt: nowStr(),
      updatedAt: nowStr(),
    };
    return delay(insertOne('receipts', receipt));
  },

  async generateInvoice(paymentId: string): Promise<Invoice | null> {
    const payment = findById<Payment>('payments', paymentId);
    if (!payment) return delay(null);

    const existing = getCollection<Invoice>('invoices').find(
      (i) => i.paymentId === paymentId,
    );
    if (existing) return delay(existing);

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      tenantId: TENANT_ID,
      branchId: BRANCH_ID,
      orderId: payment.orderId,
      paymentId,
      number: `NF-${Date.now()}`,
      customerName: payment.customerName,
      total: (payment.paidAmount ?? 0) > 0 ? (payment.paidAmount ?? 0) : payment.total,
      status: 'ISSUED',
      createdAt: nowStr(),
      updatedAt: nowStr(),
    };
    return delay(insertOne('invoices', invoice));
  },

  async listReceipts(): Promise<Receipt[]> {
    return delay(
      getCollection<Receipt>('receipts').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  async listInvoices(): Promise<Invoice[]> {
    return delay(
      getCollection<Invoice>('invoices').sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt),
      ),
    );
  },

  // ─── Summary ─────────────────────────────────────────────────────────────────

  getDailySummary() {
    const payments = getCollection<Payment>('payments');
    const today = new Date().toISOString().slice(0, 10);
    const todayPaid = payments.filter(
      (p) =>
        (p.status === 'PAID' || p.status === 'PARTIALLY_PAID') &&
        p.createdAt.startsWith(today),
    );
    const pending = payments.filter(
      (p) => p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID',
    );
    return {
      totalPaid: +todayPaid.reduce((s, p) => s + (p.paidAmount ?? 0), 0).toFixed(2),
      paidCount: payments.filter((p) => p.status === 'PAID').length,
      pendingAmount: +pending.reduce((s, p) => s + (p.total - (p.paidAmount ?? 0)), 0).toFixed(2),
      pendingCount: pending.length,
    };
  },

  // ─── Grouped table view ───────────────────────────────────────────────────────

  /** Returns all tables that have active orders, grouped by customer. */
  async getTableGroups(): Promise<TableGroup[]> {
    const activeOrders = getCollection<DbOrder>('orders').filter(
      (o) => o.tableId && o.status !== 'CANCELED' && o.status !== 'CLOSED',
    );
    if (activeOrders.length === 0) return delay([]);

    const allPayments = getCollection<Payment>('payments');
    const allTables = getCollection<DbTable>('tables');

    const paymentByOrderId = new Map<string, Payment>(
      allPayments.map((p) => [p.orderId, p]),
    );

    const ordersByTable = new Map<string, DbOrder[]>();
    for (const order of activeOrders) {
      if (!order.tableId) continue;
      const list = ordersByTable.get(order.tableId) ?? [];
      list.push(order);
      ordersByTable.set(order.tableId, list);
    }

    const result: TableGroup[] = [];

    for (const [tableId, orders] of ordersByTable) {
      const table = allTables.find((t) => t.id === tableId);
      if (!table) continue;

      const tablePayments = allPayments.filter((p) => p.tableId === tableId);

      const customerMap = new Map<string, DbOrder[]>();
      for (const order of orders) {
        const key = order.customerName?.trim() || 'Mesa / Sem identificação';
        const list = customerMap.get(key) ?? [];
        list.push(order);
        customerMap.set(key, list);
      }

      const customers: CustomerGroup[] = [];
      for (const [name, custOrders] of customerMap) {
        const custPayments = custOrders
          .map((o) => paymentByOrderId.get(o.id))
          .filter(Boolean) as Payment[];
        const totalDue = +custOrders.reduce((s, o) => s + o.total, 0).toFixed(2);
        const totalPaid = +custPayments.reduce((s, p) => s + p.paidAmount, 0).toFixed(2);
        const remaining = +(totalDue - totalPaid).toFixed(2);
        customers.push({
          name,
          orders: custOrders,
          payments: custPayments,
          totalDue,
          totalPaid,
          remaining,
          isPaid: remaining <= 0,
        });
      }

      const totalDue = +orders.reduce((s, o) => s + o.total, 0).toFixed(2);
      const totalPaid = +tablePayments.reduce((s, p) => s + p.paidAmount, 0).toFixed(2);
      const remaining = +(totalDue - totalPaid).toFixed(2);

      result.push({
        table,
        customers: customers.sort((a, b) => a.name.localeCompare(b.name)),
        allOrders: orders,
        allPayments: tablePayments,
        totalDue,
        totalPaid,
        remaining,
        paymentStatus: remaining <= 0 ? 'PAID' : totalPaid > 0 ? 'PARTIALLY_PAID' : 'UNPAID',
        activeOrdersCount: orders.length,
      });
    }

    return delay(
      result.sort((a, b) =>
        a.table.number.localeCompare(b.table.number, undefined, { numeric: true }),
      ),
    );
  },

  /** Pay the full remaining balance of a table, distributing across all pending payments. */
  async payTable(tableId: string, amount: number, method: PaymentMethod): Promise<void> {
    const orders = getCollection<DbOrder>('orders').filter(
      (o) => o.tableId === tableId && o.status !== 'CANCELED' && o.status !== 'CLOSED',
    );
    const payments = orders.map((o) => ensurePaymentForOrder(o));
    const pending = payments.filter((p) => p.status !== 'PAID' && p.status !== 'CANCELED');

    let rem = amount;
    for (const payment of pending) {
      if (rem <= 0) break;
      const payRemainder = +(payment.total - payment.paidAmount).toFixed(2);
      const toPay = +Math.min(rem, payRemainder).toFixed(2);
      if (toPay > 0) {
        await cashierService.payAmount(payment.id, toPay, method);
        rem = +(rem - toPay).toFixed(2);
      }
    }
  },

  /** Pay a specific customer's balance on a table. */
  async payCustomerOnTable(
    tableId: string,
    customerName: string,
    amount: number,
    method: PaymentMethod,
  ): Promise<void> {
    const orders = getCollection<DbOrder>('orders').filter(
      (o) =>
        o.tableId === tableId &&
        (o.customerName?.trim() || 'Mesa / Sem identificação') === customerName &&
        o.status !== 'CANCELED' &&
        o.status !== 'CLOSED',
    );
    const payments = orders.map((o) => ensurePaymentForOrder(o));
    const pending = payments.filter((p) => p.status !== 'PAID' && p.status !== 'CANCELED');

    let rem = amount;
    for (const payment of pending) {
      if (rem <= 0) break;
      const payRemainder = +(payment.total - payment.paidAmount).toFixed(2);
      const toPay = +Math.min(rem, payRemainder).toFixed(2);
      if (toPay > 0) {
        await cashierService.payAmount(payment.id, toPay, method);
        rem = +(rem - toPay).toFixed(2);
      }
    }
  },
};
