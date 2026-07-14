import React from 'react';

interface AppCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function AppCard({ children, hoverable = false, className = '', ...props }: AppCardProps) {
  return (
    <div
      className={`bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700/60 hover:bg-slate-900/60 hover:translate-y-[-1px]' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
