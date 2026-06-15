import { useEffect, useMemo, useState } from 'react';
import { kioskDeviceService } from '@/lib/services/adminService';
import { loadAttractConfig, saveAttractConfig } from '@/app/kiosk/attractConfig';
import type { KioskDevice } from '@/lib/types';
import type { AttractScreenConfig } from '@/app/kiosk/attractConfig';
import { formatDate } from '../adminUtils';
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

const STATUS_LABEL: Record<string, string> = {
  ONLINE:      'Online',
  OFFLINE:     'Offline',
  MAINTENANCE: 'Manutenção',
};

const TABS: { key: KioskTab; label: string; icon: string }[] = [
  { key: 'devices',  label: 'Dispositivos',    icon: 'bi-display'      },
  { key: 'attract',  label: 'Tela de Atração', icon: 'bi-play-circle'  },
  { key: 'branding', label: 'Marca',           icon: 'bi-palette'      },
  { key: 'media',    label: 'Mídia',           icon: 'bi-film'         },
  { key: 'behavior', label: 'Comportamento',   icon: 'bi-sliders'      },
];

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Agora mesmo';
  if (mins < 60) return `${mins}min atrás`;
  const h = Math.floor(mins / 60);
  if (h < 24)    return `${h}h atrás`;
  return `${Math.floor(h / 24)}d atrás`;
}

export function Kiosks() {
  const [devices, setDevices]         = useState<KioskDevice[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selected, setSelected]       = useState<KioskDevice | null>(null);
  const [activeTab, setActiveTab]     = useState<KioskTab>('devices');
  const [sortBy, setSortBy]           = useState('name');
  const [sortDir, setSortDir]         = useState<SortDir>('asc');

  const [cfg, setCfg]           = useState<AttractScreenConfig>(loadAttractConfig);
  const [savedCfg, setSavedCfg] = useState<AttractScreenConfig>(loadAttractConfig);
  const [saving, setSaving]     = useState(false);

  const isDirty = JSON.stringify(cfg) !== JSON.stringify(savedCfg);

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
    { key: 'all',         label: 'Todos',      count: devices.length },
    { key: 'ONLINE',      label: 'Online',     count: online         },
    { key: 'OFFLINE',     label: 'Offline',    count: offline        },
    ...(maintenance > 0 ? [{ key: 'MAINTENANCE', label: 'Manutenção', count: maintenance }] : []),
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
      { key: 'inspect', label: 'Ver detalhes',           icon: 'bi-eye',            onClick: () => setSelected(d) },
      { key: 'reload',  label: 'Recarregar configuração', icon: 'bi-arrow-clockwise', onClick: () => {} },
      { key: 'toggle',  label: d.status === 'ONLINE' ? 'Desativar' : 'Ativar',
        icon: d.status === 'ONLINE' ? 'bi-toggle-off' : 'bi-toggle-on',
        onClick: () => {},
      },
      { key: 'preview', label: 'Preview da tela',        icon: 'bi-display',         onClick: () => {} },
      { key: 'remove',  label: 'Remover dispositivo',    icon: 'bi-trash',           variant: 'destructive', onClick: () => {} },
    ];
  }

  const deviceColumns: AdminTableColumn<KioskDevice>[] = [
    {
      key: 'name',
      label: 'Dispositivo',
      sortable: true,
      render: (d) => (
        <div>
          <div className="ff-table-row-title">{d.name}</div>
          <div className="ff-table-row-sub ff-kiosks-device-id">ID {d.id.slice(0, 8)}…</div>
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
      label: 'Última atividade',
      sortable: true,
      width: '160px',
      className: 'ff-hide-mobile',
      render: (d) => <span className="ff-table-date">{relativeTime(d.updatedAt)}</span>,
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

      {/* ── Sticky header + toolbar + tabs ── */}
      <div className="ff-kiosks-sticky-bar">
        <AdminPageHeader
          title="Kiosks"
          subtitle={`${online} online · ${offline} offline`}
          actions={
            <>
              <AdminButton variant="outline" size="sm" icon="bi-eye" onClick={() => setActiveTab('attract')}>
                Preview
              </AdminButton>
              <AdminButton variant="primary" size="sm" icon="bi-plus">
                Adicionar kiosk
              </AdminButton>
            </>
          }
        />

        <div className="ff-admin-toolbar">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar dispositivo..."
          />
          <AdminFilterBar options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          <div className="ff-admin-toolbar-right">
            <AdminIconButton
              icon="bi-arrow-clockwise"
              variant="ghost"
              title="Atualizar lista"
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

      {/* ── Tab: Devices ── */}
      {activeTab === 'devices' && (
        <div className={`ff-kiosks-split${selected ? ' ff-kiosks-split--with-panel' : ''}`}>

          {/* Device table */}
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
              emptyTitle="Nenhum dispositivo"
              emptyMessage="Nenhum kiosk registrado ainda."
            />
          </div>

          {/* Detail panel */}
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
                  <span className="ff-kiosks-detail-lastseen">{relativeTime(selected.updatedAt)}</span>
                </div>

                <div className="ff-kiosks-detail-fields">
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">ID</span>
                    <span className="ff-kiosks-detail-field-value ff-kiosks-detail-field-value--mono">{selected.id}</span>
                  </div>
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">Branch</span>
                    <span className="ff-kiosks-detail-field-value">{selected.branchId}</span>
                  </div>
                  <div className="ff-kiosks-detail-field">
                    <span className="ff-kiosks-detail-field-label">Cadastrado</span>
                    <span className="ff-kiosks-detail-field-value">{formatDate(selected.createdAt)}</span>
                  </div>
                </div>

                <div className="ff-kiosks-detail-actions">
                  <AdminButton variant="outline" size="sm" icon="bi-pencil" style={{ flex: 1 }}>
                    Editar
                  </AdminButton>
                  <AdminButton variant="outline" size="sm" icon="bi-arrow-clockwise" style={{ flex: 1 }}>
                    Recarregar
                  </AdminButton>
                </div>
                <div className="ff-kiosks-detail-actions">
                  <AdminButton variant="outline" size="sm" icon="bi-display" style={{ flex: 1 }}>
                    Preview
                  </AdminButton>
                  <AdminButton variant="destructive" size="sm" icon="bi-trash" style={{ flex: 1 }}>
                    Remover
                  </AdminButton>
                </div>
              </div>
            </aside>
          )}
        </div>
      )}

      {/* ── Tab: Attract Screen ── */}
      {activeTab === 'attract' && (
        <div className="ff-kiosks-attract-layout">
          <div className="ff-kiosks-attract-form">
            <AdminFormSection
              title="Configuração geral"
              description="Exibida quando o kiosk está sem uso. As alterações entram em vigor na próxima vez que a tela for carregada."
            >
              <AdminFormRow label="Ativar tela de atração">
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
                    {cfg.enabled ? 'Ativada' : 'Desativada'}
                  </span>
                </div>
              </AdminFormRow>

              <AdminFormRow label="Nome do restaurante">
                <input
                  className="ff-admin-form-input"
                  value={cfg.restaurantName}
                  onChange={(e) => setCfgKey('restaurantName', e.target.value)}
                />
              </AdminFormRow>

              <AdminFormRow label="Slogan" hint="Exibido abaixo do nome (opcional).">
                <input
                  className="ff-admin-form-input"
                  placeholder="Ex: O melhor da cidade"
                  value={cfg.slogan ?? ''}
                  onChange={(e) => setCfgKey('slogan', e.target.value || null)}
                />
              </AdminFormRow>

              <AdminFormRow label="URL do vídeo" hint="Sem vídeo, é usado fundo com gradiente (opcional).">
                <input
                  className="ff-admin-form-input"
                  type="url"
                  placeholder="https://..."
                  value={cfg.videoUrl ?? ''}
                  onChange={(e) => setCfgKey('videoUrl', e.target.value || null)}
                />
              </AdminFormRow>

              <AdminFormRow
                label={`Timeout de inatividade: ${cfg.idleTimeoutSeconds}s`}
                hint="Após esse tempo sem toque, aparece o aviso 'Você ainda está aí?'."
              >
                <div className="ff-kiosks-slider-row">
                  <span className="ff-kiosks-slider-label">30s</span>
                  <input
                    type="range"
                    min={30}
                    max={300}
                    step={10}
                    value={cfg.idleTimeoutSeconds}
                    onChange={(e) => setCfgKey('idleTimeoutSeconds', Number(e.target.value))}
                    className="ff-kiosks-slider"
                  />
                  <span className="ff-kiosks-slider-label">300s</span>
                </div>
              </AdminFormRow>
            </AdminFormSection>
          </div>

          {/* Preview panel */}
          <div className="ff-kiosks-attract-preview">
            <div className="ff-kiosks-preview-label">
              <i className="bi bi-eye" /> Preview
            </div>
            <div className="ff-kiosks-preview-screen">
              {cfg.enabled ? (
                <div className="ff-kiosks-preview-content">
                  <div className="ff-kiosks-preview-name">{cfg.restaurantName || '—'}</div>
                  {cfg.slogan && <div className="ff-kiosks-preview-slogan">{cfg.slogan}</div>}
                  <div className="ff-kiosks-preview-cta">Toque para começar</div>
                </div>
              ) : (
                <div className="ff-kiosks-preview-off">
                  <i className="bi bi-display-slash" />
                  <span>Tela de atração desativada</span>
                </div>
              )}
            </div>
            <p className="ff-kiosks-preview-note">
              Tela exibida quando o kiosk está sem uso
            </p>
          </div>
        </div>
      )}

      {/* ── Placeholder tabs ── */}
      {(activeTab === 'branding' || activeTab === 'media' || activeTab === 'behavior') && (
        <div className="ff-kiosks-placeholder-tab">
          <i className={`bi ${TABS.find((t) => t.key === activeTab)?.icon ?? 'bi-gear'}`} />
          <div className="ff-kiosks-placeholder-title">
            {TABS.find((t) => t.key === activeTab)?.label}
          </div>
          <p className="ff-kiosks-placeholder-text">
            Esta seção será configurada em breve.
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
