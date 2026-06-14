import { useEffect, useState } from 'react';
import { branchService, tenantService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { Branch, Tenant } from '@/lib/types';

export function RestaurantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);
  const [tenantForm, setTenantForm] = useState({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' as 'es' | 'pt-BR' | 'en' });
  const [branchForm, setBranchForm] = useState({ name: '', address: '', serviceType: 'TABLE_SERVICE', queueEnabled: true, queueMessage: '', serviceFeeRate: '0.1', currency: 'BRL' });
  const notify = useNotify();

  useEffect(() => {
    Promise.all([tenantService.get(), branchService.get()]).then(([t, b]) => {
      if (t) { setTenant(t); setTenantForm({ name: t.name, logoUrl: t.logoUrl ?? '', defaultLanguage: t.defaultLanguage ?? 'pt-BR' }); }
      if (b) {
        setBranch(b);
        setBranchForm({ name: b.name, address: b.address ?? '', serviceType: b.serviceType, queueEnabled: b.queueEnabled, queueMessage: b.queueMessage ?? '', serviceFeeRate: String(b.serviceFeeRate ?? 0.1), currency: b.currency ?? 'BRL' });
      }
    });
  }, []);

  async function handleSaveTenant() {
    if (!tenant) return;
    await tenantService.update({ name: tenantForm.name.trim(), logoUrl: tenantForm.logoUrl.trim() || undefined, defaultLanguage: tenantForm.defaultLanguage });
    notify('Restaurante atualizado — nome refletido no Menu e Kiosk');
  }

  async function handleSaveBranch() {
    if (!branch) return;
    await branchService.update({ ...branchForm, serviceType: branchForm.serviceType as Branch['serviceType'], serviceFeeRate: parseFloat(branchForm.serviceFeeRate) || 0.1 });
    notify('Filial atualizada');
  }

  return (
    <div style={{ maxWidth: 520, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="ff-data-card">
        <div className="ff-data-card-header">Restaurante</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Nome do restaurante</label>
            <input className="form-control form-control-sm" value={tenantForm.name} onChange={(e) => setTenantForm((f) => ({ ...f, name: e.target.value }))} />
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Este nome aparece no cabeçalho do Menu Digital e no Kiosk.</div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>URL do logotipo</label>
            <input className="form-control form-control-sm" placeholder="https://..." value={tenantForm.logoUrl} onChange={(e) => setTenantForm((f) => ({ ...f, logoUrl: e.target.value }))} />
          </div>
          {tenantForm.logoUrl && <img src={tenantForm.logoUrl} alt="Logo preview" style={{ height: 48, objectFit: 'contain', borderRadius: 6 }} />}
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Idioma padrão</label>
            <select className="form-select form-select-sm" value={tenantForm.defaultLanguage} onChange={(e) => setTenantForm((f) => ({ ...f, defaultLanguage: e.target.value as 'es' | 'pt-BR' | 'en' }))}>
              <option value="pt-BR">🇧🇷 Português</option>
              <option value="es">🇦🇷 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
            <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 4 }}>Idioma inicial para o Menu Digital e Kiosk deste tenant.</div>
          </div>
          <button className="btn btn-primary" onClick={handleSaveTenant}>Salvar restaurante</button>
        </div>
      </div>

      <div className="ff-data-card">
        <div className="ff-data-card-header">Filial / Unidade</div>
        <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
          {(['Nome da filial', 'address', 'queueMessage'] as const).length > 0 && (
            [['Nome da filial', 'name'], ['Endereço', 'address'], ['Mensagem da fila', 'queueMessage']] as const
          ).map(([label, field]) => (
            <div key={field}>
              <label style={{ fontSize: 13, fontWeight: 600 }}>{label}</label>
              <input className="form-control form-control-sm" value={branchForm[field] as string} onChange={(e) => setBranchForm((f) => ({ ...f, [field]: e.target.value }))} />
            </div>
          ))}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Moeda</label>
              <select className="form-select form-select-sm" value={branchForm.currency} onChange={(e) => setBranchForm((f) => ({ ...f, currency: e.target.value }))}>
                <option value="BRL">BRL — R$</option>
                <option value="USD">USD — $</option>
                <option value="ARS">ARS — $</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600 }}>Taxa de serviço</label>
              <div className="input-group input-group-sm">
                <input className="form-control" type="number" min="0" max="0.5" step="0.01" value={branchForm.serviceFeeRate} onChange={(e) => setBranchForm((f) => ({ ...f, serviceFeeRate: e.target.value }))} />
                <span className="input-group-text">%×100</span>
              </div>
              <div style={{ fontSize: 11, color: '#9ca3af', marginTop: 2 }}>Ex: 0.1 = 10%</div>
            </div>
          </div>
          <div>
            <label style={{ fontSize: 13, fontWeight: 600 }}>Tipo de serviço</label>
            <select className="form-select form-select-sm" value={branchForm.serviceType} onChange={(e) => setBranchForm((f) => ({ ...f, serviceType: e.target.value }))}>
              <option value="TABLE_SERVICE">Serviço de mesa</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="KIOSK_SELF_SERVICE">Kiosk / Autoatendimento</option>
            </select>
          </div>
          <label style={{ fontSize: 13 }}>
            <input type="checkbox" className="me-1" checked={branchForm.queueEnabled} onChange={(e) => setBranchForm((f) => ({ ...f, queueEnabled: e.target.checked }))} />
            Fila habilitada
          </label>
          <button className="btn btn-primary" onClick={handleSaveBranch}>Salvar filial</button>
        </div>
      </div>
    </div>
  );
}
