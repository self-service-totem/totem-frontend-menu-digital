import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kioskService } from '@/lib/services/kioskService';
import { useLabels } from '@/i18n/I18nContext';
import type { DbCategory, DbProduct, CartItem } from '@/lib/types';
import { formatCurrency as formatBRL } from '@/utils/format';
import { useKioskIdleTimeout, KioskIdleModal, KioskSteps } from './kioskShared';

function getCategoryIcon(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('combo') || n.includes('promocao') || n.includes('oferta')) return 'bi-lightning-charge-fill';
  if (n.includes('mais pedido') || n.includes('popular') || n.includes('destaque') || n.includes('favorito')) return 'bi-trophy-fill';
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

function getCategoryColor(name: string): string {
  const n = name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  if (n.includes('combo') || n.includes('promocao') || n.includes('oferta')) return '#d97706';
  if (n.includes('mais pedido') || n.includes('popular') || n.includes('destaque') || n.includes('favorito')) return '#059669';
  if (n.includes('cafe') || n.includes('coffee')) return '#b45309';
  if (n.includes('bebida') || n.includes('drink') || n.includes('suco') || n.includes('agua') || n.includes('refri')) return '#2563eb';
  if (n.includes('sobremesa') || n.includes('dessert') || n.includes('doce') || n.includes('sorvete')) return '#db2777';
  if (n.includes('entrada') || n.includes('starter') || n.includes('aperitivo')) return '#d97706';
  if (n.includes('burger') || n.includes('hamburguer') || n.includes('lanche')) return '#92400e';
  if (n.includes('salada') || n.includes('salad') || n.includes('vegano')) return '#16a34a';
  if (n.includes('carne') || n.includes('meat') || n.includes('churrasco') || n.includes('grelhado')) return '#dc2626';
  if (n.includes('prato') || n.includes('principal') || n.includes('main')) return '#e11d2a';
  if (n.includes('pizza')) return '#ea580c';
  return '#6b7280';
}

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
  const [cart, setCart] = useState<CartItem[]>(() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  });
  const navigate = useNavigate();
  const { t } = useLabels();
  const { warning, dismiss, goHome } = useKioskIdleTimeout();
  const [toast, setToast] = useState<{ name: string; key: number } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { load(); }, []);
  useEffect(() => () => { if (toastTimer.current) clearTimeout(toastTimer.current); }, []);

  const displayed = activeCat
    ? products.filter((p) => p.categoryId === activeCat)
    : products;

  const featuredCandidates = displayed.filter((p) => p.featured).slice(0, 2);
  // Only promote to hero if we have 2 cards — a single card stretches full-width and wastes premium space
  const featuredProducts = featuredCandidates.length >= 2 ? featuredCandidates : [];
  const featuredIds = new Set(featuredProducts.map((p) => p.id));
  const regularProducts = displayed.filter((p) => !featuredIds.has(p.id));

  const cartCount    = cart.reduce((s, i) => s + i.quantity, 0);
  const cartSubtotal = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const cartTotal    = cartSubtotal;

  const serviceParam = new URLSearchParams(window.location.search).get('service') ?? 'EAT_IN';
  const serviceLabel = serviceParam === 'EAT_IN' ? t('kiosk.welcome.eatIn') : t('kiosk.welcome.takeaway');

  const cartProductIds = new Set(cart.map((i) => i.productId));
  const upsellProduct = products.find((p) => p.available && !cartProductIds.has(p.id));

  function addToCart(prod: DbProduct) {
    setCart((prev) => {
      const ex = prev.find((i) => i.productId === prod.id);
      if (ex) return prev.map((i) => i.productId === prod.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, { id: prod.id, productId: prod.id, name: prod.name, imageUrl: prod.imageUrl, unitPrice: prod.price, quantity: 1 }];
    });
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
      <div className="spinner-border text-primary ff-kiosk-spin-56" />
    </div>
  );

  return (
    <div className="ff-kiosk-layout">
      {/* Compact ordering nav */}
      <div className="ff-kiosk-ordernav">
        <button className="ff-kiosk-ordernav-back" onClick={() => navigate('/kiosk/start')}>
          <i className="bi bi-arrow-left" />
        </button>
        <KioskSteps current={1} compact />
      </div>

      {/* Horizontal category bar — commercial categories first, Todos last */}
      <nav className="ff-kiosk-catbar" aria-label={t('kiosk.menu.categories')}>
        {categories.map((c) => {
          const isPromo = c.name.toLowerCase().includes('combo') || c.name.toLowerCase().includes('promoç');
          const isMaisPedidos = c.name.toLowerCase().includes('mais pedido');
          return (
            <button
              key={c.id}
              className={`ff-kiosk-cat${activeCat === c.id ? ' active' : ''}${isPromo ? ' ff-kiosk-cat--promo' : ''}${isMaisPedidos ? ' ff-kiosk-cat--popular' : ''}`}
              onClick={() => setActiveCat(c.id)}
            >
              <span className="ff-kiosk-cat-icon" style={{ background: getCategoryColor(c.name) }}>
                <i className={`bi ${getCategoryIcon(c.name)}`} />
              </span>
              <span className="ff-kiosk-cat-label">{c.name}</span>
              {isPromo && <span className="ff-kiosk-cat-hot">HOT</span>}
            </button>
          );
        })}
        <button
          className={`ff-kiosk-cat ff-kiosk-cat--all${!activeCat ? ' active' : ''}`}
          onClick={() => setActiveCat(null)}
        >
          <span className="ff-kiosk-cat-icon" style={{ background: '#6b7280' }}>
            <i className="bi bi-grid" />
          </span>
          <span className="ff-kiosk-cat-label">{t('kiosk.menu.all')}</span>
        </button>
      </nav>

      {/* Scrollable product area */}
      <div className="ff-kiosk-content">
        {displayed.length === 0 ? (
          <div className="ff-kiosk-empty">
            <i className="bi bi-inbox" />
            <span>{t('kiosk.menu.emptyCategory')}</span>
          </div>
        ) : (
          <>
            {/* Featured hero section */}
            {featuredProducts.length > 0 && (
              <section>
                <div className="ff-kiosk-section-head">
                  <span className="ff-kiosk-section-title">
                    <i className="bi bi-star-fill" /> {t('kiosk.menu.featured')}
                  </span>
                  <span className="ff-kiosk-section-sub">{t('kiosk.menu.featuredSub')}</span>
                </div>
                <div className="ff-kiosk-featured">
                  {featuredProducts.map((prod) => {
                    const inCart = cart.find((i) => i.productId === prod.id);
                    return (
                      <article
                        key={prod.id}
                        className="ff-kiosk-pcard ff-kiosk-pcard--featured"
                        onClick={() => addToCart(prod)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && addToCart(prod)}
                      >
                        <div className="ff-kiosk-pcard-media">
                          <span className="ff-kiosk-pcard-fallback"><i className="bi bi-fire" /></span>
                          <img
                            className="ff-kiosk-pcard-img"
                            src={prod.imageUrl}
                            alt={prod.name}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="ff-kiosk-pcard-overlay" />
                        </div>
                        <div className="ff-kiosk-pcard-badges">
                          <span className="ff-kiosk-badge ff-kiosk-badge--best">
                            <i className="bi bi-fire" /> {t('kiosk.menu.bestseller')}
                          </span>
                        </div>
                        {inCart && <span className="ff-kiosk-pcard-qty">{inCart.quantity}</span>}
                        <div className="ff-kiosk-pcard-content">
                          <div className="ff-kiosk-pcard-name">{prod.name}</div>
                          {prod.description && (
                            <div className="ff-kiosk-pcard-desc">{prod.description}</div>
                          )}
                          <div className="ff-kiosk-pcard-foot">
                            <span className="ff-kiosk-pcard-price">{formatBRL(prod.price)}</span>
                            <button className="ff-kiosk-add-btn" tabIndex={-1} aria-hidden>
                              <i className="bi bi-plus-lg" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}

            {/* Regular grid */}
            {regularProducts.length > 0 && (
              <section className={featuredProducts.length > 0 ? 'ff-kiosk-section--spaced' : undefined}>
                <div className="ff-kiosk-section-head">
                  <span className="ff-kiosk-section-title ff-kiosk-section-title--dark">
                    <i className="bi bi-list-ul ff-kiosk-section-icon--muted" /> {t('kiosk.menu.all')}
                  </span>
                  <span className="ff-kiosk-section-sub">
                    {regularProducts.length} {t('kiosk.order.items')}
                  </span>
                </div>
                <div className="ff-kiosk-grid">
                  {regularProducts.map((prod) => {
                    const inCart = cart.find((i) => i.productId === prod.id);
                    return (
                      <article
                        key={prod.id}
                        className="ff-kiosk-pcard ff-kiosk-pcard--regular"
                        onClick={() => addToCart(prod)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === 'Enter' && addToCart(prod)}
                      >
                        <div className="ff-kiosk-pcard-media">
                          <span className="ff-kiosk-pcard-fallback"><i className="bi bi-tag" /></span>
                          <img
                            className="ff-kiosk-pcard-img"
                            src={prod.imageUrl}
                            alt={prod.name}
                            loading="lazy"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                          <div className="ff-kiosk-pcard-overlay" />
                        </div>
                        {inCart && <span className="ff-kiosk-pcard-qty">{inCart.quantity}</span>}
                        <div className="ff-kiosk-pcard-content">
                          <div className="ff-kiosk-pcard-name">{prod.name}</div>
                          {prod.description && (
                            <div className="ff-kiosk-pcard-desc">{prod.description}</div>
                          )}
                          <div className="ff-kiosk-pcard-foot">
                            <span className="ff-kiosk-pcard-price">{formatBRL(prod.price)}</span>
                            <button className="ff-kiosk-add-btn" tabIndex={-1} aria-hidden>
                              <i className="bi bi-plus-lg" />
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        )}
      </div>

      {/* Toast */}
      {toast && (
        <div className="ff-kiosk-add-toast" key={toast.key}>
          <i className="bi bi-check-circle-fill" />
          <span><strong>{toast.name}</strong> · {t('kiosk.menu.added')}</span>
        </div>
      )}

      {/* Order bar */}
      <footer className="ff-kiosk-orderbar">
        {cartCount > 0 && upsellProduct && (
          <div className="ff-kiosk-upsell">
            <span className="ff-kiosk-upsell-icon"><i className="bi bi-stars" /></span>
            <span className="ff-kiosk-upsell-text">
              {t('kiosk.menu.upsellHint')} <strong>{upsellProduct.name}</strong>?
            </span>
            <button className="ff-kiosk-upsell-add" onClick={(e) => { e.stopPropagation(); addToCart(upsellProduct); }}>
              <i className="bi bi-plus-lg" /> {formatBRL(upsellProduct.price)}
            </button>
          </div>
        )}
        <div className="ff-kiosk-orderbar-main">
          {/* Left: totals or empty hint */}
          <div className="ff-kiosk-orderbar-totals">
            <span className="ff-kiosk-orderbar-label">{t('kiosk.order.label')} · {serviceLabel}</span>
            {cartCount > 0 ? (
              <span className="ff-kiosk-orderbar-amount">
                {formatBRL(cartTotal)}
              </span>
            ) : (
              <span className="ff-kiosk-orderbar-empty-hint">{t('kiosk.order.emptyHint')}</span>
            )}
          </div>

          {/* Center: large item count */}
          <div className="ff-kiosk-orderbar-count-center">
            <span className={`ff-kiosk-orderbar-count-num${cartCount === 0 ? ' zero' : ''}`}>
              {cartCount}
            </span>
            <span className="ff-kiosk-orderbar-count-lbl">
              {cartCount === 1 ? t('kiosk.order.item') : t('kiosk.order.items')}
            </span>
          </div>

          <span className="ff-kiosk-spacer" />

          <button className="ff-kiosk-cta" onClick={toCart} disabled={cartCount === 0}>
            {t('kiosk.order.review')} <i className="bi bi-arrow-right" />
          </button>
        </div>
      </footer>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}
