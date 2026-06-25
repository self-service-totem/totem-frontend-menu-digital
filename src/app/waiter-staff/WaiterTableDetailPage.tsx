import { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import { waiterStaffService } from '@/lib/services/waiterStaffService';
import { useNotify } from '@/lib/notifications';
import { getTableStatusUI } from '@/lib/utils/tableStatusUI';
import { useElapsed, elapsedMins, fmtElapsed, ageSeverity } from '@/lib/utils/useElapsed';
import type { DbTable, DbOrder, WaiterCall } from '@/lib/types';
import { findById } from '@/lib/mock-db';
import { formatCurrency as formatBRL } from '@/utils/format';

function initials(name: string): string {
  return name.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase();
}

// ─── Order status maps ─────────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<string, string> = {
  SENT_TO_KITCHEN: 'Aguardando cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto para servir',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
  CREATED:         'Criado',
  DRAFT:           'Rascunho',
};

const ORDER_STATUS_COLOR: Record<string, { color: string; bg: string }> = {
  SENT_TO_KITCHEN: { color: '#d97706', bg: '#fffbeb' },
  PREPARING:       { color: '#7c3aed', bg: '#f5f3ff' },
  READY:           { color: '#059669', bg: '#f0fdf4' },
  DELIVERED:       { color: '#0284c7', bg: '#eff6ff' },
  CLOSED:          { color: '#6b7280', bg: '#f9fafb' },
  CANCELED:        { color: '#dc2626', bg: '#fef2f2' },
  CREATED:         { color: '#374151', bg: '#f9fafb' },
  DRAFT:           { color: '#9ca3af', bg: '#f9fafb' },
};

// ─── Premium metric card ───────────────────────────────────────────────────────

interface MetricPillProps {
  icon: string;
  label: string;
  value: string | number;
  color?: string;
  bg?: string;
}

function MetricPill({ icon, label, value, color, bg }: MetricPillProps) {
  const effectiveColor = color ?? '#6b7280';
  const iconBg = bg ?? (color ? `${color}18` : '#f3f4f6');
  return (
    <div className="ff-waiter-metric">
      <div className="ff-waiter-metric-top">
        <span className="ff-waiter-metric-label">{label}</span>
        <div className="ff-waiter-metric-icon" style={{ background: iconBg }}>
          <i className={`bi ${icon}`} style={{ color: effectiveColor }} />
        </div>
      </div>
      <span className="ff-waiter-metric-value" style={{ color: effectiveColor }}>
        {value}
      </span>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export function WaiterTableDetailPage() {
  const { lang, setLang } = useAdminLanguage();
  const { tableId } = useParams<{ tableId: string }>();
  const navigate    = useNavigate();
  const notify      = useNotify();
  useElapsed(30_000);

  const [table,      setTable]      = useState<DbTable | null>(null);
  const [orders,     setOrders]     = useState<DbOrder[]>([]);
  const [calls,      setCalls]      = useState<WaiterCall[]>([]);
  const [requesting, setRequesting] = useState(false);
  const [serving,    setServing]    = useState(false);

  const load = useCallback(async () => {
    if (!tableId) return;
    const [tableOrders, allCalls] = await Promise.all([
      waiterStaffService.getTableOrders(tableId),
      waiterStaffService.listCalls(),
    ]);
    setTable(findById<DbTable>('tables', tableId) ?? null);
    setOrders(tableOrders);
    setCalls(allCalls.filter((c) => c.tableId === tableId && c.status !== 'RESOLVED' && c.status !== 'CANCELED'));
  }, [tableId]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, [load]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  async function handleAck(id: string) {
    await waiterStaffService.acknowledgeCall(id);
    notify('Chamado reconhecido', 'info');
    load();
  }

  async function handleResolve(id: string) {
    await waiterStaffService.resolveCall(id);
    notify('Chamado resolvido');
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

  async function handleMarkServed() {
    if (!tableId) return;
    setServing(true);
    try {
      await waiterStaffService.markServed(tableId);
      notify(`Mesa ${table?.number} — pedido entregue`);
      load();
    } finally {
      setServing(false);
    }
  }

  // ── Derived ───────────────────────────────────────────────────────────────────

  const unpaidTotal = orders
    .filter((o) => o.paymentStatus === 'UNPAID')
    .reduce((s, o) => s + o.total, 0);

  const hasReadyOrders  = orders.some((o) => o.status === 'READY');
  const canRequestBill  = orders.some((o) => o.paymentStatus === 'UNPAID') && table?.status !== 'WAITING_FOR_PAYMENT' && table?.status !== 'CLOSED';
  const pendingCalls    = calls.filter((c) => c.status === 'PENDING');

  const primaryAction = calls.length > 0
    ? null
    : hasReadyOrders
    ? { label: 'Entregar pedido', icon: 'bi-check2-circle', color: '#059669', bg: '#f0fdf4', action: handleMarkServed, loading: serving }
    : canRequestBill
    ? { label: 'Pedir conta',     icon: 'bi-receipt',        color: '#1d4ed8', bg: '#eff6ff', action: handleRequestBill, loading: requesting }
    : null;

  // ── Not found ─────────────────────────────────────────────────────────────────

  if (!table) {
    return (
      <I18nProvider language={lang}>
        <div className="ff-area-layout">
          <div className="ff-area-main" style={{ justifyContent: 'center', alignItems: 'center' }}>
            <div className="text-muted">Mesa não encontrada.</div>
          </div>
        </div>
      </I18nProvider>
    );
  }

  const ui = getTableStatusUI(table.status);
  const statusColor = calls.length > 0 ? '#dc2626' : ui.color;
  const statusBg    = calls.length > 0 ? '#fef2f2' : ui.bgColor;
  const statusIcon  = calls.length > 0 ? 'bi-megaphone-fill' : ui.icon;
  const statusLabel = calls.length > 0 ? 'Chamando garçom' : ui.label;

  return (
    <I18nProvider language={lang}>
    <div className="ff-area-layout">
      {/* Sidebar */}
      <aside className="ff-area-sidebar ff-area-sidebar--mobile-bottom">
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

      <div className="ff-area-main ff-area-main--mobile-bottom-pad">
        {/* Header */}
        <div className="ff-area-topbar" style={{ gap: 16, paddingTop: 8, paddingBottom: 8, height: 'auto', minHeight: 56 }}>
          {/* Back button (desktop — sidebar handles mobile) */}
          <button
            className="btn btn-sm btn-outline-secondary d-none d-md-flex"
            style={{ padding: '5px 10px', borderRadius: 8, alignItems: 'center', gap: 4, flexShrink: 0 }}
            onClick={() => navigate('/waiter-staff/tables')}
          >
            <i className="bi bi-arrow-left" style={{ fontSize: '0.8rem' }} />
          </button>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 5, flex: 1, minWidth: 0 }}>
            {/* Table number + status */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span style={{ fontSize: '1.5rem', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em', lineHeight: 1 }}>
                Mesa {table.number}
              </span>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                background: statusBg,
                color: statusColor,
                border: `1px solid ${statusColor}28`,
                borderRadius: 20, padding: '3px 11px', fontSize: '0.78rem', fontWeight: 700,
              }}>
                <i className={`bi ${statusIcon}`} style={{ fontSize: '0.75rem' }} />
                {statusLabel}
              </span>
            </div>

            {/* Zone · Waiter · Pax */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              {table.zoneName && (
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-geo-alt" style={{ fontSize: '0.72rem' }} />{table.zoneName}
                </span>
              )}
              {table.assignedWaiterName && (
                <span style={{ fontSize: '0.78rem', color: '#6b7280', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ background: '#e0e7ff', color: '#4338ca', borderRadius: '50%', width: 18, height: 18, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.55rem', fontWeight: 800 }}>
                    {initials(table.assignedWaiterName)}
                  </span>
                  {table.assignedWaiterName}
                </span>
              )}
              {(table.guestCount ?? 0) > 0 && (
                <span style={{ fontSize: '0.78rem', color: '#9ca3af', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <i className="bi bi-people" style={{ fontSize: '0.72rem' }} />{table.guestCount} pessoas
                </span>
              )}
            </div>
          </div>

          <div className="d-flex gap-2 align-items-center flex-shrink-0">
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 8, padding: '6px 10px' }}
              onClick={load}
              title="Atualizar"
            >
              <i className="bi bi-arrow-clockwise" />
            </button>
            {primaryAction && (
              <button
                className="btn btn-sm ff-waiter-btn-action"
                style={{
                  background: primaryAction.color,
                  color: '#fff',
                  border: 'none',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  padding: '7px 18px',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
                onClick={primaryAction.action}
                disabled={primaryAction.loading}
              >
                <i className={`bi ${primaryAction.icon}`} />
                {primaryAction.label}
              </button>
            )}
            <AdminLanguageSelector language={lang} onChange={setLang} />
          </div>
        </div>

        <div className="ff-area-content" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* Metric strip */}
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <MetricPill
              icon="bi-receipt"
              label="Pedidos"
              value={orders.length}
              color="#374151"
              bg="#f3f4f6"
            />
            <MetricPill
              icon="bi-currency-dollar"
              label="Total a pagar"
              value={formatBRL(unpaidTotal)}
              color={unpaidTotal > 0 ? '#7c3aed' : '#9ca3af'}
              bg={unpaidTotal > 0 ? '#f5f3ff' : '#f3f4f6'}
            />
            <MetricPill
              icon="bi-megaphone-fill"
              label="Chamados"
              value={calls.length}
              color={calls.length > 0 ? '#dc2626' : '#9ca3af'}
              bg={calls.length > 0 ? '#fef2f2' : '#f3f4f6'}
            />
            {(table.guestCount ?? 0) > 0 && (
              <MetricPill
                icon="bi-people-fill"
                label="Pessoas"
                value={table.guestCount!}
                color="#0284c7"
                bg="#eff6ff"
              />
            )}
          </div>

          {/* Waiter calls section */}
          {calls.length > 0 && (
            <div style={{ background: '#fff', border: '1.5px solid #fecaca', borderLeft: '4px solid #dc2626', borderRadius: 14, overflow: 'hidden', boxShadow: '0 1px 6px rgba(220,38,38,.10)' }}>
              <div style={{ background: 'linear-gradient(135deg, #fef2f2 0%, #fff5f5 100%)', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: '1px solid #fecaca' }}>
                <div style={{ width: 32, height: 32, borderRadius: 9, background: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <i className="bi bi-megaphone-fill" style={{ color: '#fff', fontSize: '0.85rem' }} />
                </div>
                <span style={{ fontWeight: 800, color: '#dc2626', fontSize: '0.92rem', flex: 1 }}>
                  {calls.length === 1 ? '1 chamado pendente' : `${calls.length} chamados pendentes`}
                </span>
                <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
                  {pendingCalls.length} pendente{pendingCalls.length !== 1 ? 's' : ''}
                </span>
              </div>
              <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {calls.map((call) => {
                  const isPending   = call.status === 'PENDING';
                  const mins        = elapsedMins(call.createdAt);
                  const sev         = ageSeverity(mins, 3, 7);
                  const timerColors = { ok: '#059669', warn: '#d97706', critical: '#dc2626' };
                  return (
                    <div key={call.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: isPending ? '#fef9f9' : '#fafafa', borderRadius: 10, border: `1px solid ${isPending ? '#fecaca' : '#f3f4f6'}` }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#111827' }}>
                          {call.customerName || 'Cliente'}
                        </div>
                        {call.reason && (
                          <div style={{ fontSize: '0.78rem', color: '#6b7280', marginTop: 2 }}>
                            {call.reason === 'call' ? 'Chamar garçom' : call.reason === 'bill' ? 'Pedir a conta' : call.reason === 'order' ? 'Ver pedidos' : 'Outro motivo'}
                          </div>
                        )}
                      </div>
                      <span style={{ fontSize: '0.73rem', fontWeight: 800, color: '#fff', background: timerColors[sev], borderRadius: 20, padding: '2px 10px', flexShrink: 0 }}>
                        {fmtElapsed(mins)}
                      </span>
                      <span style={{
                        fontSize: '0.66rem', fontWeight: 800,
                        color: isPending ? '#991b1b' : '#92400e',
                        background: isPending ? '#fee2e2' : '#fef3c7',
                        border: `1px solid ${isPending ? '#fca5a5' : '#fde68a'}`,
                        borderRadius: 20, padding: '2px 9px', flexShrink: 0,
                      }}>
                        {isPending ? 'PENDENTE' : 'RECONHECIDO'}
                      </span>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        {isPending && (
                          <button className="btn btn-sm btn-outline-warning ff-waiter-btn-action" style={{ fontSize: '0.78rem', minHeight: 34, padding: '4px 10px', borderRadius: 7 }} onClick={() => handleAck(call.id)}>
                            Reconhecer
                          </button>
                        )}
                        <button className="btn btn-sm btn-success ff-waiter-btn-action" style={{ fontSize: '0.78rem', minHeight: 34, padding: '4px 10px', fontWeight: 700, borderRadius: 7 }} onClick={() => handleResolve(call.id)}>
                          <i className="bi bi-check2 me-1" />Resolver
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Orders */}
          {orders.length === 0 ? (
            <div className="ff-empty-state" style={{ paddingTop: 40 }}>
              <i className="bi bi-receipt ff-empty-state-icon" />
              <span className="ff-empty-state-title">Nenhum pedido ativo</span>
              <span className="ff-empty-state-desc">Os pedidos desta mesa aparecerão aqui.</span>
            </div>
          ) : (
            orders.map((order) => {
              const statusStyle = ORDER_STATUS_COLOR[order.status] ?? { color: '#6b7280', bg: '#f9fafb' };
              const isReady     = order.status === 'READY';
              return (
                <div key={order.id} style={{ background: '#fff', border: `1.5px solid ${isReady ? '#bbf7d0' : '#e5e7eb'}`, borderLeft: `4px solid ${isReady ? '#059669' : '#e5e7eb'}`, borderRadius: 14, overflow: 'hidden', boxShadow: isReady ? '0 1px 6px rgba(5,150,105,.08)' : '0 1px 4px rgba(0,0,0,.04)' }}>
                  {/* Order header */}
                  <div style={{ padding: '13px 18px', borderBottom: '1px solid #f3f4f6', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{ fontWeight: 800, fontSize: '1rem', color: '#111827' }}>{order.orderNumber}</span>
                    <span style={{ fontSize: '0.83rem', color: '#6b7280', flex: 1, minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {order.customerName}
                    </span>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: statusStyle.bg, color: statusStyle.color, border: `1px solid ${statusStyle.color}30`, borderRadius: 20, padding: '3px 10px', fontSize: '0.72rem', fontWeight: 700, flexShrink: 0 }}>
                      {ORDER_STATUS_LABEL[order.status] ?? order.status}
                    </span>
                  </div>

                  {/* Items — receipt style */}
                  <div style={{ padding: '13px 18px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 14 }}>
                      {order.items.map((item, i) => (
                        <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          <span style={{ background: '#f3f4f6', color: '#374151', borderRadius: 6, padding: '2px 8px', fontSize: '0.8rem', fontWeight: 800, flexShrink: 0, minWidth: 32, textAlign: 'center' }}>
                            {item.quantity}×
                          </span>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: 600, color: '#1a1a1a', lineHeight: 1.3 }}>{item.name}</div>
                            {item.customerName && (
                              <div style={{ fontSize: '0.73rem', color: '#60a5fa', marginTop: 2 }}>{item.customerName}</div>
                            )}
                            {item.note && (
                              <div style={{ fontSize: '0.73rem', color: '#d97706', marginTop: 2 }}>— {item.note}</div>
                            )}
                          </div>
                          <span style={{ fontSize: '0.86rem', fontWeight: 600, color: '#374151', flexShrink: 0 }}>
                            {formatBRL(item.unitPrice * item.quantity)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Total row */}
                    <div style={{ borderTop: '1.5px solid #e5e7eb', paddingTop: 11, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      {order.serviceFee > 0 && (
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', color: '#9ca3af' }}>
                          <span>Serviço (10%)</span>
                          <span>{formatBRL(order.serviceFee)}</span>
                        </div>
                      )}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '1rem', fontWeight: 800, color: '#111827' }}>
                        <span>Total</span>
                        <span>{formatBRL(order.total)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', marginTop: 2 }}>
                        <span style={{ color: '#9ca3af' }}>Pagamento</span>
                        <span style={{ fontWeight: 700, color: order.paymentStatus === 'PAID' ? '#059669' : order.paymentStatus === 'PARTIALLY_PAID' ? '#d97706' : '#6b7280' }}>
                          {order.paymentStatus === 'PAID' ? '✓ Pago' : order.paymentStatus === 'PARTIALLY_PAID' ? '◑ Parcial' : '○ Pendente'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}

          {/* Footer actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {hasReadyOrders && (
              <button
                className="btn ff-waiter-btn-action"
                style={{ background: '#059669', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', padding: '13px', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleMarkServed}
                disabled={serving}
              >
                <i className="bi bi-check2-circle" />
                {serving ? 'Registrando...' : 'Marcar como entregue'}
              </button>
            )}
            {canRequestBill && (
              <button
                className="btn ff-waiter-btn-action"
                style={{ background: '#1d4ed8', color: '#fff', border: 'none', fontWeight: 700, fontSize: '0.95rem', padding: '13px', borderRadius: 11, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                onClick={handleRequestBill}
                disabled={requesting}
              >
                <i className="bi bi-receipt" />
                {requesting ? 'Solicitando...' : 'Solicitar conta ao caixa'}
              </button>
            )}
          </div>

        </div>
      </div>
    </div>
    </I18nProvider>
  );
}
