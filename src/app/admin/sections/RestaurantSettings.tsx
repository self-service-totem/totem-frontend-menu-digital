import { useEffect, useState } from 'react';
import { branchService, tenantService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { Branch, Tenant } from '@/lib/types';
import {
  AdminPageHeader,
  AdminButton,
  AdminFormSection,
  AdminFormRow,
} from '@/components/admin';

type TenantForm = {
  name: string;
  logoUrl: string;
  defaultLanguage: 'es' | 'pt-BR' | 'en';
};

type BranchForm = {
  name: string;
  address: string;
  serviceType: string;
  queueEnabled: boolean;
  queueMessage: string;
  serviceFeeRate: string;
  currency: string;
};

function formsEqual<T extends object>(a: T, b: T) {
  return JSON.stringify(a) === JSON.stringify(b);
}

export function RestaurantSettings() {
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);

  const [tenantForm, setTenantForm]     = useState<TenantForm>({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' });
  const [savedTenantForm, setSavedTenantForm] = useState<TenantForm>({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' });

  const [branchForm, setBranchForm]     = useState<BranchForm>({ name: '', address: '', serviceType: 'TABLE_SERVICE', queueEnabled: true, queueMessage: '', serviceFeeRate: '0.1', currency: 'BRL' });
  const [savedBranchForm, setSavedBranchForm] = useState<BranchForm>({ name: '', address: '', serviceType: 'TABLE_SERVICE', queueEnabled: true, queueMessage: '', serviceFeeRate: '0.1', currency: 'BRL' });

  const [saving, setSaving] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    Promise.all([tenantService.get(), branchService.get()]).then(([t, b]) => {
      if (t) {
        const tf: TenantForm = { name: t.name, logoUrl: t.logoUrl ?? '', defaultLanguage: t.defaultLanguage ?? 'pt-BR' };
        setTenant(t); setTenantForm(tf); setSavedTenantForm(tf);
      }
      if (b) {
        const bf: BranchForm = {
          name: b.name,
          address: b.address ?? '',
          serviceType: b.serviceType,
          queueEnabled: b.queueEnabled,
          queueMessage: b.queueMessage ?? '',
          serviceFeeRate: String(b.serviceFeeRate ?? 0.1),
          currency: b.currency ?? 'BRL',
        };
        setBranch(b); setBranchForm(bf); setSavedBranchForm(bf);
      }
    });
  }, []);

  const isDirty = !formsEqual(tenantForm, savedTenantForm) || !formsEqual(branchForm, savedBranchForm);

  async function handleSave() {
    if (!tenant || !branch) return;
    setSaving(true);
    try {
      await Promise.all([
        tenantService.update({
          name: tenantForm.name.trim(),
          logoUrl: tenantForm.logoUrl.trim() || undefined,
          defaultLanguage: tenantForm.defaultLanguage,
        }),
        branchService.update({
          ...branchForm,
          serviceType: branchForm.serviceType as Branch['serviceType'],
          serviceFeeRate: parseFloat(branchForm.serviceFeeRate) || 0.1,
        }),
      ]);
      setSavedTenantForm({ ...tenantForm });
      setSavedBranchForm({ ...branchForm });
      notify('Configurações salvas com sucesso');
    } catch {
      notify('Erro ao salvar — tente novamente');
    } finally {
      setSaving(false);
    }
  }

  function handleDiscard() {
    setTenantForm({ ...savedTenantForm });
    setBranchForm({ ...savedBranchForm });
  }

  const tf = (field: keyof TenantForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setTenantForm((f) => ({ ...f, [field]: e.target.value }));

  const bf = (field: keyof BranchForm) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setBranchForm((f) => ({ ...f, [field]: e.target.value }));

  return (
    <div style={{ maxWidth: 760, paddingBottom: isDirty ? 80 : 0 }}>
      <AdminPageHeader
        title="Configurações"
        subtitle="Identidade, filial, operação e integração"
        actions={
          isDirty ? (
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>
              Salvar alterações
            </AdminButton>
          ) : undefined
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* ── Identity ── */}
        <AdminFormSection
          title="Identidade do restaurante"
          description="Nome e logo exibidos no Menu Digital e no Kiosk."
        >
          <AdminFormRow label="Nome do restaurante" required>
            <input
              className="ff-admin-form-input"
              value={tenantForm.name}
              onChange={tf('name')}
              placeholder="Nome do estabelecimento"
            />
          </AdminFormRow>

          <AdminFormRow
            label="URL do logotipo"
            hint="Cole a URL pública da imagem (PNG, SVG ou JPG)."
          >
            <input
              className="ff-admin-form-input"
              placeholder="https://..."
              value={tenantForm.logoUrl}
              onChange={tf('logoUrl')}
            />
          </AdminFormRow>

          {tenantForm.logoUrl && (
            <img
              src={tenantForm.logoUrl}
              alt="Preview do logo"
              style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
          )}

          <AdminFormRow
            label="Idioma padrão"
            hint="Idioma inicial para o Menu Digital e Kiosk deste tenant."
          >
            <select
              className="ff-admin-form-select"
              value={tenantForm.defaultLanguage}
              onChange={(e) => setTenantForm((f) => ({ ...f, defaultLanguage: e.target.value as TenantForm['defaultLanguage'] }))}
            >
              <option value="pt-BR">🇧🇷 Português</option>
              <option value="es">🇦🇷 Español</option>
              <option value="en">🇺🇸 English</option>
            </select>
          </AdminFormRow>
        </AdminFormSection>

        {/* ── Branch ── */}
        <AdminFormSection
          title="Filial / Unidade"
          description="Informações da unidade física e tipo de operação."
        >
          <AdminFormRow label="Nome da filial" required>
            <input
              className="ff-admin-form-input"
              value={branchForm.name}
              onChange={bf('name')}
              placeholder="Nome da unidade"
            />
          </AdminFormRow>

          <AdminFormRow label="Endereço">
            <input
              className="ff-admin-form-input"
              value={branchForm.address}
              onChange={bf('address')}
              placeholder="Rua, número, cidade..."
            />
          </AdminFormRow>

          <AdminFormRow label="Tipo de serviço">
            <select className="ff-admin-form-select" value={branchForm.serviceType} onChange={bf('serviceType')}>
              <option value="TABLE_SERVICE">Serviço de mesa</option>
              <option value="TAKEAWAY">Takeaway</option>
              <option value="KIOSK_SELF_SERVICE">Kiosk / Autoatendimento</option>
            </select>
          </AdminFormRow>
        </AdminFormSection>

        {/* ── Financial ── */}
        <AdminFormSection
          title="Financeiro"
          description="Moeda e taxa de serviço aplicadas aos pedidos."
        >
          <div className="ff-admin-form-grid-2">
            <AdminFormRow label="Moeda">
              <select className="ff-admin-form-select" value={branchForm.currency} onChange={bf('currency')}>
                <option value="BRL">BRL — R$</option>
                <option value="USD">USD — $</option>
                <option value="ARS">ARS — $</option>
              </select>
            </AdminFormRow>
            <AdminFormRow label="Taxa de serviço" hint="Ex: 0.1 = 10%">
              <input
                className="ff-admin-form-input"
                type="number"
                min={0}
                max={0.5}
                step={0.01}
                value={branchForm.serviceFeeRate}
                onChange={bf('serviceFeeRate')}
              />
            </AdminFormRow>
          </div>
        </AdminFormSection>

        {/* ── Queue ── */}
        <AdminFormSection
          title="Fila de espera"
          description="Configuração da fila visível no Menu Digital."
        >
          <AdminFormRow label="Fila habilitada">
            <label className="ff-admin-toggle-row" style={{ cursor: 'pointer' }}>
              <button
                className="ff-admin-toggle"
                aria-checked={branchForm.queueEnabled}
                role="switch"
                onClick={() => setBranchForm((f) => ({ ...f, queueEnabled: !f.queueEnabled }))}
              >
                <span className="ff-admin-toggle-thumb" />
              </button>
              <span className={`ff-admin-toggle-label${branchForm.queueEnabled ? ' ff-admin-toggle-label--on' : ''}`}>
                {branchForm.queueEnabled ? 'Fila habilitada' : 'Fila desabilitada'}
              </span>
            </label>
          </AdminFormRow>

          <AdminFormRow
            label="Mensagem da fila"
            hint="Exibida aos clientes na tela de fila do Menu Digital."
          >
            <input
              className="ff-admin-form-input"
              value={branchForm.queueMessage}
              onChange={bf('queueMessage')}
              placeholder="ex: Acompanhe seu pedido aqui!"
            />
          </AdminFormRow>
        </AdminFormSection>
      </div>

      {/* Sticky save bar */}
      {isDirty && (
        <div className="ff-admin-save-bar">
          <span className="ff-admin-save-bar-text">Você tem alterações não salvas</span>
          <div className="ff-admin-save-bar-actions">
            <AdminButton variant="ghost" onClick={handleDiscard}>Descartar</AdminButton>
            <AdminButton variant="primary" loading={saving} onClick={handleSave}>
              Salvar alterações
            </AdminButton>
          </div>
        </div>
      )}
    </div>
  );
}
