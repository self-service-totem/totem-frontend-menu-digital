import type { ReactNode } from 'react';
import { AdminEmptyState } from './AdminEmptyState';
import { AdminLoadingSkeleton } from './AdminLoadingSkeleton';

export type SortDir = 'asc' | 'desc';

export interface AdminTableColumn<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  width?: string;
  align?: 'left' | 'center' | 'right';
  className?: string;
}

export function AdminTable<T extends { id: string }>({
  columns,
  rows,
  sortBy,
  sortDir,
  onSort,
  onRowClick,
  selectedId,
  loading = false,
  emptyTitle = 'Nenhum resultado',
  emptyMessage = 'Nenhum item encontrado com os filtros selecionados.',
  emptyIcon = 'bi-inbox',
}: {
  columns: AdminTableColumn<T>[];
  rows: T[];
  sortBy?: string;
  sortDir?: SortDir;
  onSort?: (key: string) => void;
  onRowClick?: (row: T) => void;
  selectedId?: string;
  loading?: boolean;
  emptyTitle?: string;
  emptyMessage?: string;
  emptyIcon?: string;
}) {
  if (loading) {
    return (
      <div className="ff-admin-card">
        <AdminLoadingSkeleton rows={6} />
      </div>
    );
  }

  return (
    <div className="ff-admin-table-wrapper">
      <table className="ff-admin-table">
        <thead>
          <tr>
            {columns.map((col) => {
              const isSorted = sortBy === col.key;
              const thCls = [
                col.sortable ? 'ff-admin-table-th--sortable' : '',
                isSorted ? 'ff-admin-table-th--sorted' : '',
                col.align ? `ff-admin-table-cell--${col.align}` : '',
              ].filter(Boolean).join(' ');

              return (
                <th
                  key={col.key}
                  className={thCls}
                  style={col.width ? { width: col.width } : undefined}
                  onClick={col.sortable && onSort ? () => onSort(col.key) : undefined}
                >
                  {col.label}
                  {col.sortable && (
                    <span className="ff-admin-table-sort-icon">
                      {isSorted
                        ? <i className={`bi bi-arrow-${sortDir === 'asc' ? 'up' : 'down'}`} />
                        : <i className="bi bi-arrow-down-up" />}
                    </span>
                  )}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="ff-admin-table-empty-cell">
                <AdminEmptyState icon={emptyIcon} title={emptyTitle} message={emptyMessage} />
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={row.id}
                className={[
                  onRowClick ? 'ff-admin-table-tr--clickable' : '',
                  selectedId === row.id ? 'ff-admin-table-tr--selected' : '',
                ].filter(Boolean).join(' ')}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={[col.align ? `ff-admin-table-cell--${col.align}` : '', col.className ?? ''].filter(Boolean).join(' ') || undefined}
                  >
                    {col.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export function useSortable<T>(
  rows: T[],
  sortBy: string,
  sortDir: SortDir,
): T[] {
  return [...rows].sort((a, b) => {
    const av = (a as Record<string, unknown>)[sortBy];
    const bv = (b as Record<string, unknown>)[sortBy];
    if (av == null && bv == null) return 0;
    if (av == null) return 1;
    if (bv == null) return -1;
    const cmp = av < bv ? -1 : av > bv ? 1 : 0;
    return sortDir === 'asc' ? cmp : -cmp;
  });
}
