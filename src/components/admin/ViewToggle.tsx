export type ViewMode = 'card' | 'table';

export function ViewToggle({
  mode,
  onChange,
}: {
  mode: ViewMode;
  onChange: (m: ViewMode) => void;
}) {
  return (
    <div className="ff-view-toggle" role="group" aria-label="Modo de visualização">
      <button
        type="button"
        className={`ff-view-toggle-btn${mode === 'card' ? ' active' : ''}`}
        onClick={() => onChange('card')}
        title="Cards"
        aria-pressed={mode === 'card'}
      >
        <i className="bi bi-grid-3x3-gap" />
      </button>
      <button
        type="button"
        className={`ff-view-toggle-btn${mode === 'table' ? ' active' : ''}`}
        onClick={() => onChange('table')}
        title="Tabela"
        aria-pressed={mode === 'table'}
      >
        <i className="bi bi-list-ul" />
      </button>
    </div>
  );
}
