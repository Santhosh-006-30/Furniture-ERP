import React from 'react';

interface TimelineItem {
  title: string;
  description?: string;
  timestamp: string;
  status?: 'completed' | 'current' | 'pending';
}

interface TimelineProps {
  items: TimelineItem[];
  className?: string;
}

export function Timeline({ items, className = '' }: TimelineProps) {
  return (
    <div className={`relative border-l border-slate-800/80 ml-3.5 pl-6 space-y-6 ${className}`}>
      {items.map((item, idx) => {
        const isCompleted = item.status === 'completed';
        const isCurrent = item.status === 'current';

        return (
          <div key={idx} className="relative">
            {/* Timeline Dot Indicator */}
            <span
              className={`absolute -left-[31px] top-1 flex h-4 w-4 items-center justify-center rounded-full border bg-slate-900 transition-all ${
                isCompleted
                  ? 'border-emerald-500 text-emerald-500 shadow-sm shadow-emerald-500/10'
                  : isCurrent
                  ? 'border-sky-500 text-sky-500 animate-pulse'
                  : 'border-slate-800 text-slate-500'
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  isCompleted ? 'bg-emerald-500' : isCurrent ? 'bg-sky-500' : 'bg-slate-800'
                }`}
              />
            </span>
            {/* Content Details */}
            <div className="space-y-1">
              <div className="flex items-center justify-between gap-4 flex-wrap">
                <h4 className={`text-xs font-semibold ${isCurrent ? 'text-sky-400' : 'text-slate-200'}`}>
                  {item.title}
                </h4>
                <span className="text-[10px] text-slate-500 uppercase tracking-wider">{item.timestamp}</span>
              </div>
              {item.description && <p className="text-slate-400 text-xs leading-relaxed">{item.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
