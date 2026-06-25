import { useLabels } from '@/i18n/I18nContext';
import { formatCurrency as formatBRL, formatDateTime } from '@/utils/format';
import { AdminModal } from '@/components/admin';
import type { PaymentMethod, Receipt } from '@/lib/types';

export function ReceiptModal({ receipt, onClose }: { receipt: Receipt; onClose: () => void }) {
  const { t } = useLabels();
  const methodLabel: Record<PaymentMethod, string> = {
    CASH: t('cashier.method.cash'),
    CARD: t('cashier.method.card'),
    PIX: t('cashier.method.pix'),
    EXTERNAL_TERMINAL: t('cashier.method.terminal'),
  };
  return (
    <AdminModal
      title={`${t('cashier.receipt.title')} ${receipt.number}`}
      onClose={onClose}
      footer={
        <>
          <button className="btn btn-outline-secondary flex-1" onClick={() => window.print()}>
            <i className="bi bi-printer me-1" />{t('cashier.receipt.print')}
          </button>
          <button className="btn btn-secondary" onClick={onClose}>{t('cashier.receipt.close')}</button>
        </>
      }
    >
      <div style={{ fontFamily: 'monospace', fontSize: 13 }}>
        <div style={{ textAlign: 'center', marginBottom: 12, fontSize: 12, color: '#9ca3af' }}>
          {formatDateTime(receipt.createdAt)}
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
          <span style={{ color: '#6b7280' }}>{t('cashier.receipt.subtotal')}</span><span>{formatBRL(receipt.subtotal)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}>
          <span style={{ color: '#6b7280' }}>{t('cashier.receipt.fee')}</span><span>{formatBRL(receipt.serviceFee)}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 800, fontSize: 16, borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 6 }}>
          <span>{t('cashier.receipt.total')}</span><span>{formatBRL(receipt.total)}</span>
        </div>
        <div style={{ marginTop: 10, color: '#6b7280', fontSize: 12 }}>
          <i className="bi bi-credit-card me-1" />{t('cashier.receipt.method')} {methodLabel[receipt.method]}
        </div>
      </div>
    </AdminModal>
  );
}
