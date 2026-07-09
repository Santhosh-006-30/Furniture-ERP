'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Loader2, 
  ClipboardList, 
  Clock, 
  Truck, 
  Bell, 
  AlertCircle, 
  FileText, 
  Heart, 
  Star, 
  CheckCircle2, 
  ArrowRight,
  Coins
} from 'lucide-react';
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
  loyaltyPoints: number;
  lifetimePoints: number;
  redeemedPoints: number;
}

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  description: string;
  freeQty: number;
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('Valued Customer');
  
  // Custom counts
  const [wishlistCount, setWishlistCount] = useState(0);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
    // Get customer display name and wishlist count
    const storedUser = localStorage.getItem('customer_portal_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        setCustomerName(user.name);

        const wlKey = `customer_portal_wishlist_${user.id}`;
        const storedWL = localStorage.getItem(wlKey);
        if (storedWL) {
          setWishlistCount(JSON.parse(storedWL).length);
        }
      } catch (e) {}
    }

    fetchDashboardAndProducts();
  }, []);

  const fetchDashboardAndProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch stats
      const response = await api.get('/customer/dashboard');
      setData(response);

      // Invoices count is any confirmed or delivered orders
      const recent = response.recentOrders || [];
      const confirmedAndDelivered = recent.filter((o: any) => o.status !== 'DRAFT').length;
      setInvoicesCount(confirmedAndDelivered || response.deliveredOrders + response.pendingOrders);

      // Fetch products to show recommended products
      try {
        const prodData = await api.get('/customer/products');
        // Slice a few representative products as recommended list
        setRecommendedProducts(prodData.slice(0, 4));
      } catch (e) {
        console.warn('Failed to load products list for recommendations:', e);
      }
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
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800/80 text-rose-450 text-xs">
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
          { name: 'Total Orders', value: data.totalOrders, description: 'Lifetime order count', icon: ClipboardList, color: 'text-sky-400' },
          { name: 'Invoices Issued', value: invoicesCount, description: 'Billed sales orders', icon: FileText, color: 'text-indigo-400' },
          { name: 'Wishlist Items', value: wishlistCount, description: 'Bookmarked styles', icon: Heart, color: 'text-rose-450' },
          { name: 'Notifications', value: data.notifications.length, description: 'Unread alert feed', icon: Bell, color: 'text-amber-400' }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <div key={idx} className="glass-panel p-5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest font-mono block mb-1">
                    {card.name}
                  </span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className="text-xl sm:text-2xl font-extrabold text-slate-200 block mt-2">
                  {card.value}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono block mt-3 pt-2 border-t border-slate-900/60">
                {card.description}
              </span>
            </div>
          );
        })}
      </div>

      {/* Loyalty Points Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-amber-500/15">
            <Star className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider mb-0.5">Loyalty Rewards</p>
            <p className="text-xl font-extrabold text-amber-400">{(data.loyaltyPoints || 0).toLocaleString()} pts</p>
            <p className="text-xs text-slate-500">Available to redeem</p>
          </div>
        </div>
        <div className="flex gap-6 text-center">
          <div>
            <p className="text-lg font-bold text-white">{(data.lifetimePoints || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Lifetime Earned</p>
          </div>
          <div className="w-px bg-slate-700" />
          <div>
            <p className="text-lg font-bold text-white">{(data.redeemedPoints || 0).toLocaleString()}</p>
            <p className="text-xs text-slate-500">Redeemed</p>
          </div>
        </div>
        <p className="text-xs text-slate-500 italic">Earn 1 point for every ₹100 spent · Redeem at checkout</p>
      </div>

      {/* Recommended Products Showcase */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 tracking-wide font-mono uppercase">
            Recommended For You
          </h3>
          <Link
            href="/customer/products"
            className="text-[10px] font-bold text-sky-400 hover:text-sky-350 transition-colors uppercase font-mono tracking-wider flex items-center gap-1"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {recommendedProducts.map((p) => {
            const hash = p.sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const rating = 4.0 + (hash % 11) / 10;
            const imgUrl = `/images/products/${p.sku.toLowerCase()}.svg`;

            return (
              <Link 
                key={p.id}
                href="/customer/products" 
                className="glass-panel p-3.5 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-28 rounded-xl bg-slate-900/40 flex items-center justify-center border border-slate-900 overflow-hidden relative">
                    <img src={imgUrl} alt={p.name} className="h-20 object-contain p-1 group-hover:scale-105 transition-transform" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-200 group-hover:text-sky-400 transition-colors truncate">{p.name}</h4>
                    <div className="flex items-center gap-0.5 text-amber-400 text-[10px] mt-0.5">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{rating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-900/60 mt-2 flex justify-between items-baseline">
                  <span className="text-xs font-extrabold text-sky-400">{currency(p.sellingPrice)}</span>
                  <span className="text-[9px] font-mono text-slate-500 uppercase">{p.freeQty > 0 ? 'In Stock' : 'MTO'}</span>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Tables/Notification Section Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <div className="lg:col-span-2 glass-panel p-5 rounded-2xl border border-slate-800/80 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-slate-200 tracking-wide font-mono uppercase">
              Recent Order Requests
            </h3>
            <span className="text-[9px] font-mono text-slate-500">Latest activity log</span>
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
                      <td className="py-3 text-slate-355 font-mono">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                      </td>
                      <td className="py-3 text-center font-mono text-slate-300">{order.itemsCount}</td>
                      <td className="py-3">
                        <span className={`inline-block px-2 py-0.5 text-[9px] font-bold font-mono tracking-wider rounded border uppercase ${
                          order.status === 'DRAFT' 
                            ? 'bg-slate-900 border-slate-800 text-slate-400' 
                            : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 text-right font-bold text-slate-200">
                        {currency(order.grandTotal)}
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
            <Link href="/customer/notifications" className="text-[9px] text-sky-400 hover:underline font-mono">
              Inbox
            </Link>
          </div>

          {data.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono">
              <span>No new alerts.</span>
            </div>
          ) : (
            <div className="space-y-3">
              {data.notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-slate-900/35 border border-slate-900 flex items-start gap-2.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 text-xxs uppercase tracking-wider block font-mono">
                      {notif.title}
                    </span>
                    <p className="text-[10px] text-slate-400">{notif.message}</p>
                    <span className="text-[9px] text-slate-500 block font-mono">
                      {new Date(notif.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
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
