import { useNavigate, useParams } from 'react-router-dom';
import { AdminLayout } from '@/components/layout';
import type { SidebarNavGroup } from '@/components/layout';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LanguageCode } from '@/i18n/labels';
import {
  type ReportSection, SECTION_LABEL_KEYS,
  todayStr, yesterdayStr, formatDateFull, fBRL,
} from './reportsUtils';
import {
  SkelBlock, CardShell, NoDataState, PlaceholderState,
} from './reportsComponents';
import {
  KpiCards, HourlyChart, PaymentDonut, TopProductsBars,
  TableRevenueBars, WaiterTable, Insights,
} from './reportsCharts';
import { useReportData } from './useReportData';
import './reports.css';

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

  const {
    report, date, setDate, loading, load,
    productSort, setProductSort,
    tenantName, tenantLogo, handleExport,
  } = useReportData();

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
        className="form-control form-control-sm ff-rep-date-input"
        value={date}
        onChange={(e) => setDate(e.target.value)}
      />
      <button
        className="btn btn-sm btn-outline-secondary ff-rep-icon-btn"
        onClick={load}
        disabled={loading}
        title={t('reports.refresh')}
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

  // ── Detail link helper ────────────────────────────────────────────────────────

  function detailLink(to: ReportSection) {
    return (
      <button
        className="btn btn-sm btn-outline-secondary ff-rep-detail-btn"
        onClick={() => navigate(`/reports/${to}`)}
      >
        {t('reports.details')} <i className="bi bi-arrow-right ff-rep-detail-arrow" />
      </button>
    );
  }

  const productSortAction = (
    <>
      <button className={`ff-rep-date-btn${productSort === 'revenue' ? ' active' : ''}`} onClick={() => setProductSort('revenue')}>{t('reports.sortRevenue')}</button>
      <button className={`ff-rep-date-btn${productSort === 'quantity' ? ' active' : ''}`} onClick={() => setProductSort('quantity')}>{t('reports.sortQty')}</button>
    </>
  );

  // ── Section content ───────────────────────────────────────────────────────────

  function renderSectionContent() {
    const noData = !report || report.totalOrders === 0;

    // ── Dashboard geral ──────────────────────────────────────────────────────
    if (section === 'dashboard') {
      if (noData) return <NoDataState date={date} />;
      return (
        <>
          <KpiCards report={report!} />
          <div className="ff-rep-row ff-rep-row-3-1">
            <CardShell
              title={t('reports.card.ordersByHour')}
              subtitle={t('reports.card.hoursActive', { n: report!.byHour.length })}
              action={detailLink('ocupacao')}
            >
              <HourlyChart report={report!} />
            </CardShell>
            <CardShell
              title={t('reports.card.paymentMethods')}
              subtitle={t('reports.card.byRevenue')}
              action={detailLink('pagamentos')}
            >
              <PaymentDonut report={report!} />
            </CardShell>
          </div>
          <div className="ff-rep-row ff-rep-row-2">
            <CardShell
              title={t('reports.section.produtos')}
              subtitle={t('reports.card.topItems', { n: Math.min(report!.topProducts.length, 8) })}
              action={<>{productSortAction}{detailLink('produtos')}</>}
            >
              <TopProductsBars report={report!} sort={productSort} />
            </CardShell>
            <CardShell
              title={t('reports.section.mesas')}
              subtitle={t('reports.card.tablesActive', { n: report!.byTable.length })}
              action={detailLink('mesas')}
            >
              <TableRevenueBars report={report!} />
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
            <div className="ff-rep-card-body"><WaiterTable report={report!} /></div>
          </div>
          <Insights report={report!} />
        </>
      );
    }

    // ── Fechamento diário ────────────────────────────────────────────────────
    if (section === 'fechamento') {
      if (noData) return <NoDataState date={date} />;
      return (
        <>
          <KpiCards report={report!} />
          <div className="ff-rep-row ff-rep-row-3-1">
            <CardShell title={t('reports.card.paymentMethods')} subtitle={t('reports.dateByRevenue', { date: formatDateFull(date, language) })}>
              <PaymentDonut report={report!} />
            </CardShell>
            <div className="ff-rep-card">
              <div className="ff-rep-card-header">
                <div className="ff-rep-card-title">{t('reports.card.financialSummary')}</div>
              </div>
              <div className="ff-rep-card-body ff-rep-fin-body">
                {[
                  { label: t('reports.fin.totalRevenue'), value: fBRL(report!.totalRevenue), color: '#059669' },
                  { label: t('reports.waiter.grossSales'), value: fBRL(report!.grossRevenue), color: '#1a1a1a' },
                  { label: t('reports.kpi.serviceFee'), value: fBRL(report!.serviceFeeTotal), color: '#d97706' },
                  { label: t('reports.kpi.avgTicket'), value: fBRL(report!.averageTicket), color: '#7c3aed' },
                ].map((row) => (
                  <div key={row.label} className="ff-rep-fin-row">
                    <span className="ff-rep-fin-label">{row.label}</span>
                    <span className="ff-rep-fin-val" style={{ color: row.color }}>{row.value}</span>
                  </div>
                ))}
                <div className="ff-rep-fin-action">
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
          <PaymentDonut report={report!} />
        </CardShell>
      );
    }

    // ── Produtos mais vendidos ───────────────────────────────────────────────
    if (section === 'produtos') {
      if (noData) return <NoDataState date={date} />;
      return (
        <CardShell
          title={t('reports.section.produtos')}
          subtitle={t('reports.dateTopItems', { date: formatDateFull(date, language), n: Math.min(report!.topProducts.length, 8) })}
          action={productSortAction}
        >
          <TopProductsBars report={report!} sort={productSort} />
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
          <TableRevenueBars report={report!} />
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
          <div className="ff-rep-card-body"><WaiterTable report={report!} /></div>
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
          <HourlyChart report={report!} />
        </CardShell>
      );
    }

    // ── Exportações ──────────────────────────────────────────────────────────
    if (section === 'exportacoes') {
      return (
        <CardShell title={t('reports.section.exportacoes')} subtitle={t('reports.exports.subtitle')}>
          <div className="ff-rep-exports">
            <div className="ff-rep-export-row">
              <div>
                <div className="ff-rep-export-title">{t('reports.exports.closingReport')}</div>
                <div className="ff-rep-export-desc">
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
