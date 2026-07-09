'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { XCircle, RefreshCw, ShoppingCart } from 'lucide-react';

function PaymentFailedContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId') || '';

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 font-sans text-center">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-rose-500/25 bg-rose-500/5 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-rose-500/5 blur-3xl pointer-events-none" />

        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/10 text-rose-450">
          <XCircle className="w-8 h-8 animate-pulse" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-100 font-sans">Payment Failed</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            We couldn't process your transaction. This might be due to incorrect details, session timeout, or a connection issue.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-slate-900/60">
          <Link
            href="/customer/checkout"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-rose-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold text-xs transition-colors shadow-lg shadow-rose-500/10 cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Payment</span>
          </Link>
          <Link
            href="/customer/cart"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-350 font-bold text-xs transition-colors cursor-pointer"
          >
            <ShoppingCart className="w-4 h-4" />
            <span>Back to Cart</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#060913] text-slate-400 font-mono text-xs">
        <span>Loading details...</span>
      </div>
    }>
      <PaymentFailedContent />
    </Suspense>
  );
}
