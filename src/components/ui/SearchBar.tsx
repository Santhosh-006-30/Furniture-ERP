import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  onClear?: () => void;
  onSubmit?: (e: React.FormEvent) => void;
}

export function SearchBar({ value, onChange, placeholder = 'Search...', onClear, onSubmit }: SearchBarProps) {
  const handleFormSubmit = (e: React.FormEvent) => {
    if (onSubmit) {
      onSubmit(e);
    } else {
      e.preventDefault();
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="relative flex items-center w-full max-w-md">
      <div className="neumorphic-inset flex items-center w-full rounded-xl bg-slate-950/40 px-3 py-2 text-slate-300">
        <Search className="h-4 w-4 text-slate-500 shrink-0 mr-2" />
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full bg-transparent text-xs text-slate-200 outline-none placeholder-slate-500"
          aria-label={placeholder}
        />
        {value && (
          <button
            type="button"
            onClick={onClear}
            className="text-slate-500 hover:text-slate-300 ml-1 transition-colors"
            aria-label="Clear search query"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}

      </div>
    </form>
  );
}
