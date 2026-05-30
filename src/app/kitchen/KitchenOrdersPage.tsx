import { useEffect, useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { kitchenService } from '@/lib/services/kitchenService';
import type { KitchenTicket, KitchenTicketStatus } from '@/lib/types';
import { useNotify } from '@/lib/notifications';

/** Play a short double-beep using the Web Audio API (no external file needed). */
function playNewTicketSound() {
  try {
    const ctx = new AudioContext();
    [0, 180].forEach((delayMs) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.3, ctx.currentTime + delayMs / 1000);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delayMs / 1000 + 0.18);
      osc.start(ctx.currentTime + delayMs / 1000);
      osc.stop(ctx.currentTime + delayMs / 1000 + 0.2);
    });
  } catch {
    // AudioContext may be blocked before user interaction; silently ignore.
  }
}

type FilterOption = 'ALL' | KitchenTicketStatus;

const FILTERS: { label: string; value: FilterOption }[] = [
  { label: 'Todos', value: 'ALL' },
  { label: 'Novos', value: 'NEW' },
  { label: 'Preparando', value: 'PREPARING' },
  { label: 'Prontos', value: 'READY' },
];

function elapsed(createdAt: string): string {
  const ms = Date.now() - new Date(createdAt).getTime();
  const min = Math.floor(ms / 60000);
  const sec = Math.floor((ms % 60000) / 1000);
  return min > 0 ? `${min}min${sec > 0 ? ` ${sec}s` : ''}` : `${sec}s`;
}

function isUrgent(createdAt: string): boolean {
  return Date.now() - new Date(createdAt).getTime() > 10 * 60 * 1000;
}

interface TicketCardProps {
  ticket: KitchenTicket;
  onStatusChange: (id: string, status: KitchenTicketStatus) => void;
}

function TicketCard({ ticket, onStatusChange }: TicketCardProps) {
  const [time, setTime] = useState(elapsed(ticket.createdAt));

  useEffect(() => {
    const t = setInterval(() => setTime(elapsed(ticket.createdAt)), 5000);
    return () => clearInterval(t);
  }, [ticket.createdAt]);

  const nextStatus: Record<KitchenTicketStatus, KitchenTicketStatus | null> = {
    NEW: 'PREPARING',
    PREPARING: 'READY',
    READY: 'DELIVERED',
    DELIVERED: null,
    CANCELED: null,
  };
  const next = nextStatus[ticket.status];
  const nextLabel: Record<KitchenTicketStatus, string> = {
    NEW: 'Iniciar preparo',
    PREPARING: 'Marcar pronto',
    READY: 'Marcar entregue',
    DELIVERED: '',
    CANCELED: '',
  };

  return (
    <div className={`ff-kitchen-ticket ${isUrgent(ticket.createdAt) ? 'urgent' : ''}`}>
      <div className="ff-kitchen-ticket-header">
        <span className="ff-kitchen-ticket-number">{ticket.orderNumber}</span>
        <span className={`ff-kitchen-ticket-time ${isUrgent(ticket.createdAt) ? 'text-danger' : ''}`}>
          <i className="bi bi-clock me-1" />{time}
        </span>
      </div>
      {ticket.tableNumber && (
        <div className="ff-kitchen-ticket-table">
          <i className="bi bi-geo-alt me-1" />Mesa {ticket.tableNumber}
        </div>
      )}
      <div className="ff-kitchen-ticket-items">
        {ticket.items.map((item, i) => (
          <div key={i} className="ff-kitchen-ticket-item">
            <strong>{item.quantity}×</strong> {item.name}
            {item.customerName && (
              <span style={{ fontSize: 11, color: '#93c5fd', marginLeft: 6 }}>
                ({item.customerName})
              </span>
            )}
            {item.note && <span className="text-warning ms-1">— {item.note}</span>}
          </div>
        ))}
      </div>
      {next && (
        <button
          className="btn btn-sm btn-outline-light mt-1 w-100"
          onClick={() => onStatusChange(ticket.id, next)}
        >
          {nextLabel[ticket.status]}
        </button>
      )}
    </div>
  );
}

export function KitchenOrdersPage() {
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [filter, setFilter] = useState<FilterOption>('ALL');
  const notify = useNotify();
  const navigate = useNavigate();
  const prevNewCount = useRef(0);

  const load = useCallback(async () => {
    const data = await kitchenService.listTickets(filter === 'ALL' ? 'ALL' : filter);
    const newCount = data.filter((t) => t.status === 'NEW').length;
    if (newCount > prevNewCount.current) {
      playNewTicketSound();
    }
    prevNewCount.current = newCount;
    setTickets(data);
  }, [filter]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleStatusChange(id: string, status: KitchenTicketStatus) {
    await kitchenService.updateStatus(id, status);
    const labels: Partial<Record<KitchenTicketStatus, string>> = {
      PREPARING: 'Preparo iniciado',
      READY: '✅ Pedido pronto!',
      DELIVERED: 'Entregue ao cliente',
    };
    notify(labels[status] ?? 'Status atualizado');
    load();
  }

  const cols: { status: KitchenTicketStatus; label: string; cls: string }[] = [
    { status: 'NEW', label: 'Novos', cls: 'new' },
    { status: 'PREPARING', label: 'Preparando', cls: 'preparing' },
    { status: 'READY', label: 'Prontos', cls: 'ready' },
  ];

  const visible =
    filter === 'ALL'
      ? tickets
      : tickets.filter((t) => t.status === filter);

  return (
    <div className="ff-kitchen-layout">
      <div className="ff-kitchen-topbar">
        <button className="btn btn-sm btn-outline-secondary" onClick={() => navigate('/')}>
          <i className="bi bi-house" />
        </button>
        <span className="ff-kitchen-topbar-title">
          <i className="bi bi-fire me-2 text-warning" />Cozinha
        </span>
        <span className="ms-auto text-secondary" style={{ fontSize: 13 }}>
          Atualiza a cada 5s
        </span>
      </div>

      <div className="ff-kitchen-filter-bar">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            className={`ff-kitchen-filter-btn ${filter === f.value ? 'active' : ''}`}
            onClick={() => setFilter(f.value)}
          >
            {f.label}
            {f.value !== 'ALL' && (
              <span className="ms-1 badge bg-secondary">
                {tickets.filter((t) => t.status === f.value).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {filter === 'ALL' ? (
        <div className="ff-kitchen-columns">
          {cols.map((col) => {
            const colTickets = tickets.filter((t) => t.status === col.status);
            return (
              <div key={col.status} className="ff-kitchen-column">
                <div className={`ff-kitchen-column-header ${col.cls}`}>
                  {col.label} ({colTickets.length})
                </div>
                {colTickets.length === 0 && (
                  <div className="text-center text-secondary py-4" style={{ fontSize: 13 }}>
                    Nenhum pedido
                  </div>
                )}
                {colTickets.map((t) => (
                  <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} />
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 440 }}>
          {visible.length === 0 && (
            <div className="text-center text-secondary py-8" style={{ fontSize: 14 }}>
              Nenhum pedido encontrado
            </div>
          )}
          {visible.map((t) => (
            <TicketCard key={t.id} ticket={t} onStatusChange={handleStatusChange} />
          ))}
        </div>
      )}
    </div>
  );
}
