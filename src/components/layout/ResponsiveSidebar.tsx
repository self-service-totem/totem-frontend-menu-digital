import type { ReactNode } from 'react';

export interface SidebarNavItem {
  /** Stable key used for the active comparison and React key. */
  key: string;
  label: string;
  /** Bootstrap icon class, e.g. `bi-box`. */
  icon: string;
  /** Optional count badge (e.g. pending orders). */
  badge?: number;
}

export interface SidebarNavGroup {
  label: string;
  items: SidebarNavItem[];
}

export interface SidebarBranding {
  /** Logo image URL; falls back to `fallbackIcon` when absent. */
  logoUrl?: string;
  fallbackIcon?: string;
  name: string;
  /** Secondary line under the name, e.g. "Administração". */
  role?: string;
}

/**
 * Fixed desktop sidebar that becomes a slide-in drawer on mobile
 * (`ff-area-sidebar` / `ff-area-sidebar--open` + backdrop).
 *
 * Pure presentational shell: branding header, grouped nav, optional footer slot.
 * Navigation state is owned by the caller via `activeKey` / `onSelect`.
 */
export function ResponsiveSidebar({
  open,
  onClose,
  branding,
  groups,
  activeKey,
  onSelect,
  footer,
}: {
  open: boolean;
  onClose: () => void;
  branding: SidebarBranding;
  groups: SidebarNavGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
  footer?: ReactNode;
}) {
  return (
    <>
      {open && (
        <div
          className="ff-area-drawer-backdrop ff-area-drawer-backdrop--open"
          onClick={onClose}
        />
      )}

      <aside className={`ff-area-sidebar${open ? ' ff-area-sidebar--open' : ''}`}>
        <button className="ff-area-sidebar-close" onClick={onClose} aria-label="Fechar menu">
          <i className="bi bi-x-lg" />
        </button>

        <div className="ff-area-sidebar-logo">
          {branding.logoUrl ? (
            <img src={branding.logoUrl} alt="" className="ff-area-sidebar-logo-img" />
          ) : (
            <div className="ff-area-sidebar-logo-icon">
              <i className={`bi ${branding.fallbackIcon ?? 'bi-shop'}`} />
            </div>
          )}
          <div className="ff-area-sidebar-logo-text">
            <span className="ff-area-sidebar-logo-name">{branding.name}</span>
            {branding.role && <span className="ff-area-sidebar-logo-role">{branding.role}</span>}
          </div>
        </div>

        <nav className="ff-area-sidebar-nav">
          {groups.map((group) => (
            <div key={group.label}>
              <div className="ff-area-sidebar-group-label">{group.label}</div>
              {group.items.map((item) => (
                <button
                  key={item.key}
                  className={`ff-nav-item ${activeKey === item.key ? 'active' : ''}`}
                  onClick={() => onSelect(item.key)}
                >
                  <i className={`bi ${item.icon}`} />
                  {item.label}
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className="ff-nav-item-badge">{item.badge}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          {footer && (
            <div className="ff-area-sidebar-footer">{footer}</div>
          )}
        </nav>
      </aside>
    </>
  );
}
