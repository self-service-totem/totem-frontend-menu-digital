import type { ReactNode } from 'react';

export function AdminPageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="ff-admin-page-header">
      <div className="ff-admin-page-header-text">
        <h1 className="ff-admin-page-header-title">{title}</h1>
        {subtitle && <p className="ff-admin-page-header-subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="ff-admin-page-header-actions">{actions}</div>}
    </div>
  );
}
