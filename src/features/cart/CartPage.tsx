import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '@/app/CartContext';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { TopBar } from '@/components/layout/TopBar';
import { CartItemRow } from '@/components/cart/CartItemRow';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { EmptyState } from '@/components/common/EmptyState';
import { OrderSummary } from '@/components/account/OrderSummary';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/common/TextField';
import { orderService } from '@/services';

export function CartPage() {
  const navigate = useNavigate();
  const { items, subtotal, setQuantity, remove, clear } = useCart();
  const {
    customer,
    menuContext,
    tableId,
    setCustomerName,
    setCustomerPhone,
  } = useSession();
  const { t } = useLabels();

  const [editingName, setEditingName] = useState(false);
  const [draftName, setDraftName] = useState(customer?.name ?? '');
  const [identifyOpen, setIdentifyOpen] = useState(false);
  const [identName, setIdentName] = useState(customer?.name ?? '');
  const [identPhone, setIdentPhone] = useState(customer?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const serviceFeeRate = menuContext?.serviceFeeRate ?? 0.1;
  const serviceFee = +(subtotal * serviceFeeRate).toFixed(2);
  const total = +(subtotal + serviceFee).toFixed(2);

  const goBackToMenu = () =>
    navigate(tableId ? `/menu/${tableId}` : '/menu');

  const submitOrder = async (customerName: string) => {
    if (!tableId || items.length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await orderService.placeOrder(
        tableId,
        {
          customerName,
          items: items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            notes: it.note,
          })),
        },
        items,
      );
      clear();
      navigate(tableId ? `/menu/${tableId}` : '/menu');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (customer?.name?.trim()) {
      await submitOrder(customer.name.trim());
      return;
    }
    setIdentName('');
    setIdentPhone(customer?.phone ?? '');
    setError(null);
    setIdentifyOpen(true);
  };

  const handleIdentifySubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!identName.trim()) {
      setError(t('common.required'));
      return;
    }
    setCustomerName(identName.trim());
    if (identPhone.trim()) setCustomerPhone(identPhone.trim());
    setIdentifyOpen(false);
    await submitOrder(identName.trim());
  };

  const saveName = () => {
    if (draftName.trim()) setCustomerName(draftName.trim());
    setEditingName(false);
  };

  return (
    <div className="ff-page">
      <TopBar
        title={t('cart.title')}
        rightSlot={
          <button type="button" className="ff-link" onClick={goBackToMenu}>
            {t('cart.continue')}
          </button>
        }
      />

      {items.length === 0 ? (
        <EmptyState
          icon="bi-bag"
          title={t('cart.empty')}
          description={t('cart.emptyDesc')}
          action={<PrimaryButton onClick={goBackToMenu}>{t('cart.viewMenu')}</PrimaryButton>}
        />
      ) : (
        <>
          <div className="ff-customer-card">
            <div className="ff-customer-card__row">
              <span className="ff-customer-card__label">{t('cart.phone')}</span>
              <span className="ff-customer-card__value">{customer?.phone || '—'}</span>
            </div>
            <div className="ff-customer-card__row" style={{ marginTop: 8 }}>
              <span className="ff-customer-card__label">{t('cart.name')}</span>
              {editingName ? (
                <div style={{ display: 'flex', gap: 6 }}>
                  <input
                    className="ff-search__input"
                    style={{
                      border: '1px solid var(--ff-border)',
                      borderRadius: 8,
                      padding: '4px 8px',
                    }}
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                  />
                  <button type="button" className="ff-link" onClick={saveName}>
                    OK
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span className="ff-customer-card__value">
                    {customer?.name || t('cart.namePlaceholder')}
                  </span>
                  <button
                    type="button"
                    className="ff-link"
                    onClick={() => {
                      setDraftName(customer?.name ?? '');
                      setEditingName(true);
                    }}
                  >
                    {t('cart.changeName')}
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="ff-cart-list">
            {items.map((it) => (
              <CartItemRow
                key={it.id}
                item={it}
                onQuantityChange={setQuantity}
                onRemove={remove}
              />
            ))}
          </div>

          <OrderSummary subtotal={subtotal} serviceFee={serviceFee} total={total} />

          <div style={{ padding: '0 16px 12px' }}>
            <SecondaryButton onClick={goBackToMenu}>
              <i className="bi bi-plus-lg" /> {t('cart.addMore')}
            </SecondaryButton>
          </div>

          {error && (
            <p
              style={{
                color: 'var(--ff-primary)',
                fontSize: '0.85rem',
                margin: '0 16px 12px',
                textAlign: 'center',
              }}
            >
              {error}
            </p>
          )}

          <div className="ff-sticky-cta">
            <PrimaryButton onClick={handlePlaceOrder} disabled={submitting}>
              {submitting ? t('cart.placingOrder') : t('cart.placeOrder')}
            </PrimaryButton>
          </div>
        </>
      )}

      <Modal
        open={identifyOpen}
        onClose={() => setIdentifyOpen(false)}
        title={t('cart.namePromptTitle')}
        description={t('cart.namePromptDesc')}
      >
        <form onSubmit={handleIdentifySubmit}>
          <TextField
            label={t('cart.name')}
            required
            type="text"
            placeholder={t('cart.namePlaceholder')}
            value={identName}
            onChange={(e) => setIdentName(e.target.value)}
            autoFocus
          />
          <TextField
            label={t('cart.phone')}
            type="tel"
            inputMode="tel"
            placeholder={t('waiter.phonePlaceholder')}
            value={identPhone}
            onChange={(e) => setIdentPhone(e.target.value)}
          />
          {error && (
            <p style={{ color: 'var(--ff-primary)', fontSize: '0.85rem', margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <PrimaryButton type="submit" disabled={submitting}>
            {submitting ? t('cart.placingOrder') : t('cart.confirmName')}
          </PrimaryButton>
        </form>
      </Modal>
    </div>
  );
}
