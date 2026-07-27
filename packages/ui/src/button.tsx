import React from 'react';
import { cn } from './utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export function Button({ className, variant = 'primary', size = 'md', loading, children, disabled, ...props }: ButtonProps) {
  const base = [
    'inline-flex items-center justify-center font-medium transition-all duration-150',
    'focus:outline-none focus:ring-2 focus:ring-offset-2',
    'disabled:opacity-50 disabled:pointer-events-none',
    'select-none',
  ].join(' ');
  const variants = {
    primary: 'bg-[var(--color-accent)] text-white hover:bg-[var(--color-accent-hover)] active:scale-[0.97] focus:ring-[var(--color-accent)] shadow-sm',
    secondary: 'bg-[var(--color-surface-2)] text-[var(--color-ink)] hover:bg-[var(--color-border)] active:scale-[0.97] focus:ring-[var(--color-muted)]',
    outline: 'border border-[var(--color-border)] text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] active:scale-[0.97] focus:ring-[var(--color-muted)]',
    ghost: 'text-[var(--color-muted)] hover:text-[var(--color-ink)] hover:bg-[var(--color-surface-2)] focus:ring-[var(--color-muted)]',
    danger: 'bg-[var(--color-danger)] text-white hover:opacity-90 active:scale-[0.97] focus:ring-[var(--color-danger)]',
  };
  const sizes = { sm: 'h-8 px-3 text-xs rounded-[var(--radius-sm)]', md: 'h-10 px-4 text-sm rounded-[var(--radius-md)]', lg: 'h-12 px-6 text-base rounded-[var(--radius-md)]' };

  return (
    <button className={cn(base, variants[variant], sizes[size], className)} disabled={disabled || loading} {...props}>
      {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />}
      {children}
    </button>
  );
}
