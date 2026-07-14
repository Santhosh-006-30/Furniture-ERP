import React from 'react';

interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  loading?: boolean;
}

export function PrimaryButton({ children, loading = false, className = '', disabled, ...props }: PrimaryButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={`neumorphic-button flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition-all duration-200 ${className}`}
      {...props}
    >
      {loading && <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}
