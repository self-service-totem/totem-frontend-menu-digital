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
};
