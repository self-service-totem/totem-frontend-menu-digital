import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cashierService } from '@/lib/services/cashierService';
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

// ─── Payment modal (full or partial) ─────────────────────────────────────────

interface PaymentModalProps {
  payment: Payment;
  onClose: () => void;
  onPay: (amount: number, method: PaymentMethod) => Promise<void>;
}

function PaymentModal({ payment, onClose, onPay }: PaymentModalProps) {
  const remaining = +(payment.total - (payment.paidAmount ?? 0)).toFixed(2);
  const [method, setMethod] = useState<PaymentMethod>('CASH');
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState(String(remaining));
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    const amount = mode === 'full' ? remaining : Math.min(parseFloat(customAmount) || 0, remaining);
    if (amount <= 0) return;
    setLoading(true);
    try {
      await onPay(amount, method);
    } finally {
      setLoading(false);
    }
  }

  const payAmount = mode === 'full' ? remaining : Math.min(parseFloat(customAmount) || 0, remaining);

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 16, maxHeight: '90vh', overflowY: 'auto' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0 }}>Receber pagamento</h5>

        <div style={{ background: '#f9fafb', borderRadius: 10, padding: 14 }}>
          <div style={{ fontSize: 13, color: '#6b7280' }}>
            {payment.orderNumber} · {payment.customerName}
            {payment.tableNumber && ` · Mesa ${payment.tableNumber}`}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8 }}>
            <span style={{ fontSize: 13, color: '#6b7280' }}>Total</span>
            <span style={{ fontWeight: 600 }}>{formatBRL(payment.total)}</span>
          </div>
          {payment.paidAmount > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#059669' }}>Já pago</span>
              <span style={{ fontWeight: 600, color: '#059669' }}>{formatBRL(payment.paidAmount)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 8 }}>
            <span style={{ fontWeight: 700 }}>Restante</span>
            <span style={{ fontWeight: 700, fontSize: 20, color: '#e11d2a' }}>{formatBRL(remaining)}</span>
          </div>
        </div>

        {/* Full vs partial */}
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

        {/* Payment method */}
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

// ─── Main CashierPage ─────────────────────────────────────────────────────────

function tabFromPath(pathname: string): Tab {
  if (pathname.includes('/history')) return 'history';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/invoices')) return 'invoices';
  return 'tables';
}

export function CashierPage() {
  const location = useLocation();
  const [tab, setTab] = useState<Tab>(() => tabFromPath(location.pathname));
  const [tables, setTables] = useState<DbTable[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [allPayments, setAllPayments] = useState<Payment[]>([]);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<Receipt | null>(null);
  const [summary, setSummary] = useState({ totalPaid: 0, paidCount: 0, pendingAmount: 0, pendingCount: 0 });
  const notify = useNotify();
  const navigate = useNavigate();

  // Keep tab in sync when navigating directly to /cashier/orders etc.
  useEffect(() => {
    setTab(tabFromPath(location.pathname));
  }, [location.pathname]);

  async function load() {
    const [t, p, all, rec, inv] = await Promise.all([
      cashierService.listTablesWithPendingPayments(),
      cashierService.listPendingPayments(),
      cashierService.listAllPayments(),
      cashierService.listReceipts(),
      cashierService.listInvoices(),
    ]);
    setTables(t);
    setPayments(p);
    setAllPayments(all);
    setReceipts(rec);
    setInvoices(inv);
    setSummary(cashierService.getDailySummary());
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  async function handlePay(amount: number, method: PaymentMethod) {
    if (!selectedPayment) return;
    await cashierService.payAmount(selectedPayment.id, amount, method);
    const remaining = +(selectedPayment.total - (selectedPayment.paidAmount ?? 0) - amount).toFixed(2);
    if (remaining <= 0) {
      notify(`Pagamento completo — ${METHOD_LABELS[method]}`);
    } else {
      notify(`${formatBRL(amount)} recebido — restam ${formatBRL(remaining)}`);
    }
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

  const tableStatusLabel: Record<string, string> = {
    EMPTY: 'Vazia', OCCUPIED: 'Ocupada', ORDER_IN_PROGRESS: 'Pedido em andamento',
    WAITING_FOR_KITCHEN: 'Aguardando cozinha', READY_TO_SERVE: 'Pronto para servir',
    WAITING_FOR_PAYMENT: 'Aguardando pagamento', CLOSED: 'Fechada',
  };

  const navItems: { label: string; value: Tab; icon: string }[] = [
    { label: 'Mesas', value: 'tables', icon: 'bi-grid-3x3-gap' },
    { label: 'Pagamentos pendentes', value: 'orders', icon: 'bi-clock-history' },
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
          {/* Summary */}
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

          {/* ── Tables view ──────────────────────────────────────────────────── */}
          {tab === 'tables' && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {tables.length === 0 && (
                <div className="text-muted">Nenhuma mesa aguardando pagamento.</div>
              )}
              {tables.map((t) => {
                const tablePays = allPayments.filter((p) => p.tableId === t.id);
                const totalDue = tablePays.reduce((s, p) => s + p.total, 0);
                const totalPaid = tablePays.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
                const remaining = +(totalDue - totalPaid).toFixed(2);
                const pendingPays = tablePays.filter((p) => p.status !== 'PAID' && p.status !== 'CANCELED');
                return (
                  <div key={t.id} className="ff-metric-card" style={{ borderLeft: `4px solid ${t.status === 'CLOSED' ? '#6b7280' : '#7c3aed'}` }}>
                    <div style={{ fontWeight: 700, fontSize: 18 }}>Mesa {t.number}</div>
                    <div style={{ fontSize: 12, color: '#6b7280' }}>{tableStatusLabel[t.status] ?? t.status}</div>
                    {totalDue > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, fontSize: 13 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>Total</span><span>{formatBRL(totalDue)}</span>
                        </div>
                        {totalPaid > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                            <span>Pago</span><span>{formatBRL(totalPaid)}</span>
                          </div>
                        )}
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: remaining > 0 ? '#e11d2a' : '#059669' }}>
                          <span>Restante</span><span>{formatBRL(remaining)}</span>
                        </div>
                      </div>
                    )}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
                      {pendingPays.map((p) => (
                        <button
                          key={p.id}
                          className="btn btn-sm btn-primary w-100"
                          onClick={() => { setSelectedPayment(p); setShowPayModal(true); }}
                        >
                          Receber {p.orderNumber} — {formatBRL(p.total - (p.paidAmount ?? 0))}
                        </button>
                      ))}
                      {t.status === 'CLOSED' && (
                        <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => handleResetTable(t.id)}>
                          <i className="bi bi-arrow-repeat me-1" />Liberar mesa
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ── Pending payments list ─────────────────────────────────────────── */}
          {tab === 'orders' && (
            <div className="ff-data-card">
              <div className="ff-data-card-header">
                Pagamentos pendentes
                <span className="badge bg-danger">{payments.length}</span>
              </div>
              {payments.length === 0 && (
                <div className="text-center text-muted py-4">Nenhum pagamento pendente</div>
              )}
              <table className="table table-hover mb-0">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Mesa</th><th>Total</th><th>Pago</th><th>Restante</th><th>Ações</th></tr></thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.orderNumber}</strong></td>
                      <td>{p.customerName}</td>
                      <td>{p.tableNumber ?? '—'}</td>
                      <td>{formatBRL(p.total)}</td>
                      <td style={{ color: '#059669' }}>{p.paidAmount > 0 ? formatBRL(p.paidAmount) : '—'}</td>
                      <td><strong style={{ color: '#e11d2a' }}>{formatBRL(p.total - (p.paidAmount ?? 0))}</strong></td>
                      <td>
                        <button className="btn btn-sm btn-primary" onClick={() => { setSelectedPayment(p); setShowPayModal(true); }}>
                          Receber
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* ── Payment history ───────────────────────────────────────────────── */}
          {tab === 'history' && (
            <div className="ff-data-card">
              <div className="ff-data-card-header">Histórico de pagamentos</div>
              <table className="table table-hover mb-0">
                <thead><tr><th>Pedido</th><th>Cliente</th><th>Total</th><th>Pago</th><th>Forma</th><th>Status</th><th>Ações</th></tr></thead>
                <tbody>
                  {allPayments.map((p) => (
                    <tr key={p.id}>
                      <td>{p.orderNumber}</td>
                      <td>{p.customerName}</td>
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
        </div>
      </div>

      {showPayModal && selectedPayment && (
        <PaymentModal
          payment={selectedPayment}
          onClose={() => { setShowPayModal(false); setSelectedPayment(null); }}
          onPay={handlePay}
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
