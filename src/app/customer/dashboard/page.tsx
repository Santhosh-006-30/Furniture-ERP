'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { LayoutDashboard, ShoppingBag, Loader2, ClipboardList, Clock, Truck, Bell, AlertCircle, FileText } from 'lucide-react';
import api from '../../../lib/api-client';

interface RecentOrder {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  itemsCount: number;
  grandTotal: number;
}

interface Notification {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  isRead: boolean;
}

interface DashboardData {
  totalOrders: number;
  draftOrders: number;
  pendingOrders: number;
  deliveredOrders: number;
  recentOrders: RecentOrder[];
  notifications: Notification[];
}

export default function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('Valued Customer');

  useEffect(() => {
    // Get customer display name
    const storedUser = localStorage.getItem('customer_portal_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCustomerName(user.name);
      } catch (e) {}
    }

    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await api.get('/customer/dashboard');
      setData(response);
    } catch (err: any) {
      setError(err.message || 'Failed to sync workspace dashboard stats.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
        <span>Loading customer metrics dashboard...</span>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800/80 text-rose-400 text-xs">
        <span>{error || 'Error loading dashboard.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans">
      {/* Welcome Card */}
      <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 relative overflow-hidden bg-gradient-to-r from-[#0d1527] to-[#080d1a]">
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 rounded-full bg-sky-500/10 blur-2xl pointer-events-none" />
        <h1 className="text-2xl sm:text-3xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Welcome back, {customerName}
        </h1>
        <p className="text-slate-400 mt-2 text-xs sm:text-sm max-w-2xl">
          Shiv Furniture Works Buyer Workspace. Manage, browse, and track your purchase orders and invoice summaries in real-time.
        </p>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { name: 'Total Orders', value: data.totalOrders, description: 'Lifetime order count', icon: ClipboardList },
          { name: 'Draft Orders', value: data.draftOrders, description: 'Awaiting confirmation', icon: Clock },
          { name: 'Pending Orders', value: data.pendingOrders, description: 'Manufacturing & Transit', icon: Truck },
          { name: 'Delivered', value: data.deliveredOrders, description: 'Completed shipments', icon: CheckCircleIcon }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">
                  {card.name}
                </span>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-200">
                  {card.value}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-2 pt-2 border-t border-slate-900/60">
                {card.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Tables/Notification Section Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-slate-200 tracking-wide font-mono uppercase">
              Recent Orders
            </h3>
            <Link
              href="/customer/products"
              className="text-[10px] font-bold text-sky-400 hover:text-sky-350 transition-colors uppercase font-mono tracking-wider"
            >
              Order Furniture +
            </Link>
          </div>

          {data.recentOrders.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono">
              <span>No orders placed yet.</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-900 text-slate-400 font-bold uppercase tracking-wider text-[10px] font-mono">
                    <th className="py-2.5">Order Number</th>
                    <th className="py-2.5">Date</th>
                    <th className="py-2.5 text-center">Items</th>
                    <th className="py-2.5">Status</th>
                    <th className="py-2.5 text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-900/60">
                  {data.recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-900/10 transition-colors">
                      <td className="py-3 font-bold text-sky-400">
                        <Link href={`/customer/orders/${order.id}`}>
                          {order.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 text-slate-350 font-mono">
                        {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'short' })}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-300">{order.itemsCount}</td>
                      <td className="py-3">
                        <span className="inline-block px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider rounded bg-slate-900 text-slate-350 uppercase border border-slate-800">
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-200">
                        ₹{order.grandTotal.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Notifications Tray */}
        <div className="glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-slate-200 tracking-wide font-mono uppercase flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Latest Alerts</span>
            </h3>
          </div>

          {data.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono">
              <span>No new alerts.</span>
            </div>
          ) : (
            <div className="space-y-3.5">
              {data.notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-slate-900/35 border border-slate-900 flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 text-xxs uppercase tracking-wider block font-mono">
                      {notif.title}
                    </span>
                    <p className="text-[10px] text-slate-400">{notif.message}</p>
                    <span className="text-[9px] text-slate-500 block font-mono">
                      {new Date(notif.createdAt).toLocaleDateString(undefined, { dateStyle: 'short', timeStyle: 'short' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Simple fallback component for CheckCircleIcon
function CheckCircleIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}
