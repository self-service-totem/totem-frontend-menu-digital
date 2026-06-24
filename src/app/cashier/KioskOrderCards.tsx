import { formatCurrency as formatBRL } from '@/utils/format';
import { elapsedMins, fmtElapsed, ageSeverity, SEVERITY_STYLE } from '@/lib/utils/useElapsed';
import { printDemoTicket } from '@/lib/printing/demoTicket';
import { getBrandName } from '@/lib/services/brand';
import type { DbOrder } from '@/lib/types';
import './cashier.css';

export function KioskPendingCard({ order, onPay }: { order: DbOrder; onPay: () => void }) {
  const elapsed = elapsedMins(order.createdAt);
  const sev = ageSeverity(elapsed, 5, 10);
  const sevStyle = SEVERITY_STYLE[sev];
  return (
    <div className="ff-data-card" style={{ borderLeft: '4px solid #d97706', padding: 0, overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#fffbeb', borderBottom: '1px solid #fde68a' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#fef3c7', border: '1.5px solid #fde68a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bi bi-cash-coin" style={{ fontSize: 20, color: '#d97706' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a', letterSpacing: '-0.01em' }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{order.customerName}</div>
        </div>
        <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: sevStyle.bg, color: sevStyle.color, border: `1px solid ${sevStyle.border}`, display: 'flex', alignItems: 'center', gap: 4 }}>
          <i className="bi bi-clock" style={{ fontSize: 10 }} />{fmtElapsed(elapsed)}
        </span>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Total</div>
          <div style={{ fontWeight: 900, fontSize: 20, color: '#e11d2a', letterSpacing: '-0.02em' }}>{formatBRL(order.total)}</div>
        </div>
      </div>

      {/* Items */}
      <div style={{ padding: '10px 16px' }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '5px 0', borderBottom: i < order.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="ff-csh-qty-badge">{item.quantity}</span>
              <span style={{ fontSize: 13, color: '#374151' }}>{item.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{formatBRL(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>

      {/* Cobrar button */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #fde68a', background: '#fffbeb' }}>
        <button
          style={{ width: '100%', padding: '12px', border: 'none', borderRadius: 10, background: '#059669', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
          onClick={onPay}
        >
          <i className="bi bi-cash-coin" />
          Cobrar {formatBRL(order.total)} — imprimir turno
        </button>
      </div>
    </div>
  );
}

export function KioskPaidCard({ order }: { order: DbOrder & { ticketNumber?: number } }) {
  return (
    <div className="ff-data-card" style={{ borderLeft: '4px solid #059669', padding: 0, overflow: 'hidden' }}>
      <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, background: '#f0fdf4', borderBottom: '1px solid #bbf7d0' }}>
        <div style={{ width: 44, height: 44, borderRadius: 10, background: '#dcfce7', border: '1.5px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <i className="bi bi-check-circle-fill" style={{ fontSize: 20, color: '#059669' }} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1a1a1a' }}>{order.orderNumber}</div>
          <div style={{ fontSize: 12, color: '#6b7280', marginTop: 1 }}>{order.customerName}</div>
        </div>
        {order.ticketNumber && (
          <div style={{ textAlign: 'center', background: '#dcfce7', border: '1px solid #bbf7d0', borderRadius: 8, padding: '6px 14px' }}>
            <div style={{ fontSize: 10, color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>Turno</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: '#059669', lineHeight: 1 }}>{order.ticketNumber}</div>
          </div>
        )}
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 11, color: '#9ca3af' }}>Total</div>
          <div style={{ fontWeight: 900, fontSize: 18, color: '#059669' }}>{formatBRL(order.total)}</div>
        </div>
      </div>
      <div style={{ padding: '8px 16px' }}>
        {order.items.map((item, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', color: '#6b7280', borderBottom: i < order.items.length - 1 ? '1px solid #f9fafb' : 'none' }}>
            <span>{item.quantity}× {item.name}</span>
            <span>{formatBRL(item.unitPrice * item.quantity)}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '10px 16px', borderTop: '1px solid #bbf7d0', background: '#f0fdf4' }}>
        <button
          style={{ width: '100%', padding: '9px', border: '1.5px solid #bbf7d0', borderRadius: 9, background: '#fff', color: '#059669', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}
          onClick={() => printDemoTicket({
            restaurantName: getBrandName(),
            orderNumber: order.orderNumber,
            customerName: order.customerName,
            queueNumber: order.ticketNumber,
            items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })),
            itemCount: order.items.reduce((n, it) => n + it.quantity, 0),
            total: order.total,
            currency: 'BRL',
          })}
        >
          <i className="bi bi-printer" /> Reimprimir ticket
        </button>
      </div>
    </div>
  );
}
