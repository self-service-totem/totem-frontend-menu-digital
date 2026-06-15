import { useEffect, useState } from 'react';
import { categoryService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbCategory } from '@/lib/types';
import { AdminModal } from '@/components/admin';
import {
  AdminPageHeader,
  AdminButton,
  AdminIconButton,
  AdminEmptyState,
} from '@/components/admin';

export function Categories() {
  const [categories, setCategories] = useState<DbCategory[]>([]);
  const [showModal, setShowModal]   = useState(false);
  const [editing, setEditing]       = useState<DbCategory | null>(null);
  const [form, setForm]             = useState({ name: '', imageUrl: '', active: true });
  const notify = useNotify();

  async function load() { setCategories(await categoryService.list()); }
  useEffect(() => { load(); }, []);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', imageUrl: '', active: true });
    setShowModal(true);
  }

  function openEdit(c: DbCategory) {
    setEditing(c);
    setForm({ name: c.name, imageUrl: c.imageUrl, active: c.active });
    setShowModal(true);
  }

  async function handleSave() {
    const order = editing?.order ?? categories.length + 1;
    if (editing) { await categoryService.update(editing.id, { ...form }); notify('Categoria atualizada'); }
    else          { await categoryService.create({ ...form, order });      notify('Categoria criada'); }
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
      <AdminPageHeader
        title="Categorias"
        subtitle={`${categories.length} categoria${categories.length !== 1 ? 's' : ''} no catálogo`}
        actions={
          <AdminButton variant="primary" icon="bi-plus" onClick={openCreate}>
            Nova categoria
          </AdminButton>
        }
      />

      {categories.length === 0 ? (
        <AdminEmptyState
          icon="bi-tags"
          title="Nenhuma categoria ainda"
          message="Crie categorias para organizar seu cardápio."
          action={
            <AdminButton variant="primary" size="sm" icon="bi-plus" onClick={openCreate}>
              Criar primeira categoria
            </AdminButton>
          }
        />
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
                  <AdminIconButton
                    icon="bi-pencil"
                    variant="ghost"
                    size="sm"
                    title="Editar categoria"
                    onClick={() => openEdit(c)}
                  />
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
              <AdminButton variant="primary" onClick={handleSave} style={{ flex: 1 }}>Salvar</AdminButton>
              <AdminButton variant="outline" onClick={() => setShowModal(false)}>Cancelar</AdminButton>
            </>
          }
        >
          {([['Nome', 'name'], ['URL da imagem', 'imageUrl']] as const).map(([label, field]) => (
            <div key={field} className="ff-admin-form-row">
              <label className="ff-admin-form-label">{label}</label>
              <input
                className="ff-admin-form-input"
                value={(form as Record<string, string | boolean>)[field] as string}
                onChange={(e) => setForm((f) => ({ ...f, [field]: e.target.value }))}
              />
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
