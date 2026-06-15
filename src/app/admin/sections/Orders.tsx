import { useEffect, useRef, useState } from 'react';
import { adminOrderService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbOrder, FullOrderStatus } from '@/lib/types';
import { formatBRL } from '../adminUtils';
import {
  AdminPageHeader,
  OrderStatusBadge,
  PaymentStatusBadge,
  AdminTable,
  AdminMetricCard,
  AdminSearchInput,
  AdminFilterBar,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir } from '@/components/admin';

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT:           'Rascunho',
  CREATED:         'Criado',
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
};


const STATUS_ADVANCE: Record<string, string> = {
  CREATED:         'SENT_TO_KITCHEN',
  SENT_TO_KITCHEN: 'PREPARING',
  PREPARING:       'READY',
  READY:           'DELIVERED',
  DELIVERED:       'CLOSED',
};

const STATUS_ADVANCE_LABEL: Record<string, string> = {
  CREATED:         'Enviar p/ cozinha',
  SENT_TO_KITCHEN: 'Marcar como preparando',
  PREPARING:       'Marcar como pronto',
  READY:           'Marcar como entregue',
  DELIVERED:       'Encerrar pedido',
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

const FILTER_TABS = [
  { key: '',                label: 'Todos' },
  { key: 'SENT_TO_KITCHEN', label: 'Na cozinha' },
  { key: 'PREPARING',       label: 'Preparando' },
  { key: 'READY',           label: 'Prontos' },
  { key: 'DELIVERED',       label: 'Entregues' },
  { key: 'PAID',            label: 'Pagos' },
];

function OrderDrawer({ order, onClose, onAdvance }: {
  order: DbOrder;
  onClose: () => void;
  onAdvance: (id: string, status: string) => void;
}) {
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
              <i className="bi bi-table" /> Mesa {order.tableNumber}
            </span>
          )}
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{order.customerName}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Itens</div>
          {order.items.map((item, i) => (
            <div key={i} className="ff-order-drawer-item">
              <div className="ff-order-drawer-item-qty">{item.quantity}</div>
              <div style={{ flex: 1 }}>
                <div className="ff-order-drawer-item-name">{item.name}</div>
                {item.note && <div className="ff-order-drawer-item-note">Obs: {item.note}</div>}
              </div>
              <div className="ff-order-drawer-item-price">{formatBRL(item.unitPrice * item.quantity)}</div>
            </div>
          ))}
        </div>

        <div className="ff-order-drawer-totals">
          <div className="ff-order-drawer-total-row"><span>Subtotal</span><span>{formatBRL(order.subtotal)}</span></div>
          {order.serviceFee > 0 && (
            <div className="ff-order-drawer-total-row"><span>Taxa de serviço</span><span>{formatBRL(order.serviceFee)}</span></div>
          )}
          <div className="ff-order-drawer-total-row grand"><span>Total</span><span>{formatBRL(order.total)}</span></div>
        </div>

        <div>
          <div className="ff-order-drawer-section-label">Histórico</div>
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
                  Cancelado
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

const COLUMNS: AdminTableColumn<DbOrder>[] = [
  {
    key: 'orderNumber',
    label: 'Pedido',
    sortable: true,
    width: '90px',
    render: (o) => (
      <strong style={{ fontVariantNumeric: 'tabular-nums', color: '#1a1a1a' }}>#{o.orderNumber}</strong>
    ),
  },
  {
    key: 'customerName',
    label: 'Cliente',
    sortable: true,
    render: (o) => o.customerName,
  },
  {
    key: 'tableNumber',
    label: 'Mesa',
    sortable: true,
    render: (o) => o.tableNumber
      ? `Mesa ${o.tableNumber}`
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
    label: 'Pagamento',
    sortable: true,
    render: (o) => <PaymentStatusBadge status={o.paymentStatus} />,
  },
  {
    key: 'source',
    label: 'Origem',
    render: (o) => <span style={{ color: '#6b7280' }}>{o.source}</span>,
  },
  {
    key: 'createdAt',
    label: 'Hora',
    sortable: true,
    render: (o) => (
      <span style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
        {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
      </span>
    ),
  },
];

export function Orders() {
  const [orders, setOrders]       = useState<DbOrder[]>([]);
  const [filter, setFilter]       = useState('');
  const [search, setSearch]       = useState('');
  const [selected, setSelected]   = useState<DbOrder | null>(null);
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());
  const [sortBy, setSortBy]       = useState('createdAt');
  const [sortDir, setSortDir]     = useState<SortDir>('desc');
  const prevIdsRef                = useRef<Set<string>>(new Set());
  const notify = useNotify();

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
  useEffect(() => { const t = setInterval(load, 5000); return () => clearInterval(t); }, []);

  async function handleAdvance(orderId: string, status: string) {
    await adminOrderService.updateStatus(orderId, status as FullOrderStatus);
    notify(`Pedido atualizado → ${ORDER_STATUS_LABEL[status] ?? status}`);
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
    if (o.paymentStatus === 'PAID') counts['PAID'] = (counts['PAID'] ?? 0) + 1;
  });

  const inKitchen  = (counts['SENT_TO_KITCHEN'] ?? 0);
  const preparing  = (counts['PREPARING'] ?? 0);
  const ready      = (counts['READY'] ?? 0);
  const delivered  = (counts['DELIVERED'] ?? 0);
  const paid       = (counts['PAID'] ?? 0);
  const unpaid     = orders.filter((o) => o.paymentStatus === 'UNPAID').length;

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
      <AdminPageHeader title="Pedidos" subtitle="Acompanhamento de pedidos em tempo real" />

      {/* Metrics */}
      <div className="ff-admin-metrics-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))' }}>
        <AdminMetricCard label="Total hoje" value={orders.length} icon="bi-receipt" color="slate" />
        <AdminMetricCard label="Na cozinha" value={inKitchen} icon="bi-fire" color="amber" />
        <AdminMetricCard label="Preparando" value={preparing} icon="bi-hourglass-split" color="amber" />
        <AdminMetricCard label="Prontos" value={ready} icon="bi-check-circle" color="green" />
        <AdminMetricCard label="Entregues" value={delivered} icon="bi-bag-check" color="purple" />
        <AdminMetricCard label="Pagos" value={paid} icon="bi-credit-card" color="green" />
        <AdminMetricCard label="Não pagos" value={unpaid} icon="bi-exclamation-circle" color="red" />
      </div>

      <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0, overflow: 'hidden' }}>
        <div className="ff-orders-screen-main">
          {/* Toolbar */}
          <div className="ff-admin-toolbar">
            <AdminSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar pedido, cliente ou mesa..."
              className="ff-admin-search--orders"
            />
            <AdminFilterBar options={filterOptions} value={filter} onChange={setFilter} />
          </div>

          {/* Table */}
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
              emptyTitle="Nenhum pedido encontrado"
              emptyMessage="Nenhum pedido corresponde aos filtros selecionados."
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
