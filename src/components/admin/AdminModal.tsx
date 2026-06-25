import { useEffect, type ReactNode } from 'react';

export function AdminModal({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">{title}</span>
          <button className="ff-order-drawer-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="ff-admin-modal-body">{children}</div>
        <div className="ff-admin-modal-footer">{footer}</div>
      </div>
    </div>
  );
}
