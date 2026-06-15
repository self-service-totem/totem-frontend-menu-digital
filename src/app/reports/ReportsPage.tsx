import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  reportService,
  type CloseReport,
  type PaymentMethodSummary,
} from '@/lib/services/reportService';
import { useNotify } from '@/lib/notifications';

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro',
  CARD: 'Cartão',
  PIX: 'PIX',
  EXTERNAL_TERMINAL: 'Terminal',
  UNKNOWN: 'Outros',
};

const METHOD_COLORS: Record<string, string> = {
  PIX: '#3b82f6',
  CARD: '#059669',
  CASH: '#f59e0b',
  EXTERNAL_TERMINAL: '#7c3aed',
  UNKNOWN: '#9ca3af',
};

const WAITER_COLORS = ['#e11d48', '#3b82f6', '#059669', '#d97706', '#7c3aed', '#0891b2'];

// ─── Utilities ────────────────────────────────────────────────────────────────

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayStr(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

function fBRL(v: number | null | undefined): string {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function fBRLShort(v: number): string {
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

function formatDateFull(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
}

function buildDonutGrad(segs: PaymentMethodSummary[]): string {
  if (!segs.length) return 'conic-gradient(#e5e7eb 0% 100%)';
  let cur = 0;
  const stops = segs.map((s) => {
    const from = cur;
    cur += s.pct;
    const color = METHOD_COLORS[s.method] ?? '#9ca3af';
    return `${color} ${from.toFixed(1)}% ${Math.min(cur, 100).toFixed(1)}%`;
  });
  if (cur < 99.5) stops.push(`#e5e7eb ${cur.toFixed(1)}% 100%`);
  return `conic-gradient(${stops.join(', ')})`;
}

function rankClass(i: number): string {
  if (i === 0) return 'ff-rep-bar-rank ff-rep-bar-rank-1';
  if (i === 1) return 'ff-rep-bar-rank ff-rep-bar-rank-2';
  if (i === 2) return 'ff-rep-bar-rank ff-rep-bar-rank-3';
  return 'ff-rep-bar-rank ff-rep-bar-rank-n';
}

// ─── Shared mini-components ───────────────────────────────────────────────────

function SkelBlock({ h = 60 }: { h?: number }) {
  return <div className="ff-rep-skel" style={{ height: h }} />;
}

function CardShell({
  title, subtitle, action, children,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="ff-rep-card">
      <div className="ff-rep-card-header">
        <div>
          <div className="ff-rep-card-title">{title}</div>
          {subtitle && <div className="ff-rep-card-subtitle">{subtitle}</div>}
        </div>
        {action && <div className="ff-rep-card-action">{action}</div>}
      </div>
      <div className="ff-rep-card-body">{children}</div>
    </div>
  );
}

function EmptySection({ icon, text }: { icon: string; text: string }) {
  return (
    <div style={{ padding: '36px 20px', textAlign: 'center', color: '#9ca3af' }}>
      <i className={`bi ${icon}`} style={{ fontSize: 28, display: 'block', marginBottom: 8 }} />
      <div style={{ fontSize: 13 }}>{text}</div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

function ReportSidebar({ navigate }: { navigate: (to: string) => void }) {
  return (
    <aside className="ff-area-sidebar">
      <div className="ff-area-sidebar-logo">
        <div className="ff-area-sidebar-logo-icon">
          <i className="bi bi-bar-chart-line" />
        </div>
        <div className="ff-area-sidebar-logo-text">
          <div className="ff-area-sidebar-logo-name">Relatórios</div>
          <div className="ff-area-sidebar-logo-role">Análise de negócio</div>
        </div>
      </div>
      <nav className="ff-area-sidebar-nav">
        <button className="ff-nav-item active">
          <i className="bi bi-calendar-check" />Dashboard
        </button>
        <button className="ff-nav-item" onClick={() => navigate('/admin/dashboard')}>
          <i className="bi bi-grid-1x2" />Admin
        </button>
        <button className="ff-nav-item" onClick={() => navigate('/')}>
          <i className="bi bi-house" />Hub
        </button>
      </nav>
    </aside>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const [report, setReport] = useState<CloseReport | null>(null);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [productSort, setProductSort] = useState<'revenue' | 'quantity'>('revenue');
  const notify = useNotify();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try {
      setReport(await reportService.getCloseReport(date));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, [date]);

  function handleExport() {
    if (!report) return;
    const csv = reportService.exportCsv(report);
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-${date}.csv`;
    a.click();
    notify('CSV exportado');
  }

  const isToday = date === todayStr();
  const isYesterday = date === yesterdayStr();

  // ── Topbar ─────────────────────────────────────────────────────────────────

  const topbar = (
    <div className="ff-area-topbar" style={{ height: 68 }}>
      <div style={{ lineHeight: 1.3 }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', display: 'flex', alignItems: 'center', gap: 6 }}>
          <i className="bi bi-bar-chart-line" style={{ color: 'var(--ff-primary)', fontSize: 15 }} />
          Dashboard de Relatórios
        </div>
        <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
          {formatDateFull(date)}
        </div>
      </div>

      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          className={`ff-rep-date-btn${isToday ? ' active' : ''}`}
          onClick={() => setDate(todayStr())}
        >Hoje</button>
        <button
          className={`ff-rep-date-btn${isYesterday ? ' active' : ''}`}
          onClick={() => setDate(yesterdayStr())}
        >Ontem</button>
        <input
          type="date"
          className="form-control form-control-sm"
          style={{ width: 140, fontSize: 13 }}
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={load}
          disabled={loading}
          title="Atualizar"
          style={{ width: 32, padding: 0 }}
        >
          <i className={`bi bi-arrow-clockwise${loading ? ' ff-spin' : ''}`} />
        </button>
        <button
          className="btn btn-sm btn-primary"
          onClick={handleExport}
          disabled={!report}
        >
          <i className="bi bi-download me-1" />CSV
        </button>
      </div>
    </div>
  );

  // ── Loading skeleton ────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="ff-area-layout">
        <ReportSidebar navigate={navigate} />
        <div className="ff-area-main">
          {topbar}
          <div className="ff-area-content">
            <div className="ff-rep-content">
              <div className="ff-rep-kpis">
                {[...Array(6)].map((_, i) => <SkelBlock key={i} h={100} />)}
              </div>
              <div className="ff-rep-row ff-rep-row-3-1">
                <SkelBlock h={220} />
                <SkelBlock h={220} />
              </div>
              <div className="ff-rep-row ff-rep-row-2">
                <SkelBlock h={300} />
                <SkelBlock h={300} />
              </div>
              <SkelBlock h={200} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────────

  if (!report || report.totalOrders === 0) {
    return (
      <div className="ff-area-layout">
        <ReportSidebar navigate={navigate} />
        <div className="ff-area-main">
          {topbar}
          <div className="ff-area-content">
            <div className="ff-empty-state" style={{ marginTop: 60 }}>
              <i className="bi bi-bar-chart ff-empty-state-icon" />
              <div className="ff-empty-state-title">Sem dados para este período</div>
              <div className="ff-empty-state-desc">
                Nenhuma venda registrada em {formatDateFull(date)}.
                Tente selecionar outra data.
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── KPI cards ───────────────────────────────────────────────────────────────

  const kpiCards = [
    {
      icon: 'bi-currency-dollar', iconBg: '#ecfdf5', iconColor: '#059669',
      label: 'Faturamento', value: fBRL(report.totalRevenue), valueColor: '#059669',
    },
    {
      icon: 'bi-receipt', iconBg: '#eff6ff', iconColor: '#1d4ed8',
      label: 'Total de pedidos', value: String(report.totalOrders),
    },
    {
      icon: 'bi-check-circle', iconBg: '#f0fdf4', iconColor: '#16a34a',
      label: 'Pedidos pagos', value: String(report.totalPaidOrders),
    },
    {
      icon: 'bi-graph-up', iconBg: '#f5f3ff', iconColor: '#7c3aed',
      label: 'Ticket médio', value: fBRL(report.averageTicket),
    },
    {
      icon: 'bi-percent', iconBg: '#fffbeb', iconColor: '#d97706',
      label: 'Taxa de serviço', value: fBRL(report.serviceFeeTotal),
    },
    {
      icon: 'bi-x-circle', iconBg: '#fef2f2', iconColor: '#dc2626',
      label: 'Cancelados', value: String(report.canceledOrders),
      valueColor: report.canceledOrders > 0 ? '#dc2626' : undefined,
    },
  ];

  const kpiSection = (
    <div className="ff-rep-kpis">
      {kpiCards.map((k) => (
        <div key={k.label} className="ff-rep-kpi">
          <div className="ff-rep-kpi-top">
            <div className="ff-rep-kpi-icon" style={{ background: k.iconBg, color: k.iconColor }}>
              <i className={`bi ${k.icon}`} />
            </div>
          </div>
          <div className="ff-rep-kpi-value" style={k.valueColor ? { color: k.valueColor } : undefined}>
            {k.value}
          </div>
          <div className="ff-rep-kpi-label">{k.label}</div>
        </div>
      ))}
    </div>
  );

  // ── Hourly bar chart ────────────────────────────────────────────────────────

  const maxOrders = Math.max(...report.byHour.map((h) => h.orders), 1);
  const peakHour = report.byHour.length > 0
    ? report.byHour.reduce((b, h) => (h.orders > b.orders ? h : b), report.byHour[0])
    : null;
  const topRevenueHour = report.byHour.length > 0
    ? report.byHour.reduce((b, h) => (h.revenue > b.revenue ? h : b), report.byHour[0])
    : null;

  const hourlyChart = (
    <CardShell
      title="Pedidos por hora"
      subtitle={`${report.byHour.length} horas com atividade`}
    >
      {report.byHour.length === 0 ? (
        <EmptySection icon="bi-clock" text="Sem dados por hora" />
      ) : (
        <>
          <div className="ff-rep-hchart">
            {report.byHour.map((h) => (
              <div key={h.hour} className="ff-rep-hchart-col">
                <div className="ff-rep-hchart-tip">
                  {h.orders} pedido{h.orders !== 1 ? 's' : ''} · {fBRLShort(h.revenue)}
                </div>
                <div
                  className="ff-rep-hchart-bar"
                  style={{ height: `${Math.max((h.orders / maxOrders) * 110, 4)}px` }}
                />
                <div className="ff-rep-hchart-label">{h.hour}h</div>
              </div>
            ))}
          </div>

          <div style={{
            marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6',
            display: 'flex', gap: 28,
          }}>
            {peakHour && (
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Hora de pico
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
                  {peakHour.hour}h
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>
                    {peakHour.orders} pedidos
                  </span>
                </div>
              </div>
            )}
            {topRevenueHour && (
              <div>
                <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                  Hora mais lucrativa
                </div>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 3 }}>
                  {topRevenueHour.hour}h
                  <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>
                    {fBRL(topRevenueHour.revenue)}
                  </span>
                </div>
              </div>
            )}
            <div style={{ marginLeft: 'auto' }}>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>
                Total de pedidos
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
                {report.totalOrders}
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>
                  pedidos no dia
                </span>
              </div>
            </div>
          </div>
        </>
      )}
    </CardShell>
  );

  // ── Payment donut chart ─────────────────────────────────────────────────────

  const donutGrad = buildDonutGrad(report.byPaymentMethod);

  const paymentChart = (
    <CardShell
      title="Formas de pagamento"
      subtitle="Distribuição por receita"
    >
      {report.byPaymentMethod.length === 0 ? (
        <EmptySection icon="bi-credit-card" text="Sem pagamentos registrados" />
      ) : (
        <div className="ff-rep-donut-wrap">
          <div className="ff-rep-donut" style={{ background: donutGrad }}>
            <div className="ff-rep-donut-hole">
              <div className="ff-rep-donut-val">{report.totalPaidOrders}</div>
              <div className="ff-rep-donut-lab">pagos</div>
            </div>
          </div>
          <div className="ff-rep-donut-legend">
            {report.byPaymentMethod.map((m) => (
              <div key={m.method} className="ff-rep-donut-legend-item">
                <div
                  className="ff-rep-donut-legend-dot"
                  style={{ background: METHOD_COLORS[m.method] ?? '#9ca3af' }}
                />
                <div className="ff-rep-donut-legend-name">
                  {METHOD_LABELS[m.method] ?? m.method}
                </div>
                <div className="ff-rep-donut-legend-pct">{m.pct.toFixed(0)}%</div>
                <div className="ff-rep-donut-legend-amt">{fBRL(m.amount)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </CardShell>
  );

  // ── Top products ────────────────────────────────────────────────────────────

  const sortedProducts = [...report.topProducts].sort((a, b) =>
    productSort === 'revenue' ? b.revenue - a.revenue : b.units - a.units,
  );
  const maxProdVal = Math.max(
    ...sortedProducts.map((p) => (productSort === 'revenue' ? p.revenue : p.units)),
    1,
  );

  const topProductsSection = (
    <CardShell
      title="Produtos mais vendidos"
      subtitle={`Top ${Math.min(sortedProducts.length, 8)} itens do dia`}
      action={
        <>
          <button
            className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`}
            onClick={() => setProductSort('revenue')}
          >Receita</button>
          <button
            className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`}
            onClick={() => setProductSort('quantity')}
          >Qtd</button>
        </>
      }
    >
      {sortedProducts.length === 0 ? (
        <EmptySection icon="bi-bag" text="Sem produtos vendidos" />
      ) : (
        <div className="ff-rep-bars">
          {sortedProducts.slice(0, 8).map((p, i) => {
            const val = productSort === 'revenue' ? p.revenue : p.units;
            const pct = (val / maxProdVal) * 100;
            const barColor = i === 0 ? 'var(--ff-primary)' : i === 1 ? '#3b82f6' : i === 2 ? '#059669' : '#d1d5db';
            return (
              <div key={p.name} className="ff-rep-bar-item">
                <div className={rankClass(i)}>{i + 1}</div>
                <div className="ff-rep-bar-name" title={p.name}>{p.name}</div>
                <div className="ff-rep-bar-track">
                  <div
                    className="ff-rep-bar-fill"
                    style={{ width: `${pct}%`, background: barColor }}
                  />
                </div>
                <div className="ff-rep-bar-val">
                  {productSort === 'revenue' ? fBRL(p.revenue) : `${p.units} un.`}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );

  // ── Revenue by table ────────────────────────────────────────────────────────

  const maxTableRev = Math.max(...report.byTable.map((t) => t.revenue), 1);

  const tableRevenueSection = (
    <CardShell
      title="Receita por mesa"
      subtitle={`${report.byTable.length} mesa${report.byTable.length !== 1 ? 's' : ''} com movimentação`}
    >
      {report.byTable.length === 0 ? (
        <EmptySection icon="bi-table" text="Sem dados de mesas" />
      ) : (
        <div className="ff-rep-bars">
          {report.byTable.map((t, i) => {
            const pct = (t.revenue / maxTableRev) * 100;
            return (
              <div key={t.tableNumber} className="ff-rep-bar-item">
                <div className={rankClass(i)}>{i + 1}</div>
                <div className="ff-rep-bar-name">Mesa {t.tableNumber}</div>
                <div className="ff-rep-bar-track">
                  <div
                    className="ff-rep-bar-fill"
                    style={{
                      width: `${pct}%`,
                      background: '#059669',
                      opacity: 0.55 + (1 - i / Math.max(report.byTable.length, 1)) * 0.45,
                    }}
                  />
                </div>
                <div className="ff-rep-bar-val" style={{ fontSize: 11 }}>
                  <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{fBRL(t.revenue)}</div>
                  <div style={{ color: '#9ca3af', fontWeight: 400 }}>{t.orderCount} ped.</div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </CardShell>
  );

  // ── Waiter performance ──────────────────────────────────────────────────────

  const waiterSection = (
    <div className="ff-rep-card">
      <div className="ff-rep-card-header">
        <div>
          <div className="ff-rep-card-title">Performance dos garçons</div>
          <div className="ff-rep-card-subtitle">Classificado por faturamento gerado</div>
        </div>
      </div>
      {report.byWaiter.length === 0 ? (
        <EmptySection icon="bi-person" text="Sem dados de garçons" />
      ) : (
        <table className="ff-rep-waiter-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Garçom</th>
              <th>Faturamento</th>
              <th>Pedidos</th>
              <th>Mesas</th>
              <th>Ticket médio</th>
              <th>Vendas brutas</th>
            </tr>
          </thead>
          <tbody>
            {report.byWaiter.map((w, i) => (
              <tr key={w.waiterName}>
                <td>
                  <div className={rankClass(i)} style={{ width: 22, height: 22 }}>{i + 1}</div>
                </td>
                <td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      className="ff-rep-waiter-avatar"
                      style={{ background: WAITER_COLORS[i % WAITER_COLORS.length] }}
                    >
                      {w.waiterName.slice(0, 1).toUpperCase()}
                    </div>
                    <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{w.waiterName}</span>
                  </div>
                </td>
                <td><strong style={{ color: '#059669' }}>{fBRL(w.revenue)}</strong></td>
                <td>{w.orderCount}</td>
                <td>{w.tableCount}</td>
                <td style={{ color: '#6b7280' }}>{fBRL(w.avgTicket)}</td>
                <td style={{ color: '#6b7280' }}>
                  {fBRL(+(w.revenue * 0.909).toFixed(2))}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );

  // ── Insights ────────────────────────────────────────────────────────────────

  const quietHour = report.byHour.length > 1
    ? report.byHour.reduce((b, h) => (h.orders < b.orders ? h : b), report.byHour[0])
    : null;
  const topTable = report.byTable[0] ?? null;
  const topWaiter = report.byWaiter[0] ?? null;
  const topProduct = report.topProducts[0] ?? null;
  const payRate = report.totalOrders > 0
    ? Math.round((report.totalPaidOrders / report.totalOrders) * 100)
    : 0;

  const insightsSection = (
    <div>
      <div style={{
        fontSize: 13, fontWeight: 700, color: '#6b7280',
        textTransform: 'uppercase', letterSpacing: '.07em',
        marginBottom: 12, display: 'flex', alignItems: 'center', gap: 7,
      }}>
        <i className="bi bi-lightning-charge" style={{ color: '#f59e0b' }} />
        Destaques do dia
      </div>
      <div className="ff-rep-insights">
        {peakHour && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon">
              <i className="bi bi-fire" style={{ color: '#ef4444' }} />
            </div>
            <div className="ff-rep-insight-label">Hora de pico</div>
            <div className="ff-rep-insight-val">{peakHour.hour}h</div>
            <div className="ff-rep-insight-sub">
              {peakHour.orders} pedidos · {fBRL(peakHour.revenue)}
            </div>
          </div>
        )}
        {quietHour && quietHour.hour !== peakHour?.hour && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon">
              <i className="bi bi-moon-stars" style={{ color: '#6366f1' }} />
            </div>
            <div className="ff-rep-insight-label">Hora mais calma</div>
            <div className="ff-rep-insight-val">{quietHour.hour}h</div>
            <div className="ff-rep-insight-sub">
              {quietHour.orders} ped. · oportunidade de promoção
            </div>
          </div>
        )}
        {topTable && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon">
              <i className="bi bi-grid-3x3" style={{ color: '#059669' }} />
            </div>
            <div className="ff-rep-insight-label">Mesa mais lucrativa</div>
            <div className="ff-rep-insight-val">Mesa {topTable.tableNumber}</div>
            <div className="ff-rep-insight-sub">
              {fBRL(topTable.revenue)} · {topTable.orderCount} pedidos
            </div>
          </div>
        )}
        {topProduct && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon">
              <i className="bi bi-star-fill" style={{ color: '#f59e0b' }} />
            </div>
            <div className="ff-rep-insight-label">Produto destaque</div>
            <div className="ff-rep-insight-val" style={{ fontSize: 13 }}>
              {topProduct.name}
            </div>
            <div className="ff-rep-insight-sub">
              {fBRL(topProduct.revenue)} · {topProduct.units} un.
            </div>
          </div>
        )}
        {topWaiter && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon">
              <i className="bi bi-trophy-fill" style={{ color: '#d97706' }} />
            </div>
            <div className="ff-rep-insight-label">Melhor garçom</div>
            <div className="ff-rep-insight-val">{topWaiter.waiterName}</div>
            <div className="ff-rep-insight-sub">
              {fBRL(topWaiter.revenue)} · {topWaiter.orderCount} pedidos
            </div>
          </div>
        )}
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon">
            <i className="bi bi-clipboard-check" style={{ color: '#3b82f6' }} />
          </div>
          <div className="ff-rep-insight-label">Taxa de pagamento</div>
          <div className="ff-rep-insight-val">{payRate}%</div>
          <div className="ff-rep-insight-sub">
            {report.totalPaidOrders} de {report.totalOrders} pedidos
          </div>
        </div>
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon">
            <i className="bi bi-cash-stack" style={{ color: '#059669' }} />
          </div>
          <div className="ff-rep-insight-label">Vendas brutas</div>
          <div className="ff-rep-insight-val" style={{ fontSize: 15 }}>
            {fBRL(report.grossRevenue)}
          </div>
          <div className="ff-rep-insight-sub">
            + {fBRL(report.serviceFeeTotal)} em taxa de serviço
          </div>
        </div>
      </div>
    </div>
  );

  // ── Full render ─────────────────────────────────────────────────────────────

  return (
    <div className="ff-area-layout">
      <ReportSidebar navigate={navigate} />
      <div className="ff-area-main">
        {topbar}
        <div className="ff-area-content">
          <div className="ff-rep-content">
            {kpiSection}

            <div className="ff-rep-row ff-rep-row-3-1">
              {hourlyChart}
              {paymentChart}
            </div>

            <div className="ff-rep-row ff-rep-row-2">
              {topProductsSection}
              {tableRevenueSection}
            </div>

            {waiterSection}
            {insightsSection}
          </div>
        </div>
      </div>
    </div>
  );
}
