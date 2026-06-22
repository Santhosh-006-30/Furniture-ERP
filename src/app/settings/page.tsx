'use client';

import React, { useState } from 'react';
import { useStore } from '../../lib/store';
import {
  Settings,
  ShieldAlert,
  Save,
  CheckCircle,
  Database,
  Building,
  Key
} from 'lucide-react';

export default function SettingsPage() {
  const { user } = useStore();
  const [success, setSuccess] = useState(false);

  // Form State
  const [currency, setCurrency] = useState('USD ($)');
  const [taxRate, setTaxRate] = useState('18%');
  const [minBuffer, setMinBuffer] = useState('15%');
  const [autoProcure, setAutoProcure] = useState(true);
  const [doubleCheckBoM, setDoubleCheckBoM] = useState(true);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="glass-panel p-8 rounded-2xl border border-rose-500/20 text-center max-w-xl mx-auto mt-12">
        <ShieldAlert className="w-12 h-12 text-rose-400 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-200">System Lockout</h3>
        <p className="text-xs text-slate-400 mt-2 font-mono">
          Security policy: Global ERP system settings are restricted to administrative commanders (ADMIN role) only.
        </p>
      </div>
    );
  }

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Global Settings
        </h1>
        <p className="text-slate-400 mt-1 text-sm">
          Calibrate stock thresholds, operational buffers, and automated workflow triggers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <form onSubmit={handleSave} className="lg:col-span-2 space-y-6">
          {/* General Configuration */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Building className="w-4 h-4 text-sky-400" />
              <span>General ERP Defaults</span>
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider">System Currency</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs bg-slate-950"
                >
                  <option value="USD ($)">USD ($)</option>
                  <option value="INR (₹)">INR (₹)</option>
                  <option value="EUR (€)">EUR (€)</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Default Tax Rate (VAT)</label>
                <input
                  type="text"
                  value={taxRate}
                  onChange={(e) => setTaxRate(e.target.value)}
                  className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                />
              </div>
            </div>
          </div>

          {/* Logistics Configuration */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2 border-b border-slate-800 pb-3">
              <Database className="w-4 h-4 text-indigo-400" />
              <span>Inventory & Procurement Constraints</span>
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider">Minimum Buffer Stock Coefficient</label>
                  <input
                    type="text"
                    value={minBuffer}
                    onChange={(e) => setMinBuffer(e.target.value)}
                    className="w-full glass-input px-4 py-2.5 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoProcure}
                    onChange={(e) => setAutoProcure(e.target.checked)}
                    className="w-4 h-4 accent-sky-400 bg-slate-900 border-slate-800 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-250">Automated MTS Replenishment</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Auto-generate Procurement Requests when stock falls below reorder level.
                    </span>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={doubleCheckBoM}
                    onChange={(e) => setDoubleCheckBoM(e.target.checked)}
                    className="w-4 h-4 accent-sky-400 bg-slate-900 border-slate-800 rounded"
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-250">BoM Verification Constraint</span>
                    <span className="text-[10px] text-slate-500 mt-0.5">
                      Force validation of raw materials stock check before releasing Manufacturing Orders.
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <div className="flex items-center justify-between">
            {success && (
              <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold font-mono">
                <CheckCircle className="w-4 h-4" />
                <span>Configuration changes updated.</span>
              </div>
            )}
            <button
              type="submit"
              className="ml-auto flex items-center gap-2 px-5 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 shadow-lg shadow-sky-500/15 cursor-pointer"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>

        {/* Sidebar Info */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-slate-400 flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400" />
              <span>System Metadata</span>
            </h3>
            <div className="space-y-2.5 text-xxs font-mono text-slate-500 leading-normal">
              <div>
                <span className="text-slate-400 font-bold block">Active Database Driver:</span>
                <span>SQLite (file-based dev.db)</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Prisma Client State:</span>
                <span className="text-emerald-400 font-bold">Synchronized (v5.10.2)</span>
              </div>
              <div>
                <span className="text-slate-400 font-bold block">Encryption Algorithm:</span>
                <span>bcryptjs (10 rounds salt)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
