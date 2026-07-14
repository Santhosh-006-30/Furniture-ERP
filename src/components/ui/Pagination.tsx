import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (pg: number) => void;
}

export function Pagination({ page, totalPages, totalItems, pageSize, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;

  const startIdx = (page - 1) * pageSize + 1;
  const endIdx = Math.min(page * pageSize, totalItems);

  return (
    <div className="flex items-center justify-between border-t border-slate-800/40 pt-4 px-1 text-slate-400">
      <span className="text-xs">
        Showing <span className="font-semibold text-slate-300">{startIdx}</span> to{' '}
        <span className="font-semibold text-slate-300">{endIdx}</span> of{' '}
        <span className="font-semibold text-slate-300">{totalItems}</span> results
      </span>
      <div className="flex items-center gap-1.5">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="neumorphic-button p-2 rounded-xl text-slate-300 disabled:opacity-40 disabled:hover:translate-y-0 transition-all duration-200"
          aria-label="Previous page"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <span className="text-xs text-slate-300 px-3 py-1.5 rounded-xl bg-slate-950/40 border border-slate-850 select-none">
          Page {page} of {totalPages}
        </span>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="neumorphic-button p-2 rounded-xl text-slate-300 disabled:opacity-40 disabled:hover:translate-y-0 transition-all duration-200"
          aria-label="Next page"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
