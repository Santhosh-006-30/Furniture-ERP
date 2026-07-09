'use client';

import Link from 'next/link';
import { ShieldX, ArrowLeft, Home } from 'lucide-react';

export default function UnauthorizedPage() {
  return (
    <div className="min-h-screen bg-[#060913] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="text-[120px] font-black text-slate-900 leading-none select-none">401</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <ShieldX className="w-12 h-12 text-amber-400" />
            </div>
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Unauthorized</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            You are not authenticated. Please sign in to access this resource.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/login" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-sm font-semibold transition-colors">
            <ArrowLeft className="w-4 h-4" /> Sign In
          </Link>
          <Link href="/customer/login" className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors">
            <Home className="w-4 h-4" /> Customer Login
          </Link>
        </div>
      </div>
    </div>
  );
}
