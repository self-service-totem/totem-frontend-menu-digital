import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/lib/types';
import type { LoyaltyCard } from '@/lib/types';
import { orderService } from '@/lib/services';
import { loyaltyService } from '@/lib/services/loyaltyService';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { STAMPS_PER_REWARD } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { OrderHistoryCard } from '@/components/account/OrderHistoryCard';

export function AccountPage() {
  const navigate = useNavigate();
  const { customer, menuContext } = useSession();
  const { t } = useLabels();
  const currency = menuContext?.currency ?? 'BRL';

  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    orderService
      .listMyOrders(customer?.name)
      .then(setOrders)
      .finally(() => setLoading(false));
    if (customer?.phone) loyaltyService.getCard(customer.phone).then(setLoyaltyCard);
  }, [customer?.name, customer?.phone]);

  return (
    <div className="ff-page">
      <TopBar title={t('account.title')} />

      {/* Profile card */}
      <section className="ff-section">
        <div className="ff-account-profile">
          <div className="ff-account-profile__avatar">
            {(customer?.name ?? '?').charAt(0).toUpperCase()}
          </div>
          <div className="ff-account-profile__info">
            <div className="ff-account-profile__name">{customer?.name ?? '—'}</div>
            <div className="ff-account-profile__phone">{customer?.phone ?? '—'}</div>
          </div>
        </div>
      </section>

      {/* Loyalty stamp card */}
      {loyaltyCard && (
        <section className="ff-section">
          <div className="ff-account-loyalty">
            <div className="ff-account-loyalty__head">
              <span className="ff-account-loyalty__title">
                <i className="bi bi-star-fill" aria-hidden /> {t('account.loyaltyTitle')}
              </span>
              <span className="ff-account-loyalty__count">
                {t('account.stamps', { current: loyaltyCard.stamps, total: STAMPS_PER_REWARD })}
              </span>
            </div>
            <div className="ff-stamp-grid">
              {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => (
                <div key={i} className={`ff-stamp ${i < loyaltyCard.stamps ? 'earned' : ''}`}>
                  {i < loyaltyCard.stamps ? '⭐' : '○'}
                </div>
              ))}
            </div>
            <div className="ff-account-loyalty__note">
              {loyaltyCard.stamps >= STAMPS_PER_REWARD
                ? t('account.rewardEarned')
                : t('account.stampsLeft', { n: STAMPS_PER_REWARD - loyaltyCard.stamps })}
            </div>
          </div>
        </section>
      )}

      {/* Order history */}
      <section className="ff-section">
        <h2 className="ff-section-title ff-section-title--lg">{t('account.ordersTitle')}</h2>
      </section>

      <div className="ff-account-orders">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="ff-order-card ff-order-card--skeleton">
              <div className="ff-skel ff-skel__pill ff-skel__pill--lg" />
              <div className="ff-skel ff-skel__pill ff-skel__pill--md" />
              <div className="ff-skel ff-skel__pill ff-skel__pill--sm" />
            </div>
          ))
        ) : orders.length === 0 ? (
          <div className="ff-empty">
            <i className="bi bi-receipt" />
            <p>{t('account.noOrders')}</p>
          </div>
        ) : (
          orders.map((o) => <OrderHistoryCard key={o.id} order={o} currency={currency} />)
        )}
      </div>

      {/* Quick actions */}
      <section className="ff-section" style={{ marginTop: 16 }}>
        <h2 className="ff-section-title">{t('account.actionsTitle')}</h2>
        <div className="ff-stack">
          <SecondaryButton onClick={() => navigate('/close-account')}>
            <i className="bi bi-receipt" /> {t('account.closeBill')}
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/cashback')}>
            <i className="bi bi-piggy-bank" /> {t('account.myCashback')}
          </SecondaryButton>
        </div>
      </section>
    </div>
  );
}
