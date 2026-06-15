import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  reportService,
  type CloseReport,
  type PaymentMethodSummary,
} from '@/lib/services/reportService';
import { useNotify } from '@/lib/notifications';
import { tenantService } from '@/lib/services/adminService';
import { AdminLayout } from '@/components/layout';
import type { SidebarNavGroup } from '@/components/layout';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportSection =
  | 'dashboard' | 'fechamento' | 'vendas'      | 'pagamentos'
  | 'produtos'  | 'mesas'      | 'garcons'     | 'cozinha'
  | 'ocupacao'  | 'reservas'   | 'exportacoes';

const SECTION_LABELS: Record<ReportSection, string> = {
  dashboard:   'Dashboard geral',
  fechamento:  'Fechamento diário',
  vendas:      'Vendas',
  pagamentos:  'Pagamentos',
  produtos:    'Produtos mais vendidos',
  mesas:       'Receita por mesa',
  garcons:     'Receita por garçom',
  cozinha:     'Desempenho da cozinha',
  ocupacao:    'Ocupação / horários ociosos',
  reservas:    'Reservas',
  exportacoes: 'Exportações',
};

const REPORT_NAV_GROUPS: SidebarNavGroup[] = [
  {
    label: 'Visão geral',
    items: [
      { key: 'dashboard',  label: 'Dashboard geral',   icon: 'bi-grid-1x2' },
      { key: 'fechamento', label: 'Fechamento diário', icon: 'bi-calendar' },
    ],
  },
  {
    label: 'Financeiro',
    items: [
      { key: 'vendas',      label: 'Vendas',      icon: 'bi-graph-up' },
      { key: 'pagamentos',  label: 'Pagamentos',  icon: 'bi-credit-card' },
      { key: 'exportacoes', label: 'Exportações', icon: 'bi-download' },
    ],
  },
  {
    label: 'Desempenho',
    items: [
      { key: 'produtos',  label: 'Produtos mais vendidos', icon: 'bi-bag' },
      { key: 'mesas',     label: 'Receita por mesa',       icon: 'bi-table' },
      { key: 'garcons',   label: 'Receita por garçom',     icon: 'bi-person' },
      { key: 'cozinha',   label: 'Desempenho da cozinha',  icon: 'bi-fire' },
      { key: 'ocupacao',  label: 'Ocupação / horários',    icon: 'bi-clock' },
      { key: 'reservas',  label: 'Reservas',               icon: 'bi-calendar-check' },
    ],
  },
];

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
  if (v >= 1000) return `R$ ${(v / 1000).toFixed(1)}k`;
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

function NoDataState({ date }: { date: string }) {
  return (
    <div className="ff-empty-state" style={{ marginTop: 60 }}>
      <i className="bi bi-bar-chart ff-empty-state-icon" />
      <div className="ff-empty-state-title">Sem dados para este período</div>
      <div className="ff-empty-state-desc">
        Nenhuma venda registrada em {formatDateFull(date)}. Tente selecionar outra data.
      </div>
    </div>
  );
}

function PlaceholderState({ icon, title, desc }: { icon: string; title: string; desc: string }) {
  return (
    <div className="ff-empty-state" style={{ marginTop: 60 }}>
      <i className={`bi ${icon} ff-empty-state-icon`} />
      <div className="ff-empty-state-title">{title}</div>
      <div className="ff-empty-state-desc">{desc}</div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function ReportsPage() {
  const { section = 'dashboard' } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const [report, setReport] = useState<CloseReport | null>(null);
  const [date, setDate] = useState(todayStr());
  const [loading, setLoading] = useState(false);
  const [productSort, setProductSort] = useState<'revenue' | 'quantity'>('revenue');
  const [tenantName, setTenantName] = useState('');
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  useEffect(() => {
    tenantService.get().then((t) => {
      if (t) { setTenantName(t.name); setTenantLogo(t.logoUrl ?? undefined); }
    });
  }, []);

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
  const currentSection = SECTION_LABELS[section as ReportSection] ?? 'Relatórios';

  // ── Date controls in topbar ──────────────────────────────────────────────────

  const topBarRight = (
    <>
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
        disabled={!report || loading}
      >
        <i className="bi bi-download me-1" />CSV
      </button>
    </>
  );

  const sidebarFooter = (
    <button className="ff-nav-item" onClick={() => navigate('/admin/dashboard')}>
      <i className="bi bi-grid-1x2" />Administração
    </button>
  );

  // ── Derived data ─────────────────────────────────────────────────────────────

  const maxOrders = report ? Math.max(...report.byHour.map((h) => h.orders), 1) : 1;
  const peakHour = report?.byHour.length
    ? report.byHour.reduce((b, h) => (h.orders > b.orders ? h : b), report.byHour[0])
    : null;
  const topRevenueHour = report?.byHour.length
    ? report.byHour.reduce((b, h) => (h.revenue > b.revenue ? h : b), report.byHour[0])
    : null;
  const sortedProducts = report
    ? [...report.topProducts].sort((a, b) =>
        productSort === 'revenue' ? b.revenue - a.revenue : b.units - a.units,
      )
    : [];
  const maxProdVal = Math.max(
    ...sortedProducts.map((p) => (productSort === 'revenue' ? p.revenue : p.units)),
    1,
  );
  const maxTableRev = Math.max(...(report?.byTable.map((t) => t.revenue) ?? []), 1);
  const donutGrad = buildDonutGrad(report?.byPaymentMethod ?? []);
  const quietHour = report && report.byHour.length > 1
    ? report.byHour.reduce((b, h) => (h.orders < b.orders ? h : b), report.byHour[0])
    : null;
  const topTable = report?.byTable[0] ?? null;
  const topWaiter = report?.byWaiter[0] ?? null;
  const topProduct = report?.topProducts[0] ?? null;
  const payRate = report && report.totalOrders > 0
    ? Math.round((report.totalPaidOrders / report.totalOrders) * 100)
    : 0;

  // ── KPI cards ────────────────────────────────────────────────────────────────

  const kpiSection = report && (
    <div className="ff-rep-kpis">
      {[
        { icon: 'bi-currency-dollar', iconBg: '#ecfdf5', iconColor: '#059669', label: 'Faturamento', value: fBRL(report.totalRevenue), valueColor: '#059669' },
        { icon: 'bi-receipt', iconBg: '#eff6ff', iconColor: '#1d4ed8', label: 'Total de pedidos', value: String(report.totalOrders) },
        { icon: 'bi-check-circle', iconBg: '#f0fdf4', iconColor: '#16a34a', label: 'Pedidos pagos', value: String(report.totalPaidOrders) },
        { icon: 'bi-graph-up', iconBg: '#f5f3ff', iconColor: '#7c3aed', label: 'Ticket médio', value: fBRL(report.averageTicket) },
        { icon: 'bi-percent', iconBg: '#fffbeb', iconColor: '#d97706', label: 'Taxa de serviço', value: fBRL(report.serviceFeeTotal) },
        { icon: 'bi-x-circle', iconBg: '#fef2f2', iconColor: '#dc2626', label: 'Cancelados', value: String(report.canceledOrders), valueColor: report.canceledOrders > 0 ? '#dc2626' : undefined },
      ].map((k) => (
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

  // ── Shared chart renders ─────────────────────────────────────────────────────

  function renderHourlyChartContent() {
    if (!report?.byHour.length) return <EmptySection icon="bi-clock" text="Sem dados por hora" />;
    return (
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
        <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid #f3f4f6', display: 'flex', gap: 28 }}>
          {peakHour && (
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hora de pico</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
                {peakHour.hour}h
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>{peakHour.orders} pedidos</span>
              </div>
            </div>
          )}
          {topRevenueHour && (
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Hora mais lucrativa</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 3 }}>
                {topRevenueHour.hour}h
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>{fBRL(topRevenueHour.revenue)}</span>
              </div>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>Total de pedidos</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
              {report.totalOrders}
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>pedidos no dia</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderPaymentContent() {
    if (!report?.byPaymentMethod.length) return <EmptySection icon="bi-credit-card" text="Sem pagamentos registrados" />;
    return (
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
              <div className="ff-rep-donut-legend-dot" style={{ background: METHOD_COLORS[m.method] ?? '#9ca3af' }} />
              <div className="ff-rep-donut-legend-name">{METHOD_LABELS[m.method] ?? m.method}</div>
              <div className="ff-rep-donut-legend-pct">{m.pct.toFixed(0)}%</div>
              <div className="ff-rep-donut-legend-amt">{fBRL(m.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTopProductsContent() {
    if (!sortedProducts.length) return <EmptySection icon="bi-bag" text="Sem produtos vendidos" />;
    return (
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
                <div className="ff-rep-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
              </div>
              <div className="ff-rep-bar-val">
                {productSort === 'revenue' ? fBRL(p.revenue) : `${p.units} un.`}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTableRevenueContent() {
    if (!report?.byTable.length) return <EmptySection icon="bi-table" text="Sem dados de mesas" />;
    return (
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
    );
  }

  function renderWaiterContent() {
    if (!report?.byWaiter.length) return <EmptySection icon="bi-person" text="Sem dados de garçons" />;
    return (
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
              <td><div className={rankClass(i)} style={{ width: 22, height: 22 }}>{i + 1}</div></td>
              <td>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div className="ff-rep-waiter-avatar" style={{ background: WAITER_COLORS[i % WAITER_COLORS.length] }}>
                    {w.waiterName.slice(0, 1).toUpperCase()}
                  </div>
                  <span style={{ fontWeight: 600, color: '#1a1a1a' }}>{w.waiterName}</span>
                </div>
              </td>
              <td><strong style={{ color: '#059669' }}>{fBRL(w.revenue)}</strong></td>
              <td>{w.orderCount}</td>
              <td>{w.tableCount}</td>
              <td style={{ color: '#6b7280' }}>{fBRL(w.avgTicket)}</td>
              <td style={{ color: '#6b7280' }}>{fBRL(+(w.revenue * 0.909).toFixed(2))}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  // ── Insights ─────────────────────────────────────────────────────────────────

  const insightsSection = report && (
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
            <div className="ff-rep-insight-icon"><i className="bi bi-fire" style={{ color: '#ef4444' }} /></div>
            <div className="ff-rep-insight-label">Hora de pico</div>
            <div className="ff-rep-insight-val">{peakHour.hour}h</div>
            <div className="ff-rep-insight-sub">{peakHour.orders} pedidos · {fBRL(peakHour.revenue)}</div>
          </div>
        )}
        {quietHour && quietHour.hour !== peakHour?.hour && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-moon-stars" style={{ color: '#6366f1' }} /></div>
            <div className="ff-rep-insight-label">Hora mais calma</div>
            <div className="ff-rep-insight-val">{quietHour.hour}h</div>
            <div className="ff-rep-insight-sub">{quietHour.orders} ped. · oportunidade de promoção</div>
          </div>
        )}
        {topTable && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-grid-3x3" style={{ color: '#059669' }} /></div>
            <div className="ff-rep-insight-label">Mesa mais lucrativa</div>
            <div className="ff-rep-insight-val">Mesa {topTable.tableNumber}</div>
            <div className="ff-rep-insight-sub">{fBRL(topTable.revenue)} · {topTable.orderCount} pedidos</div>
          </div>
        )}
        {topProduct && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-star-fill" style={{ color: '#f59e0b' }} /></div>
            <div className="ff-rep-insight-label">Produto destaque</div>
            <div className="ff-rep-insight-val" style={{ fontSize: 13 }}>{topProduct.name}</div>
            <div className="ff-rep-insight-sub">{fBRL(topProduct.revenue)} · {topProduct.units} un.</div>
          </div>
        )}
        {topWaiter && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-trophy-fill" style={{ color: '#d97706' }} /></div>
            <div className="ff-rep-insight-label">Melhor garçom</div>
            <div className="ff-rep-insight-val">{topWaiter.waiterName}</div>
            <div className="ff-rep-insight-sub">{fBRL(topWaiter.revenue)} · {topWaiter.orderCount} pedidos</div>
          </div>
        )}
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon"><i className="bi bi-clipboard-check" style={{ color: '#3b82f6' }} /></div>
          <div className="ff-rep-insight-label">Taxa de pagamento</div>
          <div className="ff-rep-insight-val">{payRate}%</div>
          <div className="ff-rep-insight-sub">{report.totalPaidOrders} de {report.totalOrders} pedidos</div>
        </div>
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon"><i className="bi bi-cash-stack" style={{ color: '#059669' }} /></div>
          <div className="ff-rep-insight-label">Vendas brutas</div>
          <div className="ff-rep-insight-val" style={{ fontSize: 15 }}>{fBRL(report.grossRevenue)}</div>
          <div className="ff-rep-insight-sub">+ {fBRL(report.serviceFeeTotal)} em taxa de serviço</div>
        </div>
      </div>
    </div>
  );

  // ── Detail link helper ────────────────────────────────────────────────────────

  function detailLink(to: ReportSection) {
    return (
      <button
        className="btn btn-sm btn-outline-secondary"
        style={{ fontSize: 11, padding: '2px 8px' }}
        onClick={() => navigate(`/reports/${to}`)}
      >
        Detalhes <i className="bi bi-arrow-right" style={{ fontSize: 10 }} />
      </button>
    );
  }

  // ── Section content ───────────────────────────────────────────────────────────

  function renderSectionContent() {
    const noData = !report || report.totalOrders === 0;

    // ── Dashboard geral ──────────────────────────────────────────────────────
    if (section === 'dashboard') {
      if (noData) return <NoDataState date={date} />;
      return (
        <>
          {kpiSection}
          <div className="ff-rep-row ff-rep-row-3-1">
            <CardShell
              title="Pedidos por hora"
              subtitle={`${report!.byHour.length} horas com atividade`}
              action={detailLink('ocupacao')}
            >
              {renderHourlyChartContent()}
            </CardShell>
            <CardShell
              title="Formas de pagamento"
              subtitle="Distribuição por receita"
              action={detailLink('pagamentos')}
            >
              {renderPaymentContent()}
            </CardShell>
          </div>
          <div className="ff-rep-row ff-rep-row-2">
            <CardShell
              title="Produtos mais vendidos"
              subtitle={`Top ${Math.min(sortedProducts.length, 8)} itens do dia`}
              action={
                <>
                  <button className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`} onClick={() => setProductSort('revenue')}>Receita</button>
                  <button className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`} onClick={() => setProductSort('quantity')}>Qtd</button>
                  {detailLink('produtos')}
                </>
              }
            >
              {renderTopProductsContent()}
            </CardShell>
            <CardShell
              title="Receita por mesa"
              subtitle={`${report!.byTable.length} mesa${report!.byTable.length !== 1 ? 's' : ''} com movimentação`}
              action={detailLink('mesas')}
            >
              {renderTableRevenueContent()}
            </CardShell>
          </div>
          <div className="ff-rep-card">
            <div className="ff-rep-card-header">
              <div>
                <div className="ff-rep-card-title">Performance dos garçons</div>
                <div className="ff-rep-card-subtitle">Classificado por faturamento gerado</div>
              </div>
              <div className="ff-rep-card-action">{detailLink('garcons')}</div>
            </div>
            <div className="ff-rep-card-body">{renderWaiterContent()}</div>
          </div>
          {insightsSection}
        </>
      );
    }

    // ── Fechamento diário ────────────────────────────────────────────────────
    if (section === 'fechamento') {
      if (noData) return <NoDataState date={date} />;
      return (
        <>
          {kpiSection}
          <div className="ff-rep-row ff-rep-row-3-1">
            <CardShell title="Formas de pagamento" subtitle={`${formatDateFull(date)} — distribuição por receita`}>
              {renderPaymentContent()}
            </CardShell>
            <div className="ff-rep-card">
              <div className="ff-rep-card-header">
                <div className="ff-rep-card-title">Resumo financeiro</div>
              </div>
              <div className="ff-rep-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
                {[
                  { label: 'Faturamento total', value: fBRL(report!.totalRevenue), color: '#059669' },
                  { label: 'Vendas brutas', value: fBRL(report!.grossRevenue), color: '#1a1a1a' },
                  { label: 'Taxa de serviço', value: fBRL(report!.serviceFeeTotal), color: '#d97706' },
                  { label: 'Ticket médio', value: fBRL(report!.averageTicket), color: '#7c3aed' },
                ].map((row) => (
                  <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', paddingBottom: 10, borderBottom: '1px solid #f3f4f6' }}>
                    <span style={{ fontSize: 13, color: '#6b7280' }}>{row.label}</span>
                    <span style={{ fontSize: 15, fontWeight: 700, color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div style={{ marginTop: 4 }}>
                  <button
                    className="btn btn-sm btn-primary w-100"
                    onClick={handleExport}
                    disabled={!report || loading}
                  >
                    <i className="bi bi-download me-1" />Exportar CSV
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      );
    }

    // ── Pagamentos ───────────────────────────────────────────────────────────
    if (section === 'pagamentos') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell title="Formas de pagamento" subtitle={`${formatDateFull(date)} — distribuição por receita`}>
          {renderPaymentContent()}
        </CardShell>
      );
    }

    // ── Produtos mais vendidos ───────────────────────────────────────────────
    if (section === 'produtos') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell
          title="Produtos mais vendidos"
          subtitle={`${formatDateFull(date)} — top ${Math.min(sortedProducts.length, 8)} itens`}
          action={
            <>
              <button className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`} onClick={() => setProductSort('revenue')}>Receita</button>
              <button className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`} onClick={() => setProductSort('quantity')}>Qtd</button>
            </>
          }
        >
          {renderTopProductsContent()}
        </CardShell>
      );
    }

    // ── Receita por mesa ─────────────────────────────────────────────────────
    if (section === 'mesas') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell
          title="Receita por mesa"
          subtitle={`${formatDateFull(date)} — ${report!.byTable.length} mesa${report!.byTable.length !== 1 ? 's' : ''} com movimentação`}
        >
          {renderTableRevenueContent()}
        </CardShell>
      );
    }

    // ── Receita por garçom ───────────────────────────────────────────────────
    if (section === 'garcons') {
      if (noData) return <NoDataState date={date} />;
      return (
        <div className="ff-rep-card">
          <div className="ff-rep-card-header">
            <div>
              <div className="ff-rep-card-title">Performance dos garçons</div>
              <div className="ff-rep-card-subtitle">{formatDateFull(date)} — classificado por faturamento gerado</div>
            </div>
          </div>
          <div className="ff-rep-card-body">{renderWaiterContent()}</div>
        </div>
      );
    }

    // ── Ocupação / horários ──────────────────────────────────────────────────
    if (section === 'ocupacao') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell
          title="Ocupação / horários ociosos"
          subtitle={`${formatDateFull(date)} — ${report!.byHour.length} horas com atividade`}
        >
          {renderHourlyChartContent()}
        </CardShell>
      );
    }

    // ── Exportações ──────────────────────────────────────────────────────────
    if (section === 'exportacoes') {
      return (
        <CardShell title="Exportações" subtitle="Exportar dados do período selecionado">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>Relatório de fechamento (CSV)</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {formatDateFull(date)} — pedidos, pagamentos, produtos, mesas e garçons
                </div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={handleExport} disabled={!report || loading}>
                <i className="bi bi-download me-1" />Exportar CSV
              </button>
            </div>
          </div>
        </CardShell>
      );
    }

    // ── Placeholder sections ─────────────────────────────────────────────────
    const placeholders: Partial<Record<ReportSection, { icon: string; title: string; desc: string }>> = {
      vendas:    { icon: 'bi-graph-up',       title: 'Análise de vendas em desenvolvimento',        desc: 'Relatório de tendências e comparativos de vendas. Em breve disponível.' },
      cozinha:   { icon: 'bi-fire',           title: 'Desempenho da cozinha em desenvolvimento',    desc: 'Tempo médio de preparo e eficiência da cozinha. Em breve disponível.' },
      reservas:  { icon: 'bi-calendar-check', title: 'Relatório de reservas em desenvolvimento',    desc: 'Ocupação e análise de reservas. Em breve disponível.' },
    };

    const ph = placeholders[section as ReportSection];
    if (ph) return <PlaceholderState {...ph} />;

    return (
      <PlaceholderState
        icon="bi-question-circle"
        title="Seção não encontrada"
        desc="Selecione uma seção válida no menu lateral."
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      branding={{
        logoUrl: tenantLogo,
        fallbackIcon: 'bi-bar-chart-line',
        name: tenantName || 'Relatórios',
        role: 'Análise',
      }}
      groups={REPORT_NAV_GROUPS}
      activeKey={section}
      onSelect={(key) => navigate(`/reports/${key}`)}
      breadcrumb={{ root: tenantName || 'Relatórios', active: currentSection }}
      topBarRight={topBarRight}
      sidebarFooter={sidebarFooter}
    >
      <div className="ff-rep-content">
        {loading ? (
          <>
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
          </>
        ) : (
          renderSectionContent()
        )}
      </div>
    </AdminLayout>
  );
}
