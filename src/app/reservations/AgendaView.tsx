import { useLabels } from '@/i18n/I18nContext';
import type { Reservation, ReservationStatus, DbTable } from '@/lib/types';
import { fmtFullDate } from './reservationsUtils';
import { ReservationCard } from './ReservationCard';

interface AgendaViewProps {
  filtered: Reservation[];
  todayStr: string;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

export function AgendaView({ filtered, todayStr, tables, onStatusChange, onEdit }: AgendaViewProps) {
  const { t, language } = useLabels();

  if (filtered.length === 0) {
    return (
      <div className="ff-empty-state">
        <i className="bi bi-calendar-x ff-empty-state-icon" />
        <div className="ff-empty-state-title">{t('res.empty.title')}</div>
        <div className="ff-empty-state-desc">{t('res.empty.desc')}</div>
      </div>
    );
  }

  const dates = [...new Set(filtered.map((r) => r.date))].sort();

  return (
    <div className="ff-agenda-list">
      {dates.map((d) => {
        const dayRes = filtered
          .filter((r) => r.date === d)
          .sort((a, b) => a.time.localeCompare(b.time));
        const isToday = d === todayStr;
        return (
          <div key={d}>
            <div
              className="ff-agenda-day-header"
              style={{ color: isToday ? '#1d4ed8' : '#9ca3af' }}
            >
              {isToday && <span className="ff-agenda-today-dot" />}
              {isToday ? t('res.today') : fmtFullDate(d, language)}
              <span className="ff-agenda-count">
                — {t('res.reservationsCountN', { n: dayRes.length })}
              </span>
            </div>
            <div className="ff-agenda-day-cards">
              {dayRes.map((r) => (
                <ReservationCard key={r.id} r={r} tables={tables} onStatusChange={onStatusChange} onEdit={onEdit} />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
