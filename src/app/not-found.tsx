'use client';

import Link from 'next/link';
import { AlertCircle, ArrowLeft, RefreshCw } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#060913] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Animated 404 */}
        <div className="relative">
          <div className="text-[120px] font-black text-slate-900 leading-none select-none">404</div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="p-4 rounded-2xl bg-sky-500/10 border border-sky-500/20">
              <AlertCircle className="w-12 h-12 text-sky-400" />
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Page Not Found</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
            It may have been deleted or the URL may be incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            ERP Dashboard
          </Link>
          <Link
            href="/customer/dashboard"
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold transition-colors"
          >
            Customer Portal
          </Link>
        </div>
      </div>
    </div>
  );
}
