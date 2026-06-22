'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../../lib/store';
import api from '../../lib/api-client';
import { ShieldCheck, Lock, Mail, Loader2, AlertCircle } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      
      // Store in Zustand state
      setAuth(response.user, response.token);
      
      // Store in localStorage
      localStorage.setItem('mini_erp_user', JSON.stringify(response.user));
      localStorage.setItem('mini_erp_token', response.token);
      
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email credentials or password hash key.');
    } finally {
      setLoading(false);
    }
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
            Shiv Furniture Works
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">
            ERP Control Cockpit
          </p>
        </div>

        {/* Error Callout */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Email Address
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

            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                  Password Key
                </label>
                <Link
                  href="/forgot-password"
                  className="text-xxs font-bold text-sky-400 hover:text-sky-350 transition-colors uppercase tracking-wider font-mono"
                >
                  Forgot Key?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3.5 h-4.5 w-4.5 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-3 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-sky-500/15 hover:from-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-sky-500 focus:ring-offset-2 focus:ring-offset-[#050811] transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                'Secure System Access'
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-slate-900">
          <span className="text-xxs text-slate-500 uppercase tracking-wider font-mono">
            Need an operator profile?{' '}
            <Link
              href="/register"
              className="text-sky-400 hover:text-sky-350 font-bold font-sans tracking-normal transition-colors"
            >
              Register Commander
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
