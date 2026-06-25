import { useEffect, useState } from 'react';
import { zoneService, tableService, mockUserService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { Zone, MockUser, DbTable } from '@/lib/types';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminTable,
  AdminCard,
  AdminSearchInput,
  AdminActionMenu,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir } from '@/components/admin';

const EMPTY_FORM = {
  name: '',
  color: '#3b82f6',
  order: '',
  active: true,
  defaultWaiterId: '',
};

export function Zones() {
  const [zones, setZones]         = useState<Zone[]>([]);
  const [tables, setTables]       = useState<DbTable[]>([]);
  const [waiters, setWaiters]     = useState<MockUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<Zone | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [search, setSearch]       = useState('');
  const [sortBy, setSortBy]       = useState('order');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
  const notify = useNotify();

  async function load() {
    const [z, t, w] = await Promise.all([
      zoneService.list(), tableService.list(), mockUserService.listWaiters(),
    ]);
    setZones(z); setTables(t); setWaiters(w);
  }
  useEffect(() => { load(); }, []);

  function countTables(zone: Zone): number {
    return tables.filter(
      (t) => t.zoneId === zone.id || (!t.zoneId && t.zoneName === zone.name),
    ).length;
  }

  function openCreate() {
    setEditing(null);
    setForm({ ...EMPTY_FORM, order: String(zones.length + 1) });
    setShowModal(true);
  }

  function openEdit(z: Zone) {
    setEditing(z);
    setForm({
      name: z.name,
      color: z.color ?? '#3b82f6',
      order: String(z.order),
      active: z.active,
      defaultWaiterId: z.defaultWaiterId ?? '',
    });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    const data = {
      name: form.name.trim(),
      color: form.color,
      order: form.order ? parseInt(form.order, 10) : undefined,
      active: form.active,
      defaultWaiterId: form.defaultWaiterId || undefined,
    };
    if (editing) {
      await zoneService.update(editing.id, data);
      notify(`Zona "${data.name}" atualizada`);
    } else {
      await zoneService.create(data);
      notify(`Zona "${data.name}" criada`);
    }
    setShowModal(false); load();
  }

  async function toggleActive(z: Zone) {
    await zoneService.update(z.id, { active: !z.active });
    notify(z.active ? `Zona "${z.name}" desativada` : `Zona "${z.name}" ativada`);
    load();
  }

  async function handleDelete(z: Zone) {
    const count = countTables(z);
    if (count > 0) {
      notify(`Esta zona tem ${count} mesa${count !== 1 ? 's' : ''} atribuída${count !== 1 ? 's' : ''}. Remova-as antes de excluir.`);
      return;
    }
    await zoneService.remove(z.id);
    notify(`Zona "${z.name}" removida`);
    load();
  }

  function handleSort(key: string) {
    if (sortBy === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortBy(key); setSortDir('asc'); }
  }

  const f =
    (field: keyof typeof EMPTY_FORM) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const baseFiltered = search
    ? zones.filter((z) => z.name.toLowerCase().includes(search.toLowerCase()))
    : zones;

  const filtered = useSortable(baseFiltered, sortBy, sortDir);

  const columns: AdminTableColumn<Zone>[] = [
    {
      key: 'name',
      label: 'Zona / Área',
      sortable: true,
      render: (z) => (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="ff-admin-zone-color" style={{ background: z.color ?? '#d1d5db' }} />
          <strong>{z.name}</strong>
        </span>
      ),
    },
    {
      key: 'order',
      label: 'Ordem',
      sortable: true,
      align: 'center',
      render: (z) => z.order,
    },
    {
      key: 'active',
      label: 'Status',
      sortable: true,
      render: (z) => (
        <AdminBadge variant={z.active ? 'active' : 'inactive'} label={z.active ? 'Ativa' : 'Inativa'} />
      ),
    },
    {
      key: '_tables',
      label: 'Mesas',
      align: 'center',
      render: (z) => {
        const count = countTables(z);
        return count > 0
          ? <span className="ff-admin-badge ff-admin-badge--blue">{count}</span>
          : <span style={{ color: '#d1d5db' }}>0</span>;
      },
    },
    {
      key: '_actions',
      label: '',
      width: '44px',
      render: (z) => (
        <AdminActionMenu
          items={[
            { key: 'edit',   label: 'Editar',                           icon: 'bi-pencil',    onClick: () => openEdit(z) },
            { key: 'toggle', label: z.active ? 'Desativar' : 'Ativar', icon: z.active ? 'bi-eye-slash' : 'bi-eye', onClick: () => toggleActive(z) },
            { key: 'delete', label: 'Excluir',                          icon: 'bi-trash',     variant: 'destructive', onClick: () => handleDelete(z) },
          ]}
        />
      ),
    },
  ];

  return (
    <div>
      <AdminPageHeader
        title="Zonas / Áreas"
        subtitle={`${zones.length} zona${zones.length !== 1 ? 's' : ''} cadastrada${zones.length !== 1 ? 's' : ''}`}
        actions={
          <AdminButton variant="primary" icon="bi-plus" onClick={openCreate}>
            Nova zona
          </AdminButton>
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div className="ff-admin-toolbar">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar zona..."
          />
        </div>

        <AdminCard noPad>
          <AdminTable<Zone>
            columns={columns}
            rows={filtered}
            sortBy={sortBy}
            sortDir={sortDir}
            onSort={handleSort}
            emptyIcon="bi-diagram-3"
            emptyTitle="Nenhuma zona cadastrada"
            emptyMessage="Crie zonas para organizar as mesas do seu restaurante."
          />
        </AdminCard>
      </div>

      {showModal && (
        <div className="ff-admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div
            className="ff-admin-modal"
            style={{ width: 440 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ff-admin-modal-header">
              <span className="ff-admin-modal-title">
                {editing ? `Editar zona "${editing.name}"` : 'Nova zona'}
              </span>
              <button className="ff-order-drawer-close" onClick={() => setShowModal(false)}>
                <i className="bi bi-x" />
              </button>
            </div>

            <div className="ff-admin-modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">
                  Nome <span className="ff-admin-form-required">*</span>
                </label>
                <input
                  className="ff-admin-form-input"
                  placeholder="ex: Salão Interno, Varanda, Terraço..."
                  value={form.name}
                  onChange={f('name')}
                  autoFocus
                />
              </div>

              <div className="ff-admin-form-grid-2">
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">Cor</label>
                  <input
                    type="color"
                    className="ff-admin-form-input"
                    style={{ height: 40, padding: '2px 4px', cursor: 'pointer' }}
                    value={form.color}
                    onChange={f('color')}
                  />
                </div>
                <div className="ff-admin-form-row">
                  <label className="ff-admin-form-label">Ordem de exibição</label>
                  <input
                    className="ff-admin-form-input"
                    type="number"
                    min={1}
                    placeholder="ex: 1"
                    value={form.order}
                    onChange={f('order')}
                  />
                </div>
              </div>

              <div className="ff-admin-form-row">
                <label className="ff-admin-form-label">Garçom padrão (opcional)</label>
                <select
                  className="ff-admin-form-select"
                  value={form.defaultWaiterId}
                  onChange={f('defaultWaiterId')}
                >
                  <option value="">— Sem atribuição padrão —</option>
                  {waiters.map((w) => (
                    <option key={w.id} value={w.id}>{w.name}</option>
                  ))}
                </select>
              </div>

              <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={form.active}
                  onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))}
                />
                Zona ativa
              </label>
            </div>

            <div className="ff-admin-modal-footer">
              <AdminButton variant="outline" onClick={() => setShowModal(false)}>
                Cancelar
              </AdminButton>
              <AdminButton
                variant="primary"
                onClick={handleSave}
                disabled={!form.name.trim()}
              >
                {editing ? 'Salvar alterações' : 'Criar zona'}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
