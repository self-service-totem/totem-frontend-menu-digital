import { useEffect, useState } from 'react';
import { branchService } from '@/lib/services/adminService';
import { getCollection, updateOne } from '@/lib/mock-db';
import { useNotify } from '@/lib/notifications';
import type { Branch, QueueTicket } from '@/lib/types';
import {
  AdminPageHeader,
  AdminButton,
  AdminCard,
  MetricChip,
  AdminTable,
  QueueStatusBadge,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';

export function QueueSection() {
  const [branch, setBranch]             = useState<Branch | null>(null);
  const [tickets, setTickets]           = useState<QueueTicket[]>([]);
  const [queueMsg, setQueueMsg]         = useState('');
  const [queueEnabled, setQueueEnabled] = useState(false);
  const notify = useNotify();

  function loadTickets() {
    setTickets(
      getCollection<QueueTicket>('queueTickets').sort((a, b) => a.ticketNumber - b.ticketNumber),
    );
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

  const columns: AdminTableColumn<QueueTicket>[] = [
    {
      key: 'ticketNumber',
      label: 'Senha',
      sortable: true,
      width: '80px',
      render: (t) => <strong>#{t.ticketNumber}</strong>,
    },
    {
      key: 'customerName',
      label: 'Cliente',
      sortable: true,
      render: (t) => t.customerName,
    },
    {
      key: 'orderNumber',
      label: 'Pedido',
      render: (t) => <span style={{ color: '#6b7280' }}>{t.orderNumber}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (t) => <QueueStatusBadge status={t.status} />,
    },
    {
      key: '_actions',
      label: '',
      width: '120px',
      render: (t) => (
        <div style={{ display: 'flex', gap: 6 }}>
          {t.status === 'WAITING' && (
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => { updateOne<QueueTicket>('queueTickets', t.id, { status: 'CALLED' }); loadTickets(); }}
            >
              Chamar
            </AdminButton>
          )}
          {t.status === 'CALLED' && (
            <AdminButton
              variant="success"
              size="sm"
              onClick={() => advanceTicket(t.id, 'SERVING')}
            >
              Atender
            </AdminButton>
          )}
          {t.status === 'SERVING' && (
            <AdminButton
              variant="primary"
              size="sm"
              onClick={() => advanceTicket(t.id, 'COMPLETED')}
            >
              Concluir
            </AdminButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ff-queue-screen">
      <AdminPageHeader
        title="Fila de espera"
        subtitle="Gestão da fila de atendimento presencial"
        actions={
          <span className={`ff-admin-badge ${queueEnabled ? 'ff-admin-badge--active' : 'ff-admin-badge--inactive'}`}>
            {queueEnabled ? 'Fila ativa' : 'Fila inativa'}
          </span>
        }
      />

      {/* Config panel */}
      <AdminCard header="Configurações da fila">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="ff-admin-toggle-row">
            <button
              className="ff-admin-toggle"
              aria-checked={queueEnabled}
              onClick={handleToggle}
              role="switch"
              aria-label="Habilitar fila"
            >
              <span className="ff-admin-toggle-thumb" />
            </button>
            <span className={`ff-admin-toggle-label${queueEnabled ? ' ff-admin-toggle-label--on' : ''}`}>
              {queueEnabled ? 'Fila habilitada — visível no Menu Digital' : 'Fila desabilitada'}
            </span>
          </div>

          <div className="ff-admin-form-row">
            <label className="ff-admin-form-label">Mensagem exibida aos clientes</label>
            <div className="ff-queue-config-grid">
              <input
                className="ff-admin-form-input"
                value={queueMsg}
                onChange={(e) => setQueueMsg(e.target.value)}
                placeholder="ex: Acompanhe seu pedido aqui!"
              />
              <AdminButton variant="secondary" onClick={handleSaveMsg}>Salvar</AdminButton>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* Metrics strip */}
      <div className="ff-queue-metrics-strip">
        <MetricChip label="Aguardando"     value={waiting.length} icon="bi-hourglass-split" color="amber" />
        <MetricChip label="Sendo atendido" value={active.length}  icon="bi-person-check"    color="green" />
        <MetricChip label="Concluídos"     value={done}           icon="bi-check-all"        color="slate" />
      </div>

      {/* Call next CTA */}
      {waiting.length > 0 && (
        <AdminButton variant="success" icon="bi-megaphone" size="lg" onClick={callNext}>
          Chamar próxima — #{waiting[0].ticketNumber} · {waiting[0].customerName}
        </AdminButton>
      )}

      {/* Open tickets table */}
      <AdminCard
        header="Senhas em aberto"
        headerRight={
          open.length > 0
            ? <span className="ff-admin-badge ff-admin-badge--blue">{open.length}</span>
            : undefined
        }
        noPad
      >
        <AdminTable<QueueTicket>
          columns={columns}
          rows={open}
          emptyIcon="bi-people"
          emptyTitle="Nenhuma senha em aberto"
          emptyMessage="A fila está vazia no momento."
        />
      </AdminCard>
    </div>
  );
}
