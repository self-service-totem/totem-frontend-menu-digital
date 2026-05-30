import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { waiterStaffService } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import type { DbTable, DbOrder, WaiterCall } from '@/lib/types';
import { findById } from '@/lib/mock-db';

function formatBRL(v: number | undefined | null) {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const ORDER_STATUS_LABEL: Record<string, string> = {
  SENT_TO_KITCHEN: 'Aguardando cozinha',
  PREPARING: 'Preparando',
  READY: 'Pronto para servir',
  DELIVERED: 'Entregue',
  CLOSED: 'Encerrado',
  CANCELED: 'Cancelado',
  CREATED: 'Criado',
  DRAFT: 'Rascunho',
};

const ORDER_STATUS_COLOR: Record<string, string> = {
  SENT_TO_KITCHEN: '#d97706',
  PREPARING: '#7c3aed',
  READY: '#059669',
  DELIVERED: '#0284c7',
  CLOSED: '#6b7280',
  CANCELED: '#dc2626',
  CREATED: '#374151',
  DRAFT: '#9ca3af',
};

const TABLE_STATUS_LABEL: Record<string, string> = {
  EMPTY: 'Vazia',
  OCCUPIED: 'Ocupada',
  ORDER_IN_PROGRESS: 'Pedido em andamento',
  WAITING_FOR_KITCHEN: 'Aguardando cozinha',
  READY_TO_SERVE: 'Pronto para servir',
  WAITING_FOR_PAYMENT: 'Aguardando pagamento',
  CLOSED: 'Fechada',
};

const TABLE_STATUS_COLOR: Record<string, string> = {
  EMPTY: '#6b7280',
  OCCUPIED: '#0284c7',
  ORDER_IN_PROGRESS: '#059669',
  WAITING_FOR_KITCHEN: '#d97706',
  READY_TO_SERVE: '#22c55e',
  WAITING_FOR_PAYMENT: '#7c3aed',
  CLOSED: '#374151',
};

export function WaiterTableDetailPage() {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const [table, setTable] = useState<DbTable | null>(null);
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [requesting, setRequesting] = useState(false);

  const load = useCallback(async () => {
    if (!tableId) return;
    const [tableOrders, allCalls] = await Promise.all([
      waiterStaffService.getTableOrders(tableId),
      waiterStaffService.listCalls(),
    ]);
    const dbTable = findById<DbTable>('tables', tableId);
    setTable(dbTable);
    setOrders(tableOrders);
    setCalls(allCalls.filter((c) => c.tableId === tableId && c.status !== 'RESOLVED' && c.status !== 'CANCELED'));
  }, [tableId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  async function handleAck(id: string) {
    await waiterStaffService.acknowledgeCall(id);
    notify('Chamado reconhecido', 'info');
    load();
  }

  async function handleResolve(id: string) {
    await waiterStaffService.resolveCall(id);
    notify('Chamado resolvido ✅');
    load();
  }

  async function handleRequestBill() {
    if (!tableId) return;
    setRequesting(true);
    try {
      await waiterStaffService.requestBill(tableId);
      notify('Conta solicitada — mesa enviada ao caixa');
      load();
    } finally {
      setRequesting(false);
    }
  }

  const unpaidTotal = orders
    .filter((o) => o.paymentStatus === 'UNPAID')
    .reduce((s, o) => s + o.total, 0);

  const canRequestBill =
    orders.some((o) => o.paymentStatus === 'UNPAID') &&
    table?.status !== 'WAITING_FOR_PAYMENT' &&
    table?.status !== 'CLOSED';

  if (!table) {
    return (
      <div className="ff-area-layout">
        <div className="ff-area-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
          <div className="text-muted">Mesa não encontrada.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-person-badge me-2" />Garçom
        </div>
        <nav className="ff-area-sidebar-nav">
          <button className="ff-nav-item" onClick={() => navigate('/waiter-staff/tables')}>
            <i className="bi bi-arrow-left" />Voltar às mesas
          </button>
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        {/* Header */}
        <div className="ff-area-topbar">
          <div>
            <span className="ff-area-topbar-title">Mesa {table.number}</span>
            <span
              className="ms-3 badge"
              style={{ background: TABLE_STATUS_COLOR[table.status] ?? '#6b7280', color: '#fff', fontSize: 12 }}
            >
              {TABLE_STATUS_LABEL[table.status] ?? table.status}
            </span>
          </div>
          <div className="ms-auto d-flex gap-2">
            <button className="btn btn-sm btn-outline-secondary" onClick={load}>
              <i className="bi bi-arrow-clockwise" />
            </button>
            {canRequestBill && (
              <button
                className="btn btn-sm btn-primary"
                onClick={handleRequestBill}
                disabled={requesting}
              >
                <i className="bi bi-receipt me-1" />Pedir conta
              </button>
            )}
          </div>
        </div>

        <div className="ff-area-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Waiter calls */}
          {calls.length > 0 && (
            <div className="ff-data-card" style={{ borderLeft: '4px solid #ef4444' }}>
              <div className="ff-data-card-header" style={{ color: '#dc2626' }}>
                <i className="bi bi-bell-fill me-2" />Chamados pendentes ({calls.length})
              </div>
              <div style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                {calls.map((call) => (
                  <div key={call.id} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ flex: 1 }}>
                      <span style={{ fontWeight: 600 }}>{call.customerName || '—'}</span>
                      {call.phone && <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 8 }}>{call.phone}</span>}
                      <span
                        className={`badge ms-2 ${call.status === 'PENDING' ? 'bg-danger' : 'bg-warning text-dark'}`}
                        style={{ fontSize: 11 }}
                      >
                        {call.status === 'PENDING' ? 'Pendente' : 'Reconhecido'}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {call.status === 'PENDING' && (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleAck(call.id)}>
                          Reconhecer
                        </button>
                      )}
                      <button className="btn btn-sm btn-success" onClick={() => handleResolve(call.id)}>
                        Resolver
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Orders summary */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14 }}>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Pedidos ativos</div>
              <div className="ff-metric-card-value">{orders.length}</div>
            </div>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Total a pagar</div>
              <div className="ff-metric-card-value" style={{ color: '#e11d2a', fontSize: 20 }}>
                {formatBRL(unpaidTotal)}
              </div>
            </div>
            <div className="ff-metric-card">
              <div className="ff-metric-card-label">Chamados</div>
              <div className="ff-metric-card-value" style={{ color: calls.length > 0 ? '#dc2626' : '#059669' }}>
                {calls.length}
              </div>
            </div>
          </div>

          {/* Orders list */}
          {orders.length === 0 ? (
            <div className="text-muted text-center py-4">Nenhum pedido ativo para esta mesa.</div>
          ) : (
            orders.map((order) => (
              <div key={order.id} className="ff-data-card">
                <div className="ff-data-card-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <strong>{order.orderNumber}</strong>
                    <span style={{ color: '#6b7280', fontSize: 13 }}>{order.customerName}</span>
                    <span
                      className="badge ms-1"
                      style={{ background: ORDER_STATUS_COLOR[order.status] ?? '#6b7280', color: '#fff', fontSize: 11 }}
                    >
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>
                  <span style={{ fontWeight: 700 }}>{formatBRL(order.total)}</span>
                </div>
                <div style={{ padding: '10px 20px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {order.items.map((item, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                      <span>
                        <strong>{item.quantity}×</strong> {item.name}
                        {item.customerName && (
                          <span style={{ color: '#6b7280', fontSize: 12, marginLeft: 6 }}>({item.customerName})</span>
                        )}
                        {item.note && <span style={{ color: '#d97706', fontSize: 12, marginLeft: 6 }}>— {item.note}</span>}
                      </span>
                      <span style={{ color: '#6b7280' }}>{formatBRL(item.unitPrice * item.quantity)}</span>
                    </div>
                  ))}
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid #e5e7eb', paddingTop: 8, marginTop: 4, fontWeight: 700 }}>
                    <span>Total</span>
                    <span>{formatBRL(order.total)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: order.paymentStatus === 'PAID' ? '#059669' : '#6b7280' }}>
                    <span>Pagamento</span>
                    <span>
                      {order.paymentStatus === 'PAID' ? '✅ Pago' : order.paymentStatus === 'PARTIALLY_PAID' ? '⚠ Parcial' : '⏳ Pendente'}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
