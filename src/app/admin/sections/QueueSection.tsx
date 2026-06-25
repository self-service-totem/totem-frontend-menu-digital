import { useEffect, useState } from 'react';
import { branchService } from '@/lib/services/adminService';
import { getCollection, updateOne } from '@/lib/mock-db';
import { useNotify } from '@/lib/notifications';
import type { Branch, QueueTicket } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminButton,
  AdminCard,
  MetricChip,
  AdminTable,
  QueueStatusBadge,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';

function waitingTime(createdAt: string): string {
  const mins = Math.floor((Date.now() - new Date(createdAt).getTime()) / 60000);
  if (mins < 1) return '< 1 min';
  return `${mins} min`;
}

export function QueueSection() {
  const { t } = useLabels();
  const [branch, setBranch]             = useState<Branch | null>(null);
  const [tickets, setTickets]           = useState<QueueTicket[]>([]);
  const [queueMsg, setQueueMsg]         = useState('');
  const [queueEnabled, setQueueEnabled] = useState(false);
  const [configOpen, setConfigOpen]     = useState(false);
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
    notify(next ? t('adminQueue.activatedToast') : t('adminQueue.deactivatedToast'));
  }

  async function handleSaveMsg() {
    await branchService.update({ queueMessage: queueMsg });
    notify(t('adminQueue.msgSavedToast'));
    setConfigOpen(false);
  }

  function callNext() {
    const next = tickets.find((tk) => tk.status === 'WAITING');
    if (!next) return;
    updateOne<QueueTicket>('queueTickets', next.id, { status: 'CALLED' });
    notify(t('adminQueue.callingToast', { ticket: String(next.ticketNumber), name: next.customerName }));
    loadTickets();
  }

  function advanceTicket(id: string, to: 'SERVING' | 'COMPLETED' | 'CANCELED') {
    updateOne<QueueTicket>('queueTickets', id, { status: to });
    if (to === 'CANCELED') notify(t('adminQueue.cancelledToast'));
    loadTickets();
  }

  const waiting      = tickets.filter((tk) => tk.status === 'WAITING');
  const active       = tickets.filter((tk) => tk.status === 'CALLED' || tk.status === 'SERVING');
  const open         = tickets.filter((tk) => tk.status !== 'COMPLETED' && tk.status !== 'CANCELED');
  const done         = tickets.filter((tk) => tk.status === 'COMPLETED').length;
  const nextWaiting  = waiting[0];

  if (!branch) return null;

  const columns: AdminTableColumn<QueueTicket>[] = [
    {
      key: 'ticketNumber',
      label: t('adminQueue.ticket'),
      sortable: true,
      width: '72px',
      render: (tk) => <strong>#{tk.ticketNumber}</strong>,
    },
    {
      key: 'customerName',
      label: t('common.customer'),
      sortable: true,
      render: (tk) => tk.customerName,
    },
    {
      key: 'orderNumber',
      label: t('adminQueue.orderLabel'),
      width: '90px',
      render: (tk) => <span style={{ color: '#6b7280' }}>{tk.orderNumber}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      width: '130px',
      render: (tk) => <QueueStatusBadge status={tk.status} />,
    },
    {
      key: 'createdAt',
      label: t('adminQueue.waitTime'),
      width: '80px',
      render: (tk) => <span className="ff-queue-wait-time">{waitingTime(tk.createdAt)}</span>,
    },
    {
      key: '_actions',
      label: '',
      width: '200px',
      render: (tk) => (
        <div style={{ display: 'flex', gap: 6, justifyContent: 'flex-end' }}>
          {tk.status === 'WAITING' && (
            <AdminButton
              variant="outline"
              size="sm"
              onClick={() => { updateOne<QueueTicket>('queueTickets', tk.id, { status: 'CALLED' }); loadTickets(); }}
            >
              {t('adminQueue.callBtn')}
            </AdminButton>
          )}
          {tk.status === 'CALLED' && (
            <AdminButton variant="success" size="sm" onClick={() => advanceTicket(tk.id, 'SERVING')}>
              {t('adminQueue.attendBtn')}
            </AdminButton>
          )}
          {tk.status === 'SERVING' && (
            <AdminButton variant="primary" size="sm" onClick={() => advanceTicket(tk.id, 'COMPLETED')}>
              {t('adminQueue.completeBtn')}
            </AdminButton>
          )}
          {(tk.status === 'WAITING' || tk.status === 'CALLED') && (
            <AdminButton variant="destructive" size="sm" onClick={() => advanceTicket(tk.id, 'CANCELED')}>
              {t('adminQueue.cancelBtn')}
            </AdminButton>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="ff-queue-screen">
      <AdminPageHeader
        title={t('adminQueue.title')}
        actions={
          <div className="ff-queue-header-actions">
            <span className={`ff-admin-badge ${queueEnabled ? 'ff-admin-badge--active' : 'ff-admin-badge--inactive'}`}>
              {queueEnabled ? t('adminQueue.enabled') : t('adminQueue.disabled')}
            </span>
            <AdminButton
              variant="ghost"
              size="sm"
              icon="bi-gear"
              onClick={() => setConfigOpen((o) => !o)}
            >
              {t('adminQueue.configure')}
            </AdminButton>
            {nextWaiting && (
              <AdminButton variant="success" icon="bi-megaphone" onClick={callNext}>
                {t('adminQueue.callNextBtn')} — #{nextWaiting.ticketNumber} · {nextWaiting.customerName}
              </AdminButton>
            )}
          </div>
        }
      />

      {configOpen && (
        <AdminCard>
          <div className="ff-queue-config-panel">
            <div className="ff-admin-toggle-row">
              <button
                className="ff-admin-toggle"
                aria-checked={queueEnabled}
                onClick={handleToggle}
                role="switch"
                aria-label={t('adminQueue.enableBtn')}
              >
                <span className="ff-admin-toggle-thumb" />
              </button>
              <span className={`ff-admin-toggle-label${queueEnabled ? ' ff-admin-toggle-label--on' : ''}`}>
                {queueEnabled ? t('adminQueue.enabledDesc') : t('adminQueue.disabledDesc')}
              </span>
            </div>
            <div className="ff-queue-config-grid">
              <label className="ff-admin-form-label">{t('adminQueue.messageLabel')}</label>
              <div className="ff-queue-config-row">
                <input
                  className="ff-admin-form-input"
                  value={queueMsg}
                  onChange={(e) => setQueueMsg(e.target.value)}
                  placeholder={t('adminQueue.messagePlaceholder')}
                />
                <AdminButton variant="secondary" onClick={handleSaveMsg}>{t('common.save')}</AdminButton>
                <AdminButton variant="ghost" onClick={() => setConfigOpen(false)}>{t('common.cancel')}</AdminButton>
              </div>
            </div>
          </div>
        </AdminCard>
      )}

      <div className="ff-queue-metrics-strip">
        <MetricChip label={t('adminQueue.waiting')}   value={waiting.length} icon="bi-hourglass-split" color="amber" />
        <MetricChip label={t('adminQueue.serving')}   value={active.length}  icon="bi-person-check"    color="green" />
        <MetricChip label={t('adminQueue.completed')} value={done}           icon="bi-check-all"        color="slate" />
      </div>

      <AdminCard
        header={t('adminQueue.openTickets')}
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
          emptyTitle={t('adminQueue.noOpenTickets')}
          emptyMessage={t('adminQueue.empty')}
        />
      </AdminCard>
    </div>
  );
}
