import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { deliveryService } from '@/lib/services/deliveryService';
import { useNotify } from '@/lib/notifications';
import type { DeliveryOrder } from '@/lib/types';
import { aggregatorService } from '@/lib/services/aggregatorService';

const STATUS_LABEL: Record<DeliveryOrder['status'], string> = {
  PENDING: 'Pendente', ACCEPTED: 'Aceito', PREPARING: 'Preparando',
  OUT_FOR_DELIVERY: 'Saiu para entrega', DELIVERED: 'Entregue', CANCELED: 'Cancelado',
};
const STATUS_COLOR: Record<DeliveryOrder['status'], string> = {
  PENDING: '#d97706', ACCEPTED: '#0284c7', PREPARING: '#7c3aed',
  OUT_FOR_DELIVERY: '#059669', DELIVERED: '#6b7280', CANCELED: '#dc2626',
};

export function DeliveryPage() {
  const [deliveries, setDeliveries] = useState<DeliveryOrder[]>([]);
  const notify = useNotify();
  const navigate = useNavigate();

  async function load() {
    setDeliveries(await deliveryService.listDeliveries());
  }

  useEffect(() => {
    load();
    const i = setInterval(load, 5000);
    return () => clearInterval(i);
  }, []);

  async function handleUpdate(id: string, status: DeliveryOrder['status']) {
    await deliveryService.updateDeliveryStatus(id, status);
    notify(`Entrega → ${STATUS_LABEL[status]}`);
    load();
  }

  async function handleSimulateIfood() {
    await aggregatorService.simulateIncomingOrder('IFOOD');
    notify('✅ Pedido iFood recebido na Cozinha!');
  }

  async function handleSimulateRappi() {
    await aggregatorService.simulateIncomingOrder('RAPPI');
    notify('✅ Pedido Rappi recebido na Cozinha!');
  }

  const active = deliveries.filter((d) => d.status !== 'DELIVERED' && d.status !== 'CANCELED');
  const done = deliveries.filter((d) => d.status === 'DELIVERED' || d.status === 'CANCELED');

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo"><i className="bi bi-bicycle me-2" />Delivery</div>
        <nav className="ff-area-sidebar-nav">
          <button className="ff-nav-item active"><i className="bi bi-list-check" />Entregas</button>
          <button className="ff-nav-item" onClick={() => navigate('/admin/dashboard')}><i className="bi bi-grid-1x2" />Admin</button>
          <button className="ff-nav-item" onClick={() => navigate('/')}><i className="bi bi-house" />Hub</button>
        </nav>

        {/* F10: Aggregator simulation */}
        <div style={{ padding: '12px 16px', borderTop: '1px solid rgba(255,255,255,.1)', marginTop: 'auto' }}>
          <div style={{ fontSize: 12, color: '#6b7280', marginBottom: 8, fontWeight: 600 }}>Simular pedido</div>
          <button className="btn btn-sm w-100 mb-1" style={{ background: '#ea1d2c', color: '#fff' }} onClick={handleSimulateIfood}>
            iFood
          </button>
          <button className="btn btn-sm w-100" style={{ background: '#ff441f', color: '#fff' }} onClick={handleSimulateRappi}>
            Rappi
          </button>
        </div>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">Gestão de Entregas</span>
          <span className="badge bg-warning text-dark ms-2">{active.length} ativas</span>
          <button className="btn btn-sm btn-outline-secondary ms-auto" onClick={load}>
            <i className="bi bi-arrow-clockwise" />
          </button>
        </div>

        <div className="ff-area-content">
          {active.length === 0 && done.length === 0 && (
            <div className="text-muted text-center py-8">
              <i className="bi bi-bicycle" style={{ fontSize: 40, display: 'block', marginBottom: 8 }} />
              Nenhuma entrega ativa. Use a Cozinha para marcar pedidos de delivery como enviados.
            </div>
          )}

          {active.map((d) => (
            <div key={d.id} className="ff-data-card mb-3">
              <div className="ff-data-card-header">
                <div>
                  <span style={{ fontWeight: 700 }}>Entrega #{d.id.slice(-6)}</span>
                  <span className="badge ms-2" style={{ background: STATUS_COLOR[d.status], color: '#fff', fontSize: 11 }}>
                    {STATUS_LABEL[d.status]}
                  </span>
                </div>
                <span style={{ color: '#059669', fontWeight: 700 }}>~{d.estimatedMinutes} min</span>
              </div>
              <div style={{ padding: '12px 20px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ fontSize: 14 }}>
                  <i className="bi bi-geo-alt me-1 text-danger" />
                  {d.address.street}, {d.address.number}
                  {d.address.complement && `, ${d.address.complement}`} — {d.address.neighborhood}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {d.status === 'ACCEPTED' && (
                    <button className="btn btn-sm btn-primary" onClick={() => handleUpdate(d.id, 'OUT_FOR_DELIVERY')}>
                      <i className="bi bi-bicycle me-1" />Saiu para entrega
                    </button>
                  )}
                  {d.status === 'OUT_FOR_DELIVERY' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleUpdate(d.id, 'DELIVERED')}>
                      <i className="bi bi-check-circle me-1" />Entregue
                    </button>
                  )}
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleUpdate(d.id, 'CANCELED')}>
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          ))}

          {done.length > 0 && (
            <details style={{ marginTop: 16 }}>
              <summary style={{ cursor: 'pointer', fontSize: 14, color: '#6b7280', marginBottom: 8 }}>
                Entregas concluídas ({done.length})
              </summary>
              {done.map((d) => (
                <div key={d.id} style={{ opacity: 0.6, marginBottom: 8 }} className="ff-data-card">
                  <div className="ff-data-card-header">
                    <span>#{d.id.slice(-6)} — {d.address.street}, {d.address.number}</span>
                    <span className="badge" style={{ background: STATUS_COLOR[d.status], color: '#fff', fontSize: 11 }}>
                      {STATUS_LABEL[d.status]}
                    </span>
                  </div>
                </div>
              ))}
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
