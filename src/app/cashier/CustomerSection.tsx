import { useLabels } from '@/i18n/I18nContext';
import { format } from '@/i18n/labels';
import { formatCurrency as formatBRL } from '@/utils/format';
import type { CustomerGroup } from '@/lib/services/cashierService';
import './cashier.css';

interface CustomerSectionProps {
  customer: CustomerGroup;
  tableId: string;
  expanded: boolean;
  onToggle: () => void;
  onPayCustomer: () => void;
  onPayPartial: () => void;
}

export function CustomerSection({ customer, expanded, onToggle, onPayCustomer, onPayPartial }: CustomerSectionProps) {
  const { t } = useLabels();
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
                  <span className="ff-csh-qty-badge">{item.quantity}</span>
                  <span style={{ fontSize: 13, color: '#374151' }}>{item.name}</span>
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#1a1a1a' }}>{formatBRL(item.unitPrice * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div style={{ background: '#f9fafb', borderRadius: 10, padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
              <span>{t('cashier.customer.subtotal')}</span><span>{formatBRL(totalItems)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#6b7280' }}>
              <span>{t('cashier.customer.fee')}</span><span>{formatBRL(totalFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 700, color: '#1a1a1a', borderTop: '1px solid #e5e7eb', paddingTop: 6, marginTop: 4 }}>
              <span>{t('cashier.customer.total')}</span><span>{formatBRL(totalItems + totalFee)}</span>
            </div>
            {customer.totalPaid > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: '#059669', fontWeight: 600 }}>
                <span>{t('cashier.customer.paid')}</span><span>{formatBRL(customer.totalPaid)}</span>
              </div>
            )}
            {!customer.isPaid && (
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, fontWeight: 800, color: '#e11d2a', borderTop: '1px solid #fca5a5', paddingTop: 6, marginTop: 2 }}>
                <span>{t('cashier.customer.due')}</span><span>{formatBRL(customer.remaining)}</span>
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
                <i className="bi bi-person-check" />{format(t('cashier.customer.receive'), { amount: formatBRL(customer.remaining) })}
              </button>
              <button
                style={{ padding: '9px 14px', border: '1.5px solid #e5e7eb', borderRadius: 9, background: '#fff', color: '#374151', fontWeight: 600, fontSize: 13, cursor: 'pointer', whiteSpace: 'nowrap' }}
                onClick={(e) => { e.stopPropagation(); onPayPartial(); }}
              >
                {t('cashier.customer.partial')}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
