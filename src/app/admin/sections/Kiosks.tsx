import { useEffect, useState } from 'react';
import { kioskDeviceService } from '@/lib/services/adminService';
import { loadAttractConfig, saveAttractConfig } from '@/app/kiosk/attractConfig';
import type { KioskDevice } from '@/lib/types';
import type { AttractScreenConfig } from '@/app/kiosk/attractConfig';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminCard,
  AdminTable,
  AdminFormSection,
  AdminFormRow,
} from '@/components/admin';
import type { AdminTableColumn } from '@/components/admin';

const DEVICE_STATUS_VARIANT: Record<string, 'active' | 'preparing' | 'inactive'> = {
  ONLINE:      'active',
  OFFLINE:     'inactive',
  MAINTENANCE: 'preparing',
};

const DEVICE_STATUS_LABEL: Record<string, string> = {
  ONLINE:      'Online',
  OFFLINE:     'Offline',
  MAINTENANCE: 'Manutenção',
};

export function Kiosks() {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [cfg, setCfg]         = useState<AttractScreenConfig>(loadAttractConfig);
  const [saved, setSaved]     = useState(false);

  useEffect(() => { kioskDeviceService.list().then(setDevices); }, []);

  function set<K extends keyof AttractScreenConfig>(key: K, value: AttractScreenConfig[K]) {
    setCfg((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveAttractConfig(cfg);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  const deviceColumns: AdminTableColumn<KioskDevice>[] = [
    {
      key: 'name',
      label: 'Dispositivo',
      render: (d) => <strong>{d.name}</strong>,
    },
    {
      key: 'status',
      label: 'Status',
      render: (d) => (
        <AdminBadge
          variant={DEVICE_STATUS_VARIANT[d.status] ?? 'inactive'}
          label={DEVICE_STATUS_LABEL[d.status] ?? d.status}
        />
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28, maxWidth: 680 }}>
      <AdminPageHeader
        title="Kiosks"
        subtitle="Gestão de dispositivos e configuração da tela de atração"
      />

      {/* Device list */}
      <AdminCard header="Dispositivos" noPad>
        <AdminTable<KioskDevice>
          columns={deviceColumns}
          rows={devices}
          emptyIcon="bi-display"
          emptyTitle="Nenhum dispositivo"
          emptyMessage="Nenhum kiosk registrado ainda."
        />
      </AdminCard>

      {/* Attract screen config */}
      <AdminCard header="Tela de Atração (Idle)">
        <div style={{ fontSize: 13, color: '#6b7280', marginBottom: 20 }}>
          Exibida quando o kiosk está sem uso. As alterações entram em vigor na próxima vez que a tela de atração for carregada.
        </div>

        <AdminFormSection title="Configuração geral">
          <AdminFormRow label="Ativar tela de atração">
            <div className="ff-admin-toggle-row">
              <button
                className="ff-admin-toggle"
                aria-checked={cfg.enabled}
                onClick={() => set('enabled', !cfg.enabled)}
                role="switch"
              >
                <span className="ff-admin-toggle-thumb" />
              </button>
              <span className={`ff-admin-toggle-label${cfg.enabled ? ' ff-admin-toggle-label--on' : ''}`}>
                {cfg.enabled ? 'Ativada' : 'Desativada'}
              </span>
            </div>
          </AdminFormRow>

          <AdminFormRow label="Nome do restaurante">
            <input
              className="ff-admin-form-input"
              value={cfg.restaurantName}
              onChange={(e) => set('restaurantName', e.target.value)}
            />
          </AdminFormRow>

          <AdminFormRow label="Slogan" hint="Exibido abaixo do nome na tela de atração (opcional).">
            <input
              className="ff-admin-form-input"
              placeholder="Ex: O melhor da cidade"
              value={cfg.slogan ?? ''}
              onChange={(e) => set('slogan', e.target.value || null)}
            />
          </AdminFormRow>

          <AdminFormRow label="URL do vídeo" hint="Sem vídeo, é usado fundo com gradiente (opcional).">
            <input
              className="ff-admin-form-input"
              type="url"
              placeholder="https://..."
              value={cfg.videoUrl ?? ''}
              onChange={(e) => set('videoUrl', e.target.value || null)}
            />
          </AdminFormRow>

          <AdminFormRow
            label={`Timeout de inatividade: ${cfg.idleTimeoutSeconds}s`}
            hint="Após esse tempo sem toque, aparece o aviso 'Você ainda está aí?' antes de voltar à tela de atração."
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{ fontSize: 12, color: '#9ca3af', width: 28 }}>30s</span>
              <input
                type="range"
                min={30}
                max={300}
                step={10}
                value={cfg.idleTimeoutSeconds}
                onChange={(e) => set('idleTimeoutSeconds', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 12, color: '#9ca3af', width: 34 }}>300s</span>
            </div>
          </AdminFormRow>
        </AdminFormSection>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingTop: 20, borderTop: '1px solid #f3f4f6', marginTop: 4 }}>
          <AdminButton variant="primary" icon="bi-check-lg" onClick={handleSave}>
            Salvar configuração
          </AdminButton>
          {saved && (
            <span style={{ color: '#059669', fontWeight: 600, fontSize: 13 }}>
              <i className="bi bi-check-circle-fill" /> Salvo
            </span>
          )}
        </div>
      </AdminCard>
    </div>
  );
}
