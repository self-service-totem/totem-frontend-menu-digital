import { useLabels } from '@/i18n/I18nContext';
import { AdminActionMenu } from '@/components/admin';
import type { ActionMenuItem } from '@/components/admin';
import type { Reservation, ReservationStatus, ReservationSettings, DbTable } from '@/lib/types';
import { toMins } from './reservationsUtils';
import { StatusBadge } from './StatusBadge';

interface ByTableViewProps {
  reservations: Reservation[];
  tables: DbTable[];
  settings: ReservationSettings | null;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

type TableGroup = { key: string; label: string; table: DbTable | null; reservations: Reservation[] };

export function ByTableView({ reservations, tables, settings, onStatusChange, onEdit }: ByTableViewProps) {
  const { t, language } = useLabels();
  const defaultDur = settings?.defaultDurationMinutes ?? 90;

  function getConflictIds(group: Reservation[]): Set<string> {
    const ids = new Set<string>();
    const active = group.filter((r) => ['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status));
    for (let i = 0; i < active.length; i++) {
      for (let j = i + 1; j < active.length; j++) {
        const a = active[i], b = active[j];
        if (a.date !== b.date) continue;
        const aS = toMins(a.time), aE = aS + (a.duration ?? defaultDur);
        const bS = toMins(b.time), bE = bS + (b.duration ?? defaultDur);
        if (aS < bE && aE > bS) { ids.add(a.id); ids.add(b.id); }
      }
    }
    return ids;
  }

  function matchesTable(r: Reservation, tb: DbTable): boolean {
    return r.tableId === tb.id || r.tableNumber === tb.number;
  }

  const groups: TableGroup[] = [];
  const assigned = new Set<string>();

  tables.forEach((tb) => {
    const res = reservations
      .filter((r) => matchesTable(r, tb))
      .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
    res.forEach((r) => assigned.add(r.id));
    groups.push({ key: tb.id, label: t('res.tableN', { n: tb.number }), table: tb, reservations: res });
  });

  const unassigned = reservations
    .filter((r) => !assigned.has(r.id))
    .sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  if (unassigned.length > 0) {
    groups.push({ key: '__no_table__', label: t('res.noTable'), table: null, reservations: unassigned });
  }

  if (groups.length === 0) {
    return (
      <div className="ff-empty-state">
        <i className="bi bi-calendar-x ff-empty-state-icon" />
        <div className="ff-empty-state-title">{t('res.emptyTable.title')}</div>
        <div className="ff-empty-state-desc">{t('res.empty.desc')}</div>
      </div>
    );
  }

  return (
    <div className="ff-res-by-table-grid">
      {groups.map((g) => {
        const conflicts = getConflictIds(g.reservations);
        const hasConflict = conflicts.size > 0;
        const activeCount = g.reservations.filter((r) => ['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status)).length;

        return (
          <div key={g.key} className={`ff-res-by-table-card${hasConflict ? ' has-conflict' : ''}`}>
            <div className="ff-res-by-table-header">
              <div className="ff-by-table-header-info">
                <div className="ff-res-by-table-num">
                  {g.table ? g.table.number : <i className="bi bi-dash" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{g.label}</div>
                  {g.table?.zoneName && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{g.table.zoneName}</div>}
                  {g.table?.capacity && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t('res.seatsN', { n: g.table.capacity })}</div>}
                </div>
              </div>
              <div className="ff-by-table-header-actions">
                {hasConflict && (
                  <span className="ff-res-conflict-badge"><i className="bi bi-exclamation-triangle-fill" /> {t('res.conflict')}</span>
                )}
                {activeCount > 0 ? (
                  <span style={{ fontSize: '0.72rem', background: '#eff6ff', color: '#1d4ed8', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>
                    {t('res.reservationsCountN', { n: activeCount })}
                  </span>
                ) : g.table ? (
                  <span style={{ fontSize: '0.72rem', background: '#f0fdf4', color: '#15803d', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>{t('res.free')}</span>
                ) : null}
              </div>
            </div>

            {g.reservations.length === 0 ? (
              <div style={{ padding: '14px 16px', color: '#9ca3af', fontSize: '0.82rem', textAlign: 'center' }}>{t('res.empty.title')}</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {g.reservations.map((r, idx) => {
                  const isConflict = conflicts.has(r.id);
                  const rowMenu: ActionMenuItem[] = [];
                  if (r.status === 'PENDING')   rowMenu.push({ key: 'confirm',  label: t('res.action.confirm'),  icon: 'bi-check-circle',      onClick: () => onStatusChange(r.id, 'CONFIRMED') });
                  if (['PENDING', 'CONFIRMED'].includes(r.status)) rowMenu.push({ key: 'seat', label: t('res.action.seat'), icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
                  if (r.status === 'SEATED')    rowMenu.push({ key: 'complete', label: t('res.action.complete'), icon: 'bi-check2-all',         onClick: () => onStatusChange(r.id, 'COMPLETED') });
                  rowMenu.push({ key: 'edit',   label: t('res.action.edit'),    icon: 'bi-pencil',               onClick: () => onEdit(r) });
                  if (['PENDING', 'CONFIRMED'].includes(r.status)) rowMenu.push({ key: 'cancel', label: t('res.action.cancel'), icon: 'bi-x-circle-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'CANCELED') });

                  return (
                    <div
                      key={r.id}
                      className={`ff-res-by-table-row${isConflict ? ' conflict' : ''}`}
                      style={{ borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none' }}
                    >
                      <div style={{ flexShrink: 0 }}>
                        <div style={{ fontWeight: 800, fontSize: '0.85rem', fontVariantNumeric: 'tabular-nums', color: '#1f2937' }}>{r.time}</div>
                        <div style={{ fontSize: '0.68rem', color: '#9ca3af' }}>
                          {new Date(r.date + 'T12:00:00').toLocaleDateString(language, { day: '2-digit', month: '2-digit' })}
                        </div>
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 600, fontSize: '0.86rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.customerName}</div>
                        <div style={{ fontSize: '0.75rem', color: '#6b7280', display: 'flex', gap: 8 }}>
                          <span><i className="bi bi-people-fill me-1" style={{ fontSize: 10 }} />{r.partySize}</span>
                          {isConflict && <span style={{ color: '#dc2626', fontWeight: 700 }}><i className="bi bi-exclamation-circle me-1" />{t('res.conflict')}</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        <StatusBadge status={r.status} />
                        <AdminActionMenu items={rowMenu} />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
