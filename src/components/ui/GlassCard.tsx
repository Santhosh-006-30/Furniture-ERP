import React from 'react';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hoverable?: boolean;
}

export function GlassCard({ children, hoverable = true, className = '', ...props }: GlassCardProps) {
  return (
    <div
      className={`glass-card rounded-2xl p-5 ${
        hoverable ? 'glass-card-hover' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
