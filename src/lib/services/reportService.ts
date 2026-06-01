// F6: Daily close report
import { getCollection } from '@/lib/mock-db';
import type { DbOrder, Payment, PaymentMethod } from '@/lib/types';

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
}

export interface CloseReport {
  date: string;
  totalRevenue: number;
  totalOrders: number;
  totalPaidOrders: number;
  averageTicket: number;
  byCategory: CategoryRevenue[];
  byHour: HourlyRevenue[];
  byPaymentMethod: PaymentMethodSummary[];
  topProducts: { name: string; units: number; revenue: number }[];
  canceledOrders: number;
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

    const totalRevenue = payments.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
    const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
    const canceledOrders = orders.filter((o) => o.status === 'CANCELED').length;

    // By payment method
    const methodMap = new Map<string, { amount: number; count: number }>();
    payments.forEach((p) => {
      const m = p.method ?? 'UNKNOWN';
      const cur = methodMap.get(m) ?? { amount: 0, count: 0 };
      methodMap.set(m, { amount: cur.amount + (p.paidAmount ?? 0), count: cur.count + 1 });
    });
    const byPaymentMethod: PaymentMethodSummary[] = [...methodMap.entries()].map(([method, v]) => ({
      method: method as PaymentMethod,
      ...v,
    }));

    // By hour
    const hourMap = new Map<number, { revenue: number; orders: number }>();
    orders.forEach((o) => {
      const h = new Date(o.createdAt).getHours();
      const cur = hourMap.get(h) ?? { revenue: 0, orders: 0 };
      hourMap.set(h, { revenue: cur.revenue + o.total, orders: cur.orders + 1 });
    });
    const byHour: HourlyRevenue[] = Array.from({ length: 24 }, (_, h) => ({
      hour: h,
      revenue: hourMap.get(h)?.revenue ?? 0,
      orders: hourMap.get(h)?.orders ?? 0,
    })).filter((h) => h.orders > 0);

    // Top products
    const productMap = new Map<string, { units: number; revenue: number }>();
    orders.forEach((o) =>
      o.items.forEach((item) => {
        const cur = productMap.get(item.name) ?? { units: 0, revenue: 0 };
        productMap.set(item.name, {
          units: cur.units + item.quantity,
          revenue: cur.revenue + item.unitPrice * item.quantity,
        });
      }),
    );
    const topProducts = [...productMap.entries()]
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);

    return delay({
      date: targetDate,
      totalRevenue: +totalRevenue.toFixed(2),
      totalOrders: orders.length,
      totalPaidOrders: paidOrders.length,
      averageTicket: paidOrders.length ? +(totalRevenue / paidOrders.length).toFixed(2) : 0,
      byCategory: [],
      byHour,
      byPaymentMethod,
      topProducts,
      canceledOrders,
    });
  },

  exportCsv(report: CloseReport): string {
    const lines = [
      `Relatório de fechamento — ${report.date}`,
      `Total faturado,${report.totalRevenue}`,
      `Total de pedidos,${report.totalOrders}`,
      `Pedidos pagos,${report.totalPaidOrders}`,
      `Ticket médio,${report.averageTicket}`,
      `Cancelados,${report.canceledOrders}`,
      '',
      'Forma de pagamento,Valor,Pedidos',
      ...report.byPaymentMethod.map((m) => `${m.method},${m.amount},${m.count}`),
      '',
      'Produto,Unidades,Receita',
      ...report.topProducts.map((p) => `${p.name},${p.units},${p.revenue}`),
    ];
    return lines.join('\n');
  },
};
