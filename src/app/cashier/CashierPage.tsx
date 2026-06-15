import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { cashierService } from '@/lib/services/cashierService';
import type { TableGroup, CustomerGroup } from '@/lib/services/cashierService';
import { useNotify } from '@/lib/notifications';
import { useElapsed, elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
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
type PaymentFilter = 'all' | 'pending' | 'partial' | 'paid';

// ─── Payment method config ─────────────────────────────────────────────────────

const METHOD_CONFIG: Record<PaymentMethod, { label: string; icon: string; color: string }> = {
  CASH:              { label: 'Dinheiro',  icon: 'bi-cash-coin',             color: '#059669' },
  CARD:              { label: 'Cartão',    icon: 'bi-credit-card-2-front',   color: '#7c3aed' },
  PIX:               { label: 'PIX',       icon: 'bi-qr-code',               color: '#0ea5e9' },
  EXTERNAL_TERMINAL: { label: 'Terminal',  icon: 'bi-device-hdd',            color: '#d97706' },
};

function nextRoundAmount(amount: number): number {
  if (amount <= 20)  return Math.ceil(amount / 5) * 5;
  if (amount <= 100) return Math.ceil(amount / 10) * 10;
  if (amount <= 500) return Math.ceil(amount / 50) * 50;
  return Math.ceil(amount / 100) * 100;
}

// ─── Pay Modal ─────────────────────────────────────────────────────────────────

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
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [mode, setMode] = useState<'full' | 'partial'>('full');
  const [customAmount, setCustomAmount] = useState(String(remaining));
  const [cashGiven, setCashGiven] = useState(() => String(nextRoundAmount(remaining)));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const payAmount = mode === 'full' ? remaining : Math.min(parseFloat(customAmount) || 0, remaining);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const troco = method === 'CASH' && cashGivenNum >= payAmount && payAmount > 0
    ? +(cashGivenNum - payAmount).toFixed(2)
    : null;

  async function handlePay() {
    if (payAmount <= 0) return;
    setLoading(true);
    try {
      await onPay(payAmount, method);
      const isFullyPaid = +(remaining - payAmount).toFixed(2) <= 0;
      if (isFullyPaid) { setDone(true); return; }
    } finally {
      setLoading(false);
    }
    onClose();
  }

  if (done) {
    return (
      <div style={OVERLAY_STYLE} onClick={onClose}>
        <div style={{ ...MODAL_STYLE, width: 380, alignItems: 'center', textAlign: 'center', gap: 20 }} onClick={(e) => e.stopPropagation()}>
          <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#ecfdf5', border: '2px solid #6ee7b7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>
            <i className="bi bi-check2-circle" style={{ color: '#059669' }} />
          </div>
          <div>
            <div style={{ fontSize: 20, fontWeight: 800, color: '#1a1a1a' }}>Pagamento recebido!</div>
            <div style={{ fontSize: 14, color: '#6b7280', marginTop: 4 }}>{subtitle}</div>
          </div>
          {troco !== null && troco > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 24px', width: '100%' }}>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Troco</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>{formatBRL(troco)}</div>
            </div>
          )}
          <div style={{ display: 'flex', gap: 8, width: '100%' }}>
            <button className="btn btn-outline-secondary flex-1" style={{ fontSize: 13 }} onClick={() => window.print()}>
              <i className="bi bi-printer me-1" />Recibo
            </button>
            <button className="btn btn-success flex-1" style={{ fontWeight: 700 }} onClick={onClose}>
              Fechar
            </button>
          </div>
        </div>
      </div>
    );
  }

  const canConfirm = payAmount > 0 && !(method === 'CASH' && cashGivenNum < payAmount);

  return (
    <div style={OVERLAY_STYLE} onClick={onClose}>
      <div style={{ ...MODAL_STYLE, width: 460 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 17, fontWeight: 800, color: '#1a1a1a' }}>{title}</div>
            <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>{subtitle}</div>
          </div>
          <button onClick={onClose} style={{ border: 'none', background: '#f3f4f6', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6b7280', fontSize: 16 }}>
            <i className="bi bi-x" />
          </button>
        </div>

        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Amount summary */}
          <div style={{ background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>Total da conta</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{formatBRL(totalDue)}</span>
              </div>
            )}
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f0fdf4' }}>
                <span style={{ fontSize: 13, color: '#059669' }}>Já pago</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{formatBRL(paidAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>Valor a cobrar</span>
              <span style={{ fontWeight: 900, fontSize: 28, color: '#e11d2a', letterSpacing: '-0.02em' }}>{formatBRL(remaining)}</span>
            </div>
          </div>

          {/* Full / partial toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: 8 }}>Forma de cobrança</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: '10px', border: `2px solid ${mode === 'full' ? '#1d4ed8' : '#e5e7eb'}`, borderRadius: 10, background: mode === 'full' ? '#eff6ff' : '#fff', color: mode === 'full' ? '#1d4ed8' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => setMode('full')}
              >
                <i className="bi bi-check-all me-1" />Total restante
              </button>
              <button
                style={{ flex: 1, padding: '10px', border: `2px solid ${mode === 'partial' ? '#d97706' : '#e5e7eb'}`, borderRadius: 10, background: mode === 'partial' ? '#fffbeb' : '#fff', color: mode === 'partial' ? '#d97706' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => setMode('partial')}
              >
                <i className="bi bi-scissors me-1" />Valor parcial
              </button>
            </div>
            {mode === 'partial' && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>Valor a receber (R$)</label>
                <input
                  className="form-control"
                  type="number"
                  min={0.01}
                  max={remaining}
                  step={0.01}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  style={{ fontSize: 20, fontWeight: 700, textAlign: 'right', borderRadius: 10 }}
                />
                {payAmount > 0 && payAmount < remaining && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                    <i className="bi bi-info-circle me-1" />Restante após pagamento: {formatBRL(+(remaining - payAmount).toFixed(2))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: 8 }}>Forma de pagamento</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.keys(METHOD_CONFIG) as PaymentMethod[]).map((m) => {
                const cfg = METHOD_CONFIG[m];
                const active = method === m;
                return (
                  <button
                    key={m}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: `2px solid ${active ? cfg.color : '#e5e7eb'}`, borderRadius: 10, background: active ? `${cfg.color}10` : '#fff', color: active ? cfg.color : '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
                    onClick={() => setMethod(m)}
                  >
                    <i className={`bi ${cfg.icon}`} style={{ fontSize: 20 }} />
                    {cfg.label}
                    {active && <i className="bi bi-check-circle-fill ms-auto" style={{ fontSize: 14 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash: amount given + change */}
          {method === 'CASH' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 6 }}>
                  <i className="bi bi-cash-coin me-1" />Valor entregue pelo cliente
                </label>
                <input
                  className="form-control"
                  type="number"
                  min={payAmount}
                  step={0.01}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  style={{ fontSize: 22, fontWeight: 700, textAlign: 'right', borderRadius: 10, borderColor: '#fde68a' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[payAmount, nextRoundAmount(payAmount), nextRoundAmount(payAmount) + 10]
                    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
                    .map((v) => (
                      <button key={v} onClick={() => setCashGiven(String(v))} style={{ padding: '5px 12px', border: '1.5px solid #f59e0b', borderRadius: 8, background: '#fff', color: '#d97706', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {formatBRL(v)}
                      </button>
                    ))}
                </div>
              </div>
              {troco !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: troco > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: '12px 16px', border: `1px solid ${troco > 0 ? '#bbf7d0' : '#fca5a5'}` }}>
                  <span style={{ fontWeight: 700, color: troco > 0 ? '#059669' : '#dc2626', fontSize: 14 }}>
                    <i className={`bi ${troco > 0 ? 'bi-arrow-left-right' : 'bi-exclamation-triangle'} me-1`} />
                    Troco
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 26, color: troco > 0 ? '#059669' : '#dc2626', letterSpacing: '-0.02em' }}>{formatBRL(troco)}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px', borderTop: '1px solid #e5e7eb', display: 'flex', gap: 10 }}>
          <button
            style={{ flex: 1, padding: '14px', border: 'none', borderRadius: 12, background: canConfirm && !loading ? '#059669' : '#e5e7eb', color: canConfirm && !loading ? '#fff' : '#9ca3af', fontWeight: 800, fontSize: 15, cursor: canConfirm && !loading ? 'pointer' : 'not-allowed', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'background .15s' }}
            onClick={handlePay}
            disabled={!canConfirm || loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-1" />Processando...</>
            ) : (
              <><i className="bi bi-check2-circle" />Receber {formatBRL(payAmount)}</>
            )}
          </button>
          <button onClick={onClose} style={{ padding: '14px 20px', border: '1.5px solid #e5e7eb', borderRadius: 12, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Receipt modal ─────────────────────────────────────────────────────────────

function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  return (
    <div style={OVERLAY_STYLE} onClick={onClose}>
      <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 360, fontFamily: 'monospace', fontSize: 13 }} onClick={(e) => e.stopPropagation()}>
        <div style={{ textAlign: 'center', marginBottom: 16 }}>
          <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.1em', color: '#6b7280' }}>Recibo</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#1a1a1a', margin: '4px 0' }}>{receipt.number}</div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>{new Date(receipt.createdAt).toLocaleString('pt-BR')}</div>
        </div>
        <hr style={{ borderColor: '#e5e7eb' }} />
        {receipt.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span>{item.quantity}× {item.name}</span>
            <span>{formatBRL(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
        <hr style={{ borderColor: '#e5e7eb' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: '#6b7280' }}>Subtotal</span><span>{formatBRL(receipt.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: '#6b7280' }}>Taxa de serviço</span><span>{formatBRL(receipt.serviceFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 6 }}>
          <span>TOTAL</span><span>{formatBRL(receipt.total)}</span>
        </div>
        <div style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
          <i className="bi bi-credit-card me-1" />Forma: {METHOD_LABELS[receipt.method]}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <button className="btn btn-sm btn-outline-secondary flex-1" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" />Imprimir
          </button>
          <button className="btn btn-sm btn-secondary" onClick={onClose}>Fechar</button>
        </div>
      </div>
    </div>
  );
}

// ─── Customer section ──────────────────────────────────────────────────────────

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
    o.items.map((item) => ({ ...item, serviceFee: o.serviceFee })),
  );
  const totalItems = customer.orders.reduce((s, o) => s + o.subtotal, 0);
  const totalFee = customer.orders.reduce((s, o) => s + o.serviceFee, 0);

  return (
    <div style={{ borderTop: '1px solid #f3f4f6' }}>
      {/* Customer header */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 16px', cursor: 'pointer', background: customer.isPaid ? '#f0fdf4' : '#fff', transition: 'background .15s' }}
        onClick={onToggle}
      >
        <div style={{ width: 30, height: 30, borderRadius: '50%', background: customer.isPaid ? '#d1fae5' : '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className={`bi ${customer.isPaid ? 'bi-check2' : 'bi-person'}`} style={{ fontSize: 13, color: customer.isPaid ? '#059669' : '#6b7280' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, color: '#1a1a1a' }}>{customer.name}</div>
          <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 1 }}>
            {customer.orders.length} pedido{customer.orders.length !== 1 ? 's' : ''} · {customer.orders.reduce((s, o) => s + o.items.length, 0)} iten{customer.orders.reduce((s, o) => s + o.items.length, 0) !== 1 ? 's' : 's'}
          </div>
        </div>
        {customer.isPaid ? (
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: '#d1fae5', color: '#059669', border: '1px solid #6ee7b7' }}>
            <i className="bi bi-check2 me-1" />PAGO
          </span>
        ) : (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{ fontWeight: 800, color: '#e11d2a', fontSize: 16, letterSpacing: '-0.01em' }}>{formatBRL(customer.remaining)}</div>
            {customer.totalPaid > 0 && (
              <div style={{ fontSize: 11, color: '#059669' }}>pago {formatBRL(customer.totalPaid)}</div>
            )}
          </div>
        )}
        <i className={`bi bi-chevron-${expanded ? 'up' : 'down'}`} style={{ fontSize: 12, color: '#9ca3af', flexShrink: 0 }} />
      </div>

      {/* Expanded items */}
      {expanded && (
        <div style={{ padding: '0 16px 14px 56px', animation: 'cashier-expand .2s ease-out' }}>
          {/* Items list */}
          <div style={{ marginBottom: 10 }}>
            {allItems.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < allItems.length - 1 ? '1px solid #f9fafb' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ width: 22, height: 22, borderRadius: 6, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: '#374151', flexShrink: 0 }}>
                    {item.quantity}
                  </span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{formatBRL(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
              <span>Subtotal</span><span>{formatBRL(totalItems)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
              <span>Taxa de serviço (10%)</span><span>{formatBRL(totalFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#1a1a1a', borderTop: '1px solid #e5e7eb', paddingTop: 6, marginTop: 4 }}>
              <span>Total</span><span>{formatBRL(totalItems + totalFee)}</span>
            </div>
            {customer.totalPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                <span>Já pago</span><span>{formatBRL(customer.totalPaid)}</span>
              </div>
            )}
            {!customer.isPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#e11d2a', borderTop: '1px solid #fca5a5', paddingTop: 6, marginTop: 2 }}>
                <span>A receber</span><span>{formatBRL(customer.remaining)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          {!customer.isPaid && (
            <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
              <button
                style={{ flex: 1, padding: '9px 14px', border: 'none', borderRadius: 9, background: '#1d4ed8', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                onClick={(e) => { e.stopPropagation(); onPayCustomer(); }}
              >
                <i className="bi bi-person-check" />Receber {formatBRL(customer.remaining)}
              </button>
              <button
                style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={(e) => { e.stopPropagation(); onPayPartial(); }}
              >
                Parcial
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Table group card ──────────────────────────────────────────────────────────

const TABLE_STATUS_LABEL: Record<string, string> = {
  EMPTY: 'Vazia', OCCUPIED: 'Ocupada', ORDER_IN_PROGRESS: 'Pedido em andamento',
  WAITING_FOR_KITCHEN: 'Aguardando cozinha', READY_TO_SERVE: 'Pronto para servir',
  WAITING_FOR_PAYMENT: 'Aguardando pagamento', CLOSED: 'Fechada',
};

const PAYMENT_STATUS_CONFIG: Record<string, { label: string; bg: string; color: string; border: string }> = {
  UNPAID:         { label: 'Pendente',    bg: '#fef2f2', color: '#dc2626', border: '#fca5a5' },
  PARTIALLY_PAID: { label: 'Parcial',     bg: '#fffbeb', color: '#d97706', border: '#fde68a' },
  PAID:           { label: 'Pago',        bg: '#f0fdf4', color: '#059669', border: '#6ee7b7' },
};

const BORDER_COLOR: Record<string, string> = {
  UNPAID: '#dc2626', PARTIALLY_PAID: '#d97706', PAID: '#059669',
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
  group, collapsed, onToggleCollapse,
  expandedCustomers, onToggleCustomer,
  onPayTable, onPayTablePartial,
  onPayCustomer, onPayCustomerPartial,
}: TableGroupCardProps) {
  const borderColor = BORDER_COLOR[group.paymentStatus] ?? '#6b7280';
  const statusCfg = PAYMENT_STATUS_CONFIG[group.paymentStatus];
  const unpaidCustomers = group.customers.filter((c) => !c.isPaid);

  const waitMins = group.table.updatedAt ? elapsedMins(group.table.updatedAt) : null;
  const waitSev = waitMins != null ? ageSeverity(waitMins, 15, 30) : 'ok';
  const waitStyle = SEVERITY_STYLE[waitSev];

  return (
    <div className="ff-data-card" style={{ borderLeft: `4px solid ${borderColor}`, padding: 0, overflow: 'hidden', transition: 'box-shadow .2s' }}>
      {/* ── Collapsed / Header row ── */}
      <div
        style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 10, background: collapsed ? '#fff' : '#fafafa', borderBottom: collapsed ? 'none' : '1px solid #e5e7eb', cursor: 'pointer', flexWrap: 'wrap' }}
        onClick={onToggleCollapse}
      >
        {/* Table number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} style={{ fontSize: 12, color: '#9ca3af' }} />
          <div style={{ width: 38, height: 38, borderRadius: 10, background: `${borderColor}15`, border: `1.5px solid ${borderColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontWeight: 900, fontSize: 15, color: borderColor, letterSpacing: '-0.02em' }}>{group.table.number}</span>
          </div>
        </div>

        {/* Status badges */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 11, fontWeight: 700, padding: '3px 9px', borderRadius: 999, background: statusCfg.bg, color: statusCfg.color, border: `1px solid ${statusCfg.border}` }}>
            {statusCfg.label}
          </span>
          {waitMins != null && group.paymentStatus !== 'PAID' && (
            <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: waitStyle.bg, color: waitStyle.color, border: `1px solid ${waitStyle.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
              <i className="bi bi-clock" style={{ fontSize: 10 }} />{fmtElapsed(waitMins)}
            </span>
          )}
        </div>

        {/* Metadata pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, fontSize: 12, color: '#6b7280' }}>
          <span><i className="bi bi-people me-1" />{group.customers.length}</span>
          <span><i className="bi bi-receipt me-1" />{group.activeOrdersCount}</span>
        </div>

        {/* Financial summary — always visible */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 }}>
          {group.paymentStatus !== 'PAID' && group.remaining > 0 && (
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 500 }}>A receber</div>
              <div style={{ fontWeight: 900, fontSize: 18, color: '#e11d2a', letterSpacing: '-0.01em' }}>{formatBRL(group.remaining)}</div>
            </div>
          )}
          {group.paymentStatus !== 'PAID' && (
            <button
              style={{ padding: '9px 16px', border: 'none', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap', flexShrink: 0 }}
              onClick={(e) => { e.stopPropagation(); onPayTable(); }}
            >
              <i className="bi bi-check2-all" />Receber mesa
            </button>
          )}
          {group.paymentStatus === 'PAID' && (
            <span style={{ fontSize: 14, fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: 6 }}>
              <i className="bi bi-check-circle-fill" />{formatBRL(group.totalDue)}
            </span>
          )}
        </div>
      </div>

      {/* ── Expanded: totals bar + customer sections ── */}
      {!collapsed && (
        <>
          {/* Financial totals bar */}
          <div style={{ padding: '10px 16px 10px 20px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: 0, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 20, fontSize: 13, flex: 1, flexWrap: 'wrap' }}>
              <span style={{ color: '#6b7280' }}>
                Total conta: <strong style={{ color: '#1a1a1a' }}>{formatBRL(group.totalDue)}</strong>
              </span>
              {group.totalPaid > 0 && (
                <span style={{ color: '#059669' }}>
                  Pago: <strong>{formatBRL(group.totalPaid)}</strong>
                </span>
              )}
              {group.remaining > 0 && (
                <span style={{ color: '#e11d2a', fontWeight: 700 }}>
                  Restante: {formatBRL(group.remaining)}
                </span>
              )}
            </div>
            {group.paymentStatus !== 'PAID' && (
              <button
                style={{ fontSize: 12, color: '#6b7280', background: 'none', border: '1px solid #e5e7eb', borderRadius: 7, padding: '4px 10px', cursor: 'pointer' }}
                onClick={onPayTablePartial}
              >
                <i className="bi bi-scissors me-1" />Valor parcial
              </button>
            )}
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
            <div style={{ padding: '12px 16px', fontSize: 13, color: '#059669', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 6, background: '#f0fdf4' }}>
              <i className="bi bi-check-circle-fill" />Mesa totalmente paga
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Pay context type ──────────────────────────────────────────────────────────

type PayContext =
  | { kind: 'table'; tableId: string; tableNumber: string; remaining: number; totalDue: number; totalPaid: number }
  | { kind: 'customer'; tableId: string; tableNumber: string; customerName: string; remaining: number; totalDue: number; totalPaid: number }
  | null;

// ─── Shared overlay style ──────────────────────────────────────────────────────

const OVERLAY_STYLE: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: 'rgba(0,0,0,.55)',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  zIndex: 1000,
  padding: 24,
  animation: 'cashier-fade .16s ease',
};

const MODAL_STYLE: React.CSSProperties = {
  background: '#fff',
  borderRadius: 16,
  display: 'flex',
  flexDirection: 'column',
  maxHeight: '92vh',
  overflowY: 'auto',
  boxShadow: '0 20px 60px rgba(0,0,0,.25)',
  animation: 'cashier-pop .2s cubic-bezier(.16,1,.3,1)',
  width: '100%',
};

// ─── Tab helpers ───────────────────────────────────────────────────────────────

function tabFromPath(pathname: string): Tab {
  if (pathname.includes('/history')) return 'history';
  if (pathname.includes('/orders')) return 'orders';
  if (pathname.includes('/receipts')) return 'receipts';
  if (pathname.includes('/invoices')) return 'invoices';
  return 'tables';
}

// ─── Summary MetricCard ────────────────────────────────────────────────────────

function CashierMetric({ icon, iconColor, iconBg, label, value, valueColor, sub }: {
  icon: string; iconColor: string; iconBg: string;
  label: string; value: string; valueColor?: string; sub?: string;
}) {
  return (
    <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 14, padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, color: iconColor }}>
          <i className={`bi ${icon}`} />
        </div>
      </div>
      <div>
        <div style={{ fontSize: 26, fontWeight: 800, color: valueColor ?? '#1a1a1a', letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 12, color: '#6b7280', fontWeight: 500, marginTop: 4 }}>{label}</div>
        {sub && <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>{sub}</div>}
      </div>
    </div>
  );
}

// ─── Filter pill ───────────────────────────────────────────────────────────────

function FilterPill({ label, active, count, onClick }: { label: string; active: boolean; count?: number; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px', border: `1.5px solid ${active ? '#1a1a2e' : '#e5e7eb'}`, borderRadius: 999, background: active ? '#1a1a2e' : '#fff', color: active ? '#fff' : '#6b7280', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all .15s', whiteSpace: 'nowrap' }}
    >
      {label}
      {count !== undefined && (
        <span style={{ fontSize: 11, fontWeight: 700, padding: '0 5px', borderRadius: 999, background: active ? 'rgba(255,255,255,.2)' : '#f3f4f6', color: active ? '#fff' : '#6b7280', minWidth: 18, textAlign: 'center' }}>
          {count}
        </span>
      )}
    </button>
  );
}

// ─── Table sort helpers ────────────────────────────────────────────────────────

function sortRows<T>(rows: T[], key: string, dir: 'asc' | 'desc'): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[key];
    const bv = (b as Record<string, unknown>)[key];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return dir === 'asc' ? cmp : -cmp;
  });
}

function toggleSort(
  current: { key: string; dir: 'asc' | 'desc' },
  key: string,
  set: Dispatch<SetStateAction<{ key: string; dir: 'asc' | 'desc' }>>,
) {
  set(current.key === key
    ? { key, dir: current.dir === 'asc' ? 'desc' : 'asc' }
    : { key, dir: 'asc' });
}

function SortTh({ label, colKey, sort, onSort }: {
  label: string;
  colKey: string;
  sort: { key: string; dir: 'asc' | 'desc' };
  onSort: (k: string) => void;
}) {
  const active = sort.key === colKey;
  return (
    <th className={`sortable${active ? ' sorted' : ''}`} onClick={() => onSort(colKey)}>
      {label}
      <span className="ff-sort-icon">
        <i className={`bi bi-arrow-${active ? (sort.dir === 'asc' ? 'up' : 'down') : 'down-up'}`} />
      </span>
    </th>
  );
}

// ─── Main CashierPage ──────────────────────────────────────────────────────────

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
  const [expandedCustomers, setExpandedCustomers] = useState<Set<string>>(new Set());
  const [collapsedTables, setCollapsedTables] = useState<Set<string>>(new Set());
  const [tableSearch, setTableSearch] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<PaymentFilter>('all');
  const [scrolled, setScrolled] = useState(false);
  const [histSort, setHistSort] = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'orderNumber', dir: 'desc' });
  const [recSort, setRecSort]   = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const [invSort, setInvSort]   = useState<{ key: string; dir: 'asc' | 'desc' }>({ key: 'createdAt', dir: 'desc' });
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const notify = useNotify();
  const navigate = useNavigate();
  useElapsed(30_000);

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

  // Track scroll for sticky shadow
  function handleScroll() {
    setScrolled((scrollAreaRef.current?.scrollTop ?? 0) > 4);
  }

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
    notify('Mesa liberada');
    load();
  }

  // ── Filtered table groups ────────────────────────────────────────────────────

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

  const navItems: { label: string; value: Tab; icon: string }[] = [
    { label: 'Mesas / Pedidos', value: 'orders', icon: 'bi-grid-3x3-gap' },
    { label: 'Histórico', value: 'history', icon: 'bi-list-check' },
    { label: 'Recibos', value: 'receipts', icon: 'bi-receipt' },
    { label: 'Notas fiscais', value: 'invoices', icon: 'bi-file-earmark-text' },
  ];

  return (
    <>
      {/* Global animation styles */}
      <style>{`
        @keyframes cashier-fade { from { opacity: 0 } to { opacity: 1 } }
        @keyframes cashier-pop  { from { transform: scale(.95); opacity: 0 } to { transform: scale(1); opacity: 1 } }
        @keyframes cashier-expand { from { opacity: 0; transform: translateY(-6px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>

      <div className="ff-area-layout" style={{ height: '100vh', overflow: 'hidden' }}>
        {/* Sidebar */}
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

        {/* Main area — overflow hidden so only the list scrolls */}
        <div className="ff-area-main" style={{ overflow: 'hidden' }}>

          {/* ── Sticky operational header ─────────────────────────────────── */}
          <div style={{ flexShrink: 0, background: '#fff', boxShadow: scrolled ? '0 2px 12px rgba(0,0,0,.08)' : 'none', transition: 'box-shadow .2s', zIndex: 10 }}>
            {/* Topbar */}
            <div className="ff-area-topbar" style={{ borderBottom: '1px solid #e5e7eb' }}>
              <span className="ff-area-topbar-title">Caixa / Pagamentos</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: '#059669', fontWeight: 600 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#059669', animation: 'ff-status-pulse 2.4s ease-in-out infinite', display: 'inline-block' }} />
                  Ao vivo
                </div>
                <button className="btn btn-sm btn-outline-secondary" onClick={load} title="Atualizar">
                  <i className="bi bi-arrow-clockwise" />
                </button>
              </div>
            </div>

            {/* Summary cards */}
            <div style={{ padding: '16px 24px 0', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              <CashierMetric
                icon="bi-cash-stack" iconColor="#059669" iconBg="#ecfdf5"
                label="Recebido hoje" value={formatBRL(summary.totalPaid)} valueColor="#059669"
              />
              <CashierMetric
                icon="bi-check-circle" iconColor="#1d4ed8" iconBg="#eff6ff"
                label="Pedidos pagos" value={String(summary.paidCount)}
              />
              <CashierMetric
                icon="bi-hourglass-split" iconColor="#d97706" iconBg="#fffbeb"
                label="A receber" value={formatBRL(summary.pendingAmount)} valueColor="#d97706"
              />
              <CashierMetric
                icon="bi-table" iconColor="#7c3aed" iconBg="#f5f3ff"
                label="Mesas pendentes" value={String(summary.pendingCount)}
              />
            </div>

            {/* Search + filters + controls */}
            {tab === 'orders' && (
              <div style={{ padding: '14px 24px 14px', display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                {/* Search */}
                <div style={{ position: 'relative', width: 200, flexShrink: 0 }}>
                  <i className="bi bi-search" style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: 13, pointerEvents: 'none' }} />
                  <input
                    className="form-control form-control-sm"
                    style={{ paddingLeft: 32, borderRadius: 9 }}
                    placeholder="Buscar mesa..."
                    value={tableSearch}
                    onChange={(e) => setTableSearch(e.target.value)}
                  />
                </div>

                {/* Filter pills */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  <FilterPill label="Todos" active={paymentFilter === 'all'} count={countByFilter.all} onClick={() => setPaymentFilter('all')} />
                  <FilterPill label="Pendentes" active={paymentFilter === 'pending'} count={countByFilter.pending} onClick={() => setPaymentFilter('pending')} />
                  <FilterPill label="Parcial" active={paymentFilter === 'partial'} count={countByFilter.partial} onClick={() => setPaymentFilter('partial')} />
                  <FilterPill label="Pagos" active={paymentFilter === 'paid'} count={countByFilter.paid} onClick={() => setPaymentFilter('paid')} />
                </div>

                {/* Collapse / expand */}
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
          </div>

          {/* ── Scrollable content ────────────────────────────────────────── */}
          <div
            ref={scrollAreaRef}
            onScroll={handleScroll}
            style={{ flex: 1, overflowY: 'auto', padding: 24 }}
          >
            {/* ── Grouped table view (main) ── */}
            {tab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tableGroups.length === 0 && (
                  <div className="ff-empty-state">
                    <i className="bi bi-check2-circle ff-empty-state-icon" />
                    <div className="ff-empty-state-title">Nenhuma mesa ativa</div>
                    <div className="ff-empty-state-desc">Quando houver pedidos em andamento, as mesas aparecerão aqui.</div>
                  </div>
                )}
                {filteredGroups.map((group) => (
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
                      setPayContext({ kind: 'customer', tableId: group.table.id, tableNumber: group.table.number, customerName: name, remaining: c.remaining, totalDue: c.totalDue, totalPaid: c.totalPaid });
                    }}
                    onPayCustomerPartial={(name) => {
                      const c = group.customers.find((x) => x.name === name)!;
                      setPayContext({ kind: 'customer', tableId: group.table.id, tableNumber: group.table.number, customerName: name, remaining: c.remaining, totalDue: c.totalDue, totalPaid: c.totalPaid });
                    }}
                  />
                ))}
                {tableSearch && filteredGroups.length === 0 && tableGroups.length > 0 && (
                  <div className="text-muted text-center py-4">Nenhuma mesa encontrada para "{tableSearch}"</div>
                )}
              </div>
            )}

            {/* ── Payment history ── */}
            {tab === 'history' && (
              <div className="ff-data-card">
                <div className="ff-data-card-header"><span className="ff-data-card-title">Histórico de pagamentos</span></div>
                {allPayments.length === 0 && (
                  <div className="text-center text-muted py-4">Nenhum pagamento</div>
                )}
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label="Pedido"  colKey="orderNumber" sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Cliente" colKey="customerName" sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Mesa"    colKey="tableNumber"  sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Total"   colKey="total"        sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Pago"    colKey="paidAmount"   sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Forma"   colKey="method"       sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label="Status"  colKey="status"       sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(allPayments, histSort.key, histSort.dir).map((p) => (
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

            {/* ── Receipts ── */}
            {tab === 'receipts' && (
              <div className="ff-data-card">
                <div className="ff-data-card-header"><span className="ff-data-card-title">Recibos</span></div>
                {receipts.length === 0 && <div className="text-center text-muted py-4">Nenhum recibo gerado</div>}
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label="Número" colKey="number"    sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label="Total"  colKey="total"     sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label="Forma"  colKey="method"    sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label="Data"   colKey="createdAt" sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <th>Ações</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(receipts, recSort.key, recSort.dir).map((r) => (
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

            {/* ── Invoices ── */}
            {tab === 'invoices' && (
              <div className="ff-data-card">
                <div className="ff-data-card-header"><span className="ff-data-card-title">Notas fiscais</span></div>
                {invoices.length === 0 && <div className="text-center text-muted py-4">Nenhuma nota fiscal gerada</div>}
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label="Número"  colKey="number"       sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label="Cliente" colKey="customerName"  sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label="Total"   colKey="total"         sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label="Status"  colKey="status"        sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label="Data"    colKey="createdAt"     sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(invoices, invSort.key, invSort.dir).map((inv) => (
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

            {/* ── Legacy tables tab ── */}
            {tab === 'tables' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tables.length === 0 && <div className="text-muted">Nenhuma mesa aguardando pagamento.</div>}
                {tables.map((t) => {
                  const tablePays = allPayments.filter((p) => p.tableId === t.id);
                  const totalDue = tablePays.reduce((s, p) => s + p.total, 0);
                  const totalPaid = tablePays.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
                  const remaining = +(totalDue - totalPaid).toFixed(2);
                  return (
                    <div key={t.id} className="ff-data-card" style={{ borderLeft: `4px solid ${t.status === 'CLOSED' ? '#6b7280' : '#7c3aed'}` }}>
                      <div className="ff-data-card-header" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <span className="ff-data-card-title">Mesa {t.number}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{TABLE_STATUS_LABEL[t.status] ?? t.status}</span>
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

        {/* ── Modals ─────────────────────────────────────────────────────── */}
        {payContext && (
          <PayModal
            title={payContext.kind === 'table'
              ? `Receber — Mesa ${payContext.tableNumber}`
              : `Receber — ${payContext.customerName}`}
            subtitle={payContext.kind === 'table'
              ? `Mesa ${payContext.tableNumber} · ${tableGroups.find((g) => g.table.id === payContext.tableId)?.customers.length ?? 0} cliente(s)`
              : `Mesa ${payContext.tableNumber} · ${payContext.customerName}`}
            totalDue={payContext.totalDue}
            paidAmount={payContext.totalPaid}
            onClose={() => setPayContext(null)}
            onPay={handlePayContext}
          />
        )}

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
          <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
        )}
      </div>
    </>
  );
}
