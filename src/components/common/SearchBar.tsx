import type { ChangeEvent } from 'react';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = 'Buscar producto' }: SearchBarProps) {
  return (
    <div className="ff-search">
      <i className="bi bi-search ff-search__icon" aria-hidden />
      <input
        type="search"
        className="ff-search__input"
        placeholder={placeholder}
        value={value}
        onChange={(e: ChangeEvent<HTMLInputElement>) => onChange(e.target.value)}
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          className="ff-search__clear"
          onClick={() => onChange('')}
          aria-label="Clear"
        >
          <i className="bi bi-x-circle-fill" aria-hidden />
        </button>
      )}
    </div>
  );
}
