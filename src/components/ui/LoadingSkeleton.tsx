import React from 'react';

interface LoadingSkeletonProps {
  className?: string;
  variant?: 'text' | 'card' | 'table';
}

export function LoadingSkeleton({ className = '', variant = 'text' }: LoadingSkeletonProps) {
  const getStyles = () => {
    switch (variant) {
      case 'card':
        return 'h-32 w-full rounded-2xl bg-slate-800/40 border border-slate-800/60';
      case 'table':
        return 'h-40 w-full rounded-2xl bg-slate-800/40 border border-slate-800/60';
      default:
        return 'h-4 w-full rounded bg-slate-800/50';
    }
  };

  return (
    <div className={`animate-pulse ${getStyles()} ${className}`} />
  );
}
