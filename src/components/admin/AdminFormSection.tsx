import type { ReactNode } from 'react';

export function AdminFormSection({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <div className="ff-admin-form-section">
      <div className="ff-admin-form-section-header">
        <div className="ff-admin-form-section-title">{title}</div>
        {description && (
          <div className="ff-admin-form-section-description">{description}</div>
        )}
      </div>
      <div className="ff-admin-form-section-body">{children}</div>
    </div>
  );
}

export function AdminFormRow({
  label,
  required,
  hint,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="ff-admin-form-row">
      <label className="ff-admin-form-label">
        {label}
        {required && <span className="ff-admin-form-required">*</span>}
      </label>
      {children}
      {hint && <div className="ff-admin-form-hint">{hint}</div>}
    </div>
  );
}
