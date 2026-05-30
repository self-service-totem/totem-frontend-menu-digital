import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { waiterStaffService } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import type { DbTable, WaiterCall } from '@/lib/types';

const STATUS_LABEL: Record<string, string> = {
  EMPTY: 'Vazia',
  OCCUPIED: 'Ocupada',
  ORDER_IN_PROGRESS: 'Pedido em andamento',
  WAITING_FOR_KITCHEN: 'Aguardando cozinha',
  READY_TO_SERVE: 'Pronto para servir',
  WAITING_FOR_PAYMENT: 'Aguardando pagamento',
  CLOSED: 'Fechada',
};

const STATUS_COLOR: Record<string, string> = {
  EMPTY: '#6b7280',
  OCCUPIED: '#0284c7',
  ORDER_IN_PROGRESS: '#059669',
  WAITING_FOR_KITCHEN: '#d97706',
  READY_TO_SERVE: '#22c55e',
  WAITING_FOR_PAYMENT: '#7c3aed',
  CLOSED: '#374151',
};

export function WaiterTablesPage() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [calls, setCalls] = useState<WaiterCall[]>([]);
  const [activeTab, setActiveTab] = useState<'tables' | 'calls'>('tables');
  const notify = useNotify();
  const navigate = useNavigate();

  async function load() {
    const [t, c] = await Promise.all([
      waiterStaffService.listTables(),
      waiterStaffService.listCalls(),
    ]);
    setTables(t);
    setCalls(c);
  }

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

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

  async function handleRequestBill(tableId: string, tableNum: string) {
    await waiterStaffService.requestBill(tableId);
    notify(`Mesa ${tableNum} — conta solicitada para o caixa`);
    load();
  }

  const pendingCalls = calls.filter((c) => c.status === 'PENDING' || c.status === 'ACKNOWLEDGED');

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-person-badge me-2" />Garçom
        </div>
        <nav className="ff-area-sidebar-nav">
          <button className={`ff-nav-item ${activeTab === 'tables' ? 'active' : ''}`} onClick={() => setActiveTab('tables')}>
            <i className="bi bi-grid-3x3-gap" />Mesas
          </button>
          <button className={`ff-nav-item ${activeTab === 'calls' ? 'active' : ''}`} onClick={() => setActiveTab('calls')}>
            <i className="bi bi-bell" />Chamados
            {pendingCalls.length > 0 && (
              <span className="badge bg-danger ms-auto">{pendingCalls.length}</span>
            )}
          </button>
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">
            {activeTab === 'tables' ? 'Mesas' : 'Chamados de Garçom'}
          </span>
          <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={load}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>

        <div className="ff-area-content">
          {activeTab === 'tables' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                gap: 16,
              }}
            >
              {tables.map((table) => (
                <div
                  key={table.id}
                  className="ff-metric-card"
                  style={{ borderLeft: `4px solid ${STATUS_COLOR[table.status]}`, cursor: 'pointer' }}
                  onClick={() => navigate(`/waiter-staff/tables/${table.id}`)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 20 }}>Mesa {table.number}</span>
                    <span
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        background: STATUS_COLOR[table.status],
                        display: 'inline-block',
                      }}
                    />
                  </div>
                  <div style={{ fontSize: 12, color: STATUS_COLOR[table.status], fontWeight: 600 }}>
                    {STATUS_LABEL[table.status]}
                  </div>
                  {(table.status === 'OCCUPIED' || table.status === 'ORDER_IN_PROGRESS') && (
                    <button
                      className="btn btn-sm btn-outline-primary mt-2 w-100"
                      onClick={(e) => { e.stopPropagation(); handleRequestBill(table.id, table.number); }}
                    >
                      <i className="bi bi-receipt me-1" />Pedir conta
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {activeTab === 'calls' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, maxWidth: 600 }}>
              {calls.length === 0 && (
                <div className="text-center text-muted py-4">Nenhum chamado</div>
              )}
              {calls.map((call) => (
                <div key={call.id} className="ff-data-card" style={{ opacity: call.status === 'RESOLVED' ? 0.5 : 1 }}>
                  <div className="ff-data-card-header">
                    <span>
                      <i className="bi bi-geo-alt me-2" />Mesa {call.tableNumber}
                      {' · '}
                      <span style={{ fontSize: 14, fontWeight: 400 }}>{call.customerName}</span>
                    </span>
                    <span
                      className={`badge ${
                        call.status === 'PENDING'
                          ? 'bg-danger'
                          : call.status === 'ACKNOWLEDGED'
                          ? 'bg-warning text-dark'
                          : 'bg-secondary'
                      }`}
                    >
                      {call.status === 'PENDING' ? 'Pendente' : call.status === 'ACKNOWLEDGED' ? 'Reconhecido' : 'Resolvido'}
                    </span>
                  </div>
                  {call.status !== 'RESOLVED' && (
                    <div style={{ padding: '10px 20px', display: 'flex', gap: 8 }}>
                      {call.status === 'PENDING' && (
                        <button className="btn btn-sm btn-outline-warning" onClick={() => handleAck(call.id)}>
                          Reconhecer
                        </button>
                      )}
                      <button className="btn btn-sm btn-success" onClick={() => handleResolve(call.id)}>
                        Resolver
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
