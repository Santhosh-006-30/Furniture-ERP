import React from 'react';

interface StatusBadgeProps {
  status: string;
  type?: 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  className?: string;
}

export function StatusBadge({ status, type = 'neutral', className = '' }: StatusBadgeProps) {
  const getStyles = () => {
    switch (type) {
      case 'success':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'warning':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
      case 'danger':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/25';
      case 'info':
        return 'bg-sky-500/10 text-sky-400 border-sky-500/25';
      default:
        return 'bg-slate-800/60 text-slate-400 border-slate-700/50';
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStyles()} uppercase tracking-wider ${className}`}
    >
      {status}
    </span>
  );
}
