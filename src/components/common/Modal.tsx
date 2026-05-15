import { useEffect, type ReactNode } from 'react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
}

export function Modal({ open, onClose, title, description, children }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'ff-modal-title' : undefined}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        display: 'flex',
        alignItems: 'flex-end',
        justifyContent: 'center',
        zIndex: 100,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff',
          borderRadius: 'var(--ff-radius-md)',
          width: '100%',
          maxWidth: 'var(--ff-content-max)',
          padding: 20,
          boxShadow: '0 -8px 30px rgba(0,0,0,0.15)',
          marginBottom: 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        {title !== undefined && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              gap: 12,
              marginBottom: description ? 6 : 12,
            }}
          >
            {title ? (
              <h2 id="ff-modal-title" style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700 }}>
                {title}
              </h2>
            ) : (
              <span />
            )}
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar"
              className="ff-iconbtn"
              style={{ width: 32, height: 32, fontSize: '0.9rem' }}
            >
              <i className="bi bi-x-lg" />
            </button>
          </div>
        )}
        {description && (
          <p style={{ margin: '0 0 14px', color: 'var(--ff-text-muted)', fontSize: '0.88rem' }}>
            {description}
          </p>
        )}
        {children}
      </div>
    </div>
  );
}
