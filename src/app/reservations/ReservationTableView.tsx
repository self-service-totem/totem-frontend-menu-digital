import { useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import { AdminTable, useSortable, AdminActionMenu } from '@/components/admin';
import type { AdminTableColumn, SortDir, ActionMenuItem } from '@/components/admin';
import type { Reservation, ReservationStatus, DbTable } from '@/lib/types';
import { TAG_CONFIG, SOURCE_CONFIG, fmtFullDate } from './reservationsUtils';
import { StatusBadge } from './StatusBadge';

type ReservationRow = Reservation & { _dateTime: string };

interface ReservationTableViewProps {
  reservations: Reservation[];
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

export function ReservationTableView({ reservations, tables, onStatusChange, onEdit }: ReservationTableViewProps) {
  const { t, language } = useLabels();
  const [sortBy, setSortBy] = useState('_dateTime');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  }

  const rows: ReservationRow[] = reservations.map((r) => ({ ...r, _dateTime: `${r.date} ${r.time}` }));
  const sorted = useSortable(rows, sortBy, sortDir);

  function getTableLabel(r: Reservation): string {
    if (r.tableNumber) return t('res.tableN', { n: r.tableNumber });
    if (r.tableId) {
      const tb = tables.find((x) => x.id === r.tableId);
      if (tb) return t('res.tableN', { n: tb.number });
    }
    return '';
  }

  function buildMenu(r: Reservation): ActionMenuItem[] {
    const isActive = ['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status);
    const items: ActionMenuItem[] = [];
    if (r.status === 'PENDING')   items.push({ key: 'confirm',  label: t('res.action.confirm'),     icon: 'bi-check-circle',      onClick: () => onStatusChange(r.id, 'CONFIRMED') });
    if (r.status === 'PENDING')   items.push({ key: 'seat-dir', label: t('res.action.seatDirect'),  icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
    if (r.status === 'CONFIRMED') items.push({ key: 'seat',     label: t('res.action.seat'),        icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
    if (r.status === 'SEATED')    items.push({ key: 'complete', label: t('res.action.complete'),    icon: 'bi-check2-all',        onClick: () => onStatusChange(r.id, 'COMPLETED') });
    if (isActive)                 items.push({ key: 'edit',     label: t('res.action.edit'),        icon: 'bi-pencil',            onClick: () => onEdit(r) });
    if (r.status === 'PENDING' || r.status === 'CONFIRMED') items.push({ key: 'no-show', label: t('res.action.noShow'), icon: 'bi-person-x-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'NO_SHOW') });
    if (isActive)                 items.push({ key: 'cancel',   label: t('res.action.cancel'),      icon: 'bi-x-circle-fill',     variant: 'destructive', onClick: () => onStatusChange(r.id, 'CANCELED') });
    if (r.status === 'CANCELED' || r.status === 'NO_SHOW') items.push({ key: 'reopen', label: t('res.action.reopen'), icon: 'bi-arrow-counterclockwise', onClick: () => onStatusChange(r.id, 'PENDING') });
    if (!isActive)                items.push({ key: 'view',     label: t('res.action.viewDetails'), icon: 'bi-eye',               onClick: () => onEdit(r) });
    return items;
  }

  const columns: AdminTableColumn<ReservationRow>[] = [
    {
      key: '_dateTime', label: t('res.col.dateTime'), sortable: true, width: '130px',
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: '#6b7280' }}>{fmtFullDate(r.date, language)}</div>
          <div style={{ fontWeight: 800, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums', color: '#1f2937' }}>{r.time}</div>
        </div>
      ),
    },
    {
      key: 'customerName', label: t('res.col.customer'), sortable: true,
      render: (r) => (
        <div>
          <div style={{ fontWeight: 600 }}>{r.customerName}</div>
          {(r.tags ?? []).length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginTop: 2 }}>
              {(r.tags ?? []).map((tag) => {
                const tc = TAG_CONFIG[tag];
                return (
                  <span key={tag} className="ff-res-tag" style={{ fontSize: '0.68rem', background: tc.bg, color: tc.color }}>
                    {t(tc.labelKey)}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'customerPhone', label: t('res.col.phone'), width: '130px',
      render: (r) => <span style={{ fontSize: '0.82rem', color: r.customerPhone ? '#374151' : '#d1d5db' }}>{r.customerPhone || '—'}</span>,
    },
    {
      key: 'partySize', label: t('res.col.guests'), sortable: true, align: 'center', width: '74px',
      render: (r) => <span style={{ fontWeight: 600 }}><i className="bi bi-people-fill me-1" style={{ fontSize: 11 }} />{r.partySize}</span>,
    },
    {
      key: 'tableNumber', label: t('res.col.table'), sortable: true, width: '86px',
      render: (r) => {
        const lbl = getTableLabel(r);
        return lbl
          ? <span style={{ fontWeight: 600 }}>{lbl}</span>
          : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{t('res.noTable')}</span>;
      },
    },
    {
      key: 'status', label: t('res.col.status'), sortable: true, width: '115px',
      render: (r) => <StatusBadge status={r.status} />,
    },
    {
      key: 'source', label: t('res.col.channel'), width: '90px',
      render: (r) => r.source ? (
        <span style={{ fontSize: '0.8rem', color: '#6b7280' }}>
          <i className={`bi ${SOURCE_CONFIG[r.source].icon} me-1`} />{t(SOURCE_CONFIG[r.source].labelKey)}
        </span>
      ) : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'notes', label: t('res.col.notes'), width: '140px',
      render: (r) => r.notes ? (
        <span style={{ fontSize: '0.78rem', color: '#92400e', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: 140 }}>{r.notes}</span>
      ) : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'actions', label: '', width: '44px',
      render: (r) => <AdminActionMenu items={buildMenu(r)} />,
    },
  ];

  return (
    <AdminTable
      columns={columns}
      rows={sorted}
      sortBy={sortBy}
      sortDir={sortDir}
      onSort={handleSort}
      emptyTitle={t('res.emptyTable.title')}
      emptyMessage={t('res.empty.desc')}
      emptyIcon="bi-calendar-x"
    />
  );
}
