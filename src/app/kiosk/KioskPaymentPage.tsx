import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { kioskService } from '@/lib/services/kioskService';
import { branchService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import { useLabels } from '@/i18n/I18nContext';
import type { CartItem, QueueTicket, DbOrder, BranchPaymentMethods, PaymentMethodId } from '@/lib/types';
import { DEFAULT_PAYMENT_METHODS } from '@/lib/types';
import type { LabelKey } from '@/i18n/labels';
import { formatCurrency as formatBRL } from '@/utils/format';
import { printDemoTicket } from '@/lib/printing/demoTicket';
import { canAutoPrint } from '@/lib/printing/rawbt';
import { useKioskIdleTimeout, KioskIdleModal, KioskSteps } from './kioskShared';

// ─── Confirmation ─────────────────────────────────────────────────────────────

type PrintState = 'printing' | 'done';

function KioskConfirmationScreen({
  order,
  queueTicket,
  onReset,
}: {
  order: DbOrder;
  queueTicket: QueueTicket;
  onReset: () => void;
}) {
  const [countdown, setCountdown] = useState(30);
  const [printState, setPrintState] = useState<PrintState>('printing');
  const [helpSent, setHelpSent] = useState(false);
  const { t } = useLabels();

  const receiptUrl = `${window.location.origin}/receipt/${order.id}`;

  const printTicket = useCallback(() => {
    printDemoTicket({
      restaurantName: 'Pertinho do Céu',
      orderNumber: order.orderNumber,
      customerName: order.customerName,
      queueNumber: queueTicket.ticketNumber,
      items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })),
      itemCount: order.items.reduce((n, it) => n + it.quantity, 0),
      total: order.total,
      currency: 'BRL',
    });
    setTimeout(() => setPrintState('done'), 1800);
  }, [order, queueTicket]);

  // Auto-print on arrival. Native bridges don't need a gesture; plain Chrome does.
  useEffect(() => {
    if (canAutoPrint()) {
      printTicket();
    } else {
      setPrintState('printing');
      // Guard against touchstart + synthetic click both firing on the same touch.
      let fired = false;
      const onGesture = () => { if (fired) return; fired = true; printTicket(); };
      window.addEventListener('touchstart', onGesture, { once: true, passive: true });
      window.addEventListener('click', onGesture, { once: true });
      return () => {
        window.removeEventListener('touchstart', onGesture);
        window.removeEventListener('click', onGesture);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReset]);

  function handleReprint() {
    setPrintState('printing');
    printTicket();
  }

  function handleHelp() {
    if (helpSent) return;
    kioskService.createAlert({
      orderId: order.id,
      orderNumber: order.orderNumber,
      total: order.total,
      paymentStatus: order.paymentStatus,
      issueType: 'NEEDS_HELP',
      kioskNumber: 1,
    });
    setHelpSent(true);
  }

  return (
    <div className="ff-kiosk-layout ff-kiosk-confirm-layout">
      <KioskSteps current={4} allDone />

      <div className="ff-kiosk-confirm-body">

        {/* Success icon + title */}
        <div className="ff-kiosk-confirm-success-head">
          <i className="bi bi-check-circle-fill ff-kiosk-confirm-success-icon" />
          <div className="ff-kiosk-confirm-title ff-kiosk-confirm-title--inline">
            {t('kiosk.confirm.title')}
          </div>
        </div>

        {/* Comprobante card — the hero element */}
        <div className="ff-kiosk-receipt-card">
          <div className="ff-kiosk-receipt-label">{t('kiosk.confirm.orderLabel')}</div>
          <div className="ff-kiosk-receipt-number">{order.orderNumber}</div>
          <div className="ff-kiosk-receipt-photo-hint">{t('kiosk.confirm.photoHint')}</div>
          <div className={`ff-kiosk-print-badge${printState === 'done' ? ' done' : ''}`}>
            <i className={`bi ${printState === 'done' ? 'bi-printer-fill' : 'bi-hourglass-split'}`} />
            {printState === 'done' ? t('kiosk.confirm.printOk') : t('kiosk.confirm.printing')}
          </div>
        </div>

        {/* QR code */}
        <div className="ff-kiosk-qr-section">
          <div className="ff-kiosk-qr-box">
            <QRCodeSVG value={receiptUrl} size={140} level="M" />
          </div>
          <div className="ff-kiosk-qr-hint">{t('kiosk.confirm.qrHint')}</div>
        </div>

        {/* Queue number — secondary */}
        <div className="ff-kiosk-queue-secondary">
          <span className="ff-kiosk-queue-secondary-label">{t('kiosk.confirm.queueLabel')}</span>
          <span className="ff-kiosk-queue-secondary-number">{queueTicket.ticketNumber}</span>
        </div>

        {/* Action buttons */}
        <div className="ff-kiosk-confirm-actions">
          <button className="ff-kiosk-reprint-btn" onClick={handleReprint}>
            <i className="bi bi-printer" />
            {t('kiosk.confirm.reprintBtn')}
          </button>
          <button
            className={`ff-kiosk-help-btn${helpSent ? ' sent' : ''}`}
            onClick={handleHelp}
            disabled={helpSent}
          >
            <i className={`bi ${helpSent ? 'bi-check2' : 'bi-headset'}`} />
            {helpSent ? t('kiosk.confirm.helpSent') : t('kiosk.confirm.helpBtn')}
          </button>
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

type PaymentStep = 'select' | 'instruction' | 'qr' | 'processing' | 'result' | 'cashTicket';

const PAYMENT_METHODS: { id: PaymentMethodId; key: keyof BranchPaymentMethods; icon: string; labelKey: LabelKey; descKey: LabelKey }[] = [
  { id: 'CARD',         key: 'card',        icon: 'bi-credit-card-2-front', labelKey: 'kiosk.payment.card',        descKey: 'kiosk.payment.cardDesc' },
  { id: 'PIX',          key: 'pix',         icon: 'bi-qr-code-scan',        labelKey: 'kiosk.payment.pix',         descKey: 'kiosk.payment.pixDesc' },
  { id: 'MERCADO_PAGO', key: 'mercadoPago', icon: 'bi-wallet2',             labelKey: 'kiosk.payment.mercadoPago', descKey: 'kiosk.payment.mercadoPagoDesc' },
  { id: 'CASH',         key: 'cash',        icon: 'bi-cash-stack',          labelKey: 'kiosk.payment.cash',        descKey: 'kiosk.payment.cashDesc' },
];

/**
 * Decorative QR placeholder — no real payload is encoded; the kiosk payment flow
 * is a simulation. Renders deterministic modules plus three finder squares so it
 * visually reads as a scannable code.
 */
function KioskQRCode({ size = 220 }: { size?: number }) {
  const N = 25;
  const cell = size / N;
  const inFinderZone = (r: number, c: number) =>
    (r <= 6 && c <= 6) || (r <= 6 && c >= N - 7) || (r >= N - 7 && c <= 6);
  const finderOn = (r: number, c: number) => {
    const corners: [number, number][] = [[0, 0], [0, N - 7], [N - 7, 0]];
    return corners.some(([fr, fc]) => {
      const dr = r - fr, dc = c - fc;
      if (dr < 0 || dr > 6 || dc < 0 || dc > 6) return false;
      const ring = Math.max(Math.abs(dr - 3), Math.abs(dc - 3));
      return ring !== 2; // solid centre + outer ring, gap between
    });
  };
  const rects: React.ReactElement[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      const on = inFinderZone(r, c) ? finderOn(r, c) : ((r * 928371 + c * 1299721 + r * c) % 7) < 3;
      if (on) rects.push(<rect key={`${r}-${c}`} x={c * cell} y={r * cell} width={cell} height={cell} fill="#111827" />);
    }
  }
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="ff-kiosk-fakeqr">
      {rects}
    </svg>
  );
}

// ─── Cash ticket (pay at the counter) ────────────────────────────────────────

function KioskCashTicketScreen({
  order,
  total,
  itemCount,
  onReset,
}: {
  order: DbOrder;
  total: number;
  itemCount: number;
  onReset: () => void;
}) {
  const [countdown, setCountdown] = useState(20);
  const { t } = useLabels();

  // Auto-print on arrival (same gesture strategy as KioskConfirmationScreen).
  useEffect(() => {
    let fired = false;
    const doPrint = () => {
      if (fired) return;
      fired = true;
      printDemoTicket({
        restaurantName: 'Pertinho do Céu',
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        items: order.items.map((it) => ({ name: it.name, quantity: it.quantity, unitPrice: it.unitPrice })),
        itemCount,
        total,
        currency: 'BRL',
        footerNote: t('kiosk.payment.cashInstr'),
      });
    };

    if (canAutoPrint()) {
      doPrint();
    } else {
      window.addEventListener('touchstart', doPrint, { once: true, passive: true });
      window.addEventListener('click', doPrint, { once: true });
      return () => {
        window.removeEventListener('touchstart', doPrint);
        window.removeEventListener('click', doPrint);
      };
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (countdown <= 0) { onReset(); return; }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, onReset]);

  return (
    <div className="ff-kiosk-layout ff-kiosk-confirm-layout">
      <KioskSteps current={4} allDone />

      <div className="ff-kiosk-confirm-body">
        <div className="ff-kiosk-confirm-icon">
          <i className="bi bi-cash-coin" />
        </div>
        <div className="ff-kiosk-confirm-title">{t('kiosk.payment.cashTitle')}</div>
        <div className="ff-kiosk-confirm-subtitle">{t('kiosk.payment.cashSubtitle')}</div>

        <div className="ff-kiosk-ticket-box">
          <div className="ff-kiosk-ticket-label">{t('kiosk.payment.orderLabel')}</div>
          <div className="ff-kiosk-ticket-number">{order.orderNumber}</div>
          <div className="ff-kiosk-ticket-meta">
            <div className="ff-kiosk-ticket-meta-row">
              <span>{t('kiosk.payment.itemsLabel')}</span><span>{itemCount}</span>
            </div>
            <div className="ff-kiosk-ticket-meta-row ff-kiosk-ticket-meta-row--total">
              <span>{t('kiosk.payment.totalLabel')}</span><span>{formatBRL(total)}</span>
            </div>
          </div>
        </div>

        <div className="ff-kiosk-confirm-hint">{t('kiosk.payment.cashInstr')}</div>
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

export function KioskPaymentPage() {
  const [step, setStep]             = useState<PaymentStep>('select');
  const [methods, setMethods]       = useState<BranchPaymentMethods>(DEFAULT_PAYMENT_METHODS);
  const [method, setMethod]         = useState<PaymentMethodId | null>(null);
  const [result, setResult]         = useState<'approved' | 'rejected' | null>(null);
  const [order, setOrder]           = useState<DbOrder | null>(null);
  const [queueTicket, setQueueTicket] = useState<QueueTicket | null>(null);
  const notify   = useNotify();
  const navigate = useNavigate();
  const { t } = useLabels();
  // Reset abandoned sessions while choosing a method or after a rejection,
  // but never mid-payment (instruction/QR/processing/cash ticket have their own flow)
  const { warning, dismiss, goHome } = useKioskIdleTimeout(
    step === 'select' || (step === 'result' && result === 'rejected'),
  );

  const cart: CartItem[] = (() => {
    try { return JSON.parse(sessionStorage.getItem('ff_kiosk_cart') ?? '[]'); } catch { return []; }
  })();
  const serviceType = (sessionStorage.getItem('ff_kiosk_service') ?? 'EAT_IN') as 'EAT_IN' | 'TAKEAWAY';
  const total       = cart.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const itemCount   = cart.reduce((s, i) => s + i.quantity, 0);

  // Load the enabled payment methods configured in admin and preselect the first.
  useEffect(() => {
    branchService.get().then((b) => {
      const pm = b?.paymentMethods ?? DEFAULT_PAYMENT_METHODS;
      setMethods(pm);
      setMethod((prev) => prev ?? PAYMENT_METHODS.find((m) => pm[m.key])?.id ?? null);
    });
  }, []);

  const availableMethods = PAYMENT_METHODS.filter((m) => methods[m.key]);

  async function doPay() {
    setStep('processing');
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

  async function handleConfirm() {
    if (!method) return;
    if (method === 'CASH') {
      // Efectivo: registra el pedido sin enviarlo a cocina ni generar turno.
      // La caja confirma el pago y ahí sí genera el turno e imprime el ticket.
      const { order: o } = await kioskService.placeCashOrder('Cliente Totem', cart);
      setOrder(o);
      setStep('cashTicket');
      return;
    }
    setStep(method === 'CARD' ? 'instruction' : 'qr');
  }

  // Card instruction / QR screens auto-advance after a simulated 4s, then run
  // the (still randomized) approval — matching the legacy approved/rejected flow.
  useEffect(() => {
    if (step !== 'instruction' && step !== 'qr') return;
    const timer = setTimeout(() => { void doPay(); }, 4000);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  if (step === 'instruction') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div className="ff-kiosk-pay-center">
          <i className="bi bi-credit-card-2-front ff-kiosk-pay-icon" />
          <div className="ff-kiosk-pay-heading">{t('kiosk.payment.cardInstrTitle')}</div>
          <div className="ff-kiosk-pay-sub">{t('kiosk.payment.cardInstrDesc')}</div>
          <div className="spinner-border text-primary ff-kiosk-spin-40" />
          <div className="ff-kiosk-processing-text">{t('kiosk.payment.waiting')}</div>
        </div>
      </div>
    );
  }

  if (step === 'qr') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div className="ff-kiosk-pay-center">
          <div className="ff-kiosk-pay-heading--tight">{t('kiosk.payment.qrTitle')}</div>
          <div className="ff-kiosk-pay-sub--tight">{t('kiosk.payment.qrDesc')}</div>
          <div className="ff-kiosk-pay-qrwrap">
            <KioskQRCode size={220} />
          </div>
          <div className="ff-kiosk-pay-waitrow">
            <div className="spinner-border text-primary ff-kiosk-spin-28" />
            <span className="ff-kiosk-pay-wait-text">{t('kiosk.payment.waiting')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === 'cashTicket' && order) {
    return (
      <KioskCashTicketScreen
        order={order}
        total={total}
        itemCount={itemCount}
        onReset={() => {
          sessionStorage.removeItem('ff_kiosk_cart');
          sessionStorage.removeItem('ff_kiosk_service');
          navigate('/kiosk/start');
        }}
      />
    );
  }

  if (step === 'processing') {
    return (
      <div className="ff-kiosk-layout ff-kiosk-loading">
        <div className="spinner-border text-primary ff-kiosk-spin-64" />
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
        <div className="ff-kiosk-pay-center--narrow">
          <div className="ff-kiosk-pay-reject-x">✕</div>
          <div className="ff-kiosk-pay-reject-title">{t('kiosk.payment.rejected')}</div>
          <div className="ff-kiosk-pay-reject-desc">
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
      {/* Compact ordering nav */}
      <div className="ff-kiosk-ordernav">
        <button className="ff-kiosk-ordernav-back" onClick={() => navigate(-1)}>
          <i className="bi bi-arrow-left" />
        </button>
        <KioskSteps current={3} compact />
      </div>

      <div className="ff-kiosk-payment-body">
        <div className="ff-kiosk-payment-total-box">
          <div className="ff-kiosk-payment-total-label">{t('kiosk.payment.totalLabel')}</div>
          <div className="ff-kiosk-payment-total-amount">{formatBRL(total)}</div>
        </div>

        <div className="ff-kiosk-payment-label">{t('kiosk.payment.how')}</div>

        <div className="ff-kiosk-payment-options">
          {availableMethods.map(({ id, icon, labelKey, descKey }) => (
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

      <div className="ff-kiosk-cart-bottom ff-kiosk-cart-bottom--end">
        <button
          className="ff-kiosk-pay-btn ff-kiosk-pay-btn--narrow"
          onClick={handleConfirm}
          disabled={!method}
        >
          {t('kiosk.payment.confirm')} <i className="bi bi-arrow-right" />
        </button>
      </div>

      {warning && <KioskIdleModal onContinue={dismiss} onRestart={goHome} />}
    </div>
  );
}
