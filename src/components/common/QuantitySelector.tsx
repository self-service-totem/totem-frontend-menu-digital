interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
}

export function QuantitySelector({ value, onChange, min = 0, max = 99 }: QuantitySelectorProps) {
  const dec = () => onChange(Math.max(min, value - 1));
  const inc = () => onChange(Math.min(max, value + 1));
  return (
    <div className="ff-qty" role="group" aria-label="Selector de cantidad">
      <button
        type="button"
        className="ff-qty__btn"
        onClick={dec}
        disabled={value <= min}
        aria-label="Disminuir"
      >
        <i className="bi bi-dash" />
      </button>
      <span className="ff-qty__value" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        className="ff-qty__btn"
        onClick={inc}
        disabled={value >= max}
        aria-label="Aumentar"
      >
        <i className="bi bi-plus" />
      </button>
    </div>
  );
}
