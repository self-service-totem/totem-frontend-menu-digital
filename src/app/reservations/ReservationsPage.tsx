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

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: 'Pendente',
  CONFIRMED: 'Confirmada',
  SEATED: 'Sentado',
  COMPLETED: 'Concluída',
  CANCELED: 'Cancelada',
  NO_SHOW: 'Não compareceu',
};
const STATUS_COLOR: Record<ReservationStatus, string> = {
  PENDING: '#d97706',
  CONFIRMED: '#059669',
  SEATED: '#0284c7',
  COMPLETED: '#6b7280',
  CANCELED: '#9ca3af',
  NO_SHOW: '#dc2626',
};
const TAG_LABEL: Record<ReservationTag, string> = {
  BIRTHDAY: '🎂 Aniversário',
  VIP: '⭐ VIP',
  ALLERGY: '⚠️ Alergia',
  ANNIVERSARY: '💍 Aniversário de casal',
  LATE: '⏰ Atraso',
};
const TAG_COLOR: Record<ReservationTag, string> = {
  BIRTHDAY: '#ec4899',
  VIP: '#7c3aed',
  ALLERGY: '#dc2626',
  ANNIVERSARY: '#db2777',
  LATE: '#d97706',
};
const SOURCE_LABEL: Record<ReservationSource, string> = {
  PHONE: 'Telefone',
  WALK_IN: 'Presencial',
  ONLINE: 'Online',
};
const SOURCE_ICON: Record<ReservationSource, string> = {
  PHONE: 'bi-telephone',
  WALK_IN: 'bi-person-walking',
  ONLINE: 'bi-globe',
};

type Tab = 'today' | 'all' | 'walkin' | 'settings';

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

function timeAgo(iso: string): string {
  const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 1) return 'agora';
  if (mins === 1) return '1 min';
  return `${mins} min`;
}

// ─── Metrics row ─────────────────────────────────────────────────────────────

interface MetricsRowProps {
  reservations: Reservation[];
}

function MetricsRow({ reservations }: MetricsRowProps) {
  const counts = {
    total: reservations.length,
    confirmed: reservations.filter((r) => r.status === 'CONFIRMED').length,
    pending: reservations.filter((r) => r.status === 'PENDING').length,
    seated: reservations.filter((r) => r.status === 'SEATED').length,
    canceled: reservations.filter((r) => r.status === 'CANCELED').length,
    noShow: reservations.filter((r) => r.status === 'NO_SHOW').length,
  };

  const metrics = [
    { label: 'Total', value: counts.total, color: '#1d4ed8', icon: 'bi-calendar3' },
    { label: 'Confirmadas', value: counts.confirmed, color: '#059669', icon: 'bi-check-circle' },
    { label: 'Pendentes', value: counts.pending, color: '#d97706', icon: 'bi-hourglass-split' },
    { label: 'Sentados', value: counts.seated, color: '#0284c7', icon: 'bi-person-check' },
    { label: 'Canceladas', value: counts.canceled, color: '#9ca3af', icon: 'bi-x-circle' },
    { label: 'Não vieram', value: counts.noShow, color: '#dc2626', icon: 'bi-person-x' },
  ];

  return (
    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16 }}>
      {metrics.map((m) => (
        <div
          key={m.label}
          style={{
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: 10,
            padding: '10px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            minWidth: 110,
          }}
        >
          <i className={`bi ${m.icon}`} style={{ color: m.color, fontSize: '1.2rem' }} />
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, lineHeight: 1, color: m.color }}>{m.value}</div>
            <div style={{ fontSize: '0.73rem', color: '#6b7280', marginTop: 2 }}>{m.label}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Reservation card ─────────────────────────────────────────────────────────

interface ReservationCardProps {
  r: Reservation;
  tables: DbTable[];
  onStatusChange: (id: string, status: ReservationStatus) => void;
  onEdit: (r: Reservation) => void;
}

function ReservationCard({ r, tables, onStatusChange, onEdit }: ReservationCardProps) {
  const [dropOpen, setDropOpen] = useState(false);
  const tableLabel = r.tableNumber
    ? `Mesa ${r.tableNumber}`
    : r.tableId
    ? `Mesa ${tables.find((t) => t.id === r.tableId)?.number ?? r.tableId}`
    : null;

  return (
    <div
      style={{
        background: '#fff',
        border: `1px solid #e5e7eb`,
        borderLeft: `4px solid ${STATUS_COLOR[r.status]}`,
        borderRadius: 10,
        padding: '12px 16px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        position: 'relative',
      }}
    >
      {/* Time */}
      <div style={{ fontWeight: 700, fontSize: '1rem', minWidth: 46, color: '#1f2937', paddingTop: 2 }}>
        {r.time}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>{r.customerName}</span>
          {(r.tags ?? []).map((tag) => (
            <span
              key={tag}
              style={{
                background: TAG_COLOR[tag] + '20',
                color: TAG_COLOR[tag],
                borderRadius: 5,
                padding: '1px 7px',
                fontSize: '0.72rem',
                fontWeight: 700,
              }}
            >
              {TAG_LABEL[tag]}
            </span>
          ))}
        </div>
        <div style={{ fontSize: '0.82rem', color: '#6b7280', marginTop: 3, display: 'flex', flexWrap: 'wrap', gap: '4px 10px' }}>
          <span><i className="bi bi-people me-1" />{r.partySize} pessoas</span>
          <span><i className="bi bi-telephone me-1" />{r.customerPhone}</span>
          {tableLabel && <span><i className="bi bi-grid me-1" />{tableLabel}</span>}
          {r.source && (
            <span>
              <i className={`bi ${SOURCE_ICON[r.source]} me-1`} />
              {SOURCE_LABEL[r.source]}
            </span>
          )}
          {r.duration && <span><i className="bi bi-clock me-1" />{r.duration} min</span>}
        </div>
        {r.notes && (
          <div style={{ fontSize: '0.8rem', color: '#92400e', background: '#fffbeb', borderRadius: 5, padding: '3px 8px', marginTop: 6, display: 'inline-block' }}>
            {r.notes}
          </div>
        )}
      </div>

      {/* Status badge */}
      <span
        className="badge"
        style={{ background: STATUS_COLOR[r.status], color: '#fff', fontSize: '0.73rem', flexShrink: 0, alignSelf: 'flex-start', marginTop: 2 }}
      >
        {STATUS_LABEL[r.status]}
      </span>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 4, flexShrink: 0, alignItems: 'flex-start' }}>
        {r.status === 'PENDING' && (
          <button className="btn btn-sm btn-success" style={{ fontSize: '0.8rem' }} onClick={() => onStatusChange(r.id, 'CONFIRMED')}>
            Confirmar
          </button>
        )}
        {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
          <button className="btn btn-sm btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => onStatusChange(r.id, 'SEATED')}>
            Sentar
          </button>
        )}
        {r.status === 'SEATED' && (
          <button className="btn btn-sm btn-success" style={{ fontSize: '0.8rem' }} onClick={() => onStatusChange(r.id, 'COMPLETED')}>
            Concluir
          </button>
        )}

        {/* Dropdown for more actions */}
        <div style={{ position: 'relative' }}>
          <button
            className="btn btn-sm btn-outline-secondary"
            style={{ fontSize: '0.8rem', padding: '3px 8px' }}
            onClick={() => setDropOpen((v) => !v)}
          >
            <i className="bi bi-three-dots-vertical" />
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
                  borderRadius: 8,
                  boxShadow: '0 4px 16px rgba(0,0,0,.1)',
                  zIndex: 100,
                  minWidth: 180,
                  overflow: 'hidden',
                }}
              >
                {['PENDING', 'CONFIRMED', 'SEATED'].includes(r.status) && (
                  <button
                    className="dropdown-item"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                    onClick={() => { onEdit(r); setDropOpen(false); }}
                  >
                    <i className="bi bi-pencil me-2" />Editar reserva
                  </button>
                )}
                {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                  <button
                    className="dropdown-item text-danger"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                    onClick={() => { onStatusChange(r.id, 'NO_SHOW'); setDropOpen(false); }}
                  >
                    <i className="bi bi-person-x me-2" />Não compareceu
                  </button>
                )}
                {['PENDING', 'CONFIRMED'].includes(r.status) && (
                  <button
                    className="dropdown-item text-danger"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                    onClick={() => { onStatusChange(r.id, 'CANCELED'); setDropOpen(false); }}
                  >
                    <i className="bi bi-x-circle me-2" />Cancelar
                  </button>
                )}
                {r.status === 'SEATED' && (
                  <button
                    className="dropdown-item"
                    style={{ padding: '8px 14px', fontSize: '0.85rem', width: '100%', textAlign: 'left', background: 'none', border: 'none' }}
                    onClick={() => { onStatusChange(r.id, 'CANCELED'); setDropOpen(false); }}
                  >
                    <i className="bi bi-x-circle me-2 text-danger" />Cancelar
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Walk-in queue panel ──────────────────────────────────────────────────────

interface WalkInPanelProps {
  walkIns: WalkIn[];
  tables: DbTable[];
  onSeat: (id: string) => void;
  onCancel: (id: string) => void;
  onAdd: () => void;
}

function WalkInPanel({ walkIns, tables: _tables, onSeat, onCancel, onAdd }: WalkInPanelProps) {
  const waiting = walkIns.filter((w) => w.status === 'WAITING');
  const past = walkIns.filter((w) => w.status !== 'WAITING');

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div>
          <span style={{ fontWeight: 700, fontSize: '1rem' }}>Fila de espera</span>
          {waiting.length > 0 && (
            <span style={{ marginLeft: 8, background: '#0284c7', color: '#fff', borderRadius: 12, padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
              {waiting.length}
            </span>
          )}
        </div>
        <button className="btn btn-sm btn-primary" onClick={onAdd}>
          <i className="bi bi-plus me-1" />Adicionar
        </button>
      </div>

      {waiting.length === 0 && (
        <div className="text-muted text-center py-5">
          <i className="bi bi-people" style={{ fontSize: 36, display: 'block', marginBottom: 8 }} />
          Nenhum cliente aguardando.
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {waiting.map((w, idx) => (
          <div
            key={w.id}
            style={{
              background: '#fff',
              border: '1px solid #e5e7eb',
              borderLeft: '4px solid #0284c7',
              borderRadius: 10,
              padding: '12px 16px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
            }}
          >
            <div style={{ fontWeight: 800, fontSize: '1.4rem', color: '#0284c7', minWidth: 28 }}>
              {idx + 1}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{w.customerName}</div>
              <div style={{ fontSize: '0.82rem', color: '#6b7280', display: 'flex', gap: 10, marginTop: 2 }}>
                <span><i className="bi bi-people me-1" />{w.partySize} pessoas</span>
                {w.customerPhone && <span><i className="bi bi-telephone me-1" />{w.customerPhone}</span>}
                <span><i className="bi bi-clock me-1" />Aguarda há {timeAgo(w.arrivedAt)}</span>
                {w.estimatedWaitMinutes && (
                  <span style={{ color: '#d97706' }}>~{w.estimatedWaitMinutes} min de espera</span>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-sm btn-primary" style={{ fontSize: '0.8rem' }} onClick={() => onSeat(w.id)}>
                Sentar
              </button>
              <button className="btn btn-sm btn-outline-secondary" style={{ fontSize: '0.8rem' }} onClick={() => onCancel(w.id)}>
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>

      {past.length > 0 && (
        <details style={{ marginTop: 16 }}>
          <summary style={{ fontSize: '0.8rem', color: '#9ca3af', cursor: 'pointer', listStyle: 'none' }}>
            <i className="bi bi-clock-history me-1" />Histórico ({past.length})
          </summary>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 8 }}>
            {past.map((w) => (
              <div
                key={w.id}
                style={{
                  background: '#f9fafb',
                  border: '1px solid #e5e7eb',
                  borderRadius: 8,
                  padding: '10px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  opacity: 0.7,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.88rem' }}>{w.customerName}</div>
                  <div style={{ fontSize: '0.78rem', color: '#9ca3af' }}>
                    {w.partySize} pessoas · {w.status === 'SEATED' ? 'Sentado' : 'Removido'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ─── Settings panel ───────────────────────────────────────────────────────────

interface SettingsPanelProps {
  settings: ReservationSettings | null;
  onSave: (s: Partial<ReservationSettings>) => void;
}

function SettingsPanel({ settings, onSave }: SettingsPanelProps) {
  const [form, setForm] = useState({
    defaultDurationMinutes: String(settings?.defaultDurationMinutes ?? 90),
    lateToleranceMinutes: String(settings?.lateToleranceMinutes ?? 15),
    openingTime: settings?.openingTime ?? '11:30',
    closingTime: settings?.closingTime ?? '23:00',
    slotIntervalMinutes: String(settings?.slotIntervalMinutes ?? 30),
    maxPartySize: String(settings?.maxPartySize ?? 12),
  });
  const [saved, setSaved] = useState(false);

  function handleSave() {
    onSave({
      defaultDurationMinutes: parseInt(form.defaultDurationMinutes) || 90,
      lateToleranceMinutes: parseInt(form.lateToleranceMinutes) || 15,
      openingTime: form.openingTime,
      closingTime: form.closingTime,
      slotIntervalMinutes: parseInt(form.slotIntervalMinutes) || 30,
      maxPartySize: parseInt(form.maxPartySize) || 12,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const fields: { label: string; key: keyof typeof form; type: string; hint?: string }[] = [
    { label: 'Abertura', key: 'openingTime', type: 'time' },
    { label: 'Fechamento', key: 'closingTime', type: 'time' },
    { label: 'Duração padrão (min)', key: 'defaultDurationMinutes', type: 'number', hint: 'Duração padrão de cada reserva' },
    { label: 'Tolerância de atraso (min)', key: 'lateToleranceMinutes', type: 'number', hint: 'Tempo antes de marcar como não compareceu' },
    { label: 'Intervalo de horários (min)', key: 'slotIntervalMinutes', type: 'number', hint: 'Granularidade dos horários disponíveis' },
    { label: 'Tamanho máximo de grupo', key: 'maxPartySize', type: 'number', hint: 'Nº máximo de pessoas por reserva' },
  ];

  return (
    <div style={{ maxWidth: 480 }}>
      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 18 }}>Configurações de reservas</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {fields.map((f) => (
          <div key={f.key}>
            <label style={{ fontWeight: 600, fontSize: '0.85rem', display: 'block', marginBottom: 4 }}>
              {f.label}
              {f.hint && <span style={{ fontWeight: 400, color: '#9ca3af', marginLeft: 6, fontSize: '0.8rem' }}>{f.hint}</span>}
            </label>
            <input
              className="form-control form-control-sm"
              type={f.type}
              style={{ maxWidth: 200 }}
              value={form[f.key]}
              onChange={(e) => setForm((prev) => ({ ...prev, [f.key]: e.target.value }))}
            />
          </div>
        ))}
      </div>
      <div style={{ marginTop: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button className="btn btn-primary btn-sm" onClick={handleSave}>
          <i className="bi bi-floppy me-1" />Salvar configurações
        </button>
        {saved && (
          <span style={{ fontSize: '0.85rem', color: '#059669' }}>
            <i className="bi bi-check-circle-fill me-1" />Salvo!
          </span>
        )}
      </div>
    </div>
  );
}

// ─── Create / Edit modal ──────────────────────────────────────────────────────

interface ReservationModalProps {
  title: string;
  initial: typeof EMPTY_FORM;
  tables: DbTable[];
  onConfirm: (data: typeof EMPTY_FORM) => void;
  onClose: () => void;
}

const ALL_TAGS: ReservationTag[] = ['BIRTHDAY', 'VIP', 'ALLERGY', 'ANNIVERSARY', 'LATE'];

function ReservationModal({ title, initial, tables, onConfirm, onClose }: ReservationModalProps) {
  const [form, setForm] = useState(initial);

  function toggleTag(tag: ReservationTag) {
    setForm((f) => ({
      ...f,
      tags: f.tags.includes(tag) ? f.tags.filter((t) => t !== tag) : [...f.tags, tag],
    }));
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 460, maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0 }}>{title}</h5>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nome do cliente *</label>
            <input className="form-control form-control-sm" value={form.customerName} onChange={(e) => setForm((f) => ({ ...f, customerName: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Telefone</label>
            <input className="form-control form-control-sm" type="tel" value={form.customerPhone} onChange={(e) => setForm((f) => ({ ...f, customerPhone: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nº de pessoas</label>
            <input className="form-control form-control-sm" type="number" min="1" value={form.partySize} onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Data</label>
            <input className="form-control form-control-sm" type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Horário</label>
            <input className="form-control form-control-sm" type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Duração (min)</label>
            <input className="form-control form-control-sm" type="number" min="30" value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))} />
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Origem</label>
            <select className="form-select form-select-sm" value={form.source} onChange={(e) => setForm((f) => ({ ...f, source: e.target.value as ReservationSource }))}>
              <option value="PHONE">Telefone</option>
              <option value="ONLINE">Online</option>
              <option value="WALK_IN">Presencial</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Mesa <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span></label>
            <select className="form-select form-select-sm" value={form.tableId} onChange={(e) => setForm((f) => ({ ...f, tableId: e.target.value }))}>
              <option value="">— Sem mesa definida —</option>
              {tables.map((t) => <option key={t.id} value={t.id}>Mesa {t.number}</option>)}
            </select>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Observações</label>
            <input className="form-control form-control-sm" value={form.notes} onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 6 }}>Tags</label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {ALL_TAGS.map((tag) => {
                const active = form.tags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    style={{
                      background: active ? TAG_COLOR[tag] + '20' : '#f3f4f6',
                      color: active ? TAG_COLOR[tag] : '#6b7280',
                      border: active ? `1.5px solid ${TAG_COLOR[tag]}` : '1.5px solid transparent',
                      borderRadius: 6,
                      padding: '3px 10px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    {TAG_LABEL[tag]}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <button className="btn btn-primary flex-1" onClick={() => onConfirm(form)} disabled={!form.customerName}>
            Salvar
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Walk-in add modal ────────────────────────────────────────────────────────

interface AddWalkInModalProps {
  onConfirm: (data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) => void;
  onClose: () => void;
}

function AddWalkInModal({ onConfirm, onClose }: AddWalkInModalProps) {
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: '2', estimatedWaitMinutes: '15' });

  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', borderRadius: 16, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 14 }}
        onClick={(e) => e.stopPropagation()}
      >
        <h5 style={{ margin: 0 }}>Adicionar à fila de espera</h5>
        {[
          ['Nome ou grupo *', 'customerName', 'text'],
          ['Telefone', 'customerPhone', 'tel'],
          ['Nº de pessoas', 'partySize', 'number'],
          ['Espera estimada (min)', 'estimatedWaitMinutes', 'number'],
        ].map(([label, field, type]) => (
          <div key={field}>
            <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
            <input
              className="form-control form-control-sm"
              type={type}
              value={(form as Record<string, string>)[field]}
              onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
            />
          </div>
        ))}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            className="btn btn-primary flex-1"
            onClick={() =>
              onConfirm({
                customerName: form.customerName,
                customerPhone: form.customerPhone,
                partySize: parseInt(form.partySize) || 2,
                estimatedWaitMinutes: parseInt(form.estimatedWaitMinutes) || 15,
              })
            }
            disabled={!form.customerName}
          >
            Adicionar
          </button>
          <button className="btn btn-outline-secondary" onClick={onClose}>
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

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

  async function loadToday() {
    setReservations(await reservationService.listForDate(date));
  }
  async function loadAll() {
    setAllReservations(await reservationService.listAll());
  }
  async function loadWalkIns() {
    setWalkIns(await reservationService.listWalkIns());
  }
  async function loadSettings() {
    setSettings(await reservationService.getSettings());
  }

  useEffect(() => {
    tableService.list().then((ts) => setTables(ts.filter((t) => t.active)));
    loadAll();
    loadWalkIns();
    loadSettings();
  }, []);

  useEffect(() => { loadToday(); }, [date]);

  // Filtered list for "today" tab
  const todayFiltered = reservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  // Filtered list for "all" tab
  const allFiltered = allReservations.filter((r) => {
    const matchSearch = !search || r.customerName.toLowerCase().includes(search.toLowerCase()) || r.customerPhone.includes(search) || r.date.includes(search);
    const matchStatus = !filterStatus || r.status === filterStatus;
    return matchSearch && matchStatus;
  });

  async function handleCreate(form: typeof EMPTY_FORM) {
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.create({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2,
      date: form.date,
      time: form.time,
      notes: form.notes || undefined,
      tableId: form.tableId || undefined,
      tableNumber: table?.number,
      source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify('Reserva criada');
    setShowModal(false);
    loadToday();
    loadAll();
  }

  async function handleEdit(form: typeof EMPTY_FORM) {
    if (!editTarget) return;
    const table = tables.find((t) => t.id === form.tableId);
    await reservationService.update(editTarget.id, {
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2,
      date: form.date,
      time: form.time,
      notes: form.notes || undefined,
      tableId: form.tableId || undefined,
      tableNumber: table?.number,
      source: form.source,
      duration: parseInt(form.duration) || undefined,
      tags: form.tags.length > 0 ? form.tags : undefined,
    });
    notify('Reserva atualizada');
    setEditTarget(null);
    loadToday();
    loadAll();
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await reservationService.updateStatus(id, status);
    notify(`Reserva: ${STATUS_LABEL[status]}`);
    loadToday();
    loadAll();
  }

  async function handleWalkInSeat(id: string) {
    await reservationService.updateWalkInStatus(id, 'SEATED', { seatedAt: new Date().toISOString() });
    notify('Cliente sentado');
    loadWalkIns();
  }

  async function handleWalkInCancel(id: string) {
    await reservationService.updateWalkInStatus(id, 'CANCELED');
    notify('Removido da fila');
    loadWalkIns();
  }

  async function handleAddWalkIn(data: { customerName: string; customerPhone: string; partySize: number; estimatedWaitMinutes: number }) {
    await reservationService.addWalkIn({
      customerName: data.customerName,
      customerPhone: data.customerPhone || undefined,
      partySize: data.partySize,
      estimatedWaitMinutes: data.estimatedWaitMinutes,
      arrivedAt: new Date().toISOString(),
    });
    notify('Adicionado à fila');
    setShowWalkInModal(false);
    loadWalkIns();
  }

  async function handleSaveSettings(data: Partial<ReservationSettings>) {
    const saved = await reservationService.saveSettings(data);
    setSettings(saved);
  }

  function openEdit(r: Reservation) {
    setEditTarget(r);
  }

  const waitingCount = walkIns.filter((w) => w.status === 'WAITING').length;

  const tabs: { id: Tab; label: string; icon: string; badge?: number }[] = [
    { id: 'today', label: 'Por data', icon: 'bi-calendar3' },
    { id: 'all', label: 'Lista completa', icon: 'bi-list-ul' },
    { id: 'walkin', label: 'Fila de espera', icon: 'bi-people', badge: waitingCount || undefined },
    { id: 'settings', label: 'Configurações', icon: 'bi-gear' },
  ];

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo"><i className="bi bi-calendar-check me-2" />Reservas</div>
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
                <span style={{ marginLeft: 'auto', background: '#0284c7', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>
                  {t.badge}
                </span>
              ) : null}
            </button>
          ))}
          <hr style={{ margin: '8px 0', borderColor: '#e5e7eb' }} />
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">
            {tab === 'today' && 'Reservas do dia'}
            {tab === 'all' && 'Todas as reservas'}
            {tab === 'walkin' && 'Fila de espera'}
            {tab === 'settings' && 'Configurações'}
          </span>

          {/* Search + filter (today & all tabs) */}
          {(tab === 'today' || tab === 'all') && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ position: 'relative' }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.85rem' }} />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 28, width: 180 }}
                  placeholder="Buscar..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: 150 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | '')}
              >
                <option value="">Todos os status</option>
                {(Object.keys(STATUS_LABEL) as ReservationStatus[]).map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>
            </div>
          )}

          {/* Date picker (today tab) */}
          {tab === 'today' && (
            <input
              type="date"
              className="form-control form-control-sm"
              style={{ width: 160 }}
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          )}

          {/* New reservation button */}
          {(tab === 'today' || tab === 'all') && (
            <button className="btn btn-sm btn-primary ms-2" onClick={() => setShowModal(true)}>
              <i className="bi bi-plus me-1" />Nova reserva
            </button>
          )}
        </div>

        <div className="ff-area-content">
          {/* ── Today tab ── */}
          {tab === 'today' && (
            <>
              <MetricsRow reservations={reservations} />
              {/* Filter chips */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
                {(['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const).map((s) => (
                  <button
                    key={s || 'all'}
                    style={{
                      background: filterStatus === s ? '#1d4ed8' : '#f3f4f6',
                      color: filterStatus === s ? '#fff' : '#374151',
                      border: 'none',
                      borderRadius: 20,
                      padding: '4px 12px',
                      fontSize: '0.78rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                    onClick={() => setFilterStatus(s)}
                  >
                    {s === '' ? 'Todos' : STATUS_LABEL[s]}
                  </button>
                ))}
              </div>

              {todayFiltered.length === 0 && (
                <div className="text-muted text-center py-8">
                  <i className="bi bi-calendar-x" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
                  Nenhuma reserva encontrada.
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {todayFiltered.map((r) => (
                  <ReservationCard
                    key={r.id}
                    r={r}
                    tables={tables}
                    onStatusChange={handleStatusChange}
                    onEdit={openEdit}
                  />
                ))}
              </div>
            </>
          )}

          {/* ── All reservations tab ── */}
          {tab === 'all' && (
            <>
              {/* Group by date */}
              {(() => {
                const dates = [...new Set(allFiltered.map((r) => r.date))].sort((a, b) => b.localeCompare(a));
                return dates.map((d) => (
                  <div key={d} style={{ marginBottom: 20 }}>
                    <div style={{ fontWeight: 700, fontSize: '0.82rem', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                      {d === new Date().toISOString().slice(0, 10) ? 'Hoje' : d}
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
                            onEdit={openEdit}
                          />
                        ))}
                    </div>
                  </div>
                ));
              })()}
              {allFiltered.length === 0 && (
                <div className="text-muted text-center py-8">
                  <i className="bi bi-calendar-x" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
                  Nenhuma reserva encontrada.
                </div>
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

          {/* ── Settings tab ── */}
          {tab === 'settings' && (
            <SettingsPanel settings={settings} onSave={handleSaveSettings} />
          )}
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <ReservationModal
          title={`Nova reserva — ${date}`}
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
            customerName: editTarget.customerName,
            customerPhone: editTarget.customerPhone,
            partySize: String(editTarget.partySize),
            date: editTarget.date,
            time: editTarget.time,
            notes: editTarget.notes ?? '',
            tableId: editTarget.tableId ?? '',
            source: editTarget.source ?? 'PHONE',
            duration: String(editTarget.duration ?? 90),
            tags: editTarget.tags ?? [],
          }}
          tables={tables}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      {/* Walk-in add modal */}
      {showWalkInModal && (
        <AddWalkInModal
          onConfirm={handleAddWalkIn}
          onClose={() => setShowWalkInModal(false)}
        />
      )}
    </div>
  );
}
