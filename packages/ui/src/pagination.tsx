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
        className={cn('rounded-lg border px-4 py-2 text-sm transition-colors', page <= 1 ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300')}
      >
        上一页
      </button>
      <span className="text-sm text-gray-500">第 <span className="font-medium text-gray-700">{page}</span>/{pageCount} 页 (共 {total} 条)</span>
      <button
        onClick={() => onChange(page + 1)}
        disabled={page >= pageCount}
        className={cn('rounded-lg border px-4 py-2 text-sm transition-colors', page >= pageCount ? 'text-gray-300 cursor-not-allowed' : 'text-gray-600 hover:bg-gray-50 hover:border-gray-300')}
      >
        下一页
      </button>
    </div>
  );
}