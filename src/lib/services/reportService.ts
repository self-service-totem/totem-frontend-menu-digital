// F6: Daily close report
import { getCollection } from '@/lib/mock-db';
import type { DbOrder, DbTable, Payment, PaymentMethod } from '@/lib/types';

function delay<T>(v: T, ms = 200): Promise<T> {
  return new Promise((r) => setTimeout(() => r(v), ms));
}

export interface CategoryRevenue {
  categoryId: string;
  categoryName: string;
  revenue: number;
  units: number;
}

export interface HourlyRevenue {
  hour: number;
  revenue: number;
  orders: number;
}

export interface PaymentMethodSummary {
  method: PaymentMethod | 'UNKNOWN';
  amount: number;
  count: number;
  pct: number;
}

export interface TableRevenue {
  tableNumber: string;
  tableId: string;
  revenue: number;
  orderCount: number;
  avgTicket: number;
}

export interface WaiterRevenue {
  waiterName: string;
  revenue: number;
  orderCount: number;
  avgTicket: number;
  tableCount: number;
}

export interface TopProduct {
  name: string;
  units: number;
  revenue: number;
  avgPrice: number;
}

export interface CloseReport {
  date: string;
  totalRevenue: number;
  grossRevenue: number;
  serviceFeeTotal: number;
  totalOrders: number;
  totalPaidOrders: number;
  averageTicket: number;
  canceledOrders: number;
  byCategory: CategoryRevenue[];
  byHour: HourlyRevenue[];
  byPaymentMethod: PaymentMethodSummary[];
  topProducts: TopProduct[];
  byTable: TableRevenue[];
  byWaiter: WaiterRevenue[];
}

export const reportService = {
  async getCloseReport(date?: string): Promise<CloseReport> {
    const targetDate = date ?? new Date().toISOString().slice(0, 10);

    const orders = getCollection<DbOrder>('orders').filter((o) =>
      o.createdAt.startsWith(targetDate),
    );
    const payments = getCollection<Payment>('payments').filter(
      (p) => p.status === 'PAID' && p.createdAt.startsWith(targetDate),
    );
    const tables = getCollection<DbTable>('tables');

    // Build tableId → waiterName lookup
    const tableWaiterMap = new Map<string, string>();
    tables.forEach((t) => tableWaiterMap.set(t.id, t.assignedWaiterName ?? 'Sem garçom'));

    const totalRevenue = +payments.reduce((s, p) => s + (p.paidAmount ?? 0), 0).toFixed(2);

    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const canceledOrders = orders.filter((o) => o.status === 'CANCELED').length;

    const serviceFeeTotal = +paidOrders.reduce((s, o) => s + (o.serviceFee ?? 0), 0).toFixed(2);
    const grossRevenue = +(totalRevenue - serviceFeeTotal).toFixed(2);
    const averageTicket = paidOrders.length
      ? +(totalRevenue / paidOrders.length).toFixed(2)
      : 0;

    // ── By payment method ──────────────────────────────────────────────────
    const methodMap = new Map<string, { amount: number; count: number }>();
    payments.forEach((p) => {
      const m = p.method ?? 'UNKNOWN';
      const cur = methodMap.get(m) ?? { amount: 0, count: 0 };
      methodMap.set(m, { amount: cur.amount + (p.paidAmount ?? 0), count: cur.count + 1 });
    });
    const totalPaid = [...methodMap.values()].reduce((s, v) => s + v.amount, 0);
    const byPaymentMethod: PaymentMethodSummary[] = [...methodMap.entries()]
      .map(([method, v]) => ({
        method: method as PaymentMethod,
        amount: +v.amount.toFixed(2),
        count: v.count,
        pct: totalPaid > 0 ? +(v.amount / totalPaid * 100) : 0,
      }))
      .sort((a, b) => b.amount - a.amount);

    // ── By hour ────────────────────────────────────────────────────────────
    const hourMap = new Map<number, { revenue: number; orders: number }>();
    orders.forEach((o) => {
      if (o.status === 'CANCELED') return;
      const h = new Date(o.createdAt).getHours();
      const cur = hourMap.get(h) ?? { revenue: 0, orders: 0 };
      hourMap.set(h, { revenue: cur.revenue + o.total, orders: cur.orders + 1 });
    });
    const byHour: HourlyRevenue[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      revenue: +(hourMap.get(h)?.revenue ?? 0).toFixed(2),
      orders: hourMap.get(h)?.orders ?? 0,
    })).filter((h) => h.orders > 0);

    // ── Top products ───────────────────────────────────────────────────────
    const productMap = new Map<string, { units: number; revenue: number }>();
    orders.forEach((o) => {
      if (o.status === 'CANCELED') return;
      o.items.forEach((item) => {
        const cur = productMap.get(item.name) ?? { units: 0, revenue: 0 };
        productMap.set(item.name, {
          units: cur.units + item.quantity,
          revenue: cur.revenue + item.unitPrice * item.quantity,
        });
      });
    });
    const topProducts: TopProduct[] = [...productMap.entries()]
      .map(([name, v]) => ({
        name,
        units: v.units,
        revenue: +v.revenue.toFixed(2),
        avgPrice: v.units > 0 ? +(v.revenue / v.units).toFixed(2) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    // ── By table ───────────────────────────────────────────────────────────
    const tablePayMap = new Map<string, { revenue: number; count: number; tableId: string }>();
    payments.forEach((p) => {
      const tn = p.tableNumber ?? '—';
      const cur = tablePayMap.get(tn) ?? { revenue: 0, count: 0, tableId: p.tableId ?? '' };
      tablePayMap.set(tn, {
        revenue: cur.revenue + (p.paidAmount ?? 0),
        count: cur.count + 1,
        tableId: cur.tableId || (p.tableId ?? ''),
      });
    });
    const byTable: TableRevenue[] = [...tablePayMap.entries()]
      .map(([tableNumber, v]) => ({
        tableNumber,
        tableId: v.tableId,
        revenue: +v.revenue.toFixed(2),
        orderCount: v.count,
        avgTicket: v.count > 0 ? +(v.revenue / v.count).toFixed(2) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    // ── By waiter ──────────────────────────────────────────────────────────
    const waiterMap = new Map<string, { revenue: number; orderCount: number; tableIds: Set<string> }>();
    payments.forEach((p) => {
      const waiter = (p.tableId ? tableWaiterMap.get(p.tableId) : undefined) ?? 'Balcão / Kiosk';
      const cur = waiterMap.get(waiter) ?? { revenue: 0, orderCount: 0, tableIds: new Set<string>() };
      cur.revenue += p.paidAmount ?? 0;
      cur.orderCount += 1;
      if (p.tableId) cur.tableIds.add(p.tableId);
      waiterMap.set(waiter, cur);
    });
    const byWaiter: WaiterRevenue[] = [...waiterMap.entries()]
      .map(([waiterName, v]) => ({
        waiterName,
        revenue: +v.revenue.toFixed(2),
        orderCount: v.orderCount,
        avgTicket: v.orderCount > 0 ? +(v.revenue / v.orderCount).toFixed(2) : 0,
        tableCount: v.tableIds.size,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return delay({
      date: targetDate,
      totalRevenue,
      grossRevenue,
      serviceFeeTotal,
      totalOrders: orders.length,
      totalPaidOrders: paidOrders.length,
      averageTicket,
      canceledOrders,
      byCategory: [],
      byHour,
      byPaymentMethod,
      topProducts,
      byTable,
      byWaiter,
    });
  },

  exportCsv(report: CloseReport): string {
    const lines = [
      `Relatório de fechamento — ${report.date}`,
      `Total faturado,${report.totalRevenue}`,
      `Vendas brutas,${report.grossRevenue}`,
      `Taxa de serviço,${report.serviceFeeTotal}`,
      `Total de pedidos,${report.totalOrders}`,
      `Pedidos pagos,${report.totalPaidOrders}`,
      `Ticket médio,${report.averageTicket}`,
      `Cancelados,${report.canceledOrders}`,
      '',
      'Forma de pagamento,Valor,Pedidos,%',
      ...report.byPaymentMethod.map((m) => `${m.method},${m.amount},${m.count},${m.pct.toFixed(1)}`),
      '',
      'Produto,Unidades,Receita',
      ...report.topProducts.map((p) => `${p.name},${p.units},${p.revenue}`),
      '',
      'Mesa,Receita,Pedidos,Ticket médio',
      ...report.byTable.map((t) => `Mesa ${t.tableNumber},${t.revenue},${t.orderCount},${t.avgTicket}`),
      '',
      'Garçom,Receita,Pedidos,Mesas,Ticket médio',
      ...report.byWaiter.map((w) => `${w.waiterName},${w.revenue},${w.orderCount},${w.tableCount},${w.avgTicket}`),
    ];
    return lines.join('\n');
  },
};
