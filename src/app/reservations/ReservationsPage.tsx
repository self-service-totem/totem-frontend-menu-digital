import { useNavigate } from 'react-router-dom';
import { I18nProvider, useLabels } from '@/i18n/I18nContext';
import { useAdminLanguage } from '@/i18n/useAdminLanguage';
import { AdminLanguageSelector } from '@/components/admin';
import type { LanguageCode } from '@/i18n/labels';
import { STATUS_CONFIG, EMPTY_FORM } from './reservationsUtils';
import { AgendaView } from './AgendaView';
import { ReservationTableView } from './ReservationTableView';
import { ByTableView } from './ByTableView';
import { WalkInPanel } from './WalkInPanel';
import { SettingsPanel } from './SettingsPanel';
import { OccupancyView } from './OccupancyView';
import { ReservationModal } from './ReservationModal';
import { AddWalkInModal } from './AddWalkInModal';
import { useReservations } from './useReservations';
import type { ReservationStatus } from '@/lib/types';
import './reservations.css';

export function ReservationsPage() {
  const { lang, setLang } = useAdminLanguage();
  return (
    <I18nProvider language={lang}>
      <ReservationsInner lang={lang} onLangChange={setLang} />
    </I18nProvider>
  );
}

function ReservationsInner({ lang, onLangChange }: { lang: LanguageCode; onLangChange: (l: LanguageCode) => void }) {
  const { t } = useLabels();
  const navigate = useNavigate();
  const {
    tab, setTab, view, setView, dateScope, setDateScope,
    reservations, walkIns, settings, tables,
    date, setDate, search, setSearch, filterStatus, setFilterStatus,
    showModal, setShowModal, editTarget, setEditTarget,
    showWalkInModal, setShowWalkInModal, drawerOpen, setDrawerOpen,
    filtered, todayStr, initialDate, tabs, views,
    handleCreate, handleEdit, handleStatusChange,
    handleWalkInSeat, handleWalkInCancel, handleAddWalkIn, handleSaveSettings,
  } = useReservations();

  return (
    <div className="ff-area-layout">
      {drawerOpen && <div className="ff-area-drawer-backdrop ff-area-drawer-backdrop--open" onClick={() => setDrawerOpen(false)} />}

      <aside className={`ff-area-sidebar${drawerOpen ? ' ff-area-sidebar--open' : ''}`}>
        <button className="ff-area-sidebar-close" onClick={() => setDrawerOpen(false)} aria-label={t('res.closeMenu')}>
          <i className="bi bi-x-lg" />
        </button>
        <div className="ff-area-sidebar-logo">
          <i className="bi bi-calendar-check me-2" />{t('res.title')}
        </div>
        <nav className="ff-area-sidebar-nav">
          {tabs.map((tb) => (
            <button key={tb.id} className={`ff-nav-item${tab === tb.id ? ' active' : ''}`} onClick={() => { setTab(tb.id); setDrawerOpen(false); }}>
              <i className={`bi ${tb.icon}`} />
              {tb.label}
              {tb.badge ? <span className="ff-nav-item-badge">{tb.badge}</span> : null}
            </button>
          ))}
          <hr style={{ margin: '8px 0', borderColor: 'rgba(255,255,255,.1)' }} />
          <button className="ff-nav-item" onClick={() => { navigate('/'); setDrawerOpen(false); }}>
            <i className="bi bi-house" />{t('res.hub')}
          </button>
        </nav>
      </aside>

      <div className="ff-area-main">
        {/* Topbar */}
        <div className="ff-area-topbar ff-res-topbar-sticky">
          <button className="ff-area-hamburger" onClick={() => setDrawerOpen(true)} aria-label={t('res.openMenu')}>
            <i className="bi bi-list" />
          </button>
          <span className="ff-area-topbar-title">
            {tab === 'reservations' && t('res.title')}
            {tab === 'walkin'       && t('res.walkin.queue')}
            {tab === 'occupancy'    && t('res.topbar.occupancy')}
            {tab === 'settings'     && t('res.topbar.settings')}
          </span>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10 }}>
            {tab === 'reservations' && (
              <button className="btn btn-sm btn-primary" onClick={() => setShowModal(true)}>
                <i className="bi bi-plus-lg me-1" />{t('res.newReservation')}
              </button>
            )}
            <AdminLanguageSelector language={lang} onChange={onLangChange} />
          </div>
        </div>

        {/* Sub-controls — Reservations tab only */}
        {tab === 'reservations' && (
          <div className="ff-res-controls">
            <div className="ff-res-controls-row">
              <div className="ff-res-view-switcher">
                {views.map((v) => (
                  <button key={v.id} className={`ff-res-view-btn${view === v.id ? ' active' : ''}`} onClick={() => setView(v.id)}>
                    <i className={`bi ${v.icon}`} />{v.label}
                  </button>
                ))}
              </div>
              <div className="ff-res-date-scope">
                <button className={`ff-res-scope-btn${dateScope === 'today' ? ' active' : ''}`} onClick={() => setDateScope('today')}>{t('res.today')}</button>
                <button className={`ff-res-scope-btn${dateScope === 'date'  ? ' active' : ''}`} onClick={() => setDateScope('date')}>
                  <i className="bi bi-calendar3 me-1" />{t('res.scope.date')}
                </button>
                {dateScope === 'date' && (
                  <input type="date" className="form-control form-control-sm ff-res-date-input" value={date} onChange={(e) => setDate(e.target.value)} />
                )}
                <button className={`ff-res-scope-btn${dateScope === 'all' ? ' active' : ''}`} onClick={() => setDateScope('all')}>{t('res.scope.all')}</button>
              </div>
            </div>

            <div className="ff-res-controls-row" style={{ marginTop: 10 }}>
              <div className="ff-res-search-wrapper" style={{ position: 'relative', flex: 1, minWidth: 160 }}>
                <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.83rem', pointerEvents: 'none' }} />
                <input
                  className="form-control form-control-sm"
                  style={{ paddingLeft: 28, width: '100%' }}
                  placeholder={t('res.searchPlaceholder')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <select
                className="form-select form-select-sm"
                style={{ width: 155, flexShrink: 0 }}
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as ReservationStatus | '')}
              >
                <option value="">{t('res.allStatuses')}</option>
                {(Object.keys(STATUS_CONFIG) as ReservationStatus[]).map((s) => (
                  <option key={s} value={s}>{t(STATUS_CONFIG[s].labelKey)}</option>
                ))}
              </select>
            </div>

            {view === 'agenda' && (
              <div className="ff-res-chip-row">
                {(['', 'PENDING', 'CONFIRMED', 'SEATED', 'COMPLETED', 'CANCELED', 'NO_SHOW'] as const).map((s) => (
                  <button key={s || 'all'} className={`ff-res-chip${filterStatus === s ? ' active' : ''}`} onClick={() => setFilterStatus(s)}>
                    {s === '' ? t('res.scope.all') : (
                      <>
                        <i className={`bi ${STATUS_CONFIG[s].icon}`} style={{ fontSize: 11, color: filterStatus === s ? 'inherit' : STATUS_CONFIG[s].accent }} />
                        {t(STATUS_CONFIG[s].labelKey)}
                      </>
                    )}
                    {s !== '' && (
                      <span style={{ background: filterStatus === s ? 'rgba(255,255,255,.2)' : '#e5e7eb', color: filterStatus === s ? '#fff' : '#6b7280', borderRadius: 10, padding: '0 5px', fontSize: 10, fontWeight: 800, marginLeft: 2 }}>
                        {reservations.filter((r) => r.status === s).length}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="ff-area-content">
          {tab === 'reservations' && (
            <>
              {view === 'agenda' && (
                <AgendaView filtered={filtered} todayStr={todayStr} tables={tables} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
              {view === 'table' && (
                <ReservationTableView reservations={filtered} tables={tables} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
              {view === 'by-table' && (
                <ByTableView reservations={filtered} tables={tables} settings={settings} onStatusChange={handleStatusChange} onEdit={(r) => setEditTarget(r)} />
              )}
            </>
          )}
          {tab === 'walkin'    && <WalkInPanel walkIns={walkIns} tables={tables} onSeat={handleWalkInSeat} onCancel={handleWalkInCancel} onAdd={() => setShowWalkInModal(true)} />}
          {tab === 'occupancy' && <OccupancyView tables={tables} settings={settings} />}
          {tab === 'settings'  && <SettingsPanel settings={settings} onSave={handleSaveSettings} />}
        </div>
      </div>

      {showModal && (
        <ReservationModal
          title={t('res.newReservation')}
          initial={{ ...EMPTY_FORM, date: initialDate }}
          tables={tables}
          onConfirm={handleCreate}
          onClose={() => setShowModal(false)}
        />
      )}
      {editTarget && (
        <ReservationModal
          title={t('res.action.editReservation')}
          initial={{
            customerName: editTarget.customerName, customerPhone: editTarget.customerPhone,
            partySize: String(editTarget.partySize), date: editTarget.date, time: editTarget.time,
            notes: editTarget.notes ?? '', tableId: editTarget.tableId ?? '',
            source: editTarget.source ?? 'PHONE', duration: String(editTarget.duration ?? 90),
            tags: editTarget.tags ?? [],
          }}
          tables={tables}
          onConfirm={handleEdit}
          onClose={() => setEditTarget(null)}
          readOnly={['COMPLETED', 'CANCELED', 'NO_SHOW'].includes(editTarget.status)}
        />
      )}
      {showWalkInModal && <AddWalkInModal onConfirm={handleAddWalkIn} onClose={() => setShowWalkInModal(false)} />}
    </div>
  );
}
