import { useEffect, useState } from 'react';
import { aggregatorService } from '@/lib/services/aggregatorService';
import { useNotify } from '@/lib/notifications';
import type { AggregatorSettings } from '@/lib/types';
import { useLabels } from '@/i18n/I18nContext';
import {
  AdminPageHeader,
  AdminButton,
  AdminBadge,
  AdminCard,
  AdminEmptyState,
} from '@/components/admin';

export function AggregatorSection() {
  const { t } = useLabels();
  const [settings, setSettings] = useState<AggregatorSettings[]>([]);
  const notify = useNotify();

  useEffect(() => { aggregatorService.listSettings().then(setSettings); }, []);

  async function handleToggle(s: AggregatorSettings) {
    await aggregatorService.updateSettings(s.id, { active: !s.active });
    const platformName = aggregatorService.getPlatformName(s.platform);
    notify(!s.active
      ? t('adminAggregator.activatedToast', { platform: platformName })
      : t('adminAggregator.deactivatedToast', { platform: platformName })
    );
    aggregatorService.listSettings().then(setSettings);
  }

  async function handleSimulate(s: AggregatorSettings) {
    await aggregatorService.simulateIncomingOrder(s.platform);
    const platformName = aggregatorService.getPlatformName(s.platform);
    notify(t('adminAggregator.simulatedToast', { platform: platformName }));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, maxWidth: 560 }}>
      <AdminPageHeader
        title={t('adminAggregator.title')}
        subtitle={t('adminAggregator.subtitle')}
      />

      {settings.length === 0 ? (
        <AdminEmptyState
          icon="bi-phone"
          title={t('adminAggregator.noAggregators')}
          message={t('adminAggregator.noAggregatorsDesc')}
        />
      ) : (
        settings.map((s) => {
          const platformName  = aggregatorService.getPlatformName(s.platform);
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
                  label={s.active ? t('common.active') : t('common.inactive')}
                />
              }
            >
              <div style={{ display: 'flex', gap: 8 }}>
                <AdminButton
                  variant={s.active ? 'ghost' : 'outline'}
                  size="sm"
                  onClick={() => handleToggle(s)}
                >
                  {s.active ? t('common.disable') : t('common.enable')}
                </AdminButton>
                {s.active && (
                  <AdminButton
                    variant="primary"
                    size="sm"
                    icon="bi-lightning"
                    onClick={() => handleSimulate(s)}
                  >
                    {t('adminAggregator.simulateOrder')}
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
