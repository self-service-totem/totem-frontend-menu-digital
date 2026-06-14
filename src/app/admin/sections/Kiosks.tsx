import { useEffect, useState } from 'react';
import { kioskDeviceService } from '@/lib/services/adminService';
import { loadAttractConfig, saveAttractConfig } from '@/app/kiosk/attractConfig';
import type { KioskDevice } from '@/lib/types';
import type { AttractScreenConfig } from '@/app/kiosk/attractConfig';

const STATUS_COLOR: Record<string, string> = {
  ONLINE:      '#059669',
  OFFLINE:     '#6b7280',
  MAINTENANCE: '#d97706',
};

export function Kiosks() {
  const [devices, setDevices] = useState<KioskDevice[]>([]);
  const [cfg, setCfg] = useState<AttractScreenConfig>(loadAttractConfig);
  const [saved, setSaved] = useState(false);

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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

      {/* Device table */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">
          <h2 className="ff-data-card-title">Dispositivos</h2>
        </div>
        <table className="table table-hover mb-0">
          <thead>
            <tr><th>Nome</th><th>Status</th></tr>
          </thead>
          <tbody>
            {devices.map((d) => (
              <tr key={d.id}>
                <td><strong>{d.name}</strong></td>
                <td>
                  <span style={{ color: STATUS_COLOR[d.status] ?? '#6b7280', fontWeight: 600 }}>
                    ● {d.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Attract screen config */}
      <div className="ff-data-card">
        <div className="ff-data-card-header">
          <h2 className="ff-data-card-title">Tela de Atração (Idle)</h2>
          <p className="ff-data-card-subtitle">
            Exibida quando o kiosk está sem uso. As alterações entram em vigor na próxima vez que a tela de atração for carregada.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, padding: '0 0 8px' }}>

          {/* Enable toggle */}
          <div className="ff-form-row">
            <label className="ff-form-label">Ativar tela de atração</label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <button
                className={`ff-toggle-btn${cfg.enabled ? ' active' : ''}`}
                onClick={() => set('enabled', !cfg.enabled)}
                role="switch"
                aria-checked={cfg.enabled}
              >
                <span className="ff-toggle-knob" />
              </button>
              <span style={{ fontSize: 14, color: cfg.enabled ? '#059669' : '#6b7280' }}>
                {cfg.enabled ? 'Ativada' : 'Desativada'}
              </span>
            </div>
          </div>

          {/* Restaurant name */}
          <div className="ff-form-row">
            <label className="ff-form-label" htmlFor="attract-name">Nome do restaurante</label>
            <input
              id="attract-name"
              className="ff-form-input"
              value={cfg.restaurantName}
              onChange={(e) => set('restaurantName', e.target.value)}
            />
          </div>

          {/* Slogan */}
          <div className="ff-form-row">
            <label className="ff-form-label" htmlFor="attract-slogan">
              Slogan <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional)</span>
            </label>
            <input
              id="attract-slogan"
              className="ff-form-input"
              placeholder="Ex: O melhor da cidade"
              value={cfg.slogan ?? ''}
              onChange={(e) => set('slogan', e.target.value || null)}
            />
          </div>

          {/* Video URL */}
          <div className="ff-form-row">
            <label className="ff-form-label" htmlFor="attract-video">
              URL do vídeo <span style={{ fontWeight: 400, color: '#9ca3af' }}>(opcional — sem vídeo usa fundo com gradiente)</span>
            </label>
            <input
              id="attract-video"
              className="ff-form-input"
              type="url"
              placeholder="https://..."
              value={cfg.videoUrl ?? ''}
              onChange={(e) => set('videoUrl', e.target.value || null)}
            />
          </div>

          {/* Idle timeout */}
          <div className="ff-form-row">
            <label className="ff-form-label" htmlFor="attract-timeout">
              Timeout de inatividade: <strong>{cfg.idleTimeoutSeconds}s</strong>
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <span style={{ fontSize: 13, color: '#9ca3af', width: 32, textAlign: 'right' }}>30s</span>
              <input
                id="attract-timeout"
                type="range"
                min={30}
                max={300}
                step={10}
                value={cfg.idleTimeoutSeconds}
                onChange={(e) => set('idleTimeoutSeconds', Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: 13, color: '#9ca3af', width: 36 }}>300s</span>
            </div>
            <p style={{ fontSize: 13, color: '#9ca3af', margin: '4px 0 0' }}>
              Após esse tempo sem toque, aparece o aviso "Você ainda está aí?" antes de voltar à tela de atração.
            </p>
          </div>

          {/* Save button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingTop: 8, borderTop: '1px solid #f0f0f0' }}>
            <button className="ff-primary-btn" onClick={handleSave}>
              <i className="bi bi-check-lg" /> Salvar configuração
            </button>
            {saved && (
              <span style={{ color: '#059669', fontWeight: 600, fontSize: 14 }}>
                <i className="bi bi-check-circle-fill" /> Salvo
              </span>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
