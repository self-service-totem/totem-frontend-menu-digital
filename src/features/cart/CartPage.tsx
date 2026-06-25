import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/app/CartContext';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { EmptyState } from '@/components/common/EmptyState';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/common/TextField';
import { OrderSummary } from '@/components/account/OrderSummary';
import { formatMoney } from '@/utils/format';
import { orderService } from '@/lib/services';

export function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const { customer, tableId, menuContext, setCustomerName, setCustomerPhone } = useSession();
  const { t } = useLabels();

  const currency = menuContext?.currency ?? 'BRL';
  const serviceFeeRate = menuContext?.serviceFeeRate ?? 0.1;
  const serviceFee = +(subtotal * serviceFeeRate).toFixed(2);
  const total = +(subtotal + serviceFee).toFixed(2);

  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [codeInput, setCodeInput] = useState('');
  const [codeError, setCodeError] = useState(false);

  const TABLE_CODE_KEY = `ff_table_verified_${tableId}`;
  const tableCodeRequired = Boolean(menuContext?.tableValidationCode);
  const tableCodeVerified = () => {
    const expected = menuContext?.tableValidationCode ?? '';
    return localStorage.getItem(TABLE_CODE_KEY)?.toUpperCase() === expected.toUpperCase();
  };

  const goBackToMenu = () => navigate(tableId ? `/menu/${tableId}` : '/menu');

  // Compose a human-readable note (chosen modifiers + free text) so the kitchen
  // and bill keep the customization even though modifiers are stored structured.
  const composeOrderNote = (it: (typeof items)[number]) => {
    const mods = (it.modifiers ?? []).map((m) => m.optionName).join(', ');
    return [mods, it.note].filter(Boolean).join(' | ') || undefined;
  };

  const submitOrder = async (customerName: string) => {
    if (!tableId || items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      const order = await orderService.placeOrder(
        tableId,
        { customerName, items: items.map((it) => ({ productId: it.productId, quantity: it.quantity, notes: composeOrderNote(it) })) },
        items,
      );
      clear();
      navigate('/order-confirmation', {
        state: { orderNumber: order.orderNumber, total: order.total, customerName, itemCount: items.reduce((s, i) => s + i.quantity, 0) },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = () => {
    setEditName(customer?.name ?? '');
    setEditPhone(customer?.phone ?? '');
    setError(null);
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) { setError(t('common.required')); return; }
    setCustomerName(editName.trim());
    if (editPhone.trim()) setCustomerPhone(editPhone.trim());
    setEditOpen(false);
  };

  function verifyTableCode(e: FormEvent) {
    e.preventDefault();
    const expected = menuContext?.tableValidationCode ?? '';
    if (codeInput.trim().toUpperCase() === expected.toUpperCase()) {
      localStorage.setItem(TABLE_CODE_KEY, codeInput.trim().toUpperCase());
      setCodeModalOpen(false);
      setCodeInput('');
      setCodeError(false);
      void proceedWithOrder();
    } else {
      setCodeError(true);
      setCodeInput('');
    }
  }

  async function proceedWithOrder() {
    if (customer?.name?.trim()) {
      await submitOrder(customer.name.trim());
    } else {
      openEdit();
    }
  }

  const handlePlaceOrder = async () => {
    if (tableCodeRequired && !tableCodeVerified()) {
      setCodeInput('');
      setCodeError(false);
      setCodeModalOpen(true);
      return;
    }
    await proceedWithOrder();
  };

  return (
    // Use ff-page (with nav padding) so BottomNav doesn't hide content
    <div className="ff-page">
      {/* Header */}
      <div className="ff-cart-header">
        <button type="button" className="ff-cart-header__back" onClick={goBackToMenu}>
          <i className="bi bi-chevron-left" /> {t('cart.continue')}
        </button>
        <h1 className="ff-cart-header__title">{t('cart.title')}</h1>
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon="bi-bag"
          title={t('cart.empty')}
          description={t('cart.emptyDesc')}
          action={<PrimaryButton onClick={goBackToMenu}>{t('cart.viewMenu')}</PrimaryButton>}
        />
      ) : (
        <>
          {/* Customer info — display labels with edit button (like reference) */}
          <div className="ff-cart-customer">
            <div className="ff-cart-customer__row">
              <i className="bi bi-telephone" aria-hidden />
              <span className="ff-cart-customer__val">
                {customer?.phone || t('waiter.phonePlaceholder')}
              </span>
            </div>
            <div className="ff-cart-customer__row">
              <i className="bi bi-person" aria-hidden />
              <span className="ff-cart-customer__val ff-cart-customer__val--name">
                {customer?.name?.toUpperCase() || t('cart.namePlaceholder').toUpperCase()}
              </span>
              <button type="button" className="ff-cart-customer__edit" onClick={openEdit}>
                {t('cart.changeName')}
              </button>
            </div>
          </div>

          {/* Items */}
          <div className="ff-cart-items">
            <h2 className="ff-cart-items__title">{t('cart.items')}</h2>
            {items.map((it) => (
              <div key={it.id} className="ff-cart-row">
                <img className="ff-cart-row__img" src={it.imageUrl} alt={it.name} loading="lazy" />
                <div className="ff-cart-row__body">
                  <span className="ff-cart-row__name">{it.name}</span>
                  {it.modifiers && it.modifiers.length > 0 && (
                    <span className="ff-cart-row__mods">
                      {it.modifiers.map((m) => m.optionName).join(', ')}
                    </span>
                  )}
                  {it.note && <span className="ff-cart-row__note">{it.note}</span>}
                  <span className="ff-cart-row__price">
                    {formatMoney(it.unitPrice * it.quantity, currency)}
                    {it.quantity > 1 && (
                      <span className="ff-cart-row__unit">
                        {' '}· {formatMoney(it.unitPrice, currency)} {t('cart.each')}
                      </span>
                    )}
                  </span>
                </div>
                <div className="ff-cart-row__controls">
                  <button
                    type="button"
                    className="ff-cart-ctrl"
                    onClick={() => it.quantity > 1 ? setQuantity(it.id, it.quantity - 1) : remove(it.id)}
                    aria-label={t('cart.decrease')}
                  >
                    <i className="bi bi-dash-circle-fill" />
                  </button>
                  <span className="ff-cart-ctrl__qty">{it.quantity}</span>
                  <button
                    type="button"
                    className="ff-cart-ctrl"
                    onClick={() => setQuantity(it.id, it.quantity + 1)}
                    aria-label={t('cart.increase')}
                  >
                    <i className="bi bi-plus-circle-fill" />
                  </button>
                  <button
                    type="button"
                    className="ff-cart-ctrl ff-cart-ctrl--trash"
                    onClick={() => remove(it.id)}
                    aria-label={t('cart.removeItem')}
                  >
                    <i className="bi bi-trash-fill" />
                  </button>
                </div>
              </div>
            ))}

            {/* Price breakdown */}
            <OrderSummary
              subtotal={subtotal}
              serviceFee={serviceFee}
              total={total}
              currency={currency}
              serviceFeeLabel={t('summary.serviceFee')}
            />
          </div>

          {error && (
            <p style={{ color: 'var(--ff-primary)', fontSize: '0.85rem', margin: '0 16px 12px', textAlign: 'center' }}>
              {error}
            </p>
          )}

          {/* CTA — sits above BottomNav */}
          <div className="ff-cart-cta">
            <button
              type="button"
              className="ff-cart-cta__btn"
              onClick={handlePlaceOrder}
              disabled={submitting}
            >
              <span>{submitting ? t('cart.placingOrder') : t('cart.placeOrder')}</span>
              {!submitting && <span className="ff-cart-cta__total">{formatMoney(total, currency)}</span>}
            </button>
          </div>
        </>
      )}

      {/* Edit name/phone modal */}
      <Modal
        open={editOpen}
        onClose={() => setEditOpen(false)}
        title={t('cart.namePromptTitle')}
        description={t('cart.namePromptDesc')}
      >
        <form onSubmit={handleEditSubmit}>
          <TextField
            label={t('cart.name')}
            required
            type="text"
            placeholder={t('cart.namePlaceholder')}
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
          />
          <TextField
            label={t('cart.phone')}
            type="tel"
            inputMode="tel"
            placeholder={t('waiter.phonePlaceholder')}
            value={editPhone}
            onChange={(e) => setEditPhone(e.target.value)}
          />
          {error && (
            <p style={{ color: 'var(--ff-primary)', fontSize: '0.85rem', margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <PrimaryButton type="submit">
            {t('cart.confirmName')}
          </PrimaryButton>
        </form>
      </Modal>

      {/* Table code verification modal */}
      <Modal
        open={codeModalOpen}
        onClose={() => setCodeModalOpen(false)}
        title={t('tableCode.title')}
        description={t('tableCode.subtitle')}
      >
        <form onSubmit={verifyTableCode}>
          <TextField
            label={t('tableCode.label')}
            type="text"
            inputMode="text"
            placeholder={t('tableCode.placeholder')}
            value={codeInput}
            onChange={(e) => { setCodeInput(e.target.value.toUpperCase()); setCodeError(false); }}
            autoFocus
          />
          {codeError && (
            <p style={{ color: 'var(--ff-primary)', fontSize: '0.85rem', margin: '0 0 12px' }}>
              {t('tableCode.wrong')}
            </p>
          )}
          <PrimaryButton type="submit">{t('tableCode.submit')}</PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
