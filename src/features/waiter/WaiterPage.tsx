import { useState, useEffect, type FormEvent } from 'react';
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
import type { WaiterCall } from '@/lib/types';

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

const STATUS_LABEL_PT: Record<string, string> = {
  PENDING: 'Aguardando',
  ACKNOWLEDGED: 'Reconhecido',
  RESOLVED: 'Resolvido',
  CANCELED: 'Cancelado',
};

const STATUS_LABEL_ES: Record<string, string> = {
  PENDING: 'Pendiente',
  ACKNOWLEDGED: 'Reconocida',
  RESOLVED: 'Resuelta',
  CANCELED: 'Cancelada',
};

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return `hace ${diff}s`;
  if (diff < 3600) return `hace ${Math.floor(diff / 60)} min`;
  return `hace ${Math.floor(diff / 3600)} h`;
}

// ─── Active request card ──────────────────────────────────────────────────────

interface ActiveRequestCardProps {
  call: WaiterCall;
  actionLabel: string;
  statusLabel: string;
  cancelLabel: string;
  resolveLabel: string;
  onCancel: () => void;
  onResolve: () => void;
}

function ActiveRequestCard({
  call,
  actionLabel,
  statusLabel,
  cancelLabel,
  resolveLabel,
  onCancel,
  onResolve,
}: ActiveRequestCardProps) {
  const isPending = call.status === 'PENDING';
  const isAcknowledged = call.status === 'ACKNOWLEDGED';
  const isActive = isPending || isAcknowledged;

  const borderColor = isPending ? 'var(--ff-primary)' : isAcknowledged ? '#d97706' : '#6b7280';
  const badgeBg = isPending ? 'var(--ff-primary)' : isAcknowledged ? '#d97706' : '#6b7280';

  return (
    <div
      style={{
        borderRadius: 'var(--ff-radius-md)',
        border: `2px solid ${borderColor}`,
        overflow: 'hidden',
        background: '#fff',
        opacity: isActive ? 1 : 0.55,
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '10px 14px',
          background: isPending ? 'var(--ff-primary-soft)' : isAcknowledged ? '#fffbeb' : '#f9fafb',
        }}
      >
        <i
          className={`bi ${isPending ? 'bi-hourglass-split' : isAcknowledged ? 'bi-person-check' : 'bi-check-circle'}`}
          style={{ color: borderColor, fontSize: '1.1rem', flexShrink: 0 }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{actionLabel}</div>
          <div style={{ fontSize: '0.78rem', color: 'var(--ff-text-muted)' }}>
            {timeAgo(call.createdAt)}
          </div>
        </div>
        <span
          style={{
            background: badgeBg,
            color: '#fff',
            borderRadius: 6,
            padding: '2px 8px',
            fontSize: '0.75rem',
            fontWeight: 700,
            flexShrink: 0,
          }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Actions */}
      {isActive && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', borderTop: '1px solid #f3f4f6' }}>
          <button
            className="btn btn-sm btn-outline-secondary flex-1"
            style={{ fontSize: '0.82rem' }}
            onClick={onCancel}
          >
            <i className="bi bi-x-circle me-1" />
            {cancelLabel}
          </button>
          <button
            className="btn btn-sm flex-1"
            style={{ fontSize: '0.82rem', background: '#059669', color: '#fff', border: 'none' }}
            onClick={onResolve}
          >
            <i className="bi bi-check2-circle me-1" />
            {resolveLabel}
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function WaiterPage() {
  const { tableId, customer, setCustomerName, setCustomerPhone } = useSession();
  const { t, language } = useLabels();
  const navigate = useNavigate();
  const isPt = language.startsWith('pt');
  const actionLabels = isPt ? ACTION_LABELS_PT : ACTION_LABELS_ES;
  const statusLabels = isPt ? STATUS_LABEL_PT : STATUS_LABEL_ES;

  const [open, setOpen] = useState(false);
  const [currentAction, setCurrentAction] = useState<ActionId>('call');
  const [name, setName] = useState(customer?.name ?? '');
  const [phone, setPhone] = useState(customer?.phone ?? '');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmation, setConfirmation] = useState<string | null>(null);
  const [confirmationVariant, setConfirmationVariant] = useState<'success' | 'info'>('success');
  const [calls, setCalls] = useState<WaiterCall[]>([]);

  const activeCalls = calls.filter((c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED');
  const pastCalls = calls.filter((c) => c.status === 'RESOLVED' || c.status === 'CANCELED');

  // Poll for call status updates
  useEffect(() => {
    if (!tableId) return;
    async function load() {
      const result = await waiterService.getCallsForTable(tableId!);
      setCalls(result);
    }
    load();
    const interval = setInterval(load, 4000);
    return () => clearInterval(interval);
  }, [tableId]);

  function showConfirmation(msg: string, variant: 'success' | 'info' = 'success') {
    setConfirmation(msg);
    setConfirmationVariant(variant);
    setTimeout(() => setConfirmation(null), 3500);
  }

  function hasActiveCall(): boolean {
    return activeCalls.length > 0;
  }

  function handleAction(id: ActionId) {
    if (id === 'order') {
      navigate('/account');
      return;
    }
    if (id === 'bill') {
      handleRequestBill();
      return;
    }
    // Check for existing active request (call or other)
    if (hasActiveCall()) {
      const dupeMsg = isPt
        ? 'Você já tem uma solicitação ativa. Aguarde o atendimento.'
        : 'Ya tienes una solicitud activa. Por favor espera atención.';
      showConfirmation(dupeMsg, 'info');
      return;
    }
    setCurrentAction(id);
    setName(customer?.name ?? '');
    setPhone(customer?.phone ?? '');
    setError(null);
    setOpen(true);
  }

  async function handleRequestBill() {
    if (!tableId) {
      showConfirmation(isPt ? 'Mesa não identificada.' : 'Mesa no identificada.', 'info');
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
      showConfirmation(isPt ? 'Não foi possível solicitar a conta. Tente novamente.' : 'No se pudo solicitar la cuenta. Intenta de nuevo.', 'info');
    } finally {
      setSubmitting(false);
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!tableId) {
      setError(isPt ? 'Mesa não identificada.' : 'Mesa no identificada.');
      return;
    }
    if (!phone.trim()) {
      setError(t('common.required'));
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const { ticketId } = await waiterService.callWaiter(tableId, {
        customerName: name.trim(),
        phone: phone.trim(),
        reason: currentAction,
      });
      if (name.trim()) setCustomerName(name.trim());
      if (phone.trim()) setCustomerPhone(phone.trim());
      setOpen(false);
      showConfirmation(t('waiter.sent'));
      // Optimistically add the new call to local state
      const now = new Date().toISOString();
      const tables = await import('@/lib/mock-db').then(m => m.getCollection<{ id: string; number: string }>('tables'));
      const table = tables.find((tb) => tb.id === tableId || tb.number === tableId);
      setCalls((prev) => [
        {
          id: ticketId,
          tenantId: '',
          branchId: '',
          tableId: table?.id ?? tableId,
          tableNumber: table?.number ?? tableId,
          customerName: name.trim(),
          phone: phone.trim(),
          reason: currentAction,
          status: 'PENDING',
          createdAt: now,
          updatedAt: now,
        },
        ...prev,
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'error');
    } finally {
      setSubmitting(false);
    }
  };

  async function handleCancelCall(id: string) {
    await waiterService.cancelCall(id);
    setCalls((prev) => prev.map((c) => c.id === id ? { ...c, status: 'CANCELED', updatedAt: new Date().toISOString() } : c));
    const msg = isPt ? 'Solicitação cancelada.' : 'Solicitud cancelada.';
    showConfirmation(msg, 'info');
  }

  async function handleResolveCall(id: string) {
    await waiterService.resolveCall(id);
    setCalls((prev) => prev.map((c) => c.id === id ? { ...c, status: 'RESOLVED', updatedAt: new Date().toISOString() } : c));
    const msg = isPt ? 'Solicitação marcada como resolvida.' : 'Solicitud marcada como resuelta.';
    showConfirmation(msg);
  }

  const cancelLabel = isPt ? 'Cancelar solicitação' : 'Cancelar solicitud';
  const resolveLabel = isPt ? 'Marcar como resolvida' : 'Marcar como resuelta';
  const activeTitle = isPt ? 'Solicitação em curso' : 'Solicitud en curso';
  const historyTitle = isPt ? 'Histórico' : 'Historial';

  return (
    <div className="ff-page">
      <TopBar title={t('waiter.title')} onBack={() => navigate('/menu')} />

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

      {/* Flash confirmation */}
      {confirmation && (
        <div
          role="status"
          style={{
            margin: '16px 16px 0',
            padding: 12,
            background: confirmationVariant === 'success' ? 'var(--ff-primary-soft)' : '#f0f9ff',
            color: confirmationVariant === 'success' ? 'var(--ff-primary)' : '#0369a1',
            borderRadius: 'var(--ff-radius-md)',
            fontSize: '0.9rem',
            fontWeight: 600,
            textAlign: 'center',
          }}
        >
          <i className={`bi ${confirmationVariant === 'success' ? 'bi-check-circle-fill' : 'bi-info-circle-fill'} me-1`} />
          {confirmation}
        </div>
      )}

      {/* Active requests */}
      {activeCalls.length > 0 && (
        <div style={{ padding: '16px 16px 0' }}>
          <p style={{ margin: '0 0 8px', fontSize: '0.8rem', fontWeight: 700, color: 'var(--ff-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {activeTitle}
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {activeCalls.map((call) => (
              <ActiveRequestCard
                key={call.id}
                call={call}
                actionLabel={actionLabels[(call.reason as ActionId) ?? 'call']}
                statusLabel={statusLabels[call.status]}
                cancelLabel={cancelLabel}
                resolveLabel={resolveLabel}
                onCancel={() => handleCancelCall(call.id)}
                onResolve={() => handleResolveCall(call.id)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Past requests (collapsed) */}
      {pastCalls.length > 0 && (
        <details style={{ padding: '12px 16px 0' }}>
          <summary style={{ fontSize: '0.8rem', color: 'var(--ff-text-muted)', cursor: 'pointer', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 6 }}>
            <i className="bi bi-clock-history" />
            {historyTitle} ({pastCalls.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {pastCalls.map((call) => (
              <ActiveRequestCard
                key={call.id}
                call={call}
                actionLabel={actionLabels[(call.reason as ActionId) ?? 'call']}
                statusLabel={statusLabels[call.status]}
                cancelLabel={cancelLabel}
                resolveLabel={resolveLabel}
                onCancel={() => handleCancelCall(call.id)}
                onResolve={() => handleResolveCall(call.id)}
              />
            ))}
          </div>
        </details>
      )}

      <div style={{ height: 24 }} />

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
