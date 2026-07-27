'use client';
import * as React from 'react';
import { cn } from './utils';

interface PaginationProps {
  page: number;
  pageCount: number;
  total: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, pageCount, total, onChange }: PaginationProps) {
  if (pageCount <= 1) return null;
  return (
    <div className="mt-6 flex items-center justify-center gap-3">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        className={cn(
          'rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2 text-sm transition-all duration-150',
          page <= 1 ? 'text-[var(--color-muted)]/40 cursor-not-allowed border-[var(--color-border-light)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-muted)] active:scale-[0.97]',
        )}
      >
        上一页
      </button>
      <span className="text-sm text-[var(--color-muted)]">
        第 <span className="font-medium text-[var(--color-ink)]">{page}</span>/{pageCount} 页
        <span className="ml-1">(共 {total} 条)</span>
      </span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className={cn(
          'rounded-[var(--radius-sm)] border border-[var(--color-border)] px-4 py-2 text-sm transition-all duration-150',
          page >= pageCount ? 'text-[var(--color-muted)]/40 cursor-not-allowed border-[var(--color-border-light)]' : 'text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:border-[var(--color-muted)] active:scale-[0.97]',
        )}
      >
        下一页
      </button>
    </div>
  );
}
