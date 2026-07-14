import React from 'react';
import { Layers } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  actions?: React.ReactNode;
}

export function EmptyState({ title = 'No results found', description = 'Try adjusting your search criteria or filters.', icon, actions }: EmptyStateProps) {
  return (
    <div className="glass-panel flex flex-col items-center justify-center rounded-2xl p-10 text-center border border-slate-800/80 bg-slate-900/10">
      <div className="p-4 rounded-full bg-slate-800/40 text-slate-500 mb-4">
        {icon ?? <Layers className="w-8 h-8 text-slate-500" />}
      </div>
      <h3 className="text-sm font-bold text-slate-200 mb-1">{title}</h3>
      <p className="text-slate-400 text-xs leading-relaxed max-w-sm mb-5">{description}</p>
      {actions && <div className="flex justify-center">{actions}</div>}
    </div>
  );
}
