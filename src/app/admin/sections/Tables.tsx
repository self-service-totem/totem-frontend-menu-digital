import { useEffect, useState } from 'react';
import { tableService, zoneService, mockUserService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbTable, Zone, MockUser } from '@/lib/types';
import {
  AdminPageHeader,
  AdminButton,
  AdminIconButton,
  AdminBadge,
  AdminTable,
  AdminCard,
  AdminSearchInput,
  AdminFilterBar,
  AdminActionMenu,
  AdminEmptyState,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir } from '@/components/admin';

const EMPTY_FORM = {
  number: '', zoneName: '', assignedWaiterName: '',
  capacity: '', active: true, notes: '',
};

export function Tables() {
  const [tables, setTables]             = useState<DbTable[]>([]);
  const [zones, setZones]               = useState<Zone[]>([]);
  const [waiters, setWaiters]           = useState<MockUser[]>([]);
  const [showModal, setShowModal]       = useState(false);
  const [editing, setEditing]           = useState<DbTable | null>(null);
  const [form, setForm]                 = useState(EMPTY_FORM);
  const [newZoneName, setNewZoneName]   = useState('');
  const [search, setSearch]             = useState('');
  const [zoneFilter, setZoneFilter]     = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy]             = useState('number');
  const [sortDir, setSortDir]           = useState<SortDir>('asc');
  const notify = useNotify();

  async function load() {
    const [t, z, w] = await Promise.all([
      tableService.list(), zoneService.list(), mockUserService.listWaiters(),
    ]);
    setTables(t); setZones(z); setWaiters(w);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }

  function openEdit(t: DbTable) {
    setEditing(t);
    setForm({
      number: t.number,
      zoneName: t.zoneName ?? '',
      assignedWaiterName: t.assignedWaiterName ?? '',
      capacity: t.capacity != null ? String(t.capacity) : '',
      active: t.active,
      notes: t.notes ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.number.trim()) return;
    const data = {
      number: form.number.trim(),
      zoneName: form.zoneName || undefined,
      assignedWaiterName: form.assignedWaiterName || undefined,
      capacity: form.capacity ? parseInt(form.capacity, 10) : undefined,
      active: form.active,
      notes: form.notes.trim() || undefined,
    };
    if (editing) {
      await tableService.update(editing.id, data);
      notify(`Mesa ${data.number} atualizada`);
    } else {
      await tableService.create(data);
      notify(`Mesa ${data.number} criada`);
    }
    setShowModal(false); load();
  }

  async function toggleActive(t: DbTable) {
    await tableService.update(t.id, { active: !t.active });
    notify(t.active ? 'Mesa desativada' : 'Mesa ativada');
    load();
  }

  async function handleRegenCode(id: string) {
    await tableService.regenerateCode(id);
    notify('Código regenerado');
    load();
  }

  async function handleAddZone() {
    const name = newZoneName.trim();
    if (!name) return;
    await zoneService.create(name);
    setNewZoneName('');
    load();
  }

  async function handleDeleteZone(id: string) {
    await zoneService.remove(id);
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
    { key: 'all',      label: 'Todas' },
    { key: 'active',   label: 'Ativas' },
    { key: 'inactive', label: 'Inativas' },
  ];

  const zoneOptions = [
    { key: '', label: 'Todas as zonas' },
    ...zones.map((z) => ({ key: z.name, label: z.name })),
  ];

  const baseFiltered = tables.filter((t) => {
    if (search) {
      const q = search.toLowerCase();
      const matches =
        `mesa ${t.number}`.toLowerCase().includes(q) ||
        (t.zoneName ?? '').toLowerCase().includes(q) ||
        (t.assignedWaiterName ?? '').toLowerCase().includes(q);
      if (!matches) return false;
    }
    if (zoneFilter && t.zoneName !== zoneFilter) return false;
    if (statusFilter === 'active' && !t.active) return false;
    if (statusFilter === 'inactive' && t.active) return false;
    return true;
  });

  const filtered = useSortable(baseFiltered, sortBy, sortDir);
  const hasFilters = search || zoneFilter || statusFilter !== 'all';

  const columns: AdminTableColumn<DbTable>[] = [
    {
      key: 'number',
      label: 'Mesa',
      sortable: true,
      render: (t) => (
        <span>
          <strong>Mesa {t.number}</strong>
          {t.notes && (
            <i className="bi bi-chat-left-dots" title={t.notes} style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }} />
          )}
        </span>
      ),
    },
    {
      key: 'zoneName',
      label: 'Zona',
      sortable: true,
      render: (t) => t.zoneName
        ? <span className="ff-admin-badge ff-admin-badge--blue">{t.zoneName}</span>
        : <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'assignedWaiterName',
      label: 'Garçom',
      sortable: true,
      render: (t) => t.assignedWaiterName ?? <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'capacity',
      label: 'Lugares',
      sortable: true,
      align: 'center',
      render: (t) => t.capacity ?? <span style={{ color: '#d1d5db' }}>—</span>,
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (t) => (
        <AdminBadge variant={t.active ? 'active' : 'inactive'} label={t.active ? 'Ativa' : 'Inativa'} />
      ),
    },
    {
      key: 'validationCode',
      label: 'Validação',
      render: (t) => (
        <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
          {t.validationCode}
        </span>
      ),
    },
    {
      key: '_actions',
      label: '',
      width: '44px',
      render: (t) => (
        <AdminActionMenu items={[
          { key: 'edit',   label: 'Editar',          icon: 'bi-pencil',      onClick: () => openEdit(t) },
          { key: 'toggle', label: t.active ? 'Desativar' : 'Ativar', icon: t.active ? 'bi-eye-slash' : 'bi-eye', onClick: () => toggleActive(t) },
          { key: 'regen',  label: 'Regenerar código', icon: 'bi-arrow-repeat', onClick: () => handleRegenCode(t.id) },
        ]} />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Mesas"
        subtitle={`${tables.length} mesa${tables.length !== 1 ? 's' : ''} cadastrada${tables.length !== 1 ? 's' : ''}`}
        actions={
          <AdminButton variant="primary" icon="bi-plus" onClick={openCreate}>
            Nova mesa
          </AdminButton>
        }
      />

      <div className="ff-admin-split-layout">
        {/* Main table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div className="ff-admin-toolbar">
            <AdminSearchInput
              value={search}
              onChange={setSearch}
              placeholder="Buscar mesa, zona, garçom..."
            />
            <AdminFilterBar options={zoneOptions} value={zoneFilter} onChange={setZoneFilter} />
            <div className="ff-admin-toolbar-right">
              <AdminFilterBar options={statusOptions} value={statusFilter} onChange={setStatusFilter} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="ff-admin-count-label">
              {filtered.length === tables.length
                ? `${tables.length} mesa${tables.length !== 1 ? 's' : ''}`
                : `${filtered.length} de ${tables.length} mesas`}
            </span>
            {hasFilters && (
              <button
                className="ff-admin-clear-link"
                onClick={() => { setSearch(''); setZoneFilter(''); setStatusFilter('all'); }}
              >
                Limpar filtros
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
              emptyTitle="Nenhuma mesa encontrada"
              emptyMessage="Tente ajustar os filtros ou criar uma nova mesa."
            />
          </AdminCard>
        </div>

        {/* Zones sidebar */}
        <div style={{ position: 'sticky', top: 20 }}>
          <AdminCard
            header="Zonas / Áreas"
            headerRight={
              <span className="ff-admin-badge ff-admin-badge--neutral">{zones.length}</span>
            }
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {zones.length === 0 ? (
                <AdminEmptyState
                  icon="bi-diagram-3"
                  title="Nenhuma zona"
                  message="Crie zonas para organizar suas mesas."
                />
              ) : (
                zones.map((z) => (
                  <div
                    key={z.id}
                    className={`ff-admin-zone-item${zoneFilter === z.name ? ' ff-admin-zone-item--active' : ''}`}
                    onClick={() => setZoneFilter(zoneFilter === z.name ? '' : z.name)}
                  >
                    <i className="bi bi-diagram-3" />
                    <span>{z.name}</span>
                    <span className="ff-admin-zone-count">
                      {tables.filter((t) => t.zoneName === z.name).length}
                    </span>
                    <AdminIconButton
                      icon="bi-trash"
                      variant="ghost"
                      size="sm"
                      title="Remover zona"
                      onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id); }}
                    />
                  </div>
                ))
              )}
              <div className="ff-admin-zone-add-row">
                <input
                  className="ff-admin-form-input"
                  placeholder="Nova zona..."
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddZone(); }}
                />
                <AdminIconButton
                  icon="bi-plus"
                  variant="outline"
                  title="Adicionar zona"
                  onClick={handleAddZone}
                />
              </div>
            </div>
          </AdminCard>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="ff-admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="ff-admin-modal" style={{ width: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="ff-admin-modal-header">
              <span className="ff-admin-modal-title">
                {editing ? `Editar Mesa ${editing.number}` : 'Nova mesa'}
              </span>
              <button className="ff-order-drawer-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x" />
              </button>
            </div>

            <div className="ff-admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ff-admin-form-grid-2">
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">
                    Número / Nome <span className="ff-admin-form-required">*</span>
                  </label>
                  <input
                    className="ff-admin-form-input"
                    placeholder="ex: 1, A3, VIP-1"
                    value={form.number}
                    onChange={f('number')}
                    autoFocus
                  />
                </div>
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">Capacidade (lugares)</label>
                  <input
                    className="ff-admin-form-input"
                    type="number"
                    min={1}
                    max={50}
                    placeholder="ex: 4"
                    value={form.capacity}
                    onChange={f('capacity')}
                  />
                </div>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">Zona / Área</label>
                <select className="ff-admin-form-select" value={form.zoneName} onChange={f('zoneName')}>
                  <option value="">— Sem zona —</option>
                  {zones.map((z) => <option key={z.id} value={z.name}>{z.name}</option>)}
                </select>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">Garçom responsável</label>
                <select className="ff-admin-form-select" value={form.assignedWaiterName} onChange={f('assignedWaiterName')}>
                  <option value="">— Sem atribuição —</option>
                  {waiters.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">Observações</label>
                <textarea
                  className="ff-admin-form-textarea"
                  rows={2}
                  placeholder="ex: próxima à janela, acessível, reservada para VIP..."
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
                Mesa ativa
              </label>
            </div>

            <div className="ff-admin-modal-footer">
              <AdminButton variant="outline" onClick={() => setShowModal(false)}>Cancelar</AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleSave}
                disabled={!form.number.trim()}
              >
                {editing ? 'Salvar alterações' : 'Criar mesa'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
