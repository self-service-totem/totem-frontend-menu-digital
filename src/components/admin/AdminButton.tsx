import type { ButtonHTMLAttributes } from 'react';

export type AdminButtonVariant =
  | 'primary' | 'secondary' | 'ghost' | 'outline'
  | 'destructive' | 'success' | 'warning' | 'icon';

export function AdminButton({
  variant = 'primary',
  size = 'md',
  icon,
  loading = false,
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  icon?: string;
  loading?: boolean;
}) {
  const cls = [
    'ff-admin-btn',
    `ff-admin-btn--${variant}`,
    size !== 'md' ? `ff-admin-btn--${size}` : '',
    loading ? 'ff-admin-btn--loading' : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} disabled={loading || props.disabled} {...props}>
      {loading
        ? <i className="bi bi-arrow-repeat ff-admin-btn-spinner" />
        : icon && <i className={`bi ${icon}`} />}
      {children && <span>{children}</span>}
    </button>
  );
}

export function AdminIconButton({
  icon,
  title,
  variant = 'ghost',
  size = 'md',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  icon: string;
  variant?: AdminButtonVariant;
  size?: 'sm' | 'md' | 'lg';
}) {
  const cls = [
    'ff-admin-btn',
    `ff-admin-btn--${variant}`,
    'ff-admin-btn--icon',
    size !== 'md' ? `ff-admin-btn--${size}` : '',
    className,
  ].filter(Boolean).join(' ');

  return (
    <button className={cls} title={title} {...props}>
      <i className={`bi ${icon}`} />
    </button>
  );
}
