import React from 'react';
import { cn } from './utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ className, label, error, id, ...props }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-ink)]">{label}</label>}
      <input
        id={id}
        className={cn(
          'block w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3.5 py-2.5 text-sm',
          'bg-[var(--color-surface)] text-[var(--color-ink)] placeholder:text-[var(--color-muted)]',
          'shadow-sm transition-all duration-150',
          'focus:border-[var(--color-accent)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)]/20',
          error && 'border-[var(--color-danger)] focus:border-[var(--color-danger)] focus:ring-[var(--color-danger)]/20',
          className,
        )}
        {...props}
      />
      {error && <p className="text-xs text-[var(--color-danger)]">{error}</p>}
    </div>
  );
}
