'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, LogIn } from 'lucide-react';

export default function SessionExpiredPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050811] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800/80 shadow-2xl relative text-center">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-rose-500/10 blur-3xl pointer-events-none" />

        {/* Warning Icon */}
        <div className="flex justify-center">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-450 shadow-inner mb-2 animate-pulse">
            <ShieldAlert className="h-7 w-7" />
          </div>
        </div>

        <div className="space-y-3">
          <h2 className="text-xl font-extrabold text-slate-100">
            System Key Expired
          </h2>
          <p className="text-xs text-slate-400 font-mono leading-relaxed">
            Your login authorization token signature has expired or is no longer verifiable. For system security reasons, this cockpit session has been terminated.
          </p>
        </div>

        <div className="pt-6 border-t border-slate-900">
          <Link
            href="/login"
            className="inline-flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 text-xs font-bold text-white shadow-lg shadow-sky-500/15 hover:from-sky-600 hover:to-indigo-600 transition-all"
          >
            <LogIn className="w-4 h-4" />
            <span>Re-authenticate Credentials</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
