import type { CloseReport } from '@/lib/services/reportService';
import { useLabels } from '@/i18n/I18nContext';
import { EmptySection } from './reportsComponents';
import {
  METHOD_LABEL_KEYS, METHOD_COLORS, WAITER_COLORS,
  fBRL, fBRLShort, buildDonutGrad, rankClass,
} from './reportsUtils';
import './reports.css';

// ─── KPI cards ─────────────────────────────────────────────────────────────────

export function KpiCards({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  const kpis = [
    { icon: 'bi-currency-dollar', iconBg: '#ecfdf5', iconColor: '#059669', label: t('reports.kpi.revenue'), value: fBRL(report.totalRevenue), valueColor: '#059669' },
    { icon: 'bi-receipt', iconBg: '#eff6ff', iconColor: '#1d4ed8', label: t('reports.kpi.totalOrders'), value: String(report.totalOrders) },
    { icon: 'bi-check-circle', iconBg: '#f0fdf4', iconColor: '#16a34a', label: t('reports.kpi.paidOrders'), value: String(report.totalPaidOrders) },
    { icon: 'bi-graph-up', iconBg: '#f5f3ff', iconColor: '#7c3aed', label: t('reports.kpi.avgTicket'), value: fBRL(report.averageTicket) },
    { icon: 'bi-percent', iconBg: '#fffbeb', iconColor: '#d97706', label: t('reports.kpi.serviceFee'), value: fBRL(report.serviceFeeTotal) },
    { icon: 'bi-x-circle', iconBg: '#fef2f2', iconColor: '#dc2626', label: t('reports.kpi.canceled'), value: String(report.canceledOrders), valueColor: report.canceledOrders > 0 ? '#dc2626' : undefined },
  ];
  return (
    <div className="ff-rep-kpis">
      {kpis.map((k) => (
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
}

// ─── Hourly chart ──────────────────────────────────────────────────────────────

export function HourlyChart({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  if (!report.byHour.length) return <EmptySection icon="bi-clock" text={t('reports.empty.byHour')} />;

  const maxOrders = Math.max(...report.byHour.map((h) => h.orders), 1);
  const peakHour = report.byHour.reduce((b, h) => (h.orders > b.orders ? h : b), report.byHour[0]);
  const topRevenueHour = report.byHour.reduce((b, h) => (h.revenue > b.revenue ? h : b), report.byHour[0]);

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
      <div className="ff-rep-hchart-foot">
        {peakHour && (
          <div>
            <div className="ff-rep-stat-label">{t('reports.peakHour')}</div>
            <div className="ff-rep-stat-val">
              {peakHour.hour}h
              <span className="ff-rep-stat-sub">{t('reports.ordersN', { n: peakHour.orders })}</span>
            </div>
          </div>
        )}
        {topRevenueHour && (
          <div>
            <div className="ff-rep-stat-label">{t('reports.topRevenueHour')}</div>
            <div className="ff-rep-stat-val ff-rep-stat-val--green">
              {topRevenueHour.hour}h
              <span className="ff-rep-stat-sub">{fBRL(topRevenueHour.revenue)}</span>
            </div>
          </div>
        )}
        <div className="ff-rep-stat--right">
          <div className="ff-rep-stat-label">{t('reports.kpi.totalOrders')}</div>
          <div className="ff-rep-stat-val">
            {report.totalOrders}
            <span className="ff-rep-stat-sub">{t('reports.ordersInDay')}</span>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Payment donut ─────────────────────────────────────────────────────────────

export function PaymentDonut({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  if (!report.byPaymentMethod.length) return <EmptySection icon="bi-credit-card" text={t('reports.empty.payments')} />;

  const methodLabel = (m: string) => t(METHOD_LABEL_KEYS[m] ?? 'reports.method.other');
  const donutGrad = buildDonutGrad(report.byPaymentMethod);

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

// ─── Top products ──────────────────────────────────────────────────────────────

export function TopProductsBars({ report, sort }: { report: CloseReport; sort: 'revenue' | 'quantity' }) {
  const { t } = useLabels();
  const sortedProducts = [...report.topProducts].sort((a, b) =>
    sort === 'revenue' ? b.revenue - a.revenue : b.units - a.units,
  );
  if (!sortedProducts.length) return <EmptySection icon="bi-bag" text={t('reports.empty.products')} />;

  const maxProdVal = Math.max(...sortedProducts.map((p) => (sort === 'revenue' ? p.revenue : p.units)), 1);

  return (
    <div className="ff-rep-bars">
      {sortedProducts.slice(0, 8).map((p, i) => {
        const val = sort === 'revenue' ? p.revenue : p.units;
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
              {sort === 'revenue' ? fBRL(p.revenue) : t('reports.unitsN', { n: p.units })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Table revenue ─────────────────────────────────────────────────────────────

export function TableRevenueBars({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  if (!report.byTable.length) return <EmptySection icon="bi-table" text={t('reports.empty.tables')} />;

  const maxTableRev = Math.max(...report.byTable.map((tb) => tb.revenue), 1);

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
            <div className="ff-rep-bar-val ff-rep-bar-val--sm">
              <div className="ff-rep-bar-val-main">{fBRL(tbl.revenue)}</div>
              <div className="ff-rep-bar-val-sub">{t('reports.ordersAbbrN', { n: tbl.orderCount })}</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Waiter table ──────────────────────────────────────────────────────────────

export function WaiterTable({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  if (!report.byWaiter.length) return <EmptySection icon="bi-person" text={t('reports.empty.waiters')} />;

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
            <td><div className={`${rankClass(i)} ff-rep-rank--sm`}>{i + 1}</div></td>
            <td>
              <div className="ff-rep-waiter-cell">
                <div className="ff-rep-waiter-avatar" style={{ background: WAITER_COLORS[i % WAITER_COLORS.length] }}>
                  {w.waiterName.slice(0, 1).toUpperCase()}
                </div>
                <span className="ff-rep-waiter-name">{w.waiterName}</span>
              </div>
            </td>
            <td><strong className="ff-rep-txt-green">{fBRL(w.revenue)}</strong></td>
            <td>{w.orderCount}</td>
            <td>{w.tableCount}</td>
            <td className="ff-rep-txt-muted">{fBRL(w.avgTicket)}</td>
            <td className="ff-rep-txt-muted">{fBRL(+(w.revenue * 0.909).toFixed(2))}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// ─── Insights ──────────────────────────────────────────────────────────────────

export function Insights({ report }: { report: CloseReport }) {
  const { t } = useLabels();
  const peakHour = report.byHour.length
    ? report.byHour.reduce((b, h) => (h.orders > b.orders ? h : b), report.byHour[0])
    : null;
  const quietHour = report.byHour.length > 1
    ? report.byHour.reduce((b, h) => (h.orders < b.orders ? h : b), report.byHour[0])
    : null;
  const topTable = report.byTable[0] ?? null;
  const topWaiter = report.byWaiter[0] ?? null;
  const topProduct = report.topProducts[0] ?? null;
  const payRate = report.totalOrders > 0
    ? Math.round((report.totalPaidOrders / report.totalOrders) * 100)
    : 0;

  return (
    <div>
      <div className="ff-rep-insights-head">
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
            <div className="ff-rep-insight-val ff-rep-insight-val--sm">{topProduct.name}</div>
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
          <div className="ff-rep-insight-val ff-rep-insight-val--md">{fBRL(report.grossRevenue)}</div>
          <div className="ff-rep-insight-sub">{t('reports.insights.grossSalesSub', { fee: fBRL(report.serviceFeeTotal) })}</div>
        </div>
      </div>
    </div>
  );
}
