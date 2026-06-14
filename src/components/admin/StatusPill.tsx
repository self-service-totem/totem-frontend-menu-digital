export function StatusPill({
  status,
  map,
  labelMap,
}: {
  status: string;
  map: Record<string, { bg: string; color: string }>;
  labelMap?: Record<string, string>;
}) {
  const style = map[status] ?? { bg: '#f3f4f6', color: '#6b7280' };
  const label = labelMap?.[status] ?? status;
  return (
    <span className="ff-status-pill" style={{ background: style.bg, color: style.color }}>
      {label}
    </span>
  );
}
