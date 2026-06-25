export function AdminSearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  className = '',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div className={`ff-admin-search ${className}`.trim()}>
      <i className="bi bi-search ff-admin-search-icon" />
      <input
        className="ff-admin-search-input"
        type="text"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {value && (
        <button
          className="ff-admin-search-clear"
          onClick={() => onChange('')}
          type="button"
          aria-label="Limpar busca"
        >
          <i className="bi bi-x" />
        </button>
      )}
    </div>
  );
}
