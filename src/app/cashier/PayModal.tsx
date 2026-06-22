import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import { format } from '@/i18n/labels';
import { formatCurrency as formatBRL } from '@/utils/format';
import { AdminModal } from '@/components/admin';
import type { PaymentMethod } from '@/lib/types';
import { METHOD_CONFIG, nextRoundAmount } from './cashierUtils';
import './cashier.css';

interface PayModalProps {
  title: string;
  subtitle: string;
  totalDue: number;
  paidAmount: number;
  initialMode?: 'full' | 'partial';
  onClose: () => void;
  onPay: (amount: number, method: PaymentMethod) => Promise<void>;
}

export function PayModal({ title, subtitle, totalDue, paidAmount, initialMode = 'full', onClose, onPay }: PayModalProps) {
  const { t } = useLabels();
  const remaining = +(totalDue - paidAmount).toFixed(2);
  const [method, setMethod] = useState<PaymentMethod>('PIX');
  const [mode, setMode] = useState<'full' | 'partial'>(initialMode);
  const [customAmount, setCustomAmount] = useState(String(remaining));
  const [cashGiven, setCashGiven] = useState(() => String(nextRoundAmount(remaining)));
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const METHOD_LABELS: Record<PaymentMethod, string> = {
    CASH: t('cashier.method.cash'),
    CARD: t('cashier.method.card'),
    PIX: t('cashier.method.pix'),
    EXTERNAL_TERMINAL: t('cashier.method.terminal'),
  };

  const payAmount = mode === 'full' ? remaining : Math.min(parseFloat(customAmount) || 0, remaining);
  const cashGivenNum = parseFloat(cashGiven) || 0;
  const troco = method === 'CASH' && cashGivenNum >= payAmount && payAmount > 0
    ? +(cashGivenNum - payAmount).toFixed(2)
    : null;

  async function handlePay() {
    if (payAmount <= 0) return;
    setLoading(true);
    try {
      await onPay(payAmount, method);
      const isFullyPaid = +(remaining - payAmount).toFixed(2) <= 0;
      if (isFullyPaid) { setDone(true); return; }
    } finally {
      setLoading(false);
    }
    onClose();
  }

  if (done) {
    return (
      <AdminModal
        title={t('cashier.pay.done')}
        onClose={onClose}
        footer={
          <>
            <button className="btn btn-outline-secondary flex-1" style={{ fontSize: 13 }} onClick={() => window.print()}>
              <i className="bi bi-printer me-1" />{t('cashier.pay.print')}
            </button>
            <button className="btn btn-success flex-1" style={{ fontWeight: 700 }} onClick={onClose}>
              {t('cashier.pay.close')}
            </button>
          </>
        }
      >
        <div className="ff-csh-center-col">
          <div className="ff-csh-success-circle">
            <i className="bi bi-check2-circle" style={{ color: '#059669' }} />
          </div>
          <div style={{ fontSize: 14, color: '#6b7280' }}>{subtitle}</div>
          {troco !== null && troco > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '14px 24px', width: '100%' }}>
              <div style={{ fontSize: 11, color: '#059669', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.08em' }}>{t('cashier.pay.change')}</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: '#059669', letterSpacing: '-0.02em' }}>{formatBRL(troco)}</div>
            </div>
          )}
        </div>
      </AdminModal>
    );
  }

  const canConfirm = payAmount > 0 && !(method === 'CASH' && cashGivenNum < payAmount);

  return (
    <AdminModal
      title={title}
      onClose={onClose}
      footer={
        <>
          <button
            className="btn btn-success flex-1"
            style={{ fontWeight: 800, fontSize: 15, padding: '10px 0', opacity: canConfirm && !loading ? 1 : 0.5 }}
            onClick={handlePay}
            disabled={!canConfirm || loading}
          >
            {loading ? (
              <><span className="spinner-border spinner-border-sm me-1" />{t('cashier.pay.processing')}</>
            ) : (
              <><i className="bi bi-check2-circle me-1" />{format(t('cashier.pay.receive'), { amount: formatBRL(payAmount) })}</>
            )}
          </button>
          <button onClick={onClose} className="btn btn-outline-secondary">
            {t('cashier.pay.cancel')}
          </button>
        </>
      }
    >
      {/* subtitle metadata */}
      <div style={{ fontSize: 12, color: '#9ca3af', marginTop: -8 }}>{subtitle}</div>
      <div>
          {/* Amount summary */}
          <div style={{ background: '#f9fafb', borderRadius: 12, border: '1px solid #e5e7eb', overflow: 'hidden' }}>
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f3f4f6' }}>
                <span style={{ fontSize: 13, color: '#6b7280' }}>{t('cashier.pay.totalDue')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#374151' }}>{formatBRL(totalDue)}</span>
              </div>
            )}
            {paidAmount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 16px', borderBottom: '1px solid #f3f4f6', background: '#f0fdf4' }}>
                <span style={{ fontSize: 13, color: '#059669' }}>{t('cashier.pay.alreadyPaid')}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: '#059669' }}>{formatBRL(paidAmount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px' }}>
              <span style={{ fontWeight: 700, fontSize: 14, color: '#1a1a1a' }}>{t('cashier.pay.amountDue')}</span>
              <span style={{ fontWeight: 900, fontSize: 28, color: '#e11d2a', letterSpacing: '-0.02em' }}>{formatBRL(remaining)}</span>
            </div>
          </div>

          {/* Full / partial toggle */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: 8 }}>{t('cashier.pay.chargeMode')}</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                style={{ flex: 1, padding: '10px', border: `2px solid ${mode === 'full' ? '#1d4ed8' : '#e5e7eb'}`, borderRadius: 10, background: mode === 'full' ? '#eff6ff' : '#fff', color: mode === 'full' ? '#1d4ed8' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => setMode('full')}
              >
                <i className="bi bi-check-all me-1" />{t('cashier.pay.remaining')}
              </button>
              <button
                style={{ flex: 1, padding: '10px', border: `2px solid ${mode === 'partial' ? '#d97706' : '#e5e7eb'}`, borderRadius: 10, background: mode === 'partial' ? '#fffbeb' : '#fff', color: mode === 'partial' ? '#d97706' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all .15s' }}
                onClick={() => setMode('partial')}
              >
                <i className="bi bi-scissors me-1" />{t('cashier.pay.partial')}
              </button>
            </div>
            {mode === 'partial' && (
              <div style={{ marginTop: 10 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 6 }}>{t('cashier.pay.amountDue')}</label>
                <input
                  className="form-control"
                  type="number"
                  min={0.01}
                  max={remaining}
                  step={0.01}
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  style={{ fontSize: 20, fontWeight: 700, textAlign: 'right', borderRadius: 10 }}
                />
                {payAmount > 0 && payAmount < remaining && (
                  <div style={{ marginTop: 6, fontSize: 12, color: '#d97706', fontWeight: 600 }}>
                    <i className="bi bi-info-circle me-1" />{t('cashier.pay.remainingAfter')} {formatBRL(+(remaining - payAmount).toFixed(2))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment method */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.07em', color: '#9ca3af', marginBottom: 8 }}>{t('cashier.pay.method')}</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {(Object.keys(METHOD_CONFIG) as PaymentMethod[]).map((m) => {
                const cfg = METHOD_CONFIG[m];
                const active = method === m;
                return (
                  <button
                    key={m}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', border: `2px solid ${active ? cfg.color : '#e5e7eb'}`, borderRadius: 10, background: active ? `${cfg.color}10` : '#fff', color: active ? cfg.color : '#374151', fontWeight: 700, fontSize: 14, cursor: 'pointer', transition: 'all .15s' }}
                    onClick={() => setMethod(m)}
                  >
                    <i className={`bi ${cfg.icon}`} style={{ fontSize: 20 }} />
                    {METHOD_LABELS[m]}
                    {active && <i className="bi bi-check-circle-fill ms-auto" style={{ fontSize: 14 }} />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Cash: amount given + change */}
          {method === 'CASH' && (
            <div style={{ background: '#fffbeb', border: '1px solid #fde68a', borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: '#92400e', display: 'block', marginBottom: 6 }}>
                  <i className="bi bi-cash-coin me-1" />{t('cashier.pay.cashGiven')}
                </label>
                <input
                  className="form-control"
                  type="number"
                  min={payAmount}
                  step={0.01}
                  value={cashGiven}
                  onChange={(e) => setCashGiven(e.target.value)}
                  style={{ fontSize: 22, fontWeight: 700, textAlign: 'right', borderRadius: 10, borderColor: '#fde68a' }}
                />
                <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                  {[payAmount, nextRoundAmount(payAmount), nextRoundAmount(payAmount) + 10]
                    .filter((v, i, arr) => arr.indexOf(v) === i && v > 0)
                    .map((v) => (
                      <button key={v} onClick={() => setCashGiven(String(v))} style={{ padding: '5px 12px', border: '1.5px solid #f59e0b', borderRadius: 8, background: '#fff', color: '#d97706', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
                        {formatBRL(v)}
                      </button>
                    ))}
                </div>
              </div>
              {troco !== null && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: troco > 0 ? '#f0fdf4' : '#fef2f2', borderRadius: 10, padding: '12px 16px', border: `1px solid ${troco > 0 ? '#bbf7d0' : '#fca5a5'}` }}>
                  <span style={{ fontWeight: 700, color: troco > 0 ? '#059669' : '#dc2626', fontSize: 14 }}>
                    <i className={`bi ${troco > 0 ? 'bi-arrow-left-right' : 'bi-exclamation-triangle'} me-1`} />
                    {t('cashier.pay.change')}
                  </span>
                  <span style={{ fontWeight: 900, fontSize: 26, color: troco > 0 ? '#059669' : '#dc2626', letterSpacing: '-0.02em' }}>{formatBRL(troco)}</span>
                </div>
              )}
            </div>
          )}
      </div>
    </AdminModal>
  );
}
