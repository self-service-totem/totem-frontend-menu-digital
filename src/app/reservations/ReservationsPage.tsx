import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService } from '@/lib/services/reservationService';
import { tableService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import { AdminTable, useSortable, AdminActionMenu, AdminLanguageSelector } from '@/components/admin';
import type { AdminTableColumn, SortDir, ActionMenuItem } from '@/components/admin';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import type { LabelKey, LanguageCode } from '@/i18n/labels';
import type {
  Reservation,
  ReservationStatus,
  ReservationTag,
  ReservationSource,
  DbTable,
  WalkIn,
  ReservationSettings,
} from '@/lib/types';

type Translate = (key: LabelKey, params?: Record<string, string | number>) => string;

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { labelKey: LabelKey; color: string; bg: string; border: string; accent: string; icon: string }
> = {
  PENDING:   { labelKey: 'res.status.pending',   color: '#b45309', bg: '#fffbeb', border: '#fde68a', accent: '#d97706', icon: 'bi-hourglass-split' },
  CONFIRMED: { labelKey: 'res.status.confirmed', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', accent: '#059669', icon: 'bi-check-circle-fill' },
  SEATED:    { labelKey: 'res.status.seated',    color: '#1e40af', bg: '#eff6ff', border: '#93c5fd', accent: '#2563eb', icon: 'bi-person-check-fill' },
  COMPLETED: { labelKey: 'res.status.completed', color: '#374151', bg: '#f3f4f6', border: '#d1d5db', accent: '#9ca3af', icon: 'bi-check2-all' },
  CANCELED:  { labelKey: 'res.status.canceled',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', accent: '#d1d5db', icon: 'bi-x-circle' },
  NO_SHOW:   { labelKey: 'res.status.noShow',    color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', accent: '#dc2626', icon: 'bi-person-x-fill' },
};

const TAG_CONFIG: Record<ReservationTag, { labelKey: LabelKey; color: string; bg: string }> = {
  BIRTHDAY:    { labelKey: 'res.tag.birthday',    color: '#9d174d', bg: '#fdf2f8' },
  VIP:         { labelKey: 'res.tag.vip',         color: '#4c1d95', bg: '#f5f3ff' },
  ALLERGY:     { labelKey: 'res.tag.allergy',     color: '#991b1b', bg: '#fef2f2' },
  ANNIVERSARY: { labelKey: 'res.tag.anniversary', color: '#831843', bg: '#fdf2f8' },
  LATE:        { labelKey: 'res.tag.late',        color: '#92400e', bg: '#fffbeb' },
};

const SOURCE_CONFIG: Record<ReservationSource, { labelKey: LabelKey; icon: string }> = {
  PHONE:   { labelKey: 'res.source.phone',  icon: 'bi-telephone-fill' },
  WALK_IN: { labelKey: 'res.source.walkIn', icon: 'bi-person-walking' },
  ONLINE:  { labelKey: 'res.source.online', icon: 'bi-globe2' },
};

type Tab = 'reservations' | 'walkin' | 'occupancy' | 'settings';
type View = 'agenda' | 'table' | 'by-table';
type DateScope = 'today' | 'date' | 'all';

const ALL_TAGS: ReservationTag[] = ['BIRTHDAY', 'VIP', 'ALLERGY', 'ANNIVERSARY', 'LATE'];

const EMPTY_FORM = {
  customerName: '',
  customerPhone: '',
  partySize: '2',
  date: new Date().toISOString().slice(0, 10),
  time: '19:00',
  notes: '',
  tableId: '',
  source: 'PHONE' as ReservationSource,
  duration: '90',
  tags: [] as ReservationTag[],
};

// ─── Utilities ────────────────────────────────────────────────────────────────

function timeAgo(iso: string, t: Translate): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('res.timeNow');
  if (mins < 60) return t('res.minN', { n: mins });
  return t('res.hoursN', { n: Math.floor(mins / 60) });
}

function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

function fmtMonthYear(monthStart: string, locale: string): string {
  const d = new Date(monthStart + 'T12:00:00');
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

function getMonthDays(monthStart: string): string[] {
  const d = new Date(monthStart + 'T12:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) => {
    return new Date(year, month, i + 1).toISOString().slice(0, 10);
  });
}

function generateSlots(opening: string, closing: string, intervalMin: number): string[] {
  const slots: string[] = [];
  let cur = toMins(opening);
  const end = toMins(closing);
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += intervalMin;
  }
  return slots;
}

function weekdayShortNames(locale: string): string[] {
  // 2024-01-07 is a Sunday → Sun..Sat localized
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 7 + i, 12)).toLocaleDateString(locale, { weekday: 'short' }),
  );
}

function fmtShortDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const wd = d.toLocaleDateString(locale, { weekday: 'short' });
  return `${wd} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtFullDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
}

function occColor(pct: number): { bg: string; text: string } {
  if (pct === 0)  return { bg: '#ffffff', text: '#9ca3af' };
  if (pct < 35)  return { bg: '#dcfce7', text: '#15803d' };
  if (pct < 65)  return { bg: '#fef9c3', text: '#a16207' };
  if (pct < 90)  return { bg: '#fed7aa', text: '#c2410c' };
  return { bg: '#fee2e2', text: '#dc2626' };
}

type UrgencyKind = 'overdue' | 'upcoming' | 'no-table' | 'vip' | 'large';

function getUrgencySignal(r: Reservation, t: Translate): { kind: UrgencyKind; label: string } | null {
  const closed = ['COMPLETED', 'CANCELED', 'NO_SHOW'] as ReservationStatus[];
  if (closed.includes(r.status)) return null;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (r.date !== today) return null;

  const resM = toMins(r.time);
  const nowM = now.getHours() * 60 + now.getMinutes();
  const diff = resM - nowM;

  if (diff < 0 && diff > -45 && r.status !== 'SEATED') {
    return { kind: 'overdue', label: t('res.urgency.overdue', { n: Math.abs(diff) }) };
  }
  if (diff >= 0 && diff <= 15) {
    return { kind: 'upcoming', label: diff === 0 ? t('res.urgency.now') : t('res.urgency.inMin', { n: diff }) };
  }
  if (!r.tableId && !r.tableNumber && r.status === 'CONFIRMED') {
    return { kind: 'no-table', label: t('res.noTable') };
  }
  if ((r.tags ?? []).includes('VIP')) {
    return { kind: 'vip', label: t('res.urgency.vip') };
  }
  if (r.partySize >= 8) {
    return { kind: 'large', label: t('res.guestsN', { n: r.partySize }) };
  }
  return null;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useLabels();
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="ff-res-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {t(cfg.labelKey)}
    </span>
  );
}

// ─── ReservationCard ──────────────────────────────────────────────────────────

interface ReservationCardProps {
  r: Reservation;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

function ReservationCard({ r, tables, onStatusChange, onEdit }: ReservationCardProps) {
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
      <div style={{ flex: 1, padding: '11px 14px', minWidth: 0 }}>
        {/* Name row + tags */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.94rem', color: '#1a1a1a' }}>{r.customerName}</span>
          {(r.tags ?? []).map((tag) => {
            const tc = TAG_CONFIG[tag];
            return (
              <span
                key={tag}
                style={{
                  background: tc.bg,
                  color: tc.color,
                  borderRadius: 5,
                  padding: '1px 7px',
                  fontSize: '0.7rem',
                  fontWeight: 700,
                }}
              >
                {t(tc.labelKey)}
              </span>
            );
          })}
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginTop: 5, fontSize: '0.8rem', color: '#6b7280' }}>
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
          <div style={{
            fontSize: '0.77rem',
            color: '#92400e',
            background: '#fffbeb',
            border: '1px solid #fde68a',
            borderRadius: 5,
            padding: '2px 8px',
            marginTop: 6,
            display: 'inline-block',
            maxWidth: '100%',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            <i className="bi bi-chat-left-text me-1" />
            {r.notes}
          </div>
        )}

        {/* Status + urgency row */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
          <StatusBadge status={r.status} />
          {urgency && (
            <span className={`ff-res-urgency ${urgency.kind}`}>
              <i className={`bi ${
                urgency.kind === 'overdue' ? 'bi-exclamation-circle-fill' :
                urgency.kind === 'upcoming' ? 'bi-alarm-fill' :
                urgency.kind === 'no-table' ? 'bi-grid-3x3-gap' :
                urgency.kind === 'vip' ? 'bi-star-fill' :
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
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', justifyContent: 'center', gap: 6, flexShrink: 0, minWidth: 120 }}>
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

// ─── AgendaView ───────────────────────────────────────────────────────────────

interface AgendaViewProps {
  filtered: Reservation[];
  todayStr: string;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

function AgendaView({ filtered, todayStr, tables, onStatusChange, onEdit }: AgendaViewProps) {
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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {dates.map((d) => {
        const dayRes = filtered
          .filter((r) => r.date === d)
          .sort((a, b) => a.time.localeCompare(b.time));
        const isToday = d === todayStr;
        return (
          <div key={d}>
            <div style={{ fontWeight: 700, fontSize: '0.78rem', color: isToday ? '#1d4ed8' : '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 8 }}>
              {isToday && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />}
              {isToday ? t('res.today') : fmtFullDate(d, language)}
              <span style={{ fontWeight: 500, color: '#d1d5db', fontSize: '0.7rem' }}>
                — {t('res.reservationsCountN', { n: dayRes.length })}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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

// ─── ReservationTableView ─────────────────────────────────────────────────────

type ReservationRow = Reservation & { _dateTime: string };

interface ReservationTableViewProps {
  reservations: Reservation[];
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

function ReservationTableView({ reservations, tables, onStatusChange, onEdit }: ReservationTableViewProps) {
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
    if (r.status === 'PENDING')   items.push({ key: 'confirm',    label: t('res.action.confirm'),     icon: 'bi-check-circle',      onClick: () => onStatusChange(r.id, 'CONFIRMED') });
    if (r.status === 'PENDING')   items.push({ key: 'seat-dir',   label: t('res.action.seatDirect'),  icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
    if (r.status === 'CONFIRMED') items.push({ key: 'seat',       label: t('res.action.seat'),        icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
    if (r.status === 'SEATED')    items.push({ key: 'complete',   label: t('res.action.complete'),    icon: 'bi-check2-all',        onClick: () => onStatusChange(r.id, 'COMPLETED') });
    if (isActive)                 items.push({ key: 'edit',       label: t('res.action.edit'),        icon: 'bi-pencil',            onClick: () => onEdit(r) });
    if (r.status === 'PENDING' || r.status === 'CONFIRMED') items.push({ key: 'no-show', label: t('res.action.noShow'), icon: 'bi-person-x-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'NO_SHOW') });
    if (isActive)                 items.push({ key: 'cancel',     label: t('res.action.cancel'),      icon: 'bi-x-circle-fill',     variant: 'destructive', onClick: () => onStatusChange(r.id, 'CANCELED') });
    if (r.status === 'CANCELED' || r.status === 'NO_SHOW') items.push({ key: 'reopen', label: t('res.action.reopen'), icon: 'bi-arrow-counterclockwise', onClick: () => onStatusChange(r.id, 'PENDING') });
    if (!isActive)                items.push({ key: 'view',       label: t('res.action.viewDetails'), icon: 'bi-eye',               onClick: () => onEdit(r) });
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
                return <span key={tag} style={{ fontSize: '0.68rem', fontWeight: 700, background: tc.bg, color: tc.color, borderRadius: 4, padding: '1px 5px' }}>{t(tc.labelKey)}</span>;
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
        return lbl ? <span style={{ fontWeight: 600 }}>{lbl}</span> : <span style={{ color: '#9ca3af', fontSize: '0.8rem' }}>{t('res.noTable')}</span>;
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

// ─── ByTableView ──────────────────────────────────────────────────────────────

interface ByTableViewProps {
  reservations: Reservation[];
  tables: DbTable[];
  settings: ReservationSettings | null;
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

function ByTableView({ reservations, tables, settings, onStatusChange, onEdit }: ByTableViewProps) {
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

  function matchesTable(r: Reservation, t: DbTable): boolean {
    return r.tableId === t.id || r.tableNumber === t.number;
  }

  type TableGroup = { key: string; label: string; table: DbTable | null; reservations: Reservation[] };
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div className="ff-res-by-table-num">
                  {g.table ? g.table.number : <i className="bi bi-dash" />}
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '0.94rem' }}>{g.label}</div>
                  {g.table?.zoneName && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{g.table.zoneName}</div>}
                  {g.table?.capacity && <div style={{ fontSize: '0.72rem', color: '#9ca3af' }}>{t('res.seatsN', { n: g.table.capacity })}</div>}
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
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
                  if (r.status === 'PENDING')   rowMenu.push({ key: 'confirm',  label: t('res.action.confirm'), icon: 'bi-check-circle',      onClick: () => onStatusChange(r.id, 'CONFIRMED') });
                  if (['PENDING', 'CONFIRMED'].includes(r.status)) rowMenu.push({ key: 'seat', label: t('res.action.seat'), icon: 'bi-person-check-fill', onClick: () => onStatusChange(r.id, 'SEATED') });
                  if (r.status === 'SEATED')    rowMenu.push({ key: 'complete', label: t('res.action.complete'), icon: 'bi-check2-all',         onClick: () => onStatusChange(r.id, 'COMPLETED') });
                  rowMenu.push({ key: 'edit',   label: t('res.action.edit'),    icon: 'bi-pencil',            onClick: () => onEdit(r) });
                  if (['PENDING', 'CONFIRMED'].includes(r.status)) rowMenu.push({ key: 'cancel', label: t('res.action.cancel'), icon: 'bi-x-circle-fill', variant: 'destructive', onClick: () => onStatusChange(r.id, 'CANCELED') });

                  return (
                    <div key={r.id} className={`ff-res-by-table-row${isConflict ? ' conflict' : ''}`} style={{ borderTop: idx > 0 ? '1px solid #f0f0f0' : 'none' }}>
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

// ─── WalkInPanel ──────────────────────────────────────────────────────────────

interface WalkInPanelProps {
  walkIns: WalkIn[];
  tables: DbTable[];
  onSeat: (id: string) => void;
  onCancel: (id: string) => void;
  onAdd: () => void;
}

function WalkInPanel({ walkIns, onSeat, onCancel, onAdd }: WalkInPanelProps) {
  const { t } = useLabels();
  const waiting = walkIns.filter((w) => w.status === 'WAITING');
  const past    = walkIns.filter((w) => w.status !== 'WAITING');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>{t('res.walkin.queue')}</span>
          {waiting.length > 0 && (
            <span
              style={{
                background: '#0284c7',
                color: '#fff',
                borderRadius: 12,
                padding: '2px 9px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {waiting.length}
            </span>
          )}
        </div>
        <button className="btn btn-sm btn-primary" onClick={onAdd}>
          <i className="bi bi-plus me-1" />{t('res.walkin.add')}
        </button>
      </div>

      {/* Empty state */}
      {waiting.length === 0 && (
        <div className="ff-empty-state">
          <i className="bi bi-people ff-empty-state-icon" />
          <div className="ff-empty-state-title">{t('res.walkin.emptyTitle')}</div>
          <div className="ff-empty-state-desc">{t('res.walkin.emptyDesc')}</div>
        </div>
      )}

      {/* Waiting list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {waiting.map((w, idx) => {
          const waitMins = Math.floor((Date.now() - new Date(w.arrivedAt).getTime()) / 60000);
          const isLong = waitMins > (w.estimatedWaitMinutes ?? 30);
          return (
            <div key={w.id} className="ff-walkin-card" style={{ borderLeftColor: isLong ? '#dc2626' : '#0284c7' }}>
              {/* Position number */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: '50%',
                  background: isLong ? '#fef2f2' : '#eff6ff',
                  color: isLong ? '#dc2626' : '#0284c7',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  flexShrink: 0,
                }}
              >
                {idx + 1}
              </div>

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: '0.93rem' }}>{w.customerName}</div>
                <div style={{ fontSize: '0.8rem', color: '#6b7280', display: 'flex', gap: 10, marginTop: 2, flexWrap: 'wrap' }}>
                  <span><i className="bi bi-people-fill me-1" />{t('res.guestsN', { n: w.partySize })}</span>
                  {w.customerPhone && <span><i className="bi bi-telephone-fill me-1" />{w.customerPhone}</span>}
                </div>
                <div style={{ marginTop: 4, display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      padding: '2px 8px',
                      borderRadius: 10,
                      background: isLong ? '#fee2e2' : '#f0fdf4',
                      color: isLong ? '#991b1b' : '#14532d',
                    }}
                  >
                    <i className="bi bi-clock me-1" />
                    {isLong ? t('res.walkin.waitingSince') : t('res.walkin.since')}{timeAgo(w.arrivedAt, t)}
                  </span>
                  {w.estimatedWaitMinutes && (
                    <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
                      {t('res.walkin.estWait', { n: w.estimatedWaitMinutes })}
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flexShrink: 0 }}>
                <button
                  className="btn btn-sm btn-primary"
                  style={{ fontSize: '0.78rem', fontWeight: 700 }}
                  onClick={() => onSeat(w.id)}
                >
                  <i className="bi bi-person-check-fill me-1" />{t('res.walkin.seat')}
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => onCancel(w.id)}
                >
                  {t('res.walkin.remove')}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* History */}
      {past.length > 0 && (
        <details style={{ marginTop: 20 }}>
          <summary
            style={{
              fontSize: '0.8rem',
              color: '#9ca3af',
              cursor: 'pointer',
              listStyle: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              userSelect: 'none',
            }}
          >
            <i className="bi bi-clock-history" />
            {t('res.walkin.historyToday', { n: past.length })}
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 10 }}>
            {past.map((w) => (
              <div
                key={w.id}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '9px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: 0.7,
                }}
              >
                <div style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, fontSize: '0.87rem' }}>{w.customerName}</span>
                  <span style={{ fontSize: '0.78rem', color: '#9ca3af', marginLeft: 8 }}>
                    {t('res.guestsN', { n: w.partySize })} ·{' '}
                    {w.status === 'SEATED' ? (
                      <span style={{ color: '#059669' }}>{t('res.walkin.seated')}</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>{t('res.walkin.removed')}</span>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── SettingsPanel ────────────────────────────────────────────────────────────

interface SettingsPanelProps {
  settings: ReservationSettings | null;
  onSave: (s: Partial<ReservationSettings>) => void;
}

function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const { t } = useLabels();
  const [form, setForm] = useState({
    defaultDurationMinutes: String(settings?.defaultDurationMinutes ?? 90),
    lateToleranceMinutes:   String(settings?.lateToleranceMinutes ?? 15),
    openingTime:            settings?.openingTime ?? '11:30',
    closingTime:            settings?.closingTime ?? '23:00',
    slotIntervalMinutes:    String(settings?.slotIntervalMinutes ?? 30),
    maxPartySize:           String(settings?.maxPartySize ?? 12),
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      defaultDurationMinutes: parseInt(form.defaultDurationMinutes) || 90,
      lateToleranceMinutes:   parseInt(form.lateToleranceMinutes) || 15,
      openingTime:            form.openingTime,
      closingTime:            form.closingTime,
      slotIntervalMinutes:    parseInt(form.slotIntervalMinutes) || 30,
      maxPartySize:           parseInt(form.maxPartySize) || 12,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="ff-settings-form">
      <div style={{ fontWeight: 800, fontSize: '1rem', marginBottom: 20, color: '#1a1a1a' }}>
        <i className="bi bi-gear-fill me-2" style={{ color: '#6b7280' }} />
        {t('res.settings.title')}
      </div>

      <div className="ff-modal-section" style={{ marginBottom: 16 }}>
        <span className="ff-modal-section-label">{t('res.settings.hours')}</span>
        <div className="ff-modal-section-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: t('res.settings.opening'), key: 'openingTime' as const, type: 'time' },
            { label: t('res.settings.closing'), key: 'closingTime' as const, type: 'time' },
          ].map((f) => (
            <div key={f.key}>
              <label style={{ fontSize: '0.8rem', fontWeight: 700, display: 'block', marginBottom: 4, color: '#374151' }}>
                {f.label}
              </label>
              <input
                className="form-control form-control-sm"
                type={f.type}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="ff-modal-section" style={{ marginBottom: 20 }}>
        <span className="ff-modal-section-label">{t('res.settings.params')}</span>
        <div className="ff-modal-section-body">
          {[
            { label: t('res.settings.defaultDuration'), key: 'defaultDurationMinutes' as const, hint: t('res.settings.defaultDurationHint') },
            { label: t('res.settings.lateTolerance'),   key: 'lateToleranceMinutes' as const, hint: t('res.settings.lateToleranceHint') },
            { label: t('res.settings.slotInterval'),    key: 'slotIntervalMinutes' as const, hint: t('res.settings.slotIntervalHint') },
            { label: t('res.settings.maxParty'),        key: 'maxPartySize' as const, hint: '' },
          ].map((f) => (
            <div key={f.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, display: 'block', marginBottom: 2, color: '#374151' }}>
                  {f.label}
                </label>
                {f.hint && <div style={{ fontSize: '0.74rem', color: '#9ca3af' }}>{f.hint}</div>}
              </div>
              <input
                className="form-control form-control-sm"
                type="number"
                style={{ width: 90, textAlign: 'center' }}
                value={form[f.key]}
                onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary" onClick={handleSave}>
          <i className="bi bi-floppy me-1" />{t('res.settings.save')}
        </button>
        {saved && (
          <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="bi bi-check-circle-fill" />{t('res.settings.saved')}
          </span>
        )}
      </div>
    </div>
  );
}

// ─── ReservationModal ─────────────────────────────────────────────────────────

interface ReservationModalProps {
  title: string;
  initial: typeof EMPTY_FORM;
  tables: DbTable[];
  onConfirm: (data: typeof EMPTY_FORM) => void;
  onClose: () => void;
  readOnly?: boolean;
}

function ReservationModal({ title, initial, tables, onConfirm, onClose, readOnly }: ReservationModalProps) {
  const { t } = useLabels();
  const [form, setForm] = useState(initial);

  function toggleTag(tag: ReservationTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  function field<K extends keyof typeof form>(key: K, val: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" style={{ maxWidth: 500 }} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">{title}</span>
          <button
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#9ca3af',
              padding: 4,
              fontSize: 18,
              lineHeight: 1,
            }}
            onClick={onClose}
          >
            <i className="bi bi-x-lg" />
          </button>
        </div>

        {/* Body */}
        <div className="ff-admin-modal-body" style={{ gap: 12 }}>
          {/* Customer details */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.customerData')}</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.name')}</span>
                <input
                  className="form-control form-control-sm"
                  value={form.customerName}
                  readOnly={readOnly}
                  onChange={(e) => field('customerName', e.target.value)}
                  placeholder={t('res.modal.namePlaceholder')}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.phone')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="tel"
                    value={form.customerPhone}
                    readOnly={readOnly}
                    onChange={(e) => field('customerPhone', e.target.value)}
                    placeholder="(00) 00000-0000"
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.guests')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="1"
                    value={form.partySize}
                    readOnly={readOnly}
                    onChange={(e) => field('partySize', e.target.value)}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Reservation details */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.details')}</span>
            <div className="ff-modal-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.date')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="date"
                    value={form.date}
                    readOnly={readOnly}
                    onChange={(e) => field('date', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.time')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="time"
                    value={form.time}
                    readOnly={readOnly}
                    onChange={(e) => field('time', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">{t('res.modal.duration')}</span>
                  <input
                    className="form-control form-control-sm"
                    type="number"
                    min="30"
                    value={form.duration}
                    readOnly={readOnly}
                    onChange={(e) => field('duration', e.target.value)}
                  />
                </div>
              </div>
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.source')}</span>
                <select
                  className="form-select form-select-sm"
                  value={form.source}
                  disabled={readOnly}
                  onChange={(e) => field('source', e.target.value as ReservationSource)}
                >
                  {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{t(v.labelKey)}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table assignment */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.col.table')} <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>{t('res.modal.tableOptional')}</span></span>
            <div className="ff-modal-section-body">
              <select
                className="form-select form-select-sm"
                value={form.tableId}
                disabled={readOnly}
                onChange={(e) => field('tableId', e.target.value)}
              >
                <option value="">{t('res.modal.noTableOption')}</option>
                {tables.map((tb) => (
                  <option key={tb.id} value={tb.id}>
                    {t('res.tableN', { n: tb.number })}{tb.capacity ? ` (${t('res.seatsN', { n: tb.capacity })})` : ''}
                    {tb.zoneName ? ` — ${tb.zoneName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & tags */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">{t('res.modal.notesTags')}</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.notes')}</span>
                <input
                  className="form-control form-control-sm"
                  value={form.notes}
                  readOnly={readOnly}
                  onChange={(e) => field('notes', e.target.value)}
                  placeholder={t('res.modal.notesPlaceholder')}
                />
              </div>
              <div>
                <span className="ff-admin-modal-label">{t('res.modal.tags')}</span>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 2 }}>
                  {ALL_TAGS.map((tag) => {
                    const tc = TAG_CONFIG[tag];
                    const active = form.tags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        disabled={readOnly}
                        onClick={() => toggleTag(tag)}
                        style={{
                          background: active ? tc.bg : '#f3f4f6',
                          color: active ? tc.color : '#6b7280',
                          border: `1.5px solid ${active ? tc.color + '60' : 'transparent'}`,
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: '0.78rem',
                          fontWeight: 600,
                          cursor: readOnly ? 'default' : 'pointer',
                          transition: 'all .12s',
                        }}
                      >
                        {t(tc.labelKey)}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="ff-admin-modal-footer">
          {!readOnly ? (
            <>
              <button
                className="btn btn-primary flex-1"
                onClick={() => onConfirm(form)}
                disabled={!form.customerName.trim()}
              >
                <i className="bi bi-floppy me-1" />{t('res.modal.saveReservation')}
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>
                {t('res.modal.cancel')}
              </button>
            </>
          ) : (
            <button className="btn btn-outline-secondary flex-1" onClick={onClose}>
              {t('res.modal.close')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── AddWalkInModal ───────────────────────────────────────────────────────────

interface AddWalkInModalProps {
  onConfirm: (data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) => void;
  onClose: () => void;
}

function AddWalkInModal({ onConfirm, onClose }: AddWalkInModalProps) {
  const { t } = useLabels();
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: '2', estimatedWaitMinutes: '20' });

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">
            <i className="bi bi-person-plus-fill me-2" style={{ color: '#0284c7' }} />
            {t('res.walkin.add')}
          </span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="ff-admin-modal-body">
          <div>
            <span className="ff-admin-modal-label">{t('res.walkin.nameOrGroup')}</span>
            <input
              className="form-control form-control-sm"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder={t('res.walkin.nameOrGroupPlaceholder')}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span className="ff-admin-modal-label">{t('res.modal.phone')}</span>
              <input
                className="form-control form-control-sm"
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
            <div>
              <span className="ff-admin-modal-label">{t('res.modal.guests')}</span>
              <input
                className="form-control form-control-sm"
                type="number"
                min="1"
                value={form.partySize}
                onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
              />
            </div>
          </div>
          <div>
            <span className="ff-admin-modal-label">{t('res.walkin.estWaitMin')}</span>
            <input
              className="form-control form-control-sm"
              type="number"
              min="5"
              value={form.estimatedWaitMinutes}
              onChange={(e) => setForm((f) => ({ ...f, estimatedWaitMinutes: e.target.value }))}
            />
          </div>
        </div>
        <div className="ff-admin-modal-footer">
          <button
            className="btn btn-primary flex-1"
            onClick={() =>
              onConfirm({
                customerName: form.customerName,
                customerPhone: form.customerPhone,
                partySize: parseInt(form.partySize) || 2,
                estimatedWaitMinutes: parseInt(form.estimatedWaitMinutes) || 20,
              })
            }
            disabled={!form.customerName.trim()}
          >
            <i className="bi bi-plus-circle-fill me-1" />{t('res.walkin.add')}
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>{t('res.modal.cancel')}</button>
        </div>
      </div>
    </div>
  );
}

// ─── OccupancyView ────────────────────────────────────────────────────────────

const TABLE_CHIP_PALETTE = [
  '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#14b8a6', '#ec4899', '#f97316',
];

interface OccupancyViewProps {
  tables: DbTable[];
  settings: ReservationSettings | null;
}

function OccupancyView({ tables, settings }: OccupancyViewProps) {
  const { t, language } = useLabels();
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<'week' | 'day' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday());
  const [selectedDay, setSelectedDay] = useState(today);
  const [monthStart, setMonthStart] = useState(() => getMonthStart());
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [occReservations, setOccReservations] = useState<Reservation[]>([]);
  const [quickReserve, setQuickReserve] = useState<{ tableId: string; tableNumber: string } | null>(null);
  const [editOccTarget, setEditOccTarget] = useState<Reservation | null>(null);
  const [viewOccTarget, setViewOccTarget] = useState<Reservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const notify = useNotify();

  async function loadOccReservations() {
    setOccReservations(await reservationService.listAll());
  }

  useEffect(() => { loadOccReservations(); }, []);

  const activeTables = tables.filter((t) => t.active);
  const viewTables   = selectedTableId ? activeTables.filter((t) => t.id === selectedTableId) : activeTables;
  const opening        = settings?.openingTime ?? '11:00';
  const closing        = settings?.closingTime ?? '23:00';
  const interval       = settings?.slotIntervalMinutes ?? 30;
  const defaultDur     = settings?.defaultDurationMinutes ?? 90;
  const slots          = generateSlots(opening, closing, interval);
  const weekDays       = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  function getOccupancy(date: string, time: string) {
    const slotStart = toMins(time);
    const occupied = viewTables.filter((t) =>
      occReservations.some((r) => {
        if (r.date !== date) return false;
        if (r.tableId !== t.id && r.tableNumber !== t.number) return false;
        if (r.status === 'CANCELED' || r.status === 'NO_SHOW' || r.status === 'COMPLETED') return false;
        const rStart = toMins(r.time);
        const rEnd   = rStart + (r.duration ?? defaultDur);
        return slotStart >= rStart && slotStart < rEnd;
      })
    );
    const total = viewTables.length;
    const pct   = total > 0 ? Math.round((occupied.length / total) * 100) : 0;
    return {
      occupied,
      available: viewTables.filter((t) => !occupied.includes(t)),
      total,
      pct,
    };
  }

  function tableResAtSlot(tableId: string, tableNum: string): Reservation | undefined {
    if (!selectedSlot) return undefined;
    const slotStart = toMins(selectedSlot.time);
    return occReservations.find((r) => {
      if (r.date !== selectedSlot.date) return false;
      if (r.tableId !== tableId && r.tableNumber !== tableNum) return false;
      if (r.status === 'CANCELED' || r.status === 'NO_SHOW' || r.status === 'COMPLETED') return false;
      const rStart = toMins(r.time);
      const rEnd   = rStart + (r.duration ?? defaultDur);
      return slotStart >= rStart && slotStart < rEnd;
    });
  }

  function selectSlot(date: string, time: string) {
    setSelectedSlot((prev) => (prev?.date === date && prev?.time === time ? null : { date, time }));
    setCancelTarget(null);
  }

  function getDayPeakOccupancy(date: string) {
    let maxPct = 0;
    let maxOccupied = 0;
    for (const slot of slots) {
      const occ = getOccupancy(date, slot);
      if (occ.pct > maxPct) { maxPct = occ.pct; maxOccupied = occ.occupied.length; }
    }
    return { pct: maxPct, occupied: maxOccupied, total: viewTables.length };
  }

  async function handleCancelFromOcc(resId: string) {
    await reservationService.updateStatus(resId, 'CANCELED');
    notify(t('res.notif.canceled'), 'success');
    setCancelTarget(null);
    await loadOccReservations();
  }

  async function handleQuickCreate(form: typeof EMPTY_FORM) {
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.create({
      customerName:  form.customerName,
      customerPhone: form.customerPhone,
      partySize:     parseInt(form.partySize) || 2,
      date:          form.date,
      time:          form.time,
      notes:         form.notes || undefined,
      tableId:       form.tableId || undefined,
      tableNumber:   table?.number,
      source:        form.source,
      duration:      parseInt(form.duration) || undefined,
      tags:          form.tags.length > 0 ? form.tags : undefined,
    });
    setQuickReserve(null);
    notify(t('res.notif.created'), 'success');
    await loadOccReservations();
  }

  async function handleEditFromOcc(form: typeof EMPTY_FORM) {
    if (!editOccTarget) return;
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.update(editOccTarget.id, {
      customerName:  form.customerName,
      customerPhone: form.customerPhone,
      partySize:     parseInt(form.partySize) || 2,
      date:          form.date,
      time:          form.time,
      notes:         form.notes || undefined,
      tableId:       form.tableId || undefined,
      tableNumber:   table?.number,
      source:        form.source,
      duration:      parseInt(form.duration) || undefined,
      tags:          form.tags.length > 0 ? form.tags : undefined,
    });
    setEditOccTarget(null);
    notify(t('res.notif.updated'), 'success');
    await loadOccReservations();
  }

  const detailOcc = selectedSlot ? getOccupancy(selectedSlot.date, selectedSlot.time) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      {/* Table filter chips */}
      {activeTables.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            flexWrap: 'wrap',
            background: '#f8fafc',
            border: '1px solid #e5e7eb',
            borderRadius: 12,
            padding: '10px 14px',
          }}
        >
          <span style={{ fontSize: 11, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em', flexShrink: 0, marginRight: 2 }}>
            <i className="bi bi-grid-3x3-gap me-1" />{t('res.col.table')}
          </span>

          {/* All-tables chip */}
          <button
            style={{
              background: selectedTableId === null ? '#1d4ed8' : '#fff',
              color: selectedTableId === null ? '#fff' : '#374151',
              border: `1.5px solid ${selectedTableId === null ? '#1d4ed8' : '#d1d5db'}`,
              borderRadius: 20,
              padding: '5px 15px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
              transition: 'all .14s',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
            onClick={() => { setSelectedTableId(null); setSelectedSlot(null); }}
          >
            <i className={`bi ${selectedTableId === null ? 'bi-check2' : 'bi-table'}`} style={{ fontSize: 12 }} />
            {t('res.occ.allTables')}
          </button>

          {/* Per-table chips */}
          {activeTables.map((t, idx) => {
            const col = TABLE_CHIP_PALETTE[idx % TABLE_CHIP_PALETTE.length];
            const isSelected = selectedTableId === t.id;
            return (
              <button
                key={t.id}
                style={{
                  background: isSelected ? col : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  border: `1.5px solid ${isSelected ? col : '#d1d5db'}`,
                  borderRadius: 20,
                  padding: '5px 13px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                  transition: 'all .14s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  whiteSpace: 'nowrap',
                }}
                onClick={() => { setSelectedTableId(isSelected ? null : t.id); setSelectedSlot(null); }}
              >
                {t.number}
                {t.zoneName && (
                  <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 11 }}>
                    {t.zoneName}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Controls bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
        {/* Week / Day / Month toggle */}
        <div style={{ display: 'flex', background: '#f3f4f6', borderRadius: 9, padding: 3, gap: 2 }}>
          {(['week', 'day', 'month'] as const).map((m) => (
            <button
              key={m}
              style={{
                background: mode === m ? '#fff' : 'transparent',
                border: 'none',
                borderRadius: 6,
                padding: '6px 14px',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                color: mode === m ? '#111827' : '#6b7280',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.1)' : 'none',
                transition: 'all .14s',
              }}
              onClick={() => { setMode(m); if (m === 'month') setSelectedSlot(null); }}
            >
              <i className={`bi ${m === 'week' ? 'bi-calendar-week' : m === 'day' ? 'bi-calendar-day' : 'bi-calendar-month'} me-1`} />
              {m === 'week' ? t('res.occ.week') : m === 'day' ? t('res.occ.day') : t('res.occ.month')}
            </button>
          ))}
        </div>

        {/* Navigation */}
        {mode === 'week' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setWeekStart(addDaysStr(weekStart, -7))}>
              <i className="bi bi-chevron-left" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 220, textAlign: 'center', color: '#374151' }}>
              {fmtShortDate(weekStart, language)} — {fmtShortDate(addDaysStr(weekStart, 6), language)}
            </span>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setWeekStart(addDaysStr(weekStart, 7))}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setWeekStart(getMonday())}>
              {t('res.today')}
            </button>
          </div>
        )}
        {mode === 'day' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setSelectedDay(addDaysStr(selectedDay, -1))}>
              <i className="bi bi-chevron-left" />
            </button>
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 152 }}
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
            />
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setSelectedDay(addDaysStr(selectedDay, 1))}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedDay(today)}>
              {t('res.today')}
            </button>
          </div>
        )}
        {mode === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setMonthStart(addMonths(monthStart, -1))}>
              <i className="bi bi-chevron-left" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 180, textAlign: 'center', color: '#374151' }}>
              {fmtMonthYear(monthStart, language)}
            </span>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setMonthStart(addMonths(monthStart, 1))}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setMonthStart(getMonthStart())}>
              {t('res.today')}
            </button>
          </div>
        )}

        {/* Legend */}
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
          {[
            { bg: '#dcfce7', label: '< 35%' },
            { bg: '#fef9c3', label: '35–65%' },
            { bg: '#fed7aa', label: '65–90%' },
            { bg: '#fee2e2', label: '> 90%' },
          ].map((l) => (
            <span key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#6b7280' }}>
              <span style={{ width: 12, height: 12, borderRadius: 3, background: l.bg, border: '1px solid rgba(0,0,0,.08)', flexShrink: 0 }} />
              {l.label}
            </span>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
        {/* Week grid */}
        {mode === 'week' && (
          <div style={{ flex: 1, overflow: 'auto', maxHeight: 'calc(100vh - 260px)', borderRadius: 12 }}>
            <table className="ff-occ-grid">
              <thead>
                <tr>
                  <th style={{ width: 46, minWidth: 46 }} />
                  {weekDays.map((d) => {
                    const isToday = d === today;
                    return (
                      <th
                        key={d}
                        className={isToday ? 'today-col' : ''}
                        style={{ cursor: 'pointer', minWidth: 84 }}
                        onClick={() => { setSelectedDay(d); setMode('day'); setSelectedSlot(null); }}
                        title={t('res.occ.viewDayDetails')}
                      >
                        {fmtShortDate(d, language)}
                        {isToday && (
                          <span
                            style={{
                              display: 'block',
                              width: 5,
                              height: 5,
                              borderRadius: '50%',
                              background: '#1d4ed8',
                              margin: '3px auto 0',
                            }}
                          />
                        )}
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {slots.map((slot) => (
                  <tr key={slot}>
                    <td className="time-col">{slot}</td>
                    {weekDays.map((d) => {
                      const occ      = getOccupancy(d, slot);
                      const { bg, text } = occColor(occ.pct);
                      const isSelected = selectedSlot?.date === d && selectedSlot?.time === slot;
                      return (
                        <td
                          key={d}
                          className={`ff-occ-cell${isSelected ? ' selected' : ''}`}
                          style={{ background: isSelected ? '#dbeafe' : bg }}
                          onClick={() => selectSlot(d, slot)}
                        >
                          {occ.occupied.length > 0 ? (
                            <>
                              <span className="occ-pct" style={{ color: isSelected ? '#1d4ed8' : text }}>{occ.pct}%</span>
                              <span className="occ-count">{occ.occupied.length}/{occ.total}</span>
                            </>
                          ) : (
                            <span style={{ color: '#d1d5db', fontSize: 14, display: 'block', lineHeight: 1.5 }}>—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Day view */}
        {mode === 'day' && (
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: '#374151', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              <i className="bi bi-calendar3" style={{ color: '#1d4ed8' }} />
              {fmtFullDate(selectedDay, language)}
              {selectedDay === today && (
                <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 10px', fontWeight: 800 }}>
                  {t('res.today')}
                </span>
              )}
            </div>

            {slots.length === 0 ? (
              <div className="ff-empty-state">
                <i className="bi bi-clock ff-empty-state-icon" />
                <div className="ff-empty-state-title">{t('res.occ.noSlots')}</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                {slots.map((slot) => {
                  const occ      = getOccupancy(selectedDay, slot);
                  const { bg, text } = occColor(occ.pct);
                  const isSelected = selectedSlot?.date === selectedDay && selectedSlot?.time === slot;

                  return (
                    <div
                      key={slot}
                      className={`ff-occ-day-row${isSelected ? ' selected' : ''}`}
                      style={{ background: isSelected ? '#dbeafe' : bg }}
                      onClick={() => selectSlot(selectedDay, slot)}
                    >
                      <span style={{ fontWeight: 800, fontSize: 13, color: '#1f2937', fontVariantNumeric: 'tabular-nums' }}>
                        {slot}
                      </span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, height: 8, background: 'rgba(0,0,0,.08)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${occ.pct}%`, background: text, borderRadius: 4, transition: 'width .3s' }} />
                        </div>
                        <span style={{ fontWeight: 800, fontSize: 12, color: isSelected ? '#1d4ed8' : text, width: 38, textAlign: 'right' }}>
                          {occ.pct}%
                        </span>
                      </div>
                      <span style={{ fontSize: 11, textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>{t('res.occ.occupiedShort', { n: occ.occupied.length })}</span>
                        {' · '}
                        <span style={{ color: '#059669', fontWeight: 700 }}>{t('res.occ.freeShortN', { n: occ.available.length })}</span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Month view */}
        {mode === 'month' && (() => {
          const days = getMonthDays(monthStart);
          const firstDow = new Date(monthStart + 'T12:00:00').getDay();
          const padded: (string | null)[] = [...Array(firstDow).fill(null), ...days];
          while (padded.length % 7 !== 0) padded.push(null);
          const weeks: (string | null)[][] = [];
          for (let i = 0; i < padded.length; i += 7) weeks.push(padded.slice(i, i + 7));

          return (
            <div style={{ flex: 1, overflowX: 'auto' }}>
              <table className="ff-occ-month-grid">
                <thead>
                  <tr>
                    {weekdayShortNames(language).map((d, i) => <th key={i}>{d}</th>)}
                  </tr>
                </thead>
                <tbody>
                  {weeks.map((week, wi) => (
                    <tr key={wi}>
                      {week.map((date, di) => {
                        if (!date) return <td key={di} className="ff-occ-month-blank" />;
                        const peak = getDayPeakOccupancy(date);
                        const { bg, text } = occColor(peak.pct);
                        const isToday = date === today;
                        const isPast = date < today;
                        return (
                          <td
                            key={di}
                            className={`ff-occ-month-cell${isToday ? ' today' : ''}${isPast ? ' past' : ''}`}
                            style={{ background: peak.total === 0 ? '#f9fafb' : bg }}
                            onClick={() => { setSelectedDay(date); setMode('day'); setSelectedSlot(null); }}
                            title={t('res.occ.maxOccTitle', { date: fmtFullDate(date, language), pct: peak.pct })}
                          >
                            <span
                              className="ff-occ-month-day-num"
                              style={{ color: isToday ? '#1d4ed8' : isPast ? '#9ca3af' : '#1f2937' }}
                            >
                              {new Date(date + 'T12:00:00').getDate()}
                            </span>
                            {peak.pct > 0 && (
                              <span className="ff-occ-month-pct" style={{ color: isToday ? '#2563eb' : text }}>
                                {peak.pct}%
                              </span>
                            )}
                            {peak.pct === 0 && peak.total > 0 && (
                              <span className="ff-occ-month-free">{t('res.occ.freeLower')}</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}

        {/* Side panel */}
        {selectedSlot && detailOcc && (
          <div className="ff-occ-panel">
            <div className="ff-occ-panel-inner">
              {/* Header */}
              <div className="ff-occ-panel-head">
                <div style={{ flex: 1 }}>
                  <div className="ff-occ-panel-head-date">{fmtFullDate(selectedSlot.date, language)}</div>
                  <div className="ff-occ-panel-head-time">
                    <i className="bi bi-clock me-1" />{selectedSlot.time}
                    {selectedSlot.date === today && <span style={{ marginLeft: 8, background: '#2563eb', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>{t('res.today')}</span>}
                  </div>
                </div>
                <button
                  style={{ background: 'rgba(255,255,255,.1)', border: 'none', cursor: 'pointer', color: '#fff', borderRadius: 6, padding: '4px 8px' }}
                  onClick={() => { setSelectedSlot(null); setCancelTarget(null); }}
                >
                  <i className="bi bi-x-lg" />
                </button>
              </div>

              {/* Stats */}
              <div className="ff-occ-panel-stats">
                <div className="ff-occ-stat">
                  <span className="ff-occ-stat-val" style={{ color: '#dc2626' }}>{detailOcc.occupied.length}</span>
                  <span className="ff-occ-stat-lbl">{t('res.occ.occupied')}</span>
                </div>
                <div className="ff-occ-stat">
                  <span className="ff-occ-stat-val" style={{ color: '#059669' }}>{detailOcc.available.length}</span>
                  <span className="ff-occ-stat-lbl">{t('res.occ.free2')}</span>
                </div>
                <div className="ff-occ-stat">
                  <span className="ff-occ-stat-val" style={{ color: '#1d4ed8' }}>{detailOcc.pct}%</span>
                  <span className="ff-occ-stat-lbl">{t('res.occ.occ')}</span>
                </div>
              </div>

              {/* Table list */}
              <div className="ff-occ-panel-body">
                {viewTables.length === 0 && (
                  <div className="ff-empty-state" style={{ padding: '24px 16px' }}>
                    <i className="bi bi-grid-3x3-gap ff-empty-state-icon" />
                    <div className="ff-empty-state-title">{t('res.occ.noActiveTables')}</div>
                  </div>
                )}

                {/* Occupied tables section */}
                {detailOcc.occupied.length > 0 && (
                  <>
                    <div className="ff-occ-panel-section-label">{t('res.occ.occupied')} ({detailOcc.occupied.length})</div>
                    {detailOcc.occupied.map((tb) => {
                      const res = tableResAtSlot(tb.id, tb.number);
                      const isCanceling = cancelTarget === res?.id;
                      return (
                        <div key={tb.id} className={`ff-occ-tcard ${isCanceling ? 'canceling' : 'occupied'}`}>
                          <div className="ff-occ-tnum occupied">{tb.number}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {tb.zoneName && (
                              <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
                                {tb.zoneName}
                              </div>
                            )}
                            {res && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {res.customerName}
                                </div>
                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                                  {res.time} · {res.partySize}/{tb.capacity ?? '?'} pax{res.duration ? ` · ${res.duration}min` : ''}
                                </div>
                                <div style={{ marginTop: 1 }}>
                                  <StatusBadge status={res.status} />
                                </div>
                              </>
                            )}

                            {/* Cancel confirmation */}
                            {isCanceling && res && (
                              <div className="ff-cancel-confirm">
                                <div style={{ fontSize: 11, fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>
                                  {t('res.occ.cancelConfirm', { name: res.customerName })}
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ fontSize: '0.72rem', fontWeight: 700 }}
                                    onClick={() => handleCancelFromOcc(res.id)}
                                  >
                                    <i className="bi bi-x-circle-fill me-1" />{t('res.confirm')}
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ fontSize: '0.72rem' }}
                                    onClick={() => setCancelTarget(null)}
                                  >
                                    {t('res.back')}
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Actions for occupied table */}
                            {!isCanceling && res && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 6, flexWrap: 'wrap' }}>
                                <button
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: 5,
                                    background: '#f3f4f6',
                                    color: '#374151',
                                    border: '1px solid #d1d5db',
                                    cursor: 'pointer',
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setViewOccTarget(res); }}
                                >
                                  <i className="bi bi-eye me-1" />{t('res.view')}
                                </button>
                                <button
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: 5,
                                    background: '#eff6ff',
                                    color: '#1d4ed8',
                                    border: '1px solid #bfdbfe',
                                    cursor: 'pointer',
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setEditOccTarget(res); }}
                                >
                                  <i className="bi bi-pencil me-1" />{t('res.action.edit')}
                                </button>
                                <button
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 600,
                                    padding: '3px 8px',
                                    borderRadius: 5,
                                    background: '#fef2f2',
                                    color: '#dc2626',
                                    border: '1px solid #fca5a5',
                                    cursor: 'pointer',
                                  }}
                                  onClick={(e) => { e.stopPropagation(); setCancelTarget(res.id); }}
                                >
                                  <i className="bi bi-x-circle me-1" />{t('res.action.cancel')}
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Available tables section */}
                {detailOcc.available.length > 0 && (
                  <>
                    <div className="ff-occ-panel-section-label">{t('res.occ.available')} ({detailOcc.available.length})</div>
                    {detailOcc.available.map((tb) => (
                      <div key={tb.id} className="ff-occ-tcard available">
                        <div className="ff-occ-tnum available">{tb.number}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {tb.zoneName && (
                            <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
                              {tb.zoneName}
                            </div>
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>{t('res.available')}</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>
                            {tb.capacity ? t('res.seatsN', { n: tb.capacity }) : t('res.occ.capacityUndefined')}
                          </div>
                        </div>
                        <button
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            padding: '5px 10px',
                            borderRadius: 7,
                            background: '#1d4ed8',
                            color: '#fff',
                            border: 'none',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                            flexShrink: 0,
                          }}
                          onClick={(e) => { e.stopPropagation(); setQuickReserve({ tableId: tb.id, tableNumber: tb.number }); }}
                        >
                          <i className="bi bi-calendar-plus" style={{ fontSize: 11 }} />
                          {t('res.reserve')}
                        </button>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Quick reserve modal */}
      {quickReserve && selectedSlot && (
        <ReservationModal
          title={t('res.newReservationTable', { n: quickReserve.tableNumber })}
          initial={{
            ...EMPTY_FORM,
            date:    selectedSlot.date,
            time:    selectedSlot.time,
            tableId: quickReserve.tableId,
          }}
          tables={tables}
          onConfirm={handleQuickCreate}
          onClose={() => setQuickReserve(null)}
        />
      )}

      {/* Edit from occupancy */}
      {editOccTarget && (
        <ReservationModal
          title={t('res.action.editReservation')}
          initial={{
            customerName:  editOccTarget.customerName,
            customerPhone: editOccTarget.customerPhone,
            partySize:     String(editOccTarget.partySize),
            date:          editOccTarget.date,
            time:          editOccTarget.time,
            notes:         editOccTarget.notes ?? '',
            tableId:       editOccTarget.tableId ?? '',
            source:        editOccTarget.source ?? 'PHONE',
            duration:      String(editOccTarget.duration ?? 90),
            tags:          editOccTarget.tags ?? [],
          }}
          tables={tables}
          onConfirm={handleEditFromOcc}
          onClose={() => setEditOccTarget(null)}
        />
      )}

      {/* View (read-only) from occupancy */}
      {viewOccTarget && (
        <ReservationModal
          title={t('res.modal.details')}
          initial={{
            customerName:  viewOccTarget.customerName,
            customerPhone: viewOccTarget.customerPhone,
            partySize:     String(viewOccTarget.partySize),
            date:          viewOccTarget.date,
            time:          viewOccTarget.time,
            notes:         viewOccTarget.notes ?? '',
            tableId:       viewOccTarget.tableId ?? '',
            source:        viewOccTarget.source ?? 'PHONE',
            duration:      String(viewOccTarget.duration ?? 90),
            tags:          viewOccTarget.tags ?? [],
          }}
          tables={tables}
          onConfirm={() => {}}
          onClose={() => setViewOccTarget(null)}
          readOnly
        />
      )}
    </div>
  );
}

// ─── ReservationsPage ─────────────────────────────────────────────────────────

export function ReservationsPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <ReservationsInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function ReservationsInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t } = useLabels();
  const [tab, setTab]               = useState<Tab>('reservations');
  const [view, setView]             = useState<View>('agenda');
  const [dateScope, setDateScope]   = useState<DateScope>('today');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [walkIns, setWalkIns]       = useState<WalkIn[]>([]);
  const [settings, setSettings]     = useState<ReservationSettings | null>(null);
  const [tables, setTables]         = useState<DbTable[]>([]);
  const [date, setDate]             = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch]         = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | ''>('');
  const [showModal, setShowModal]   = useState(false);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const notify   = useNotify();
  const navigate = useNavigate();

  const todayStr = new Date().toISOString().slice(0, 10);

  async function loadReservations() {
    if (dateScope === 'all') {
      setReservations(await reservationService.listAll());
    } else {
      const d = dateScope === 'today' ? todayStr : date;
      setReservations(await reservationService.listForDate(d));
    }
  }
  async function loadWalkIns()  { setWalkIns(await reservationService.listWalkIns()); }
  async function loadSettings() { setSettings(await reservationService.getSettings()); }

  useEffect(() => {
    tableService.list().then((ts) => setTables(ts.filter((t) => t.active)));
    loadWalkIns();
    loadSettings();
  }, []);

  useEffect(() => { loadReservations(); }, [dateScope, date]);

  const filtered = reservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleCreate(form: typeof EMPTY_FORM) {
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.create({
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify(t('res.notif.createdShort'), 'success');
    setShowModal(false);
    loadReservations();
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editTarget) return;
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.update(editTarget.id, {
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify(t('res.notif.updated'), 'success');
    setEditTarget(null);
    loadReservations();
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await reservationService.updateStatus(id, status);
    notify(t('res.notif.status', { status: t(STATUS_CONFIG[status].labelKey) }), status === 'CANCELED' || status === 'NO_SHOW' ? 'danger' : 'success');
    loadReservations();
  }

  async function handleWalkInSeat(id: string) {
    await reservationService.updateWalkInStatus(id, 'SEATED', { seatedAt: new Date().toISOString() });
    notify(t('res.notif.customerSeated'), 'success');
    loadWalkIns();
  }

  async function handleWalkInCancel(id: string) {
    await reservationService.updateWalkInStatus(id, 'CANCELED');
    notify(t('res.notif.removedFromQueue'));
    loadWalkIns();
  }

  async function handleAddWalkIn(data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) {
    await reservationService.addWalkIn({
      customerName: data.customerName, customerPhone: data.customerPhone || undefined,
      partySize: data.partySize, estimatedWaitMinutes: data.estimatedWaitMinutes,
      arrivedAt: new Date().toISOString(),
    });
    notify(t('res.notif.addedToQueue'), 'success');
    setShowWalkInModal(false);
    loadWalkIns();
  }

  async function handleSaveSettings(data: Partial<ReservationSettings>) {
    const saved = await reservationService.saveSettings(data);
    setSettings(saved);
    notify(t('res.notif.settingsSaved'), 'success');
  }

  const waitingCount = walkIns.filter((w) => w.status === 'WAITING').length;

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'reservations', label: t('res.title'),         icon: 'bi-calendar-check' },
    { id: 'walkin',       label: t('res.tab.queue'),     icon: 'bi-people',         badge: waitingCount || undefined },
    { id: 'occupancy',    label: t('res.tab.occupancy'), icon: 'bi-grid-1x2' },
    { id: 'settings',     label: t('res.tab.settings'),  icon: 'bi-gear' },
  ];

  const views: { id: View; label: string; icon: string }[] = [
    { id: 'agenda',    label: t('res.view.agenda'),  icon: 'bi-calendar3' },
    { id: 'table',     label: t('res.view.table'),   icon: 'bi-table' },
    { id: 'by-table',  label: t('res.view.byTable'), icon: 'bi-layout-three-columns' },
  ];

  const initialDate = dateScope === 'date' ? date : todayStr;

  return (
    <div className="ff-area-layout">
      {drawerOpen && <div className="ff-area-drawer-backdrop ff-area-drawer-backdrop--open" onClick={() => setDrawerOpen(false)} />}

      <aside className={`ff-area-sidebar${drawerOpen ? ' ff-area-sidebar--open' : ''}`}>
        <button className="ff-area-sidebar-close" onClick={() => setDrawerOpen(false)} aria-label={t('res.closeMenu')}>
          <i className="bi bi-x-lg" />
        </button>
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-calendar-check me-2" />{t('res.title')}
        </div>
        <nav className="ff-area-sidebar-nav">
          {tabs.map((t) => (
            <button key={t.id} className={`ff-nav-item${tab === t.id ? ' active' : ''}`} onClick={() => { setTab(t.id); setDrawerOpen(false); }}>
              <i className={`bi ${t.icon}`} />
              {t.label}
              {t.badge ? <span className="ff-nav-item-badge">{t.badge}</span> : null}
            </button>
          ))}
          <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,.1)' }} />
          <button className="ff-nav-item" onClick={() => { navigate('/'); setDrawerOpen(false); }}>
            <i className="bi bi-house" />{t('res.hub')}
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        {/* Topbar */}
        <div className="ff-area-topbar ff-res-topbar-sticky">
          <button className="ff-area-hamburger" onClick={() => setDrawerOpen(true)} aria-label={t('res.openMenu')}>
            <i className="bi bi-list" />
          </button>
          <span className="ff-area-topbar-title">
            {tab === 'reservations' && t('res.title')}
            {tab === 'walkin'       && t('res.walkin.queue')}
            {tab === 'occupancy'    && t('res.topbar.occupancy')}
            {tab === 'settings'     && t('res.topbar.settings')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {tab === 'reservations' && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-lg me-1" />{t('res.newReservation')}
              </button>
            )}
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
        </div>

        {/* Sub-controls — Reservations tab only */}
        {tab === 'reservations' && (
          <div className="ff-res-controls">
            {/* View switcher + Date scope */}
            <div className="ff-res-controls-row">
              <div className="ff-res-view-switcher">
                {views.map((v) => (
                  <button key={v.id} className={`ff-res-view-btn${view === v.id ? ' active' : ''}`} onClick={() => setView(v.id)}>
                    <i className={`bi ${v.icon}`} />{v.label}
                  </button>
                ))}
              </div>
              <div className="ff-res-date-scope">
                <button className={`ff-res-scope-btn${dateScope === 'today' ? ' active' : ''}`} onClick={() => setDateScope('today')}>{t('res.today')}</button>
                <button className={`ff-res-scope-btn${dateScope === 'date'  ? ' active' : ''}`} onClick={() => setDateScope('date')}>
                  <i className="bi bi-calendar3 me-1" />{t('res.scope.date')}
                </button>
                {dateScope === 'date' && (
                  <input type="date" className="form-control form-control-sm ff-res-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
                )}
                <button className={`ff-res-scope-btn${dateScope === 'all' ? ' active' : ''}`} onClick={() => setDateScope('all')}>{t('res.scope.all')}</button>
              </div>
            </div>

            {/* Search + Status */}
            <div className="ff-res-controls-row" style={{ marginTop: 10 }}>
              <div className="ff-res-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.83rem', pointerEvents: 'none' }} />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 28, width: '100%' }}
                  placeholder={t('res.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: 155, flexShrink: 0 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | '')}
              >
                <option value="">{t('res.allStatuses')}</option>
                {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                  <option key={s} value={s}>{t(STATUS_CONFIG[s].labelKey)}</option>
                ))}
              </select>
            </div>

            {/* Status chips — Agenda only */}
            {view === 'agenda' && (
              <div className="ff-res-chip-row">
                {(['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const).map((s) => (
                  <button key={s || 'all'} className={`ff-res-chip${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
                    {s === '' ? t('res.scope.all') : <><i className={`bi ${STATUS_CONFIG[s].icon}`} style={{ fontSize: 11, color: filterStatus === s ? 'inherit' : STATUS_CONFIG[s].accent }} />{t(STATUS_CONFIG[s].labelKey)}</>}
                    {s !== '' && (
                      <span style={{ background: filterStatus === s ? 'rgba(255,255,255,.2)' : '#e5e7eb', color: filterStatus === s ? '#fff' : '#6b7280', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                        {reservations.filter((r) => r.status === s).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ff-area-content">
          {tab === 'reservations' && (
            <>
              {view === 'agenda' && (
                <AgendaView filtered={filtered} todayStr={todayStr} tables={tables} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
              {view === 'table' && (
                <ReservationTableView reservations={filtered} tables={tables} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
              {view === 'by-table' && (
                <ByTableView reservations={filtered} tables={tables} settings={settings} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
            </>
          )}
          {tab === 'walkin'    && <WalkInPanel walkIns={walkIns} tables={tables} onSeat={handleWalkInSeat} onCancel={handleWalkInCancel} onAdd={() => setShowWalkInModal(true)} />}
          {tab === 'occupancy' && <OccupancyView tables={tables} settings={settings} />}
          {tab === 'settings'  && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}
        </div>
      </div>

      {showModal && (
        <ReservationModal title={t('res.newReservation')} initial={{ ...EMPTY_FORM, date: initialDate }} tables={tables} onConfirm={handleCreate} onClose={() => setShowModal(false)} />
      )}
      {editTarget && (
        <ReservationModal
          title={t('res.action.editReservation')}
          initial={{ customerName: editTarget.customerName, customerPhone: editTarget.customerPhone, partySize: String(editTarget.partySize), date: editTarget.date, time: editTarget.time, notes: editTarget.notes ?? '', tableId: editTarget.tableId ?? '', source: editTarget.source ?? 'PHONE', duration: String(editTarget.duration ?? 90), tags: editTarget.tags ?? [] }}
          tables={tables}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
          readOnly={['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(editTarget.status)}
        />
      )}
      {showWalkInModal && <AddWalkInModal onConfirm={handleAddWalkIn} onClose={() => setShowWalkInModal(false)} />}
    </div>
  );
}
