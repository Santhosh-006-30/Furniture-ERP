'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, User, Lock, Mail, Phone, MapPin, Building, FileText, Loader2, AlertCircle } from 'lucide-react';
import api from '../../../lib/api-client';

export default function CustomerRegisterPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await api.post('/customer/auth/register', {
        name,
        email,
        password,
        phone,
        address,
        companyName,
        gstNumber,
      });
      setSuccess(true);
      setTimeout(() => {
        router.push('/customer/login');
      }, 2500);
    } catch (err: any) {
      setError(err.message || 'Registration failed. Customer email may already be in use.');
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
            Register Buyer Profile
          </h2>
          <p className="mt-2 text-xs font-semibold text-slate-400 font-mono uppercase tracking-widest">
            Create new customer portal account
          </p>
        </div>

        {/* Success Alert */}
        {success && (
          <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-450 text-xs font-bold text-center">
            Registration success! Awaiting admin approval. Redirecting to login...
          </div>
        )}

        {/* Error Callout */}
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
            <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div className="space-y-3.5 max-h-[420px] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  required
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  placeholder="john.doe@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Phone Number
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="tel"
                  placeholder="+91 9999988888"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Delivery Address
              </label>
              <div className="relative">
                <MapPin className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="123 Street Name, City, State"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Company Name (Optional)
              </label>
              <div className="relative">
                <Building className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="Acme Corporation"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                GST Number (Optional)
              </label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  placeholder="07AAAAA1111A1Z1"
                  value={gstNumber}
                  onChange={(e) => setGstNumber(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xxs font-bold text-slate-400 uppercase tracking-wider font-mono">
                Password Key
              </label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full glass-input pl-11 pr-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading || success}
              className="group relative flex w-full justify-center rounded-xl bg-gradient-to-r from-sky-500 to-indigo-500 py-3 px-4 text-xs font-bold text-white shadow-lg shadow-sky-500/15 hover:from-sky-600 hover:to-indigo-600 focus:outline-none transition-all cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin text-white" />
              ) : (
                'Register Profile'
              )}
            </button>
          </div>
        </form>

        <div className="text-center pt-4 border-t border-slate-900">
          <span className="text-xxs text-slate-500 uppercase tracking-wider font-mono">
            Already have a login key?{' '}
            <Link
              href="/customer/login"
              className="text-sky-400 hover:text-sky-350 font-bold font-sans tracking-normal transition-colors"
            >
              Portal Sign In
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
