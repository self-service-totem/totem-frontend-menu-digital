import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reservationService } from '@/lib/services/reservationService';
import { useNotify } from '@/lib/notifications';
import type { Reservation, ReservationStatus } from '@/lib/types';

const STATUS_LABEL: Record<ReservationStatus, string> = {
  PENDING: 'Pendente', CONFIRMED: 'Confirmada', SEATED: 'Sentado',
  COMPLETED: 'Concluída', CANCELED: 'Cancelada', NO_SHOW: 'Não compareceu',
};
const STATUS_COLOR: Record<ReservationStatus, string> = {
  PENDING: '#d97706', CONFIRMED: '#059669', SEATED: '#0284c7',
  COMPLETED: '#6b7280', CANCELED: '#6b7280', NO_SHOW: '#dc2626',
};

export function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ customerName: '', customerPhone: '', partySize: '2', time: '19:00', notes: '' });
  const notify = useNotify();
  const navigate = useNavigate();

  async function load() {
    setReservations(await reservationService.listForDate(date));
  }

  useEffect(() => { load(); }, [date]);

  async function handleCreate() {
    await reservationService.create({
      customerName: form.customerName,
      customerPhone: form.customerPhone,
      partySize: parseInt(form.partySize) || 2,
      date,
      time: form.time,
      notes: form.notes || undefined,
    });
    notify('Reserva criada');
    setShowModal(false);
    setForm({ customerName: '', customerPhone: '', partySize: '2', time: '19:00', notes: '' });
    load();
  }

  async function handleStatusChange(id: string, status: ReservationStatus) {
    await reservationService.updateStatus(id, status);
    notify(`Reserva marcada como: ${STATUS_LABEL[status]}`);
    load();
  }

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo"><i className="bi bi-calendar-check me-2" />Reservas</div>
        <nav className="ff-area-sidebar-nav">
          <button className="ff-nav-item active"><i className="bi bi-calendar3" />Por data</button>
          <button className="ff-nav-item" onClick={() => navigate('/waiter-staff/tables')}><i className="bi bi-person-badge" />Garçom</button>
          <button className="ff-nav-item" onClick={() => navigate('/')}><i className="bi bi-house" />Hub</button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">Reservas do dia</span>
          <input
            type="date"
            className="form-control form-control-sm"
            style={{ width: 160 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn btn-sm btn-primary ms-2" onClick={() => setShowModal(true)}>
            <i className="bi bi-plus me-1" />Nova reserva
          </button>
        </div>

        <div className="ff-area-content">
          {reservations.length === 0 && (
            <div className="text-muted text-center py-8">
              <i className="bi bi-calendar-x" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
              Nenhuma reserva para esta data.
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {reservations.map((r) => (
              <div key={r.id} className={`ff-reservation-slot ${r.status}`}>
                <div style={{ fontWeight: 700, fontSize: 16, minWidth: 50 }}>{r.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600 }}>{r.customerName}</div>
                  <div style={{ fontSize: 13, color: '#6b7280' }}>
                    {r.partySize} pessoas · {r.customerPhone}
                    {r.notes && <span style={{ marginLeft: 8, color: '#d97706' }}>— {r.notes}</span>}
                    {r.tableId && <span style={{ marginLeft: 8 }}>· Mesa {r.tableId}</span>}
                  </div>
                </div>
                <span
                  className="badge"
                  style={{ background: STATUS_COLOR[r.status], color: '#fff', fontSize: 11 }}
                >
                  {STATUS_LABEL[r.status]}
                </span>
                <div style={{ display: 'flex', gap: 4 }}>
                  {r.status === 'PENDING' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(r.id, 'CONFIRMED')}>
                      Confirmar
                    </button>
                  )}
                  {(r.status === 'PENDING' || r.status === 'CONFIRMED') && (
                    <>
                      <button className="btn btn-sm btn-primary" onClick={() => handleStatusChange(r.id, 'SEATED')}>
                        Sentar
                      </button>
                      <button className="btn btn-sm btn-outline-secondary" onClick={() => handleStatusChange(r.id, 'CANCELED')}>
                        Cancelar
                      </button>
                    </>
                  )}
                  {r.status === 'SEATED' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleStatusChange(r.id, 'COMPLETED')}>
                      Concluir
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 16, padding: 28, width: 420, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <h5 style={{ margin: 0 }}>Nova reserva — {date}</h5>
            {[
              ['Nome do cliente', 'customerName', 'text'],
              ['Telefone', 'customerPhone', 'tel'],
              ['Nº de pessoas', 'partySize', 'number'],
              ['Horário', 'time', 'time'],
              ['Observações', 'notes', 'text'],
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
              <button className="btn btn-primary flex-1" onClick={handleCreate} disabled={!form.customerName}>
                Criar reserva
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
