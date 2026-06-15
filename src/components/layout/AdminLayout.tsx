import { useState, type ReactNode } from 'react';
import { AdminTopBar, type Breadcrumb } from './AdminTopBar';
import {
  ResponsiveSidebar,
  type SidebarBranding,
  type SidebarNavGroup,
} from './ResponsiveSidebar';

/**
 * Standard shell for admin / operational back-office screens.
 *
 * Composes `ff-area-layout` = fixed {@link ResponsiveSidebar} + main column
 * (`ff-area-main`) containing a fixed {@link AdminTopBar} and a single
 * scrollable content region (`ff-area-content`). Only the content scrolls.
 *
 * Owns the sidebar drawer open/close state internally. Callers provide the nav
 * config, branding, the active section key, a select handler, and the page
 * content as children. This is the canonical layout for the screen types listed
 * in docs/UI_STANDARDS.md (operational list / CRUD table / form / report).
 */
export function AdminLayout({
  branding,
  groups,
  activeKey,
  onSelect,
  breadcrumb,
  title,
  topBarRight,
  sidebarFooter,
  children,
}: {
  branding: SidebarBranding;
  groups: SidebarNavGroup[];
  activeKey: string;
  onSelect: (key: string) => void;
  breadcrumb?: Breadcrumb;
  title?: string;
  topBarRight?: ReactNode;
  sidebarFooter?: ReactNode;
  children: ReactNode;
}) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  function handleSelect(key: string) {
    onSelect(key);
    setDrawerOpen(false);
  }

  return (
    <div className="ff-area-layout">
      <ResponsiveSidebar
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        branding={branding}
        groups={groups}
        activeKey={activeKey}
        onSelect={handleSelect}
        footer={sidebarFooter}
      />

      <div className="ff-area-main">
        <AdminTopBar
          title={title}
          breadcrumb={breadcrumb}
          onOpenMenu={() => setDrawerOpen(true)}
          right={topBarRight}
        />
        <div className="ff-area-content">{children}</div>
      </div>
    </div>
  );
}
