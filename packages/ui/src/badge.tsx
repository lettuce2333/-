import React from 'react';
import { cn } from './utils';

export function Badge({ className, variant = 'default', children }: { className?: string; variant?: 'default' | 'success' | 'warning' | 'danger' | 'info'; children: React.ReactNode }) {
  const variants = {
    default: 'bg-[var(--color-surface-2)] text-[var(--color-muted)]',
    success: 'bg-emerald-50 text-emerald-700',
    warning: 'bg-amber-50 text-amber-700',
    danger: 'bg-red-50 text-red-700',
    info: 'bg-blue-50 text-blue-700',
  };
  return <span className={cn('inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium', variants[variant], className)}>{children}</span>;
}
