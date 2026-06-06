import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskService } from '@/lib/services/kioskService';
import { useNotify } from '@/lib/notifications';
import { useSession } from '@/app/SessionContext';
import { LanguageSelector } from '@/components/common/LanguageSelector';
import type { DbCategory, DbProduct, CartItem, QueueTicket, DbOrder } from '@/lib/types';

const IDLE_TIMEOUT_MS = 60_000; // 60 s of no interaction → reset to welcome

/** Resets the kiosk to the welcome screen after IDLE_TIMEOUT_MS of inactivity. */
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
    reset(); // start the timer
    return () => {
      events.forEach((e) => window.removeEventListener(e, reset));
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [enabled, reset]);
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
      <div className="ff-kiosk-topbar">
        <button className="btn btn-sm btn-outline-light" onClick={() => navigate('/')}>
          <i className="bi bi-house" />
        </button>
        <span className="ff-kiosk-topbar-title">Pertinho do Ceu</span>
        <LanguageSelector variant="pills" className="ff-kiosk-lang-pills" />
      </div>

      <div className="ff-kiosk-content">
        <div className="ff-kiosk-welcome">
          <div>
            <div style={{ fontSize: 56, marginBottom: 8 }}>🍽</div>
            <div className="ff-kiosk-welcome-title">{copy.title}</div>
            <div style={{ fontSize: 18, color: '#6b7280', marginTop: 8 }}>{copy.subtitle}</div>
          </div>

          <div className="ff-kiosk-service-options">
            <button className="ff-kiosk-service-btn" onClick={() => navigate('/kiosk/menu?service=EAT_IN')}>
              <i className="bi bi-table" />{copy.eatIn}
            </button>
            <button className="ff-kiosk-service-btn" onClick={() => navigate('/kiosk/menu?service=TAKEAWAY')}>
              <i className="bi bi-bag" />{copy.takeaway}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Menu ─────────────────────────────────────────────────────────────────────

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

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
    <div className="ff-kiosk-layout">
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1, minHeight: '100vh' }}>
        <div className="spinner-border text-primary" />
      </div>
    </div>
  );

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-topbar">
        <button className="btn btn-sm btn-outline-light" onClick={() => navigate('/kiosk/start')}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">Cardápio</span>
        <button
          className="btn btn-sm btn-light position-relative"
          onClick={toCart}
          disabled={cartCount === 0}
        >
          <i className="bi bi-cart3 me-1" />Ver carrinho
          {cartCount > 0 && (
            <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger" style={{ fontSize: 11 }}>
              {cartCount}
            </span>
          )}
        </button>
      </div>

      <div className="ff-kiosk-content">
        <div className="ff-kiosk-category-bar">
          <button
            className={`ff-kiosk-category-btn ${!activeCat ? 'active' : ''}`}
            onClick={() => setActiveCat(null)}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id}
              className={`ff-kiosk-category-btn ${activeCat === c.id ? 'active' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              {c.name}
            </button>
          ))}
        </div>

        <div className="ff-kiosk-product-grid">
          {displayed.map((prod) => {
            const inCart = cart.find((i) => i.productId === prod.id);
            return (
              <div key={prod.id} className="ff-kiosk-product-card">
                <img src={prod.imageUrl} alt={prod.name} className="ff-kiosk-product-img" loading="lazy" />
                <div className="ff-kiosk-product-body">
                  <div className="ff-kiosk-product-name">{prod.name}</div>
                  {prod.description && <div style={{ fontSize: 12, color: '#6b7280' }}>{prod.description}</div>}
                  <div className="ff-kiosk-product-price">{formatBRL(prod.price)}</div>
                </div>
                <button className="ff-kiosk-add-btn" onClick={() => addToCart(prod)}>
                  {inCart ? `Adicionar mais (${inCart.quantity} no carr.)` : 'Adicionar'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Cart ─────────────────────────────────────────────────────────────────────

export function KioskCartPage() {
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  });
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
    navigate('/kiosk/payment');
  }

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-topbar">
        <button className="btn btn-sm btn-outline-light" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">Seu pedido</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ff-kiosk-content">
        {cart.length === 0 && (
          <div className="text-center py-5 text-muted">
            <i className="bi bi-cart-x" style={{ fontSize: 48 }} />
            <div className="mt-2">Carrinho vazio</div>
            <button className="btn btn-primary mt-3" onClick={() => navigate(-1)}>Voltar ao cardápio</button>
          </div>
        )}

        {cart.map((item) => (
          <div key={item.productId} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #e5e7eb' }}>
            <img src={item.imageUrl} alt={item.name} style={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 8 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ color: '#e11d2a', fontWeight: 700 }}>{formatBRL(item.unitPrice)}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setQty(item.productId, item.quantity - 1)}>−</button>
              <span style={{ fontWeight: 700, minWidth: 20, textAlign: 'center' }}>{item.quantity}</span>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setQty(item.productId, item.quantity + 1)}>+</button>
            </div>
          </div>
        ))}

        {cart.length > 0 && (
          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6b7280' }}>
              <span>Subtotal</span><span>{formatBRL(subtotal)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, color: '#6b7280' }}>
              <span>Taxa de serviço (10%)</span><span>{formatBRL(serviceFee)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 20, marginBottom: 24 }}>
              <span>Total</span><span style={{ color: '#e11d2a' }}>{formatBRL(total)}</span>
            </div>
            <button className="btn btn-primary btn-lg w-100" onClick={proceed}>
              Ir para pagamento →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Confirmation + print modal ───────────────────────────────────────────────

function KioskConfirmationScreen({
  order,
  queueTicket,
  onReset,
}: {
  order: DbOrder;
  queueTicket: QueueTicket;
  onReset: () => void;
}) {
  const [showPrint, setShowPrint] = useState(false);

  return (
    <div className="ff-kiosk-layout">
      <div
        className="ff-kiosk-content"
        style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', gap: 24, textAlign: 'center' }}
      >
        <div style={{ fontSize: 64 }}>✅</div>
        <div style={{ fontSize: 28, fontWeight: 700 }}>Pedido confirmado!</div>

        <div style={{ background: '#f9fafb', borderRadius: 16, padding: '24px 40px', minWidth: 240 }}>
          <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 4 }}>Seu número de senha</div>
          <div style={{ fontSize: 64, fontWeight: 900, color: '#e11d2a', lineHeight: 1 }}>{queueTicket.ticketNumber}</div>
          <div style={{ fontSize: 14, color: '#6b7280', marginTop: 6 }}>{order.orderNumber}</div>
        </div>

        <div style={{ color: '#6b7280', fontSize: 14, maxWidth: 280 }}>
          Acompanhe pelo painel de fila ou aguarde ser chamado pelo número acima.
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <button className="btn btn-outline-secondary btn-lg" onClick={() => setShowPrint(true)}>
            <i className="bi bi-printer me-2" />Imprimir comprovante
          </button>
          <button className="btn btn-primary btn-lg" onClick={onReset}>
            Novo pedido
          </button>
        </div>
      </div>

      {/* Print mock modal */}
      {showPrint && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowPrint(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 12, padding: 28, width: 320, fontFamily: 'monospace', fontSize: 13 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 16, fontWeight: 700 }}>COMPROVANTE DE PEDIDO</div>
              <div style={{ color: '#6b7280', fontSize: 12 }}>{new Date().toLocaleString('pt-BR')}</div>
            </div>
            <hr />
            <div style={{ textAlign: 'center', margin: '16px 0' }}>
              <div style={{ fontSize: 12, color: '#6b7280' }}>SENHA</div>
              <div style={{ fontSize: 56, fontWeight: 900, color: '#e11d2a', lineHeight: 1 }}>{queueTicket.ticketNumber}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{order.orderNumber}</div>
            </div>
            <hr />
            {order.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>{item.quantity}× {item.name}</span>
                <span>{(item.unitPrice * item.quantity).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
              </div>
            ))}
            <hr />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700 }}>
              <span>TOTAL PAGO</span>
              <span>{order.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 20 }}>
              <button className="btn btn-sm btn-primary flex-1" onClick={() => window.print()}>
                <i className="bi bi-printer me-1" />Imprimir
              </button>
              <button className="btn btn-sm btn-outline-secondary" onClick={() => setShowPrint(false)}>
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Payment ──────────────────────────────────────────────────────────────────

type PaymentStep = 'select' | 'processing' | 'result';

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

    // 90% approval rate
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
      <div className="ff-kiosk-layout" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <div className="text-center" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
          <div className="spinner-border text-primary" style={{ width: 56, height: 56 }} />
          <div style={{ fontSize: 20, fontWeight: 600 }}>Processando pagamento...</div>
        </div>
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
      <div className="ff-kiosk-layout">
        <div className="ff-kiosk-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 'calc(100vh - 80px)', gap: 20, textAlign: 'center' }}>
          <div style={{ fontSize: 64 }}>❌</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>Pagamento recusado</div>
          <div style={{ color: '#6b7280' }}>Por favor, tente outro método de pagamento.</div>
          <button className="btn btn-primary" onClick={() => setStep('select')}>Tentar novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-kiosk-layout">
      <div className="ff-kiosk-topbar">
        <button className="btn btn-sm btn-outline-light" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <span className="ff-kiosk-topbar-title">Pagamento</span>
        <div style={{ width: 36 }} />
      </div>

      <div className="ff-kiosk-content" style={{ maxWidth: 480, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 16, color: '#6b7280', marginBottom: 4 }}>Total a pagar</div>
          <div style={{ fontSize: 40, fontWeight: 900, color: '#e11d2a' }}>
            {formatBRL(total)}
          </div>
        </div>

        <div style={{ marginBottom: 24 }}>
          <div style={{ fontWeight: 600, marginBottom: 12 }}>Escolha a forma de pagamento</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {([['CARD', 'bi-credit-card', 'Cartão de débito/crédito'], ['PIX', 'bi-qr-code', 'PIX'], ['CASH', 'bi-cash', 'Dinheiro (no caixa)']] as const).map(([m, icon, label]) => (
              <button
                key={m}
                className={`ff-kiosk-service-btn ${method === m ? 'selected' : ''}`}
                style={{ flexDirection: 'row', justifyContent: 'flex-start', padding: '16px 20px', gap: 16 }}
                onClick={() => setMethod(m)}
              >
                <i className={`bi ${icon}`} style={{ fontSize: 24 }} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <button className="btn btn-primary btn-lg w-100" onClick={simulatePay}>
          Pagar {formatBRL(total)}
        </button>
      </div>
    </div>
  );
}
