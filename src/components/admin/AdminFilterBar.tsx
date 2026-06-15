export interface FilterOption {
  key: string;
  label: string;
  count?: number;
}

export function AdminFilterBar({
  options,
  value,
  onChange,
  className = '',
}: {
  options: FilterOption[];
  value: string;
  onChange: (key: string) => void;
  className?: string;
}) {
  return (
    <div className={`ff-admin-filter-bar ${className}`.trim()}>
      {options.map((opt) => (
        <button
          key={opt.key}
          className={`ff-admin-filter-chip${value === opt.key ? ' ff-admin-filter-chip--active' : ''}`}
          onClick={() => onChange(opt.key)}
          type="button"
        >
          {opt.label}
          {opt.count !== undefined && (
            <span className="ff-admin-filter-chip-count">{opt.count}</span>
          )}
        </button>
      ))}
    </div>
  );
}
