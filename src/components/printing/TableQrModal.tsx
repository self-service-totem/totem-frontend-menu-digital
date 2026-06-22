import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { Modal } from '@/components/common/Modal';
import { PrimaryButton } from '@/components/common/PrimaryButton';
import { SecondaryButton } from '@/components/common/SecondaryButton';

interface TableQrModalProps {
  open: boolean;
  onClose: () => void;
}

const DEFAULT_BRANCH = 'branch-1';
const DEFAULT_TABLE_ID = '140';
const DEFAULT_TABLE_NUMBER = '14';

export function TableQrModal({ open, onClose }: TableQrModalProps) {
  const [tableNumber, setTableNumber] = useState(DEFAULT_TABLE_NUMBER);

  const menuUrl = `${window.location.origin}/menu/${DEFAULT_BRANCH}/table/${DEFAULT_TABLE_ID}`;

  function handlePrint() {
    const style = document.createElement('style');
    style.id = 'ff-qr-print-style';
    style.innerHTML = `
      @media print {
        body > * { visibility: hidden !important; }
        #ff-qr-printable, #ff-qr-printable * { visibility: visible !important; }
        #ff-qr-printable {
          position: fixed !important;
          top: 0 !important;
          left: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          display: flex !important;
          flex-direction: column !important;
          align-items: center !important;
          justify-content: center !important;
          background: #ffffff !important;
          gap: 24px !important;
        }
        #ff-qr-mesa-label {
          font-size: 52pt !important;
          font-weight: 900 !important;
          letter-spacing: .04em !important;
          color: #111 !important;
          font-family: system-ui, sans-serif !important;
        }
        #ff-qr-url-label {
          font-size: 11pt !important;
          color: #666 !important;
          font-family: monospace !important;
        }
      }
    `;
    document.head.appendChild(style);
    window.print();
    setTimeout(() => document.head.removeChild(style), 1000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Imprimir QR de Mesa">
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <label style={{ color: '#94a3b8', fontSize: 13, fontWeight: 600 }}>Mesa Nº</label>
          <input
            type="text"
            value={tableNumber}
            onChange={(e) => setTableNumber(e.target.value)}
            style={{
              width: 70,
              textAlign: 'center',
              fontSize: 18,
              fontWeight: 700,
              padding: '4px 8px',
              border: '1px solid var(--ff-border)',
              borderRadius: 6,
              background: 'var(--ff-surface)',
              color: 'var(--ff-text)',
            }}
          />
        </div>

        {/* Printable card */}
        <div
          id="ff-qr-printable"
          style={{
            background: '#ffffff',
            padding: '32px 40px',
            borderRadius: 12,
            border: '1px solid #e2e8f0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 20,
          }}
        >
          <div
            id="ff-qr-mesa-label"
            style={{
              fontSize: 36,
              fontWeight: 900,
              letterSpacing: '.04em',
              color: '#111',
              fontFamily: 'system-ui, sans-serif',
              lineHeight: 1,
            }}
          >
            MESA {tableNumber || DEFAULT_TABLE_NUMBER}
          </div>

          <QRCodeSVG
            value={menuUrl}
            size={300}
            level="H"
            marginSize={2}
            style={{ display: 'block' }}
          />

          <div
            id="ff-qr-url-label"
            style={{
              fontSize: 11,
              color: '#888',
              fontFamily: 'monospace',
              wordBreak: 'break-all',
              textAlign: 'center',
              maxWidth: 280,
            }}
          >
            {menuUrl}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          <SecondaryButton onClick={onClose} style={{ flex: 1 }}>
            Fechar
          </SecondaryButton>
          <PrimaryButton onClick={handlePrint} style={{ flex: 1 }}>
            <i className="bi bi-printer" /> Imprimir
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
