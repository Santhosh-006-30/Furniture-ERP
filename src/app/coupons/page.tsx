'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import {
  Tag, Plus, Pencil, Trash2, Loader2, X, CheckCircle2, AlertCircle, ToggleLeft, ToggleRight, RefreshCw
} from 'lucide-react';

interface Coupon {
  id: string;
  code: string;
  description?: string;
  discountType: 'PERCENT' | 'FIXED';
  discountValue: number;
  minimumOrder: number;
  maximumDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  expiryDate?: string;
  isActive: boolean;
  createdAt: string;
}

import { formatCurrency, formatDate } from '../../lib/format';

const fmt = formatCurrency;
const fmtDate = (d?: string) => d ? formatDate(d) : '—';


const emptyForm = {
  code: '', description: '', discountType: 'PERCENT', discountValue: '', minimumOrder: '',
  maximumDiscount: '', usageLimit: '', expiryDate: '', isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState<any>(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const load = async () => {
    try {
      setLoading(true);
      const data = await api.get('/coupons');
      setCoupons(data);
    } catch (e: any) {
      setError(e.message || 'Failed to load coupons');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => { setEditId(null); setForm(emptyForm); setError(''); setSuccess(''); setShowForm(true); };
  const openEdit = (c: Coupon) => {
    setEditId(c.id);
    setForm({
      code: c.code,
      description: c.description || '',
      discountType: c.discountType,
      discountValue: c.discountValue,
      minimumOrder: c.minimumOrder,
      maximumDiscount: c.maximumDiscount || '',
      usageLimit: c.usageLimit || '',
      expiryDate: c.expiryDate ? c.expiryDate.split('T')[0] : '',
      isActive: c.isActive,
    });
    setError('');
    setSuccess('');
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      const payload = {
        ...form,
        discountValue: Number(form.discountValue),
        minimumOrder: Number(form.minimumOrder || 0),
        maximumDiscount: form.maximumDiscount ? Number(form.maximumDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiryDate: form.expiryDate || null,
      };
      if (editId) {
        await api.put(`/coupons/${editId}`, payload);
        setSuccess('Coupon updated successfully.');
      } else {
        await api.post('/coupons', payload);
        setSuccess('Coupon created successfully.');
      }
      setShowForm(false);
      setEditId(null);
      load();
    } catch (e: any) {
      setError(e.message || 'Failed to save coupon');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/coupons/${id}`);
      setCoupons((prev) => prev.filter((c) => c.id !== id));
      setDeleteId(null);
      setSuccess('Coupon deleted.');
    } catch (e: any) {
      setError(e.message || 'Failed to delete');
    }
  };

  const isExpired = (d?: string) => d ? new Date(d) < new Date() : false;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/10 border border-purple-500/20">
            <Tag className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Coupon Management</h1>
            <p className="text-xs text-slate-400">{coupons.length} coupon{coupons.length !== 1 ? 's' : ''} configured</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium transition-colors"
          >
            <Plus className="w-4 h-4" /> New Coupon
          </button>
        </div>
      </div>

      {success && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/20 text-green-400 text-sm">
          <CheckCircle2 className="w-4 h-4 shrink-0" />{success}
        </div>
      )}
      {error && !showForm && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle className="w-4 h-4 shrink-0" />{error}
        </div>
      )}

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-xl shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-slate-700">
              <h2 className="text-base font-semibold text-white">{editId ? 'Edit Coupon' : 'Create New Coupon'}</h2>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {error && (
                <div className="flex items-center gap-2 text-red-400 text-sm p-3 bg-red-500/10 rounded-lg border border-red-500/20">
                  <AlertCircle className="w-4 h-4 shrink-0" />{error}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Coupon Code *</label>
                  <input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    disabled={!!editId}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500 disabled:opacity-50 uppercase"
                    placeholder="SAVE10"
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Discount Type *</label>
                  <select
                    value={form.discountType}
                    onChange={(e) => setForm({ ...form, discountType: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs text-slate-400 mb-1 block">Description</label>
                <input
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="10% off on all products"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">
                    Discount Value * ({form.discountType === 'PERCENT' ? '%' : '₹'})
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.discountValue}
                    onChange={(e) => setForm({ ...form, discountValue: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder={form.discountType === 'PERCENT' ? '10' : '500'}
                    required
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Minimum Order (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.minimumOrder}
                    onChange={(e) => setForm({ ...form, minimumOrder: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="1000"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Maximum Discount (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={form.maximumDiscount}
                    onChange={(e) => setForm({ ...form, maximumDiscount: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="5000"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Usage Limit</label>
                  <input
                    type="number"
                    min="1"
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 items-end">
                <div>
                  <label className="text-xs text-slate-400 mb-1 block">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiryDate}
                    onChange={(e) => setForm({ ...form, expiryDate: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  />
                </div>
                <div className="flex items-center gap-3 pb-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, isActive: !form.isActive })}
                    className={`transition-colors ${form.isActive ? 'text-green-400' : 'text-slate-500'}`}
                  >
                    {form.isActive ? <ToggleRight className="w-8 h-8" /> : <ToggleLeft className="w-8 h-8" />}
                  </button>
                  <span className="text-sm text-slate-300">{form.isActive ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-2 rounded-lg bg-slate-700 hover:bg-slate-600 text-sm text-white transition-colors">
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex-1 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm text-white font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editId ? 'Update Coupon' : 'Create Coupon'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-red-500/30 rounded-2xl w-full max-w-sm p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6 text-red-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold mb-1">Delete Coupon?</h3>
              <p className="text-slate-400 text-sm">This action cannot be undone.</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2 rounded-lg bg-slate-700 text-white text-sm hover:bg-slate-600 transition-colors">Cancel</button>
              <button onClick={() => handleDelete(deleteId)} className="flex-1 py-2 rounded-lg bg-red-600 text-white text-sm hover:bg-red-500 transition-colors">Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      {loading ? (
        <div className="flex items-center justify-center py-20 text-slate-400">
          <Loader2 className="w-6 h-6 animate-spin mr-3" /> Loading coupons…
        </div>
      ) : coupons.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <Tag className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-base font-medium">No coupons yet</p>
          <p className="text-sm">Click &quot;New Coupon&quot; to create your first discount code.</p>
        </div>
      ) : (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-800/60 text-slate-400 text-xs uppercase tracking-wider">
                <th className="px-4 py-3 text-left">Code</th>
                <th className="px-4 py-3 text-left">Type</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Min Order</th>
                <th className="px-4 py-3 text-left">Usage</th>
                <th className="px-4 py-3 text-left">Expiry</th>
                <th className="px-4 py-3 text-left">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {coupons.map((c) => {
                const expired = isExpired(c.expiryDate);
                return (
                  <tr key={c.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-3">
                      <div>
                        <span className="font-mono font-bold text-purple-300">{c.code}</span>
                        {c.description && <p className="text-xs text-slate-500 mt-0.5">{c.description}</p>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-slate-300">{c.discountType === 'PERCENT' ? 'Percentage' : 'Fixed'}</td>
                    <td className="px-4 py-3 text-white font-medium">
                      {c.discountType === 'PERCENT' ? `${c.discountValue}%` : fmt(c.discountValue)}
                      {c.maximumDiscount && <span className="text-xs text-slate-500 ml-1">(max {fmt(c.maximumDiscount)})</span>}
                    </td>
                    <td className="px-4 py-3 text-slate-300">{c.minimumOrder > 0 ? fmt(c.minimumOrder) : '—'}</td>
                    <td className="px-4 py-3 text-slate-300">
                      {c.usageCount}/{c.usageLimit ?? '∞'}
                    </td>
                    <td className="px-4 py-3">
                      <span className={expired ? 'text-red-400' : 'text-slate-300'}>
                        {fmtDate(c.expiryDate)}
                        {expired && <span className="ml-1 text-xs bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded">Expired</span>}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${c.isActive && !expired ? 'bg-green-500/15 text-green-400' : 'bg-slate-700 text-slate-500'}`}>
                        {c.isActive && !expired ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setDeleteId(c.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
