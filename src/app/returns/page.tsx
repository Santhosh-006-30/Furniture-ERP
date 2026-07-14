'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  RotateCcw, Loader2, AlertCircle, ChevronDown, ChevronUp, Check,
  BadgeCheck, XCircle, Package, CreditCard, Clock, RefreshCw
} from 'lucide-react';

interface ReturnRequest {
  id: string;
  returnNumber: string;
  reason: string;
  description?: string;
  status: string;
  adminNote?: string;
  refundAmount?: number;
  refundNote?: string;
  requestedAt: string;
  approvedAt?: string;
  rejectedAt?: string;
  pickedUpAt?: string;
  refundedAt?: string;
  customer: { name: string; email: string; customerCode: string };
  salesOrder: { orderNumber: string; items: Array<{ quantity: number; unitPrice: number; product: { name: string } }> };
}

const STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-amber-500/15 text-amber-400',
  APPROVED: 'bg-sky-500/15 text-sky-400',
  REJECTED: 'bg-red-500/15 text-red-400',
  PICKED_UP: 'bg-indigo-500/15 text-indigo-400',
  REFUNDED: 'bg-green-500/15 text-green-400',
};

import { formatCurrency, formatDate } from '../../lib/format';

const fmt = formatCurrency;
const fmtDate = (d?: string) => d ? formatDate(d) : '—';


export default function ReturnsManagementPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [actionForms, setActionForms] = useState<Record<string, { adminNote: string; refundAmount: string; refundNote: string }>>({});

  const load = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({ pageSize: '100' });
      if (filter) params.set('status', filter);
      const data = await api.get(`/returns?${params}`);
      setReturns(data.returns || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [filter]);

  const getFormFor = (id: string) => actionForms[id] || { adminNote: '', refundAmount: '', refundNote: '' };
  const setFormFor = (id: string, patch: any) =>
    setActionForms((prev) => ({ ...prev, [id]: { ...getFormFor(id), ...patch } }));

  const updateStatus = async (id: string, status: string) => {
    const form = getFormFor(id);
    setActionLoading(id + status);
    try {
      await api.put(`/returns/${id}`, {
        status,
        adminNote: form.adminNote || undefined,
        refundAmount: form.refundAmount ? Number(form.refundAmount) : undefined,
        refundNote: form.refundNote || undefined,
      });
      load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setActionLoading(null);
    }
  };

  const NEXT_ACTIONS: Record<string, { label: string; status: string; color: string }[]> = {
    REQUESTED: [
      { label: 'Approve', status: 'APPROVED', color: 'bg-sky-600 hover:bg-sky-500' },
      { label: 'Reject', status: 'REJECTED', color: 'bg-red-600 hover:bg-red-500' },
    ],
    APPROVED: [{ label: 'Mark Picked Up', status: 'PICKED_UP', color: 'bg-indigo-600 hover:bg-indigo-500' }],
    PICKED_UP: [{ label: 'Mark Refunded', status: 'REFUNDED', color: 'bg-green-600 hover:bg-green-500' }],
    REJECTED: [],
    REFUNDED: [],
  };

  const statusCounts = returns.reduce((acc: Record<string, number>, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-red-500/10 border border-orange-500/20">
            <RotateCcw className="w-5 h-5 text-orange-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Returns Management</h1>
            <p className="text-xs text-slate-400">Review and process customer return requests</p>
          </div>
        </div>
        <button onClick={load} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Status filters */}
      <div className="flex flex-wrap gap-2">
        {[['', 'All'], ['REQUESTED', 'Requested'], ['APPROVED', 'Approved'], ['REJECTED', 'Rejected'], ['PICKED_UP', 'Picked Up'], ['REFUNDED', 'Refunded']].map(([val, label]) => (
          <button
            key={val}
            onClick={() => setFilter(val)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === val ? 'bg-orange-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
          >
            {label} {val && statusCounts[val] !== undefined ? `(${statusCounts[val]})` : !val ? `(${returns.length})` : ''}
          </button>
        ))}
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading returns…
        </div>
      ) : returns.length === 0 ? (
        <div className="text-center py-20 text-slate-500 bg-slate-900/50 border border-slate-800 rounded-2xl">
          <RotateCcw className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>No return requests found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {returns.map((r) => {
            const form = getFormFor(r.id);
            const isExpanded = expanded === r.id;
            const actions = NEXT_ACTIONS[r.status] || [];
            const orderValue = r.salesOrder.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

            return (
              <div key={r.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                <div
                  className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-slate-800/40 transition-colors"
                  onClick={() => setExpanded(isExpanded ? null : r.id)}
                >
                  <div className="flex items-center gap-4">
                    <div>
                      <span className="font-mono font-semibold text-white">{r.returnNumber}</span>
                      <span className="text-slate-500 text-sm ml-2">→ {r.salesOrder.orderNumber}</span>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${STATUS_COLORS[r.status] || 'bg-slate-700 text-slate-400'}`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-slate-400 hidden md:block">{r.customer.name}</span>
                    <span className="text-sm text-slate-500 hidden md:block">{new Date(r.requestedAt).toLocaleDateString('en-IN')}</span>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-5 pb-5 border-t border-slate-800 pt-4 space-y-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                      <div><p className="text-slate-500 text-xs mb-0.5">Customer</p><p className="text-white">{r.customer.name} ({r.customer.customerCode})</p></div>
                      <div><p className="text-slate-500 text-xs mb-0.5">Email</p><p className="text-white">{r.customer.email}</p></div>
                      <div><p className="text-slate-500 text-xs mb-0.5">Order Value</p><p className="text-white">{fmt(orderValue)}</p></div>
                      <div><p className="text-slate-500 text-xs mb-0.5">Reason</p><p className="text-white">{r.reason}</p></div>
                      {r.description && <div className="col-span-2"><p className="text-slate-500 text-xs mb-0.5">Description</p><p className="text-slate-300">{r.description}</p></div>}
                      {r.adminNote && <div className="col-span-2"><p className="text-slate-500 text-xs mb-0.5">Admin Note</p><p className="text-orange-300">{r.adminNote}</p></div>}
                      {r.refundAmount && <div><p className="text-slate-500 text-xs mb-0.5">Refund Amount</p><p className="text-green-400 font-semibold">{fmt(r.refundAmount)}</p></div>}
                    </div>

                    {/* Timeline */}
                    <div className="text-xs text-slate-500 grid grid-cols-2 md:grid-cols-4 gap-2">
                      {[
                        { label: 'Requested', date: r.requestedAt },
                        { label: 'Approved', date: r.approvedAt },
                        { label: 'Picked Up', date: r.pickedUpAt },
                        { label: 'Refunded', date: r.refundedAt },
                      ].map((t) => (
                        <div key={t.label} className={`p-2 rounded-lg border ${t.date ? 'border-slate-600 text-slate-300' : 'border-slate-800 text-slate-600'}`}>
                          <p className="font-medium mb-0.5">{t.label}</p>
                          <p>{t.date ? new Date(t.date).toLocaleDateString('en-IN') : '—'}</p>
                        </div>
                      ))}
                    </div>

                    {/* Order Items */}
                    <div className="bg-slate-800/40 rounded-lg p-3">
                      <p className="text-xs text-slate-400 mb-2 font-medium">Order Items</p>
                      <div className="space-y-1">
                        {r.salesOrder.items.map((item, i) => (
                          <div key={i} className="flex justify-between text-sm">
                            <span className="text-slate-300">{item.product.name} × {item.quantity}</span>
                            <span className="text-slate-400">{fmt(item.unitPrice * item.quantity)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Actions */}
                    {actions.length > 0 && (
                      <div className="space-y-3 pt-2 border-t border-slate-800">
                        <div>
                          <label className="text-xs text-slate-400 mb-1 block">Admin Note (Optional)</label>
                          <input
                            value={form.adminNote}
                            onChange={(e) => setFormFor(r.id, { adminNote: e.target.value })}
                            placeholder="Reason or internal note…"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                          />
                        </div>
                        {r.status === 'PICKED_UP' && (
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Refund Amount (₹)</label>
                              <input
                                type="number"
                                value={form.refundAmount}
                                onChange={(e) => setFormFor(r.id, { refundAmount: e.target.value })}
                                placeholder={`0 – ${orderValue}`}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-slate-400 mb-1 block">Refund Note</label>
                              <input
                                value={form.refundNote}
                                onChange={(e) => setFormFor(r.id, { refundNote: e.target.value })}
                                placeholder="e.g. Bank transfer processed"
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500"
                              />
                            </div>
                          </div>
                        )}
                        <div className="flex gap-3">
                          {actions.map((action) => (
                            <button
                              key={action.status}
                              onClick={() => updateStatus(r.id, action.status)}
                              disabled={!!actionLoading}
                              className={`flex-1 py-2 rounded-lg text-white text-sm font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2 ${action.color}`}
                            >
                              {actionLoading === r.id + action.status && <Loader2 className="w-4 h-4 animate-spin" />}
                              {action.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
