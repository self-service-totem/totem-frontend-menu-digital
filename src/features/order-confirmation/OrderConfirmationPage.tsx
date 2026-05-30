import { useLocation, useNavigate } from 'react-router-dom';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { formatMoney } from '@/utils/format';

interface ConfirmationState {
  orderNumber: string;
  total: number;
  customerName: string;
  itemCount: number;
}

export function OrderConfirmationPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { tableId, menuContext } = useSession();
  const { t } = useLabels();

  const state = location.state as ConfirmationState | null;

  function goToMenu() {
    navigate(tableId ? `/menu/${tableId}` : '/menu');
  }

  // If landed here without state (e.g. direct URL access), redirect to menu
  if (!state) {
    goToMenu();
    return null;
  }

  const { orderNumber, total, customerName, itemCount } = state;

  return (
    <div className="ff-page" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '0 24px', gap: 24, textAlign: 'center' }}>
      {/* Success icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: 'var(--ff-primary-soft)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <i className="bi bi-check-lg" style={{ fontSize: 40, color: 'var(--ff-primary)' }} />
      </div>

      {/* Heading */}
      <div>
        <h1 style={{ fontSize: '1.4rem', fontWeight: 700, margin: '0 0 8px' }}>
          {t('confirmation.title')}
        </h1>
        <p style={{ margin: 0, color: 'var(--ff-text-muted)', fontSize: '0.95rem' }}>
          {t('confirmation.subtitle')}
        </p>
      </div>

      {/* Order card */}
      <div
        style={{
          width: '100%',
          maxWidth: 320,
          background: '#fff',
          border: '1px solid var(--ff-border)',
          borderRadius: 'var(--ff-radius-lg)',
          padding: '20px 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        {/* Order number — large, easy to remember */}
        <div>
          <div style={{ fontSize: 12, color: 'var(--ff-text-muted)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.05em', marginBottom: 4 }}>
            {t('confirmation.orderNumber')}
          </div>
          <div style={{ fontSize: 36, fontWeight: 900, color: 'var(--ff-primary)', letterSpacing: '.02em' }}>
            {orderNumber}
          </div>
        </div>

        <hr style={{ margin: 0, borderColor: 'var(--ff-border)' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--ff-text-muted)' }}>{t('confirmation.customer')}</span>
            <span style={{ fontWeight: 600 }}>{customerName}</span>
          </div>
          {menuContext?.tableName && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
              <span style={{ color: 'var(--ff-text-muted)' }}>{t('confirmation.table')}</span>
              <span style={{ fontWeight: 600 }}>{menuContext.tableName}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
            <span style={{ color: 'var(--ff-text-muted)' }}>{t('confirmation.items')}</span>
            <span style={{ fontWeight: 600 }}>{itemCount}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 700, borderTop: '1px solid var(--ff-border)', paddingTop: 8, marginTop: 2 }}>
            <span>Total</span>
            <span>{formatMoney(total)}</span>
          </div>
        </div>
      </div>

      {/* Note */}
      <p style={{ margin: 0, color: 'var(--ff-text-muted)', fontSize: '0.88rem', maxWidth: 280 }}>
        {t('confirmation.note')}
      </p>

      {/* CTA */}
      <div style={{ width: '100%', maxWidth: 320 }}>
        <PrimaryButton onClick={goToMenu}>
          {t('confirmation.backToMenu')}
        </PrimaryButton>
      </div>
    </div>
  );
}
