import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface PrimaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function PrimaryButton({
  children,
  className,
  type = 'button',
  ...rest
}: PrimaryButtonProps) {
  return (
    <button type={type} className={`ff-btn ff-btn--primary ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}
