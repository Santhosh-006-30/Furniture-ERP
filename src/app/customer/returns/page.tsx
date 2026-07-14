'use client';

import React, { useEffect, useState } from 'react';
import api from '../../../lib/api-client';
import {
  RotateCcw, Plus, Loader2, AlertCircle, ChevronRight, BadgeCheck,
  Clock, XCircle, Package, CreditCard, Search
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface ReturnRequest {
  id: string;
  returnNumber: string;
  salesOrderId: string;
  reason: string;
  status: string;
  refundAmount?: number;
  requestedAt: string;
  salesOrder: { orderNumber: string };
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-amber-500/15 text-amber-400 border-amber-500/20',
  APPROVED: 'bg-sky-500/15 text-sky-400 border-sky-500/20',
  REJECTED: 'bg-red-500/15 text-red-400 border-red-500/20',
  PICKED_UP: 'bg-indigo-500/15 text-indigo-400 border-indigo-500/20',
  REFUNDED: 'bg-green-500/15 text-green-400 border-green-500/20',
};

const STATUS_ICONS: Record<string, React.ReactNode> = {
  REQUESTED: <Clock className="w-3.5 h-3.5" />,
  APPROVED: <BadgeCheck className="w-3.5 h-3.5" />,
  REJECTED: <XCircle className="w-3.5 h-3.5" />,
  PICKED_UP: <Package className="w-3.5 h-3.5" />,
  REFUNDED: <CreditCard className="w-3.5 h-3.5" />,
};

const RETURN_REASONS = [
  'Defective/Damaged product',
  'Wrong product delivered',
  'Product not as described',
  'Quality not satisfactory',
  'Changed my mind',
  'Missing parts/accessories',
  'Other',
];

import { formatCurrency } from '../../../lib/format';

const fmt = formatCurrency;


export default function CustomerReturnsPage() {
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [deliveredOrders, setDeliveredOrders] = useState<{ id: string; orderNumber: string }[]>([]);
  const [form, setForm] = useState({ salesOrderId: '', reason: '', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [searchQ, setSearchQ] = useState('');

  useEffect(() => {
    const u = localStorage.getItem('customer_portal_user');
    if (!u) { router.push('/customer/login'); return; }
    load();
  }, [router]);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get('/customer/returns');
      setReturns(data.returns || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load returns');
    } finally {
      setLoading(false);
    }
  };

  const openForm = async () => {
    setFormError('');
    setForm({ salesOrderId: '', reason: '', description: '' });
    // Load delivered orders
    try {
      const data = await api.get('/customer/orders?status=FULLY_DELIVERED&pageSize=100');
      const all = data.orders || [];
      setDeliveredOrders(all.map((o: any) => ({ id: o.id, orderNumber: o.orderNumber })));
    } catch { /* ignore */ }
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!form.salesOrderId) { setFormError('Please select an order'); return; }
    if (!form.reason) { setFormError('Please select a reason'); return; }
    setSubmitting(true);
    try {
      await api.post('/customer/returns', form);
      setSuccessMsg('Return request submitted successfully.');
      setShowForm(false);
      load();
    } catch (e: any) {
      setFormError(e.message || 'Failed to submit');
    } finally {
      setSubmitting(false);
    }
  };

  const filtered = returns.filter((r) =>
    !searchQ || r.returnNumber.toLowerCase().includes(searchQ.toLowerCase()) ||
    r.salesOrder.orderNumber.toLowerCase().includes(searchQ.toLowerCase())
  );

  const TIMELINE = ['REQUESTED', 'APPROVED', 'PICKED_UP', 'REFUNDED'];

  return (
    <div className="min-h-screen bg-[#0c0e14] p-4 md:p-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20">
              <RotateCcw className="w-5 h-5 text-orange-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Returns & Refunds</h1>
              <p className="text-xs text-slate-400">Track and manage your return requests</p>
            </div>
          </div>
          <button
            onClick={openForm}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> Request Return
          </button>
        </div>

        {successMsg && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
            <BadgeCheck className="w-4 h-4 shrink-0" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" /> {error}
          </div>
        )}

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
            placeholder="Search by return or order number…"
            className="w-full bg-slate-900 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl">
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <h2 className="text-base font-semibold text-white">Request a Return</h2>
                <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                {formError && (
                  <div className="text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Select Delivered Order *</label>
                  <select
                    value={form.salesOrderId}
                    onChange={(e) => setForm({ ...form, salesOrderId: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">-- Select Order --</option>
                    {deliveredOrders.map((o) => (
                      <option key={o.id} value={o.id}>{o.orderNumber}</option>
                    ))}
                  </select>
                  {deliveredOrders.length === 0 && (
                    <p className="text-xs text-slate-500 mt-1">No delivered orders eligible for return.</p>
                  )}
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Return Reason *</label>
                  <select
                    value={form.reason}
                    onChange={(e) => setForm({ ...form, reason: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500"
                    required
                  >
                    <option value="">-- Select Reason --</option>
                    {RETURN_REASONS.map((r) => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Additional Details (Optional)</label>
                  <textarea
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={3}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-orange-500"
                    placeholder="Describe the issue in more detail..."
                  />
                </div>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2.5 rounded-lg bg-slate-700 hover:bg-slate-600 text-white text-sm transition-colors">Cancel</button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 py-2.5 rounded-lg bg-orange-600 hover:bg-orange-500 text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Returns list */}
        {loading ? (
          <div className="flex items-center justify-center py-20 text-slate-400">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading returns…
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
            <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="text-base font-medium text-slate-400">No return requests</p>
            <p className="text-sm">Returns can only be requested for delivered orders.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((r) => {
              const currentIdx = TIMELINE.indexOf(r.status);
              return (
                <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 hover:border-slate-700 transition-colors">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono text-white font-semibold">{r.returnNumber}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                        <span className="text-slate-400 text-sm">{r.salesOrder.orderNumber}</span>
                      </div>
                      <p className="text-sm text-slate-400">{r.reason}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[r.status] || 'bg-slate-700 text-slate-400'}`}>
                      {STATUS_ICONS[r.status]}
                      {r.status.replace('_', ' ')}
                    </div>
                  </div>
                  {/* Timeline */}
                  <div className="flex items-center gap-1 mt-3">
                    {TIMELINE.map((step, i) => {
                      const done = currentIdx >= i || r.status === 'REFUNDED';
                      const active = i === currentIdx;
                      return (
                        <React.Fragment key={step}>
                          <div className="flex flex-col items-center gap-1">
                            <div className={`w-2.5 h-2.5 rounded-full border-2 transition-colors ${done ? 'bg-orange-400 border-orange-400' : active ? 'bg-orange-400/40 border-orange-500' : 'bg-slate-700 border-slate-600'}`} />
                            <span className="text-[10px] text-slate-500 whitespace-nowrap">{step.replace('_', ' ')}</span>
                          </div>
                          {i < TIMELINE.length - 1 && (
                            <div className={`flex-1 h-0.5 mb-3.5 ${done && currentIdx > i ? 'bg-orange-400' : 'bg-slate-700'}`} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                  {r.refundAmount && (
                    <div className="mt-3 pt-3 border-t border-slate-800 flex items-center gap-2 text-sm text-green-400">
                      <CreditCard className="w-3.5 h-3.5" />
                      Refund: {fmt(r.refundAmount)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
