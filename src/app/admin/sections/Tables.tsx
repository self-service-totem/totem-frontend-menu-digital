import { useEffect, useState } from 'react';
import { tableService, zoneService, mockUserService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbTable, Zone, MockUser } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminTable,
  AdminCard,
  AdminSearchInput,
  AdminFilterBar,
  AdminActionMenu,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir } from '@/components/admin';

const EMPTY_FORM = {
  number: '', zoneId: '', assignedWaiterName: '',
  capacity: '', active: true, notes: '',
};

export function Tables() {
  const { t } = useLabels();
  const [tables, setTables]             = useState<DbTable[]>([]);
  const [zones, setZones]               = useState<Zone[]>([]);
  const [waiters, setWaiters]           = useState<MockUser[]>([]);
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState<DbTable | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [search, setSearch]             = useState('');
  const [zoneFilter, setZoneFilter]     = useState('');
  const [waiterFilter, setWaiterFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]             = useState('number');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const notify = useNotify();

  async function load() {
    const [tb, z, w] = await Promise.all([
      tableService.list(), zoneService.list(), mockUserService.listWaiters(),
    ]);
    setTables(tb); setZones(z); setWaiters(w);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }

  function openEdit(tb: DbTable) {
    setEditing(tb);
    setForm({
      number: tb.number,
      zoneId: tb.zoneId ?? '',
      assignedWaiterName: tb.assignedWaiterName ?? '',
      capacity: tb.capacity != null ? String(tb.capacity) : '',
      active: tb.active,
      notes: tb.notes ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.number.trim()) return;
    const selectedZone = zones.find((z) => z.id === form.zoneId);
    const data = {
      number: form.number.trim(),
      zoneId: selectedZone?.id,
      zoneName: selectedZone?.name,
      assignedWaiterName: form.assignedWaiterName || undefined,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      active: form.active,
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      await tableService.update(editing.id, data);
      notify(t('adminTables.updatedToast', { n: data.number }));
    } else {
      await tableService.create(data);
      notify(t('adminTables.createdToast', { n: data.number }));
    }
    setShowModal(false); load();
  }

  async function toggleActive(tb: DbTable) {
    await tableService.update(tb.id, { active: !tb.active });
    notify(tb.active ? t('adminTables.disabledToast') : t('adminTables.enabledToast'));
    load();
  }

  async function handleRegenCode(id: string) {
    await tableService.regenerateCode(id);
    notify(t('adminTables.codeRegeneratedToast'));
    load();
  }

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(key); setSortDir('asc'); }
  }

  const f = (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const statusOptions = [
    { key: 'all',      label: t('adminTables.filterAll') },
    { key: 'active',   label: t('adminTables.filterActive') },
    { key: 'inactive', label: t('adminTables.filterInactive') },
  ];

  const zoneOptions = [
    { key: '', label: t('adminTables.filterAllZones') },
    ...zones.map((z) => ({ key: z.id, label: z.name })),
  ];

  const waiterOptions = [
    { key: '', label: t('adminTables.colWaiter') },
    ...waiters.map((w) => ({ key: w.name, label: w.name })),
  ];

  const baseFiltered = tables.filter((tb) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        `mesa ${tb.number}`.toLowerCase().includes(q) ||
        (tb.zoneName ?? '').toLowerCase().includes(q) ||
        (tb.assignedWaiterName ?? '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (zoneFilter && tb.zoneId !== zoneFilter) return false;
    if (waiterFilter && tb.assignedWaiterName !== waiterFilter) return false;
    if (statusFilter === 'active' && !tb.active) return false;
    if (statusFilter === 'inactive' && tb.active) return false;
    return true;
  });

  const filtered = useSortable(baseFiltered, sortBy, sortDir);
  const hasFilters = search || zoneFilter || waiterFilter || statusFilter !== 'all';

  const columns: AdminTableColumn<DbTable>[] = [
    {
      key: 'number',
      label: t('adminOrders.colTable'),
      sortable: true,
      render: (tb) => (
        <span>
          <strong>{t('adminOrders.colTable')} {tb.number}</strong>
          {tb.notes && (
            <i className="bi bi-chat-left-dots" title={tb.notes} style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }} />
          )}
        </span>
      ),
    },
    {
      key: 'zoneName',
      label: t('adminTables.colZone'),
      sortable: true,
      render: (tb) => tb.zoneName
        ? <span className="ff-admin-badge ff-admin-badge--blue">{tb.zoneName}</span>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'assignedWaiterName',
      label: t('adminTables.colWaiter'),
      sortable: true,
      render: (tb) => tb.assignedWaiterName ?? <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'capacity',
      label: t('adminTables.colSeats'),
      sortable: true,
      align: 'center',
      render: (tb) => tb.capacity ?? <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (tb) => (
        <AdminBadge variant={tb.active ? 'active' : 'inactive'} label={tb.active ? t('adminTables.tableActive') : t('adminTables.tableInactive')} />
      ),
    },
    {
      key: 'validationCode',
      label: t('adminTables.colValidation'),
      render: (tb) => (
        <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
          {tb.validationCode}
        </span>
      ),
    },
    {
      key: '_actions',
      label: '',
      width: '44px',
      render: (tb) => (
        <AdminActionMenu items={[
          { key: 'edit',   label: t('common.edit'),                              icon: 'bi-pencil',      onClick: () => openEdit(tb) },
          { key: 'toggle', label: tb.active ? t('common.disable') : t('common.enable'), icon: tb.active ? 'bi-eye-slash' : 'bi-eye', onClick: () => toggleActive(tb) },
          { key: 'regen',  label: t('adminTables.regenerateCode'),               icon: 'bi-arrow-repeat', onClick: () => handleRegenCode(tb.id) },
        ]} />
      ),
    },
  ];

  const tableCountLabel = filtered.length === tables.length
    ? `${tables.length} ${tables.length !== 1 ? t('adminTables.tablePlural') : t('adminTables.tableSingular')}`
    : `${filtered.length} ${t('adminTables.ofCount')} ${tables.length} ${t('adminTables.tablePlural')}`;

  const tableSubtitle = `${tables.length} ${tables.length !== 1 ? t('adminTables.tablePlural') : t('adminTables.tableSingular')} ${tables.length !== 1 ? t('adminTables.registeredPlural') : t('adminTables.registered')}`;

  return (
    <div>
      <AdminPageHeader
        title={t('adminTables.title')}
        subtitle={tableSubtitle}
        actions={
          <AdminButton variant="primary" icon="bi-plus" onClick={openCreate}>
            {t('adminTables.newTable')}
          </AdminButton>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ff-admin-toolbar">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder={t('adminTables.searchPlaceholder')}
          />
          <AdminFilterBar options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />
          <AdminFilterBar options={waiterOptions} value={waiterFilter} onChange={setWaiterFilter} />
          <div className="ff-admin-toolbar-right">
            <AdminFilterBar options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ff-admin-count-label">{tableCountLabel}</span>
          {hasFilters && (
            <button
              className="ff-admin-clear-link"
              onClick={() => { setSearch(''); setZoneFilter(''); setWaiterFilter(''); setStatusFilter('all'); }}
            >
              {t('common.clearFilters')}
            </button>
          )}
        </div>

        <AdminCard noPad>
          <AdminTable<DbTable>
            columns={columns}
            rows={filtered}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            emptyIcon="bi-table"
            emptyTitle={t('adminTables.noTablesFound')}
            emptyMessage={t('adminTables.noTablesFoundDesc')}
          />
        </AdminCard>
      </div>

      {showModal && (
        <div className="ff-admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ff-admin-modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="ff-admin-modal-header">
              <span className="ff-admin-modal-title">
                {editing ? t('adminTables.editTitle', { n: editing.number }) : t('adminTables.newTitle')}
              </span>
              <button className="ff-order-drawer-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x" />
              </button>
            </div>

            <div className="ff-admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ff-admin-form-grid-2">
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">
                    {t('adminTables.number')} <span className="ff-admin-form-required">*</span>
                  </label>
                  <input
                    className="ff-admin-form-input"
                    placeholder={t('adminTables.numberPlaceholder')}
                    value={form.number}
                    onChange={f('number')}
                    autoFocus
                  />
                </div>
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">{t('adminTables.capacity')}</label>
                  <input
                    className="ff-admin-form-input"
                    type="number"
                    min={1}
                    max={50}
                    placeholder={t('adminTables.capacityPlaceholder')}
                    value={form.capacity}
                    onChange={f('capacity')}
                  />
                </div>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">{t('adminTables.zone')}</label>
                <select className="ff-admin-form-select" value={form.zoneId} onChange={f('zoneId')}>
                  <option value="">{t('adminTables.noZone')}</option>
                  {zones.map((z) => <option key={z.id} value={z.id}>{z.name}</option>)}
                </select>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">{t('adminTables.waiter')}</label>
                <select className="ff-admin-form-select" value={form.assignedWaiterName} onChange={f('assignedWaiterName')}>
                  <option value="">{t('adminTables.noWaiter')}</option>
                  {waiters.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">{t('adminTables.notes')}</label>
                <textarea
                  className="ff-admin-form-textarea"
                  rows={2}
                  placeholder={t('adminTables.notesPlaceholder')}
                  value={form.notes}
                  onChange={f('notes')}
                />
              </div>

              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                {t('adminTables.isActive')}
              </label>
            </div>

            <div className="ff-admin-modal-footer">
              <AdminButton variant="outline" onClick={() => setShowModal(false)}>{t('common.cancel')}</AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleSave}
                disabled={!form.number.trim()}
              >
                {editing ? t('adminTables.saveChanges') : t('adminTables.createTable')}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
