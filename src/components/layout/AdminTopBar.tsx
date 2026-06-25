import type { ReactNode } from 'react';

export interface Breadcrumb {
  /** Leading segment, e.g. the tenant/brand name. */
  root: string;
  /** Active (current) segment shown after the separator. */
  active: string;
}

/**
 * Fixed top bar for admin/operational layouts (`ff-area-topbar`).
 *
 * Renders the mobile hamburger (to open the sidebar drawer), a breadcrumb or a
 * plain title, and an optional right-hand slot (clock, status, avatar, actions).
 *
 * Stays fixed while only the content area below scrolls — see docs/UI_STANDARDS.md.
 *
 * NOTE: distinct from the customer-facing `TopBar` (`ff-topbar`, back button).
 */
export function AdminTopBar({
  title,
  breadcrumb,
  onOpenMenu,
  right,
}: {
  title?: string;
  breadcrumb?: Breadcrumb;
  onOpenMenu?: () => void;
  right?: ReactNode;
}) {
  return (
    <div className="ff-area-topbar">
      {onOpenMenu && (
        <button className="ff-area-hamburger" onClick={onOpenMenu} aria-label="Abrir menu">
          <i className="bi bi-list" />
        </button>
      )}

      {breadcrumb ? (
        <div className="ff-area-topbar-breadcrumb">
          <span>{breadcrumb.root}</span>
          <span className="ff-area-topbar-breadcrumb-sep">›</span>
          <span className="ff-area-topbar-breadcrumb-active">{breadcrumb.active}</span>
        </div>
      ) : (
        title && <div className="ff-area-topbar-title">{title}</div>
      )}

      {right && <div className="ff-area-topbar-right">{right}</div>}
    </div>
  );
}
