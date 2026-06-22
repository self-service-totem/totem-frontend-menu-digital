import type { LabelKey } from '@/i18n/labels';
import type { Reservation, ReservationStatus, ReservationTag, ReservationSource } from '@/lib/types';

export type Translate = (key: LabelKey, params?: Record<string, string | number>) => string;

export type Tab = 'reservations' | 'walkin' | 'occupancy' | 'settings';
export type View = 'agenda' | 'table' | 'by-table';
export type DateScope = 'today' | 'date' | 'all';
export type UrgencyKind = 'overdue' | 'upcoming' | 'no-table' | 'vip' | 'large';

// ─── Config ───────────────────────────────────────────────────────────────────

export const STATUS_CONFIG: Record<
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

export const TAG_CONFIG: Record<ReservationTag, { labelKey: LabelKey; color: string; bg: string }> = {
  BIRTHDAY:    { labelKey: 'res.tag.birthday',    color: '#9d174d', bg: '#fdf2f8' },
  VIP:         { labelKey: 'res.tag.vip',         color: '#4c1d95', bg: '#f5f3ff' },
  ALLERGY:     { labelKey: 'res.tag.allergy',     color: '#991b1b', bg: '#fef2f2' },
  ANNIVERSARY: { labelKey: 'res.tag.anniversary', color: '#831843', bg: '#fdf2f8' },
  LATE:        { labelKey: 'res.tag.late',        color: '#92400e', bg: '#fffbeb' },
};

export const SOURCE_CONFIG: Record<ReservationSource, { labelKey: LabelKey; icon: string }> = {
  PHONE:   { labelKey: 'res.source.phone',  icon: 'bi-telephone-fill' },
  WALK_IN: { labelKey: 'res.source.walkIn', icon: 'bi-person-walking' },
  ONLINE:  { labelKey: 'res.source.online', icon: 'bi-globe2' },
};

export const ALL_TAGS: ReservationTag[] = ['BIRTHDAY', 'VIP', 'ALLERGY', 'ANNIVERSARY', 'LATE'];

export const EMPTY_FORM = {
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

// ─── Date helpers ─────────────────────────────────────────────────────────────

export function timeAgo(iso: string, t: Translate): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return t('res.timeNow');
  if (mins < 60) return t('res.minN', { n: mins });
  return t('res.hoursN', { n: Math.floor(mins / 60) });
}

export function toMins(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

export function addDaysStr(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

export function getMonday(): string {
  const d = new Date();
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.toISOString().slice(0, 10);
}

export function getMonthStart(): string {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

export function addMonths(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T12:00:00');
  d.setMonth(d.getMonth() + n);
  d.setDate(1);
  return d.toISOString().slice(0, 10);
}

export function fmtMonthYear(monthStart: string, locale: string): string {
  const d = new Date(monthStart + 'T12:00:00');
  return d.toLocaleDateString(locale, { month: 'long', year: 'numeric' });
}

export function getMonthDays(monthStart: string): string[] {
  const d = new Date(monthStart + 'T12:00:00');
  const year = d.getFullYear();
  const month = d.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  return Array.from({ length: lastDay }, (_, i) =>
    new Date(year, month, i + 1).toISOString().slice(0, 10),
  );
}

export function generateSlots(opening: string, closing: string, intervalMin: number): string[] {
  const slots: string[] = [];
  let cur = toMins(opening);
  const end = toMins(closing);
  while (cur < end) {
    slots.push(`${String(Math.floor(cur / 60)).padStart(2, '0')}:${String(cur % 60).padStart(2, '0')}`);
    cur += intervalMin;
  }
  return slots;
}

export function weekdayShortNames(locale: string): string[] {
  // 2024-01-07 is a Sunday → Sun..Sat localized
  return Array.from({ length: 7 }, (_, i) =>
    new Date(Date.UTC(2024, 0, 7 + i, 12)).toLocaleDateString(locale, { weekday: 'short' }),
  );
}

export function fmtShortDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  const wd = d.toLocaleDateString(locale, { weekday: 'short' });
  return `${wd} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export function fmtFullDate(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, { weekday: 'long', day: 'numeric', month: 'short' });
}

// ─── Occupancy helpers ────────────────────────────────────────────────────────

export function occColor(pct: number): { bg: string; text: string } {
  if (pct === 0) return { bg: '#ffffff', text: '#9ca3af' };
  if (pct < 35)  return { bg: '#dcfce7', text: '#15803d' };
  if (pct < 65)  return { bg: '#fef9c3', text: '#a16207' };
  if (pct < 90)  return { bg: '#fed7aa', text: '#c2410c' };
  return { bg: '#fee2e2', text: '#dc2626' };
}

export function getUrgencySignal(
  r: Reservation,
  t: Translate,
): { kind: UrgencyKind; label: string } | null {
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
