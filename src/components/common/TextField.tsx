import type { InputHTMLAttributes } from 'react';

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  required?: boolean;
}

export function TextField({ label, required, id, ...rest }: TextFieldProps) {
  const inputId = id ?? `ff-input-${label?.toLowerCase().replace(/\s+/g, '-')}`;
  return (
    <label htmlFor={inputId} style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 12 }}>
      {label && (
        <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>
          {label}
          {required && <span style={{ color: 'var(--ff-primary)' }}> *</span>}
        </span>
      )}
      <input
        id={inputId}
        required={required}
        style={{
          border: '1px solid var(--ff-border)',
          borderRadius: 'var(--ff-radius-pill)',
          padding: '12px 16px',
          fontSize: '0.95rem',
          outline: 'none',
          fontFamily: 'inherit',
        }}
        {...rest}
      />
    </label>
  );
}
