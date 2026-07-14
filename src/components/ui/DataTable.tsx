import React from 'react';

interface Column<T> {
  header: string;
  accessor: (row: T) => React.ReactNode;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({ columns, data, loading = false, emptyMessage = 'No data available.', onRowClick }: DataTableProps<T>) {
  return (
    <div className="overflow-x-auto w-full rounded-2xl border border-slate-800/80 bg-slate-900/10">
      <table className="w-full text-left text-xs border-collapse">
        <thead>
          <tr className="border-b border-slate-800/80 bg-slate-950/20 text-slate-400 font-semibold uppercase tracking-wider sticky top-0">
            {columns.map((col, idx) => (
              <th key={idx} className={`px-4 py-3.5 ${col.className ?? ''}`}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/40">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
                  <span>Loading records...</span>
                </div>
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500 italic">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                onClick={() => onRowClick?.(row)}
                className={`transition-colors duration-150 ${
                  onRowClick ? 'cursor-pointer hover:bg-slate-800/30' : 'hover:bg-slate-800/10'
                }`}
              >
                {columns.map((col, colIdx) => (
                  <td key={colIdx} className={`px-4 py-3 text-slate-300 font-medium ${col.className ?? ''}`}>{col.accessor(row)}</td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
