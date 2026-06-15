import { useEffect, useState } from 'react';
import { getCollection } from '@/lib/mock-db';
import type { DbOrder, DbProduct } from '@/lib/types';
import { formatBRL } from '../adminUtils';
import { AdminPageHeader, AdminMetricCard, AdminEmptyState } from '@/components/admin';

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

function calcDelta(today: number, yesterday: number): { pct: number; up: boolean } | null {
  if (yesterday === 0) return null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

const STATUS_FEED_COLOR: Record<string, string> = {
  SENT_TO_KITCHEN: '#1d4ed8',
  PREPARING:       '#d97706',
  READY:           '#059669',
  DELIVERED:       '#7c3aed',
  CLOSED:          '#374151',
  CANCELED:        '#dc2626',
  CREATED:         '#6b7280',
};

const STATUS_FEED_LABEL: Record<string, string> = {
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
  CREATED:         'Criado',
  DRAFT:           'Rascunho',
};

export function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const orders   = getCollection<DbOrder>('orders');
  const products = getCollection<DbProduct>('products');
  const today = new Date().toISOString().slice(0, 10);
  const yDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const yOrders     = orders.filter((o) => o.createdAt.startsWith(yDate));

  const revenueToday = todayOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);
  const revenueY     = yOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);

  const avgTicket  = todayOrders.length > 0 ? revenueToday / todayOrders.length : 0;
  const avgTicketY = yOrders.length > 0 ? revenueY / yOrders.length : 0;

  const pendingKitchen = getCollection<{ status: string }>('kitchenTickets').filter(
    (t) => t.status === 'NEW' || t.status === 'PREPARING',
  ).length;

  const completedToday = todayOrders.filter(
    (o) => o.status === 'READY' || o.status === 'DELIVERED' || o.status === 'CLOSED',
  );
  const avgPrepMin = completedToday.length > 0
    ? Math.round(completedToday.reduce((s, o) => s + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()), 0) / completedToday.length / 60000)
    : 0;

  const currentHour = new Date().getHours();
  const chartHours  = Array.from({ length: 16 }, (_, i) => i + 7);
  const hourlyMax   = Math.max(
    ...chartHours.map((h) => todayOrders.filter((o) => new Date(o.createdAt).getHours() === h).length),
    1,
  );

  const feed = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  const productCounts: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => { productCounts[i.name] = (productCounts[i.name] ?? 0) + i.quantity; }));
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty, imageUrl: products.find((p) => p.name === name)?.imageUrl }));
  const maxQty = topProducts[0]?.qty ?? 1;

  const deltaOrders  = calcDelta(todayOrders.length, yOrders.length);
  const deltaRevenue = calcDelta(revenueToday, revenueY);
  const deltaTicket  = calcDelta(avgTicket, avgTicketY);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void tick;

  return (
    <div className="ff-dash">
      <AdminPageHeader title="Dashboard" subtitle="Visão geral da operação em tempo real" />

      <div className="ff-admin-metrics-grid">
        <AdminMetricCard
          label="Pedidos hoje"
          value={todayOrders.length}
          icon="bi-receipt"
          color="blue"
          delta={deltaOrders ? `${deltaOrders.pct}%` : undefined}
          deltaDir={deltaOrders ? (deltaOrders.up ? 'up' : 'down') : undefined}
        />
        <AdminMetricCard
          label="Receita hoje"
          value={formatBRL(revenueToday)}
          icon="bi-cash-coin"
          color="green"
          delta={deltaRevenue ? `${deltaRevenue.pct}%` : undefined}
          deltaDir={deltaRevenue ? (deltaRevenue.up ? 'up' : 'down') : undefined}
        />
        <AdminMetricCard
          label="Ticket médio"
          value={formatBRL(avgTicket)}
          icon="bi-graph-up"
          color="purple"
          delta={deltaTicket ? `${deltaTicket.pct}%` : undefined}
          deltaDir={deltaTicket ? (deltaTicket.up ? 'up' : 'down') : undefined}
        />
        <AdminMetricCard
          label="Na cozinha"
          value={pendingKitchen}
          icon="bi-fire"
          color="amber"
        />
        <AdminMetricCard
          label="Tempo médio preparo"
          value={avgPrepMin > 0 ? `${avgPrepMin} min` : '—'}
          icon="bi-clock-history"
          color="slate"
        />
      </div>

      <div className="ff-dash-row">
        <div className="ff-dash-chart">
          <div className="ff-dash-chart-header">
            <span className="ff-dash-chart-title">Pedidos por hora</span>
            <span className="ff-dash-chart-subtitle">Hoje</span>
          </div>
          <div className="ff-dash-chart-bars">
            {chartHours.map((h) => {
              const count = todayOrders.filter((o) => new Date(o.createdAt).getHours() === h).length;
              const heightPct = (count / hourlyMax) * 100;
              const isCurrent = h === currentHour;
              return (
                <div key={h} className={`ff-dash-chart-col${isCurrent ? ' current' : ''}`}>
                  <div
                    className={`ff-dash-chart-bar${count > 0 ? ' has-data' : ''}`}
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  >
                    {count > 0 && <div className="ff-dash-chart-tip">{count} pedido{count !== 1 ? 's' : ''}</div>}
                  </div>
                  <span className="ff-dash-chart-label">{h}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ff-dash-feed">
          <div className="ff-dash-feed-header">
            Atividade
            <div className="ff-dash-feed-live">
              <span className="ff-dash-feed-live-dot" />
              ao vivo
            </div>
          </div>
          {feed.length === 0 ? (
            <AdminEmptyState
              icon="bi-inbox"
              title="Nenhum pedido ainda"
              message="Os pedidos aparecerão aqui em tempo real."
            />
          ) : (
            feed.map((o) => (
              <div key={o.id} className="ff-dash-feed-item">
                <div className="ff-dash-feed-dot" style={{ background: STATUS_FEED_COLOR[o.status] ?? '#9ca3af' }} />
                <div className="ff-dash-feed-text">
                  <div className="ff-dash-feed-main">
                    #{o.orderNumber}
                    {o.tableNumber ? ` · Mesa ${o.tableNumber}` : ''}
                    {' · '}{o.customerName}
                  </div>
                  <div className="ff-dash-feed-sub">
                    {STATUS_FEED_LABEL[o.status] ?? o.status}
                    {' · '}{o.source}
                  </div>
                </div>
                <div className="ff-dash-feed-time">{timeAgo(o.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {topProducts.length > 0 && (
        <div className="ff-dash-top">
          <div className="ff-dash-top-header">Produtos mais vendidos</div>
          {topProducts.map(({ name, qty, imageUrl }, i) => (
            <div key={name} className="ff-dash-top-item">
              <span className={`ff-dash-top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                {i + 1}
              </span>
              {imageUrl
                ? <img src={imageUrl} alt="" className="ff-dash-top-img" />
                : <div className="ff-dash-top-img-ph"><i className="bi bi-box" /></div>
              }
              <div className="ff-dash-top-info">
                <div className="ff-dash-top-name">{name}</div>
                <div className="ff-dash-top-bar-wrap">
                  <div className="ff-dash-top-bar-fill" style={{ width: `${(qty / maxQty) * 100}%` }} />
                </div>
              </div>
              <span className="ff-dash-top-qty">{qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
