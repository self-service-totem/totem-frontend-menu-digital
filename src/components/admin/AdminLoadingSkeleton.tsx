export function AdminLoadingSkeleton({
  rows = 5,
  cols = 4,
}: {
  rows?: number;
  cols?: number;
}) {
  return (
    <div className="ff-admin-skeleton">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="ff-admin-skeleton-row">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="ff-admin-skeleton-cell" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function AdminMetricSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="ff-admin-metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="ff-admin-metric-card ff-admin-skeleton-card">
          <div className="ff-admin-skeleton-block ff-admin-skeleton-block--icon" />
          <div className="ff-admin-skeleton-block ff-admin-skeleton-block--value" />
          <div className="ff-admin-skeleton-block ff-admin-skeleton-block--label" />
        </div>
      ))}
    </div>
  );
}
