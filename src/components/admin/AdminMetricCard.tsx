export type MetricColor = 'blue' | 'green' | 'amber' | 'purple' | 'slate' | 'red';

export function AdminMetricCard({
  label,
  value,
  icon,
  color = 'slate',
  delta,
  deltaDir,
}: {
  label: string;
  value: string | number;
  icon: string;
  color?: MetricColor;
  delta?: string;
  deltaDir?: 'up' | 'down' | 'neutral';
}) {
  return (
    <div className="ff-admin-metric-card">
      <div className="ff-admin-metric-card-top">
        <div className={`ff-metric-icon ${color}`}>
          <i className={`bi ${icon}`} />
        </div>
        {delta && (
          <span className={`ff-metric-delta ${deltaDir ?? 'neutral'}`}>
            {deltaDir === 'up' && <i className="bi bi-arrow-up" />}
            {deltaDir === 'down' && <i className="bi bi-arrow-down" />}
            {delta}
          </span>
        )}
      </div>
      <div className="ff-admin-metric-card-bottom">
        <div className="ff-admin-metric-card-value">{value}</div>
        <div className="ff-admin-metric-card-label">{label}</div>
      </div>
    </div>
  );
}
