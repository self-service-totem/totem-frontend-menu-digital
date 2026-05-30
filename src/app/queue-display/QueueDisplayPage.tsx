import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueService, type EnrichedQueueTicket } from '@/lib/services/queueService';

// ─── Single ticket card ───────────────────────────────────────────────────────

interface TicketCardProps {
  ticket: EnrichedQueueTicket;
  size?: 'large' | 'normal';
}

function TicketCard({ ticket, size = 'normal' }: TicketCardProps) {
  const isReady = ticket.status === 'CALLED' || ticket.status === 'SERVING';
  const isLarge = size === 'large';

  return (
    <div
      style={{
        background: isReady ? '#14532d' : '#1e3a5f',
        border: `2px solid ${isReady ? '#22c55e' : '#3b82f6'}`,
        borderRadius: 16,
        padding: isLarge ? '28px 24px' : '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        minWidth: isLarge ? 220 : 160,
        flex: '0 0 auto',
      }}
    >
      {/* Ticket number — main identifier for the client */}
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '.08em', color: isReady ? '#86efac' : '#93c5fd', marginBottom: 2 }}>
          Senha
        </div>
        <div
          style={{
            fontSize: isLarge ? 80 : 52,
            fontWeight: 900,
            lineHeight: 1,
            color: '#fff',
            fontVariantNumeric: 'tabular-nums',
          }}
        >
          {ticket.ticketNumber}
        </div>
      </div>

      {/* Order number — same as on receipt / kiosk screen */}
      <div style={{ textAlign: 'center', background: 'rgba(255,255,255,.1)', borderRadius: 8, padding: '4px 8px' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#e2e8f0' }}>{ticket.orderNumber}</span>
      </div>

      {/* Customer name */}
      <div style={{ fontSize: isLarge ? 14 : 12, color: 'rgba(255,255,255,.7)', textAlign: 'center', fontStyle: 'italic' }}>
        {ticket.customerName}
      </div>

      {/* Items summary — helps client confirm it's their order */}
      {ticket.items.length > 0 && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,.15)', paddingTop: 8, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {ticket.items.map((item, i) => (
            <div
              key={i}
              style={{
                fontSize: isLarge ? 13 : 11,
                color: 'rgba(255,255,255,.8)',
                display: 'flex',
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 700, color: isReady ? '#86efac' : '#93c5fd', flexShrink: 0 }}>
                {item.quantity}×
              </span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {item.name}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Status badge */}
      <div style={{ textAlign: 'center', marginTop: 4 }}>
        <span
          style={{
            display: 'inline-block',
            padding: '3px 12px',
            borderRadius: 20,
            fontSize: 11,
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '.06em',
            background: isReady ? '#22c55e' : '#3b82f6',
            color: '#fff',
          }}
        >
          {ticket.status === 'CALLED' || ticket.status === 'SERVING' ? '✅ Pronto — Retire!' : '⏳ Preparando'}
        </span>
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export function QueueDisplayPage() {
  const [tickets, setTickets] = useState<EnrichedQueueTicket[]>([]);
  const [now, setNow] = useState(new Date());
  const navigate = useNavigate();

  useEffect(() => {
    function load() {
      setTickets(queueService.listActiveSync());
      setNow(new Date());
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const ready = tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
  const preparing = tickets.filter((t) => t.status === 'WAITING');

  return (
    <div className="ff-queue-layout" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="ff-queue-header">
        <button
          className="btn btn-sm"
          onClick={() => navigate('/')}
          style={{ color: '#94a3b8', borderColor: '#334155', background: 'transparent', border: '1px solid #334155' }}
        >
          <i className="bi bi-house" />
        </button>
        <div className="ff-queue-header-title">
          <i className="bi bi-tv me-2" />Acompanhe seu pedido
        </div>
        <span style={{ color: '#475569', fontSize: 14, minWidth: 60, textAlign: 'right' }}>
          {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>

      {/* Content */}
      <div style={{ flex: 1, padding: '32px 40px', display: 'flex', flexDirection: 'column', gap: 40 }}>

        {/* Ready section — top, most prominent */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              borderBottom: '2px solid #22c55e',
              paddingBottom: 10,
            }}
          >
            <span style={{ fontSize: 24 }}>✅</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Pronto para retirar
            </span>
            <span style={{ background: '#14532d', color: '#86efac', borderRadius: 20, padding: '2px 12px', fontSize: 14, fontWeight: 700 }}>
              {ready.length}
            </span>
          </div>

          {ready.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 15 }}>Nenhum pedido pronto no momento.</p>
          ) : (
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {ready.map((t) => (
                <TicketCard key={t.id} ticket={t} size="large" />
              ))}
            </div>
          )}
        </div>

        {/* Preparing section */}
        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginBottom: 20,
              borderBottom: '2px solid #3b82f6',
              paddingBottom: 10,
            }}
          >
            <span style={{ fontSize: 24 }}>⏳</span>
            <span style={{ fontSize: 20, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '.06em' }}>
              Em preparo
            </span>
            <span style={{ background: '#1e3a5f', color: '#93c5fd', borderRadius: 20, padding: '2px 12px', fontSize: 14, fontWeight: 700 }}>
              {preparing.length}
            </span>
          </div>

          {preparing.length === 0 ? (
            <p style={{ color: '#475569', fontSize: 15 }}>Nenhum pedido em preparo.</p>
          ) : (
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {preparing.map((t) => (
                <TicketCard key={t.id} ticket={t} size="normal" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          background: '#1e293b',
          padding: '12px 40px',
          textAlign: 'center',
          color: '#475569',
          fontSize: 13,
          borderTop: '1px solid #334155',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 16,
        }}
      >
        <span><i className="bi bi-arrow-repeat me-1" />Atualiza a cada 3 segundos</span>
        <span>·</span>
        <span>Confira a senha impressa com o número exibido na tela</span>
      </div>
    </div>
  );
}
