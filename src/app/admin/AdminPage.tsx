import { useEffect, useRef, useState, type ReactNode } from 'react';
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

type NavItem = { section: AdminSection; label: string; icon: string };
type NavGroup = { label: string; items: NavItem[] };

const NAV_GROUPS: NavGroup[] = [
  {
    label: 'Operação',
    items: [
      { section: 'dashboard', label: 'Dashboard', icon: 'bi-grid-1x2' },
      { section: 'orders',    label: 'Pedidos',   icon: 'bi-receipt' },
      { section: 'queue',     label: 'Fila',      icon: 'bi-people' },
    ],
  },
  {
    label: 'Catálogo',
    items: [
      { section: 'products',   label: 'Produtos',   icon: 'bi-box' },
      { section: 'categories', label: 'Categorias', icon: 'bi-tags' },
    ],
  },
  {
    label: 'Estabelecimento',
    items: [
      { section: 'tables',   label: 'Mesas',  icon: 'bi-table' },
      { section: 'branches', label: 'Filiais', icon: 'bi-shop' },
      { section: 'kiosks',   label: 'Kiosks', icon: 'bi-display' },
    ],
  },
  {
    label: 'Crescimento',
    items: [
      { section: 'loyalty',    label: 'Fidelidade', icon: 'bi-star' },
      { section: 'aggregator', label: 'Agregadores', icon: 'bi-phone' },
    ],
  },
  {
    label: 'Configurações',
    items: [
      { section: 'settings', label: 'Configurações', icon: 'bi-gear' },
    ],
  },
];

const NAV: NavItem[] = NAV_GROUPS.flatMap((g) => g.items);

function AdminClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="ff-area-topbar-clock">
      {now.toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}
      {' · '}
      {now.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
    </span>
  );
}

function formatBRL(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return 'agora';
  if (diff < 60) return `${diff} min`;
  return `${Math.floor(diff / 60)}h`;
}

function calcDelta(today: number, yesterday: number): { pct: number; up: boolean } | null {
  if (yesterday === 0) return null;
  const pct = Math.round(((today - yesterday) / yesterday) * 100);
  return { pct: Math.abs(pct), up: pct >= 0 };
}

const STATUS_FEED_COLOR: Record<string, string> = {
  SENT_TO_KITCHEN: '#1d4ed8',
  PREPARING:       '#d97706',
  READY:           '#059669',
  DELIVERED:       '#7c3aed',
  CLOSED:          '#374151',
  CANCELED:        '#dc2626',
  CREATED:         '#6b7280',
};

const STATUS_FEED_LABEL: Record<string, string> = {
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
  CREATED:         'Criado',
  DRAFT:           'Rascunho',
};

function DeltaBadge({ today, yesterday }: { today: number; yesterday: number }) {
  const d = calcDelta(today, yesterday);
  if (d === null) return null;
  return (
    <span className={`ff-metric-delta ${d.up ? 'up' : 'down'}`}>
      <i className={`bi bi-arrow-${d.up ? 'up' : 'down'}`} />
      {d.pct}%
    </span>
  );
}

function Dashboard() {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 5000);
    return () => clearInterval(t);
  }, []);

  const orders = getCollection<DbOrder>('orders');
  const products = getCollection<DbProduct>('products');
  const today = new Date().toISOString().slice(0, 10);
  const yDate = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  const todayOrders = orders.filter((o) => o.createdAt.startsWith(today));
  const yOrders     = orders.filter((o) => o.createdAt.startsWith(yDate));

  const revenueToday = todayOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);
  const revenueY     = yOrders.filter((o) => o.paymentStatus === 'PAID').reduce((s, o) => s + o.total, 0);

  const avgTicket  = todayOrders.length > 0 ? revenueToday / todayOrders.length : 0;
  const avgTicketY = yOrders.length > 0 ? revenueY / yOrders.length : 0;

  const pendingKitchen = getCollection<{ status: string }>('kitchenTickets').filter(
    (t) => t.status === 'NEW' || t.status === 'PREPARING',
  ).length;

  const completedToday = todayOrders.filter(
    (o) => o.status === 'READY' || o.status === 'DELIVERED' || o.status === 'CLOSED',
  );
  const avgPrepMin = completedToday.length > 0
    ? Math.round(completedToday.reduce((s, o) => s + (new Date(o.updatedAt).getTime() - new Date(o.createdAt).getTime()), 0) / completedToday.length / 60000)
    : 0;

  // Hourly chart — show hours 7–22
  const currentHour = new Date().getHours();
  const chartHours = Array.from({ length: 16 }, (_, i) => i + 7);
  const hourlyMax = Math.max(
    ...chartHours.map((h) => todayOrders.filter((o) => new Date(o.createdAt).getHours() === h).length),
    1,
  );

  // Activity feed — last 8 orders sorted by createdAt desc
  const feed = [...orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  // Top products with image
  const productCounts: Record<string, number> = {};
  orders.forEach((o) => o.items.forEach((i) => { productCounts[i.name] = (productCounts[i.name] ?? 0) + i.quantity; }));
  const topProducts = Object.entries(productCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, qty]) => ({ name, qty, imageUrl: products.find((p) => p.name === name)?.imageUrl }));
  const maxQty = topProducts[0]?.qty ?? 1;

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  void tick;

  return (
    <div className="ff-dash">
      {/* ── Metric cards ── */}
      <div className="ff-dash-metrics">
        <div className="ff-metric-card-v2">
          <div className="ff-metric-card-v2-top">
            <div className="ff-metric-icon blue"><i className="bi bi-receipt" /></div>
            <DeltaBadge today={todayOrders.length} yesterday={yOrders.length} />
          </div>
          <div>
            <div className="ff-metric-card-v2-value">{todayOrders.length}</div>
            <div className="ff-metric-card-v2-label">Pedidos hoje</div>
          </div>
        </div>

        <div className="ff-metric-card-v2">
          <div className="ff-metric-card-v2-top">
            <div className="ff-metric-icon green"><i className="bi bi-cash-coin" /></div>
            <DeltaBadge today={revenueToday} yesterday={revenueY} />
          </div>
          <div>
            <div className="ff-metric-card-v2-value" style={{ fontSize: 22 }}>{formatBRL(revenueToday)}</div>
            <div className="ff-metric-card-v2-label">Receita hoje</div>
          </div>
        </div>

        <div className="ff-metric-card-v2">
          <div className="ff-metric-card-v2-top">
            <div className="ff-metric-icon purple"><i className="bi bi-graph-up" /></div>
            <DeltaBadge today={avgTicket} yesterday={avgTicketY} />
          </div>
          <div>
            <div className="ff-metric-card-v2-value" style={{ fontSize: 22 }}>{formatBRL(avgTicket)}</div>
            <div className="ff-metric-card-v2-label">Ticket médio</div>
          </div>
        </div>

        <div className="ff-metric-card-v2">
          <div className="ff-metric-card-v2-top">
            <div className="ff-metric-icon amber"><i className="bi bi-fire" /></div>
          </div>
          <div>
            <div className="ff-metric-card-v2-value" style={{ color: '#d97706' }}>{pendingKitchen}</div>
            <div className="ff-metric-card-v2-label">Na cozinha</div>
          </div>
        </div>

        <div className="ff-metric-card-v2">
          <div className="ff-metric-card-v2-top">
            <div className="ff-metric-icon slate"><i className="bi bi-clock-history" /></div>
          </div>
          <div>
            <div className="ff-metric-card-v2-value">{avgPrepMin > 0 ? `${avgPrepMin} min` : '—'}</div>
            <div className="ff-metric-card-v2-label">Tempo médio preparo</div>
          </div>
        </div>
      </div>

      {/* ── Chart + Feed ── */}
      <div className="ff-dash-row">
        <div className="ff-dash-chart">
          <div className="ff-dash-chart-header">
            <span className="ff-dash-chart-title">Pedidos por hora</span>
            <span className="ff-dash-chart-subtitle">Hoje</span>
          </div>
          <div className="ff-dash-chart-bars">
            {chartHours.map((h) => {
              const count = todayOrders.filter((o) => new Date(o.createdAt).getHours() === h).length;
              const heightPct = (count / hourlyMax) * 100;
              const isCurrent = h === currentHour;
              return (
                <div key={h} className={`ff-dash-chart-col${isCurrent ? ' current' : ''}`}>
                  <div
                    className={`ff-dash-chart-bar${count > 0 ? ' has-data' : ''}`}
                    style={{ height: `${Math.max(heightPct, 3)}%` }}
                  >
                    {count > 0 && <div className="ff-dash-chart-tip">{count} pedido{count !== 1 ? 's' : ''}</div>}
                  </div>
                  <span className="ff-dash-chart-label">{h}h</span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="ff-dash-feed">
          <div className="ff-dash-feed-header">
            Atividade
            <div className="ff-dash-feed-live">
              <span className="ff-dash-feed-live-dot" />
              ao vivo
            </div>
          </div>
          {feed.length === 0 ? (
            <div style={{ padding: '28px 20px', textAlign: 'center', color: '#9ca3af', fontSize: 13 }}>
              Nenhum pedido ainda
            </div>
          ) : (
            feed.map((o) => (
              <div key={o.id} className="ff-dash-feed-item">
                <div className="ff-dash-feed-dot" style={{ background: STATUS_FEED_COLOR[o.status] ?? '#9ca3af' }} />
                <div className="ff-dash-feed-text">
                  <div className="ff-dash-feed-main">
                    #{o.orderNumber}
                    {o.tableNumber ? ` · Mesa ${o.tableNumber}` : ''}
                    {' · '}{o.customerName}
                  </div>
                  <div className="ff-dash-feed-sub">
                    {STATUS_FEED_LABEL[o.status] ?? o.status}
                    {' · '}{o.source}
                  </div>
                </div>
                <div className="ff-dash-feed-time">{timeAgo(o.createdAt)}</div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ── Top products ── */}
      {topProducts.length > 0 && (
        <div className="ff-dash-top">
          <div className="ff-dash-top-header">Produtos mais vendidos</div>
          {topProducts.map(({ name, qty, imageUrl }, i) => (
            <div key={name} className="ff-dash-top-item">
              <span className={`ff-dash-top-rank ${i === 0 ? 'gold' : i === 1 ? 'silver' : i === 2 ? 'bronze' : ''}`}>
                {i + 1}
              </span>
              {imageUrl
                ? <img src={imageUrl} alt="" className="ff-dash-top-img" />
                : <div className="ff-dash-top-img-ph"><i className="bi bi-box" /></div>
              }
              <div className="ff-dash-top-info">
                <div className="ff-dash-top-name">{name}</div>
                <div className="ff-dash-top-bar-wrap">
                  <div className="ff-dash-top-bar-fill" style={{ width: `${(qty / maxQty) * 100}%` }} />
                </div>
              </div>
              <span className="ff-dash-top-qty">{qty}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Shared AdminModal ────────────────────────────────────────────────────────

function AdminModal({
  title,
  onClose,
  footer,
  children,
}: {
  title: string;
  onClose: () => void;
  footer: ReactNode;
  children: ReactNode;
}) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === 'Escape') onClose(); }
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="ff-admin-modal-overlay" onClick={onClose}>
      <div className="ff-admin-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ff-admin-modal-header">
          <span className="ff-admin-modal-title">{title}</span>
          <button className="ff-order-drawer-close" onClick={onClose}><i className="bi bi-x" /></button>
        </div>
        <div className="ff-admin-modal-body">{children}</div>
        <div className="ff-admin-modal-footer">{footer}</div>
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
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
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

  const filtered = products
    .filter((p) => !search || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !catFilter || p.categoryId === catFilter);

  return (
    <div>
      {/* Header bar */}
      <div className="ff-catalog-header">
        <div className="ff-catalog-search">
          <i className="bi bi-search ff-catalog-search-icon" />
          <input
            placeholder="Buscar produto..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="ff-catalog-filters">
          <button className={`ff-catalog-filter-btn${catFilter === '' ? ' active' : ''}`} onClick={() => setCatFilter('')}>Todos</button>
          {categories.map((c) => (
            <button key={c.id} className={`ff-catalog-filter-btn${catFilter === c.id ? ' active' : ''}`} onClick={() => setCatFilter(c.id)}>
              {c.name}
            </button>
          ))}
        </div>
        <button className="btn btn-primary" style={{ marginLeft: 'auto', flexShrink: 0 }} onClick={openCreate}>
          <i className="bi bi-plus me-1" />Novo produto
        </button>
      </div>

      {/* Grid or empty state */}
      {filtered.length === 0 ? (
        <div className="ff-empty-state">
          <i className="bi bi-box ff-empty-state-icon" />
          <div className="ff-empty-state-title">Nenhum produto encontrado</div>
          <div className="ff-empty-state-desc">Tente mudar os filtros ou crie um novo produto.</div>
          <button className="btn btn-primary btn-sm mt-2" onClick={openCreate}>Criar primeiro produto</button>
        </div>
      ) : (
        <div className="ff-product-grid">
          {filtered.map((p) => {
            const cat = categories.find((c) => c.id === p.categoryId);
            return (
              <div key={p.id} className={`ff-product-card${p.available ? '' : ' unavailable'}`}>
                <div className="ff-product-card-img-wrap">
                  {p.imageUrl
                    ? <img src={p.imageUrl} alt={p.name} className="ff-product-card-img" />
                    : <div className="ff-product-card-img-ph"><i className="bi bi-image" /></div>
                  }
                  {p.featured && <span className="ff-product-card-featured">Destaque</span>}
                </div>
                <div className="ff-product-card-body">
                  <div className="ff-product-card-name">{p.name}</div>
                  <div className="ff-product-card-cat">{cat?.name ?? '—'}</div>
                  <div className="ff-product-card-price">{formatBRL(p.price)}</div>
                </div>
                <div className="ff-product-card-footer">
                  <label className="ff-toggle" onClick={(e) => { e.preventDefault(); toggleAvailable(p); }}>
                    <div className={`ff-toggle-track${p.available ? ' on' : ''}`}>
                      <div className="ff-toggle-thumb" />
                    </div>
                    <span className="ff-toggle-label">{p.available ? 'Ativo' : 'Inativo'}</span>
                  </label>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => openEdit(p)}>
                    <i className="bi bi-pencil" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <AdminModal
          title={editing ? 'Editar produto' : 'Novo produto'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-primary flex-fill" onClick={handleSave}>Salvar</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </>
          }
        >
          {[['Nome', 'name', 'text'], ['Preço (R$)', 'price', 'number'], ['URL da imagem', 'imageUrl', 'url'], ['Descrição', 'description', 'text']].map(([label, field, type]) => (
            <div key={field}>
              <label className="ff-admin-modal-label">{label}</label>
              <input className="form-control form-control-sm" type={type} value={(form as Record<string, string | boolean>)[field] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
          <div>
            <label className="ff-admin-modal-label">Categoria</label>
            <select className="form-select form-select-sm" value={form.categoryId} onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}>
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="ff-admin-modal-label">Estação da cozinha</label>
            <select className="form-select form-select-sm" value={form.station} onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}>
              <option value="GENERAL">Geral</option>
              <option value="GRILL">Churrasqueira / Grill</option>
              <option value="BAR">Bar / Bebidas</option>
              <option value="SALAD">Frios / Saladas</option>
              <option value="DESSERT">Sobremesas</option>
              <option value="FRYER">Frituras</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} />Disponível</label>
            <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Destaque</label>
          </div>
        </AdminModal>
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

  function openCreate() {
    setEditing(null);
    setForm({ name: '', imageUrl: '', active: true });
    setShowModal(true);
  }

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
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={openCreate}>
          <i className="bi bi-plus me-1" />Nova categoria
        </button>
      </div>

      {categories.length === 0 ? (
        <div className="ff-empty-state">
          <i className="bi bi-tags ff-empty-state-icon" />
          <div className="ff-empty-state-title">Nenhuma categoria ainda</div>
          <div className="ff-empty-state-desc">Crie categorias para organizar seu cardápio.</div>
          <button className="btn btn-primary btn-sm mt-2" onClick={openCreate}>Criar primeira categoria</button>
        </div>
      ) : (
        <div className="ff-cat-grid">
          {categories.map((c) => (
            <div key={c.id} className={`ff-cat-card${c.active ? '' : ' inactive'}`}>
              {c.imageUrl
                ? <img src={c.imageUrl} alt={c.name} className="ff-cat-card-img" />
                : <div className="ff-cat-card-img-ph"><i className="bi bi-tags" /></div>
              }
              <div className="ff-cat-card-body">
                <span className="ff-cat-card-name">{c.name}</span>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <label className="ff-toggle" onClick={(e) => { e.preventDefault(); toggleActive(c); }}>
                    <div className={`ff-toggle-track${c.active ? ' on' : ''}`}>
                      <div className="ff-toggle-thumb" />
                    </div>
                  </label>
                  <button className="btn btn-sm btn-outline-secondary" onClick={() => { setEditing(c); setForm({ name: c.name, imageUrl: c.imageUrl, active: c.active }); setShowModal(true); }}>
                    <i className="bi bi-pencil" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <AdminModal
          title={editing ? 'Editar categoria' : 'Nova categoria'}
          onClose={() => setShowModal(false)}
          footer={
            <>
              <button className="btn btn-primary flex-fill" onClick={handleSave}>Salvar</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </>
          }
        >
          {[['Nome', 'name'], ['URL da imagem', 'imageUrl']].map(([label, field]) => (
            <div key={field}>
              <label className="ff-admin-modal-label">{label}</label>
              <input className="form-control form-control-sm" value={(form as Record<string, string | boolean>)[field] as string} onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
          <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8 }}>
            <input type="checkbox" checked={form.active} onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))} />
            Ativa
          </label>
        </AdminModal>
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

// ─── Orders helpers ───────────────────────────────────────────────────────────

const ORDER_STATUS_LABEL: Record<string, string> = {
  DRAFT:           'Rascunho',
  CREATED:         'Criado',
  SENT_TO_KITCHEN: 'Na cozinha',
  PREPARING:       'Preparando',
  READY:           'Pronto',
  DELIVERED:       'Entregue',
  CLOSED:          'Encerrado',
  CANCELED:        'Cancelado',
};

const ORDER_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  DRAFT:           { bg: '#f3f4f6', color: '#9ca3af' },
  CREATED:         { bg: '#f3f4f6', color: '#6b7280' },
  SENT_TO_KITCHEN: { bg: 'var(--ff-status-new-soft)',        color: 'var(--ff-status-new)' },
  PREPARING:       { bg: 'var(--ff-status-preparing-soft)',  color: 'var(--ff-status-preparing)' },
  READY:           { bg: 'var(--ff-status-ready-soft)',      color: 'var(--ff-status-ready)' },
  DELIVERED:       { bg: 'var(--ff-status-delivered-soft)',  color: 'var(--ff-status-delivered)' },
  CLOSED:          { bg: 'var(--ff-status-paid-soft)',       color: 'var(--ff-status-paid)' },
  CANCELED:        { bg: 'var(--ff-status-cancelled-soft)',  color: 'var(--ff-status-cancelled)' },
};

const PAYMENT_STATUS_LABEL: Record<string, string> = {
  UNPAID:          'Não pago',
  PARTIALLY_PAID:  'Parcial',
  PAID:            'Pago',
  REFUNDED:        'Reembolsado',
};

const PAYMENT_STATUS_STYLE: Record<string, { bg: string; color: string }> = {
  UNPAID:         { bg: '#f3f4f6', color: '#9ca3af' },
  PARTIALLY_PAID: { bg: '#fffbeb', color: '#d97706' },
  PAID:           { bg: '#ecfdf5', color: '#059669' },
  REFUNDED:       { bg: '#f5f3ff', color: '#7c3aed' },
};

const STATUS_ADVANCE: Record<string, string> = {
  CREATED:         'SENT_TO_KITCHEN',
  SENT_TO_KITCHEN: 'PREPARING',
  PREPARING:       'READY',
  READY:           'DELIVERED',
  DELIVERED:       'CLOSED',
};

const STATUS_ADVANCE_LABEL: Record<string, string> = {
  CREATED:         'Enviar p/ cozinha',
  SENT_TO_KITCHEN: 'Marcar como preparando',
  PREPARING:       'Marcar como pronto',
  READY:           'Marcar como entregue',
  DELIVERED:       'Encerrar pedido',
};

const TIMELINE_STEPS = [
  { key: 'CREATED',         icon: 'bi-plus-circle' },
  { key: 'SENT_TO_KITCHEN', icon: 'bi-fire' },
  { key: 'PREPARING',       icon: 'bi-hourglass-split' },
  { key: 'READY',           icon: 'bi-check-circle' },
  { key: 'DELIVERED',       icon: 'bi-bag-check' },
  { key: 'CLOSED',          icon: 'bi-lock' },
];

const STATUS_ORDER = ['CREATED', 'SENT_TO_KITCHEN', 'PREPARING', 'READY', 'DELIVERED', 'CLOSED', 'CANCELED'];

const FILTER_TABS = [
  { key: '',               label: 'Todos' },
  { key: 'SENT_TO_KITCHEN', label: 'Na cozinha' },
  { key: 'PREPARING',      label: 'Preparando' },
  { key: 'READY',          label: 'Prontos' },
  { key: 'DELIVERED',      label: 'Entregues' },
  { key: 'PAID',           label: 'Pagos' },
];

function StatusPill({ status, map }: { status: string; map: Record<string, { bg: string; color: string }> }) {
  const style = map[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  const label = ORDER_STATUS_LABEL[status] ?? PAYMENT_STATUS_LABEL[status] ?? status;
  return (
    <span className="ff-status-pill" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}

function OrderDrawer({
  order,
  onClose,
  onAdvance,
}: {
  order: DbOrder;
  onClose: () => void;
  onAdvance: (id: string, status: string) => void;
}) {
  const nextStatus = STATUS_ADVANCE[order.status];
  const currentIdx = STATUS_ORDER.indexOf(order.status);

  return (
    <div className="ff-order-drawer">
      <div className="ff-order-drawer-header">
        <span className="ff-order-drawer-title">#{order.orderNumber}</span>
        <button className="ff-order-drawer-close" onClick={onClose}>
          <i className="bi bi-x" />
        </button>
      </div>

      <div className="ff-order-drawer-body">
        {/* Meta */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <StatusPill status={order.status} map={ORDER_STATUS_STYLE} />
          <StatusPill status={order.paymentStatus} map={PAYMENT_STATUS_STYLE} />
          <span className="ff-status-pill" style={{ background: '#f3f4f6', color: '#6b7280' }}>
            {order.source}
          </span>
          {order.tableNumber && (
            <span className="ff-status-pill" style={{ background: '#eff6ff', color: '#1d4ed8' }}>
              <i className="bi bi-table" /> Mesa {order.tableNumber}
            </span>
          )}
        </div>

        {/* Customer */}
        <div>
          <div className="ff-order-drawer-section-label">Cliente</div>
          <div style={{ fontSize: 14, fontWeight: 600, color: '#1a1a1a' }}>{order.customerName}</div>
          <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>
            {new Date(order.createdAt).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}
          </div>
        </div>

        {/* Items */}
        <div>
          <div className="ff-order-drawer-section-label">Itens</div>
          {order.items.map((item, i) => (
            <div key={i} className="ff-order-drawer-item">
              <div className="ff-order-drawer-item-qty">{item.quantity}</div>
              <div style={{ flex: 1 }}>
                <div className="ff-order-drawer-item-name">{item.name}</div>
                {item.note && <div className="ff-order-drawer-item-note">Obs: {item.note}</div>}
              </div>
              <div className="ff-order-drawer-item-price">
                {formatBRL(item.unitPrice * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="ff-order-drawer-totals">
          <div className="ff-order-drawer-total-row">
            <span>Subtotal</span><span>{formatBRL(order.subtotal)}</span>
          </div>
          {order.serviceFee > 0 && (
            <div className="ff-order-drawer-total-row">
              <span>Taxa de serviço</span><span>{formatBRL(order.serviceFee)}</span>
            </div>
          )}
          <div className="ff-order-drawer-total-row grand">
            <span>Total</span><span>{formatBRL(order.total)}</span>
          </div>
        </div>

        {/* Timeline */}
        <div>
          <div className="ff-order-drawer-section-label">Histórico</div>
          <div className="ff-order-timeline">
            {TIMELINE_STEPS.map((step, i) => {
              const stepIdx = STATUS_ORDER.indexOf(step.key);
              const isDone    = stepIdx < currentIdx;
              const isCurrent = step.key === order.status;
              if (order.status === 'CANCELED' && !isDone && !isCurrent) return null;
              return (
                <div key={step.key} className="ff-order-timeline-step">
                  <div className={`ff-order-timeline-dot ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    <i className={`bi ${isDone ? 'bi-check' : step.icon}`} />
                  </div>
                  <div className={`ff-order-timeline-label ${isDone ? 'done' : isCurrent ? 'current' : ''}`}>
                    {ORDER_STATUS_LABEL[step.key]}
                  </div>
                </div>
              );
            })}
            {order.status === 'CANCELED' && (
              <div className="ff-order-timeline-step">
                <div className="ff-order-timeline-dot current" style={{ background: 'var(--ff-status-cancelled)', borderColor: 'var(--ff-status-cancelled)' }}>
                  <i className="bi bi-x" />
                </div>
                <div className="ff-order-timeline-label current" style={{ color: 'var(--ff-status-cancelled)' }}>
                  Cancelado
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {nextStatus && (
        <div className="ff-order-drawer-footer">
          <button className="ff-order-advance-btn" onClick={() => onAdvance(order.id, nextStatus)}>
            <i className="bi bi-arrow-right-circle" />
            {STATUS_ADVANCE_LABEL[order.status]}
          </button>
        </div>
      )}
    </div>
  );
}

function Orders() {
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [filter, setFilter] = useState('');
  const [selected, setSelected] = useState<DbOrder | null>(null);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const prevIdsRef = useRef<Set<string>>(new Set());
  const notify = useNotify();

  async function load() {
    const fresh = await adminOrderService.list();
    setOrders(fresh);
    const freshIds = new Set(fresh.map((o) => o.id));
    const added = new Set([...freshIds].filter((id) => !prevIdsRef.current.has(id)));
    if (added.size > 0 && prevIdsRef.current.size > 0) {
      setNewIds(added);
      setTimeout(() => setNewIds(new Set()), 2500);
    }
    prevIdsRef.current = freshIds;
  }

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  async function handleAdvance(orderId: string, status: string) {
    await adminOrderService.updateStatus(orderId, status as import('@/lib/types').FullOrderStatus);
    notify(`Pedido atualizado → ${ORDER_STATUS_LABEL[status] ?? status}`);
    load();
    setSelected((prev) => prev?.id === orderId ? { ...prev, status: status as import('@/lib/types').FullOrderStatus } : prev);
  }

  const filtered = filter
    ? orders.filter((o) => o.status === filter || o.paymentStatus === filter)
    : orders;

  const counts: Record<string, number> = {};
  orders.forEach((o) => {
    counts[o.status] = (counts[o.status] ?? 0) + 1;
    if (o.paymentStatus === 'PAID') counts['PAID'] = (counts['PAID'] ?? 0) + 1;
  });

  return (
    <div className="ff-orders-layout">
      <div className="ff-orders-main">
        {/* Tabs */}
        <div className="ff-orders-tabs">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab.key}
              className={`ff-orders-tab${filter === tab.key ? ' active' : ''}`}
              onClick={() => setFilter(tab.key)}
            >
              {tab.label}
              <span className="ff-orders-tab-count">
                {tab.key === '' ? orders.length : (counts[tab.key] ?? 0)}
              </span>
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="ff-data-card" style={{ overflow: 'hidden' }}>
          <table className="ff-orders-table">
            <thead>
              <tr>
                <th>Pedido</th>
                <th>Cliente</th>
                <th>Mesa</th>
                <th>Total</th>
                <th>Status</th>
                <th>Pagamento</th>
                <th>Origem</th>
                <th>Hora</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', color: '#9ca3af', padding: '28px 0' }}>
                    Nenhum pedido neste status
                  </td>
                </tr>
              )}
              {filtered.map((o) => (
                <tr
                  key={o.id}
                  className={`${newIds.has(o.id) ? 'ff-order-row-new' : ''}${selected?.id === o.id ? ' selected' : ''}`}
                  onClick={() => setSelected(selected?.id === o.id ? null : o)}
                >
                  <td><strong style={{ fontVariantNumeric: 'tabular-nums' }}>#{o.orderNumber}</strong></td>
                  <td>{o.customerName}</td>
                  <td>{o.tableNumber ? `Mesa ${o.tableNumber}` : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                  <td style={{ fontWeight: 700 }}>{formatBRL(o.total)}</td>
                  <td><StatusPill status={o.status} map={ORDER_STATUS_STYLE} /></td>
                  <td><StatusPill status={o.paymentStatus} map={PAYMENT_STATUS_STYLE} /></td>
                  <td style={{ color: '#6b7280' }}>{o.source}</td>
                  <td style={{ color: '#9ca3af', fontVariantNumeric: 'tabular-nums' }}>
                    {new Date(o.createdAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer */}
      {selected && (
        <OrderDrawer
          order={selected}
          onClose={() => setSelected(null)}
          onAdvance={handleAdvance}
        />
      )}
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
  const [tenantName, setTenantName] = useState('Admin');
  const [tenantLogo, setTenantLogo] = useState<string | undefined>();

  useEffect(() => {
    const s = location.pathname.split('/admin/')[1] as AdminSection | undefined;
    if (s && NAV.find((n) => n.section === s)) setSection(s);
  }, [location.pathname]);

  useEffect(() => {
    tenantService.get().then((t) => {
      if (t) {
        setTenantName(t.name);
        setTenantLogo(t.logoUrl ?? undefined);
      }
    });
  }, []);

  function goTo(s: AdminSection) {
    setSection(s);
    navigate(`/admin/${s}`);
  }

  const pendingOrders = getCollection<DbOrder>('orders').filter(
    (o) => o.status === 'SENT_TO_KITCHEN' || o.status === 'PREPARING'
  ).length;

  const currentNavItem = NAV.find((n) => n.section === section);

  return (
    <div className="ff-area-layout">
      <aside className="ff-area-sidebar">
        <div className="ff-area-sidebar-logo">
          {tenantLogo ? (
            <img src={tenantLogo} alt="" className="ff-area-sidebar-logo-img" />
          ) : (
            <div className="ff-area-sidebar-logo-icon">
              <i className="bi bi-shop" />
            </div>
          )}
          <div className="ff-area-sidebar-logo-text">
            <span className="ff-area-sidebar-logo-name">{tenantName}</span>
            <span className="ff-area-sidebar-logo-role">Administração</span>
          </div>
        </div>

        <nav className="ff-area-sidebar-nav">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <div className="ff-area-sidebar-group-label">{group.label}</div>
              {group.items.map((n) => (
                <button
                  key={n.section}
                  className={`ff-nav-item ${section === n.section ? 'active' : ''}`}
                  onClick={() => goTo(n.section)}
                >
                  <i className={`bi ${n.icon}`} />
                  {n.label}
                  {n.section === 'orders' && pendingOrders > 0 && (
                    <span className="ff-nav-item-badge">{pendingOrders}</span>
                  )}
                </button>
              ))}
            </div>
          ))}
          <div style={{ marginTop: 'auto', paddingTop: 8, borderTop: '1px solid rgba(255,255,255,.07)' }}>
            <button className="ff-nav-item" onClick={() => navigate('/')}>
              <i className="bi bi-house" />Hub
            </button>
          </div>
        </nav>
      </aside>

      <div className="ff-area-main">
        <div className="ff-area-topbar">
          <div className="ff-area-topbar-breadcrumb">
            <span>{tenantName}</span>
            <span className="ff-area-topbar-breadcrumb-sep">›</span>
            <span className="ff-area-topbar-breadcrumb-active">{currentNavItem?.label ?? section}</span>
          </div>
          <div className="ff-area-topbar-right">
            <AdminClock />
            <div className="ff-area-status-badge">
              <span className="ff-area-status-dot" />
              Operando
            </div>
            <div className="ff-area-topbar-avatar" title="Admin">
              <i className="bi bi-person" />
            </div>
          </div>
        </div>
        <div className="ff-area-content">
          {section === 'dashboard'  && <Dashboard />}
          {section === 'products'   && <Products />}
          {section === 'categories' && <Categories />}
          {section === 'tables'     && <Tables />}
          {section === 'orders'     && <Orders />}
          {section === 'branches'   && <RestaurantSettings />}
          {section === 'settings'   && <RestaurantSettings />}
          {section === 'kiosks'     && <Kiosks />}
          {section === 'queue'      && <QueueSection />}
          {section === 'loyalty'    && <LoyaltySection />}
          {section === 'aggregator' && <AggregatorSection />}
        </div>
      </div>
    </div>
  );
}
