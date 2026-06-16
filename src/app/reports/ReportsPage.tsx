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
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LabelKey, LanguageCode } from '@/i18n/labels';

// ─── Types ────────────────────────────────────────────────────────────────────

type ReportSection =
  | 'dashboard' | 'fechamento' | 'vendas'      | 'pagamentos'
  | 'produtos'  | 'mesas'      | 'garcons'     | 'cozinha'
  | 'ocupacao'  | 'reservas'   | 'exportacoes';

const SECTION_LABEL_KEYS: Record<ReportSection, LabelKey> = {
  dashboard:   'reports.section.dashboard',
  fechamento:  'reports.section.fechamento',
  vendas:      'reports.section.vendas',
  pagamentos:  'reports.section.pagamentos',
  produtos:    'reports.section.produtos',
  mesas:       'reports.section.mesas',
  garcons:     'reports.section.garcons',
  cozinha:     'reports.section.cozinha',
  ocupacao:    'reports.section.ocupacao',
  reservas:    'reports.section.reservas',
  exportacoes: 'reports.section.exportacoes',
};

// ─── Constants ────────────────────────────────────────────────────────────────

const METHOD_LABEL_KEYS: Record<string, LabelKey> = {
  CASH: 'reports.method.cash',
  CARD: 'reports.method.card',
  PIX: 'reports.method.pix',
  EXTERNAL_TERMINAL: 'reports.method.terminal',
  UNKNOWN: 'reports.method.other',
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

function formatDateFull(dateStr: string, locale: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString(locale, {
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
  const { t, language } = useLabels();
  return (
    <div className="ff-empty-state" style={{ marginTop: 60 }}>
      <i className="bi bi-bar-chart ff-empty-state-icon" />
      <div className="ff-empty-state-title">{t('reports.noData.title')}</div>
      <div className="ff-empty-state-desc">
        {t('reports.noData.desc', { date: formatDateFull(date, language) })}
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
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <ReportsInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function ReportsInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t, language } = useLabels();
  const { section = 'dashboard' } = useParams<{ section: string }>();
  const navigate = useNavigate();
  const notify = useNotify();

  const REPORT_NAV_GROUPS: SidebarNavGroup[] = [
    {
      label: t('reports.navGroup.overview'),
      items: [
        { key: 'dashboard',  label: t('reports.section.dashboard'),  icon: 'bi-grid-1x2' },
        { key: 'fechamento', label: t('reports.section.fechamento'), icon: 'bi-calendar' },
      ],
    },
    {
      label: t('reports.navGroup.financial'),
      items: [
        { key: 'vendas',      label: t('reports.section.vendas'),      icon: 'bi-graph-up' },
        { key: 'pagamentos',  label: t('reports.section.pagamentos'),  icon: 'bi-credit-card' },
        { key: 'exportacoes', label: t('reports.section.exportacoes'), icon: 'bi-download' },
      ],
    },
    {
      label: t('reports.navGroup.performance'),
      items: [
        { key: 'produtos',  label: t('reports.section.produtos'), icon: 'bi-bag' },
        { key: 'mesas',     label: t('reports.section.mesas'),    icon: 'bi-table' },
        { key: 'garcons',   label: t('reports.section.garcons'),  icon: 'bi-person' },
        { key: 'cozinha',   label: t('reports.section.cozinha'),  icon: 'bi-fire' },
        { key: 'ocupacao',  label: t('reports.nav.ocupacao'),     icon: 'bi-clock' },
        { key: 'reservas',  label: t('reports.section.reservas'), icon: 'bi-calendar-check' },
      ],
    },
  ];

  const methodLabel = (m: string) => t(METHOD_LABEL_KEYS[m] ?? 'reports.method.other');

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
    notify(t('reports.csvExported'));
  }

  const isToday = date === todayStr();
  const isYesterday = date === yesterdayStr();
  const currentSection = t(SECTION_LABEL_KEYS[section as ReportSection] ?? 'reports.title');

  // ── Date controls in topbar ──────────────────────────────────────────────────

  const topBarRight = (
    <>
      <button
        className={`ff-rep-date-btn${isToday ? ' active' : ''}`}
        onClick={() => setDate(todayStr())}
      >{t('reports.today')}</button>
      <button
        className={`ff-rep-date-btn${isYesterday ? ' active' : ''}`}
        onClick={() => setDate(yesterdayStr())}
      >{t('reports.yesterday')}</button>
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
        title={t('reports.refresh')}
        style={{ width: 32, padding: 0 }}
      >
        <i className={`bi bi-arrow-clockwise${loading ? ' ff-spin' : ''}`} />
      </button>
      <button
        className="btn btn-sm btn-primary"
        onClick={handleExport}
        disabled={!report || loading}
      >
        <i className="bi bi-download me-1" />{t('reports.csv')}
      </button>
      <AdminLanguageSelector language={lang} onChange={onLangChange} />
    </>
  );

  const sidebarFooter = (
    <button className="ff-nav-item" onClick={() => navigate('/admin/dashboard')}>
      <i className="bi bi-grid-1x2" />{t('reports.admin')}
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
        { icon: 'bi-currency-dollar', iconBg: '#ecfdf5', iconColor: '#059669', label: t('reports.kpi.revenue'), value: fBRL(report.totalRevenue), valueColor: '#059669' },
        { icon: 'bi-receipt', iconBg: '#eff6ff', iconColor: '#1d4ed8', label: t('reports.kpi.totalOrders'), value: String(report.totalOrders) },
        { icon: 'bi-check-circle', iconBg: '#f0fdf4', iconColor: '#16a34a', label: t('reports.kpi.paidOrders'), value: String(report.totalPaidOrders) },
        { icon: 'bi-graph-up', iconBg: '#f5f3ff', iconColor: '#7c3aed', label: t('reports.kpi.avgTicket'), value: fBRL(report.averageTicket) },
        { icon: 'bi-percent', iconBg: '#fffbeb', iconColor: '#d97706', label: t('reports.kpi.serviceFee'), value: fBRL(report.serviceFeeTotal) },
        { icon: 'bi-x-circle', iconBg: '#fef2f2', iconColor: '#dc2626', label: t('reports.kpi.canceled'), value: String(report.canceledOrders), valueColor: report.canceledOrders > 0 ? '#dc2626' : undefined },
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
    if (!report?.byHour.length) return <EmptySection icon="bi-clock" text={t('reports.empty.byHour')} />;
    return (
      <>
        <div className="ff-rep-hchart">
          {report.byHour.map((h) => (
            <div key={h.hour} className="ff-rep-hchart-col">
              <div className="ff-rep-hchart-tip">
                {t('reports.ordersN', { n: h.orders })} · {fBRLShort(h.revenue)}
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
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('reports.peakHour')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
                {peakHour.hour}h
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>{t('reports.ordersN', { n: peakHour.orders })}</span>
              </div>
            </div>
          )}
          {topRevenueHour && (
            <div>
              <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('reports.topRevenueHour')}</div>
              <div style={{ fontSize: 16, fontWeight: 800, color: '#059669', marginTop: 3 }}>
                {topRevenueHour.hour}h
                <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>{fBRL(topRevenueHour.revenue)}</span>
              </div>
            </div>
          )}
          <div style={{ marginLeft: 'auto' }}>
            <div style={{ fontSize: 10, color: '#9ca3af', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{t('reports.kpi.totalOrders')}</div>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1a1a1a', marginTop: 3 }}>
              {report.totalOrders}
              <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500, marginLeft: 5 }}>{t('reports.ordersInDay')}</span>
            </div>
          </div>
        </div>
      </>
    );
  }

  function renderPaymentContent() {
    if (!report?.byPaymentMethod.length) return <EmptySection icon="bi-credit-card" text={t('reports.empty.payments')} />;
    return (
      <div className="ff-rep-donut-wrap">
        <div className="ff-rep-donut" style={{ background: donutGrad }}>
          <div className="ff-rep-donut-hole">
            <div className="ff-rep-donut-val">{report.totalPaidOrders}</div>
            <div className="ff-rep-donut-lab">{t('reports.paid')}</div>
          </div>
        </div>
        <div className="ff-rep-donut-legend">
          {report.byPaymentMethod.map((m) => (
            <div key={m.method} className="ff-rep-donut-legend-item">
              <div className="ff-rep-donut-legend-dot" style={{ background: METHOD_COLORS[m.method] ?? '#9ca3af' }} />
              <div className="ff-rep-donut-legend-name">{methodLabel(m.method)}</div>
              <div className="ff-rep-donut-legend-pct">{m.pct.toFixed(0)}%</div>
              <div className="ff-rep-donut-legend-amt">{fBRL(m.amount)}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderTopProductsContent() {
    if (!sortedProducts.length) return <EmptySection icon="bi-bag" text={t('reports.empty.products')} />;
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
                {productSort === 'revenue' ? fBRL(p.revenue) : t('reports.unitsN', { n: p.units })}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderTableRevenueContent() {
    if (!report?.byTable.length) return <EmptySection icon="bi-table" text={t('reports.empty.tables')} />;
    return (
      <div className="ff-rep-bars">
        {report.byTable.map((tbl, i) => {
          const pct = (tbl.revenue / maxTableRev) * 100;
          return (
            <div key={tbl.tableNumber} className="ff-rep-bar-item">
              <div className={rankClass(i)}>{i + 1}</div>
              <div className="ff-rep-bar-name">{t('reports.tableN', { n: tbl.tableNumber })}</div>
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
                <div style={{ fontWeight: 700, color: '#1a1a1a' }}>{fBRL(tbl.revenue)}</div>
                <div style={{ color: '#9ca3af', fontWeight: 400 }}>{t('reports.ordersAbbrN', { n: tbl.orderCount })}</div>
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  function renderWaiterContent() {
    if (!report?.byWaiter.length) return <EmptySection icon="bi-person" text={t('reports.empty.waiters')} />;
    return (
      <table className="ff-rep-waiter-table">
        <thead>
          <tr>
            <th>#</th>
            <th>{t('reports.waiter.name')}</th>
            <th>{t('reports.kpi.revenue')}</th>
            <th>{t('reports.waiter.orders')}</th>
            <th>{t('reports.waiter.tables')}</th>
            <th>{t('reports.kpi.avgTicket')}</th>
            <th>{t('reports.waiter.grossSales')}</th>
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
        {t('reports.insights.title')}
      </div>
      <div className="ff-rep-insights">
        {peakHour && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-fire" style={{ color: '#ef4444' }} /></div>
            <div className="ff-rep-insight-label">{t('reports.peakHour')}</div>
            <div className="ff-rep-insight-val">{peakHour.hour}h</div>
            <div className="ff-rep-insight-sub">{t('reports.ordersN', { n: peakHour.orders })} · {fBRL(peakHour.revenue)}</div>
          </div>
        )}
        {quietHour && quietHour.hour !== peakHour?.hour && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-moon-stars" style={{ color: '#6366f1' }} /></div>
            <div className="ff-rep-insight-label">{t('reports.insights.quietHour')}</div>
            <div className="ff-rep-insight-val">{quietHour.hour}h</div>
            <div className="ff-rep-insight-sub">{t('reports.ordersAbbrN', { n: quietHour.orders })} · {t('reports.promoOpportunity')}</div>
          </div>
        )}
        {topTable && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-grid-3x3" style={{ color: '#059669' }} /></div>
            <div className="ff-rep-insight-label">{t('reports.insights.topTable')}</div>
            <div className="ff-rep-insight-val">{t('reports.tableN', { n: topTable.tableNumber })}</div>
            <div className="ff-rep-insight-sub">{fBRL(topTable.revenue)} · {t('reports.ordersN', { n: topTable.orderCount })}</div>
          </div>
        )}
        {topProduct && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-star-fill" style={{ color: '#f59e0b' }} /></div>
            <div className="ff-rep-insight-label">{t('reports.insights.topProduct')}</div>
            <div className="ff-rep-insight-val" style={{ fontSize: 13 }}>{topProduct.name}</div>
            <div className="ff-rep-insight-sub">{fBRL(topProduct.revenue)} · {t('reports.unitsN', { n: topProduct.units })}</div>
          </div>
        )}
        {topWaiter && (
          <div className="ff-rep-insight">
            <div className="ff-rep-insight-icon"><i className="bi bi-trophy-fill" style={{ color: '#d97706' }} /></div>
            <div className="ff-rep-insight-label">{t('reports.insights.bestWaiter')}</div>
            <div className="ff-rep-insight-val">{topWaiter.waiterName}</div>
            <div className="ff-rep-insight-sub">{fBRL(topWaiter.revenue)} · {t('reports.ordersN', { n: topWaiter.orderCount })}</div>
          </div>
        )}
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon"><i className="bi bi-clipboard-check" style={{ color: '#3b82f6' }} /></div>
          <div className="ff-rep-insight-label">{t('reports.insights.payRate')}</div>
          <div className="ff-rep-insight-val">{payRate}%</div>
          <div className="ff-rep-insight-sub">{t('reports.insights.payRateSub', { paid: report.totalPaidOrders, total: report.totalOrders })}</div>
        </div>
        <div className="ff-rep-insight">
          <div className="ff-rep-insight-icon"><i className="bi bi-cash-stack" style={{ color: '#059669' }} /></div>
          <div className="ff-rep-insight-label">{t('reports.waiter.grossSales')}</div>
          <div className="ff-rep-insight-val" style={{ fontSize: 15 }}>{fBRL(report.grossRevenue)}</div>
          <div className="ff-rep-insight-sub">{t('reports.insights.grossSalesSub', { fee: fBRL(report.serviceFeeTotal) })}</div>
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
        {t('reports.details')} <i className="bi bi-arrow-right" style={{ fontSize: 10 }} />
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
              title={t('reports.card.ordersByHour')}
              subtitle={t('reports.card.hoursActive', { n: report!.byHour.length })}
              action={detailLink('ocupacao')}
            >
              {renderHourlyChartContent()}
            </CardShell>
            <CardShell
              title={t('reports.card.paymentMethods')}
              subtitle={t('reports.card.byRevenue')}
              action={detailLink('pagamentos')}
            >
              {renderPaymentContent()}
            </CardShell>
          </div>
          <div className="ff-rep-row ff-rep-row-2">
            <CardShell
              title={t('reports.section.produtos')}
              subtitle={t('reports.card.topItems', { n: Math.min(sortedProducts.length, 8) })}
              action={
                <>
                  <button className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`} onClick={() => setProductSort('revenue')}>{t('reports.sortRevenue')}</button>
                  <button className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`} onClick={() => setProductSort('quantity')}>{t('reports.sortQty')}</button>
                  {detailLink('produtos')}
                </>
              }
            >
              {renderTopProductsContent()}
            </CardShell>
            <CardShell
              title={t('reports.section.mesas')}
              subtitle={t('reports.card.tablesActive', { n: report!.byTable.length })}
              action={detailLink('mesas')}
            >
              {renderTableRevenueContent()}
            </CardShell>
          </div>
          <div className="ff-rep-card">
            <div className="ff-rep-card-header">
              <div>
                <div className="ff-rep-card-title">{t('reports.card.waiterPerf')}</div>
                <div className="ff-rep-card-subtitle">{t('reports.card.byRevenueGenerated')}</div>
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
            <CardShell title={t('reports.card.paymentMethods')} subtitle={t('reports.dateByRevenue', { date: formatDateFull(date, language) })}>
              {renderPaymentContent()}
            </CardShell>
            <div className="ff-rep-card">
              <div className="ff-rep-card-header">
                <div className="ff-rep-card-title">{t('reports.card.financialSummary')}</div>
              </div>
              <div className="ff-rep-card-body" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '4px 0' }}>
                {[
                  { label: t('reports.fin.totalRevenue'), value: fBRL(report!.totalRevenue), color: '#059669' },
                  { label: t('reports.waiter.grossSales'), value: fBRL(report!.grossRevenue), color: '#1a1a1a' },
                  { label: t('reports.kpi.serviceFee'), value: fBRL(report!.serviceFeeTotal), color: '#d97706' },
                  { label: t('reports.kpi.avgTicket'), value: fBRL(report!.averageTicket), color: '#7c3aed' },
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
                    <i className="bi bi-download me-1" />{t('reports.exportCsv')}
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
        <CardShell title={t('reports.card.paymentMethods')} subtitle={t('reports.dateByRevenue', { date: formatDateFull(date, language) })}>
          {renderPaymentContent()}
        </CardShell>
      );
    }

    // ── Produtos mais vendidos ───────────────────────────────────────────────
    if (section === 'produtos') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell
          title={t('reports.section.produtos')}
          subtitle={t('reports.dateTopItems', { date: formatDateFull(date, language), n: Math.min(sortedProducts.length, 8) })}
          action={
            <>
              <button className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`} onClick={() => setProductSort('revenue')}>{t('reports.sortRevenue')}</button>
              <button className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`} onClick={() => setProductSort('quantity')}>{t('reports.sortQty')}</button>
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
          title={t('reports.section.mesas')}
          subtitle={t('reports.dateTablesActive', { date: formatDateFull(date, language), n: report!.byTable.length })}
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
              <div className="ff-rep-card-title">{t('reports.card.waiterPerf')}</div>
              <div className="ff-rep-card-subtitle">{t('reports.dateWaiterRanked', { date: formatDateFull(date, language) })}</div>
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
          title={t('reports.section.ocupacao')}
          subtitle={t('reports.dateHoursActive', { date: formatDateFull(date, language), n: report!.byHour.length })}
        >
          {renderHourlyChartContent()}
        </CardShell>
      );
    }

    // ── Exportações ──────────────────────────────────────────────────────────
    if (section === 'exportacoes') {
      return (
        <CardShell title={t('reports.section.exportacoes')} subtitle={t('reports.exports.subtitle')}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', border: '1px solid #e5e7eb', borderRadius: 8 }}>
              <div>
                <div style={{ fontWeight: 600, color: '#1a1a1a' }}>{t('reports.exports.closingReport')}</div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
                  {t('reports.exports.closingDesc', { date: formatDateFull(date, language) })}
                </div>
              </div>
              <button className="btn btn-sm btn-primary" onClick={handleExport} disabled={!report || loading}>
                <i className="bi bi-download me-1" />{t('reports.exportCsv')}
              </button>
            </div>
          </div>
        </CardShell>
      );
    }

    // ── Placeholder sections ─────────────────────────────────────────────────
    const placeholders: Partial<Record<ReportSection, { icon: string; title: string; desc: string }>> = {
      vendas:    { icon: 'bi-graph-up',       title: t('reports.ph.vendasTitle'),   desc: t('reports.ph.vendasDesc') },
      cozinha:   { icon: 'bi-fire',           title: t('reports.ph.cozinhaTitle'),  desc: t('reports.ph.cozinhaDesc') },
      reservas:  { icon: 'bi-calendar-check', title: t('reports.ph.reservasTitle'), desc: t('reports.ph.reservasDesc') },
    };

    const ph = placeholders[section as ReportSection];
    if (ph) return <PlaceholderState {...ph} />;

    return (
      <PlaceholderState
        icon="bi-question-circle"
        title={t('reports.notFound.title')}
        desc={t('reports.notFound.desc')}
      />
    );
  }

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <AdminLayout
      branding={{
        logoUrl: tenantLogo,
        fallbackIcon: 'bi-bar-chart-line',
        name: tenantName || t('reports.title'),
        role: t('reports.role'),
      }}
      groups={REPORT_NAV_GROUPS}
      activeKey={section}
      onSelect={(key) => navigate(`/reports/${key}`)}
      breadcrumb={{ root: tenantName || t('reports.title'), active: currentSection }}
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
