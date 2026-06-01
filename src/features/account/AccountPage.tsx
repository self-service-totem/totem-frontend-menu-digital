import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Order } from '@/types';
import type { LoyaltyCard } from '@/lib/types';
import { orderService } from '@/services';
import { loyaltyService } from '@/lib/services/loyaltyService';
import { useSession } from '@/app/SessionContext';
import { STAMPS_PER_REWARD } from '@/lib/types';
import { TopBar } from '@/components/layout/TopBar';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { formatMoney } from '@/utils/format';

export function AccountPage() {
  const navigate = useNavigate();
  const { customer } = useSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loyaltyCard, setLoyaltyCard] = useState<LoyaltyCard | null>(null);

  useEffect(() => {
    orderService.listMyOrders(customer?.name).then(setOrders);
    if (customer?.phone) loyaltyService.getCard(customer.phone).then(setLoyaltyCard);
  }, [customer?.name, customer?.phone]);

  return (
    <div className="ff-page">
      <TopBar title="Minha conta" />

      <section className="ff-section">
        <div
          style={{
            background: '#fff',
            border: '1px solid var(--ff-border)',
            borderRadius: 'var(--ff-radius-md)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: '50%',
              background: 'var(--ff-primary-soft)',
              color: 'var(--ff-primary)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.4rem',
              fontWeight: 700,
              flex: '0 0 auto',
            }}
          >
            {(customer?.name ?? '?').charAt(0)}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>
              {customer?.name ?? '—'}
            </div>
            <div
              style={{
                color: 'var(--ff-text-muted)',
                fontSize: '0.85rem',
              }}
            >
              {customer?.phone ?? '—'}
            </div>
          </div>
        </div>
      </section>

      {/* F4: Loyalty stamp card */}
      {loyaltyCard && (
        <section className="ff-section">
          <div
            style={{
              background: 'linear-gradient(135deg, var(--ff-primary) 0%, #b91c1c 100%)',
              borderRadius: 'var(--ff-radius-lg)',
              padding: 16,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <div style={{ fontWeight: 700, fontSize: '1rem' }}>
                <i className="bi bi-star-fill me-1" />Cartão Fidelidade
              </div>
              <div style={{ fontSize: 13, opacity: 0.8 }}>
                {loyaltyCard.stamps}/{STAMPS_PER_REWARD} selos
              </div>
            </div>
            <div className="ff-stamp-grid">
              {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => (
                <div key={i} className={`ff-stamp ${i < loyaltyCard.stamps ? 'earned' : ''}`}>
                  {i < loyaltyCard.stamps ? '⭐' : '○'}
                </div>
              ))}
            </div>
            <div style={{ marginTop: 10, fontSize: 13, opacity: 0.9 }}>
              {loyaltyCard.stamps >= STAMPS_PER_REWARD
                ? '🎉 Parabéns! Você ganhou um desconto!'
                : `Faltam ${STAMPS_PER_REWARD - loyaltyCard.stamps} selos para seu próximo desconto.`}
            </div>
          </div>
        </section>
      )}

      <section className="ff-section">
        <h2 className="ff-section-title ff-section-title--lg">Histórico de pedidos</h2>
      </section>

      {orders.length === 0 ? (
        <div className="ff-empty">
          <i className="bi bi-receipt" />
          <p>Nenhum pedido ainda.</p>
        </div>
      ) : (
        orders.map((o) => (
          <article key={o.id} className="ff-row">
            <div>
              <div className="ff-row__main">Pedido {o.orderNumber}</div>
              <div className="ff-row__sub">
                {o.items.length} item(s) • {new Date(o.createdAt).toLocaleString('pt-BR')}
              </div>
            </div>
            <span style={{ fontWeight: 700 }}>{formatMoney(o.total)}</span>
          </article>
        ))
      )}

      <section className="ff-section" style={{ marginTop: 16 }}>
        <h2 className="ff-section-title">Ações</h2>
        <div className="ff-stack">
          <SecondaryButton onClick={() => navigate('/close-account')}>
            <i className="bi bi-receipt" /> Fechar conta
          </SecondaryButton>
          <SecondaryButton onClick={() => navigate('/cashback')}>
            <i className="bi bi-piggy-bank" /> Meu cashback
          </SecondaryButton>
        </div>
      </section>
    </div>
  );
}
