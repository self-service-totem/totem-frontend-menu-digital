import { useEffect, useState } from 'react';
import { aggregatorService } from '@/lib/services/aggregatorService';
import { useNotify } from '@/lib/notifications';
import type { AggregatorSettings } from '@/lib/types';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
} from '@/components/admin';

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
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
      <AdminPageHeader
        title="Agregadores"
        subtitle="Integrações com plataformas de delivery externas"
      />

      {settings.length === 0 ? (
        <AdminEmptyState
          icon="bi-phone"
          title="Nenhum agregador configurado"
          message="Configure integrações com iFood, Rappi e outras plataformas."
        />
      ) : (
        settings.map((s) => {
          const platformName = aggregatorService.getPlatformName(s.platform);
          const platformColor = aggregatorService.getPlatformColor(s.platform);

          return (
            <AdminCard
              key={s.id}
              header={
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span
                    className="ff-platform-badge"
                    style={{ background: platformColor }}
                  >
                    {platformName}
                  </span>
                  {s.externalId && (
                    <span style={{ fontSize: 12, color: '#9ca3af' }}>ID: {s.externalId}</span>
                  )}
                </div>
              }
              headerRight={
                <AdminBadge
                  variant={s.active ? 'active' : 'inactive'}
                  label={s.active ? 'Ativo' : 'Inativo'}
                />
              }
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <AdminButton
                  variant={s.active ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() => handleToggle(s)}
                >
                  {s.active ? 'Desativar' : 'Ativar'}
                </AdminButton>
                {s.active && (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon="bi-lightning"
                    onClick={() => handleSimulate(s)}
                  >
                    Simular pedido
                  </AdminButton>
                )}
              </div>
            </AdminCard>
          );
        })
      )}
    </div>
  );
}
