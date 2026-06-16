import { useEffect, useMemo, useState } from 'react';
import { kioskDeviceService } from '@/lib/services/adminService';
import { loadAttractConfig, saveAttractConfig } from '@/app/kiosk/attractConfig';
import type { KioskDevice } from '@/lib/types';
import type { AttractScreenConfig } from '@/app/kiosk/attractConfig';
import { formatDate } from '../adminUtils';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminBadge,
  AdminTable,
  AdminSearchInput,
  AdminFilterBar,
  AdminFormSection,
  AdminFormRow,
  AdminButton,
  AdminIconButton,
  AdminActionMenu,
  DirtySaveBar,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir, FilterOption, ActionMenuItem } from '@/components/admin';

type KioskTab = 'devices' | 'attract' | 'branding' | 'media' | 'behavior';

const STATUS_VARIANT: Record<string, 'active' | 'preparing' | 'inactive'> = {
  ONLINE:      'active',
  OFFLINE:     'inactive',
  MAINTENANCE: 'preparing',
};

function relativeTime(iso: string, labels: { now: string; min: string; hour: string; day: string }): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return labels.now;
  if (mins < 60) return `${mins}${labels.min}`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}${labels.hour}`;
  return `${Math.floor(h / 24)}${labels.day}`;
}

export function Kiosks() {
  const { t } = useLabels();
  const [devices, setDevices]           = useState<KioskDevice[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]         = useState<KioskDevice | null>(null);
  const [activeTab, setActiveTab]       = useState<KioskTab>('devices');
  const [sortBy, setSortBy]             = useState('name');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');

  const [cfg, setCfg]           = useState<AttractScreenConfig>(loadAttractConfig);
  const [savedCfg, setSavedCfg] = useState<AttractScreenConfig>(loadAttractConfig);
  const [saving, setSaving]     = useState(false);

  const isDirty = JSON.stringify(cfg) !== JSON.stringify(savedCfg);

  const STATUS_LABEL: Record<string, string> = {
    ONLINE:      t('status.online'),
    OFFLINE:     t('status.offline'),
    MAINTENANCE: t('status.maintenance'),
  };

  const TABS: { key: KioskTab; label: string; icon: string }[] = [
    { key: 'devices',  label: t('adminKiosks.tabDevices'),      icon: 'bi-display'     },
    { key: 'attract',  label: t('adminKiosks.tabAttractScreen'), icon: 'bi-play-circle' },
    { key: 'branding', label: t('adminKiosks.tabBranding'),      icon: 'bi-palette'     },
    { key: 'media',    label: t('adminKiosks.tabMedia'),         icon: 'bi-film'        },
    { key: 'behavior', label: t('adminKiosks.tabBehavior'),      icon: 'bi-sliders'     },
  ];

  const timeLabels = {
    now:  t('adminKiosks.nowAgo'),
    min:  t('adminKiosks.minAgo'),
    hour: t('adminKiosks.hourAgo'),
    day:  t('adminKiosks.dayAgo'),
  };

  useEffect(() => {
    kioskDeviceService.list().then((list) => { setDevices(list); setLoading(false); });
  }, []);

  function setCfgKey<K extends keyof AttractScreenConfig>(key: K, value: AttractScreenConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
  }

  function handleDiscard() { setCfg({ ...savedCfg }); }

  async function handleSave() {
    setSaving(true);
    saveAttractConfig(cfg);
    setSavedCfg({ ...cfg });
    setSaving(false);
  }

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  }

  const online      = devices.filter((d) => d.status === 'ONLINE').length;
  const offline     = devices.filter((d) => d.status === 'OFFLINE').length;
  const maintenance = devices.filter((d) => d.status === 'MAINTENANCE').length;

  const statusOptions: FilterOption[] = [
    { key: 'all',         label: t('adminKiosks.filterAll'),         count: devices.length },
    { key: 'ONLINE',      label: t('adminKiosks.filterOnline'),      count: online         },
    { key: 'OFFLINE',     label: t('adminKiosks.filterOffline'),     count: offline        },
    ...(maintenance > 0 ? [{ key: 'MAINTENANCE', label: t('adminKiosks.filterMaintenance'), count: maintenance }] : []),
  ];

  const filtered = useMemo(() =>
    devices
      .filter((d) => statusFilter === 'all' || d.status === statusFilter)
      .filter((d) => !search || d.name.toLowerCase().includes(search.toLowerCase())),
    [devices, statusFilter, search],
  );

  const sorted = useSortable(filtered, sortBy, sortDir);

  function deviceActions(d: KioskDevice): ActionMenuItem[] {
    return [
      { key: 'inspect', label: t('adminKiosks.viewDetails'),    icon: 'bi-eye',             onClick: () => setSelected(d) },
      { key: 'reload',  label: t('adminKiosks.reloadConfig'),   icon: 'bi-arrow-clockwise',  onClick: () => {} },
      { key: 'toggle',  label: d.status === 'ONLINE' ? t('common.disable') : t('common.enable'),
        icon: d.status === 'ONLINE' ? 'bi-toggle-off' : 'bi-toggle-on',
        onClick: () => {},
      },
      { key: 'preview', label: t('adminKiosks.previewBtn'),     icon: 'bi-display',          onClick: () => {} },
      { key: 'remove',  label: t('adminKiosks.removeDevice'),   icon: 'bi-trash',            variant: 'destructive', onClick: () => {} },
    ];
  }

  const deviceColumns: AdminTableColumn<KioskDevice>[] = [
    {
      key: 'name',
      label: t('adminKiosks.colDevice'),
      sortable: true,
      render: (d) => (
        <div>
          <div className="ff-table-row-title">{d.name}</div>
          <div className="ff-table-row-sub ff-kiosks-device-id">{t('adminKiosks.colId')} {d.id.slice(0, 8)}…</div>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      sortable: true,
      width: '120px',
      render: (d) => (
        <AdminBadge
          variant={STATUS_VARIANT[d.status] ?? 'inactive'}
          label={STATUS_LABEL[d.status] ?? d.status}
        />
      ),
    },
    {
      key: 'updatedAt',
      label: t('adminKiosks.colLastActivity'),
      sortable: true,
      width: '160px',
      className: 'ff-hide-mobile',
      render: (d) => <span className="ff-table-date">{relativeTime(d.updatedAt, timeLabels)}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: '48px',
      align: 'right',
      render: (d) => (
        <AdminActionMenu items={deviceActions(d)} />
      ),
    },
  ];

  return (
    <div className="ff-kiosks-screen">

      <div className="ff-kiosks-sticky-bar">
        <AdminPageHeader
          title={t('adminKiosks.title')}
          subtitle={`${online} online · ${offline} offline`}
          actions={
            <>
              <AdminButton variant="outline" size="sm" icon="bi-eye" onClick={() => setActiveTab('attract')}>
                {t('adminKiosks.previewLabel')}
              </AdminButton>
              <AdminButton variant="primary" size="sm" icon="bi-plus">
                {t('adminKiosks.addKiosk')}
              </AdminButton>
            </>
          }
        />

        <div className="ff-admin-toolbar">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('adminKiosks.searchPlaceholder')}
          />
          <AdminFilterBar options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          <div className="ff-admin-toolbar-right">
            <AdminIconButton
              icon="bi-arrow-clockwise"
              variant="ghost"
              title={t('adminKiosks.reloadConfig')}
              onClick={() => {
                setLoading(true);
                kioskDeviceService.list().then((list) => { setDevices(list); setLoading(false); });
              }}
            />
          </div>
        </div>

        <div className="ff-kiosks-tabs" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`ff-kiosks-tab${activeTab === tab.key ? ' ff-kiosks-tab--active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
              type="button"
            >
              <i className={`bi ${tab.icon}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'devices' && (
        <div className={`ff-kiosks-split${selected ? ' ff-kiosks-split--with-panel' : ''}`}>

          <div className="ff-kiosks-split-main">
            <AdminTable<KioskDevice>
              columns={deviceColumns}
              rows={sorted}
              sortBy={sortBy}
              sortDir={sortDir}
              onSort={handleSort}
              onRowClick={setSelected}
              selectedId={selected?.id}
              loading={loading}
              emptyIcon="bi-display"
              emptyTitle={t('adminKiosks.noDevices')}
              emptyMessage={t('adminKiosks.noDevicesDesc')}
            />
          </div>

          {selected && (
            <aside className="ff-kiosks-detail-panel">
              <div className="ff-kiosks-detail-header">
                <div className="ff-kiosks-detail-title">
                  <i className="bi bi-display" />
                  {selected.name}
                </div>
                <AdminIconButton
                  icon="bi-x"
                  variant="ghost"
                  size="sm"
                  title="Fechar"
                  onClick={() => setSelected(null)}
                />
              </div>

              <div className="ff-kiosks-detail-body">
                <div className="ff-kiosks-detail-status-row">
                  <AdminBadge
                    variant={STATUS_VARIANT[selected.status] ?? 'inactive'}
                    label={STATUS_LABEL[selected.status] ?? selected.status}
                  />
                  <span className="ff-kiosks-detail-lastseen">{relativeTime(selected.updatedAt, timeLabels)}</span>
                </div>

                <div className="ff-kiosks-detail-fields">
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">{t('adminKiosks.colId')}</span>
                    <span className="ff-kiosks-detail-field-value ff-kiosks-detail-field-value--mono">{selected.id}</span>
                  </div>
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">{t('adminKiosks.colBranch')}</span>
                    <span className="ff-kiosks-detail-field-value">{selected.branchId}</span>
                  </div>
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">{t('adminKiosks.colRegistered')}</span>
                    <span className="ff-kiosks-detail-field-value">{formatDate(selected.createdAt)}</span>
                  </div>
                </div>

                <div className="ff-kiosks-detail-actions">
                  <AdminButton variant="outline" size="sm" icon="bi-pencil" style={{ flex: 1 }}>
                    {t('adminKiosks.editBtn')}
                  </AdminButton>
                  <AdminButton variant="outline" size="sm" icon="bi-arrow-clockwise" style={{ flex: 1 }}>
                    {t('adminKiosks.reloadBtn')}
                  </AdminButton>
                </div>
                <div className="ff-kiosks-detail-actions">
                  <AdminButton variant="outline" size="sm" icon="bi-display" style={{ flex: 1 }}>
                    {t('adminKiosks.previewBtn')}
                  </AdminButton>
                  <AdminButton variant="destructive" size="sm" icon="bi-trash" style={{ flex: 1 }}>
                    {t('adminKiosks.removeBtn')}
                  </AdminButton>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {activeTab === 'attract' && (
        <div className="ff-kiosks-attract-layout">
          <div className="ff-kiosks-attract-form">
            <AdminFormSection
              title={t('adminKiosks.attractConfig')}
              description={t('adminKiosks.attractConfigDesc')}
            >
              <AdminFormRow label={t('adminKiosks.enableAttractScreen')}>
                <div className="ff-admin-toggle-row">
                  <button
                    className="ff-admin-toggle"
                    aria-checked={cfg.enabled}
                    onClick={() => setCfgKey('enabled', !cfg.enabled)}
                    role="switch"
                    type="button"
                  >
                    <span className="ff-admin-toggle-thumb" />
                  </button>
                  <span className={`ff-admin-toggle-label${cfg.enabled ? ' ff-admin-toggle-label--on' : ''}`}>
                    {cfg.enabled ? t('adminKiosks.attractEnabled') : t('adminKiosks.attractDisabled')}
                  </span>
                </div>
              </AdminFormRow>

              <AdminFormRow label={t('adminKiosks.restaurantNameLabel')}>
                <input
                  className="ff-admin-form-input"
                  value={cfg.restaurantName}
                  onChange={(e) => setCfgKey('restaurantName', e.target.value)}
                />
              </AdminFormRow>

              <AdminFormRow label={t('adminKiosks.slogan')} hint={t('adminKiosks.sloganDesc')}>
                <input
                  className="ff-admin-form-input"
                  placeholder={t('adminKiosks.sloganPlaceholder')}
                  value={cfg.slogan ?? ''}
                  onChange={(e) => setCfgKey('slogan', e.target.value || null)}
                />
              </AdminFormRow>

              <AdminFormRow label={t('adminKiosks.videoUrl')} hint={t('adminKiosks.videoUrlDesc')}>
                <input
                  className="ff-admin-form-input"
                  type="url"
                  placeholder="https://..."
                  value={cfg.videoUrl ?? ''}
                  onChange={(e) => setCfgKey('videoUrl', e.target.value || null)}
                />
              </AdminFormRow>

              <AdminFormRow
                label={t('adminKiosks.idleTimeout', { s: String(cfg.idleTimeoutSeconds) })}
                hint={t('adminKiosks.idleTimeoutDesc')}
              >
                <div className="ff-kiosks-slider-row">
                  <span className="ff-kiosks-slider-label">{t('adminKiosks.sliderMin')}</span>
                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={10}
                    value={cfg.idleTimeoutSeconds}
                    onChange={(e) => setCfgKey('idleTimeoutSeconds', Number(e.target.value))}
                    className="ff-kiosks-slider"
                  />
                  <span className="ff-kiosks-slider-label">{t('adminKiosks.sliderMax')}</span>
                </div>
              </AdminFormRow>
            </AdminFormSection>
          </div>

          <div className="ff-kiosks-attract-preview">
            <div className="ff-kiosks-preview-label">
              <i className="bi bi-eye" /> {t('adminKiosks.previewLabel')}
            </div>
            <div className="ff-kiosks-preview-screen">
              {cfg.enabled ? (
                <div className="ff-kiosks-preview-content">
                  <div className="ff-kiosks-preview-name">{cfg.restaurantName || '—'}</div>
                  {cfg.slogan && <div className="ff-kiosks-preview-slogan">{cfg.slogan}</div>}
                  <div className="ff-kiosks-preview-cta">{t('adminKiosks.touchToStart')}</div>
                </div>
              ) : (
                <div className="ff-kiosks-preview-off">
                  <i className="bi bi-display-slash" />
                  <span>{t('adminKiosks.attractDisabledPreview')}</span>
                </div>
              )}
            </div>
            <p className="ff-kiosks-preview-note">
              {t('adminKiosks.attractPreviewNote')}
            </p>
          </div>
        </div>
      )}

      {(activeTab === 'branding' || activeTab === 'media' || activeTab === 'behavior') && (
        <div className="ff-kiosks-placeholder-tab">
          <i className={`bi ${TABS.find((tab) => tab.key === activeTab)?.icon ?? 'bi-gear'}`} />
          <div className="ff-kiosks-placeholder-title">
            {TABS.find((tab) => tab.key === activeTab)?.label}
          </div>
          <p className="ff-kiosks-placeholder-text">
            {t('adminKiosks.sectionSoon')}
          </p>
        </div>
      )}

      <DirtySaveBar
        visible={isDirty}
        saving={saving}
        onCancel={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}
