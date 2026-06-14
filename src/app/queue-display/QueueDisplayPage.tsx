import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { queueService, type EnrichedQueueTicket } from '@/lib/services/queueService';
import { getCollection } from '@/lib/mock-db';
import type { Tenant, Branch } from '@/lib/types';

// ─── Audio ───────────────────────────────────────────────────────────────────

function playReadyChime() {
  try {
    const ctx = new AudioContext();
    const notes = [
      { freq: 1046.5, delay: 0,    dur: 0.25 },
      { freq: 1318.5, delay: 0.12, dur: 0.30 },
      { freq: 1568.0, delay: 0.24, dur: 0.45 },
    ];
    notes.forEach(({ freq, delay, dur }) => {
      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.value = freq;
      const t = ctx.currentTime + delay;
      gain.gain.setValueAtTime(0.28, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.start(t); osc.stop(t + dur + 0.05);
    });
  } catch { /* AudioContext blocked before user interaction — ignored */ }
}

// ─── Number card ─────────────────────────────────────────────────────────────

interface NumberCardProps {
  ticket: EnrichedQueueTicket;
  isReady: boolean;
  flash: boolean;
}

function NumberCard({ ticket, isReady, flash }: NumberCardProps) {
  return (
    <div className={`ff-queue-num-card${isReady ? ' ready' : ' preparing'}${flash ? ' ff-queue-ready-anim' : ''}`}>
      <div className="ff-queue-num-label">Senha</div>
      <div className="ff-queue-num-value">{ticket.ticketNumber}</div>
      <div className="ff-queue-num-order">{ticket.orderNumber}</div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function QueueDisplayPage() {
  const [tickets, setTickets]     = useState<EnrichedQueueTicket[]>([]);
  const [now, setNow]             = useState(new Date());
  const [flashIds, setFlashIds]   = useState<Set<string>>(new Set());
  const navigate = useNavigate();

  const tenant = getCollection<Tenant>('tenants')[0];
  const branch = getCollection<Branch>('branches')[0];

  const prevReadyIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    function load() {
      const data     = queueService.listActiveSync();
      const ready    = data.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
      const readyIds = new Set(ready.map((t) => t.id));

      const justReady = [...readyIds].filter((id) => !prevReadyIds.current.has(id));
      if (justReady.length > 0) {
        playReadyChime();
        setFlashIds(new Set(justReady));
        setTimeout(() => setFlashIds(new Set()), 2000);
      }

      prevReadyIds.current = readyIds;
      setTickets(data);
      setNow(new Date());
    }
    load();
    const interval = setInterval(load, 3000);
    return () => clearInterval(interval);
  }, []);

  const ready     = tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
  const preparing = tickets.filter((t) => t.status === 'WAITING');

  return (
    <div style={{ minHeight: '100vh', background: '#0f172a', display: 'flex', flexDirection: 'column', fontFamily: 'system-ui, sans-serif', color: '#f1f5f9' }}>

      {/* Header */}
      <div style={{ background: '#1e293b', borderBottom: '1px solid #334155', padding: '0 28px', height: 68, display: 'flex', alignItems: 'center', gap: 20, flexShrink: 0 }}>
        {/* Branding */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg,#3b82f6,#8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
            🍽️
          </div>
          <div style={{ lineHeight: 1.2 }}>
            <div style={{ fontWeight: 800, fontSize: 16, color: '#f1f5f9', letterSpacing: '.02em' }}>
              {tenant?.name ?? 'Restaurante'}
            </div>
            {branch?.name && (
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 500 }}>{branch.name}</div>
            )}
          </div>
        </div>

        {/* Center title */}
        <div style={{ flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#94a3b8', letterSpacing: '.08em', textTransform: 'uppercase' }}>
          <i className="bi bi-tv me-2" style={{ color: '#60a5fa' }} />
          Acompanhe seu pedido
        </div>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <button
            onClick={() => navigate('/')}
            style={{ color: '#475569', background: 'transparent', border: '1px solid #1e3a5f', borderRadius: 7, padding: '3px 9px', cursor: 'pointer', fontSize: 13 }}
            title="Hub"
          >
            <i className="bi bi-house" />
          </button>
          <span style={{ color: '#60a5fa', fontSize: 20, fontWeight: 700, fontVariantNumeric: 'tabular-nums', letterSpacing: '.04em' }}>
            {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      </div>

      {/* Two-column body */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', overflow: 'hidden' }}>

        {/* Left — Em preparo */}
        <div style={{ borderRight: '1px solid #1e3a5f', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: 'rgba(59,130,246,.08)', borderBottom: '2px solid #3b82f6', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>⏳</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#93c5fd', textTransform: 'uppercase', letterSpacing: '.06em' }}>Em preparo</span>
            <span style={{ background: '#1e3a5f', color: '#93c5fd', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>
              {preparing.length}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 12, alignContent: 'flex-start' }}>
            {preparing.length === 0 ? (
              <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>Nenhum pedido em preparo.</p>
            ) : (
              preparing.map((t) => (
                <NumberCard key={t.id} ticket={t} isReady={false} flash={false} />
              ))
            )}
          </div>
        </div>

        {/* Right — Pronto para retirar */}
        <div style={{ background: 'rgba(20,83,45,.05)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 24px', background: 'rgba(34,197,94,.08)', borderBottom: '2px solid #22c55e', display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <span style={{ fontSize: 20 }}>✅</span>
            <span style={{ fontSize: 17, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '.06em' }}>Pronto — Retire!</span>
            <span style={{ background: '#14532d', color: '#86efac', borderRadius: 20, padding: '2px 10px', fontSize: 13, fontWeight: 700, marginLeft: 'auto' }}>
              {ready.length}
            </span>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexWrap: 'wrap', gap: 16, alignContent: 'flex-start' }}>
            {ready.length === 0 ? (
              <p style={{ color: '#475569', fontSize: 15, margin: 0 }}>Aguardando pedidos prontos...</p>
            ) : (
              ready.map((t) => (
                <NumberCard key={t.id} ticket={t} isReady={true} flash={flashIds.has(t.id)} />
              ))
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{ background: '#1e293b', borderTop: '1px solid #334155', padding: '10px 40px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 16, color: '#475569', fontSize: 13, flexShrink: 0 }}>
        <span><i className="bi bi-arrow-repeat me-1" />Atualiza a cada 3 segundos</span>
        <span>·</span>
        <span>Confira a senha impressa com o número exibido na tela</span>
      </div>
    </div>
  );
}
