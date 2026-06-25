import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

export interface ActionMenuItem {
  key: string;
  label: string;
  icon?: string;
  variant?: 'default' | 'destructive';
  onClick: () => void;
}

export function AdminActionMenu({ items }: { items: ActionMenuItem[] }) {
  const [open, setOpen] = useState(false);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  function openMenu() {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropdownStyle({
      position: 'fixed',
      top: rect.bottom + 4,
      right: window.innerWidth - rect.right,
    });
    setOpen(true);
  }

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return;
      setOpen(false);
    }
    function onScroll() { setOpen(false); }
    document.addEventListener('mousedown', onClickOutside);
    document.addEventListener('scroll', onScroll, true);
    return () => {
      document.removeEventListener('mousedown', onClickOutside);
      document.removeEventListener('scroll', onScroll, true);
    };
  }, [open]);

  return (
    <div className="ff-admin-action-menu" onClick={(e) => e.stopPropagation()}>
      <button
        ref={triggerRef}
        className="ff-admin-action-menu-trigger"
        onClick={() => open ? setOpen(false) : openMenu()}
        type="button"
        aria-label="Ações"
      >
        <i className="bi bi-three-dots-vertical" />
      </button>
      {open && createPortal(
        <div ref={dropdownRef} className="ff-admin-action-menu-dropdown" style={dropdownStyle}>
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
        </div>,
        document.body
      )}
    </div>
  );
}
