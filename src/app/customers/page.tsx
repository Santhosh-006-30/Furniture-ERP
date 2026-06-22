'use client';

import React, { useEffect, useState } from 'react';
import api from '../../lib/api-client';
import { useStore } from '../../lib/store';
import {
  Users,
  Plus,
  Search,
  Info,
  Loader2,
  UserCheck,
  UserX,
  Mail,
  Phone,
  MapPin,
  Hash,
} from 'lucide-react';

export default function CustomersPage() {
  const { user } = useStore();
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form fields
  const [customerCode, setCustomerCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isActive, setIsActive] = useState(true);

  const canManage = user?.role === 'ADMIN' || user?.role === 'OWNER' || user?.role === 'SALES';

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await api.get('/customers');
      setCustomers(data || []);
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomers();
  }, []);

  const resetForm = () => {
    setCustomerCode('');
    setName('');
    setEmail('');
    setPhone('');
    setAddress('');
    setIsActive(true);
  };

  const handleSelectCustomer = (c: any) => {
    setSelectedCustomer(c);
    setIsCreating(false);
    setCustomerCode(c.customerCode);
    setName(c.name);
    setEmail(c.email);
    setPhone(c.phone || '');
    setAddress(c.address || '');
    setIsActive(c.isActive);
  };

  const handleStartCreate = () => {
    setSelectedCustomer(null);
    setIsCreating(true);
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const payload = { customerCode, name, email, phone, address, isActive };
      if (isCreating) {
        await api.post('/customers', payload);
        alert('Customer registered successfully!');
      } else {
        await api.patch(`/customers/${selectedCustomer.id}`, payload);
        alert('Customer details updated successfully!');
      }
      setIsCreating(false);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      alert(`Failed to save customer: ${err.message || err}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async () => {
    if (!selectedCustomer) return;
    const action = selectedCustomer.isActive ? 'deactivate' : 'reactivate';
    if (!confirm(`Are you sure you want to ${action} customer "${selectedCustomer.name}"?`)) return;
    try {
      setSaving(true);
      await api.patch(`/customers/${selectedCustomer.id}`, { isActive: !selectedCustomer.isActive });
      alert(`Customer ${action}d successfully!`);
      setSelectedCustomer(null);
      fetchCustomers();
    } catch (err: any) {
      alert(`Failed to ${action} customer: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.customerCode.toLowerCase().includes(search.toLowerCase()) ||
    (c.email || '').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-96 w-full items-center justify-center text-slate-400 font-mono text-sm">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-sky-400 animate-spin" />
          <span>Loading customer registry...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Customer Registry
          </h1>
          <p className="text-slate-400 mt-1 text-sm">
            Manage buyer accounts, contact information, and order history linkages.
          </p>
        </div>
        {canManage && (
          <button
            onClick={handleStartCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-sky-500 hover:bg-sky-600 text-white rounded-xl text-xs font-bold transition-all duration-200 cursor-pointer shadow-lg shadow-sky-500/15"
          >
            <Plus className="w-4 h-4" />
            <span>Register Customer</span>
          </button>
        )}
      </div>

      {/* Split Master-Detail Layout */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Left: Customer Table */}
        <div className="flex-1 space-y-4 min-w-0">
          <div className="flex gap-4 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-500" />
              <input
                type="text"
                placeholder="Search by name, code, or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full glass-input pl-10 pr-4 py-3 rounded-xl text-xs"
              />
            </div>
          </div>

          <div className="glass-panel rounded-2xl overflow-hidden border border-slate-800/80">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-slate-900/60 border-b border-slate-850 text-slate-400 uppercase tracking-widest font-mono">
                    <th className="p-4 font-bold">Code</th>
                    <th className="p-4 font-bold">Customer Name</th>
                    <th className="p-4 font-bold">Email</th>
                    <th className="p-4 font-bold">Phone</th>
                    <th className="p-4 font-bold text-center">Status</th>
                    <th className="p-4 font-bold text-center">Orders</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850">
                  {filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-slate-500 font-mono text-xs">
                        No customers found. Register your first customer using the button above.
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map((c) => {
                      const isSelected = selectedCustomer?.id === c.id;
                      return (
                        <tr
                          key={c.id}
                          onClick={() => handleSelectCustomer(c)}
                          className={`cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-500/10 hover:bg-sky-500/15 text-sky-300 border-l-4 border-sky-400'
                              : 'hover:bg-slate-900/30'
                          }`}
                        >
                          <td className="p-4 font-mono font-bold text-slate-300">{c.customerCode}</td>
                          <td className="p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-sky-600 to-indigo-600 flex items-center justify-center text-[10px] font-bold text-white">
                                {c.name.slice(0, 2).toUpperCase()}
                              </div>
                              <span className="font-semibold text-slate-200">{c.name}</span>
                            </div>
                          </td>
                          <td className="p-4 text-slate-400 font-mono text-[11px]">{c.email}</td>
                          <td className="p-4 text-slate-400 font-mono text-[11px]">{c.phone || '—'}</td>
                          <td className="p-4 text-center">
                            <span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-bold font-mono tracking-wider border ${
                              c.isActive
                                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                                : 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                            }`}>
                              {c.isActive ? 'ACTIVE' : 'INACTIVE'}
                            </span>
                          </td>
                          <td className="p-4 text-center font-mono font-semibold text-slate-400">
                            {c.salesOrders?.length ?? 0}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Customer Detail / Create Form */}
        <div className="w-full lg:w-[400px] shrink-0">
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 sticky top-6">
            {selectedCustomer || isCreating ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <h3 className="text-sm font-bold text-slate-100 border-b border-slate-800 pb-3 flex justify-between items-center">
                  <span className="flex items-center gap-1.5 text-sky-400">
                    <Users className="w-4 h-4" />
                    {isCreating ? 'Register New Customer' : 'Customer Details'}
                  </span>
                  {!isCreating && (
                    <span className="text-xxs text-slate-500 font-mono">
                      ID: {selectedCustomer.id.slice(0, 8)}
                    </span>
                  )}
                </h3>

                {/* Customer Code */}
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                    <Hash className="w-3 h-3" /> Customer Code
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="CUST-001"
                    value={customerCode}
                    onChange={(e) => setCustomerCode(e.target.value.toUpperCase())}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">
                    Full Name / Company
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="ABC Interiors Pvt. Ltd."
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs"
                  />
                </div>

                {/* Email */}
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                    <Mail className="w-3 h-3" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="buyer@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Phone */}
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                    <Phone className="w-3 h-3" /> Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="+91 9999988888"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs font-mono"
                  />
                </div>

                {/* Address */}
                <div className="space-y-1.5">
                  <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Address
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Shop 12, Connaught Place, New Delhi"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className="w-full glass-input px-3 py-2 rounded-lg text-xs resize-none"
                  />
                </div>

                {/* Active Status — only show in edit mode */}
                {!isCreating && (
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                    <label className="text-xxs text-slate-400 font-bold uppercase tracking-wider font-mono">
                      Account Status
                    </label>
                    <button
                      type="button"
                      onClick={handleDeactivate}
                      disabled={saving}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                        selectedCustomer?.isActive
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                          : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                      }`}
                    >
                      {selectedCustomer?.isActive ? (
                        <>
                          <UserX className="w-3 h-3" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="w-3 h-3" />
                          Reactivate
                        </>
                      )}
                    </button>
                  </div>
                )}

                {/* Order history (view only) */}
                {!isCreating && selectedCustomer?.salesOrders?.length > 0 && (
                  <div className="pt-2 border-t border-slate-800 space-y-1.5">
                    <span className="text-xxs text-slate-500 font-bold uppercase tracking-wider font-mono block">
                      Recent Orders ({selectedCustomer.salesOrders.length})
                    </span>
                    <div className="max-h-28 overflow-y-auto space-y-1">
                      {selectedCustomer.salesOrders.slice(0, 5).map((so: any) => (
                        <div key={so.id} className="flex justify-between items-center px-2 py-1 bg-slate-900/60 rounded-lg text-[10px] font-mono">
                          <span className="text-slate-300 font-bold">{so.orderNumber}</span>
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${
                            so.status === 'FULLY_DELIVERED'
                              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                              : so.status === 'CONFIRMED'
                              ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                              : 'bg-slate-800 border-slate-700 text-slate-400'
                          }`}>
                            {so.status}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 justify-end pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreating(false);
                      setSelectedCustomer(null);
                    }}
                    className="px-4 py-2 bg-slate-850 hover:bg-slate-800 text-slate-400 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </button>
                  {canManage && (
                    <button
                      type="submit"
                      disabled={saving}
                      className="px-4 py-2 bg-sky-500 hover:bg-sky-600 text-white rounded-lg text-xs font-bold cursor-pointer shadow-lg shadow-sky-500/10 disabled:opacity-60"
                    >
                      {saving ? 'Saving...' : isCreating ? 'Register' : 'Update'}
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3 font-mono">
                <Users className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-[10px]">
                  Select a customer from the registry table to view or edit their details.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
