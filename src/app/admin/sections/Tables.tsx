import { useEffect, useState } from 'react';
import { tableService, zoneService, mockUserService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { DbTable, Zone, MockUser } from '@/lib/types';

const EMPTY_FORM = { number: '', zoneName: '', assignedWaiterName: '', capacity: '', active: true, notes: '' };

export function Tables() {
  const [tables, setTables]   = useState<DbTable[]>([]);
  const [zones, setZones]     = useState<Zone[]>([]);
  const [waiters, setWaiters] = useState<MockUser[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing]     = useState<DbTable | null>(null);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [newZoneName, setNewZoneName] = useState('');
  const [search, setSearch]           = useState('');
  const [zoneFilter, setZoneFilter]   = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const notify = useNotify();

  async function load() {
    const [t, z, w] = await Promise.all([tableService.list(), zoneService.list(), mockUserService.listWaiters()]);
    setTables(t); setZones(z); setWaiters(w);
  }
  useEffect(() => { load(); }, []);

  function openCreate() { setEditing(null); setForm(EMPTY_FORM); setShowModal(true); }

  function openEdit(t: DbTable) {
    setEditing(t);
    setForm({ number: t.number, zoneName: t.zoneName ?? '', assignedWaiterName: t.assignedWaiterName ?? '', capacity: t.capacity != null ? String(t.capacity) : '', active: t.active, notes: t.notes ?? '' });
    setShowModal(true);
  }

  async function handleSave() {
    if (!form.number.trim()) return;
    const data = { number: form.number.trim(), zoneName: form.zoneName || undefined, assignedWaiterName: form.assignedWaiterName || undefined, capacity: form.capacity ? parseInt(form.capacity, 10) : undefined, active: form.active, notes: form.notes.trim() || undefined };
    if (editing) { await tableService.update(editing.id, data); notify(`Mesa ${data.number} atualizada`); }
    else          { await tableService.create(data);             notify(`Mesa ${data.number} criada`); }
    setShowModal(false); load();
  }

  async function toggleActive(t: DbTable) {
    await tableService.update(t.id, { active: !t.active });
    notify(t.active ? 'Mesa desativada' : 'Mesa ativada'); load();
  }

  async function handleRegenCode(id: string) {
    await tableService.regenerateCode(id); notify('Código regenerado'); load();
  }

  async function handleAddZone() {
    const name = newZoneName.trim(); if (!name) return;
    await zoneService.create(name); setNewZoneName(''); load();
  }

  async function handleDeleteZone(id: string) { await zoneService.remove(id); load(); }

  const f = (field: keyof typeof EMPTY_FORM) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
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
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <button className="btn btn-primary" onClick={openCreate}><i className="bi bi-plus me-1" />Nova mesa</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 20, alignItems: 'start' }}>
        <div>
          {/* Filter bar */}
          <div style={{ background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '10px 14px', marginBottom: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: '0 0 200px' }}>
              <i className="bi bi-search" style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: '#9ca3af', fontSize: '0.8rem', pointerEvents: 'none' }} />
              <input className="form-control form-control-sm" style={{ paddingLeft: 30 }} placeholder="Buscar mesa, zona, garçom..." value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {(['', ...zones.map((z) => z.name)] as string[]).map((z) => (
                <button key={z || '__all__'} style={{ background: zoneFilter === z ? '#1d4ed8' : '#f3f4f6', color: zoneFilter === z ? '#fff' : '#374151', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap' }} onClick={() => setZoneFilter(z)}>
                  {z || 'Todas as zonas'}
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 4, marginLeft: 'auto' }}>
              {(['all', 'active', 'inactive'] as const).map((s) => (
                <button key={s} style={{ background: statusFilter === s ? '#1d4ed8' : '#f3f4f6', color: statusFilter === s ? '#fff' : '#374151', border: 'none', borderRadius: 20, padding: '3px 12px', fontSize: '0.78rem', fontWeight: 600, cursor: 'pointer' }} onClick={() => setStatusFilter(s)}>
                  {s === 'all' ? 'Todas' : s === 'active' ? 'Ativas' : 'Inativas'}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, minHeight: 24 }}>
            <span style={{ fontSize: 12, color: '#6b7280' }}>
              {filtered.length === tables.length ? `${tables.length} mesa${tables.length !== 1 ? 's' : ''}` : `${filtered.length} de ${tables.length} mesas`}
            </span>
            {hasFilters && <button style={{ background: 'none', border: 'none', fontSize: 12, color: '#6b7280', cursor: 'pointer', textDecoration: 'underline', padding: 0 }} onClick={() => { setSearch(''); setZoneFilter(''); setStatusFilter('all'); }}>Limpar filtros</button>}
          </div>

          <div className="ff-data-card">
            <table className="table table-hover mb-0" style={{ fontSize: 13 }}>
              <thead>
                <tr><th>Mesa</th><th>Zona</th><th>Garçom</th><th style={{ textAlign: 'center' }}>Lugares</th><th>Status</th><th>Validação</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr><td colSpan={7} style={{ textAlign: 'center', color: '#9ca3af', padding: '24px 0' }}><i className="bi bi-search" style={{ fontSize: 20, display: 'block', marginBottom: 6 }} />Nenhuma mesa encontrada</td></tr>
                )}
                {filtered.map((t) => (
                  <tr key={t.id}>
                    <td><strong>Mesa {t.number}</strong>{t.notes && <span style={{ marginLeft: 6, fontSize: 11, color: '#9ca3af' }} title={t.notes}><i className="bi bi-chat-left-dots" /></span>}</td>
                    <td>{t.zoneName ? <span style={{ background: '#eff6ff', color: '#1d4ed8', borderRadius: 4, padding: '1px 7px', fontSize: 12, fontWeight: 500 }}>{t.zoneName}</span> : <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td>{t.assignedWaiterName ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td style={{ textAlign: 'center' }}>{t.capacity ?? <span style={{ color: '#d1d5db' }}>—</span>}</td>
                    <td><span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>{t.active ? 'Ativa' : 'Inativa'}</span></td>
                    <td><span style={{ fontFamily: 'monospace', background: '#f3f4f6', padding: '2px 8px', borderRadius: 4, fontSize: 12 }}>{t.validationCode}</span></td>
                    <td>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <button className="btn btn-sm btn-outline-secondary" title="Editar" onClick={() => openEdit(t)}><i className="bi bi-pencil" /></button>
                        <button className="btn btn-sm btn-outline-secondary" title={t.active ? 'Desativar' : 'Ativar'} onClick={() => toggleActive(t)}><i className={`bi ${t.active ? 'bi-eye-slash' : 'bi-eye'}`} /></button>
                        <button className="btn btn-sm btn-outline-secondary" title="Regenerar código QR" onClick={() => handleRegenCode(t.id)}><i className="bi bi-arrow-repeat" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Zones sidebar */}
        <div style={{ position: 'sticky', top: 20 }}>
          <div className="ff-data-card">
            <div className="ff-data-card-header">Zonas / Áreas<span className="badge bg-secondary ms-2">{zones.length}</span></div>
            <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
              {zones.length === 0 && <div style={{ fontSize: 13, color: '#9ca3af' }}>Nenhuma zona cadastrada.</div>}
              {zones.map((z) => (
                <div key={z.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 8px', borderRadius: 6, background: zoneFilter === z.name ? '#eff6ff' : 'transparent', cursor: 'pointer' }} onClick={() => setZoneFilter(zoneFilter === z.name ? '' : z.name)}>
                  <i className="bi bi-diagram-3" style={{ color: zoneFilter === z.name ? '#1d4ed8' : '#9ca3af', fontSize: 13, flexShrink: 0 }} />
                  <span style={{ flex: 1, fontSize: 13, fontWeight: zoneFilter === z.name ? 600 : 400, color: zoneFilter === z.name ? '#1d4ed8' : '#374151' }}>{z.name}</span>
                  <span style={{ fontSize: 11, color: '#9ca3af', flexShrink: 0 }}>{tables.filter((t) => t.zoneName === z.name).length}</span>
                  <button className="btn btn-sm" style={{ padding: '1px 6px', color: '#9ca3af', background: 'none', border: 'none', flexShrink: 0 }} title="Remover zona" onClick={(e) => { e.stopPropagation(); handleDeleteZone(z.id); }}><i className="bi bi-trash" style={{ fontSize: 11 }} /></button>
                </div>
              ))}
              <div style={{ display: 'flex', gap: 6, marginTop: 6, borderTop: '1px solid #f3f4f6', paddingTop: 10 }}>
                <input className="form-control form-control-sm" placeholder="Nova zona..." value={newZoneName} onChange={(e) => setNewZoneName(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') handleAddZone(); }} />
                <button className="btn btn-sm btn-outline-primary" style={{ flexShrink: 0 }} onClick={handleAddZone}><i className="bi bi-plus" /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Inline modal (Tables uses its own wider modal) */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowModal(false)}>
          <div style={{ background: '#fff', borderRadius: 14, padding: 28, width: 440, display: 'flex', flexDirection: 'column', gap: 14, maxHeight: '90vh', overflowY: 'auto' }} onClick={(e) => e.stopPropagation()}>
            <h5 style={{ margin: 0 }}>{editing ? `Editar Mesa ${editing.number}` : 'Nova mesa'}</h5>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Número / Nome *</label>
                <input className="form-control form-control-sm" placeholder="ex: 1, A3, VIP-1" value={form.number} onChange={f('number')} autoFocus />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Capacidade (lugares)</label>
                <input className="form-control form-control-sm" type="number" min={1} max={50} placeholder="ex: 4" value={form.capacity} onChange={f('capacity')} />
              </div>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Zona / Área</label>
              <select className="form-select form-select-sm" value={form.zoneName} onChange={f('zoneName')}>
                <option value="">— Sem zona —</option>
                {zones.map((z) => <option key={z.id} value={z.name}>{z.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Garçom responsável</label>
              <select className="form-select form-select-sm" value={form.assignedWaiterName} onChange={f('assignedWaiterName')}>
                <option value="">— Sem atribuição —</option>
                {waiters.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 4 }}>Observações</label>
              <textarea className="form-control form-control-sm" rows={2} placeholder="ex: próxima à janela, acessível, reservada para VIP..." value={form.notes} onChange={f('notes')} />
            </div>
            <label style={{ fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
              <input type="checkbox" checked={form.active} onChange={(e) => setForm((prev) => ({ ...prev, active: e.target.checked }))} />
              Mesa ativa
            </label>
            <div style={{ display: 'flex', gap: 8, paddingTop: 4 }}>
              <button className="btn btn-primary flex-fill" onClick={handleSave} disabled={!form.number.trim()}>{editing ? 'Salvar alterações' : 'Criar mesa'}</button>
              <button className="btn btn-outline-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
