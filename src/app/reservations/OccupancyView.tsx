import { useEffect, useState } from 'react';
import { useLabels } from '@/i18n/I18nContext';
import { useNotify } from '@/lib/notifications';
import { reservationService } from '@/lib/services/reservationService';
import type { Reservation, ReservationSettings, DbTable } from '@/lib/types';
import {
  EMPTY_FORM,
  toMins, addDaysStr, getMonday, getMonthStart, addMonths,
  fmtMonthYear, getMonthDays, generateSlots, weekdayShortNames,
  fmtShortDate, fmtFullDate, occColor,
} from './reservationsUtils';
import { StatusBadge } from './StatusBadge';
import { ReservationModal } from './ReservationModal';

const TABLE_CHIP_PALETTE = [
  '#0ea5e9', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#14b8a6', '#ec4899', '#f97316',
];

interface OccupancyViewProps {
  tables: DbTable[];
  settings: ReservationSettings | null;
}

export function OccupancyView({ tables, settings }: OccupancyViewProps) {
  const { t, language } = useLabels();
  const notify = useNotify();
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

  async function loadOccReservations() {
    setOccReservations(await reservationService.listAll());
  }

  useEffect(() => { loadOccReservations(); }, []);

  const activeTables = tables.filter((t) => t.active);
  const viewTables   = selectedTableId ? activeTables.filter((t) => t.id === selectedTableId) : activeTables;
  const opening   = settings?.openingTime ?? '11:00';
  const closing   = settings?.closingTime ?? '23:00';
  const interval  = settings?.slotIntervalMinutes ?? 30;
  const defaultDur = settings?.defaultDurationMinutes ?? 90;
  const slots    = generateSlots(opening, closing, interval);
  const weekDays = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  function getOccupancy(date: string, time: string) {
    const slotStart = toMins(time);
    const occupied = viewTables.filter((tb) =>
      occReservations.some((r) => {
        if (r.date !== date) return false;
        if (r.tableId !== tb.id && r.tableNumber !== tb.number) return false;
        if (r.status === 'CANCELED' || r.status === 'NO_SHOW' || r.status === 'COMPLETED') return false;
        const rStart = toMins(r.time);
        const rEnd   = rStart + (r.duration ?? defaultDur);
        return slotStart >= rStart && slotStart < rEnd;
      })
    );
    const total = viewTables.length;
    const pct   = total > 0 ? Math.round((occupied.length / total) * 100) : 0;
    return { occupied, available: viewTables.filter((tb) => !occupied.includes(tb)), total, pct };
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
    const table = tables.find((tb) => tb.id === form.tableId);
    await reservationService.create({
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    setQuickReserve(null);
    notify(t('res.notif.created'), 'success');
    await loadOccReservations();
  }

  async function handleEditFromOcc(form: typeof EMPTY_FORM) {
    if (!editOccTarget) return;
    const table = tables.find((tb) => tb.id === form.tableId);
    await reservationService.update(editOccTarget.id, {
      customerName: form.customerName, customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2, date: form.date, time: form.time,
      notes: form.notes || undefined, tableId: form.tableId || undefined,
      tableNumber: table?.number, source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    setEditOccTarget(null);
    notify(t('res.notif.updated'), 'success');
    await loadOccReservations();
  }

  const detailOcc = selectedSlot ? getOccupancy(selectedSlot.date, selectedSlot.time) : null;

  return (
    <div className="ff-occ-outer">
      {/* Table filter chips */}
      {activeTables.length > 0 && (
        <div className="ff-occ-filter-bar">
          <span className="ff-occ-filter-label">
            <i className="bi bi-grid-3x3-gap me-1" />{t('res.col.table')}
          </span>

          <button
            style={{
              background: selectedTableId === null ? '#1d4ed8' : '#fff',
              color: selectedTableId === null ? '#fff' : '#374151',
              border: `1.5px solid ${selectedTableId === null ? '#1d4ed8' : '#d1d5db'}`,
              borderRadius: 20, padding: '5px 15px', fontSize: 13, fontWeight: 700,
              cursor: 'pointer', transition: 'all .14s', display: 'flex', alignItems: 'center', gap: 5,
            }}
            onClick={() => { setSelectedTableId(null); setSelectedSlot(null); }}
          >
            <i className={`bi ${selectedTableId === null ? 'bi-check2' : 'bi-table'}`} style={{ fontSize: 12 }} />
            {t('res.occ.allTables')}
          </button>

          {activeTables.map((tb, idx) => {
            const col = TABLE_CHIP_PALETTE[idx % TABLE_CHIP_PALETTE.length];
            const isSelected = selectedTableId === tb.id;
            return (
              <button
                key={tb.id}
                style={{
                  background: isSelected ? col : '#fff',
                  color: isSelected ? '#fff' : '#374151',
                  border: `1.5px solid ${isSelected ? col : '#d1d5db'}`,
                  borderRadius: 20, padding: '5px 13px', fontSize: 13, fontWeight: 700,
                  cursor: 'pointer', transition: 'all .14s', display: 'flex', alignItems: 'center',
                  gap: 4, whiteSpace: 'nowrap',
                }}
                onClick={() => { setSelectedTableId(isSelected ? null : tb.id); setSelectedSlot(null); }}
              >
                {tb.number}
                {tb.zoneName && <span style={{ fontWeight: 400, opacity: 0.8, fontSize: 11 }}>{tb.zoneName}</span>}
              </button>
            );
          })}
        </div>
      )}

      {/* Controls bar */}
      <div className="ff-occ-controls">
        {/* Week / Day / Month toggle */}
        <div className="ff-occ-mode-toggle">
          {(['week', 'day', 'month'] as const).map((m) => (
            <button
              key={m}
              style={{
                background: mode === m ? '#fff' : 'transparent', border: 'none', borderRadius: 6,
                padding: '6px 14px', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                color: mode === m ? '#111827' : '#6b7280',
                boxShadow: mode === m ? '0 1px 3px rgba(0,0,0,.1)' : 'none', transition: 'all .14s',
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
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setWeekStart(getMonday())}>{t('res.today')}</button>
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
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedDay(today)}>{t('res.today')}</button>
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
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setMonthStart(getMonthStart())}>{t('res.today')}</button>
          </div>
        )}

        {/* Legend */}
        <div className="ff-occ-legend">
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
      <div className="ff-occ-main">
        {/* Week grid */}
        {mode === 'week' && (
          <div className="ff-occ-week-wrap">
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
                          <span style={{ display: 'block', width: 5, height: 5, borderRadius: '50%', background: '#1d4ed8', margin: '3px auto 0' }} />
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
                      const occ = getOccupancy(d, slot);
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
          <div className="ff-occ-day-wrap">
            <div className="ff-occ-day-header">
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
              <div className="ff-occ-slot-list">
                {slots.map((slot) => {
                  const occ = getOccupancy(selectedDay, slot);
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
            <div className="ff-occ-month-wrap">
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
                              <span className="ff-occ-month-pct" style={{ color: isToday ? '#2563eb' : text }}>{peak.pct}%</span>
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
                    {selectedSlot.date === today && (
                      <span style={{ marginLeft: 8, background: '#2563eb', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>{t('res.today')}</span>
                    )}
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

                {/* Occupied tables */}
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
                                  style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); setViewOccTarget(res); }}
                                >
                                  <i className="bi bi-eye me-1" />{t('res.view')}
                                </button>
                                <button
                                  style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', cursor: 'pointer' }}
                                  onClick={(e) => { e.stopPropagation(); setEditOccTarget(res); }}
                                >
                                  <i className="bi bi-pencil me-1" />{t('res.action.edit')}
                                </button>
                                <button
                                  style={{ fontSize: 10, fontWeight: 600, padding: '3px 8px', borderRadius: 5, background: '#fef2f2', color: '#dc2626', border: '1px solid #fca5a5', cursor: 'pointer' }}
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

                {/* Available tables */}
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
                            fontSize: 11, fontWeight: 700, padding: '5px 10px', borderRadius: 7,
                            background: '#1d4ed8', color: '#fff', border: 'none', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0,
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
          initial={{ ...EMPTY_FORM, date: selectedSlot.date, time: selectedSlot.time, tableId: quickReserve.tableId }}
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
            customerName: editOccTarget.customerName, customerPhone: editOccTarget.customerPhone,
            partySize: String(editOccTarget.partySize), date: editOccTarget.date, time: editOccTarget.time,
            notes: editOccTarget.notes ?? '', tableId: editOccTarget.tableId ?? '',
            source: editOccTarget.source ?? 'PHONE', duration: String(editOccTarget.duration ?? 90),
            tags: editOccTarget.tags ?? [],
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
            customerName: viewOccTarget.customerName, customerPhone: viewOccTarget.customerPhone,
            partySize: String(viewOccTarget.partySize), date: viewOccTarget.date, time: viewOccTarget.time,
            notes: viewOccTarget.notes ?? '', tableId: viewOccTarget.tableId ?? '',
            source: viewOccTarget.source ?? 'PHONE', duration: String(viewOccTarget.duration ?? 90),
            tags: viewOccTarget.tags ?? [],
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
