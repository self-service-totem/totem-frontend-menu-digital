import type { ReactNode } from 'react';

export function AdminCard({
  header,
  headerRight,
  children,
  className = '',
  noPad = false,
}: {
  header?: ReactNode;
  headerRight?: ReactNode;
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div className={`ff-admin-card ${className}`.trim()}>
      {(header || headerRight) && (
        <div className="ff-admin-card-header">
          {header && <span className="ff-admin-card-header-title">{header}</span>}
          {headerRight && <div className="ff-admin-card-header-right">{headerRight}</div>}
        </div>
      )}
      <div className={noPad ? '' : 'ff-admin-card-body'}>{children}</div>
    </div>
  );
}
