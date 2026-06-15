import type { MetricColor } from './AdminMetricCard';

/**
 * Compact inline metric (`ff-admin-metric-chip`): icon + value + label on one
 * line. Use on operational pages where a full {@link AdminMetricCard} grid would
 * be too heavy — e.g. a small strip of counters above a table. For dashboards
 * and reports prefer AdminMetricCard. See docs/DESIGN_SYSTEM.md.
 */
export function MetricChip({
  label,
  value,
  icon,
  color = 'slate',
}: {
  label: string;
  value: string | number;
  icon?: string;
  color?: MetricColor;
}) {
  return (
    <div className="ff-admin-metric-chip">
      {icon && (
        <span className={`ff-admin-metric-chip-icon ${color}`}>
          <i className={`bi ${icon}`} />
        </span>
      )}
      <span className="ff-admin-metric-chip-value">{value}</span>
      <span className="ff-admin-metric-chip-label">{label}</span>
    </div>
  );
}
