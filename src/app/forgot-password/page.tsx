'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ShieldCheck, Mail, Loader2, CheckCircle2 } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulating security email reset trigger
    setTimeout(() => {
      setLoading(false);
      setSubmitted(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#050811] px-4 py-12 sm:px-6 lg:px-8 font-sans">
      <div className="w-full max-w-md space-y-8 glass-panel p-8 sm:p-10 rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
        {/* Glow Effects */}
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-sky-500/10 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 -mb-12 -ml-12 w-48 h-48 rounded-full bg-indigo-500/10 blur-3xl pointer-events-none" />

        {/* Logo and Headings */}
        <div className="text-center">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-sky-500 to-indigo-500 shadow-lg shadow-sky-500/20 mb-4">
            <ShieldCheck className="h-6 w-6 text-white" />
          </div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
            Reset Password Key
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">
            Send credentials bypass recovery link
          </p>
        </div>

        {submitted ? (
          <div className="space-y-6 text-center">
            <div className="flex justify-center">
              <CheckCircle2 className="h-12 w-12 text-emerald-450 animate-bounce" />
            </div>
            <div className="space-y-2">
              <h3 className="text-sm font-bold text-slate-100">Recovery Instructions Dispatched</h3>
              <p className="text-xs text-slate-400 font-mono">
                An authorization token link has been compiled and sent to {email}. Follow instructions to reset your password.
              </p>
            </div>
            <div className="pt-4 border-t border-slate-900">
              <Link
                href="/login"
                className="text-xs font-bold text-sky-400 hover:text-sky-350 transition-colors uppercase tracking-wider font-mono"
              >
                Back to Sign In Terminal
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Registered Operator Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="admin@shivfurniture.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-sky-500/15 hover:from-sky-600 hover:to-indigo-600 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-white" />
                ) : (
                  'Transmit Recovery Signal'
                )}
              </button>
            </div>

            <div className="text-center pt-4 border-t border-slate-900">
              <Link
                href="/login"
                className="text-xxs font-bold text-slate-500 hover:text-slate-450 transition-colors uppercase tracking-wider font-mono"
              >
                Remember credentials? Sign In
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
