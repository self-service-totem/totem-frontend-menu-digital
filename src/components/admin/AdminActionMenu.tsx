import { useEffect, useRef, useState } from 'react';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

export function AdminActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  return (
    <div className="ff-admin-action-menu" ref={ref} onClick={(e) => e.stopPropagation()}>
      <button
        className="ff-admin-action-menu-trigger"
        onClick={() => setOpen((o) => !o)}
        type="button"
        aria-label="Ações"
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && (
        <div className="ff-admin-action-menu-dropdown">
          {items.map((item) => (
            <button
              key={item.key}
              className={`ff-admin-action-menu-item${item.variant === 'destructive' ? ' ff-admin-action-menu-item--destructive' : ''}`}
              onClick={() => { item.onClick(); setOpen(false); }}
              type="button"
            >
              {item.icon && <i className={`bi ${item.icon}`} />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
