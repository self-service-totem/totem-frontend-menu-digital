import { useEffect, useState } from 'react';
import { categoryService, productService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbCategory, DbProduct, KitchenStation } from '@/lib/types';
import { formatBRL } from '../adminUtils';
import { AdminModal } from '@/components/admin';

export function Products() {
  const [products, setProducts]   = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<DbProduct | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', imageUrl: '',
    categoryId: '', available: true, featured: false, station: 'GENERAL',
  });
  const [search, setSearch]       = useState('');
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
    const data = {
      name: form.name, description: form.description,
      price: parseFloat(form.price), imageUrl: form.imageUrl,
      categoryId: form.categoryId, available: form.available,
      featured: form.featured, station: form.station as KitchenStation,
    };
    if (editing) { await productService.update(editing.id, data); notify('Produto atualizado'); }
    else          { await productService.create(data);             notify('Produto criado'); }
    setShowModal(false);
    load();
  }

  async function toggleAvailable(p: DbProduct) {
    await productService.update(p.id, { available: !p.available });
    notify(p.available ? 'Produto desativado' : 'Produto ativado');
    load();
  }

  const filtered = products
    .filter((p) => !search    || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !catFilter || p.categoryId === catFilter);

  return (
    <div>
      <div className="ff-catalog-header">
        <div className="ff-catalog-search">
          <i className="bi bi-search ff-catalog-search-icon" />
          <input placeholder="Buscar produto..." value={search} onChange={(e) => setSearch(e.target.value)} />
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
          {([['Nome', 'name', 'text'], ['Preço (R$)', 'price', 'number'], ['URL da imagem', 'imageUrl', 'url'], ['Descrição', 'description', 'text']] as const).map(([label, field, type]) => (
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
            <label style={{ fontSize: 13 }}><input type="checkbox" className="me-1" checked={form.featured}  onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />Destaque</label>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
