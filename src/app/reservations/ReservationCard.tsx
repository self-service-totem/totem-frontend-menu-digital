import { useLabels } from '@/i18n/I18nContext';
import { AdminActionMenu } from '@/components/admin';
import type { ActionMenuItem } from '@/components/admin';
import type { Reservation, ReservationStatus, DbTable } from '@/lib/types';
import { TAG_CONFIG, SOURCE_CONFIG, getUrgencySignal } from './reservationsUtils';
import { StatusBadge } from './StatusBadge';

export interface ReservationCardProps {
  r: Reservation;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

export function ReservationCard({ r, tables, onStatusChange, onEdit }: ReservationCardProps) {
  const { t } = useLabels();
  const urgency = getUrgencySignal(r, t);

  const tableLabel = r.tableNumber
    ? t('res.tableN', { n: r.tableNumber })
    : r.tableId
    ? t('res.tableN', { n: tables.find((tb) => tb.id === r.tableId)?.number ?? r.tableId })
    : null;

  const isActive = ['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status);

  function getPrimaryAction(): { label: string; nextStatus: ReservationStatus; cls: string } | null {
    if (r.status === 'PENDING')   return { label: t('res.action.confirm'),  nextStatus: 'CONFIRMED', cls: 'btn-success' };
    if (r.status === 'CONFIRMED') return { label: t('res.action.seat'),     nextStatus: 'SEATED',    cls: 'btn-primary' };
    if (r.status === 'SEATED')    return { label: t('res.action.complete'), nextStatus: 'COMPLETED', cls: 'btn-success' };
    return null;
  }

  const primary = getPrimaryAction();

  const menuItems: ActionMenuItem[] = [];
  if (r.status === 'PENDING') menuItems.push({ key: 'seat-direct', label: t('res.action.seatDirect'), icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
  if (isActive) menuItems.push({ key: 'edit', label: t('res.action.editReservation'), icon: 'bi-pencil', onClick: () => onEdit(r) });
  if (r.status === 'PENDING' || r.status === 'CONFIRMED') menuItems.push({ key: 'no-show', label: t('res.action.noShow'), icon: 'bi-person-x-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'NO_SHOW') });
  if (isActive) menuItems.push({ key: 'cancel', label: t('res.action.cancelReservation'), icon: 'bi-x-circle-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'CANCELED') });
  if (r.status === 'CANCELED' || r.status === 'NO_SHOW') menuItems.push({ key: 'reopen', label: t('res.action.reopenPending'), icon: 'bi-arrow-counterclockwise', onClick: () => onStatusChange(r.id, 'PENDING') });
  if (!isActive) menuItems.push({ key: 'view', label: t('res.action.viewDetails'), icon: 'bi-eye', onClick: () => onEdit(r) });

  return (
    <div className={`ff-res-card s-${r.status.toLowerCase()}`}>
      {/* Time column */}
      <div className="ff-res-time-col">
        <span className="ff-res-time-main">{r.time}</span>
        {r.duration && (
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>{r.duration}min</span>
        )}
      </div>

      {/* Main content */}
      <div className="ff-res-card-body">
        {/* Name row + tags */}
        <div className="ff-res-card-name-row">
          <span className="ff-res-card-name">{r.customerName}</span>
          {(r.tags ?? []).map((tag) => {
            const tc = TAG_CONFIG[tag];
            return (
              <span
                key={tag}
                className="ff-res-tag"
                style={{ background: tc.bg, color: tc.color }}
              >
                {t(tc.labelKey)}
              </span>
            );
          })}
        </div>

        {/* Metadata row */}
        <div className="ff-res-card-meta">
          <span><i className="bi bi-people-fill me-1" style={{ fontSize: 11 }} />{t('res.guestsN', { n: r.partySize })}</span>
          {r.customerPhone && (
            <span><i className="bi bi-telephone-fill me-1" style={{ fontSize: 11 }} />{r.customerPhone}</span>
          )}
          {tableLabel && (
            <span><i className="bi bi-grid-3x3-gap-fill me-1" style={{ fontSize: 11 }} />{tableLabel}</span>
          )}
          {r.source && (
            <span>
              <i className={`bi ${SOURCE_CONFIG[r.source].icon} me-1`} style={{ fontSize: 11 }} />
              {t(SOURCE_CONFIG[r.source].labelKey)}
            </span>
          )}
        </div>

        {/* Notes */}
        {r.notes && (
          <div className="ff-res-card-note">
            <i className="bi bi-chat-left-text me-1" />
            {r.notes}
          </div>
        )}

        {/* Status + urgency row */}
        <div className="ff-res-card-status-row">
          <StatusBadge status={r.status} />
          {urgency && (
            <span className={`ff-res-urgency ${urgency.kind}`}>
              <i className={`bi ${
                urgency.kind === 'overdue'  ? 'bi-exclamation-circle-fill' :
                urgency.kind === 'upcoming' ? 'bi-alarm-fill' :
                urgency.kind === 'no-table' ? 'bi-grid-3x3-gap' :
                urgency.kind === 'vip'      ? 'bi-star-fill' :
                'bi-people-fill'
              }`} style={{ fontSize: 10 }} />
              {urgency.label}
            </span>
          )}
          {!tableLabel && isActive && r.status === 'CONFIRMED' && !urgency && (
            <span className="ff-res-urgency no-table">
              <i className="bi bi-grid-3x3-gap" style={{ fontSize: 10 }} />
              {t('res.noTable')}
            </span>
          )}
        </div>
      </div>

      {/* Action area */}
      <div className="ff-res-card-actions">
        {primary && (
          <button
            className={`btn btn-sm ${primary.cls}`}
            style={{ fontSize: '0.8rem', fontWeight: 700, width: '100%', padding: '5px 10px' }}
            onClick={() => onStatusChange(r.id, primary.nextStatus)}
          >
            {primary.label}
          </button>
        )}
        {menuItems.length > 0 && <AdminActionMenu items={menuItems} />}
      </div>
    </div>
  );
}
