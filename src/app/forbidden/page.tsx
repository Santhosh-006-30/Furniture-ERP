'use client';

import Link from 'next/link';
import { Lock, ArrowLeft } from 'lucide-react';

export default function ForbiddenPage() {
  return (
    <div className="min-h-screen bg-[#060913] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="text-[120px] font-black text-slate-900 leading-none select-none">403</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20">
              <Lock className="w-12 h-12 text-red-400" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Access Forbidden</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You don&apos;t have permission to access this page. Contact your administrator if you believe this is an error.
          </p>
        </div>
        <Link href="/dashboard" className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
