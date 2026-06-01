import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportService, type CloseReport } from '@/lib/services/reportService';
import { useNotify } from '@/lib/notifications';

function formatBRL(v: number | undefined | null) {
  if (v == null || isNaN(v as number)) return '—';
  return (v as number).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

const METHOD_LABELS: Record<string, string> = {
  CASH: 'Dinheiro', CARD: 'Cartão', PIX: 'PIX',
  EXTERNAL_TERMINAL: 'Terminal', UNKNOWN: 'Outros',
};

export function ReportsPage() {
  const [report, setReport] = useState<CloseReport | null>(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [loading, setLoading] = useState(false);
  const notify = useNotify();
  const navigate = useNavigate();

  async function load() {
    setLoading(true);
    try { setReport(await reportService.getCloseReport(date)); }
    finally { setLoading(false); }
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

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo"><i className="bi bi-bar-chart me-2" />Relatórios</div>
        <nav className="ff-area-sidebar-nav">
          <button className="ff-nav-item active"><i className="bi bi-calendar-check" />Fechamento diário</button>
          <button className="ff-nav-item" onClick={() => navigate('/admin/dashboard')}><i className="bi bi-grid-1x2" />Admin</button>
          <button className="ff-nav-item" onClick={() => navigate('/')}><i className="bi bi-house" />Hub</button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">Relatório de Fechamento</span>
          <input
            type="date"
            className="form-control form-control-sm ms-auto"
            style={{ width: 160 }}
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
          <button className="btn btn-sm btn-outline-secondary" onClick={load}>
            <i className="bi bi-arrow-clockwise" />
          </button>
          <button className="btn btn-sm btn-primary" onClick={handleExport} disabled={!report}>
            <i className="bi bi-download me-1" />CSV
          </button>
        </div>

        <div className="ff-area-content">
          {loading && <div className="text-muted text-center py-4">Carregando...</div>}
          {!loading && report && (
            <>
              {/* KPIs */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 14, marginBottom: 24 }}>
                {[
                  { label: 'Faturamento', value: formatBRL(report.totalRevenue), color: '#059669' },
                  { label: 'Pedidos', value: String(report.totalOrders) },
                  { label: 'Pagos', value: String(report.totalPaidOrders), color: '#059669' },
                  { label: 'Ticket médio', value: formatBRL(report.averageTicket) },
                  { label: 'Cancelados', value: String(report.canceledOrders), color: report.canceledOrders > 0 ? '#dc2626' : undefined },
                ].map((k) => (
                  <div key={k.label} className="ff-metric-card">
                    <div className="ff-metric-card-label">{k.label}</div>
                    <div className="ff-metric-card-value" style={{ color: k.color, fontSize: 22 }}>{k.value}</div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Payment methods */}
                <div className="ff-data-card">
                  <div className="ff-data-card-header">Por forma de pagamento</div>
                  {report.byPaymentMethod.length === 0 && (
                    <div className="text-muted text-center py-3">Sem dados</div>
                  )}
                  <table className="table table-hover mb-0">
                    <thead><tr><th>Forma</th><th>Pedidos</th><th>Valor</th></tr></thead>
                    <tbody>
                      {report.byPaymentMethod.map((m) => (
                        <tr key={m.method}>
                          <td>{METHOD_LABELS[m.method] ?? m.method}</td>
                          <td>{m.count}</td>
                          <td><strong>{formatBRL(m.amount)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Top products */}
                <div className="ff-data-card">
                  <div className="ff-data-card-header">Produtos mais vendidos</div>
                  {report.topProducts.length === 0 && (
                    <div className="text-muted text-center py-3">Sem dados</div>
                  )}
                  <table className="table table-hover mb-0">
                    <thead><tr><th>Produto</th><th>Qtd</th><th>Receita</th></tr></thead>
                    <tbody>
                      {report.topProducts.map((p) => (
                        <tr key={p.name}>
                          <td>{p.name}</td>
                          <td>{p.units}</td>
                          <td><strong>{formatBRL(p.revenue)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Hourly chart (text-based for prototype) */}
              {report.byHour.length > 0 && (
                <div className="ff-data-card" style={{ marginTop: 20 }}>
                  <div className="ff-data-card-header">Pedidos por hora</div>
                  <div style={{ padding: 16, display: 'flex', alignItems: 'flex-end', gap: 8, height: 120 }}>
                    {report.byHour.map((h) => {
                      const maxOrders = Math.max(...report.byHour.map((x) => x.orders));
                      const pct = maxOrders > 0 ? h.orders / maxOrders : 0;
                      return (
                        <div key={h.hour} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                          <div style={{ fontSize: 11, color: '#6b7280' }}>{h.orders}</div>
                          <div style={{ width: '100%', background: 'var(--ff-primary)', borderRadius: '4px 4px 0 0', height: `${Math.max(pct * 72, 4)}px` }} />
                          <div style={{ fontSize: 10, color: '#9ca3af' }}>{h.hour}h</div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
