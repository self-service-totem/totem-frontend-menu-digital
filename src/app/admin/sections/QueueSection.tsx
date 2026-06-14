import { useEffect, useState } from 'react';
import { branchService } from '@/lib/services/adminService';
import { getCollection, updateOne } from '@/lib/mock-db';
import { useNotify } from '@/lib/notifications';
import type { Branch, QueueTicket } from '@/lib/types';

const TICKET_STATUS_LABEL: Record<string, string> = {
  WAITING:   'Aguardando',
  CALLED:    'Chamado',
  SERVING:   'Atendendo',
  COMPLETED: 'Concluído',
  CANCELED:  'Cancelado',
};

export function QueueSection() {
  const [branch, setBranch]           = useState<Branch | null>(null);
  const [tickets, setTickets]         = useState<QueueTicket[]>([]);
  const [queueMsg, setQueueMsg]       = useState('');
  const [queueEnabled, setQueueEnabled] = useState(false);
  const notify = useNotify();

  function loadTickets() {
    setTickets(getCollection<QueueTicket>('queueTickets').sort((a, b) => a.ticketNumber - b.ticketNumber));
  }

  async function load() {
    const b = await branchService.get();
    setBranch(b);
    if (b) { setQueueEnabled(b.queueEnabled); setQueueMsg(b.queueMessage ?? ''); }
    loadTickets();
  }
  useEffect(() => { load(); }, []);

  async function handleToggle() {
    const next = !queueEnabled;
    await branchService.update({ queueEnabled: next });
    setQueueEnabled(next);
    notify(next ? 'Fila ativada — visível no Menu Digital' : 'Fila desativada');
  }

  async function handleSaveMsg() {
    await branchService.update({ queueMessage: queueMsg });
    notify('Mensagem da fila atualizada');
  }

  function callNext() {
    const next = tickets.find((t) => t.status === 'WAITING');
    if (!next) return;
    updateOne<QueueTicket>('queueTickets', next.id, { status: 'CALLED' });
    notify(`Chamando senha #${next.ticketNumber} — ${next.customerName}`);
    loadTickets();
  }

  function advanceTicket(id: string, to: 'SERVING' | 'COMPLETED') {
    updateOne<QueueTicket>('queueTickets', id, { status: to });
    loadTickets();
  }

  const waiting = tickets.filter((t) => t.status === 'WAITING');
  const active  = tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
  const open    = tickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELED');
  const done    = tickets.filter((t) => t.status === 'COMPLETED').length;

  if (!branch) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>
      <div className="ff-data-card">
        <div className="ff-data-card-header">
          Configurações da fila
          <span className={`badge ms-2 ${queueEnabled ? 'bg-success' : 'bg-secondary'}`}>{queueEnabled ? 'Ativa' : 'Inativa'}</span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 24, borderRadius: 12, cursor: 'pointer', background: queueEnabled ? '#059669' : '#d1d5db', position: 'relative', transition: 'background 0.18s', flexShrink: 0 }} onClick={handleToggle}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#fff', position: 'absolute', top: 2, left: queueEnabled ? 22 : 2, transition: 'left 0.18s' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: queueEnabled ? '#059669' : '#6b7280' }}>
              {queueEnabled ? 'Fila habilitada — visível no Menu Digital' : 'Fila desabilitada'}
            </span>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Mensagem exibida aos clientes</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input className="form-control form-control-sm" value={queueMsg} onChange={(e) => setQueueMsg(e.target.value)} placeholder="ex: Acompanhe seu pedido aqui!" />
              <button className="btn btn-sm btn-primary" onClick={handleSaveMsg}>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="ff-metric-card"><div className="ff-metric-card-label">Aguardando</div><div className="ff-metric-card-value" style={{ color: '#d97706' }}>{waiting.length}</div></div>
        <div className="ff-metric-card"><div className="ff-metric-card-label">Sendo atendido</div><div className="ff-metric-card-value" style={{ color: '#059669' }}>{active.length}</div></div>
        <div className="ff-metric-card"><div className="ff-metric-card-label">Concluídos</div><div className="ff-metric-card-value">{done}</div></div>
      </div>

      {waiting.length > 0 && (
        <button className="btn btn-success" style={{ alignSelf: 'flex-start' }} onClick={callNext}>
          <i className="bi bi-megaphone me-2" />
          Chamar próxima — #{waiting[0].ticketNumber} · {waiting[0].customerName}
        </button>
      )}

      <div className="ff-data-card">
        <div className="ff-data-card-header">
          Senhas em aberto
          {open.length > 0 && <span className="badge bg-primary ms-2">{open.length}</span>}
        </div>
        {open.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="bi bi-people" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            Nenhuma senha em aberto no momento.
          </div>
        ) : (
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>Senha</th><th>Cliente</th><th>Pedido</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {open.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong>#{ticket.ticketNumber}</strong></td>
                  <td>{ticket.customerName}</td>
                  <td style={{ color: '#6b7280' }}>{ticket.orderNumber}</td>
                  <td>
                    <span className={`badge ${ticket.status === 'WAITING' ? 'bg-warning text-dark' : ticket.status === 'CALLED' ? 'bg-primary' : 'bg-success'}`}>
                      {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ticket.status === 'WAITING' && <button className="btn btn-sm btn-outline-primary" onClick={() => { updateOne<QueueTicket>('queueTickets', ticket.id, { status: 'CALLED' }); loadTickets(); }}>Chamar</button>}
                      {ticket.status === 'CALLED'  && <button className="btn btn-sm btn-outline-success" onClick={() => advanceTicket(ticket.id, 'SERVING')}>Atender</button>}
                      {ticket.status === 'SERVING' && <button className="btn btn-sm btn-success" onClick={() => advanceTicket(ticket.id, 'COMPLETED')}>Concluir</button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
