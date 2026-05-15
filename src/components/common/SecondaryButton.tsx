import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface SecondaryButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
}

export function SecondaryButton({
  children,
  className,
  type = 'button',
  ...rest
}: SecondaryButtonProps) {
  return (
    <button type={type} className={`ff-btn ff-btn--secondary ${className ?? ''}`} {...rest}>
      {children}
    </button>
  );
}
