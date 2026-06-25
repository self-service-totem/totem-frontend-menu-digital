import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/common/Modal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';
import { useLabels } from '@/i18n/I18nContext';
import { demoCard } from '@/lib/printing/demoCard';
import { printBusinessCard } from '@/lib/printing/demoTicket';

interface CardPreviewModalProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Vista previa en pantalla de la "tarjeta" comercial antes de imprimirla.
 * Imita el papel térmico (angosto, monoespaciado, centrado) y muestra un QR
 * real generado localmente. El botón Imprimir dispara RawBT (solo Android).
 */
export function CardPreviewModal({ open, onClose }: CardPreviewModalProps) {
  const { t } = useLabels();

  return (
    <Modal open={open} onClose={onClose} title={t('hub.cardPreviewTitle')}>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {/* Papel */}
        <div
          style={{
            width: 280,
            background: '#fff',
            color: '#111',
            fontFamily: "'Courier New', ui-monospace, monospace",
            textAlign: 'center',
            padding: '22px 18px',
            border: '1px solid var(--ff-border)',
            borderRadius: 6,
            boxShadow: '0 1px 6px rgba(0,0,0,.1)',
          }}
        >
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '.04em' }}>
            {demoCard.product}
          </div>
          <div style={{ fontSize: 12, margin: '6px 0 16px' }}>{demoCard.tagline}</div>

          <QRCodeSVG value={demoCard.url} size={150} level="M" />

          <div style={{ fontSize: 13, fontWeight: 700, marginTop: 16 }}>{demoCard.web}</div>
          <div style={{ fontSize: 12, marginTop: 4 }}>{demoCard.sellerName}</div>
          <div style={{ fontSize: 12 }}>{demoCard.phone}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, marginTop: 18 }}>
        <SecondaryButton onClick={onClose} style={{ flex: 1 }}>
          {t('common.close')}
        </SecondaryButton>
        <PrimaryButton onClick={() => printBusinessCard()} style={{ flex: 1 }}>
          <i className="bi bi-printer" /> {t('hub.printCard')}
        </PrimaryButton>
      </div>
    </Modal>
  );
}
