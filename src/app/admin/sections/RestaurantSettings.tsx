import { useEffect, useState } from 'react';
import { branchService, tenantService } from '@/lib/services/adminService';
import { useNotify } from '@/lib/notifications';
import type { Branch, Tenant } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminFormSection,
  AdminFormRow,
  DirtySaveBar,
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
  const { t } = useLabels();
  const [tenant, setTenant] = useState<Tenant | null>(null);
  const [branch, setBranch] = useState<Branch | null>(null);

  const [tenantForm, setTenantForm]           = useState<TenantForm>({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' });
  const [savedTenantForm, setSavedTenantForm] = useState<TenantForm>({ name: '', logoUrl: '', defaultLanguage: 'pt-BR' });

  const [branchForm, setBranchForm]           = useState<BranchForm>({ name: '', address: '', serviceType: 'TABLE_SERVICE', queueEnabled: true, queueMessage: '', serviceFeeRate: '0.1', currency: 'BRL' });
  const [savedBranchForm, setSavedBranchForm] = useState<BranchForm>({ name: '', address: '', serviceType: 'TABLE_SERVICE', queueEnabled: true, queueMessage: '', serviceFeeRate: '0.1', currency: 'BRL' });

  const [saving, setSaving] = useState(false);
  const notify = useNotify();

  useEffect(() => {
    Promise.all([tenantService.get(), branchService.get()]).then(([ten, b]) => {
      if (ten) {
        const tf: TenantForm = { name: ten.name, logoUrl: ten.logoUrl ?? '', defaultLanguage: ten.defaultLanguage ?? 'pt-BR' };
        setTenant(ten); setTenantForm(tf); setSavedTenantForm(tf);
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
      notify(t('adminSettings.saveSuccess'));
    } catch {
      notify(t('adminSettings.saveError'));
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
    <div className="ff-settings-screen">
      <AdminPageHeader
        title={t('adminSettings.title')}
        subtitle={t('adminSettings.subtitle')}
      />
        <AdminFormSection
          title={t('adminSettings.identity')}
          description={t('adminSettings.identityDesc')}
        >
          <AdminFormRow label={t('adminSettings.restaurantName')} required>
            <input
              className="ff-admin-form-input"
              value={tenantForm.name}
              onChange={tf('name')}
              placeholder={t('adminSettings.restaurantNamePlaceholder')}
            />
          </AdminFormRow>

          <AdminFormRow
            label={t('adminSettings.logoUrl')}
            hint={t('adminSettings.logoUrlDesc')}
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
              alt={t('adminSettings.logoPreview')}
              style={{ height: 48, objectFit: 'contain', borderRadius: 8, border: '1px solid #e5e7eb' }}
            />
          )}

          <AdminFormRow
            label={t('adminSettings.defaultLanguage')}
            hint={t('adminSettings.defaultLanguageDesc')}
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

        <AdminFormSection
          title={t('adminSettings.branch')}
          description={t('adminSettings.branchDesc')}
        >
          <AdminFormRow label={t('adminSettings.branchName')} required>
            <input
              className="ff-admin-form-input"
              value={branchForm.name}
              onChange={bf('name')}
              placeholder={t('adminSettings.branchNamePlaceholder')}
            />
          </AdminFormRow>

          <AdminFormRow label={t('adminSettings.address')}>
            <input
              className="ff-admin-form-input"
              value={branchForm.address}
              onChange={bf('address')}
              placeholder={t('adminSettings.addressPlaceholder')}
            />
          </AdminFormRow>

          <AdminFormRow label={t('adminSettings.serviceType')}>
            <select className="ff-admin-form-select" value={branchForm.serviceType} onChange={bf('serviceType')}>
              <option value="TABLE_SERVICE">{t('adminSettings.serviceTable')}</option>
              <option value="TAKEAWAY">{t('adminSettings.serviceTakeaway')}</option>
              <option value="KIOSK_SELF_SERVICE">{t('adminSettings.serviceKiosk')}</option>
            </select>
          </AdminFormRow>
        </AdminFormSection>

        <AdminFormSection
          title={t('adminSettings.financial')}
          description={t('adminSettings.financialDesc')}
        >
          <div className="ff-admin-form-grid-2">
            <AdminFormRow label={t('adminSettings.currency')}>
              <select className="ff-admin-form-select" value={branchForm.currency} onChange={bf('currency')}>
                <option value="BRL">BRL — R$</option>
                <option value="USD">USD — $</option>
                <option value="ARS">ARS — $</option>
              </select>
            </AdminFormRow>
            <AdminFormRow label={t('adminSettings.serviceFee')} hint={t('adminSettings.serviceFeeHint')}>
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

        <AdminFormSection
          title={t('adminSettings.queueSection')}
          description={t('adminSettings.queueDesc')}
        >
          <AdminFormRow label={t('adminSettings.queueEnabledLabel')}>
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
                {branchForm.queueEnabled ? t('adminSettings.queueEnabledLabel') : t('adminSettings.queueDisabledLabel')}
              </span>
            </label>
          </AdminFormRow>

          <AdminFormRow
            label={t('adminSettings.queueMessage')}
            hint={t('adminSettings.queueMessageDesc')}
          >
            <input
              className="ff-admin-form-input"
              value={branchForm.queueMessage}
              onChange={bf('queueMessage')}
              placeholder={t('adminSettings.queueMessagePlaceholder')}
            />
          </AdminFormRow>
        </AdminFormSection>

      <DirtySaveBar
        visible={isDirty}
        saving={saving}
        onCancel={handleDiscard}
        onSave={handleSave}
      />
    </div>
  );
}
