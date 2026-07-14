import React from 'react';

interface GlassInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function GlassInput({ label, error, icon, className = '', id, ...props }: GlassInputProps) {
  return (
    <div className="flex flex-col gap-1.5 w-full">
      {label && (
        <label htmlFor={id} className="text-slate-400 text-xs font-semibold">
          {label}
        </label>
      )}
      <div className={`neumorphic-inset flex items-center rounded-xl bg-slate-950/40 px-3 py-2 ${error ? 'border-rose-500/50' : ''}`}>
        {icon && <div className="text-slate-500 shrink-0 mr-2">{icon}</div>}
        <input
          id={id}
          className={`w-full bg-transparent text-xs text-slate-200 outline-none placeholder-slate-500 ${className}`}
          {...props}
        />
      </div>
      {error && <span className="text-rose-400 text-[10px]">{error}</span>}
    </div>
  );
}
