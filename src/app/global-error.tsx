'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft } from 'lucide-react';

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorProps) {
  useEffect(() => {
    // Log the error to the console (and optionally an error service)
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body className="bg-[#060913] text-slate-100 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-8">
          <div className="relative">
            <div className="text-[120px] font-black text-slate-900 leading-none select-none">500</div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
                <AlertTriangle className="w-12 h-12 text-red-400" />
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-2xl font-bold text-white">Something went wrong</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              An unexpected server error occurred. Our team has been notified.
              Please try again or contact support if the issue persists.
            </p>
            {error.digest && (
              <p className="text-slate-600 text-xs font-mono">Error ID: {error.digest}</p>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={reset}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white text-sm font-semibold transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <a
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              Go Home
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
