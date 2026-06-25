import { useNavigate } from 'react-router-dom';
import { formatCurrency as formatBRL, formatDateTime } from '@/utils/format';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import type { LanguageCode } from '@/i18n/labels';
import { AdminLayout } from '@/components/layout';
import type { SidebarNavGroup } from '@/components/layout';
import { MetricChip, AdminFilterBar, AdminSearchInput, AdminLanguageSelector } from '@/components/admin';
import type { FilterOption } from '@/components/admin';
import { TABLE_STATUS_LABEL, sortRows, toggleSort, type Tab, type PaymentFilter } from './cashierUtils';
import { useCashier } from './useCashier';
import { PayModal } from './PayModal';
import { ReceiptModal } from './ReceiptModal';
import { TableGroupCard } from './TableGroupCard';
import { KioskAlertsPanel } from './KioskAlertsPanel';
import { KioskPayModal } from './KioskPayModal';
import { KioskPendingCard, KioskPaidCard } from './KioskOrderCards';
import { SortTh } from './SortTh';

export function CashierPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <CashierPageInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function CashierPageInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t } = useLabels();
  const navigate = useNavigate();
  const c = useCashier();
  const {
    tab, setTab, tableGroups, allPayments, receipts, invoices,
    pendingKioskOrders, paidKioskOrders, kioskAlerts,
    kioskView, setKioskView, kioskPayOrder, setKioskPayOrder,
    summary, payContext, setPayContext,
    selectedPayment, setSelectedPayment, showPayModal, setShowPayModal,
    selectedReceipt, setSelectedReceipt,
    expandedCustomers, collapsedTables, tableSearch, setTableSearch,
    paymentFilter, setPaymentFilter,
    histSort, setHistSort, recSort, setRecSort, invSort, setInvSort,
    methodLabel, filteredGroups, countByFilter, payments, tables,
    load, toggleCustomer, toggleTableCollapse, collapseAll, expandAll,
    handlePayContext, handlePaySingle, handleGenerateReceipt, handleGenerateInvoice,
    handleResetTable, handleResolveAlert, handlePayKioskOrder,
  } = c;

  const navItems: { label: string; value: Tab; icon: string }[] = [
    { label: t('cashier.tab.orders'),   value: 'orders',   icon: 'bi-grid-3x3-gap' },
    { label: 'Kiosk',                   value: 'kiosk',    icon: 'bi-display' },
    { label: t('cashier.tab.history'),  value: 'history',  icon: 'bi-list-check' },
    { label: t('cashier.tab.receipts'), value: 'receipts', icon: 'bi-receipt' },
    { label: t('cashier.tab.invoices'), value: 'invoices', icon: 'bi-file-earmark-text' },
  ];

  const groups: SidebarNavGroup[] = [{
    label: '',
    items: navItems.map((n) => ({
      key: n.value,
      label: n.label,
      icon: n.icon,
      badge: n.value === 'orders' && payments.length > 0 ? payments.length
           : n.value === 'kiosk' && (pendingKioskOrders.length + kioskAlerts.filter((a) => a.status === 'OPEN').length) > 0
             ? pendingKioskOrders.length + kioskAlerts.filter((a) => a.status === 'OPEN').length
           : undefined,
    })),
  }];

  const filterOptions: FilterOption[] = [
    { key: 'all',     label: t('cashier.filter.all'),     count: countByFilter.all },
    { key: 'pending', label: t('cashier.filter.pending'), count: countByFilter.pending },
    { key: 'partial', label: t('cashier.filter.partial'), count: countByFilter.partial },
    { key: 'paid',    label: t('cashier.filter.paid'),    count: countByFilter.paid },
  ];

  const topBarRight = (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div className="ff-area-status-badge">
        <span className="ff-area-status-dot" />
        {t('cashier.live')}
      </div>
      <button className="btn btn-sm btn-outline-secondary" onClick={load}>
        <i className="bi bi-arrow-clockwise" />
      </button>
      <AdminLanguageSelector language={lang} onChange={onLangChange} />
    </div>
  );

  const sidebarFooter = (
    <button className="ff-nav-item" onClick={() => navigate('/')}>
      <i className="bi bi-house" />{t('cashier.hub')}
    </button>
  );

  return (
    <>
      <AdminLayout
        branding={{ fallbackIcon: 'bi-cash-register', name: t('cashier.title') }}
        groups={groups}
        activeKey={tab}
        onSelect={(key) => { setTab(key as Tab); navigate(`/cashier/${key}`); }}
        breadcrumb={{ root: t('cashier.title'), active: navItems.find((n) => n.value === tab)?.label ?? tab }}
        topBarRight={topBarRight}
        sidebarFooter={sidebarFooter}
      >
        {/* Sticky ops header: metrics + filter bar */}
        <div className="ff-area-ops-header">
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: tab === 'orders' ? 12 : 0 }}>
            <MetricChip icon="bi-cash-stack" color="green" label={t('cashier.metric.received')} value={formatBRL(summary.totalPaid)} />
            <MetricChip icon="bi-check-circle" color="blue" label={t('cashier.metric.paid')} value={String(summary.paidCount)} />
            <MetricChip icon="bi-hourglass-split" color="amber" label={t('cashier.metric.pending')} value={formatBRL(summary.pendingAmount)} />
            <MetricChip icon="bi-table" color="purple" label={t('cashier.metric.tables')} value={String(summary.pendingCount)} />
          </div>
          {tab === 'orders' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <AdminSearchInput value={tableSearch} onChange={setTableSearch} placeholder={t('cashier.filter.search')} />
              <AdminFilterBar options={filterOptions} value={paymentFilter} onChange={(k) => setPaymentFilter(k as PaymentFilter)} />
              <div style={{ display: 'flex', gap: 6, marginLeft: 'auto' }}>
                <button className="btn btn-sm btn-outline-secondary" onClick={collapseAll}>
                  <i className="bi bi-arrows-collapse me-1" />{t('cashier.collapse')}
                </button>
                <button className="btn btn-sm btn-outline-secondary" onClick={expandAll}>
                  <i className="bi bi-arrows-expand me-1" />{t('cashier.expand')}
                </button>
              </div>
            </div>
          )}
        </div>
            {/* ── Grouped table view (main) ── */}
            {tab === 'orders' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {tableGroups.length === 0 && (
                  <div className="ff-empty-state">
                    <i className="bi bi-check2-circle ff-empty-state-icon" />
                    <div className="ff-empty-state-title">{t('cashier.empty.tables')}</div>
                    <div className="ff-empty-state-desc">{t('cashier.empty.tablesDesc')}</div>
                  </div>
                )}
                {filteredGroups.map((group) => (
                  <TableGroupCard
                    key={group.table.id}
                    group={group}
                    collapsed={collapsedTables.has(group.table.id)}
                    onToggleCollapse={() => toggleTableCollapse(group.table.id)}
                    expandedCustomers={expandedCustomers}
                    onToggleCustomer={toggleCustomer}
                    onPayTable={() =>
                      setPayContext({
                        kind: 'table',
                        tableId: group.table.id,
                        tableNumber: group.table.number,
                        remaining: group.remaining,
                        totalDue: group.totalDue,
                        totalPaid: group.totalPaid,
                      })
                    }
                    onPayTablePartial={() =>
                      setPayContext({
                        kind: 'table',
                        tableId: group.table.id,
                        tableNumber: group.table.number,
                        remaining: group.remaining,
                        totalDue: group.totalDue,
                        totalPaid: group.totalPaid,
                        initialMode: 'partial',
                      })
                    }
                    onPayCustomer={(name) => {
                      const cust = group.customers.find((x) => x.name === name)!;
                      setPayContext({ kind: 'customer', tableId: group.table.id, tableNumber: group.table.number, customerName: name, remaining: cust.remaining, totalDue: cust.totalDue, totalPaid: cust.totalPaid });
                    }}
                    onPayCustomerPartial={(name) => {
                      const cust = group.customers.find((x) => x.name === name)!;
                      setPayContext({ kind: 'customer', tableId: group.table.id, tableNumber: group.table.number, customerName: name, remaining: cust.remaining, totalDue: cust.totalDue, totalPaid: cust.totalPaid, initialMode: 'partial' });
                    }}
                  />
                ))}
                {tableSearch && filteredGroups.length === 0 && tableGroups.length > 0 && (
                  <div className="text-muted text-center py-4">Nenhuma mesa encontrada para "{tableSearch}"</div>
                )}
              </div>
            )}

            {/* ── Kiosk — pedidos en efectivo ── */}
            {tab === 'kiosk' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {/* ── Kiosk alerts panel ── */}
                <KioskAlertsPanel
                  alerts={kioskAlerts}
                  onResolve={handleResolveAlert}
                  labelAlerts={t('cashier.kiosk.alerts')}
                  labelResolve={t('cashier.kiosk.resolve')}
                  labelNeedsHelp={t('cashier.kiosk.needsHelp')}
                  labelPrintFailed={t('cashier.kiosk.printFailed')}
                  labelTotemN={t('cashier.kiosk.totemN')}
                  labelNoAlerts={t('cashier.kiosk.noAlerts')}
                />

                {/* Toggle pendientes / pagados */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    style={{ flex: 1, padding: '10px', border: `2px solid ${kioskView === 'pending' ? '#d97706' : '#e5e7eb'}`, borderRadius: 10, background: kioskView === 'pending' ? '#fffbeb' : '#fff', color: kioskView === 'pending' ? '#d97706' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    onClick={() => setKioskView('pending')}
                  >
                    <i className="bi bi-hourglass-split me-1" />Pendientes
                    {pendingKioskOrders.length > 0 && (
                      <span style={{ marginLeft: 6, background: '#d97706', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>{pendingKioskOrders.length}</span>
                    )}
                  </button>
                  <button
                    style={{ flex: 1, padding: '10px', border: `2px solid ${kioskView === 'paid' ? '#059669' : '#e5e7eb'}`, borderRadius: 10, background: kioskView === 'paid' ? '#f0fdf4' : '#fff', color: kioskView === 'paid' ? '#059669' : '#6b7280', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
                    onClick={() => setKioskView('paid')}
                  >
                    <i className="bi bi-check-circle me-1" />Pagados hoy
                    {paidKioskOrders.length > 0 && (
                      <span style={{ marginLeft: 6, background: '#059669', color: '#fff', borderRadius: 999, padding: '1px 7px', fontSize: 11 }}>{paidKioskOrders.length}</span>
                    )}
                  </button>
                </div>

                {/* Vista pendientes */}
                {kioskView === 'pending' && pendingKioskOrders.length === 0 && (
                  <div className="ff-empty-state">
                    <i className="bi bi-display ff-empty-state-icon" />
                    <div className="ff-empty-state-title">Sin pedidos pendientes</div>
                    <div className="ff-empty-state-desc">Los pedidos en efectivo del kiosk aparecen acá para cobrar.</div>
                  </div>
                )}
                {kioskView === 'pending' && pendingKioskOrders.map((order) => (
                  <KioskPendingCard key={order.id} order={order} onPay={() => setKioskPayOrder(order)} />
                ))}

                {/* Vista pagados */}
                {kioskView === 'paid' && paidKioskOrders.length === 0 && (
                  <div className="ff-empty-state">
                    <i className="bi bi-check-circle ff-empty-state-icon" />
                    <div className="ff-empty-state-title">Sin pagados hoy</div>
                    <div className="ff-empty-state-desc">Los pedidos cobrados hoy aparecen acá.</div>
                  </div>
                )}
                {kioskView === 'paid' && paidKioskOrders.map((order) => (
                  <KioskPaidCard key={order.id} order={order} />
                ))}
              </div>
            )}

            {/* ── Payment history ── */}
            {tab === 'history' && (
              <div className="ff-data-card">
                {allPayments.length === 0 && (
                  <div className="text-center text-muted py-4">{t('cashier.empty.history')}</div>
                )}
                <div className="ff-csh-table-scroll">
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label={t('cashier.col.order')}    colKey="orderNumber"  sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.customer')} colKey="customerName" sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.table')}    colKey="tableNumber"  sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.total')}    colKey="total"        sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.paid')}     colKey="paidAmount"   sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.method')}   colKey="method"       sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <SortTh label={t('cashier.col.status')}   colKey="status"       sort={histSort} onSort={(k) => toggleSort(histSort, k, setHistSort)} />
                      <th>{t('cashier.col.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(allPayments, histSort.key, histSort.dir).map((p) => (
                      <tr key={p.id}>
                        <td>{p.orderNumber}</td>
                        <td>{p.customerName}</td>
                        <td>{p.tableNumber ?? '—'}</td>
                        <td>{formatBRL(p.total)}</td>
                        <td style={{ color: '#059669' }}>{formatBRL(p.paidAmount)}</td>
                        <td>{p.method ? (methodLabel[p.method] ?? p.method) : '—'}</td>
                        <td>
                          <span className={`badge ${p.status === 'PAID' ? 'bg-success' : p.status === 'PARTIALLY_PAID' ? 'bg-warning text-dark' : 'bg-secondary'}`}>
                            {p.status === 'PAID' ? t('cashier.status.paid') : p.status === 'PARTIALLY_PAID' ? t('cashier.status.partial') : t('cashier.status.pending')}
                          </span>
                        </td>
                        <td style={{ display: 'flex', gap: 4 }}>
                          {(p.status === 'PAID' || p.status === 'PARTIALLY_PAID') && (
                            <>
                              <button className="btn btn-sm btn-outline-secondary" title="Gerar recibo" onClick={() => handleGenerateReceipt(p.id)}>
                                <i className="bi bi-receipt" />
                              </button>
                              <button className="btn btn-sm btn-outline-secondary" title="Gerar nota fiscal" onClick={() => handleGenerateInvoice(p.id)}>
                                <i className="bi bi-file-earmark-text" />
                              </button>
                            </>
                          )}
                          {(p.status === 'UNPAID' || p.status === 'PARTIALLY_PAID') && (
                            <button className="btn btn-sm btn-primary" onClick={() => { setSelectedPayment(p); setShowPayModal(true); }}>
                              {t('cashier.table.receive')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* ── Receipts ── */}
            {tab === 'receipts' && (
              <div className="ff-data-card">
                {receipts.length === 0 && <div className="text-center text-muted py-4">{t('cashier.empty.receipts')}</div>}
                <div className="ff-csh-table-scroll">
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label={t('cashier.col.number')} colKey="number"    sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label={t('cashier.col.total')}  colKey="total"     sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label={t('cashier.col.method')} colKey="method"    sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <SortTh label={t('cashier.col.date')}   colKey="createdAt" sort={recSort} onSort={(k) => toggleSort(recSort, k, setRecSort)} />
                      <th>{t('cashier.col.actions')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(receipts, recSort.key, recSort.dir).map((r) => (
                      <tr key={r.id}>
                        <td><strong>{r.number}</strong></td>
                        <td>{formatBRL(r.total)}</td>
                        <td>{methodLabel[r.method] ?? r.method}</td>
                        <td>{formatDateTime(r.createdAt)}</td>
                        <td>
                          <button className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedReceipt(r)}>
                            <i className="bi bi-eye me-1" />Ver
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* ── Invoices ── */}
            {tab === 'invoices' && (
              <div className="ff-data-card">
                {invoices.length === 0 && <div className="text-center text-muted py-4">{t('cashier.empty.invoices')}</div>}
                <div className="ff-csh-table-scroll">
                <table className="ff-orders-table">
                  <thead>
                    <tr>
                      <SortTh label={t('cashier.col.number')}   colKey="number"      sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label={t('cashier.col.customer')} colKey="customerName" sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label={t('cashier.col.total')}    colKey="total"        sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label={t('cashier.col.status')}   colKey="status"       sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                      <SortTh label={t('cashier.col.date')}     colKey="createdAt"    sort={invSort} onSort={(k) => toggleSort(invSort, k, setInvSort)} />
                    </tr>
                  </thead>
                  <tbody>
                    {sortRows(invoices, invSort.key, invSort.dir).map((inv) => (
                      <tr key={inv.id}>
                        <td><strong>{inv.number}</strong></td>
                        <td>{inv.customerName}</td>
                        <td>{formatBRL(inv.total)}</td>
                        <td><span className="badge bg-success">{inv.status}</span></td>
                        <td>{formatDateTime(inv.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              </div>
            )}

            {/* ── Legacy tables tab ── */}
            {tab === 'tables' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {tables.length === 0 && <div className="text-muted">{t('cashier.empty.pendingTables')}</div>}
                {tables.map((tbl) => {
                  const tablePays = allPayments.filter((p) => p.tableId === tbl.id);
                  const totalDue = tablePays.reduce((s, p) => s + p.total, 0);
                  const totalPaid = tablePays.reduce((s, p) => s + (p.paidAmount ?? 0), 0);
                  const remaining = +(totalDue - totalPaid).toFixed(2);
                  return (
                    <div key={tbl.id} className="ff-data-card" style={{ borderLeft: `4px solid ${tbl.status === 'CLOSED' ? '#6b7280' : '#7c3aed'}` }}>
                      <div className="ff-data-card-header" style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <span className="ff-data-card-title">Mesa {tbl.number}</span>
                        <span style={{ fontSize: 12, color: '#6b7280' }}>{TABLE_STATUS_LABEL[tbl.status] ?? tbl.status}</span>
                      </div>
                      {totalDue > 0 && (
                        <div style={{ padding: '8px 16px', fontSize: 13, display: 'flex', gap: 20 }}>
                          <span>Total: <strong>{formatBRL(totalDue)}</strong></span>
                          {totalPaid > 0 && <span style={{ color: '#059669' }}>Pago: <strong>{formatBRL(totalPaid)}</strong></span>}
                          <span style={{ color: remaining > 0 ? '#e11d2a' : '#059669', fontWeight: 700 }}>Restante: {formatBRL(remaining)}</span>
                        </div>
                      )}
                      {tbl.status === 'CLOSED' && (
                        <div style={{ padding: '8px 16px', borderTop: '1px solid #e5e7eb' }}>
                          <button className="btn btn-sm btn-outline-secondary w-100" onClick={() => handleResetTable(tbl.id)}>
                            <i className="bi bi-arrow-repeat me-1" />Liberar mesa
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
      </AdminLayout>

      {payContext && (
        <PayModal
          title={payContext.kind === 'table'
            ? `Receber — Mesa ${payContext.tableNumber}`
            : `Receber — ${payContext.customerName}`}
          subtitle={payContext.kind === 'table'
            ? `Mesa ${payContext.tableNumber} · ${tableGroups.find((g) => g.table.id === payContext.tableId)?.customers.length ?? 0} cliente(s)`
            : `Mesa ${payContext.tableNumber} · ${payContext.customerName}`}
          totalDue={payContext.totalDue}
          paidAmount={payContext.totalPaid}
          initialMode={payContext.initialMode}
          onClose={() => setPayContext(null)}
          onPay={handlePayContext}
        />
      )}

      {showPayModal && selectedPayment && (
        <PayModal
          title={t('cashier.table.receive')}
          subtitle={`${selectedPayment.orderNumber} · ${selectedPayment.customerName}${selectedPayment.tableNumber ? ` · Mesa ${selectedPayment.tableNumber}` : ''}`}
          totalDue={selectedPayment.total}
          paidAmount={selectedPayment.paidAmount ?? 0}
          onClose={() => { setShowPayModal(false); setSelectedPayment(null); }}
          onPay={handlePaySingle}
        />
      )}

      {selectedReceipt && (
        <ReceiptModal receipt={selectedReceipt} onClose={() => setSelectedReceipt(null)} />
      )}

      {kioskPayOrder && (
        <KioskPayModal
          order={kioskPayOrder}
          onClose={() => setKioskPayOrder(null)}
          onConfirm={handlePayKioskOrder}
        />
      )}
    </>
  );
}
