import { useNavigate } from 'react-router-dom';
import { I18nProvider } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin/AdminLanguageSelector';
import type { LanguageCode } from '@/i18n/labels';
import { fmtElapsed, elapsedMins } from '@/lib/utils/useElapsed';
import type { FloorTable } from '@/lib/services/waiterStaffService';
import { CALL_REASON_LABEL, QUICK_FILTER_DEFS, quickFilterCount } from './waiterUtils';
import { ZoneSection } from './ZoneSection';
import { ReassignModal } from './ReassignModal';
import { CallCard } from './CallCard';
import { useWaiterTables } from './useWaiterTables';
import './waiter.css';

export function WaiterTablesPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <WaiterTablesInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function WaiterTablesInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const navigate = useNavigate();
  const {
    floorTables, waiters, activeTab, setActiveTab,
    search, setSearch, zoneFilter, setZoneFilter, waiterFilter, setWaiterFilter,
    quickFilter, setQuickFilter, reassignTarget, setReassignTarget,
    showResolved, setShowResolved, muteAlerts, setMuteAlerts,
    zones, waiterNames, activeCalls, resolvedCalls, totalAlerts,
    filtered, tablesByZone, ungrouped, sortedTables,
    load, handleRequestBill, handleOpen, handleMarkServed, handleClose,
    handleAssignWaiter, handleAck, handleResolve,
    pendingCalls,
  } = useWaiterTables();

  const cardProps = {
    onRequestBill: handleRequestBill,
    onOpen:        handleOpen,
    onMarkServed:  handleMarkServed,
    onClose:       handleClose,
    onReassign:    setReassignTarget,
    onDetail:      (t: FloorTable) => navigate(`/waiter-staff/tables/${t.id}`),
  };

  return (
    <div className="ff-area-layout">
      {/* Sidebar */}
      <aside className="ff-area-sidebar ff-area-sidebar--mobile-bottom">
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-person-badge me-2" />Garçom
        </div>
        <nav className="ff-area-sidebar-nav">
          <button className={`ff-nav-item${activeTab === 'floor' ? ' active' : ''}`} onClick={() => setActiveTab('floor')}>
            <i className="bi bi-grid-3x3-gap" />Mesas
            {totalAlerts > 0 && <span className="ff-nav-badge ff-nav-badge--warn">{totalAlerts}</span>}
          </button>
          <button className={`ff-nav-item${activeTab === 'calls' ? ' active' : ''}`} onClick={() => setActiveTab('calls')}>
            <i className="bi bi-bell" />Chamados
            {pendingCalls.length > 0 && <span className="ff-nav-badge ff-nav-badge--danger">{pendingCalls.length}</span>}
          </button>
          <button className="ff-nav-item" onClick={() => navigate('/')}>
            <i className="bi bi-house" />Hub
          </button>
        </nav>
      </aside>

      <div className="ff-area-main ff-area-main--mobile-bottom-pad" style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
        {/* Topbar */}
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">
            {activeTab === 'floor' ? 'Mesas' : 'Chamados de garçom'}
          </span>
          <div className="ms-auto d-flex align-items-center gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              style={{ borderRadius: 8, padding: '5px 10px' }}
              title={muteAlerts ? 'Alertas silenciados' : 'Silenciar alertas'}
              onClick={() => setMuteAlerts((v) => !v)}
            >
              <i className={`bi bi-bell${muteAlerts ? '-slash' : ''}`} style={{ color: muteAlerts ? '#9ca3af' : undefined }} />
            </button>
            <button className="btn btn-sm btn-outline-secondary" style={{ borderRadius: 8, padding: '5px 10px' }} onClick={load} title="Atualizar">
              <i className="bi bi-arrow-clockwise" />
            </button>
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
        </div>

        {activeTab === 'floor' && (
          <>
            {/* Filter bar */}
            <div className="ff-waiter-filter-bar">
              <div className="ff-waiter-filter-chips">
                {QUICK_FILTER_DEFS.map((f) => {
                  const count    = quickFilterCount(f.key, floorTables);
                  const isActive = quickFilter === f.key;
                  const color    = f.color ?? '#1d4ed8';
                  return (
                    <button
                      key={f.key}
                      style={{
                        display: 'inline-flex', alignItems: 'center', gap: 5,
                        background: isActive ? color : '#f3f4f6',
                        color: isActive ? '#fff' : (f.color ?? '#374151'),
                        border: `1.5px solid ${isActive ? color : 'transparent'}`,
                        borderRadius: 20, padding: '4px 12px',
                        fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                        flexShrink: 0,
                      }}
                      onClick={() => setQuickFilter(f.key)}
                    >
                      <i className={`bi ${f.icon}`} style={{ fontSize: '0.72rem' }} />
                      {f.label}
                      <span style={{ background: isActive ? 'rgba(255,255,255,.25)' : `${color}20`, color: isActive ? '#fff' : color, borderRadius: 10, padding: '0 6px', fontSize: '0.7rem', fontWeight: 800, minWidth: 18, textAlign: 'center' }}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="ff-waiter-filter-secondary">
                <div className="ff-waiter-search-wrap">
                  <i className="bi bi-search ff-waiter-search-icon" />
                  <input
                    className="form-control form-control-sm"
                    style={{ paddingLeft: 28, width: 130, borderRadius: 8 }}
                    placeholder="Nº mesa..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>

                {zones.map((z) => (
                  <button
                    key={z}
                    style={{
                      background: zoneFilter === z ? '#1d4ed8' : '#f3f4f6',
                      color: zoneFilter === z ? '#fff' : '#374151',
                      border: 'none', borderRadius: 8, padding: '5px 12px',
                      fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', transition: 'all .12s',
                    }}
                    onClick={() => setZoneFilter(zoneFilter === z ? 'all' : z)}
                  >
                    {z}
                  </button>
                ))}

                {waiterNames.length > 0 && (
                  <select
                    className="form-select form-select-sm"
                    style={{ width: 170, borderRadius: 8 }}
                    value={waiterFilter}
                    onChange={(e) => setWaiterFilter(e.target.value)}
                  >
                    <option value="all">Todos os garçons</option>
                    {waiterNames.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                )}
              </div>
            </div>

            {/* Floor content */}
            <div className="ff-area-content" style={{ overflowY: 'auto' }}>
              {filtered.length === 0 ? (
                <div className="ff-empty-state">
                  <i className="bi bi-grid ff-empty-state-icon" />
                  <span className="ff-empty-state-title">Nenhuma mesa encontrada</span>
                  <span className="ff-empty-state-desc">Tente ajustar os filtros para ver mais mesas.</span>
                </div>
              ) : (
                <>
                  {[...tablesByZone.entries()].map(([zone, tables]) => (
                    <ZoneSection key={zone} zone={zone} tables={sortedTables(tables)} cardProps={cardProps} />
                  ))}
                  {ungrouped.length > 0 && (
                    <ZoneSection zone="Sem zona" tables={sortedTables(ungrouped)} cardProps={cardProps} />
                  )}
                </>
              )}
            </div>
          </>
        )}

        {activeTab === 'calls' && (
          <div className="ff-area-content" style={{ overflowY: 'auto' }}>
            <div style={{ maxWidth: 680 }}>
              {activeCalls.length === 0 && (
                <div className="ff-empty-state" style={{ paddingTop: 48 }}>
                  <i className="bi bi-bell-slash ff-empty-state-icon" />
                  <span className="ff-empty-state-title">Nenhum chamado pendente</span>
                  <span className="ff-empty-state-desc">Todos os chamados estão resolvidos.</span>
                </div>
              )}
              {activeCalls.map((call) => (
                <CallCard
                  key={call.id}
                  call={call}
                  onAck={handleAck}
                  onResolve={handleResolve}
                  onViewTable={(id) => navigate(`/waiter-staff/tables/${id}`)}
                />
              ))}

              {resolvedCalls.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <button
                    style={{ background: 'none', border: 'none', fontSize: '0.82rem', color: '#9ca3af', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5, padding: 0 }}
                    onClick={() => setShowResolved((v) => !v)}
                  >
                    <i className={`bi bi-chevron-${showResolved ? 'up' : 'down'}`} style={{ fontSize: '0.72rem' }} />
                    {showResolved ? 'Ocultar' : 'Ver'} {resolvedCalls.length} chamado{resolvedCalls.length > 1 ? 's' : ''} resolvido{resolvedCalls.length > 1 ? 's' : ''}
                  </button>
                  {showResolved && (
                    <div style={{ marginTop: 10, opacity: 0.55 }}>
                      {resolvedCalls.map((call) => (
                        <div key={call.id} style={{ background: '#fff', border: '1px solid #e5e7eb', borderLeft: '4px solid #e5e7eb', borderRadius: 10, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                          <i className="bi bi-check-circle-fill" style={{ color: '#6b7280' }} />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#374151' }}>Mesa {call.tableNumber}</span>
                          {call.reason && <span style={{ fontSize: '0.78rem', color: '#9ca3af' }}>{CALL_REASON_LABEL[call.reason] ?? call.reason}</span>}
                          <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#9ca3af' }}>{fmtElapsed(elapsedMins(call.updatedAt))} atrás</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {reassignTarget && (
        <ReassignModal
          table={reassignTarget}
          waiters={waiters}
          onSave={handleAssignWaiter}
          onClose={() => setReassignTarget(null)}
        />
      )}
    </div>
  );
}
