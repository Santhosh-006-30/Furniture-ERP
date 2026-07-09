'use client';

import React, { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, Sparkles, Receipt } from 'lucide-react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();

  const orderId = searchParams.get('orderId') || '';
  const orderNumber = searchParams.get('orderNumber') || 'SO-XXXX';
  const paymentStatus = searchParams.get('paymentStatus') || 'PAID';
  const paymentId = searchParams.get('paymentId') || 'N/A';

  return (
    <div className="max-w-2xl mx-auto space-y-8 py-10 font-sans text-center">
      <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 relative overflow-hidden space-y-6">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />

        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
          <CheckCircle2 className="w-8 h-8 animate-bounce" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold text-slate-100">Payment Successful!</h1>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Thank you for your purchase. Your payment was verified successfully and your order has been placed.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left text-xs font-mono">
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Order Number</span>
            <span className="text-slate-200 font-bold text-sm">{orderNumber}</span>
          </div>
          <div>
            <span className="text-slate-500 block uppercase text-[10px]">Payment Status</span>
            <span className="text-emerald-400 font-bold text-sm">{paymentStatus}</span>
          </div>
          <div className="col-span-2 pt-2 border-t border-slate-900 mt-2">
            <span className="text-slate-500 block uppercase text-[10px]">Transaction / Payment ID</span>
            <span className="text-slate-350 font-semibold truncate block">{paymentId}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4 border-t border-slate-900/60">
          <Link
            href={`/customer/invoices/${orderId}`}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 text-white font-bold text-xs transition-colors shadow-lg shadow-sky-500/10 cursor-pointer"
          >
            <Receipt className="w-4 h-4" />
            <span>Invoice / Receipt</span>
          </Link>
          <Link
            href={`/customer/orders/${orderId}`}
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-colors cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            <span>View Order Progress</span>
          </Link>
          <Link
            href="/customer/products"
            className="inline-flex items-center justify-center gap-1.5 px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 font-bold text-xs transition-colors cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Continue Shopping</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="flex h-screen w-full items-center justify-center bg-[#060913] text-slate-400 font-mono text-xs">
        <span>Loading order success details...</span>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  );
}
