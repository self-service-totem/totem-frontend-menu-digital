import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLabels } from '@/i18n/I18nContext';
import type { CartItem } from '@/lib/types';
import { formatCurrency as formatBRL } from '@/utils/format';
import { useKioskIdleTimeout, KioskIdleModal, KioskSteps } from './kioskShared';

export function KioskCartPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  });
  const [serviceType, setServiceType] = useState<'EAT_IN' | 'TAKEAWAY'>(
    () => (sessionStorage.getItem('ff_kiosk_service') ?? 'EAT_IN') as 'EAT_IN' | 'TAKEAWAY',
  );
  const navigate = useNavigate();
  const { t } = useLabels();
  const { warning, dismiss, goHome } = useKioskIdleTimeout();

  function setQty(productId: string, qty: number) {
    setCart((prev) => {
      const next = qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i);
      sessionStorage.setItem('ff_kiosk_cart', JSON.stringify(next));
      return next;
    });
  }

  const total = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

  function proceed() {
    sessionStorage.setItem('ff_kiosk_cart', JSON.stringify(cart));
    sessionStorage.setItem('ff_kiosk_service', serviceType);
    navigate('/kiosk/payment');
  }

  return (
    <div className="ff-kiosk-layout">
      {/* Compact ordering nav */}
      <div className="ff-kiosk-ordernav">
        <button className="ff-kiosk-ordernav-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <KioskSteps current={2} compact />
      </div>

      {/* Service toggle */}
      <div className="ff-kiosk-service-toggle-wrap">
        <button
          className={`ff-kiosk-toggle-btn${serviceType === 'TAKEAWAY' ? ' active' : ''}`}
          onClick={() => setServiceType('TAKEAWAY')}
        >
          <i className="bi bi-bag" /> {t('kiosk.welcome.takeaway')}
        </button>
        <button
          className={`ff-kiosk-toggle-btn${serviceType === 'EAT_IN' ? ' active' : ''}`}
          onClick={() => setServiceType('EAT_IN')}
        >
          <i className="bi bi-door-open" /> {t('kiosk.welcome.eatIn')}
        </button>
      </div>

      {/* Items */}
      <div className="ff-kiosk-cart-scroll">
        {cart.length === 0 ? (
          <div className="ff-kiosk-empty ff-kiosk-empty--pad">
            <i className="bi bi-cart-x" />
            <span>{t('kiosk.cart.empty')}</span>
          </div>
        ) : (
          <>
            <div className="ff-kiosk-cart-review-header">
              <div className="ff-kiosk-cart-review-title">{t('kiosk.cart.title')}</div>
              <div className="ff-kiosk-cart-review-subtitle">{t('kiosk.cart.reviewSubtitle')}</div>
            </div>
            {cart.map((item) => (
              <div key={item.productId} className="ff-kiosk-cart-card">
                <div className="ff-kiosk-cart-row-v2">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="ff-kiosk-cart-row-img"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                  <div className="ff-kiosk-cart-row-info">
                    <div className="ff-kiosk-cart-row-name">{item.name}</div>
                    <div className="ff-kiosk-cart-row-price">{formatBRL(item.unitPrice)}</div>
                    <button
                      className="ff-kiosk-cart-delete-btn"
                      onClick={() => setQty(item.productId, 0)}
                    >
                      <i className="bi bi-trash3" /> {t('kiosk.cart.remove')}
                    </button>
                  </div>
                  <div className="ff-kiosk-qty-pill">
                    <button
                      className="ff-kiosk-qty-btn"
                      onClick={() => setQty(item.productId, item.quantity - 1)}
                    >−</button>
                    <span className="ff-kiosk-qty-val">{item.quantity}</span>
                    <button
                      className="ff-kiosk-qty-btn"
                      onClick={() => setQty(item.productId, item.quantity + 1)}
                    >+</button>
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="ff-kiosk-cart-summary">
          <div className="ff-kiosk-summary-row ff-kiosk-summary-total">
            <span>{t('summary.total')}</span><span>{formatBRL(total)}</span>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="ff-kiosk-cart-bottom">
        <button className="ff-kiosk-add-more-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" /> {t('kiosk.cart.addMore')}
        </button>
        <button
          className="ff-kiosk-pay-btn"
          onClick={proceed}
          disabled={cart.length === 0}
        >
          {cart.length > 0 ? `${t('kiosk.cart.confirmPay')} ${formatBRL(total)}` : t('kiosk.cart.confirmPay')}
        </button>
      </div>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}
