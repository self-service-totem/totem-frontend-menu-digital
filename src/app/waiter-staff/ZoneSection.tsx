import { useState } from 'react';
import type { FloorTable } from '@/lib/services/waiterStaffService';
import { alertPriority } from './waiterUtils';
import type { TableCardProps } from './TableCard';
import { TableCard } from './TableCard';

interface ZoneSectionProps {
  zone: string;
  tables: FloorTable[];
  cardProps: Omit<TableCardProps, 'table'>;
}

export function ZoneSection({ zone, tables, cardProps }: ZoneSectionProps) {
  const [collapsed, setCollapsed] = useState(false);
  const alertCount  = tables.filter((t) => alertPriority(t) > 0).length;
  const waiterNames = [...new Set(tables.map((t) => t.assignedWaiterName).filter(Boolean))];

  return (
    <div className="ff-waiter-zone-section">
      <div
        className="ff-waiter-zone-header"
        style={{ marginBottom: collapsed ? 0 : 14 }}
        onClick={() => setCollapsed((v) => !v)}
      >
        <i className={`bi bi-chevron-${collapsed ? 'right' : 'down'}`} style={{ color: '#d1d5db', fontSize: '0.7rem', flexShrink: 0 }} />
        <span className="ff-waiter-zone-title">{zone}</span>
        <span className="ff-waiter-zone-count">· {tables.length} mesa{tables.length !== 1 ? 's' : ''}</span>
        {waiterNames.length > 0 && (
          <span className="ff-waiter-zone-waiter">· {waiterNames.join(', ')}</span>
        )}
        {alertCount > 0 && (
          <span className="ff-waiter-zone-alert">
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '0.62rem' }} />
            {alertCount} alerta{alertCount > 1 ? 's' : ''}
          </span>
        )}
        <div className="ff-waiter-zone-line" />
      </div>

      {!collapsed && (
        <div className="ff-waiter-zone-grid">
          {tables.map((t) => (
            <TableCard key={t.id} table={t} {...cardProps} />
          ))}
        </div>
      )}
    </div>
  );
}
