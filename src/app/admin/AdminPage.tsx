import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  categoryService,
  productService,
  tableService,
  branchService,
  tenantService,
  adminOrderService,
  kioskDeviceService,
} from '@/lib/services/adminService';
import { getCollection } from '@/lib/mock-db';
import { useNotify } from '@/lib/notifications';
import type { DbCategory, DbProduct, DbTable, DbOrder, Branch, Tenant, KioskDevice } from '@/lib/types';

type AdminSection =
  | 'dashboard'
  | 'products'
  | 'categories'
  | 'branches'
  | 'tables'
  | 'orders'
  | 'kiosks'
  | 'queue'
  | 'settings';

const NAV: { section: AdminSection; label: string; icon: string }[] = [
  { section: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
  { section: 'products', label: 'Produtos', icon: 'bi-box' },
  { section: 'categories', label: 'Categorias', icon: 'bi-tags' },
  { section: 'tables', label: 'Mesas', icon: 'bi-table' },
  { section: 'orders', label: 'Pedidos', icon: 'bi-receipt' },
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
  const [form, setForm] = useState({ name: '', description: '', price: '', imageUrl: '', categoryId: '', available: true, featured: false });
  const notify = useNotify();

  async function load() {
    const [p, c] = await Promise.all([productService.list(), categoryService.list()]);
    setProducts(p);
    setCategories(c);
  }

  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', description: '', price: '', imageUrl: '', categoryId: categories[0]?.id ?? '', available: true, featured: false });
    setShowModal(true);
  }

  function openEdit(p: DbProduct) {
    setEditing(p);
    setForm({ name: p.name, description: p.description ?? '', price: String(p.price), imageUrl: p.imageUrl, categoryId: p.categoryId, available: p.available, featured: p.featured ?? false });
    setShowModal(true);
  }

  async function handleSave() {
    const data = { name: form.name, description: form.description, price: parseFloat(form.price), imageUrl: form.imageUrl, categoryId: form.categoryId, available: form.available, featured: form.featured };
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

function Tables() {
  const [tables, setTables] = useState<DbTable[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({ number: '', active: true });
  const notify = useNotify();

  async function load() { setTables(await tableService.list()); }
  useEffect(() => { load(); }, []);

  async function handleSave() {
    await tableService.create({ number: form.number, active: form.active });
    notify('Mesa criada');
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

  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={() => { setForm({ number: '', active: true }); setShowModal(true); }}>
          <i className="bi bi-plus me-1" />Nova mesa
        </button>
      </div>
      <div className="ff-data-card">
        <table className="table table-hover mb-0">
          <thead><tr><th>Número</th><th>Status</th><th>QR Code</th><th>Ações</th></tr></thead>
          <tbody>
            {tables.map((t) => (
              <tr key={t.id}>
                <td><strong>Mesa {t.number}</strong></td>
                <td><span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>{t.active ? 'Ativa' : 'Inativa'}</span></td>
                <td>
                  <span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 13 }}>
                    {t.validationCode}
                  </span>
                  {' '}
                  <span style={{ fontSize: 11, color: '#9ca3af' }}>[QR placeholder]</span>
                </td>
                <td style={{ display: 'flex', gap: 4 }}>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => toggleActive(t)}><i className={`bi ${t.active ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => handleRegenCode(t.id)} title="Regenerar código"><i className="bi bi-arrow-repeat" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 340, display: 'flex', flexDirection: 'column', gap: 14 }} onClick={(e) => e.stopPropagation()}>
            <h5 style={{ margin: 0 }}>Nova mesa</h5>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Número</label>
              <input className="form-control form-control-sm" value={form.number} onChange={(e) => setForm((f) => ({ ...f, number: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary flex-1" onClick={handleSave}>Criar</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
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
  const [tenantForm, setTenantForm] = useState({ name: '', logoUrl: '' });
  const [branchForm, setBranchForm] = useState({
    name: '', address: '', serviceType: 'TABLE_SERVICE',
    queueEnabled: true, queueMessage: '',
    serviceFeeRate: '0.1', currency: 'BRL',
  });
  const notify = useNotify();

  useEffect(() => {
    Promise.all([tenantService.get(), branchService.get()]).then(([t, b]) => {
      if (t) { setTenant(t); setTenantForm({ name: t.name, logoUrl: t.logoUrl ?? '' }); }
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
    await tenantService.update({ name: tenantForm.name.trim(), logoUrl: tenantForm.logoUrl.trim() || undefined });
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

// Keep alias so existing references compile
const BranchSettings = RestaurantSettings;

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
          {section === 'branches' && <BranchSettings />}
          {section === 'settings' && <BranchSettings />}
          {section === 'kiosks' && <Kiosks />}
          {section === 'queue' && <BranchSettings />}
        </div>
      </div>
    </div>
  );
}
