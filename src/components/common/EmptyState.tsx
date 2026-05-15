import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ icon = 'bi-inbox', title, description, action }: EmptyStateProps) {
  return (
    <div className="ff-empty">
      <i className={`bi ${icon}`} aria-hidden />
      <p style={{ fontWeight: 600, color: 'var(--ff-text)', margin: '0 0 4px' }}>{title}</p>
      {description && <p style={{ margin: 0, fontSize: '0.85rem' }}>{description}</p>}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  );
}
