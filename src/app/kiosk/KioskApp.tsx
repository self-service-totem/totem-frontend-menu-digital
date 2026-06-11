import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskService } from '@/lib/services/kioskService';
import { useNotify } from '@/lib/notifications';
import { useLabels } from '@/i18n/I18nContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import type { DbCategory, DbProduct, CartItem, QueueTicket, DbOrder } from '@/lib/types';
import type { LabelKey } from '@/i18n/labels';

const IDLE_TIMEOUT_MS = 60_000;
const IDLE_COUNTDOWN_S = 10;

/**
 * Idle handling for a kiosk session. After IDLE_TIMEOUT_MS of no interaction we
 * surface a "still there?" warning instead of resetting outright; the warning
 * runs its own countdown (see KioskIdleModal) before returning to the start.
 * Returns the warning flag plus handlers the page wires into the modal.
 */
function useKioskIdleTimeout(enabled = true) {
  const navigate = useNavigate();
  const [warning, setWarning] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const goHome = useCallback(() => navigate('/kiosk/start'), [navigate]);

  const armIdle = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setWarning(true), IDLE_TIMEOUT_MS);
  }, []);

  const dismiss = useCallback(() => {
    setWarning(false);
    armIdle();
  }, [armIdle]);

  useEffect(() => {
    if (!enabled) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    // While the warning is up we stop auto-resetting — the user must confirm
    const onActivity = () => { if (!warning) armIdle(); };
    events.forEach((e) => window.addEventListener(e, onActivity, { passive: true }));
    if (!warning) armIdle();
    return () => {
      events.forEach((e) => window.removeEventListener(e, onActivity));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, warning, armIdle]);

  return { warning, dismiss, goHome };
}

// "Still there?" overlay shown before an idle reset. Owns its own countdown.
function KioskIdleModal({ onContinue, onRestart }: { onContinue: () => void; onRestart: () => void }) {
  const { t } = useLabels();
  const [count, setCount] = useState(IDLE_COUNTDOWN_S);

  useEffect(() => {
    if (count <= 0) { onRestart(); return; }
    const id = setTimeout(() => setCount((c) => c - 1), 1000);
    return () => clearTimeout(id);
  }, [count, onRestart]);

  return (
    <div className="ff-kiosk-idle-overlay" onClick={onContinue} role="alertdialog" aria-modal="true">
      <div className="ff-kiosk-idle-card" onClick={(e) => e.stopPropagation()}>
        <i className="bi bi-clock-history ff-kiosk-idle-icon" />
        <div className="ff-kiosk-idle-title">{t('kiosk.idle.title')}</div>
        <div className="ff-kiosk-idle-subtitle">{t('kiosk.idle.subtitle', { s: count })}</div>
        <div className="ff-kiosk-idle-actions">
          <button className="ff-kiosk-idle-restart" onClick={onRestart}>
            {t('kiosk.idle.restart')}
          </button>
          <button className="ff-kiosk-idle-continue" onClick={onContinue}>
            {t('kiosk.idle.continue')}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Accessibility toggle. Flips a class on <html> so the CSS can drop the whole
 * kiosk UI into the lower, wheelchair-reachable half of the screen. State is
 * self-contained and persisted in sessionStorage so it survives navigation.
 */
function KioskA11yToggle() {
  const { t } = useLabels();
  const [on, setOn] = useState(() => sessionStorage.getItem('ff_kiosk_a11y') === '1');

  useEffect(() => {
    document.documentElement.classList.toggle('ff-kiosk-a11y', on);
    sessionStorage.setItem('ff_kiosk_a11y', on ? '1' : '0');
  }, [on]);

  return (
    <button
      className={`ff-kiosk-a11y-btn${on ? ' active' : ''}`}
      onClick={() => setOn((v) => !v)}
      aria-pressed={on}
      aria-label={t('kiosk.a11y.label')}
      title={t('kiosk.a11y.label')}
    >
      <i className="bi bi-universal-access" />
    </button>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function getCategoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('cafe') || n.includes('coffee') || n.includes('expresso')) return 'bi-cup-hot';
  if (n.includes('bebida') || n.includes('drink') || n.includes('suco') || n.includes('juice') || n.includes('agua') || n.includes('refri')) return 'bi-cup-straw';
  if (n.includes('sobremesa') || n.includes('dessert') || n.includes('doce') || n.includes('sorvete')) return 'bi-cake2';
  if (n.includes('entrada') || n.includes('starter') || n.includes('aperitivo') || n.includes('porcao') || n.includes('porcão')) return 'bi-egg-fried';
  if (n.includes('pizza')) return 'bi-slash-circle';
  if (n.includes('burger') || n.includes('hamburguer') || n.includes('sandwich') || n.includes('lanche')) return 'bi-stack';
  if (n.includes('salada') || n.includes('salad') || n.includes('vegano') || n.includes('vegeta')) return 'bi-leaf';
  if (n.includes('carne') || n.includes('meat') || n.includes('churrasco') || n.includes('grelhado')) return 'bi-fire';
  if (n.includes('prato') || n.includes('principal') || n.includes('main') || n.includes('almoco') || n.includes('jantar')) return 'bi-circle';
  if (n.includes('sopa') || n.includes('caldo')) return 'bi-cup';
  if (n.includes('massa') || n.includes('pasta') || n.includes('macarrao')) return 'bi-tornado';
  if (n.includes('pao') || n.includes('padaria') || n.includes('bakery')) return 'bi-box';
  return 'bi-tag';
}

// ─── Progress stepper ─────────────────────────────────────────────────────────

const STEP_KEYS: LabelKey[] = ['kiosk.steps.menu', 'kiosk.steps.review', 'kiosk.steps.payment', 'kiosk.steps.done'];

function KioskSteps({ current, allDone = false }: { current: 1 | 2 | 3 | 4; allDone?: boolean }) {
  const { t } = useLabels();
  return (
    <div className="ff-kiosk-steps">
      {STEP_KEYS.map((key, i) => {
        const label = t(key);
        const n = i + 1;
        const state = allDone ? 'done' : current === n ? 'active' : current > n ? 'done' : '';
        const showCheck = allDone || current > n;
        return (
          <React.Fragment key={n}>
            <div className={`ff-kiosk-step${state ? ` ${state}` : ''}`}>
              <div className="ff-kiosk-step-dot">
                {showCheck ? <i className="bi bi-check" /> : n}
              </div>
              <span className="ff-kiosk-step-label">{label}</span>
            </div>
            {i < STEP_KEYS.length - 1 && (
              <div className={`ff-kiosk-step-line${allDone || current > n ? ' done' : ''}`} />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ─── Welcome ──────────────────────────────────────────────────────────────────

export function KioskWelcomePage() {
  const navigate = useNavigate();
  const { t } = useLabels();

  // Fresh session: drop any cart left behind by an abandoned/timed-out order
  useEffect(() => {
    sessionStorage.removeItem('ff_kiosk_cart');
    sessionStorage.removeItem('ff_kiosk_service');
  }, []);

  // Future: replace with branch.heroImageUrl from admin config
  const heroImageUrl: string | null = null;

  return (
    <div className="ff-kiosk-layout ff-kiosk-welcome-layout">
      {/* Header — brand name + accessibility toggle */}
      <div className="ff-kiosk-welcome-header">
        <div style={{ width: 56 }} />
        <span className="ff-kiosk-welcome-brand">Pertinho do Céu</span>
        <KioskA11yToggle />
      </div>

      {/* Language selector — prominent bar below header */}
      <div className="ff-kiosk-welcome-lang-bar">
        <LanguageSelector variant="pills" className="ff-kiosk-welcome-lang-pills" />
      </div>

      {/* Body — hero + service buttons */}
      <div className="ff-kiosk-welcome-body">
        <div className="ff-kiosk-welcome-hero">
          {heroImageUrl ? (
            <img src={heroImageUrl} alt="Restaurant" className="ff-kiosk-welcome-hero-img" />
          ) : (
            <div className="ff-kiosk-welcome-badge">
              <i className="bi bi-cup-hot-fill" />
            </div>
          )}
          <div className="ff-kiosk-welcome-title">{t('kiosk.welcome.title')}</div>
          <div className="ff-kiosk-welcome-subtitle">{t('kiosk.welcome.subtitle')}</div>
        </div>

        <div className="ff-kiosk-service-options">
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=EAT_IN')}
          >
            <i className="bi bi-door-open" />
            <span>{t('kiosk.welcome.eatIn')}</span>
          </button>
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=TAKEAWAY')}
          >
            <i className="bi bi-bag" />
            <span>{t('kiosk.welcome.takeaway')}</span>
          </button>
        </div>
      </div>

    </div>
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function useKioskMenu() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts]     = useState<DbProduct[]>([]);
  const [activeCat, setActiveCat]   = useState<string | null>(null);
  const [loaded, setLoaded]         = useState(false);

  async function load() {
    const [cats, prods] = await Promise.all([
      kioskService.listCategories(),
      kioskService.listProducts(),
    ]);
    setCategories(cats);
    setProducts(prods);
    setLoaded(true);
  }

  return { categories, products, activeCat, setActiveCat, loaded, load };
}

export function KioskMenuPage() {
  const { categories, products, activeCat, setActiveCat, loaded, load } = useKioskMenu();
  // Hydrate from sessionStorage so "add more" from the cart keeps the order
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  });
  const navigate = useNavigate();
  const { t } = useLabels();
  const { warning, dismiss, goHome } = useKioskIdleTimeout();
  // Transient "added" confirmation toast (product name + a bump key for animation)
  const [toast, setToast] = useState<{ name: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const displayed = activeCat
    ? products.filter((p) => p.categoryId === activeCat)
    : products;

  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartTax      = +(cartSubtotal * 0.1).toFixed(2);
  const cartTotal    = +(cartSubtotal + cartTax).toFixed(2);

  const serviceParam = new URLSearchParams(window.location.search).get('service') ?? 'EAT_IN';
  const serviceLabel = serviceParam === 'EAT_IN' ? t('kiosk.welcome.eatIn') : t('kiosk.welcome.takeaway');

  function addToCart(prod: DbProduct) {
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === prod.id);
      if (ex) return prev.map((i) => i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        id: prod.id,
        productId: prod.id,
        name: prod.name,
        imageUrl: prod.imageUrl,
        unitPrice: prod.price,
        quantity: 1,
      }];
    });
    // Flash a confirmation so the tap registers without leaving the grid
    setToast({ name: prod.name, key: Date.now() });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 1600);
  }

  function toCart() {
    sessionStorage.setItem('ff_kiosk_cart', JSON.stringify(cart));
    sessionStorage.setItem('ff_kiosk_service', serviceParam);
    navigate('/kiosk/cart');
  }

  if (!loaded) return (
    <div className="ff-kiosk-layout ff-kiosk-loading">
      <div className="spinner-border text-primary" style={{ width: 56, height: 56 }} />
    </div>
  );

  return (
    <div className="ff-kiosk-layout">
      {/* Topbar */}
      <div className="ff-kiosk-topbar">
        <button className="ff-kiosk-topbar-back" onClick={() => navigate('/kiosk/start')}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">Pertinho do Céu</span>
        <div className="ff-kiosk-topbar-actions">
          <KioskA11yToggle />
          <LanguageSelector variant="pills" showLabels={false} className="ff-kiosk-topbar-lang-pills" />
        </div>
      </div>

      {/* Step 1 */}
      <KioskSteps current={1} />

      {/* Body — vertical category rail + product grid */}
      <div className="ff-kiosk-menu-body">
        {/* Vertical category rail */}
        <nav className="ff-kiosk-cat-rail" aria-label={t('kiosk.menu.categories')}>
          <div className="ff-kiosk-cat-rail-title">{t('kiosk.menu.categories')}</div>
          <button
            className={`ff-kiosk-cat-tile${!activeCat ? ' active' : ''}`}
            onClick={() => setActiveCat(null)}
          >
            <i className="bi bi-grid-fill" />
            <span>{t('kiosk.menu.all')}</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`ff-kiosk-cat-tile${activeCat === c.id ? ' active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              <i className={`bi ${getCategoryIcon(c.name)}`} />
              <span>{c.name}</span>
            </button>
          ))}
        </nav>

        {/* Scrollable product grid */}
        <div className="ff-kiosk-product-area">
          {displayed.length === 0 ? (
            <div className="ff-kiosk-empty">
              <i className="bi bi-inbox" />
              <span>{t('kiosk.menu.emptyCategory')}</span>
            </div>
          ) : (
            <div className="ff-kiosk-grid">
              {displayed.map((prod) => {
                const inCart = cart.find((i) => i.productId === prod.id);
                return (
                  <div key={prod.id} className="ff-kiosk-card" onClick={() => addToCart(prod)}>
                    <div className="ff-kiosk-card-image-wrap">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="ff-kiosk-card-image"
                        loading="lazy"
                      />
                      {inCart && (
                        <div className="ff-kiosk-card-badge">{inCart.quantity}</div>
                      )}
                    </div>
                    <div className="ff-kiosk-card-body">
                      <div className="ff-kiosk-card-name">{prod.name}</div>
                      {prod.description && (
                        <div className="ff-kiosk-card-desc">{prod.description}</div>
                      )}
                      <div className="ff-kiosk-card-price">{formatBRL(prod.price)}</div>
                    </div>
                    <button className="ff-kiosk-card-add-btn" tabIndex={-1} aria-hidden>
                      <i className="bi bi-plus-lg" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* "Added" confirmation toast */}
      {toast && (
        <div className="ff-kiosk-add-toast" key={toast.key}>
          <i className="bi bi-check-circle-fill" />
          <span><strong>{toast.name}</strong> · {t('kiosk.menu.added')}</span>
        </div>
      )}

      {/* Persistent MY ORDER bar — always visible */}
      <div className="ff-kiosk-order-bar">
        {cartCount > 0 && (
          <div className="ff-kiosk-order-bar-meta">
            <span className="ff-kiosk-order-bar-label">
              {t('kiosk.order.label')} — {serviceLabel}
            </span>
            <div className="ff-kiosk-order-bar-figures">
              <span className="ff-kiosk-order-bar-tax">{t('kiosk.order.tax')} {formatBRL(cartTax)}</span>
              <span className="ff-kiosk-order-bar-total">{t('summary.total')} {formatBRL(cartTotal)}</span>
            </div>
          </div>
        )}
        <div className="ff-kiosk-order-bar-actions">
          {cartCount > 0 ? (
            <span className="ff-kiosk-order-bar-count">
              <i className="bi bi-bag-fill" />
              {cartCount} {cartCount === 1 ? t('kiosk.order.item') : t('kiosk.order.items')}
            </span>
          ) : (
            <span className="ff-kiosk-order-bar-empty">
              {t('kiosk.order.emptyHint')}
            </span>
          )}
          <button
            className="ff-kiosk-checkout-btn"
            onClick={toCart}
            disabled={cartCount === 0}
          >
            {t('kiosk.order.review')} <i className="bi bi-arrow-right" />
          </button>
        </div>
      </div>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}

// ─── Cart / Review ────────────────────────────────────────────────────────────

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
    setCart((prev) =>
      qty <= 0
        ? prev.filter((i) => i.productId !== productId)
        : prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i),
    );
  }

  const subtotal   = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const serviceFee = +(subtotal * 0.1).toFixed(2);
  const total      = +(subtotal + serviceFee).toFixed(2);

  function proceed() {
    sessionStorage.setItem('ff_kiosk_cart', JSON.stringify(cart));
    sessionStorage.setItem('ff_kiosk_service', serviceType);
    navigate('/kiosk/payment');
  }

  return (
    <div className="ff-kiosk-layout">
      {/* Topbar */}
      <div className="ff-kiosk-topbar">
        <button className="ff-kiosk-topbar-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">{t('kiosk.cart.title')}</span>
        <div className="ff-kiosk-topbar-actions">
          <KioskA11yToggle />
          <LanguageSelector variant="pills" showLabels={false} className="ff-kiosk-topbar-lang-pills" />
        </div>
      </div>

      {/* Step 2 */}
      <KioskSteps current={2} />

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
          <div className="ff-kiosk-empty" style={{ padding: '80px 20px' }}>
            <i className="bi bi-cart-x" />
            <span>{t('kiosk.cart.empty')}</span>
          </div>
        ) : cart.map((item) => (
          <div key={item.productId} className="ff-kiosk-cart-row-v2">
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
            <div className="ff-kiosk-qty-group">
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
        ))}
      </div>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="ff-kiosk-cart-summary">
          <div className="ff-kiosk-summary-row">
            <span>{t('summary.subtotal')}</span><span>{formatBRL(subtotal)}</span>
          </div>
          <div className="ff-kiosk-summary-row">
            <span>{t('kiosk.cart.serviceFee')}</span><span>{formatBRL(serviceFee)}</span>
          </div>
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

// ─── Confirmation ─────────────────────────────────────────────────────────────

function KioskConfirmationScreen({
  order,
  queueTicket,
  onReset,
}: {
  order: DbOrder;
  queueTicket: QueueTicket;
  onReset: () => void;
}) {
  const [countdown, setCountdown] = useState(15);
  const { t } = useLabels();

  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReset]);

  return (
    <div className="ff-kiosk-layout ff-kiosk-confirm-layout">
      {/* Step 4 done — no red topbar on confirmation */}
      <KioskSteps current={4} allDone />

      <div className="ff-kiosk-confirm-body">
        <div className="ff-kiosk-confirm-icon">
          <i className="bi bi-check-circle-fill" />
        </div>
        <div className="ff-kiosk-confirm-title">{t('kiosk.confirm.title')}</div>
        <div className="ff-kiosk-confirm-subtitle">
          {t('kiosk.confirm.subtitle')}
        </div>

        <div className="ff-kiosk-ticket-box">
          <div className="ff-kiosk-ticket-label">{t('kiosk.confirm.ticketLabel')}</div>
          <div className="ff-kiosk-ticket-number">{queueTicket.ticketNumber}</div>
          <div className="ff-kiosk-ticket-order">{order.orderNumber}</div>
        </div>

        <div className="ff-kiosk-confirm-hint">
          {t('kiosk.confirm.hint')}
        </div>
      </div>

      <div className="ff-kiosk-confirm-bottom">
        <span className="ff-kiosk-countdown">{t('kiosk.confirm.restarting', { s: countdown })}</span>
        <button className="ff-kiosk-checkout-btn" onClick={onReset}>
          {t('kiosk.confirm.newOrder')}
        </button>
      </div>
    </div>
  );
}

// ─── Payment ──────────────────────────────────────────────────────────────────

type PaymentStep = 'select' | 'processing' | 'result';

const PAYMENT_METHODS: { id: 'CARD' | 'PIX' | 'CASH'; icon: string; labelKey: LabelKey; descKey: LabelKey }[] = [
  { id: 'CARD', icon: 'bi-credit-card-2-front', labelKey: 'kiosk.payment.card', descKey: 'kiosk.payment.cardDesc' },
  { id: 'PIX',  icon: 'bi-qr-code-scan',        labelKey: 'kiosk.payment.pix',  descKey: 'kiosk.payment.pixDesc' },
  { id: 'CASH', icon: 'bi-cash-stack',          labelKey: 'kiosk.payment.cash', descKey: 'kiosk.payment.cashDesc' },
];

export function KioskPaymentPage() {
  const [step, setStep]             = useState<PaymentStep>('select');
  const [method, setMethod]         = useState<'CARD' | 'PIX' | 'CASH'>('CARD');
  const [result, setResult]         = useState<'approved' | 'rejected' | null>(null);
  const [order, setOrder]           = useState<DbOrder | null>(null);
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);
  const notify   = useNotify();
  const navigate = useNavigate();
  const { t } = useLabels();
  // Reset abandoned sessions while choosing a method or after a rejection,
  // but never mid-payment (approved flow has its own countdown)
  const { warning, dismiss, goHome } = useKioskIdleTimeout(
    step === 'select' || (step === 'result' && result === 'rejected'),
  );

  const cart: CartItem[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  })();
  const serviceType = (sessionStorage.getItem('ff_kiosk_service') ?? 'EAT_IN') as 'EAT_IN' | 'TAKEAWAY';
  const subtotal    = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total       = +(subtotal * 1.1).toFixed(2);

  async function simulatePay() {
    setStep('processing');
    await new Promise((r) => setTimeout(r, 2000));

    const approved = Math.random() > 0.1;
    if (approved) {
      const { order: o, queueTicket: qt } = await kioskService.placeOrder('Cliente Totem', cart, serviceType);
      setOrder(o);
      setQueueTicket(qt);
      setResult('approved');
      notify(t('kiosk.payment.approved'));
    } else {
      setResult('rejected');
    }
    setStep('result');
  }

  if (step === 'processing') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div className="spinner-border text-primary" style={{ width: 64, height: 64 }} />
        <div className="ff-kiosk-processing-text">{t('kiosk.payment.processing')}</div>
      </div>
    );
  }

  if (step === 'result' && result === 'approved' && order && queueTicket) {
    return (
      <KioskConfirmationScreen
        order={order}
        queueTicket={queueTicket}
        onReset={() => {
          sessionStorage.removeItem('ff_kiosk_cart');
          sessionStorage.removeItem('ff_kiosk_service');
          navigate('/kiosk/start');
        }}
      />
    );
  }

  if (step === 'result' && result === 'rejected') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 80, color: 'var(--ff-primary)', marginBottom: 20, lineHeight: 1 }}>✕</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginBottom: 12 }}>{t('kiosk.payment.rejected')}</div>
          <div style={{ color: '#6b7280', marginBottom: 36, fontSize: 18 }}>
            {t('kiosk.payment.rejectedDesc')}
          </div>
          <button className="ff-kiosk-checkout-btn" onClick={() => setStep('select')}>
            {t('kiosk.payment.retry')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-topbar">
        <button className="ff-kiosk-topbar-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">{t('kiosk.payment.title')}</span>
        <div className="ff-kiosk-topbar-actions">
          <KioskA11yToggle />
          <LanguageSelector variant="pills" showLabels={false} className="ff-kiosk-topbar-lang-pills" />
        </div>
      </div>

      {/* Step 3 */}
      <KioskSteps current={3} />

      <div className="ff-kiosk-payment-body">
        <div className="ff-kiosk-payment-total-box">
          <div className="ff-kiosk-payment-total-label">{t('kiosk.payment.totalLabel')}</div>
          <div className="ff-kiosk-payment-total-amount">{formatBRL(total)}</div>
        </div>

        <div className="ff-kiosk-payment-label">{t('kiosk.payment.how')}</div>

        <div className="ff-kiosk-payment-options">
          {PAYMENT_METHODS.map(({ id, icon, labelKey, descKey }) => (
            <button
              key={id}
              className={`ff-kiosk-payment-option${method === id ? ' selected' : ''}`}
              onClick={() => setMethod(id)}
            >
              <i className={`bi ${icon} ff-kiosk-payment-option-icon`} />
              <div className="ff-kiosk-payment-option-text">
                <div className="ff-kiosk-payment-option-label">{t(labelKey)}</div>
                <div className="ff-kiosk-payment-option-desc">{t(descKey)}</div>
              </div>
              {method === id && (
                <i className="bi bi-check-circle-fill ff-kiosk-payment-check" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="ff-kiosk-cart-bottom" style={{ justifyContent: 'flex-end' }}>
        <button
          className="ff-kiosk-pay-btn"
          onClick={simulatePay}
          style={{ maxWidth: 360 }}
        >
          {t('kiosk.payment.confirm')} <i className="bi bi-arrow-right" />
        </button>
      </div>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}
