import { useEffect, useState } from 'react';
import { categoryService, productService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbCategory, DbProduct, KitchenStation } from '@/lib/types';
import { formatBRL, formatDate } from '../adminUtils';
import { AdminModal } from '@/components/admin';
import {
  AdminPageHeader,
  AdminButton,
  AdminIconButton,
  AdminSearchInput,
  AdminFilterBar,
  AdminEmptyState,
  AdminTable,
  AdminActionMenu,
  ViewToggle,
  useSortable,
} from '@/components/admin';
import type { AdminTableColumn, SortDir, ViewMode } from '@/components/admin';

type ProductRow = DbProduct & { categoryName: string };

export function Products() {
  const [products, setProducts]     = useState<DbProduct[]>([]);
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<DbProduct | null>(null);
  const [form, setForm] = useState({
    name: '', description: '', price: '', imageUrl: '',
    categoryId: '', available: true, featured: false, station: 'GENERAL',
  });
  const [search, setSearch]       = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [viewMode, setViewMode]   = useState<ViewMode>('card');
  const [sortBy, setSortBy]       = useState('name');
  const [sortDir, setSortDir]     = useState<SortDir>('asc');
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

  async function toggleFeatured(p: DbProduct) {
    await productService.update(p.id, { featured: !p.featured });
    notify(p.featured ? 'Destaque removido' : 'Marcado como destaque');
    load();
  }

  function handleSort(key: string) {
    if (sortBy === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(key);
      setSortDir('asc');
    }
  }

  const filtered = products
    .filter((p) => !search    || p.name.toLowerCase().includes(search.toLowerCase()))
    .filter((p) => !catFilter || p.categoryId === catFilter);

  const withCatName: ProductRow[] = filtered.map((p) => ({
    ...p,
    categoryName: categories.find((c) => c.id === p.categoryId)?.name ?? '',
  }));

  const tableRows = useSortable(withCatName, sortBy, sortDir);

  const catOptions = [
    { key: '', label: 'Todos' },
    ...categories.map((c) => ({ key: c.id, label: c.name })),
  ];

  const productColumns: AdminTableColumn<ProductRow>[] = [
    {
      key: 'imageUrl',
      label: '',
      width: '52px',
      render: (p) => (
        <div className="ff-table-thumb">
          {p.imageUrl
            ? <img src={p.imageUrl} alt={p.name} className="ff-table-thumb-img" />
            : <div className="ff-table-thumb-ph"><i className="bi bi-image" /></div>
          }
        </div>
      ),
    },
    {
      key: 'name',
      label: 'Produto',
      sortable: true,
      render: (p) => (
        <div>
          <div className="ff-table-row-title">{p.name}</div>
          {p.description && <div className="ff-table-row-sub">{p.description}</div>}
        </div>
      ),
    },
    {
      key: 'categoryName',
      label: 'Categoria',
      sortable: true,
      className: 'ff-hide-mobile',
      render: (p) => <span className="ff-table-row-tag">{p.categoryName || '—'}</span>,
    },
    {
      key: 'price',
      label: 'Preço',
      sortable: true,
      width: '100px',
      align: 'right',
      render: (p) => <span className="ff-table-price">{formatBRL(p.price)}</span>,
    },
    {
      key: 'available',
      label: 'Status',
      sortable: true,
      width: '100px',
      render: (p) => (
        <label className="ff-toggle" onClick={(e) => { e.preventDefault(); toggleAvailable(p); }}>
          <div className={`ff-toggle-track${p.available ? ' on' : ''}`}>
            <div className="ff-toggle-thumb" />
          </div>
          <span className="ff-toggle-label">{p.available ? 'Ativo' : 'Inativo'}</span>
        </label>
      ),
    },
    {
      key: 'featured',
      label: 'Destaque',
      sortable: true,
      width: '80px',
      align: 'center',
      className: 'ff-hide-mobile',
      render: (p) => (
        <button
          type="button"
          className={`ff-feature-toggle${p.featured ? ' on' : ''}`}
          onClick={() => toggleFeatured(p)}
          title={p.featured ? 'Remover destaque' : 'Marcar como destaque'}
        >
          <i className={`bi bi-star${p.featured ? '-fill' : ''}`} />
        </button>
      ),
    },
    {
      key: 'updatedAt',
      label: 'Atualizado',
      sortable: true,
      width: '110px',
      className: 'ff-hide-mobile',
      render: (p) => <span className="ff-table-date">{formatDate(p.updatedAt)}</span>,
    },
    {
      key: 'actions',
      label: '',
      width: '72px',
      align: 'right',
      render: (p) => (
        <div className="ff-table-actions">
          <AdminIconButton
            icon="bi-pencil"
            variant="ghost"
            size="sm"
            title="Editar produto"
            onClick={() => openEdit(p)}
          />
          <AdminActionMenu items={[
            {
              key: 'toggle',
              label: p.available ? 'Desativar' : 'Ativar',
              icon: p.available ? 'bi-toggle-off' : 'bi-toggle-on',
              onClick: () => toggleAvailable(p),
            },
            {
              key: 'featured',
              label: p.featured ? 'Remover destaque' : 'Marcar destaque',
              icon: 'bi-star',
              onClick: () => toggleFeatured(p),
            },
          ]} />
        </div>
      ),
    },
  ];

  return (
    <div className={viewMode === 'table' ? 'ff-table-view' : undefined}>
      <div className="ff-products-sticky-bar">
        <AdminPageHeader
          title="Produtos"
          subtitle={`${products.length} produto${products.length !== 1 ? 's' : ''} no catálogo`}
          actions={
            <AdminButton variant="primary" icon="bi-plus" onClick={openCreate}>
              Novo produto
            </AdminButton>
          }
        />

        <div className="ff-admin-toolbar">
          <AdminSearchInput
            value={search}
            onChange={setSearch}
            placeholder="Buscar produto..."
          />
          <AdminFilterBar options={catOptions} value={catFilter} onChange={setCatFilter} />
          <div className="ff-admin-toolbar-right">
            <ViewToggle mode={viewMode} onChange={setViewMode} />
          </div>
        </div>
      </div>

      {viewMode === 'table' ? (
        <AdminTable
          columns={productColumns}
          rows={tableRows}
          sortBy={sortBy}
          sortDir={sortDir}
          onSort={handleSort}
          emptyIcon="bi-box"
          emptyTitle="Nenhum produto encontrado"
          emptyMessage="Tente mudar os filtros ou crie um novo produto."
        />
      ) : filtered.length === 0 ? (
        <AdminEmptyState
          icon="bi-box"
          title="Nenhum produto encontrado"
          message="Tente mudar os filtros ou crie um novo produto."
          action={
            <AdminButton variant="primary" size="sm" icon="bi-plus" onClick={openCreate}>
              Criar primeiro produto
            </AdminButton>
          }
        />
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
                  <AdminIconButton
                    icon="bi-pencil"
                    variant="ghost"
                    size="sm"
                    title="Editar produto"
                    onClick={() => openEdit(p)}
                  />
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
              <AdminButton variant="primary" onClick={handleSave} style={{ flex: 1 }}>Salvar</AdminButton>
              <AdminButton variant="outline" onClick={() => setShowModal(false)}>Cancelar</AdminButton>
            </>
          }
        >
          {([['Nome', 'name', 'text'], ['Preço (R$)', 'price', 'number'], ['URL da imagem', 'imageUrl', 'url'], ['Descrição', 'description', 'text']] as const).map(([label, field, type]) => (
            <div key={field} className="ff-admin-form-row">
              <label className="ff-admin-form-label">{label}</label>
              <input
                className="ff-admin-form-input"
                type={type}
                value={(form as Record<string, string | boolean>)[field] as string}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              />
            </div>
          ))}
          <div className="ff-admin-form-row">
            <label className="ff-admin-form-label">Categoria</label>
            <select
              className="ff-admin-form-select"
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
            >
              {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="ff-admin-form-row">
            <label className="ff-admin-form-label">Estação da cozinha</label>
            <select
              className="ff-admin-form-select"
              value={form.station}
              onChange={(e) => setForm((f) => ({ ...f, station: e.target.value }))}
            >
              <option value="GENERAL">Geral</option>
              <option value="GRILL">Churrasqueira / Grill</option>
              <option value="BAR">Bar / Bebidas</option>
              <option value="SALAD">Frios / Saladas</option>
              <option value="DESSERT">Sobremesas</option>
              <option value="FRYER">Frituras</option>
            </select>
          </div>
          <div style={{ display: 'flex', gap: 20 }}>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.available} onChange={(e) => setForm((f) => ({ ...f, available: e.target.checked }))} />
              Disponível
            </label>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 6 }}>
              <input type="checkbox" checked={form.featured} onChange={(e) => setForm((f) => ({ ...f, featured: e.target.checked }))} />
              Destaque
            </label>
          </div>
        </AdminModal>
      )}
    </div>
  );
}
