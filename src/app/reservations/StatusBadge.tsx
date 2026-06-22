import { useLabels } from '@/i18n/I18nContext';
import type { ReservationStatus } from '@/lib/types';
import { STATUS_CONFIG } from './reservationsUtils';

export function StatusBadge({ status }: { status: ReservationStatus }) {
  const { t } = useLabels();
  const cfg = STATUS_CONFIG[status];
  return (
    <span
      className="ff-res-badge"
      style={{ color: cfg.color, background: cfg.bg, borderColor: cfg.border }}
    >
      <i className={`bi ${cfg.icon}`} style={{ fontSize: 10 }} />
      {t(cfg.labelKey)}
    </span>
  );
}
