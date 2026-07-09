'use client';

import { Wrench, Clock } from 'lucide-react';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-[#060913] flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="flex justify-center">
          <div className="p-6 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 animate-pulse">
            <Wrench className="w-16 h-16 text-indigo-400" />
          </div>
        </div>
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-white">Under Maintenance</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            Shiv Furniture Works ERP is currently undergoing scheduled maintenance.
            We&apos;ll be back shortly. Thank you for your patience.
          </p>
        </div>
        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
          <Clock className="w-4 h-4" />
          <span>Expected downtime: Less than 30 minutes</span>
        </div>
      </div>
    </div>
  );
}
