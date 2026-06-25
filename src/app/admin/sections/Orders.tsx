import { useEffect, useRef, useState } from 'react';
import { adminOrderService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbOrder, FullOrderStatus } from '@/lib/types';
import { formatBRL } from '../adminUtils';
import { useLabels } from '@/i18n/I18nContext';
import {
  OrderStatusBadge,
  PaymentStatusBadge,
  AdminTable,
  AdminSearchInput,
  AdminFilterBar,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir } from '@/components/admin';

const STATUS_ADVANCE: Record<string, string> = {
  CREATED:         'SENT_TO_KITCHEN',
  SENT_TO_KITCHEN: 'PREPARING',
  PREPARING:       'READY',
  READY:           'DELIVERED',
  DELIVERED:       'CLOSED',
};

const TIMELINE_STEPS = [
  { key: 'CREATED',         icon: 'bi-plus-circle' },
  { key: 'SENT_TO_KITCHEN', icon: 'bi-fire' },
  { key: 'PREPARING',       icon: 'bi-hourglass-split' },
  { key: 'READY',           icon: 'bi-check-circle' },
  { key: 'DELIVERED',       icon: 'bi-bag-check' },
  { key: 'CLOSED',          icon: 'bi-lock' },
];

const STATUS_ORDER = ['CREATED', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELED'];

function OrderDrawer({ order, onClose, onAdvance }: {
  order: DbOrder;
  onClose: () => void;
  onAdvance: (id: string, status: string) => void;
}) {
  const { t } = useLabels();

  const STATUS_ADVANCE_LABEL: Record<string, string> = {
    CREATED:         t('adminOrders.actionSendKitchen'),
    SENT_TO_KITCHEN: t('adminOrders.actionPreparing'),
    PREPARING:       t('adminOrders.actionReady'),
    READY:           t('adminOrders.actionDelivered'),
    DELIVERED:       t('adminOrders.actionClose'),
  };

  const ORDER_STATUS_LABEL: Record<string, string> = {
    DRAFT:           t('status.draft'),
    CREATED:         t('status.created'),
    SENT_TO_KITCHEN: t('status.inKitchen'),
    PREPARING:       t('status.preparing'),
    READY:           t('status.ready'),
    DELIVERED:       t('status.delivered'),
    CLOSED:          t('status.closed'),
    CANCELED:        t('status.canceled'),
  };

  const nextStatus  = STATUS_ADVANCE[order.status];
  const currentIdx  = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="ff-order-drawer">
      <div className="ff-order-drawer-header">
        <span className="ff-order-drawer-title">#{order.orderNumber}</span>
        <button className="ff-order-drawer-close" onClick={onClose}><i className="bi bi-x" /></button>
      </div>

      <div className="ff-order-drawer-body">
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <OrderStatusBadge status={order.status} />
          <PaymentStatusBadge status={order.paymentStatus} />
          <span className="ff-admin-badge ff-admin-badge--neutral">{order.source}</span>
          {order.tableNumber && (
            <span className="ff-admin-badge ff-admin-badge--blue">
              <i className="bi bi-table" /> {t('adminOrders.tableLabel')} {order.tableNumber}
            </span>
          )}
        </div>

        <div>
          <div className="ff-order-drawer-section-label">{t('adminOrders.sectionCustomer')}</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{order.customerName}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">{t('adminOrders.sectionItems')}</div>
          {order.items.map((item, i) => (
            <div key={i} className="ff-order-drawer-item">
              <div className="ff-order-drawer-item-qty">{item.quantity}</div>
              <div style={{ flex: 1 }}>
                <div className="ff-order-drawer-item-name">{item.name}</div>
                {item.note && (
                  <div className="ff-order-drawer-item-note">
                    {t('adminOrders.itemNote', { note: item.note })}
                  </div>
                )}
              </div>
              <div className="ff-order-drawer-item-price">{formatBRL(item.unitPrice * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="ff-order-drawer-totals">
          <div className="ff-order-drawer-total-row"><span>{t('adminOrders.subtotal')}</span><span>{formatBRL(order.subtotal)}</span></div>
          {order.serviceFee > 0 && (
            <div className="ff-order-drawer-total-row"><span>{t('adminOrders.serviceFee')}</span><span>{formatBRL(order.serviceFee)}</span></div>
          )}
          <div className="ff-order-drawer-total-row grand"><span>Total</span><span>{formatBRL(order.total)}</span></div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">{t('adminOrders.sectionHistory')}</div>
          <div className="ff-order-timeline">
            {TIMELINE_STEPS.map((step) => {
              const stepIdx   = STATUS_ORDER.indexOf(step.key);
              const isDone    = stepIdx < currentIdx;
              const isCurrent = step.key === order.status;
              if (order.status === 'CANCELED' && !isDone && !isCurrent) return null;
              return (
                <div key={step.key} className="ff-order-timeline-step">
                  <div className={`ff-order-timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    <i className={`bi ${isDone ? 'bi-check' : step.icon}`} />
                  </div>
                  <div className={`ff-order-timeline-label ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    {ORDER_STATUS_LABEL[step.key]}
                  </div>
                </div>
              );
            })}
            {order.status === 'CANCELED' && (
              <div className="ff-order-timeline-step">
                <div className="ff-order-timeline-dot current" style={{ background: 'var(--ff-status-cancelled)', borderColor: 'var(--ff-status-cancelled)' }}>
                  <i className="bi bi-x" />
                </div>
                <div className="ff-order-timeline-label current" style={{ color: 'var(--ff-status-cancelled)' }}>
                  {t('status.canceled')}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nextStatus && (
        <div className="ff-order-drawer-footer">
          <button className="ff-order-advance-btn" onClick={() => onAdvance(order.id, nextStatus)}>
            <i className="bi bi-arrow-right-circle" />
            {STATUS_ADVANCE_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}

export function Orders() {
  const { t } = useLabels();
  const [orders, setOrders]       = useState<DbOrder[]>([]);
  const [filter, setFilter]       = useState('');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<DbOrder | null>(null);
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());
  const [sortBy, setSortBy]       = useState('createdAt');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const prevIdsRef                = useRef<Set<string>>(new Set());
  const notify = useNotify();

  const ORDER_STATUS_LABEL: Record<string, string> = {
    DRAFT:           t('status.draft'),
    CREATED:         t('status.created'),
    SENT_TO_KITCHEN: t('status.inKitchen'),
    PREPARING:       t('status.preparing'),
    READY:           t('status.ready'),
    DELIVERED:       t('status.delivered'),
    CLOSED:          t('status.closed'),
    CANCELED:        t('status.canceled'),
  };

  const FILTER_TABS = [
    { key: '',                label: t('adminOrders.filterAll') },
    { key: 'SENT_TO_KITCHEN', label: t('adminOrders.filterInKitchen') },
    { key: 'PREPARING',       label: t('adminOrders.filterPreparing') },
    { key: 'READY',           label: t('adminOrders.filterReady') },
    { key: 'DELIVERED',       label: t('adminOrders.filterDelivered') },
    { key: 'PAID',            label: t('adminOrders.filterPaid') },
    { key: 'UNPAID',          label: t('adminOrders.filterUnpaid') },
  ];

  const COLUMNS: AdminTableColumn<DbOrder>[] = [
    {
      key: 'orderNumber',
      label: t('adminOrders.colOrder'),
      sortable: true,
      width: '90px',
      render: (o) => (
        <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#1a1a1a' }}>#{o.orderNumber}</strong>
      ),
    },
    {
      key: 'customerName',
      label: t('common.customer'),
      sortable: true,
      render: (o) => o.customerName,
    },
    {
      key: 'tableNumber',
      label: t('adminOrders.colTable'),
      sortable: true,
      render: (o) => o.tableNumber
        ? `${t('adminOrders.tableLabel')} ${o.tableNumber}`
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'total',
      label: 'Total',
      sortable: true,
      align: 'right',
      render: (o) => <span style={{ fontWeight: 700 }}>{formatBRL(o.total)}</span>,
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      render: (o) => <OrderStatusBadge status={o.status} />,
    },
    {
      key: 'paymentStatus',
      label: t('adminOrders.colPayment'),
      sortable: true,
      render: (o) => <PaymentStatusBadge status={o.paymentStatus} />,
    },
    {
      key: 'source',
      label: t('adminOrders.colOrigin'),
      render: (o) => <span style={{ color: '#6b7280' }}>{o.source}</span>,
    },
    {
      key: 'createdAt',
      label: t('adminOrders.colTime'),
      sortable: true,
      render: (o) => (
        <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
          {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
        </span>
      ),
    },
  ];

  async function load() {
    const fresh = await adminOrderService.list();
    setOrders(fresh);
    const freshIds = new Set(fresh.map((o) => o.id));
    const added    = new Set([...freshIds].filter((id) => !prevIdsRef.current.has(id)));
    if (added.size > 0 && prevIdsRef.current.size > 0) {
      setNewIds(added);
      setTimeout(() => setNewIds(new Set()), 2500);
    }
    prevIdsRef.current = freshIds;
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const timer = setInterval(load, 5000); return () => clearInterval(timer); }, []);

  async function handleAdvance(orderId: string, status: string) {
    await adminOrderService.updateStatus(orderId, status as FullOrderStatus);
    notify(t('adminOrders.updatedToast', { status: ORDER_STATUS_LABEL[status] ?? status }));
    load();
    setSelected((prev) => prev?.id === orderId ? { ...prev, status: status as FullOrderStatus } : prev);
  }

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  }

  const statusFiltered = filter
    ? orders.filter((o) => o.status === filter || o.paymentStatus === filter)
    : orders;

  const searchFiltered = search
    ? statusFiltered.filter((o) =>
        `#${o.orderNumber}`.includes(search) ||
        o.customerName.toLowerCase().includes(search.toLowerCase()) ||
        (o.tableNumber && `mesa ${o.tableNumber}`.toLowerCase().includes(search.toLowerCase()))
      )
    : statusFiltered;

  const sorted = useSortable(searchFiltered, sortBy, sortDir);

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
    if (o.paymentStatus === 'PAID')   counts['PAID']   = (counts['PAID']   ?? 0) + 1;
    if (o.paymentStatus === 'UNPAID') counts['UNPAID'] = (counts['UNPAID'] ?? 0) + 1;
  });

  const filterOptions = FILTER_TABS.map((tab) => ({
    key: tab.key,
    label: tab.label,
    count: tab.key === '' ? orders.length : (counts[tab.key] ?? 0),
  }));

  const columnsWithHighlight: AdminTableColumn<DbOrder>[] = COLUMNS.map((col) => ({
    ...col,
    render: (o: DbOrder) => {
      const base = col.render(o);
      if (col.key === 'orderNumber' && newIds.has(o.id)) {
        return <span className="ff-order-row-new-indicator">{base}</span>;
      }
      return base;
    },
  }));

  return (
    <div className="ff-orders-screen">
      <div className="ff-admin-op-bar">
        <div className="ff-admin-op-bar-head">
          <h1 className="ff-admin-op-bar-title">{t('adminOrders.title')}</h1>
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('adminOrders.searchPlaceholder')}
          />
        </div>
        <AdminFilterBar options={filterOptions} value={filter} onChange={setFilter} />
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="ff-orders-screen-main">
          <div className="ff-admin-card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: 0 }}>
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'auto', minHeight: 0 }}>
              <AdminTable<DbOrder>
                columns={columnsWithHighlight}
                rows={sorted}
                sortBy={sortBy}
                sortDir={sortDir}
                onSort={handleSort}
                onRowClick={(o) => setSelected(selected?.id === o.id ? null : o)}
                selectedId={selected?.id}
                emptyIcon="bi-receipt"
                emptyTitle={t('adminOrders.noOrders')}
                emptyMessage={t('adminOrders.noOrdersDesc')}
              />
            </div>
          </div>
        </div>

        {selected && (
          <OrderDrawer
            order={selected}
            onClose={() => setSelected(null)}
            onAdvance={handleAdvance}
          />
        )}
      </div>
    </div>
  );
}
