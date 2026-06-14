import { useEffect, useState } from 'react';
import { aggregatorService } from '@/lib/services/aggregatorService';
import { useNotify } from '@/lib/notifications';
import type { AggregatorSettings } from '@/lib/types';

export function AggregatorSection() {
  const [settings, setSettings] = useState<AggregatorSettings[]>([]);
  const notify = useNotify();

  useEffect(() => { aggregatorService.listSettings().then(setSettings); }, []);

  async function handleToggle(s: AggregatorSettings) {
    await aggregatorService.updateSettings(s.id, { active: !s.active });
    notify(`${aggregatorService.getPlatformName(s.platform)} ${!s.active ? 'ativado' : 'desativado'}`);
    aggregatorService.listSettings().then(setSettings);
  }

  async function handleSimulate(s: AggregatorSettings) {
    await aggregatorService.simulateIncomingOrder(s.platform);
    notify(`Pedido simulado de ${aggregatorService.getPlatformName(s.platform)} enviado à cozinha`);
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 500 }}>
      {settings.map((s) => (
        <div key={s.id} className="ff-data-card">
          <div className="ff-data-card-header">
            <span>
              <span className="ff-platform-badge me-2" style={{ background: aggregatorService.getPlatformColor(s.platform) }}>
                {aggregatorService.getPlatformName(s.platform)}
              </span>
              {s.externalId && <span style={{ fontSize: 12, color: '#9ca3af' }}>ID: {s.externalId}</span>}
            </span>
            <span className={`badge ${s.active ? 'bg-success' : 'bg-secondary'}`}>{s.active ? 'Ativo' : 'Inativo'}</span>
          </div>
          <div style={{ padding: '12px 20px', display: 'flex', gap: 8 }}>
            <button className="btn btn-sm btn-outline-secondary" onClick={() => handleToggle(s)}>
              {s.active ? 'Desativar' : 'Ativar'}
            </button>
            {s.active && (
              <button className="btn btn-sm btn-primary" onClick={() => handleSimulate(s)}>
                <i className="bi bi-lightning me-1" />Simular pedido
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
