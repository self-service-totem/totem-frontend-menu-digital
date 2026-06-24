import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { cashierService, type TableGroup } from '@/lib/services/cashierService';
import { kioskService } from '@/lib/services/kioskService';
import { printDemoTicket } from '@/lib/printing/demoTicket';
import { getBrandName } from '@/lib/services/brand';
import { useNotify } from '@/lib/notifications';
import { useElapsed } from '@/lib/utils/useElapsed';
import { useLabels } from '@/i18n/I18nContext';
import { formatCurrency as formatBRL } from '@/utils/format';
import type {
  Payment, PaymentMethod, Receipt, Invoice, DbTable, KioskAlert, DbOrder, QueueTicket,
} from '@/lib/types';
import { tabFromPath, type Tab, type PayContext, type PaymentFilter } from './cashierUtils';

/**
 * All cashier screen state: table groups, payments, kiosk orders/alerts, the
 * various modals and sort/filter state, the 5s polling loop, and the payment
 * handlers. Extracted so CashierPage is just layout + tab rendering.
 */
export function useCashier() {
  const { t } = useLabels();
  const notify = useNotify();
  const location = useLocation();
  useElapsed(30_000);

  const [tab, setTab] = useState<Tab>(() => tabFromPath(location.pathname));
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [pendingKioskOrders, setPendingKioskOrders] = useState<DbOrder[]>([]);
  const [paidKioskOrders, setPaidKioskOrders] = useState<(DbOrder & { ticketNumber?: number })[]>([]);
  const [kioskAlerts, setKioskAlerts] = useState<KioskAlert[]>([]);
  const [kioskView, setKioskView] = useState<'pending' | 'paid'>('pending');
  const [kioskPayOrder, setKioskPayOrder] = useState<DbOrder | null>(null);
  const [summary, setSummary] = useState({ totalPaid: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 });
  const [payContext, setPayContext] = useState<PayContext>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [histSort, setHistSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'orderNumber', dir: 'desc' });
  const [recSort, setRecSort]   = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [invSort, setInvSort]   = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });

  const methodLabel: Record<string, string> = {
    CASH: t('cashier.method.cash'),
    CARD: t('cashier.method.card'),
    PIX: t('cashier.method.pix'),
    EXTERNAL_TERMINAL: t('cashier.method.terminal'),
  };

  useEffect(() => {
    setTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  async function load() {
    const [groups, tbls, p, all, rec, inv] = await Promise.all([
      cashierService.getTableGroups(),
      cashierService.listTablesWithPendingPayments(),
      cashierService.listPendingPayments(),
      cashierService.listAllPayments(),
      cashierService.listReceipts(),
      cashierService.listInvoices(),
    ]);
    setTableGroups(groups);
    setTables(tbls);
    setPayments(p);
    setAllPayments(all);
    setReceipts(rec);
    setInvoices(inv);
    setSummary(cashierService.getDailySummary());
    setPendingKioskOrders(kioskService.listPendingCashOrders());
    setPaidKioskOrders(kioskService.listPaidKioskOrdersToday());
    setKioskAlerts(kioskService.listAlerts());
    const keys = new Set<string>();
    for (const g of groups) {
      for (const c of g.customers) {
        keys.add(`${g.table.id}::${c.name}`);
      }
    }
    setExpandedCustomers(keys);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  function toggleCustomer(key: string) {
    setExpandedCustomers((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      return next;
    });
  }

  function toggleTableCollapse(tableId: string) {
    setCollapsedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId); else next.add(tableId);
      return next;
    });
  }

  function collapseAll() { setCollapsedTables(new Set(tableGroups.map((g) => g.table.id))); }
  function expandAll() { setCollapsedTables(new Set()); }

  // ── Payment handlers ─────────────────────────────────────────────────────────

  async function handlePayContext(amount: number, method: PaymentMethod) {
    if (!payContext) return;
    if (payContext.kind === 'table') {
      await cashierService.payTable(payContext.tableId, amount, method);
      const rem = +(payContext.remaining - amount).toFixed(2);
      notify(rem <= 0
        ? `Mesa ${payContext.tableNumber} paga — ${methodLabel[method]}`
        : `${formatBRL(amount)} recebido · Mesa ${payContext.tableNumber} — restam ${formatBRL(rem)}`);
    } else {
      await cashierService.payCustomerOnTable(payContext.tableId, payContext.customerName, amount, method);
      const rem = +(payContext.remaining - amount).toFixed(2);
      notify(rem <= 0
        ? `${payContext.customerName} — pagamento completo`
        : `${formatBRL(amount)} recebido de ${payContext.customerName} — restam ${formatBRL(rem)}`);
    }
    setPayContext(null);
    load();
  }

  async function handlePaySingle(amount: number, method: PaymentMethod) {
    if (!selectedPayment) return;
    await cashierService.payAmount(selectedPayment.id, amount, method);
    const remaining = +(selectedPayment.total - (selectedPayment.paidAmount ?? 0) - amount).toFixed(2);
    notify(remaining <= 0
      ? `Pagamento completo — ${methodLabel[method]}`
      : `${formatBRL(amount)} recebido — restam ${formatBRL(remaining)}`);
    setShowPayModal(false);
    setSelectedPayment(null);
    load();
  }

  async function handleGenerateReceipt(paymentId: string) {
    const rec = await cashierService.generateReceipt(paymentId);
    notify('Recibo gerado');
    if (rec) setSelectedReceipt(rec);
    load();
  }

  async function handleGenerateInvoice(paymentId: string) {
    await cashierService.generateInvoice(paymentId);
    notify('Nota fiscal gerada');
    load();
  }

  async function handleResetTable(tableId: string) {
    await cashierService.resetTable(tableId);
    notify('Mesa liberada');
    load();
  }

  function handleResolveAlert(id: string) {
    kioskService.resolveAlert(id);
    load();
  }

  async function handlePayKioskOrder(orderId: string): Promise<QueueTicket> {
    const { order, queueTicket } = await kioskService.confirmCashPayment(orderId);
    notify(`Pedido ${order.orderNumber} cobrado — turno ${queueTicket.ticketNumber}`);
    printDemoTicket({
      restaurantName: getBrandName(),
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      queueNumber: queueTicket.ticketNumber,
      items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })),
      itemCount: order.items.reduce((n, it) => n + it.quantity, 0),
      total: order.total,
      currency: 'BRL',
    });
    load();
    return queueTicket;
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const filteredGroups = tableGroups.filter((g) => {
    const matchSearch = !tableSearch || g.table.number.includes(tableSearch);
    const matchFilter =
      paymentFilter === 'all' ? true :
      paymentFilter === 'pending' ? g.paymentStatus === 'UNPAID' :
      paymentFilter === 'partial' ? g.paymentStatus === 'PARTIALLY_PAID' :
      paymentFilter === 'paid' ? g.paymentStatus === 'PAID' : true;
    return matchSearch && matchFilter;
  });

  const countByFilter = {
    all: tableGroups.length,
    pending: tableGroups.filter((g) => g.paymentStatus === 'UNPAID').length,
    partial: tableGroups.filter((g) => g.paymentStatus === 'PARTIALLY_PAID').length,
    paid: tableGroups.filter((g) => g.paymentStatus === 'PAID').length,
  };

  return {
    tab, setTab,
    tableGroups, tables, payments, allPayments, receipts, invoices,
    pendingKioskOrders, paidKioskOrders, kioskAlerts,
    kioskView, setKioskView, kioskPayOrder, setKioskPayOrder,
    summary, payContext, setPayContext,
    selectedPayment, setSelectedPayment, showPayModal, setShowPayModal,
    selectedReceipt, setSelectedReceipt,
    expandedCustomers, collapsedTables, tableSearch, setTableSearch,
    paymentFilter, setPaymentFilter,
    histSort, setHistSort, recSort, setRecSort, invSort, setInvSort,
    methodLabel, filteredGroups, countByFilter,
    load, toggleCustomer, toggleTableCollapse, collapseAll, expandAll,
    handlePayContext, handlePaySingle, handleGenerateReceipt, handleGenerateInvoice,
    handleResetTable, handleResolveAlert, handlePayKioskOrder,
  };
}
