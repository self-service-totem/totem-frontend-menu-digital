import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskService } from '@/lib/services/kioskService';
import { useNotify } from '@/lib/notifications';
import { useSession } from '@/app/SessionContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import type { DbCategory, DbProduct, CartItem, QueueTicket, DbOrder } from '@/lib/types';

const IDLE_TIMEOUT_MS = 60_000;

function useKioskIdleTimeout(enabled = true) {
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const reset = useCallback(() => {
    if (!enabled) return;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      navigate('/kiosk/start');
    }, IDLE_TIMEOUT_MS);
  }, [enabled, navigate]);

  useEffect(() => {
    if (!enabled) return;
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach((e) => window.addEventListener(e, reset, { passive: true }));
    reset();
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, reset]);
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Welcome ─────────────────────────────────────────────────────────────────

const KIOSK_WELCOME: Record<string, { title: string; subtitle: string; eatIn: string; takeaway: string }> = {
  'pt-BR': { title: 'Bem-vindo!', subtitle: 'Como você deseja pedir?', eatIn: 'Comer aqui', takeaway: 'Para levar' },
  es:      { title: '¡Bienvenido!', subtitle: '¿Cómo querés pedir?', eatIn: 'Comer acá', takeaway: 'Para llevar' },
  en:      { title: 'Welcome!', subtitle: 'How would you like to order?', eatIn: 'Dine in', takeaway: 'Take away' },
};

export function KioskWelcomePage() {
  const navigate = useNavigate();
  const { language } = useSession();
  useKioskIdleTimeout();

  const lang = (language ?? 'pt-BR') as string;
  const copy = KIOSK_WELCOME[lang] ?? KIOSK_WELCOME['pt-BR'];

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-welcome-header">
        <span className="ff-kiosk-welcome-brand">Pertinho do Céu</span>
        <LanguageSelector variant="pills" className="ff-kiosk-lang-pills" />
      </div>

      <div className="ff-kiosk-welcome-body">
        <div style={{ textAlign: 'center' }}>
          <div className="ff-kiosk-welcome-emoji">🍽</div>
          <div className="ff-kiosk-welcome-title">{copy.title}</div>
          <div className="ff-kiosk-welcome-subtitle">{copy.subtitle}</div>
        </div>

        <div className="ff-kiosk-service-options">
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=EAT_IN')}
          >
            <i className="bi bi-door-open" />
            <span>{copy.eatIn}</span>
          </button>
          <button
            className="ff-kiosk-service-btn"
            onClick={() => navigate('/kiosk/menu?service=TAKEAWAY')}
          >
            <i className="bi bi-bag" />
            <span>{copy.takeaway}</span>
          </button>
        </div>
      </div>

      <div className="ff-kiosk-welcome-footer">
        <button
          className="ff-kiosk-admin-btn"
          onClick={() => navigate('/')}
          title="Acesso administrativo"
        >
          <i className="bi bi-gear" />
        </button>
      </div>
    </div>
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function useKioskMenu() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [activeCat, setActiveCat] = useState<string | null>(null);
  const [loaded, setLoaded] = useState(false);

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
  const [cart, setCart] = useState<CartItem[]>([]);
  const navigate = useNavigate();
  useKioskIdleTimeout();

  useEffect(() => { load(); }, []);

  const displayed = activeCat ? products.filter((p) => p.categoryId === activeCat) : products;
  const cartCount = cart.reduce((s, i) => s + i.quantity, 0);
  const cartTotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const serviceParam = new URLSearchParams(window.location.search).get('service') ?? 'EAT_IN';

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
      {/* Top bar */}
      <div className="ff-kiosk-topbar">
        <button className="ff-kiosk-topbar-back" onClick={() => navigate('/kiosk/start')}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">Pertinho do Céu</span>
        <div style={{ width: 52 }} />
      </div>

      {/* Sidebar + grid */}
      <div className="ff-kiosk-body">
        <nav className="ff-kiosk-sidebar">
          <button
            className={`ff-kiosk-cat-item${!activeCat ? ' active' : ''}`}
            onClick={() => setActiveCat(null)}
          >
            <i className="bi bi-grid-fill" />
            <span>Todos</span>
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`ff-kiosk-cat-item${activeCat === c.id ? ' active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {(c as DbCategory & { imageUrl?: string }).imageUrl ? (
                <img
                  src={(c as DbCategory & { imageUrl?: string }).imageUrl}
                  alt={c.name}
                  className="ff-kiosk-cat-img"
                />
              ) : (
                <i className="bi bi-tag-fill" />
              )}
              <span>{c.name}</span>
            </button>
          ))}
        </nav>

        <div className="ff-kiosk-main">
          {displayed.length === 0 ? (
            <div className="ff-kiosk-empty">
              <i className="bi bi-inbox" />
              <span>Nenhum produto nesta categoria</span>
            </div>
          ) : (
            <div className="ff-kiosk-grid-2col">
              {displayed.map((prod) => {
                const inCart = cart.find((i) => i.productId === prod.id);
                return (
                  <div
                    key={prod.id}
                    className="ff-kiosk-card-v2"
                    onClick={() => addToCart(prod)}
                  >
                    <div className="ff-kiosk-card-img-wrap">
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        className="ff-kiosk-card-img"
                        loading="lazy"
                      />
                      {inCart && (
                        <div className="ff-kiosk-card-qty-badge">{inCart.quantity}</div>
                      )}
                    </div>
                    <div className="ff-kiosk-card-body">
                      <div className="ff-kiosk-card-name">{prod.name}</div>
                      <div className="ff-kiosk-card-price">{formatBRL(prod.price)}</div>
                    </div>
                    <div className="ff-kiosk-card-add">
                      <i className="bi bi-plus-lg" />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Sticky bottom bar */}
      <div className="ff-kiosk-bottom-bar">
        <div className="ff-kiosk-bottom-info">
          {cartCount > 0 ? (
            <>
              <span className="ff-kiosk-bottom-count">
                {cartCount} {cartCount === 1 ? 'item' : 'itens'}
              </span>
              <span className="ff-kiosk-bottom-total">{formatBRL(cartTotal)}</span>
            </>
          ) : (
            <span className="ff-kiosk-bottom-empty">Adicione itens ao carrinho</span>
          )}
        </div>
        <button
          className="ff-kiosk-checkout-btn"
          onClick={toCart}
          disabled={cartCount === 0}
        >
          Ver carrinho <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function KioskCartPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  });
  const [serviceType, setServiceType] = useState<'EAT_IN' | 'TAKEAWAY'>(
    () => (sessionStorage.getItem('ff_kiosk_service') ?? 'EAT_IN') as 'EAT_IN' | 'TAKEAWAY',
  );
  const navigate = useNavigate();
  useKioskIdleTimeout();

  function setQty(productId: string, qty: number) {
    if (qty <= 0) {
      setCart((prev) => prev.filter((i) => i.productId !== productId));
    } else {
      setCart((prev) => prev.map((i) => i.productId === productId ? { ...i, quantity: qty } : i));
    }
  }

  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const serviceFee = +(subtotal * 0.1).toFixed(2);
  const total = +(subtotal + serviceFee).toFixed(2);

  function proceed() {
    sessionStorage.setItem('ff_kiosk_cart', JSON.stringify(cart));
    sessionStorage.setItem('ff_kiosk_service', serviceType);
    navigate('/kiosk/payment');
  }

  return (
    <div className="ff-kiosk-layout">
      {/* Header */}
      <div className="ff-kiosk-cart-header">
        <span className="ff-kiosk-cart-header-title">CARRINHO</span>
      </div>

      {/* Service toggle */}
      <div className="ff-kiosk-service-toggle-wrap">
        <button
          className={`ff-kiosk-toggle-btn${serviceType === 'TAKEAWAY' ? ' active' : ''}`}
          onClick={() => setServiceType('TAKEAWAY')}
        >
          <i className="bi bi-bag" /> Para Levar
        </button>
        <button
          className={`ff-kiosk-toggle-btn${serviceType === 'EAT_IN' ? ' active' : ''}`}
          onClick={() => setServiceType('EAT_IN')}
        >
          <i className="bi bi-door-open" /> Comer Aqui
        </button>
      </div>

      {/* Items */}
      <div className="ff-kiosk-cart-scroll">
        {cart.length === 0 ? (
          <div className="ff-kiosk-empty" style={{ padding: '80px 20px' }}>
            <i className="bi bi-cart-x" />
            <span>Carrinho vazio</span>
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
                <i className="bi bi-trash3" /> REMOVER
              </button>
            </div>
            <div className="ff-kiosk-qty-group">
              <button
                className="ff-kiosk-qty-btn"
                onClick={() => setQty(item.productId, item.quantity - 1)}
              >
                −
              </button>
              <span className="ff-kiosk-qty-val">{item.quantity}</span>
              <button
                className="ff-kiosk-qty-btn"
                onClick={() => setQty(item.productId, item.quantity + 1)}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      {cart.length > 0 && (
        <div className="ff-kiosk-cart-summary">
          <div className="ff-kiosk-summary-row">
            <span>Subtotal</span><span>{formatBRL(subtotal)}</span>
          </div>
          <div className="ff-kiosk-summary-row">
            <span>Taxa de serviço (10%)</span><span>{formatBRL(serviceFee)}</span>
          </div>
          <div className="ff-kiosk-summary-row ff-kiosk-summary-total">
            <span>TOTAL</span><span>{formatBRL(total)}</span>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="ff-kiosk-cart-bottom">
        <button className="ff-kiosk-add-more-btn" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" /> Adicionar mais
        </button>
        <button
          className="ff-kiosk-pay-btn"
          onClick={proceed}
          disabled={cart.length === 0}
        >
          {cart.length > 0 ? `PAGAR ${formatBRL(total)}` : 'PAGAR'}
        </button>
      </div>
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

  // Auto-redirect countdown
  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, onReset]);

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-confirm-body">
        <div className="ff-kiosk-confirm-icon">
          <i className="bi bi-check-circle-fill" />
        </div>
        <div className="ff-kiosk-confirm-title">Pedido confirmado!</div>
        <div className="ff-kiosk-confirm-subtitle">Guarde o número abaixo para retirar seu pedido</div>

        <div className="ff-kiosk-ticket-box">
          <div className="ff-kiosk-ticket-label">Sua senha</div>
          <div className="ff-kiosk-ticket-number">{queueTicket.ticketNumber}</div>
          <div className="ff-kiosk-ticket-order">{order.orderNumber}</div>
        </div>

        <div className="ff-kiosk-confirm-hint">
          Aguarde ser chamado pelo número acima no painel de fila
        </div>
      </div>

      <div className="ff-kiosk-bottom-bar" style={{ justifyContent: 'space-between' }}>
        <span className="ff-kiosk-countdown">Reiniciando em {countdown}s…</span>
        <button className="ff-kiosk-checkout-btn" onClick={onReset}>
          Novo pedido
        </button>
      </div>
    </div>
  );
}

// ─── Payment ──────────────────────────────────────────────────────────────────

type PaymentStep = 'select' | 'processing' | 'result';

const PAYMENT_METHODS = [
  { id: 'CARD' as const, icon: 'bi-credit-card-2-front', label: 'Cartão', desc: 'Débito ou crédito' },
  { id: 'PIX'  as const, icon: 'bi-qr-code-scan',        label: 'PIX',    desc: 'Escaneie o QR Code' },
  { id: 'CASH' as const, icon: 'bi-cash-stack',           label: 'Dinheiro', desc: 'Pague no caixa' },
];

export function KioskPaymentPage() {
  const [step, setStep] = useState<PaymentStep>('select');
  const [method, setMethod] = useState<'CARD' | 'PIX' | 'CASH'>('CARD');
  const [result, setResult] = useState<'approved' | 'rejected' | null>(null);
  const [order, setOrder] = useState<DbOrder | null>(null);
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);
  const notify = useNotify();
  const navigate = useNavigate();

  const cart: CartItem[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  })();
  const serviceType = (sessionStorage.getItem('ff_kiosk_service') ?? 'EAT_IN') as 'EAT_IN' | 'TAKEAWAY';
  const subtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const total = +(subtotal * 1.1).toFixed(2);

  async function simulatePay() {
    setStep('processing');
    await new Promise((r) => setTimeout(r, 2000));

    const approved = Math.random() > 0.1;
    if (approved) {
      const { order: o, queueTicket: qt } = await kioskService.placeOrder('Cliente Totem', cart, serviceType);
      setOrder(o);
      setQueueTicket(qt);
      setResult('approved');
      notify('Pagamento aprovado!');
    } else {
      setResult('rejected');
    }
    setStep('result');
  }

  if (step === 'processing') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div className="spinner-border text-primary" style={{ width: 64, height: 64 }} />
        <div className="ff-kiosk-processing-text">Processando pagamento…</div>
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
          <div style={{ fontSize: 80, color: 'var(--ff-primary)', marginBottom: 16, lineHeight: 1 }}>✕</div>
          <div style={{ fontSize: 28, fontWeight: 700, marginBottom: 12 }}>Pagamento recusado</div>
          <div style={{ color: '#6b7280', marginBottom: 32, fontSize: 17 }}>
            Por favor, tente outro método de pagamento.
          </div>
          <button className="ff-kiosk-checkout-btn" onClick={() => setStep('select')}>
            Tentar novamente
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
        <span className="ff-kiosk-topbar-title">Pagamento</span>
        <div style={{ width: 52 }} />
      </div>

      <div className="ff-kiosk-payment-body">
        <div className="ff-kiosk-payment-total-box">
          <div className="ff-kiosk-payment-total-label">Total a pagar</div>
          <div className="ff-kiosk-payment-total-amount">{formatBRL(total)}</div>
        </div>

        <div className="ff-kiosk-payment-label">Como deseja pagar?</div>

        <div className="ff-kiosk-payment-options">
          {PAYMENT_METHODS.map(({ id, icon, label, desc }) => (
            <button
              key={id}
              className={`ff-kiosk-payment-option${method === id ? ' selected' : ''}`}
              onClick={() => setMethod(id)}
            >
              <i className={`bi ${icon} ff-kiosk-payment-option-icon`} />
              <div className="ff-kiosk-payment-option-text">
                <div className="ff-kiosk-payment-option-label">{label}</div>
                <div className="ff-kiosk-payment-option-desc">{desc}</div>
              </div>
              {method === id && <i className="bi bi-check-circle-fill ff-kiosk-payment-check" />}
            </button>
          ))}
        </div>
      </div>

      <div className="ff-kiosk-bottom-bar" style={{ justifyContent: 'flex-end' }}>
        <button
          className="ff-kiosk-checkout-btn"
          onClick={simulatePay}
          style={{ minWidth: 280 }}
        >
          Confirmar pagamento <i className="bi bi-arrow-right" />
        </button>
      </div>
    </div>
  );
}
