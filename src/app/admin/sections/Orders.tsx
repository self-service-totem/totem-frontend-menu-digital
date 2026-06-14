import { useEffect, useRef, useState } from 'react';
import { adminOrderService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbOrder, FullOrderStatus } from '@/lib/types';
import { formatBRL } from '../adminUtils';

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT:           'Rascunho',
  CREATED:         'Criado',
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID:         'Não pago',
  PARTIALLY_PAID: 'Parcial',
  PAID:           'Pago',
  REFUNDED:       'Reembolsado',
};

const ORDER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:           { bg: '#f3f4f6', color: '#9ca3af' },
  CREATED:         { bg: '#f3f4f6', color: '#6b7280' },
  SENT_TO_KITCHEN: { bg: 'var(--ff-status-new-soft)',        color: 'var(--ff-status-new)' },
  PREPARING:       { bg: 'var(--ff-status-preparing-soft)',  color: 'var(--ff-status-preparing)' },
  READY:           { bg: 'var(--ff-status-ready-soft)',      color: 'var(--ff-status-ready)' },
  DELIVERED:       { bg: 'var(--ff-status-delivered-soft)',  color: 'var(--ff-status-delivered)' },
  CLOSED:          { bg: 'var(--ff-status-paid-soft)',       color: 'var(--ff-status-paid)' },
  CANCELED:        { bg: 'var(--ff-status-cancelled-soft)',  color: 'var(--ff-status-cancelled)' },
};

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  UNPAID:         { bg: '#f3f4f6', color: '#9ca3af' },
  PARTIALLY_PAID: { bg: '#fffbeb', color: '#d97706' },
  PAID:           { bg: '#ecfdf5', color: '#059669' },
  REFUNDED:       { bg: '#f5f3ff', color: '#7c3aed' },
};

const STATUS_ADVANCE: Record<string, string> = {
  CREATED:         'SENT_TO_KITCHEN',
  SENT_TO_KITCHEN: 'PREPARING',
  PREPARING:       'READY',
  READY:           'DELIVERED',
  DELIVERED:       'CLOSED',
};

const STATUS_ADVANCE_LABEL: Record<string, string> = {
  CREATED:         'Enviar p/ cozinha',
  SENT_TO_KITCHEN: 'Marcar como preparando',
  PREPARING:       'Marcar como pronto',
  READY:           'Marcar como entregue',
  DELIVERED:       'Encerrar pedido',
};

const TIMELINE_STEPS = [
  { key: 'CREATED',         icon: 'bi-plus-circle' },
  { key: 'SENT_TO_KITCHEN', icon: 'bi-fire' },
  { key: 'PREPARING',       icon: 'bi-hourglass-split' },
  { key: 'READY',           icon: 'bi-check-circle' },
  { key: 'DELIVERED',       icon: 'bi-bag-check' },
  { key: 'CLOSED',          icon: 'bi-lock' },
];

const STATUS_ORDER = ['CREATED', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELED'];

const FILTER_TABS = [
  { key: '',                label: 'Todos' },
  { key: 'SENT_TO_KITCHEN', label: 'Na cozinha' },
  { key: 'PREPARING',       label: 'Preparando' },
  { key: 'READY',           label: 'Prontos' },
  { key: 'DELIVERED',       label: 'Entregues' },
  { key: 'PAID',            label: 'Pagos' },
];

function Pill({ status, map, labelMap }: { status: string; map: Record<string, { bg: string; color: string }>; labelMap: Record<string, string> }) {
  const style = map[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  return (
    <span className="ff-status-pill" style={{ background: style.bg, color: style.color }}>
      {labelMap[status] ?? status}
    </span>
  );
}

function OrderDrawer({ order, onClose, onAdvance }: { order: DbOrder; onClose: () => void; onAdvance: (id: string, status: string) => void }) {
  const nextStatus = STATUS_ADVANCE[order.status];
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="ff-order-drawer">
      <div className="ff-order-drawer-header">
        <span className="ff-order-drawer-title">#{order.orderNumber}</span>
        <button className="ff-order-drawer-close" onClick={onClose}><i className="bi bi-x" /></button>
      </div>

      <div className="ff-order-drawer-body">
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Pill status={order.status}        map={ORDER_STATUS_STYLE}   labelMap={ORDER_STATUS_LABEL} />
          <Pill status={order.paymentStatus} map={PAYMENT_STATUS_STYLE} labelMap={PAYMENT_STATUS_LABEL} />
          <span className="ff-status-pill" style={{ background: '#f3f4f6', color: '#6b7280' }}>{order.source}</span>
          {order.tableNumber && <span className="ff-status-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}><i className="bi bi-table" /> Mesa {order.tableNumber}</span>}
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{order.customerName}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>{new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Itens</div>
          {order.items.map((item, i) => (
            <div key={i} className="ff-order-drawer-item">
              <div className="ff-order-drawer-item-qty">{item.quantity}</div>
              <div style={{ flex: 1 }}>
                <div className="ff-order-drawer-item-name">{item.name}</div>
                {item.note && <div className="ff-order-drawer-item-note">Obs: {item.note}</div>}
              </div>
              <div className="ff-order-drawer-item-price">{formatBRL(item.unitPrice * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="ff-order-drawer-totals">
          <div className="ff-order-drawer-total-row"><span>Subtotal</span><span>{formatBRL(order.subtotal)}</span></div>
          {order.serviceFee > 0 && <div className="ff-order-drawer-total-row"><span>Taxa de serviço</span><span>{formatBRL(order.serviceFee)}</span></div>}
          <div className="ff-order-drawer-total-row grand"><span>Total</span><span>{formatBRL(order.total)}</span></div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Histórico</div>
          <div className="ff-order-timeline">
            {TIMELINE_STEPS.map((step) => {
              const stepIdx   = STATUS_ORDER.indexOf(step.key);
              const isDone    = stepIdx < currentIdx;
              const isCurrent = step.key === order.status;
              if (order.status === 'CANCELED' && !isDone && !isCurrent) return null;
              return (
                <div key={step.key} className="ff-order-timeline-step">
                  <div className={`ff-order-timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    <i className={`bi ${isDone ? 'bi-check' : step.icon}`} />
                  </div>
                  <div className={`ff-order-timeline-label ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    {ORDER_STATUS_LABEL[step.key]}
                  </div>
                </div>
              );
            })}
            {order.status === 'CANCELED' && (
              <div className="ff-order-timeline-step">
                <div className="ff-order-timeline-dot current" style={{ background: 'var(--ff-status-cancelled)', borderColor: 'var(--ff-status-cancelled)' }}><i className="bi bi-x" /></div>
                <div className="ff-order-timeline-label current" style={{ color: 'var(--ff-status-cancelled)' }}>Cancelado</div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nextStatus && (
        <div className="ff-order-drawer-footer">
          <button className="ff-order-advance-btn" onClick={() => onAdvance(order.id, nextStatus)}>
            <i className="bi bi-arrow-right-circle" />
            {STATUS_ADVANCE_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}

export function Orders() {
  const [orders, setOrders]   = useState<DbOrder[]>([]);
  const [filter, setFilter]   = useState('');
  const [selected, setSelected] = useState<DbOrder | null>(null);
  const [newIds, setNewIds]   = useState<Set<string>>(new Set());
  const prevIdsRef            = useRef<Set<string>>(new Set());
  const notify = useNotify();

  async function load() {
    const fresh = await adminOrderService.list();
    setOrders(fresh);
    const freshIds = new Set(fresh.map((o) => o.id));
    const added    = new Set([...freshIds].filter((id) => !prevIdsRef.current.has(id)));
    if (added.size > 0 && prevIdsRef.current.size > 0) {
      setNewIds(added);
      setTimeout(() => setNewIds(new Set()), 2500);
    }
    prevIdsRef.current = freshIds;
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function handleAdvance(orderId: string, status: string) {
    await adminOrderService.updateStatus(orderId, status as FullOrderStatus);
    notify(`Pedido atualizado → ${ORDER_STATUS_LABEL[status] ?? status}`);
    load();
    setSelected((prev) => prev?.id === orderId ? { ...prev, status: status as FullOrderStatus } : prev);
  }

  const filtered = filter ? orders.filter((o) => o.status === filter || o.paymentStatus === filter) : orders;

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
    if (o.paymentStatus === 'PAID') counts['PAID'] = (counts['PAID'] ?? 0) + 1;
  });

  return (
    <div className="ff-orders-layout">
      <div className="ff-orders-main">
        <div className="ff-orders-tabs">
          {FILTER_TABS.map((tab) => (
            <button key={tab.key} className={`ff-orders-tab${filter === tab.key ? ' active' : ''}`} onClick={() => setFilter(tab.key)}>
              {tab.label}
              <span className="ff-orders-tab-count">{tab.key === '' ? orders.length : (counts[tab.key] ?? 0)}</span>
            </button>
          ))}
        </div>

        <div className="ff-data-card" style={{ overflow: 'hidden' }}>
          <table className="ff-orders-table">
            <thead>
              <tr><th>Pedido</th><th>Cliente</th><th>Mesa</th><th>Total</th><th>Status</th><th>Pagamento</th><th>Origem</th><th>Hora</th></tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr><td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '28px 0' }}>Nenhum pedido neste status</td></tr>
              )}
              {filtered.map((o) => (
                <tr key={o.id} className={`${newIds.has(o.id) ? 'ff-order-row-new' : ''}${selected?.id === o.id ? ' selected' : ''}`} onClick={() => setSelected(selected?.id === o.id ? null : o)}>
                  <td><strong style={{ fontVariantNumeric: 'tabular-nums' }}>#{o.orderNumber}</strong></td>
                  <td>{o.customerName}</td>
                  <td>{o.tableNumber ? `Mesa ${o.tableNumber}` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td style={{ fontWeight: 700 }}>{formatBRL(o.total)}</td>
                  <td><Pill status={o.status}        map={ORDER_STATUS_STYLE}   labelMap={ORDER_STATUS_LABEL} /></td>
                  <td><Pill status={o.paymentStatus} map={PAYMENT_STATUS_STYLE} labelMap={PAYMENT_STATUS_LABEL} /></td>
                  <td style={{ color: '#6b7280' }}>{o.source}</td>
                  <td style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>{new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <OrderDrawer order={selected} onClose={() => setSelected(null)} onAdvance={handleAdvance} />}
    </div>
  );
}
