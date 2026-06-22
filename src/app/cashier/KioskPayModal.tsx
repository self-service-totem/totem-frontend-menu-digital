import { useState } from 'react';
import { formatCurrency as formatBRL } from '@/utils/format';
import { elapsedMins } from '@/lib/utils/useElapsed';
import { AdminModal } from '@/components/admin';
import type { DbOrder, QueueTicket } from '@/lib/types';
import { type KioskPayState } from './cashierUtils';
import './cashier.css';

export function KioskPayModal({
  order,
  onClose,
  onConfirm,
}: {
  order: DbOrder;
  onClose: () => void;
  onConfirm: (orderId: string) => Promise<QueueTicket>;
}) {
  const [state, setState] = useState<KioskPayState>('confirm');
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);

  async function handlePay() {
    setState('loading');
    try {
      const qt = await onConfirm(order.id);
      setQueueTicket(qt);
      setState('done');
    } catch {
      setState('confirm');
    }
  }

  const footer = state === 'confirm' ? (
    <>
      <button className="btn btn-success flex-1" style={{ fontWeight: 800, fontSize: 15 }} onClick={handlePay}>
        <i className="bi bi-cash-coin me-1" />Confirmar cobro {formatBRL(order.total)}
      </button>
      <button className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
    </>
  ) : state === 'done' && queueTicket ? (
    <>
      <button className="btn btn-outline-secondary flex-1" onClick={() => onConfirm(order.id).catch(() => {})}>
        <i className="bi bi-printer me-1" />Reimprimir
      </button>
      <button className="btn btn-primary flex-1" style={{ fontWeight: 700 }} onClick={onClose}>
        Cerrar
      </button>
    </>
  ) : null;

  return (
    <AdminModal
      title={state === 'done' ? 'Cobrado ✓' : `Cobrar ${order.orderNumber}`}
      onClose={onClose}
      footer={footer ?? undefined}
    >
      {state === 'loading' && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}>
          <div className="spinner-border text-success" style={{ width: 48, height: 48 }} />
        </div>
      )}

      {state === 'done' && queueTicket && (
        <div className="ff-csh-center-col">
          <div className="ff-csh-success-circle">
            <i className="bi bi-check2-circle" style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: 13, color: '#6b7280' }}>{order.orderNumber} · {order.customerName}</div>
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 32px', width: '100%' }}>
            <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>Turno asignado</div>
            <div style={{ fontSize: 56, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{queueTicket.ticketNumber}</div>
          </div>
          <div style={{ fontSize: 12, color: '#9ca3af' }}>Ticket impreso — el pedido fue enviado a cocina</div>
        </div>
      )}

      {state === 'confirm' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 4 }}>{order.customerName} · hace {elapsedMins(order.createdAt)} min</div>
          {order.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f3f4f6' : 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="ff-csh-qty-badge">{item.quantity}</span>
                <span style={{ fontSize: 13 }}>{item.name}</span>
              </div>
              <span style={{ fontSize: 13, fontWeight: 600 }}>{formatBRL(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '2px solid #e5e7eb', paddingTop: 10, marginTop: 4 }}>
            <span>Total</span><span style={{ color: '#e11d2a' }}>{formatBRL(order.total)}</span>
          </div>
        </div>
      )}
    </AdminModal>
  );
}
