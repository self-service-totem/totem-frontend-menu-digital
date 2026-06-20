import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { findById } from '@/lib/mock-db/store';
import { getCollection } from '@/lib/mock-db/store';
import type { DbOrder, QueueTicket } from '@/lib/types';
import { formatCurrency as formatBRL } from '@/utils/format';
import { useLabels } from '@/i18n/I18nContext';
import type { LabelKey } from '@/i18n/labels';

const STATUS_KEY: Record<string, LabelKey> = {
  DRAFT:            'receipt.status.draft',
  CREATED:          'receipt.status.created',
  SENT_TO_KITCHEN:  'receipt.status.sentToKitchen',
  PREPARING:        'receipt.status.preparing',
  READY:            'receipt.status.ready',
  DELIVERED:        'receipt.status.delivered',
  CLOSED:           'receipt.status.closed',
  CANCELED:         'receipt.status.canceled',
};

const PAYMENT_KEY: Record<string, LabelKey> = {
  UNPAID:           'receipt.payment.unpaid',
  PARTIALLY_PAID:   'receipt.payment.partiallyPaid',
  PAID:             'receipt.payment.paid',
  REFUNDED:         'receipt.payment.refunded',
  CANCELED:         'receipt.payment.canceled',
};

const STATUS_COLOR: Record<string, string> = {
  DRAFT:            '#9ca3af',
  CREATED:          '#3b82f6',
  SENT_TO_KITCHEN:  '#f59e0b',
  PREPARING:        '#f59e0b',
  READY:            '#10b981',
  DELIVERED:        '#6d28d9',
  CLOSED:           '#6b7280',
  CANCELED:         '#ef4444',
};

export function KioskReceiptPage() {
  const { orderId } = useParams<{ orderId: string }>();
  const [order, setOrder] = useState<DbOrder | null>(null);
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);
  const [notFound, setNotFound] = useState(false);
  const { t } = useLabels();

  function loadData() {
    if (!orderId) { setNotFound(true); return; }
    const o = findById<DbOrder>('orders', orderId);
    if (!o) { setNotFound(true); return; }
    setOrder(o);
    const qt = getCollection<QueueTicket>('queueTickets').find((q) => q.orderId === orderId) ?? null;
    setQueueTicket(qt);
  }

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 4000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  if (notFound) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <i className="bi bi-exclamation-circle" style={{ fontSize: 48, color: '#9ca3af' }} />
          <p style={{ color: '#6b7280', marginTop: 12 }}>{t('receipt.notFound')}</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div style={styles.page}>
        <div style={styles.card}>
          <div className="spinner-border text-primary" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  const statusColor = STATUS_COLOR[order.status] ?? '#6b7280';
  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.restaurantName}>Pertinho do Céu</div>
          <div style={styles.orderNumber}>{order.orderNumber}</div>
        </div>

        {/* Status chips */}
        <div style={styles.chips}>
          <span style={{ ...styles.chip, ...(isPaid ? { background: '#d1fae5', color: '#065f46', borderColor: '#6ee7b7' } : { background: '#fef3c7', color: '#d97706', borderColor: '#fde68a' }) }}>
            <i className={`bi ${isPaid ? 'bi-check-circle-fill' : 'bi-hourglass-split'}`} style={{ fontSize: 12 }} />
            {t(PAYMENT_KEY[order.paymentStatus] ?? 'receipt.payment.unpaid')}
          </span>
          <span style={{ ...styles.chip, background: statusColor + '1a', color: statusColor, borderColor: statusColor + '44' }}>
            <i className="bi bi-circle-fill" style={{ fontSize: 8 }} />
            {t(STATUS_KEY[order.status] ?? 'receipt.status.created')}
          </span>
          {queueTicket && (
            <span style={{ ...styles.chip, background: '#ede9fe', color: '#5b21b6', borderColor: '#c4b5fd' }}>
              <i className="bi bi-hash" style={{ fontSize: 12 }} />
              {t('kiosk.confirm.queueLabel')} {queueTicket.ticketNumber}
            </span>
          )}
        </div>

        {/* Items */}
        <div style={styles.section}>
          <div style={styles.sectionTitle}>{t('receipt.order')}</div>
          {order.items.map((item, i) => (
            <div key={i} style={styles.itemRow}>
              <div style={styles.itemLeft}>
                <span style={styles.itemQty}>{item.quantity}×</span>
                <span style={styles.itemName}>{item.name}</span>
              </div>
              <span style={styles.itemPrice}>{formatBRL(item.unitPrice * item.quantity)}</span>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div style={styles.totalsBox}>
          <div style={styles.totalRow}>
            <span>{t('summary.subtotal')}</span>
            <span>{formatBRL(order.subtotal)}</span>
          </div>
          <div style={styles.totalRow}>
            <span>{t('kiosk.cart.serviceFee')}</span>
            <span>{formatBRL(order.serviceFee)}</span>
          </div>
          <div style={{ ...styles.totalRow, ...styles.totalFinal }}>
            <span>{t('summary.total')}</span>
            <span>{formatBRL(order.total)}</span>
          </div>
        </div>

        <div style={styles.footer}>
          <i className="bi bi-arrow-repeat" style={{ fontSize: 12, marginRight: 4 }} />
          {t('receipt.autoUpdate')}
        </div>
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: '100vh',
    background: '#f9fafb',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'center',
    padding: '24px 16px 48px',
    fontFamily: 'system-ui, -apple-system, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,.10)',
    padding: 24,
    width: '100%',
    maxWidth: 420,
    display: 'flex',
    flexDirection: 'column',
    gap: 0,
  },
  header: {
    textAlign: 'center',
    paddingBottom: 20,
    borderBottom: '1.5px solid #f3f4f6',
    marginBottom: 16,
  },
  restaurantName: {
    fontSize: 13,
    color: '#9ca3af',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '.06em',
    marginBottom: 6,
  },
  orderNumber: {
    fontSize: 36,
    fontWeight: 900,
    color: '#111827',
    letterSpacing: '-0.03em',
    lineHeight: 1,
  },
  chips: {
    display: 'flex',
    gap: 8,
    flexWrap: 'wrap',
    marginBottom: 20,
    justifyContent: 'center',
  },
  chip: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    padding: '5px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    border: '1px solid',
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: 700,
    color: '#9ca3af',
    textTransform: 'uppercase',
    letterSpacing: '.08em',
    marginBottom: 10,
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '7px 0',
    borderBottom: '1px solid #f9fafb',
  },
  itemLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
  },
  itemQty: {
    fontSize: 13,
    fontWeight: 800,
    color: '#6b7280',
    flexShrink: 0,
  },
  itemName: {
    fontSize: 14,
    color: '#111827',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  itemPrice: {
    fontSize: 14,
    fontWeight: 600,
    color: '#374151',
    flexShrink: 0,
    marginLeft: 12,
  },
  totalsBox: {
    background: '#f9fafb',
    borderRadius: 12,
    padding: '12px 16px',
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
    marginBottom: 20,
  },
  totalRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 14,
    color: '#6b7280',
  },
  totalFinal: {
    fontSize: 18,
    fontWeight: 900,
    color: '#111827',
    borderTop: '1.5px solid #e5e7eb',
    paddingTop: 8,
    marginTop: 4,
  },
  footer: {
    textAlign: 'center',
    fontSize: 11,
    color: '#d1d5db',
  },
};
