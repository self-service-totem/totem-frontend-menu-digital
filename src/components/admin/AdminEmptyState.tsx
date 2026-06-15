import type { ReactNode } from 'react';

export function AdminEmptyState({
  icon = 'bi-inbox',
  title,
  message,
  action,
}: {
  icon?: string;
  title: string;
  message?: string;
  action?: ReactNode;
}) {
  return (
    <div className="ff-admin-empty-state">
      <div className="ff-admin-empty-state-icon">
        <i className={`bi ${icon}`} />
      </div>
      <div className="ff-admin-empty-state-title">{title}</div>
      {message && <div className="ff-admin-empty-state-message">{message}</div>}
      {action && <div className="ff-admin-empty-state-action">{action}</div>}
    </div>
  );
}
