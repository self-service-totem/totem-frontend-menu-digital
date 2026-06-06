import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cashierService } from '@/lib/services/cashierService';
import type { TableGroup, CustomerGroup } from '@/lib/services/cashierService';
import { useNotify } from '@/lib/notifications';
import type { Payment, PaymentMethod, Receipt, Invoice, DbTable } from '@/lib/types';

const METHOD_LABELS: Record<PaymentMethod, string> = {
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  PIX: 'PIX',
  EXTERNAL_TERMINAL: 'Terminal externo',
};

function formatBRL(v: number | undefined | null) {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

type Tab = 'tables' | 'orders' | 'history' | 'receipts' | 'invoices';

// ─── Generic payment modal ────────────────────────────────────────────────────

interface PayModalProps {
  title: string;
  subtitle: string;
  totalDue: number;
  paidAmount: number;
  onClose: () => void;
  onPay: (amount: number, method: PaymentMethod) => Promise<void>;
}

function PayModal({ title, subtitle, totalDue, paidAmount, onClose, onPay }: PayModalProps) {
  const remaining = +(totalDue - paidAmount).toFixed(2);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState(String(remaining));
  const [loading, setLoading] = useState(false);

  const payAmount = mode === 'full' ? remaining : Math.min(parseFloat(customAmount) || 0, remaining);

  async function handlePay() {
    if (payAmount <= 0) return;
    setLoading(true);
    try {
      await onPay(payAmount, method);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0 }}>{title}</h5>

        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{subtitle}</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Total</span>
            <span style={{ fontWeight: 600 }}>{formatBRL(totalDue)}</span>
          </div>
          {paidAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#059669' }}>Já pago</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatBRL(paidAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Restante</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#e11d2a' }}>{formatBRL(remaining)}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className={`btn btn-sm flex-1 ${mode === 'full' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMode('full')}>
            Total restante
          </button>
          <button className={`btn btn-sm flex-1 ${mode === 'partial' ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setMode('partial')}>
            Valor parcial
          </button>
        </div>

        {mode === 'partial' && (
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Valor a receber (R$)</label>
            <input
              className="form-control"
              type="number"
              min={0.01}
              max={remaining}
              step={0.01}
              value={customAmount}
              onChange={(e) => setCustomAmount(e.target.value)}
            />
          </div>
        )}

        <div>
          <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Forma de pagamento</label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {(Object.keys(METHOD_LABELS) as PaymentMethod[]).map((m) => (
              <button
                key={m}
                className={`btn btn-sm ${method === m ? 'btn-primary' : 'btn-outline-secondary'}`}
                onClick={() => setMethod(m)}
              >
                {METHOD_LABELS[m]}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-success flex-1" onClick={handlePay} disabled={loading || payAmount <= 0}>
            {loading ? '...' : `Receber ${formatBRL(payAmount)}`}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt modal ────────────────────────────────────────────────────────────

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 12, padding: 28, width: 360, fontFamily: 'monospace', fontSize: 13 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <strong style={{ fontSize: 16 }}>RECIBO</strong>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{receipt.number}</div>
          <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date(receipt.createdAt).toLocaleString('pt-BR')}</div>
        </div>
        <hr />
        {receipt.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{item.quantity}× {item.name}</span>
            <span>{formatBRL(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        <hr />
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Subtotal</span><span>{formatBRL(receipt.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span>Taxa de serviço</span><span>{formatBRL(receipt.serviceFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 15, marginTop: 4 }}>
          <span>TOTAL</span><span>{formatBRL(receipt.total)}</span>
        </div>
        <div style={{ marginTop: 8, color: '#6b7280' }}>Forma: {METHOD_LABELS[receipt.method]}</div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-outline-secondary flex-1" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" />Imprimir (mock)
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer section (inside a table card) ───────────────────────────────────

interface CustomerSectionProps {
  customer: CustomerGroup;
  tableId: string;
  expanded: boolean;
  onToggle: () => void;
  onPayCustomer: () => void;
  onPayPartial: () => void;
}

function CustomerSection({ customer, expanded, onToggle, onPayCustomer, onPayPartial }: CustomerSectionProps) {
  const allItems = customer.orders.flatMap((o) =>
    o.items.map((item) => ({ ...item, serviceFee: o.serviceFee, orderTotal: o.total })),
  );
  const totalItems = customer.orders.reduce((s, o) => s + o.subtotal, 0);
  const totalFee = customer.orders.reduce((s, o) => s + o.serviceFee, 0);

  return (
    <div style={{ borderTop: '1px solid #f3f4f6' }}>
      {/* Customer header — always visible */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', cursor: 'pointer', background: customer.isPaid ? '#f0fdf4' : '#fff' }}
        onClick={onToggle}
      >
        <i className={`bi ${expanded ? 'bi-chevron-down' : 'bi-chevron-right'}`} style={{ fontSize: 12, color: '#6b7280', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 600, fontSize: 14 }}>{customer.name}</span>
          <span style={{ fontSize: 12, color: '#6b7280', marginLeft: 8 }}>
            {customer.orders.length} pedido(s) · {customer.orders.reduce((s, o) => s + o.items.length, 0)} item(ns)
          </span>
        </div>
        {customer.isPaid ? (
          <span className="badge" style={{ background: '#059669', color: '#fff', fontSize: 11 }}>
            <i className="bi bi-check2 me-1" />PAGO
          </span>
        ) : (
          <span style={{ fontWeight: 700, color: '#e11d2a', fontSize: 14, flexShrink: 0 }}>
            {formatBRL(customer.remaining)}
          </span>
        )}
      </div>

      {/* Expanded: items + actions */}
      {expanded && (
        <div style={{ padding: '0 16px 14px 36px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {allItems.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#374151' }}>
              <span>{item.quantity}× {item.name}</span>
              <span>{formatBRL(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280', marginTop: 2 }}>
            <span>+ Taxa de serviço (10%)</span>
            <span>{formatBRL(totalFee)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 13, borderTop: '1px solid #f3f4f6', paddingTop: 6, marginTop: 4 }}>
            <span>Total</span>
            <span>{formatBRL(totalItems + totalFee)}</span>
          </div>
          {customer.totalPaid > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669' }}>
              <span>Já pago</span>
              <span>{formatBRL(customer.totalPaid)}</span>
            </div>
          )}
          {!customer.isPaid && (
            <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
              <button
                className="btn btn-sm btn-primary"
                style={{ fontSize: 12 }}
                onClick={(e) => { e.stopPropagation(); onPayCustomer(); }}
              >
                <i className="bi bi-check-circle me-1" />Receber {formatBRL(customer.remaining)}
              </button>
              <button
                className="btn btn-sm btn-outline-secondary"
                style={{ fontSize: 12 }}
                onClick={(e) => { e.stopPropagation(); onPayPartial(); }}
              >
                Valor parcial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Table group card ─────────────────────────────────────────────────────────

const TABLE_STATUS_LABEL: Record<string, string> = {
  EMPTY: 'Vazia', OCCUPIED: 'Ocupada', ORDER_IN_PROGRESS: 'Pedido em andamento',
  WAITING_FOR_KITCHEN: 'Aguardando cozinha', READY_TO_SERVE: 'Pronto para servir',
  WAITING_FOR_PAYMENT: 'Aguardando pagamento', CLOSED: 'Fechada',
};

const STATUS_COLOR: Record<string, string> = {
  UNPAID: '#7c3aed',
  PARTIALLY_PAID: '#d97706',
  PAID: '#059669',
};

interface TableGroupCardProps {
  group: TableGroup;
  collapsed: boolean;
  onToggleCollapse: () => void;
  expandedCustomers: Set<string>;
  onToggleCustomer: (key: string) => void;
  onPayTable: () => void;
  onPayTablePartial: () => void;
  onPayCustomer: (name: string) => void;
  onPayCustomerPartial: (name: string) => void;
}

function TableGroupCard({
  group,
  collapsed,
  onToggleCollapse,
  expandedCustomers,
  onToggleCustomer,
  onPayTable,
  onPayTablePartial,
  onPayCustomer,
  onPayCustomerPartial,
}: TableGroupCardProps) {
  const borderColor = STATUS_COLOR[group.paymentStatus] ?? '#6b7280';
  const unpaidCustomers = group.customers.filter((c) => !c.isPaid);

  return (
    <div className="ff-data-card" style={{ borderLeft: `4px solid ${borderColor}`, padding: 0, overflow: 'hidden' }}>
      {/* Table header */}
      <div style={{ padding: '12px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, background: '#fafafa', borderBottom: '1px solid #e5e7eb' }}>
        {/* Collapse toggle */}
        <button
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: '#6b7280', display: 'flex', alignItems: 'center' }}
          onClick={onToggleCollapse}
          title={collapsed ? 'Expandir mesa' : 'Recolher mesa'}
        >
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} style={{ fontSize: 13 }} />
        </button>
        <span style={{ fontWeight: 700, fontSize: 16, cursor: 'pointer' }} onClick={onToggleCollapse}>
          Mesa {group.table.number}
        </span>
        <span style={{ fontSize: 12, color: '#6b7280', background: '#f3f4f6', borderRadius: 6, padding: '2px 8px' }}>
          {TABLE_STATUS_LABEL[group.table.status] ?? group.table.status}
        </span>
        {group.paymentStatus === 'PARTIALLY_PAID' && (
          <span className="badge bg-warning text-dark" style={{ fontSize: 11 }}>Parcialmente pago</span>
        )}
        {group.paymentStatus === 'PAID' && (
          <span className="badge bg-success" style={{ fontSize: 11 }}>Pago</span>
        )}
        {/* When collapsed, show remaining inline so the cashier can scan at a glance */}
        {collapsed && group.remaining > 0 && (
          <span style={{ fontSize: 13, fontWeight: 700, color: '#e11d2a', marginLeft: 4 }}>
            {formatBRL(group.remaining)}
          </span>
        )}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {group.paymentStatus !== 'PAID' && (
            <>
              <button className="btn btn-sm btn-primary" style={{ fontSize: 12 }} onClick={onPayTable}>
                <i className="bi bi-check-all me-1" />Receber mesa toda
              </button>
              <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: 12 }} onClick={onPayTablePartial}>
                Valor parcial
              </button>
            </>
          )}
        </div>
      </div>

      {!collapsed && (
        <>
          {/* Table totals */}
          <div style={{ padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', flexWrap: 'wrap', gap: 20, fontSize: 13 }}>
            <span>
              <span style={{ color: '#6b7280' }}>Clientes: </span>
              <strong>{group.customers.length}</strong>
              <span style={{ color: '#6b7280', marginLeft: 12 }}>Pedidos: </span>
              <strong>{group.activeOrdersCount}</strong>
            </span>
            <span style={{ marginLeft: 'auto', display: 'flex', gap: 16 }}>
              <span style={{ color: '#6b7280' }}>Total: <strong style={{ color: '#111' }}>{formatBRL(group.totalDue)}</strong></span>
              {group.totalPaid > 0 && (
                <span style={{ color: '#059669' }}>Pago: <strong>{formatBRL(group.totalPaid)}</strong></span>
              )}
              <span style={{ color: group.remaining > 0 ? '#e11d2a' : '#059669', fontWeight: 700 }}>
                Restante: {formatBRL(group.remaining)}
              </span>
            </span>
          </div>

          {/* Customer sections */}
          {group.customers.map((customer) => {
            const key = `${group.table.id}::${customer.name}`;
            return (
              <CustomerSection
                key={key}
                customer={customer}
                tableId={group.table.id}
                expanded={expandedCustomers.has(key)}
                onToggle={() => onToggleCustomer(key)}
                onPayCustomer={() => onPayCustomer(customer.name)}
                onPayPartial={() => onPayCustomerPartial(customer.name)}
              />
            );
          })}

          {unpaidCustomers.length === 0 && group.remaining <= 0 && (
            <div style={{ padding: '10px 16px', fontSize: 13, color: '#059669', fontWeight: 600 }}>
              <i className="bi bi-check-circle-fill me-1" />Mesa totalmente paga
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Pay context ──────────────────────────────────────────────────────────────

type PayContext =
  | { kind: 'table'; tableId: string; tableNumber: string; remaining: number; totalDue: number; totalPaid: number }
  | { kind: 'customer'; tableId: string; tableNumber: string; customerName: string; remaining: number; totalDue: number; totalPaid: number }
  | null;

// ─── Tab helpers ──────────────────────────────────────────────────────────────

function tabFromPath(pathname: string): Tab {
  if (pathname.includes('/history')) return 'history';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/invoices')) return 'invoices';
  return 'tables';
}

// ─── Main CashierPage ─────────────────────────────────────────────────────────

export function CashierPage() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>(() => tabFromPath(location.pathname));
  const [tableGroups, setTableGroups] = useState<TableGroup[]>([]);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [summary, setSummary] = useState({ totalPaid: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 });
  const [payContext, setPayContext] = useState<PayContext>(null);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  // Customers expanded by default — collapse manually
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState('');
  const notify = useNotify();
  const navigate = useNavigate();

  useEffect(() => {
    setTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  async function load() {
    const [groups, t, p, all, rec, inv] = await Promise.all([
      cashierService.getTableGroups(),
      cashierService.listTablesWithPendingPayments(),
      cashierService.listPendingPayments(),
      cashierService.listAllPayments(),
      cashierService.listReceipts(),
      cashierService.listInvoices(),
    ]);
    setTableGroups(groups);
    setTables(t);
    setPayments(p);
    setAllPayments(all);
    setReceipts(rec);
    setInvoices(inv);
    setSummary(cashierService.getDailySummary());
    // Expand all customers by default when fresh data loads
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
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  function toggleTableCollapse(tableId: string) {
    setCollapsedTables((prev) => {
      const next = new Set(prev);
      if (next.has(tableId)) next.delete(tableId);
      else next.add(tableId);
      return next;
    });
  }

  function collapseAll() {
    setCollapsedTables(new Set(tableGroups.map((g) => g.table.id)));
  }

  function expandAll() {
    setCollapsedTables(new Set());
  }

  // ── Payment handlers ────────────────────────────────────────────────────────

  async function handlePayContext(amount: number, method: PaymentMethod) {
    if (!payContext) return;
    if (payContext.kind === 'table') {
      await cashierService.payTable(payContext.tableId, amount, method);
      const rem = +(payContext.remaining - amount).toFixed(2);
      notify(rem <= 0
        ? `Mesa ${payContext.tableNumber} paga — ${METHOD_LABELS[method]}`
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
      ? `Pagamento completo — ${METHOD_LABELS[method]}`
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
    notify('Mesa liberada ✅');
    load();
  }

  const navItems: { label: string; value: Tab; icon: string }[] = [
    { label: 'Mesas / Pedidos', value: 'orders', icon: 'bi-grid-3x3-gap' },
    { label: 'Histórico', value: 'history', icon: 'bi-list-check' },
    { label: 'Recibos', value: 'receipts', icon: 'bi-receipt' },
    { label: 'Notas fiscais', value: 'invoices', icon: 'bi-file-earmark-text' },
  ];

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-cash-register me-2" />Caixa
        </div>
        <nav className="ff-area-sidebar-nav">
          {navItems.map((n) => (
            <button key={n.value} className={`ff-nav-item ${tab === n.value ? 'active' : ''}`} onClick={() => setTab(n.value)}>
              <i className={`bi ${n.icon}`} />{n.label}
              {n.value === 'orders' && payments.length > 0 && (
                <span className="badge bg-danger ms-auto">{payments.length}</span>
              )}
            </button>
          ))}
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">Caixa / Pagamentos</span>
          <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={load}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>

        <div className="ff-area-content">
          {/* Summary cards */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Recebido hoje</div>
              <div className="ff-metric-card-value" style={{ color: '#059669', fontSize: 20 }}>{formatBRL(summary.totalPaid)}</div>
            </div>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Pedidos pagos</div>
              <div className="ff-metric-card-value">{summary.paidCount}</div>
            </div>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">A receber</div>
              <div className="ff-metric-card-value" style={{ color: '#d97706', fontSize: 20 }}>{formatBRL(summary.pendingAmount)}</div>
            </div>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Pendentes</div>
              <div className="ff-metric-card-value">{summary.pendingCount}</div>
            </div>
          </div>

          {/* ── Grouped table view (main) ────────────────────────────────────── */}
          {tab === 'orders' && (
            <>
              {/* Search + collapse controls */}
              {tableGroups.length > 0 && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
                  <div style={{ position: 'relative', flex: '0 0 200px' }}>
                    <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem', pointerEvents: 'none' }} />
                    <input
                      className="form-control form-control-sm"
                      style={{ paddingLeft: 30 }}
                      placeholder="Buscar mesa..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                    <button className="btn btn-sm btn-outline-secondary" onClick={collapseAll} title="Recolher todas">
                      <i className="bi bi-arrows-collapse me-1" />Recolher
                    </button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={expandAll} title="Expandir todas">
                      <i className="bi bi-arrows-expand me-1" />Expandir
                    </button>
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                {tableGroups.length === 0 && (
                  <div className="text-muted text-center py-5">
                    <i className="bi bi-check2-circle" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
                    Nenhuma mesa aguardando pagamento.
                  </div>
                )}
                {tableGroups
                  .filter((g) => !tableSearch || g.table.number.includes(tableSearch))
                  .map((group) => (
                    <TableGroupCard
                      key={group.table.id}
                      group={group}
                      collapsed={collapsedTables.has(group.table.id)}
                      onToggleCollapse={() => toggleTableCollapse(group.table.id)}
                      expandedCustomers={expandedCustomers}
                      onToggleCustomer={toggleCustomer}
                      onPayTable={() =>
                        setPayContext({
                          kind: 'table',
                          tableId: group.table.id,
                          tableNumber: group.table.number,
                          remaining: group.remaining,
                          totalDue: group.totalDue,
                          totalPaid: group.totalPaid,
                        })
                      }
                      onPayTablePartial={() =>
                        setPayContext({
                          kind: 'table',
                          tableId: group.table.id,
                          tableNumber: group.table.number,
                          remaining: group.remaining,
                          totalDue: group.totalDue,
                          totalPaid: group.totalPaid,
                        })
                      }
                      onPayCustomer={(name) => {
                        const c = group.customers.find((x) => x.name === name)!;
                        setPayContext({
                          kind: 'customer',
                          tableId: group.table.id,
                          tableNumber: group.table.number,
                          customerName: name,
                          remaining: c.remaining,
                          totalDue: c.totalDue,
                          totalPaid: c.totalPaid,
                        });
                      }}
                      onPayCustomerPartial={(name) => {
                        const c = group.customers.find((x) => x.name === name)!;
                        setPayContext({
                          kind: 'customer',
                          tableId: group.table.id,
                          tableNumber: group.table.number,
                          customerName: name,
                          remaining: c.remaining,
                          totalDue: c.totalDue,
                          totalPaid: c.totalPaid,
                        });
                      }}
                    />
                  ))}
                {tableSearch && tableGroups.filter((g) => g.table.number.includes(tableSearch)).length === 0 && (
                  <div className="text-muted text-center py-4">
                    Nenhuma mesa encontrada para "{tableSearch}"
                  </div>
                )}
              </div>
            </>
          )}

          {/* ── Payment history ───────────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="ff-data-card">
              <div className="ff-data-card-header">Histórico de pagamentos</div>
              {allPayments.length === 0 && (
                <div className="text-center text-muted py-4">Nenhum pagamento</div>
              )}
              <table className="table table-hover mb-0">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Mesa</th><th>Total</th><th>Pago</th><th>Forma</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {allPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.orderNumber}</td>
                      <td>{p.customerName}</td>
                      <td>{p.tableNumber ?? '—'}</td>
                      <td>{formatBRL(p.total)}</td>
                      <td style={{ color: '#059669' }}>{formatBRL(p.paidAmount)}</td>
                      <td>{p.method ? METHOD_LABELS[p.method] : '—'}</td>
                      <td>
                        <span className={`badge ${p.status === 'PAID' ? 'bg-success' : p.status === 'PARTIALLY_PAID' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                          {p.status === 'PAID' ? 'Pago' : p.status === 'PARTIALLY_PAID' ? 'Parcial' : 'Pendente'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        {(p.status === 'PAID' || p.status === 'PARTIALLY_PAID') && (
                          <>
                            <button className="btn btn-sm btn-outline-secondary" title="Gerar recibo" onClick={() => handleGenerateReceipt(p.id)}>
                              <i className="bi bi-receipt" />
                            </button>
                            <button className="btn btn-sm btn-outline-secondary" title="Gerar nota fiscal" onClick={() => handleGenerateInvoice(p.id)}>
                              <i className="bi bi-file-earmark-text" />
                            </button>
                          </>
                        )}
                        {(p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID') && (
                          <button className="btn btn-sm btn-primary" onClick={() => { setSelectedPayment(p); setShowPayModal(true); }}>
                            Receber
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Receipts ─────────────────────────────────────────────────────── */}
          {tab === 'receipts' && (
            <div className="ff-data-card">
              <div className="ff-data-card-header">Recibos</div>
              {receipts.length === 0 && <div className="text-center text-muted py-4">Nenhum recibo gerado</div>}
              <table className="table table-hover mb-0">
                <thead><tr><th>Número</th><th>Total</th><th>Forma</th><th>Data</th><th>Ações</th></tr></thead>
                <tbody>
                  {receipts.map((r) => (
                    <tr key={r.id}>
                      <td><strong>{r.number}</strong></td>
                      <td>{formatBRL(r.total)}</td>
                      <td>{METHOD_LABELS[r.method]}</td>
                      <td>{new Date(r.createdAt).toLocaleString('pt-BR')}</td>
                      <td>
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedReceipt(r)}>
                          <i className="bi bi-eye me-1" />Ver
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Invoices ─────────────────────────────────────────────────────── */}
          {tab === 'invoices' && (
            <div className="ff-data-card">
              <div className="ff-data-card-header">Notas fiscais</div>
              {invoices.length === 0 && <div className="text-center text-muted py-4">Nenhuma nota fiscal gerada</div>}
              <table className="table table-hover mb-0">
                <thead><tr><th>Número</th><th>Cliente</th><th>Total</th><th>Status</th><th>Data</th></tr></thead>
                <tbody>
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td><strong>{inv.number}</strong></td>
                      <td>{inv.customerName}</td>
                      <td>{formatBRL(inv.total)}</td>
                      <td><span className="badge bg-success">{inv.status}</span></td>
                      <td>{new Date(inv.createdAt).toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legacy tables tab (simple overview) */}
          {tab === 'tables' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {tables.length === 0 && (
                <div className="text-muted">Nenhuma mesa aguardando pagamento.</div>
              )}
              {tables.map((t) => {
                const tablePays = allPayments.filter((p) => p.tableId === t.id);
                const totalDue = tablePays.reduce((s, p) => s + p.total, 0);
                const totalPaid = tablePays.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
                const remaining = +(totalDue - totalPaid).toFixed(2);
                return (
                  <div key={t.id} className="ff-data-card" style={{ borderLeft: `4px solid ${t.status === 'CLOSED' ? '#6b7280' : '#7c3aed'}` }}>
                    <div className="ff-data-card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span>Mesa {t.number}</span>
                      <span style={{ fontSize: 12, fontWeight: 400, color: '#6b7280' }}>{TABLE_STATUS_LABEL[t.status] ?? t.status}</span>
                    </div>
                    {totalDue > 0 && (
                      <div style={{ padding: '8px 16px', fontSize: 13, display: 'flex', gap: 20 }}>
                        <span>Total: <strong>{formatBRL(totalDue)}</strong></span>
                        {totalPaid > 0 && <span style={{ color: '#059669' }}>Pago: <strong>{formatBRL(totalPaid)}</strong></span>}
                        <span style={{ color: remaining > 0 ? '#e11d2a' : '#059669', fontWeight: 700 }}>Restante: {formatBRL(remaining)}</span>
                      </div>
                    )}
                    {t.status === 'CLOSED' && (
                      <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
                        <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => handleResetTable(t.id)}>
                          <i className="bi bi-arrow-repeat me-1" />Liberar mesa
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Pay context modal (table or customer level) */}
      {payContext && (
        <PayModal
          title={payContext.kind === 'table'
            ? `Receber — Mesa ${payContext.tableNumber}`
            : `Receber — ${payContext.customerName}`}
          subtitle={payContext.kind === 'table'
            ? `Mesa ${payContext.tableNumber} · ${tableGroups.find(g => g.table.id === payContext.tableId)?.customers.length ?? 0} cliente(s)`
            : `Mesa ${payContext.tableNumber} · ${payContext.customerName}`}
          totalDue={payContext.totalDue}
          paidAmount={payContext.totalPaid}
          onClose={() => setPayContext(null)}
          onPay={handlePayContext}
        />
      )}

      {/* Single payment modal (history tab) */}
      {showPayModal && selectedPayment && (
        <PayModal
          title="Receber pagamento"
          subtitle={`${selectedPayment.orderNumber} · ${selectedPayment.customerName}${selectedPayment.tableNumber ? ` · Mesa ${selectedPayment.tableNumber}` : ''}`}
          totalDue={selectedPayment.total}
          paidAmount={selectedPayment.paidAmount ?? 0}
          onClose={() => { setShowPayModal(false); setSelectedPayment(null); }}
          onPay={handlePaySingle}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal
          receipt={selectedReceipt}
          onClose={() => setSelectedReceipt(null)}
        />
      )}
    </div>
  );
}
