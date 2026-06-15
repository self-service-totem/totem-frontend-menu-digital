import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService } from '@/lib/services/reservationService';
import { tableService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type {
  Reservation,
  ReservationStatus,
  ReservationTag,
  ReservationSource,
  DbTable,
  WalkIn,
  ReservationSettings,
} from '@/lib/types';

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  ReservationStatus,
  { label: string; color: string; bg: string; border: string; accent: string; icon: string }
> = {
  PENDING:   { label: 'Pendente',   color: '#b45309', bg: '#fffbeb', border: '#fde68a', accent: '#d97706', icon: 'bi-hourglass-split' },
  CONFIRMED: { label: 'Confirmada', color: '#065f46', bg: '#ecfdf5', border: '#6ee7b7', accent: '#059669', icon: 'bi-check-circle-fill' },
  SEATED:    { label: 'Sentado',    color: '#1e40af', bg: '#eff6ff', border: '#93c5fd', accent: '#2563eb', icon: 'bi-person-check-fill' },
  COMPLETED: { label: 'Concluída',  color: '#374151', bg: '#f3f4f6', border: '#d1d5db', accent: '#9ca3af', icon: 'bi-check2-all' },
  CANCELED:  { label: 'Cancelada',  color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb', accent: '#d1d5db', icon: 'bi-x-circle' },
  NO_SHOW:   { label: 'Não veio',   color: '#991b1b', bg: '#fef2f2', border: '#fca5a5', accent: '#dc2626', icon: 'bi-person-x-fill' },
};

const TAG_CONFIG: Record<ReservationTag, { label: string; color: string; bg: string }> = {
  BIRTHDAY:    { label: '🎂 Aniversário',     color: '#9d174d', bg: '#fdf2f8' },
  VIP:         { label: '⭐ VIP',             color: '#4c1d95', bg: '#f5f3ff' },
  ALLERGY:     { label: '⚠️ Alergia',         color: '#991b1b', bg: '#fef2f2' },
  ANNIVERSARY: { label: '💍 Casal',           color: '#831843', bg: '#fdf2f8' },
  LATE:        { label: '⏰ Atraso',          color: '#92400e', bg: '#fffbeb' },
};

const SOURCE_CONFIG: Record<ReservationSource, { label: string; icon: string }> = {
  PHONE:   { label: 'Telefone',   icon: 'bi-telephone-fill' },
  WALK_IN: { label: 'Presencial', icon: 'bi-person-walking' },
  ONLINE:  { label: 'Online',     icon: 'bi-globe2' },
};

type Tab = 'today' | 'all' | 'walkin' | 'occupancy' | 'settings';

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

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins === 1) return '1 min';
  if (mins < 60) return `${mins} min`;
  return `${Math.floor(mins / 60)}h`;
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

function fmtMonthYear(monthStart: string): string {
  const d = new Date(monthStart + 'T12:00:00');
  const months = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
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

const WEEKDAY_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const WEEKDAY_FULL  = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function fmtShortDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAY_SHORT[d.getDay()]} ${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function fmtFullDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} de ${['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'][d.getMonth()]}`;
}

function occColor(pct: number): { bg: string; text: string } {
  if (pct === 0)  return { bg: '#ffffff', text: '#9ca3af' };
  if (pct < 35)  return { bg: '#dcfce7', text: '#15803d' };
  if (pct < 65)  return { bg: '#fef9c3', text: '#a16207' };
  if (pct < 90)  return { bg: '#fed7aa', text: '#c2410c' };
  return { bg: '#fee2e2', text: '#dc2626' };
}

type UrgencyKind = 'overdue' | 'upcoming' | 'no-table' | 'vip' | 'large';

function getUrgencySignal(r: Reservation): { kind: UrgencyKind; label: string } | null {
  const closed = ['COMPLETED', 'CANCELED', 'NO_SHOW'] as ReservationStatus[];
  if (closed.includes(r.status)) return null;

  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  if (r.date !== today) return null;

  const resM = toMins(r.time);
  const nowM = now.getHours() * 60 + now.getMinutes();
  const diff = resM - nowM;

  if (diff < 0 && diff > -45 && r.status !== 'SEATED') {
    return { kind: 'overdue', label: `Atrasada ${Math.abs(diff)}min` };
  }
  if (diff >= 0 && diff <= 15) {
    return { kind: 'upcoming', label: `Em ${diff === 0 ? 'agora' : `${diff}min`}` };
  }
  if (!r.tableId && !r.tableNumber && r.status === 'CONFIRMED') {
    return { kind: 'no-table', label: 'Sem mesa' };
  }
  if ((r.tags ?? []).includes('VIP')) {
    return { kind: 'vip', label: 'VIP' };
  }
  if (r.partySize >= 8) {
    return { kind: 'large', label: `${r.partySize} pessoas` };
  }
  return null;
}

// ─── StatusBadge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ReservationStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="ff-res-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {cfg.label}
    </span>
  );
}

// ─── MetricsRow ───────────────────────────────────────────────────────────────

function MetricsRow({ reservations }: { reservations: Reservation[] }) {
  const counts = {
    total:     reservations.length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    pending:   reservations.filter((r) => r.status === 'PENDING').length,
    seated:    reservations.filter((r) => r.status === 'SEATED').length,
    canceled:  reservations.filter((r) => r.status === 'CANCELED').length,
    noShow:    reservations.filter((r) => r.status === 'NO_SHOW').length,
  };

  const metrics = [
    { label: 'Total',       value: counts.total,     color: '#1d4ed8', bg: '#eff6ff',  icon: 'bi-calendar3' },
    { label: 'Confirmadas', value: counts.confirmed,  color: '#059669', bg: '#ecfdf5',  icon: 'bi-check-circle-fill' },
    { label: 'Pendentes',   value: counts.pending,    color: '#d97706', bg: '#fffbeb',  icon: 'bi-hourglass-split' },
    { label: 'Sentados',    value: counts.seated,     color: '#2563eb', bg: '#eff6ff',  icon: 'bi-person-check-fill' },
    { label: 'Canceladas',  value: counts.canceled,   color: '#9ca3af', bg: '#f3f4f6',  icon: 'bi-x-circle' },
    { label: 'Não vieram',  value: counts.noShow,     color: '#dc2626', bg: '#fef2f2',  icon: 'bi-person-x-fill' },
  ];

  return (
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '9px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 108,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 9,
              background: m.bg,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: '1rem' }} />
          </div>
          <div>
            <div style={{ fontSize: '1.35rem', fontWeight: 800, lineHeight: 1, color: m.color, fontVariantNumeric: 'tabular-nums' }}>
              {m.value}
            </div>
            <div style={{ fontSize: '0.71rem', color: '#9ca3af', marginTop: 1, fontWeight: 600 }}>{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── ReservationCard ──────────────────────────────────────────────────────────

interface ReservationCardProps {
  r: Reservation;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
  showDate?: boolean;
}

function ReservationCard({ r, tables, onStatusChange, onEdit, showDate }: ReservationCardProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const urgency = getUrgencySignal(r);

  const tableLabel = r.tableNumber
    ? `Mesa ${r.tableNumber}`
    : r.tableId
    ? `Mesa ${tables.find((t) => t.id === r.tableId)?.number ?? r.tableId}`
    : null;

  const isActive = ['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status);

  function getPrimaryAction(): { label: string; nextStatus: ReservationStatus; cls: string } | null {
    if (r.status === 'PENDING')   return { label: 'Confirmar', nextStatus: 'CONFIRMED', cls: 'btn-success' };
    if (r.status === 'CONFIRMED') return { label: 'Sentar',    nextStatus: 'SEATED',    cls: 'btn-primary' };
    if (r.status === 'SEATED')    return { label: 'Concluir',  nextStatus: 'COMPLETED', cls: 'btn-success' };
    return null;
  }

  const primary = getPrimaryAction();

  return (
    <div className={`ff-res-card s-${r.status.toLowerCase()}`}>
      {/* Time column */}
      <div className="ff-res-time-col">
        <span className="ff-res-time-main">{r.time}</span>
        {r.duration && (
          <span style={{ fontSize: '0.68rem', color: '#9ca3af', marginTop: 2 }}>{r.duration}min</span>
        )}
        {showDate && (
          <span style={{ fontSize: '0.65rem', color: '#9ca3af', marginTop: 1, textAlign: 'center' }}>
            {new Date(r.date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
          </span>
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
                {tc.label}
              </span>
            );
          })}
        </div>

        {/* Metadata row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '3px 10px', marginTop: 5, fontSize: '0.8rem', color: '#6b7280' }}>
          <span><i className="bi bi-people-fill me-1" style={{ fontSize: 11 }} />{r.partySize} pessoas</span>
          {r.customerPhone && (
            <span><i className="bi bi-telephone-fill me-1" style={{ fontSize: 11 }} />{r.customerPhone}</span>
          )}
          {tableLabel && (
            <span><i className="bi bi-grid-3x3-gap-fill me-1" style={{ fontSize: 11 }} />{tableLabel}</span>
          )}
          {r.source && (
            <span>
              <i className={`bi ${SOURCE_CONFIG[r.source].icon} me-1`} style={{ fontSize: 11 }} />
              {SOURCE_CONFIG[r.source].label}
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
              Sem mesa
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

        {/* Overflow menu */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ fontSize: '0.78rem', padding: '4px 10px', width: primary ? '100%' : undefined }}
            onClick={() => setDropOpen((v) => !v)}
          >
            <i className="bi bi-three-dots-vertical me-1" />
            {!primary ? 'Ações' : 'Mais'}
          </button>
          {dropOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 99 }} onClick={() => setDropOpen(false)} />
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: '100%',
                  marginTop: 4,
                  background: '#fff',
                  border: '1px solid #e5e7eb',
                  borderRadius: 10,
                  boxShadow: '0 6px 24px rgba(0,0,0,.12)',
                  zIndex: 100,
                  minWidth: 190,
                  overflow: 'hidden',
                }}
              >
                {r.status === 'PENDING' && (
                  <DropItem
                    icon="bi-person-check-fill" label="Sentar diretamente"
                    onClick={() => { onStatusChange(r.id, 'SEATED'); setDropOpen(false); }}
                  />
                )}
                {isActive && (
                  <DropItem
                    icon="bi-pencil" label="Editar reserva"
                    onClick={() => { onEdit(r); setDropOpen(false); }}
                  />
                )}
                {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                  <DropItem
                    icon="bi-person-x-fill" label="Não compareceu" danger
                    onClick={() => { onStatusChange(r.id, 'NO_SHOW'); setDropOpen(false); }}
                  />
                )}
                {isActive && (
                  <DropItem
                    icon="bi-x-circle-fill" label="Cancelar reserva" danger
                    onClick={() => { onStatusChange(r.id, 'CANCELED'); setDropOpen(false); }}
                  />
                )}
                {(r.status === 'CANCELED' || r.status === 'NO_SHOW') && (
                  <DropItem
                    icon="bi-arrow-counterclockwise" label="Reabrir como pendente"
                    onClick={() => { onStatusChange(r.id, 'PENDING'); setDropOpen(false); }}
                  />
                )}
                {(r.status === 'COMPLETED' || r.status === 'CANCELED' || r.status === 'NO_SHOW') && (
                  <DropItem
                    icon="bi-eye" label="Ver detalhes"
                    onClick={() => { onEdit(r); setDropOpen(false); }}
                  />
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function DropItem({ icon, label, onClick, danger }: { icon: string; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '9px 14px',
        fontSize: '0.84rem',
        width: '100%',
        textAlign: 'left',
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        color: danger ? '#dc2626' : '#374151',
        fontWeight: 500,
        borderBottom: '1px solid #f9fafb',
        transition: 'background .1s',
      }}
      onMouseEnter={(e) => (e.currentTarget.style.background = '#f9fafb')}
      onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
      onClick={onClick}
    >
      <i className={`bi ${icon}`} style={{ fontSize: 13, flexShrink: 0 }} />
      {label}
    </button>
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
  const waiting = walkIns.filter((w) => w.status === 'WAITING');
  const past    = walkIns.filter((w) => w.status !== 'WAITING');

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Fila de espera</span>
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
          <i className="bi bi-plus me-1" />Adicionar à fila
        </button>
      </div>

      {/* Empty state */}
      {waiting.length === 0 && (
        <div className="ff-empty-state">
          <i className="bi bi-people ff-empty-state-icon" />
          <div className="ff-empty-state-title">Fila vazia</div>
          <div className="ff-empty-state-desc">Nenhum cliente aguardando no momento.</div>
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
                  <span><i className="bi bi-people-fill me-1" />{w.partySize} pessoas</span>
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
                    {isLong ? 'Aguardando há ' : 'Há '}{timeAgo(w.arrivedAt)}
                  </span>
                  {w.estimatedWaitMinutes && (
                    <span style={{ fontSize: '0.74rem', color: '#9ca3af' }}>
                      Espera estimada: ~{w.estimatedWaitMinutes}min
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
                  <i className="bi bi-person-check-fill me-1" />Sentar
                </button>
                <button
                  className="btn btn-sm btn-outline-secondary"
                  style={{ fontSize: '0.78rem' }}
                  onClick={() => onCancel(w.id)}
                >
                  Remover
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
            Histórico de hoje ({past.length})
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
                    {w.partySize} pessoas ·{' '}
                    {w.status === 'SEATED' ? (
                      <span style={{ color: '#059669' }}>Sentado</span>
                    ) : (
                      <span style={{ color: '#9ca3af' }}>Removido</span>
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
        Configurações de reservas
      </div>

      <div className="ff-modal-section" style={{ marginBottom: 16 }}>
        <span className="ff-modal-section-label">Horários de funcionamento</span>
        <div className="ff-modal-section-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          {[
            { label: 'Abertura',   key: 'openingTime' as const, type: 'time' },
            { label: 'Fechamento', key: 'closingTime' as const, type: 'time' },
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
        <span className="ff-modal-section-label">Parâmetros</span>
        <div className="ff-modal-section-body">
          {[
            { label: 'Duração padrão (min)',     key: 'defaultDurationMinutes' as const, hint: 'Duração padrão de cada reserva' },
            { label: 'Tolerância de atraso (min)', key: 'lateToleranceMinutes' as const, hint: 'Antes de marcar como não compareceu' },
            { label: 'Intervalo entre horários (min)', key: 'slotIntervalMinutes' as const, hint: 'Granularidade no mapa de ocupação' },
            { label: 'Máximo de pessoas por reserva', key: 'maxPartySize' as const, hint: '' },
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
          <i className="bi bi-floppy me-1" />Salvar configurações
        </button>
        {saved && (
          <span style={{ fontSize: '0.85rem', color: '#059669', display: 'flex', alignItems: 'center', gap: 5 }}>
            <i className="bi bi-check-circle-fill" />Salvo!
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
            <span className="ff-modal-section-label">Dados do cliente</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">Nome *</span>
                <input
                  className="form-control form-control-sm"
                  value={form.customerName}
                  readOnly={readOnly}
                  onChange={(e) => field('customerName', e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">Telefone</span>
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
                  <span className="ff-admin-modal-label">Nº de pessoas</span>
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
            <span className="ff-modal-section-label">Detalhes da reserva</span>
            <div className="ff-modal-section-body">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                <div>
                  <span className="ff-admin-modal-label">Data</span>
                  <input
                    className="form-control form-control-sm"
                    type="date"
                    value={form.date}
                    readOnly={readOnly}
                    onChange={(e) => field('date', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">Horário</span>
                  <input
                    className="form-control form-control-sm"
                    type="time"
                    value={form.time}
                    readOnly={readOnly}
                    onChange={(e) => field('time', e.target.value)}
                  />
                </div>
                <div>
                  <span className="ff-admin-modal-label">Duração (min)</span>
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
                <span className="ff-admin-modal-label">Origem</span>
                <select
                  className="form-select form-select-sm"
                  value={form.source}
                  disabled={readOnly}
                  onChange={(e) => field('source', e.target.value as ReservationSource)}
                >
                  {Object.entries(SOURCE_CONFIG).map(([k, v]) => (
                    <option key={k} value={k}>{v.label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table assignment */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">Mesa <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opcional)</span></span>
            <div className="ff-modal-section-body">
              <select
                className="form-select form-select-sm"
                value={form.tableId}
                disabled={readOnly}
                onChange={(e) => field('tableId', e.target.value)}
              >
                <option value="">— Sem mesa definida —</option>
                {tables.map((t) => (
                  <option key={t.id} value={t.id}>
                    Mesa {t.number}{t.capacity ? ` (${t.capacity} lugares)` : ''}
                    {t.zoneName ? ` — ${t.zoneName}` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Notes & tags */}
          <div className="ff-modal-section">
            <span className="ff-modal-section-label">Observações e tags</span>
            <div className="ff-modal-section-body">
              <div>
                <span className="ff-admin-modal-label">Observações</span>
                <input
                  className="form-control form-control-sm"
                  value={form.notes}
                  readOnly={readOnly}
                  onChange={(e) => field('notes', e.target.value)}
                  placeholder="Ex: janela, cadeirão para bebê..."
                />
              </div>
              <div>
                <span className="ff-admin-modal-label">Tags</span>
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
                        {tc.label}
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
                <i className="bi bi-floppy me-1" />Salvar reserva
              </button>
              <button className="btn btn-outline-secondary" onClick={onClose}>
                Cancelar
              </button>
            </>
          ) : (
            <button className="btn btn-outline-secondary flex-1" onClick={onClose}>
              Fechar
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
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: '2', estimatedWaitMinutes: '20' });

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" style={{ maxWidth: 400 }} onClick={(e) => e.stopPropagation()}>
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">
            <i className="bi bi-person-plus-fill me-2" style={{ color: '#0284c7' }} />
            Adicionar à fila
          </span>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9ca3af', fontSize: 18 }} onClick={onClose}>
            <i className="bi bi-x-lg" />
          </button>
        </div>
        <div className="ff-admin-modal-body">
          <div>
            <span className="ff-admin-modal-label">Nome ou grupo *</span>
            <input
              className="form-control form-control-sm"
              value={form.customerName}
              onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))}
              placeholder="Ex: Família Silva"
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <span className="ff-admin-modal-label">Telefone</span>
              <input
                className="form-control form-control-sm"
                type="tel"
                value={form.customerPhone}
                onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))}
              />
            </div>
            <div>
              <span className="ff-admin-modal-label">Nº de pessoas</span>
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
            <span className="ff-admin-modal-label">Espera estimada (min)</span>
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
            <i className="bi bi-plus-circle-fill me-1" />Adicionar à fila
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ─── OccupancyView ────────────────────────────────────────────────────────────

interface OccupancyViewProps {
  tables: DbTable[];
  settings: ReservationSettings | null;
}

function OccupancyView({ tables, settings }: OccupancyViewProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [mode, setMode] = useState<'week' | 'day' | 'month'>('week');
  const [weekStart, setWeekStart] = useState(() => getMonday());
  const [selectedDay, setSelectedDay] = useState(today);
  const [monthStart, setMonthStart] = useState(() => getMonthStart());
  const [selectedSlot, setSelectedSlot] = useState<{ date: string; time: string } | null>(null);
  const [occReservations, setOccReservations] = useState<Reservation[]>([]);
  const [quickReserve, setQuickReserve] = useState<{ tableId: string; tableNumber: string } | null>(null);
  const [editOccTarget, setEditOccTarget] = useState<Reservation | null>(null);
  const [cancelTarget, setCancelTarget] = useState<string | null>(null);
  const notify = useNotify();

  async function loadOccReservations() {
    setOccReservations(await reservationService.listAll());
  }

  useEffect(() => { loadOccReservations(); }, []);

  const activeTables = tables.filter((t) => t.active);
  const opening        = settings?.openingTime ?? '11:00';
  const closing        = settings?.closingTime ?? '23:00';
  const interval       = settings?.slotIntervalMinutes ?? 30;
  const defaultDur     = settings?.defaultDurationMinutes ?? 90;
  const slots          = generateSlots(opening, closing, interval);
  const weekDays       = Array.from({ length: 7 }, (_, i) => addDaysStr(weekStart, i));

  function getOccupancy(date: string, time: string) {
    const slotStart = toMins(time);
    const occupied = activeTables.filter((t) =>
      occReservations.some((r) => {
        if (r.date !== date) return false;
        if (r.tableId !== t.id && r.tableNumber !== t.number) return false;
        if (r.status === 'CANCELED' || r.status === 'NO_SHOW' || r.status === 'COMPLETED') return false;
        const rStart = toMins(r.time);
        const rEnd   = rStart + (r.duration ?? defaultDur);
        return slotStart >= rStart && slotStart < rEnd;
      })
    );
    const total = activeTables.length;
    const pct   = total > 0 ? Math.round((occupied.length / total) * 100) : 0;
    return {
      occupied,
      available: activeTables.filter((t) => !occupied.includes(t)),
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
    return { pct: maxPct, occupied: maxOccupied, total: activeTables.length };
  }

  async function handleCancelFromOcc(resId: string) {
    await reservationService.updateStatus(resId, 'CANCELED');
    notify('Reserva cancelada', 'success');
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
    notify('Reserva criada com sucesso', 'success');
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
    notify('Reserva atualizada', 'success');
    await loadOccReservations();
  }

  const detailOcc = selectedSlot ? getOccupancy(selectedSlot.date, selectedSlot.time) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
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
              {m === 'week' ? 'Semana' : m === 'day' ? 'Dia' : 'Mês'}
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
              {fmtShortDate(weekStart)} — {fmtShortDate(addDaysStr(weekStart, 6))}
            </span>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setWeekStart(addDaysStr(weekStart, 7))}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setWeekStart(getMonday())}>
              Hoje
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
              Hoje
            </button>
          </div>
        )}
        {mode === 'month' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setMonthStart(addMonths(monthStart, -1))}>
              <i className="bi bi-chevron-left" />
            </button>
            <span style={{ fontSize: 13, fontWeight: 700, minWidth: 180, textAlign: 'center', color: '#374151' }}>
              {fmtMonthYear(monthStart)}
            </span>
            <button className="btn btn-sm btn-outline-secondary" style={{ padding: '4px 9px' }} onClick={() => setMonthStart(addMonths(monthStart, 1))}>
              <i className="bi bi-chevron-right" />
            </button>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setMonthStart(getMonthStart())}>
              Hoje
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
                        title="Ver detalhes do dia"
                      >
                        {fmtShortDate(d)}
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
              {fmtFullDate(selectedDay)}
              {selectedDay === today && (
                <span style={{ fontSize: 11, background: '#dbeafe', color: '#1d4ed8', borderRadius: 6, padding: '2px 10px', fontWeight: 800 }}>
                  Hoje
                </span>
              )}
            </div>

            {slots.length === 0 ? (
              <div className="ff-empty-state">
                <i className="bi bi-clock ff-empty-state-icon" />
                <div className="ff-empty-state-title">Sem horários configurados</div>
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
                        <span style={{ color: '#dc2626', fontWeight: 700 }}>{occ.occupied.length} ocup.</span>
                        {' · '}
                        <span style={{ color: '#059669', fontWeight: 700 }}>{occ.available.length} livres</span>
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
                    {WEEKDAY_SHORT.map((d) => <th key={d}>{d}</th>)}
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
                            title={`${fmtFullDate(date)} — Ocupação máx: ${peak.pct}%`}
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
                              <span className="ff-occ-month-free">livre</span>
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
                  <div className="ff-occ-panel-head-date">{fmtFullDate(selectedSlot.date)}</div>
                  <div className="ff-occ-panel-head-time">
                    <i className="bi bi-clock me-1" />{selectedSlot.time}
                    {selectedSlot.date === today && <span style={{ marginLeft: 8, background: '#2563eb', fontSize: 10, padding: '1px 6px', borderRadius: 4 }}>Hoje</span>}
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
                  <span className="ff-occ-stat-lbl">Ocupadas</span>
                </div>
                <div className="ff-occ-stat">
                  <span className="ff-occ-stat-val" style={{ color: '#059669' }}>{detailOcc.available.length}</span>
                  <span className="ff-occ-stat-lbl">Livres</span>
                </div>
                <div className="ff-occ-stat">
                  <span className="ff-occ-stat-val" style={{ color: '#1d4ed8' }}>{detailOcc.pct}%</span>
                  <span className="ff-occ-stat-lbl">Ocup.</span>
                </div>
              </div>

              {/* Table list */}
              <div className="ff-occ-panel-body">
                {activeTables.length === 0 && (
                  <div className="ff-empty-state" style={{ padding: '24px 16px' }}>
                    <i className="bi bi-grid-3x3-gap ff-empty-state-icon" />
                    <div className="ff-empty-state-title">Nenhuma mesa ativa</div>
                  </div>
                )}

                {/* Occupied tables section */}
                {detailOcc.occupied.length > 0 && (
                  <>
                    <div className="ff-occ-panel-section-label">Ocupadas ({detailOcc.occupied.length})</div>
                    {detailOcc.occupied.map((t) => {
                      const res = tableResAtSlot(t.id, t.number);
                      const isCanceling = cancelTarget === res?.id;
                      return (
                        <div key={t.id} className={`ff-occ-tcard ${isCanceling ? 'canceling' : 'occupied'}`}>
                          <div className="ff-occ-tnum occupied">{t.number}</div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            {t.zoneName && (
                              <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
                                {t.zoneName}
                              </div>
                            )}
                            {res && (
                              <>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#991b1b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {res.customerName}
                                </div>
                                <div style={{ fontSize: 10, color: '#9ca3af', marginTop: 1 }}>
                                  {res.time} · {res.partySize}/{t.capacity ?? '?'} pax{res.duration ? ` · ${res.duration}min` : ''}
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
                                  Cancelar reserva de {res.customerName}?
                                </div>
                                <div style={{ display: 'flex', gap: 5 }}>
                                  <button
                                    className="btn btn-sm btn-danger"
                                    style={{ fontSize: '0.72rem', fontWeight: 700 }}
                                    onClick={() => handleCancelFromOcc(res.id)}
                                  >
                                    <i className="bi bi-x-circle-fill me-1" />Confirmar
                                  </button>
                                  <button
                                    className="btn btn-sm btn-outline-secondary"
                                    style={{ fontSize: '0.72rem' }}
                                    onClick={() => setCancelTarget(null)}
                                  >
                                    Voltar
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Actions for occupied table */}
                            {!isCanceling && res && (
                              <div style={{ display: 'flex', gap: 4, marginTop: 6 }}>
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
                                  <i className="bi bi-pencil me-1" />Editar
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
                                  <i className="bi bi-x-circle me-1" />Cancelar
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
                    <div className="ff-occ-panel-section-label">Disponíveis ({detailOcc.available.length})</div>
                    {detailOcc.available.map((t) => (
                      <div key={t.id} className="ff-occ-tcard available">
                        <div className="ff-occ-tnum available">{t.number}</div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          {t.zoneName && (
                            <div style={{ fontSize: 9, color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 1 }}>
                              {t.zoneName}
                            </div>
                          )}
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#059669' }}>Disponível</div>
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>
                            {t.capacity ? `${t.capacity} lugares` : 'Capacidade não definida'}
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
                          onClick={(e) => { e.stopPropagation(); setQuickReserve({ tableId: t.id, tableNumber: t.number }); }}
                        >
                          <i className="bi bi-calendar-plus" style={{ fontSize: 11 }} />
                          Reservar
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
          title={`Nova reserva — Mesa ${quickReserve.tableNumber}`}
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
          title="Editar reserva"
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
    </div>
  );
}

// ─── ReservationsPage ─────────────────────────────────────────────────────────

export function ReservationsPage() {
  const [tab, setTab] = useState<Tab>('today');
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);
  const [walkIns, setWalkIns] = useState<WalkIn[]>([]);
  const [settings, setSettings] = useState<ReservationSettings | null>(null);
  const [tables, setTables] = useState<DbTable[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReservationStatus | ''>('');
  const [showModal, setShowModal] = useState(false);
  const [editTarget, setEditTarget] = useState<Reservation | null>(null);
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const notify = useNotify();
  const navigate = useNavigate();

  async function loadToday() { setReservations(await reservationService.listForDate(date)); }
  async function loadAll()   { setAllReservations(await reservationService.listAll()); }
  async function loadWalkIns() { setWalkIns(await reservationService.listWalkIns()); }
  async function loadSettings() { setSettings(await reservationService.getSettings()); }

  useEffect(() => {
    tableService.list().then((ts) => setTables(ts.filter((t) => t.active)));
    loadAll();
    loadWalkIns();
    loadSettings();
  }, []);

  useEffect(() => { loadToday(); }, [date]);

  const todayFiltered = reservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  const allFiltered = allReservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search) || r.date.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleCreate(form: typeof EMPTY_FORM) {
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
    notify('Reserva criada', 'success');
    setShowModal(false);
    loadToday();
    loadAll();
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editTarget) return;
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.update(editTarget.id, {
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
    notify('Reserva atualizada', 'success');
    setEditTarget(null);
    loadToday();
    loadAll();
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await reservationService.updateStatus(id, status);
    notify(`Reserva: ${STATUS_CONFIG[status].label}`, status === 'CANCELED' || status === 'NO_SHOW' ? 'danger' : 'success');
    loadToday();
    loadAll();
  }

  async function handleWalkInSeat(id: string) {
    await reservationService.updateWalkInStatus(id, 'SEATED', { seatedAt: new Date().toISOString() });
    notify('Cliente sentado', 'success');
    loadWalkIns();
  }

  async function handleWalkInCancel(id: string) {
    await reservationService.updateWalkInStatus(id, 'CANCELED');
    notify('Removido da fila');
    loadWalkIns();
  }

  async function handleAddWalkIn(data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) {
    await reservationService.addWalkIn({
      customerName:          data.customerName,
      customerPhone:         data.customerPhone || undefined,
      partySize:             data.partySize,
      estimatedWaitMinutes:  data.estimatedWaitMinutes,
      arrivedAt:             new Date().toISOString(),
    });
    notify('Adicionado à fila', 'success');
    setShowWalkInModal(false);
    loadWalkIns();
  }

  async function handleSaveSettings(data: Partial<ReservationSettings>) {
    const saved = await reservationService.saveSettings(data);
    setSettings(saved);
    notify('Configurações salvas', 'success');
  }

  const waitingCount = walkIns.filter((w) => w.status === 'WAITING').length;

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'today',     label: 'Por data',      icon: 'bi-calendar3' },
    { id: 'all',       label: 'Todas',         icon: 'bi-list-ul' },
    { id: 'walkin',    label: 'Fila',          icon: 'bi-people', badge: waitingCount || undefined },
    { id: 'occupancy', label: 'Ocupação',      icon: 'bi-grid-1x2' },
    { id: 'settings',  label: 'Config.',       icon: 'bi-gear' },
  ];

  const showSearchBar = tab === 'today' || tab === 'all';

  return (
    <div className="ff-area-layout">
      {/* Sidebar */}
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-calendar-check me-2" />Reservas
        </div>
        <nav className="ff-area-sidebar-nav">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`ff-nav-item${tab === t.id ? ' active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              <i className={`bi ${t.icon}`} />
              {t.label}
              {t.badge ? (
                <span className="ff-nav-item-badge">{t.badge}</span>
              ) : null}
            </button>
          ))}
          <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,.1)' }} />
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      {/* Main */}
      <div className="ff-area-main">
        {/* Topbar — sticky */}
        <div className="ff-area-topbar ff-res-topbar-sticky">
          <span className="ff-area-topbar-title">
            {tab === 'today'     && 'Reservas do dia'}
            {tab === 'all'       && 'Todas as reservas'}
            {tab === 'walkin'    && 'Fila de espera'}
            {tab === 'occupancy' && 'Mapa de ocupação'}
            {tab === 'settings'  && 'Configurações'}
          </span>

          {showSearchBar && (
            <>
              <div style={{ position: 'relative', marginLeft: 'auto' }}>
                <i
                  className="bi bi-search"
                  style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.83rem', pointerEvents: 'none' }}
                />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 28, width: 190 }}
                  placeholder="Buscar cliente..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: 155 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | '')}
              >
                <option value="">Todos os status</option>
                {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_CONFIG[s].label}</option>
                ))}
              </select>
            </>
          )}

          {tab === 'today' && (
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 155 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          {showSearchBar && (
            <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus-lg me-1" />Nova reserva
            </button>
          )}
        </div>

        {/* Sticky controls for today/all tabs */}
        {tab === 'today' && (
          <div className="ff-res-controls">
            <MetricsRow reservations={reservations} />
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {(['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const).map((s) => (
                <button
                  key={s || 'all'}
                  className={`ff-res-chip${filterStatus === s ? ' active' : ''}`}
                  onClick={() => setFilterStatus(s)}
                >
                  {s === '' ? (
                    'Todos'
                  ) : (
                    <>
                      <i className={`bi ${STATUS_CONFIG[s].icon}`} style={{ fontSize: 11 }} />
                      {STATUS_CONFIG[s].label}
                    </>
                  )}
                  {s !== '' && (
                    <span
                      style={{
                        background: filterStatus === s ? 'rgba(255,255,255,.2)' : '#e5e7eb',
                        color: filterStatus === s ? '#fff' : '#6b7280',
                        borderRadius: 10,
                        padding: '0 5px',
                        fontSize: 10,
                        fontWeight: 800,
                        marginLeft: 2,
                      }}
                    >
                      {reservations.filter((r) => r.status === s).length}
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="ff-area-content">
          {/* ── Today tab ── */}
          {tab === 'today' && (
            <>
              {todayFiltered.length === 0 ? (
                <div className="ff-empty-state">
                  <i className="bi bi-calendar-x ff-empty-state-icon" />
                  <div className="ff-empty-state-title">
                    {search || filterStatus ? 'Nenhuma reserva encontrada' : 'Sem reservas nesta data'}
                  </div>
                  <div className="ff-empty-state-desc">
                    {search || filterStatus
                      ? 'Tente ajustar o filtro ou busca.'
                      : 'Crie uma reserva clicando em "Nova reserva".'}
                  </div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {todayFiltered.map((r) => (
                    <ReservationCard
                      key={r.id}
                      r={r}
                      tables={tables}
                      onStatusChange={handleStatusChange}
                      onEdit={(res) => setEditTarget(res)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── All reservations tab ── */}
          {tab === 'all' && (
            <>
              {allFiltered.length === 0 ? (
                <div className="ff-empty-state">
                  <i className="bi bi-calendar-x ff-empty-state-icon" />
                  <div className="ff-empty-state-title">Nenhuma reserva encontrada</div>
                  <div className="ff-empty-state-desc">Tente ajustar o filtro ou busca.</div>
                </div>
              ) : (
                (() => {
                  const today = new Date().toISOString().slice(0, 10);
                  const dates = [...new Set(allFiltered.map((r) => r.date))].sort((a, b) => b.localeCompare(a));
                  return dates.map((d) => (
                    <div key={d} style={{ marginBottom: 24 }}>
                      <div
                        style={{
                          fontWeight: 700,
                          fontSize: '0.78rem',
                          color: d === today ? '#1d4ed8' : '#9ca3af',
                          textTransform: 'uppercase',
                          letterSpacing: '0.07em',
                          marginBottom: 10,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                        }}
                      >
                        {d === today && <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#1d4ed8', display: 'inline-block' }} />}
                        {d === today ? 'Hoje' : fmtFullDate(d)}
                        <span style={{ fontWeight: 500, color: '#d1d5db', fontSize: '0.7rem' }}>
                          — {allFiltered.filter((r) => r.date === d).length} reservas
                        </span>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {allFiltered
                          .filter((r) => r.date === d)
                          .map((r) => (
                            <ReservationCard
                              key={r.id}
                              r={r}
                              tables={tables}
                              onStatusChange={handleStatusChange}
                              onEdit={(res) => setEditTarget(res)}
                              showDate={false}
                            />
                          ))}
                      </div>
                    </div>
                  ));
                })()
              )}
            </>
          )}

          {/* ── Walk-in tab ── */}
          {tab === 'walkin' && (
            <WalkInPanel
              walkIns={walkIns}
              tables={tables}
              onSeat={handleWalkInSeat}
              onCancel={handleWalkInCancel}
              onAdd={() => setShowWalkInModal(true)}
            />
          )}

          {/* ── Occupancy tab ── */}
          {tab === 'occupancy' && (
            <OccupancyView tables={tables} settings={settings} />
          )}

          {/* ── Settings tab ── */}
          {tab === 'settings' && (
            <SettingsPanel settings={settings} onSave={handleSaveSettings} />
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <ReservationModal
          title="Nova reserva"
          initial={{ ...EMPTY_FORM, date }}
          tables={tables}
          onConfirm={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}

      {/* Edit modal */}
      {editTarget && (
        <ReservationModal
          title="Editar reserva"
          initial={{
            customerName:  editTarget.customerName,
            customerPhone: editTarget.customerPhone,
            partySize:     String(editTarget.partySize),
            date:          editTarget.date,
            time:          editTarget.time,
            notes:         editTarget.notes ?? '',
            tableId:       editTarget.tableId ?? '',
            source:        editTarget.source ?? 'PHONE',
            duration:      String(editTarget.duration ?? 90),
            tags:          editTarget.tags ?? [],
          }}
          tables={tables}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
          readOnly={['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(editTarget.status)}
        />
      )}

      {/* Walk-in modal */}
      {showWalkInModal && (
        <AddWalkInModal
          onConfirm={handleAddWalkIn}
          onClose={() => setShowWalkInModal(false)}
        />
      )}
    </div>
  );
}
