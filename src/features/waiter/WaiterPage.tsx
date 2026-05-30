import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { TopBar } from '@/components/layout/TopBar';
import { WaiterActionCard } from '@/components/waiter/WaiterActionCard';
import { Modal } from '@/components/common/Modal';
import { TextField } from '@/components/common/TextField';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useSession } from '@/app/SessionContext';
import { useLabels } from '@/i18n/I18nContext';
import { waiterService, orderService } from '@/services';

type ActionId = 'call' | 'bill' | 'order' | 'other';

const actions: { id: ActionId; icon: string }[] = [
  { id: 'call', icon: 'bi-bell' },
  { id: 'bill', icon: 'bi-receipt' },
  { id: 'order', icon: 'bi-clock-history' },
  { id: 'other', icon: 'bi-three-dots' },
];

const ACTION_LABELS_PT: Record<ActionId, string> = {
  call: 'Chamar garçom',
  bill: 'Pedir a conta',
  order: 'Meus pedidos',
  other: 'Outro motivo',
};

const ACTION_LABELS_ES: Record<ActionId, string> = {
  call: 'Llamar al mozo',
  bill: 'Pedir la cuenta',
  order: 'Mis pedidos',
  other: 'Otro motivo',
};

export function WaiterPage() {
  const { tableId, customer, setCustomerName, setCustomerPhone } = useSession();
  const { t, language } = useLabels();
  const navigate = useNavigate();
  const actionLabels = language.startsWith('pt') ? ACTION_LABELS_PT : ACTION_LABELS_ES;

  const [open, setOpen] = useState(false);
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [confirmationVariant, setConfirmationVariant] = useState<'success' | 'info'>('success');

  function showConfirmation(msg: string, variant: 'success' | 'info' = 'success') {
    setConfirmation(msg);
    setConfirmationVariant(variant);
    setTimeout(() => setConfirmation(null), 3500);
  }

  function handleAction(id: ActionId) {
    // "Meus pedidos" → navigate to account/order history
    if (id === 'order') {
      navigate('/account');
      return;
    }
    // "Pedir a conta" → request bill directly and navigate to bill view
    if (id === 'bill') {
      handleRequestBill();
      return;
    }
    // "Chamar garçom" and "Outro motivo" → open waiter call modal
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setError(null);
    setOpen(true);
  }

  async function handleRequestBill() {
    if (!tableId) {
      showConfirmation('Mesa não identificada.', 'info');
      return;
    }
    setSubmitting(true);
    try {
      await orderService.requestCloseBill(tableId, {
        customerName: customer?.name ?? '',
      });
      showConfirmation(t('bill.requestSent'));
      navigate('/close-account');
    } catch {
      showConfirmation('Não foi possível solicitar a conta. Tente novamente.', 'info');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tableId) {
      setError('Mesa no identificada.');
      return;
    }
    if (!phone.trim()) {
      setError(t('common.required'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await waiterService.callWaiter(tableId, {
        customerName: name.trim(),
        phone: phone.trim(),
      });
      if (name.trim()) setCustomerName(name.trim());
      if (phone.trim()) setCustomerPhone(phone.trim());
      setOpen(false);
      showConfirmation(t('waiter.sent'));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="ff-page">
      <TopBar title={t('waiter.title')} />
      <div style={{ padding: '20px 16px 0', textAlign: 'center' }}>
        <i
          className="bi bi-bell-fill"
          style={{ fontSize: '2.4rem', color: 'var(--ff-primary)' }}
          aria-hidden
        />
        <h2 style={{ margin: '12px 0 4px', fontSize: '1.15rem' }}>{t('waiter.help')}</h2>
        <p style={{ margin: 0, color: 'var(--ff-text-muted)', fontSize: '0.9rem' }}>
          {t('waiter.helpDesc')}
        </p>
      </div>

      <div className="ff-grid-2" style={{ marginTop: 20 }}>
        {actions.map((a) => (
          <WaiterActionCard
            key={a.id}
            icon={a.icon}
            label={actionLabels[a.id]}
            onClick={() => handleAction(a.id)}
          />
        ))}
      </div>

      {confirmation && (
        <div
          role="status"
          style={{
            margin: 16,
            padding: 12,
            background: confirmationVariant === 'success'
              ? 'var(--ff-primary-soft)'
              : '#f0f9ff',
            color: confirmationVariant === 'success' ? 'var(--ff-primary)' : '#0369a1',
            borderRadius: 'var(--ff-radius-md)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          <i
            className={`bi ${confirmationVariant === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'} me-1`}
          />
          {confirmation}
        </div>
      )}

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={t('waiter.formTitle')}
        description={t('waiter.formDesc')}
      >
        <form onSubmit={handleSubmit}>
          <TextField
            label={t('waiter.phone')}
            required
            type="tel"
            inputMode="tel"
            placeholder={t('waiter.phonePlaceholder')}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <TextField
            label={t('waiter.name')}
            type="text"
            placeholder={t('waiter.namePlaceholder')}
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {error && (
            <p style={{ color: 'var(--ff-primary)', fontSize: '0.85rem', margin: '0 0 12px' }}>
              {error}
            </p>
          )}
          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <SecondaryButton type="button" onClick={() => setOpen(false)} disabled={submitting}>
              {t('waiter.cancel')}
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={submitting}>
              {submitting ? t('cart.placingOrder') : t('waiter.send')}
            </PrimaryButton>
          </div>
        </form>
      </Modal>
    </div>
  );
}
