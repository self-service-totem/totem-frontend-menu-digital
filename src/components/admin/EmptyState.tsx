export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: string;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="ff-empty-state">
      <i className={`bi ${icon} ff-empty-state-icon`} />
      <div className="ff-empty-state-title">{title}</div>
      {description && <div className="ff-empty-state-desc">{description}</div>}
      {action && (
        <button className="btn btn-primary btn-sm mt-2" onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
