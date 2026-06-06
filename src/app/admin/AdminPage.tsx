import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  categoryService,
  productService,
  tableService,
  zoneService,
  mockUserService,
  branchService,
  tenantService,
  adminOrderService,
  kioskDeviceService,
} from '@/lib/services/adminService';
import { getCollection, updateOne } from '@/lib/mock-db';
import { useNotify } from '@/lib/notifications';
import type { DbCategory, DbProduct, DbTable, Zone, MockUser, DbOrder, Branch, Tenant, KioskDevice, LoyaltyCard, AggregatorSettings, KitchenStation, QueueTicket } from '@/lib/types';
import { loyaltyService } from '@/lib/services/loyaltyService';
import { aggregatorService } from '@/lib/services/aggregatorService';
import { STAMPS_PER_REWARD } from '@/lib/types';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'branches'
  | 'tables'
  | 'orders'
  | 'kiosks'
  | 'queue'
  | 'settings'
  | 'loyalty'
  | 'aggregator';

const NAV: { section: AdminSection; label: string; icon: string }[] = [
  { section: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { section: 'products', label: 'Produtos', icon: 'bi-box' },
  { section: 'categories', label: 'Categorias', icon: 'bi-tags' },
  { section: 'tables', label: 'Mesas', icon: 'bi-table' },
  { section: 'orders', label: 'Pedidos', icon: 'bi-receipt' },
  { section: 'loyalty', label: 'Fidelidade', icon: 'bi-star' },
  { section: 'aggregator', label: 'Agregadores', icon: 'bi-phone' },
  { section: 'branches', label: 'Filiais', icon: 'bi-shop' },
  { section: 'kiosks', label: 'Kiosks', icon: 'bi-display' },
  { section: 'queue', label: 'Fila', icon: 'bi-people' },
  { section: 'settings', label: 'Configurações', icon: 'bi-gear' },
];

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function Dashboard() {
  const orders = getCollection<DbOrder>('orders');
  const today = new Date().toISOString().slice(0, 10);
  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const revenueToday = todayOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);
  const pendingKitchen = getCollection<{ status: string }>('kitchenTickets').filter((t) => t.status === 'NEW' || t.status === 'PREPARING').length;
  const ready = getCollection<{ status: string }>('kitchenTickets').filter((t) => t.status === 'READY').length;

  const productCounts: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => { productCounts[i.name] = (productCounts[i.name] ?? 0) + i.quantity; }));
  const topProducts = Object.entries(productCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 16, marginBottom: 28 }}>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Pedidos hoje</div>
          <div className="ff-metric-card-value">{todayOrders.length}</div>
        </div>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Receita hoje</div>
          <div className="ff-metric-card-value" style={{ color: '#059669', fontSize: 22 }}>{formatBRL(revenueToday)}</div>
        </div>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Na cozinha</div>
          <div className="ff-metric-card-value" style={{ color: '#d97706' }}>{pendingKitchen}</div>
        </div>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Prontos</div>
          <div className="ff-metric-card-value" style={{ color: '#059669' }}>{ready}</div>
        </div>
      </div>

      <div className="ff-data-card" style={{ maxWidth: 500 }}>
        <div className="ff-data-card-header">Produtos mais vendidos</div>
        {topProducts.length === 0 && <div className="text-center text-muted py-3">Nenhum pedido ainda</div>}
        <table className="table table-hover mb-0">
          <thead><tr><th>Produto</th><th>Qtd</th></tr></thead>
          <tbody>
            {topProducts.map(([name, qty]) => (
              <tr key={name}><td>{name}</td><td><strong>{qty}</strong></td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Products ─────────────────────────────────────────────────────────────────

function Products() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DbProduct | null>(null);
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', categoryId: '', available: true, featured: false, station: 'GENERAL' });
  const notify = useNotify();

  async function load() {
    const [p, c] = await Promise.all([productService.list(), categoryService.list()]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', imageUrl: '', categoryId: categories[0]?.id ?? '', available: true, featured: false, station: 'GENERAL' });
    setShowModal(true);
  }

  function openEdit(p: DbProduct) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '', price: String(p.price), imageUrl: p.imageUrl, categoryId: p.categoryId, available: p.available, featured: p.featured ?? false, station: p.station ?? 'GENERAL' });
    setShowModal(true);
  }

  async function handleSave() {
    const data = { name: form.name, description: form.description, price: parseFloat(form.price), imageUrl: form.imageUrl, categoryId: form.categoryId, available: form.available, featured: form.featured, station: form.station as KitchenStation };
    if (editing) { await productService.update(editing.id, data); notify('Produto atualizado'); }
    else { await productService.create(data); notify('Produto criado'); }
    setShowModal(false);
    load();
  }

  async function toggleAvailable(p: DbProduct) {
    await productService.update(p.id, { available: !p.available });
    notify(p.available ? 'Produto desativado' : 'Produto ativado');
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus me-1" />Novo produto</button>
      </div>
      <div className="ff-data-card">
        <table className="table table-hover mb-0">
          <thead><tr><th>Imagem</th><th>Nome</th><th>Categoria</th><th>Preço</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {products.map((p) => {
              const cat = categories.find((c) => c.id === p.categoryId);
              return (
                <tr key={p.id}>
                  <td><img src={p.imageUrl} alt={p.name} style={{ width: 48, height: 48, objectFit: 'cover', borderRadius: 6 }} /></td>
                  <td><strong>{p.name}</strong>{p.featured && <span className="badge bg-warning text-dark ms-1">Destaque</span>}</td>
                  <td>{cat?.name ?? '—'}</td>
                  <td>{formatBRL(p.price)}</td>
                  <td><span className={`badge ${p.available ? 'bg-success' : 'bg-secondary'}`}>{p.available ? 'Ativo' : 'Inativo'}</span></td>
                  <td style={{ display: 'flex', gap: 4 }}>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(p)}><i className="bi bi-pencil" /></button>
                    <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleAvailable(p)}><i className={`bi ${p.available ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <h5 style={{ margin: 0 }}>{editing ? 'Editar produto' : 'Novo produto'}</h5>
            {[['Nome', 'name', 'text'], ['Preço (R$)', 'price', 'number'], ['URL da imagem', 'imageUrl', 'url'], ['Descrição', 'description', 'text']].map(([label, field, type]) => (
              <div key={field}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
                <input className="form-control form-control-sm" type={type} value={(form as Record<string, string | boolean>)[field] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Categoria</label>
              <select className="form-select form-select-sm" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Estação da cozinha (F8)</label>
              <select className="form-select form-select-sm" value={form.station} onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}>
                <option value="GENERAL">Geral</option>
                <option value="GRILL">Churrasqueira / Grill</option>
                <option value="BAR">Bar / Bebidas</option>
                <option value="SALAD">Frios / Saladas</option>
                <option value="DESSERT">Sobremesas</option>
                <option value="FRYER">Frituras</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 16 }}>
              <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} />Disponível</label>
              <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Destaque</label>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={handleSave}>Salvar</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Categories ───────────────────────────────────────────────────────────────

function Categories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DbCategory | null>(null);
  const [form, setForm] = useState({ name: '', imageUrl: '', active: true });
  const notify = useNotify();

  async function load() { setCategories(await categoryService.list()); }
  useEffect(() => { load(); }, []);

  async function handleSave() {
    const order = editing?.order ?? categories.length + 1;
    if (editing) { await categoryService.update(editing.id, { ...form }); notify('Categoria atualizada'); }
    else { await categoryService.create({ ...form, order }); notify('Categoria criada'); }
    setShowModal(false);
    load();
  }

  async function toggleActive(c: DbCategory) {
    await categoryService.update(c.id, { active: !c.active });
    notify(c.active ? 'Categoria desativada' : 'Categoria ativada');
    load();
  }

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { setEditing(null); setForm({ name: '', imageUrl: '', active: true }); setShowModal(true); }}>
          <i className="bi bi-plus me-1" />Nova categoria
        </button>
      </div>
      <div className="ff-data-card">
        <table className="table table-hover mb-0">
          <thead><tr><th>#</th><th>Imagem</th><th>Nome</th><th>Status</th><th>Ações</th></tr></thead>
          <tbody>
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.order}</td>
                <td><img src={c.imageUrl} alt={c.name} style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 6 }} /></td>
                <td><strong>{c.name}</strong></td>
                <td><span className={`badge ${c.active ? 'bg-success' : 'bg-secondary'}`}>{c.active ? 'Ativa' : 'Inativa'}</span></td>
                <td style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditing(c); setForm({ name: c.name, imageUrl: c.imageUrl, active: c.active }); setShowModal(true); }}><i className="bi bi-pencil" /></button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(c)}><i className={`bi ${c.active ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 380, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <h5 style={{ margin: 0 }}>{editing ? 'Editar categoria' : 'Nova categoria'}</h5>
            {[['Nome', 'name'], ['URL da imagem', 'imageUrl']].map(([label, field]) => (
              <div key={field}>
                <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
                <input className="form-control form-control-sm" value={(form as Record<string, string | boolean>)[field] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
              </div>
            ))}
            <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />Ativa</label>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={handleSave}>Salvar</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Tables ───────────────────────────────────────────────────────────────────

const EMPTY_TABLE_FORM = {
  number: '',
  zoneName: '',
  assignedWaiterName: '',
  capacity: '',
  active: true,
  notes: '',
};

function Tables() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [zones, setZones] = useState<Zone[]>([]);
  const [waiters, setWaiters] = useState<MockUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<DbTable | null>(null);
  const [form, setForm] = useState(EMPTY_TABLE_FORM);
  const [newZoneName, setNewZoneName] = useState('');
  // Filter state
  const [search, setSearch] = useState('');
  const [zoneFilter, setZoneFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const notify = useNotify();

  async function load() {
    const [t, z, w] = await Promise.all([
      tableService.list(),
      zoneService.list(),
      mockUserService.listWaiters(),
    ]);
    setTables(t);
    setZones(z);
    setWaiters(w);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm(EMPTY_TABLE_FORM);
    setShowModal(true);
  }

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
    setShowModal(false);
    load();
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

  const f = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const filtered = tables.filter((t) => {
    if (search && !`mesa ${t.number}`.toLowerCase().includes(search.toLowerCase()) && !(t.zoneName ?? '').toLowerCase().includes(search.toLowerCase()) && !(t.assignedWaiterName ?? '').toLowerCase().includes(search.toLowerCase())) return false;
    if (zoneFilter && t.zoneName !== zoneFilter) return false;
    if (statusFilter === 'active' && !t.active) return false;
    if (statusFilter === 'inactive' && t.active) return false;
    return true;
  });

  const hasFilters = search || zoneFilter || statusFilter !== 'all';

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus me-1" />Nova mesa
        </button>
      </div>

      {/* Two-column layout: main list | zones sidebar */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>

        {/* ── Left: filter bar + table list ── */}
        <div>
          {/* Filter bar */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            {/* Search */}
            <div style={{ position: 'relative', flex: '0 0 200px' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem', pointerEvents: 'none' }} />
              <input
                className="form-control form-control-sm"
                style={{ paddingLeft: 30 }}
                placeholder="Buscar mesa, zona, garçom..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Zone chips */}
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(['', ...zones.map((z) => z.name)] as string[]).map((z) => (
                <button
                  key={z || '__all__'}
                  style={{
                    background: zoneFilter === z ? '#1d4ed8' : '#f3f4f6',
                    color: zoneFilter === z ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                  }}
                  onClick={() => setZoneFilter(z)}
                >
                  {z || 'Todas as zonas'}
                </button>
              ))}
            </div>

            {/* Status toggle */}
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button
                  key={s}
                  style={{
                    background: statusFilter === s ? '#1d4ed8' : '#f3f4f6',
                    color: statusFilter === s ? '#fff' : '#374151',
                    border: 'none',
                    borderRadius: 20,
                    padding: '3px 12px',
                    fontSize: '0.78rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                  onClick={() => setStatusFilter(s)}
                >
                  {s === 'all' ? 'Todas' : s === 'active' ? 'Ativas' : 'Inativas'}
                </button>
              ))}
            </div>
          </div>

          {/* Results summary + clear */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 24 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {filtered.length === tables.length
                ? `${tables.length} mesa${tables.length !== 1 ? 's' : ''}`
                : `${filtered.length} de ${tables.length} mesas`}
            </span>
            {hasFilters && (
              <button
                style={{ background: 'none', border: 'none', fontSize: 12, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}
                onClick={() => { setSearch(''); setZoneFilter(''); setStatusFilter('all'); }}
              >
                Limpar filtros
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="ff-data-card">
            <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
              <thead>
                <tr>
                  <th>Mesa</th>
                  <th>Zona</th>
                  <th>Garçom</th>
                  <th style={{ textAlign: 'center' }}>Lugares</th>
                  <th>Status</th>
                  <th>Validação</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0' }}>
                      <i className="bi bi-search" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} />
                      Nenhuma mesa encontrada
                    </td>
                  </tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td>
                      <strong>Mesa {t.number}</strong>
                      {t.notes && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }} title={t.notes}>
                          <i className="bi bi-chat-left-dots" />
                        </span>
                      )}
                    </td>
                    <td>
                      {t.zoneName
                        ? <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, padding: '1px 7px', fontSize: 12, fontWeight: 500 }}>{t.zoneName}</span>
                        : <span style={{ color: '#d1d5db' }}>—</span>}
                    </td>
                    <td>{t.assignedWaiterName ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{t.capacity ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td>
                      <span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>
                        {t.active ? 'Ativa' : 'Inativa'}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>
                        {t.validationCode}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-outline-secondary" title="Editar" onClick={() => openEdit(t)}>
                          <i className="bi bi-pencil" />
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" title={t.active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(t)}>
                          <i className={`bi ${t.active ? 'bi-eye-slash' : 'bi-eye'}`} />
                        </button>
                        <button className="btn btn-sm btn-outline-secondary" title="Regenerar código QR" onClick={() => handleRegenCode(t.id)}>
                          <i className="bi bi-arrow-repeat" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Right: zones panel (sticky) ── */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="ff-data-card">
            <div className="ff-data-card-header">
              Zonas / Áreas
              <span className="badge bg-secondary ms-2">{zones.length}</span>
            </div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zones.length === 0 && (
                <div style={{ fontSize: 13, color: '#9ca3af' }}>Nenhuma zona cadastrada.</div>
              )}
              {zones.map((z) => (
                <div
                  key={z.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 8px',
                    borderRadius: 6,
                    background: zoneFilter === z.name ? '#eff6ff' : 'transparent',
                    cursor: 'pointer',
                  }}
                  onClick={() => setZoneFilter(zoneFilter === z.name ? '' : z.name)}
                >
                  <i className="bi bi-diagram-3" style={{ color: zoneFilter === z.name ? '#1d4ed8' : '#9ca3af', fontSize: 13, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: zoneFilter === z.name ? 600 : 400, color: zoneFilter === z.name ? '#1d4ed8' : '#374151' }}>
                    {z.name}
                  </span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>
                    {tables.filter((t) => t.zoneName === z.name).length}
                  </span>
                  <button
                    className="btn btn-sm"
                    style={{ padding: '1px 6px', color: '#9ca3af', background: 'none', border: 'none', flexShrink: 0 }}
                    title="Remover zona"
                    onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id); }}
                  >
                    <i className="bi bi-trash" style={{ fontSize: 11 }} />
                  </button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                <input
                  className="form-control form-control-sm"
                  placeholder="Nova zona..."
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleAddZone(); }}
                />
                <button className="btn btn-sm btn-outline-primary" style={{ flexShrink: 0 }} onClick={handleAddZone}>
                  <i className="bi bi-plus" />
                </button>
              </div>
            </div>
          </div>
        </div>

      </div>{/* end two-column grid */}

      {/* Create / Edit modal */}
      {showModal && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <h5 style={{ margin: 0 }}>{editing ? `Editar Mesa ${editing.number}` : 'Nova mesa'}</h5>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Número / Nome *</label>
                <input
                  className="form-control form-control-sm"
                  placeholder="ex: 1, A3, VIP-1"
                  value={form.number}
                  onChange={f('number')}
                  autoFocus
                />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Capacidade (lugares)</label>
                <input
                  className="form-control form-control-sm"
                  type="number"
                  min={1}
                  max={50}
                  placeholder="ex: 4"
                  value={form.capacity}
                  onChange={f('capacity')}
                />
              </div>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Zona / Área</label>
              <select className="form-select form-select-sm" value={form.zoneName} onChange={f('zoneName')}>
                <option value="">— Sem zona —</option>
                {zones.map((z) => (
                  <option key={z.id} value={z.name}>{z.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Garçom responsável</label>
              <select className="form-select form-select-sm" value={form.assignedWaiterName} onChange={f('assignedWaiterName')}>
                <option value="">— Sem atribuição —</option>
                {waiters.map((w) => (
                  <option key={w.id} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Observações</label>
              <textarea
                className="form-control form-control-sm"
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

            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button
                className="btn btn-primary flex-1"
                onClick={handleSave}
                disabled={!form.number.trim()}
              >
                {editing ? 'Salvar alterações' : 'Criar mesa'}
              </button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Orders ───────────────────────────────────────────────────────────────────

function Orders() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [filter, setFilter] = useState('');

  useEffect(() => { adminOrderService.list().then(setOrders); }, []);

  const filtered = filter
    ? orders.filter((o) => o.status === filter || o.paymentStatus === filter)
    : orders;

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', gap: 8 }}>
        {['', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'PAID'].map((s) => (
          <button key={s} className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline-secondary'}`} onClick={() => setFilter(s)}>
            {s || 'Todos'}
          </button>
        ))}
      </div>
      <div className="ff-data-card">
        <table className="table table-hover mb-0">
          <thead><tr><th>Pedido</th><th>Cliente</th><th>Mesa</th><th>Total</th><th>Status</th><th>Pagamento</th><th>Origem</th><th>Data</th></tr></thead>
          <tbody>
            {filtered.map((o) => (
              <tr key={o.id}>
                <td><strong>{o.orderNumber}</strong></td>
                <td>{o.customerName}</td>
                <td>{o.tableNumber ?? '—'}</td>
                <td>{formatBRL(o.total)}</td>
                <td><span className="badge bg-secondary" style={{ fontSize: 11 }}>{o.status}</span></td>
                <td><span className={`badge ${o.paymentStatus === 'PAID' ? 'bg-success' : o.paymentStatus === 'PARTIALLY_PAID' ? 'bg-warning text-dark' : 'bg-secondary'}`} style={{ fontSize: 11 }}>{o.paymentStatus}</span></td>
                <td><span className="badge bg-info text-dark" style={{ fontSize: 11 }}>{o.source}</span></td>
                <td style={{ fontSize: 12, color: '#6b7280' }}>{new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Branch Settings ──────────────────────────────────────────────────────────

function RestaurantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' as 'es' | 'pt-BR' | 'en' });
  const [branchForm, setBranchForm] = useState({
    name: '', address: '', serviceType: 'TABLE_SERVICE',
    queueEnabled: true, queueMessage: '',
    serviceFeeRate: '0.1', currency: 'BRL',
  });
  const notify = useNotify();

  useEffect(() => {
    Promise.all([tenantService.get(), branchService.get()]).then(([t, b]) => {
      if (t) { setTenant(t); setTenantForm({ name: t.name, logoUrl: t.logoUrl ?? '', defaultLanguage: t.defaultLanguage ?? 'pt-BR' }); }
      if (b) {
        setBranch(b);
        setBranchForm({
          name: b.name, address: b.address ?? '',
          serviceType: b.serviceType, queueEnabled: b.queueEnabled,
          queueMessage: b.queueMessage ?? '',
          serviceFeeRate: String(b.serviceFeeRate ?? 0.1),
          currency: b.currency ?? 'BRL',
        });
      }
    });
  }, []);

  async function handleSaveTenant() {
    if (!tenant) return;
    await tenantService.update({
      name: tenantForm.name.trim(),
      logoUrl: tenantForm.logoUrl.trim() || undefined,
      defaultLanguage: tenantForm.defaultLanguage,
    });
    notify('Restaurante atualizado — nome refletido no Menu e Kiosk');
  }

  async function handleSaveBranch() {
    if (!branch) return;
    await branchService.update({
      ...branchForm,
      serviceType: branchForm.serviceType as Branch['serviceType'],
      serviceFeeRate: parseFloat(branchForm.serviceFeeRate) || 0.1,
    });
    notify('Filial atualizada');
  }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Tenant / Restaurant */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">Restaurante</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nome do restaurante</label>
            <input className="form-control form-control-sm" value={tenantForm.name}
              onChange={(e) => setTenantForm((f) => ({ ...f, name: e.target.value }))} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Este nome aparece no cabeçalho do Menu Digital e no Kiosk.
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>URL do logotipo</label>
            <input className="form-control form-control-sm" placeholder="https://..." value={tenantForm.logoUrl}
              onChange={(e) => setTenantForm((f) => ({ ...f, logoUrl: e.target.value }))} />
          </div>
          {tenantForm.logoUrl && (
            <img src={tenantForm.logoUrl} alt="Logo preview" style={{ height: 48, objectFit: 'contain', borderRadius: 6 }} />
          )}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Idioma padrão</label>
            <select
              className="form-select form-select-sm"
              value={tenantForm.defaultLanguage}
              onChange={(e) => setTenantForm((f) => ({ ...f, defaultLanguage: e.target.value as 'es' | 'pt-BR' | 'en' }))}
            >
              <option value="pt-BR">🇧🇷 Português</option>
              <option value="es">🇦🇷 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>
              Idioma inicial para o Menu Digital e Kiosk deste tenant.
            </div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveTenant}>Salvar restaurante</button>
        </div>
      </div>

      {/* Branch */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">Filial / Unidade</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {([['Nome da filial', 'name'], ['Endereço', 'address'], ['Mensagem da fila', 'queueMessage']] as const).map(([label, field]) => (
            <div key={field}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
              <input className="form-control form-control-sm"
                value={branchForm[field] as string}
                onChange={(e) => setBranchForm((f) => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Moeda</label>
              <select className="form-select form-select-sm" value={branchForm.currency}
                onChange={(e) => setBranchForm((f) => ({ ...f, currency: e.target.value }))}>
                <option value="BRL">BRL — R$</option>
                <option value="USD">USD — $</option>
                <option value="ARS">ARS — $</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Taxa de serviço</label>
              <div className="input-group input-group-sm">
                <input className="form-control" type="number" min="0" max="0.5" step="0.01"
                  value={branchForm.serviceFeeRate}
                  onChange={(e) => setBranchForm((f) => ({ ...f, serviceFeeRate: e.target.value }))} />
                <span className="input-group-text">%×100</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Ex: 0.1 = 10%</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Tipo de serviço</label>
            <select className="form-select form-select-sm" value={branchForm.serviceType}
              onChange={(e) => setBranchForm((f) => ({ ...f, serviceType: e.target.value }))}>
              <option value="TABLE_SERVICE">Serviço de mesa</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="KIOSK_SELF_SERVICE">Kiosk / Autoatendimento</option>
            </select>
          </div>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" className="me-1" checked={branchForm.queueEnabled}
              onChange={(e) => setBranchForm((f) => ({ ...f, queueEnabled: e.target.checked }))} />
            Fila habilitada
          </label>
          <button className="btn btn-primary" onClick={handleSaveBranch}>Salvar filial</button>
        </div>
      </div>
    </div>
  );
}

// ─── F4: Loyalty ──────────────────────────────────────────────────────────────

function LoyaltySection() {
  const [cards, setCards] = useState<LoyaltyCard[]>([]);
  useEffect(() => { loyaltyService.listAll().then(setCards); }, []);

  return (
    <div className="ff-data-card">
      <div className="ff-data-card-header">
        Cartões fidelidade
        <span className="badge bg-primary">{cards.length}</span>
      </div>
      {cards.length === 0 && <div className="text-center text-muted py-4">Nenhum cliente cadastrado ainda.</div>}
      <table className="table table-hover mb-0">
        <thead><tr><th>Cliente</th><th>Telefone</th><th>Selos</th><th>Total ganho</th><th>Descontos usados</th></tr></thead>
        <tbody>
          {cards.map((c) => (
            <tr key={c.id}>
              <td><strong>{c.customerName}</strong></td>
              <td>{c.customerPhone}</td>
              <td>
                <div style={{ display: 'flex', gap: 4 }}>
                  {Array.from({ length: STAMPS_PER_REWARD }).map((_, i) => (
                    <span key={i} style={{ fontSize: 16 }}>{i < c.stamps ? '⭐' : '○'}</span>
                  ))}
                </div>
                <div style={{ fontSize: 11, color: '#6b7280' }}>{c.stamps}/{STAMPS_PER_REWARD}</div>
              </td>
              <td>{c.totalStampsEarned}</td>
              <td>{c.discountsUsed}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── F10: Aggregator settings ─────────────────────────────────────────────────

function AggregatorSection() {
  const [settings, setSettings] = useState<AggregatorSettings[]>([]);
  const notify = useNotify();

  useEffect(() => { aggregatorService.listSettings().then(setSettings); }, []);

  async function handleToggle(s: AggregatorSettings) {
    await aggregatorService.updateSettings(s.id, { active: !s.active });
    notify(`${aggregatorService.getPlatformName(s.platform)} ${!s.active ? 'ativado' : 'desativado'}`);
    aggregatorService.listSettings().then(setSettings);
  }

  async function handleSimulate(s: AggregatorSettings) {
    await aggregatorService.simulateIncomingOrder(s.platform);
    notify(`Pedido simulado de ${aggregatorService.getPlatformName(s.platform)} enviado à cozinha`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
      {settings.map((s) => (
        <div key={s.id} className="ff-data-card">
          <div className="ff-data-card-header">
            <span>
              <span
                className="ff-platform-badge me-2"
                style={{ background: aggregatorService.getPlatformColor(s.platform) }}
              >
                {aggregatorService.getPlatformName(s.platform)}
              </span>
              {s.externalId && <span style={{ fontSize: 12, color: '#9ca3af' }}>ID: {s.externalId}</span>}
            </span>
            <span className={`badge ${s.active ? 'bg-success' : 'bg-secondary'}`}>
              {s.active ? 'Ativo' : 'Inativo'}
            </span>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleToggle(s)}>
              {s.active ? 'Desativar' : 'Ativar'}
            </button>
            {s.active && (
              <button className="btn btn-sm btn-primary" onClick={() => handleSimulate(s)}>
                <i className="bi bi-lightning me-1" />Simular pedido
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Kiosks ───────────────────────────────────────────────────────────────────

function Kiosks() {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  useEffect(() => { kioskDeviceService.list().then(setDevices); }, []);

  const statusColor: Record<string, string> = { ONLINE: '#059669', OFFLINE: '#6b7280', MAINTENANCE: '#d97706' };

  return (
    <div className="ff-data-card">
      <table className="table table-hover mb-0">
        <thead><tr><th>Nome</th><th>Status</th></tr></thead>
        <tbody>
          {devices.map((d) => (
            <tr key={d.id}>
              <td><strong>{d.name}</strong></td>
              <td><span style={{ color: statusColor[d.status], fontWeight: 600 }}>● {d.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ─── Queue ────────────────────────────────────────────────────────────────────

const TICKET_STATUS_LABEL: Record<string, string> = {
  WAITING: 'Aguardando', CALLED: 'Chamado', SERVING: 'Atendendo',
  COMPLETED: 'Concluído', CANCELED: 'Cancelado',
};

function QueueSection() {
  const [branch, setBranch] = useState<Branch | null>(null);
  const [tickets, setTickets] = useState<QueueTicket[]>([]);
  const [queueMsg, setQueueMsg] = useState('');
  const [queueEnabled, setQueueEnabled] = useState(false);
  const notify = useNotify();

  function loadTickets() {
    setTickets(
      getCollection<QueueTicket>('queueTickets').sort((a, b) => a.ticketNumber - b.ticketNumber),
    );
  }

  async function load() {
    const b = await branchService.get();
    setBranch(b);
    if (b) { setQueueEnabled(b.queueEnabled); setQueueMsg(b.queueMessage ?? ''); }
    loadTickets();
  }

  useEffect(() => { load(); }, []);

  async function handleToggle() {
    const next = !queueEnabled;
    await branchService.update({ queueEnabled: next });
    setQueueEnabled(next);
    notify(next ? 'Fila ativada — visível no Menu Digital' : 'Fila desativada');
  }

  async function handleSaveMsg() {
    await branchService.update({ queueMessage: queueMsg });
    notify('Mensagem da fila atualizada');
  }

  function callNext() {
    const next = tickets.find((t) => t.status === 'WAITING');
    if (!next) return;
    updateOne<QueueTicket>('queueTickets', next.id, { status: 'CALLED' });
    notify(`Chamando senha #${next.ticketNumber} — ${next.customerName}`);
    loadTickets();
  }

  function advanceTicket(id: string, to: 'SERVING' | 'COMPLETED') {
    updateOne<QueueTicket>('queueTickets', id, { status: to });
    loadTickets();
  }

  const waiting = tickets.filter((t) => t.status === 'WAITING');
  const active  = tickets.filter((t) => t.status === 'CALLED' || t.status === 'SERVING');
  const open    = tickets.filter((t) => t.status !== 'COMPLETED' && t.status !== 'CANCELED');
  const done    = tickets.filter((t) => t.status === 'COMPLETED').length;

  if (!branch) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 680 }}>

      {/* Settings card */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">
          Configurações da fila
          <span className={`badge ms-2 ${queueEnabled ? 'bg-success' : 'bg-secondary'}`}>
            {queueEnabled ? 'Ativa' : 'Inativa'}
          </span>
        </div>
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              style={{
                width: 44, height: 24, borderRadius: 12, cursor: 'pointer',
                background: queueEnabled ? '#059669' : '#d1d5db',
                position: 'relative', transition: 'background 0.18s', flexShrink: 0,
              }}
              onClick={handleToggle}
            >
              <div style={{
                width: 20, height: 20, borderRadius: '50%', background: '#fff',
                position: 'absolute', top: 2, left: queueEnabled ? 22 : 2, transition: 'left 0.18s',
              }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 600, color: queueEnabled ? '#059669' : '#6b7280' }}>
              {queueEnabled ? 'Fila habilitada — visível no Menu Digital' : 'Fila desabilitada'}
            </span>
          </div>
          {/* Message */}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>
              Mensagem exibida aos clientes
            </label>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="form-control form-control-sm"
                value={queueMsg}
                onChange={(e) => setQueueMsg(e.target.value)}
                placeholder="ex: Acompanhe seu pedido aqui!"
              />
              <button className="btn btn-sm btn-primary" onClick={handleSaveMsg}>Salvar</button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Aguardando</div>
          <div className="ff-metric-card-value" style={{ color: '#d97706' }}>{waiting.length}</div>
        </div>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Sendo atendido</div>
          <div className="ff-metric-card-value" style={{ color: '#059669' }}>{active.length}</div>
        </div>
        <div className="ff-metric-card">
          <div className="ff-metric-card-label">Concluídos</div>
          <div className="ff-metric-card-value">{done}</div>
        </div>
      </div>

      {/* Call next */}
      {waiting.length > 0 && (
        <button className="btn btn-success" style={{ alignSelf: 'flex-start' }} onClick={callNext}>
          <i className="bi bi-megaphone me-2" />
          Chamar próxima — #{waiting[0].ticketNumber} · {waiting[0].customerName}
        </button>
      )}

      {/* Ticket list */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">
          Senhas em aberto
          {open.length > 0 && <span className="badge bg-primary ms-2">{open.length}</span>}
        </div>
        {open.length === 0 ? (
          <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9ca3af' }}>
            <i className="bi bi-people" style={{ fontSize: 32, display: 'block', marginBottom: 8 }} />
            Nenhuma senha em aberto no momento.
          </div>
        ) : (
          <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
            <thead>
              <tr><th>Senha</th><th>Cliente</th><th>Pedido</th><th>Status</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {open.map((ticket) => (
                <tr key={ticket.id}>
                  <td><strong>#{ticket.ticketNumber}</strong></td>
                  <td>{ticket.customerName}</td>
                  <td style={{ color: '#6b7280' }}>{ticket.orderNumber}</td>
                  <td>
                    <span className={`badge ${
                      ticket.status === 'WAITING' ? 'bg-warning text-dark' :
                      ticket.status === 'CALLED'  ? 'bg-primary' : 'bg-success'
                    }`}>
                      {TICKET_STATUS_LABEL[ticket.status] ?? ticket.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 6 }}>
                      {ticket.status === 'WAITING' && (
                        <button className="btn btn-sm btn-outline-primary" onClick={() => { updateOne<QueueTicket>('queueTickets', ticket.id, { status: 'CALLED' }); loadTickets(); }}>
                          Chamar
                        </button>
                      )}
                      {ticket.status === 'CALLED' && (
                        <button className="btn btn-sm btn-outline-success" onClick={() => advanceTicket(ticket.id, 'SERVING')}>
                          Atender
                        </button>
                      )}
                      {ticket.status === 'SERVING' && (
                        <button className="btn btn-sm btn-success" onClick={() => advanceTicket(ticket.id, 'COMPLETED')}>
                          Concluir
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Main AdminPage ───────────────────────────────────────────────────────────

export function AdminPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [section, setSection] = useState<AdminSection>('dashboard');

  useEffect(() => {
    const s = location.pathname.split('/admin/')[1] as AdminSection | undefined;
    if (s && NAV.find((n) => n.section === s)) setSection(s);
  }, [location.pathname]);

  function goTo(s: AdminSection) {
    setSection(s);
    navigate(`/admin/${s}`);
  }

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo"><i className="bi bi-grid-1x2 me-2" />Admin</div>
        <nav className="ff-area-sidebar-nav">
          {NAV.map((n) => (
            <button key={n.section} className={`ff-nav-item ${section === n.section ? 'active' : ''}`} onClick={() => goTo(n.section)}>
              <i className={`bi ${n.icon}`} />{n.label}
            </button>
          ))}
          <button className="ff-nav-item" onClick={() => navigate('/')}><i className="bi bi-house" />Hub</button>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <span className="ff-area-topbar-title">{NAV.find((n) => n.section === section)?.label}</span>
        </div>
        <div className="ff-area-content">
          {section === 'dashboard' && <Dashboard />}
          {section === 'products' && <Products />}
          {section === 'categories' && <Categories />}
          {section === 'tables' && <Tables />}
          {section === 'orders' && <Orders />}
          {section === 'branches' && <RestaurantSettings />}
          {section === 'settings' && <RestaurantSettings />}
          {section === 'kiosks' && <Kiosks />}
          {section === 'queue' && <QueueSection />}
          {section === 'loyalty' && <LoyaltySection />}
          {section === 'aggregator' && <AggregatorSection />}
        </div>
      </div>
    </div>
  );
}
