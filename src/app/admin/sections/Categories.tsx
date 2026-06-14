import { useEffect, useState } from 'react';
import { categoryService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbCategory } from '@/lib/types';
import { AdminModal } from '@/components/admin';

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
          {([['Nome', 'name'], ['URL da imagem', 'imageUrl']] as const).map(([label, field]) => (
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
