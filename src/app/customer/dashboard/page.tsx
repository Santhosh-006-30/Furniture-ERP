'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ClipboardList, 
  Bell, 
  FileText, 
  Heart, 
  Star, 
  ArrowRight,
} from 'lucide-react';
import api from '../../../lib/api-client';
import { PageHeader } from '../../../components/ui/PageHeader';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { DataTable } from '../../../components/ui/DataTable';
import { LoadingSkeleton } from '../../../components/ui/LoadingSkeleton';

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

import { formatCurrency } from '../../../lib/format';

const currency = formatCurrency;


export default function CustomerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [customerName, setCustomerName] = useState('Valued Customer');
  
  const [wishlistCount, setWishlistCount] = useState(0);
  const [invoicesCount, setInvoicesCount] = useState(0);
  const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);

  useEffect(() => {
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
      
      const response = await api.get('/customer/dashboard');
      setData(response);

      const recent = response.recentOrders || [];
      const confirmedAndDelivered = recent.filter((o: any) => o.status !== 'DRAFT').length;
      setInvoicesCount(confirmedAndDelivered || response.deliveredOrders + response.pendingOrders);

      try {
        const prodData = await api.get('/customer/products');
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
      <div className="space-y-6">
        <LoadingSkeleton variant="text" className="h-10 w-1/3" />
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <LoadingSkeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
        <LoadingSkeleton variant="table" className="h-64" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <GlassCard className="p-8 text-center text-rose-400 text-xs hover:translate-y-0" hoverable={false}>
        <span>{error || 'Error loading dashboard.'}</span>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <PageHeader
        title={`Welcome back, ${customerName}`}
        description="Shiv Furniture Works Buyer Workspace. Manage, browse, and track your purchase orders and invoice summaries in real-time."
      />

      {/* Bento Metrics Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { name: 'Total Orders', value: data.totalOrders, description: 'Lifetime order count', icon: ClipboardList, color: 'text-sky-400', badgeType: 'info' as const },
          { name: 'Invoices Issued', value: invoicesCount, description: 'Billed sales orders', icon: FileText, color: 'text-indigo-400', badgeType: 'neutral' as const },
          { name: 'Wishlist Items', value: wishlistCount, description: 'Bookmarked styles', icon: Heart, color: 'text-rose-400', badgeType: 'danger' as const },
          { name: 'Notifications', value: data.notifications.length, description: 'Unread alert feed', icon: Bell, color: 'text-amber-400', badgeType: 'warning' as const }
        ].map((card, idx) => {
          const Icon = card.icon;
          return (
            <GlassCard key={idx} className="flex flex-col justify-between hover:translate-y-[-1px] duration-200">
              <div>
                <div className="flex justify-between items-start">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                    {card.name}
                  </span>
                  <Icon className={`w-4 h-4 ${card.color}`} />
                </div>
                <span className="text-2xl font-black text-slate-200 block mt-2">
                  {card.value}
                </span>
              </div>
              <div className="mt-4 pt-2 border-t border-slate-900/60 flex items-center justify-between">
                <span className="text-[10px] text-slate-500 font-mono">
                  {card.description}
                </span>
                <StatusBadge status="ACTIVE" type={card.badgeType} className="scale-75" />
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Loyalty Points Banner */}
      <GlassCard className="border border-amber-500/20 bg-gradient-to-r from-amber-500/5 to-yellow-500/5 hover:translate-y-0" hoverable={false}>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10">
              <Star className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">Loyalty Rewards</p>
              <p className="text-lg font-black text-amber-400">{(data.loyaltyPoints || 0).toLocaleString()} pts</p>
            </div>
          </div>
          <div className="flex gap-6 text-center">
            <div>
              <p className="text-sm font-bold text-white">{(data.lifetimePoints || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Lifetime Earned</p>
            </div>
            <div className="w-px bg-slate-800" />
            <div>
              <p className="text-sm font-bold text-white">{(data.redeemedPoints || 0).toLocaleString()}</p>
              <p className="text-[10px] text-slate-500">Redeemed</p>
            </div>
          </div>
          <p className="text-xs text-slate-500 italic">Earn 1 point for every ₹100 spent · Redeem at checkout</p>
        </div>
      </GlassCard>

      {/* Recommended Products Showcase */}
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono uppercase">
            Recommended For You
          </h3>
          <Link
            href="/customer/products"
            className="text-[10px] font-bold text-sky-455 hover:text-sky-300 transition-colors uppercase font-mono tracking-wider flex items-center gap-1"
          >
            <span>View Full Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
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
                className="glass-panel p-3 rounded-2xl border border-slate-850 hover:border-slate-700/60 transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="h-28 rounded-xl bg-slate-900/40 flex items-center justify-center border border-slate-950/60 overflow-hidden">
                    <img src={imgUrl} alt={p.name} className="h-20 object-contain p-1 group-hover:scale-105 transition-transform duration-250" />
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

      {/* Bento Grid layout for Lists & Timelines */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Recent Orders List */}
        <GlassCard className="lg:col-span-2 space-y-4 hover:translate-y-0" hoverable={false}>
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono uppercase">
              Recent Order Requests
            </h3>
            <span className="text-[9px] font-mono text-slate-500">Latest activity log</span>
          </div>

          <DataTable
            data={data.recentOrders}
            emptyMessage="No orders placed yet."
            columns={[
              {
                header: 'Order Number',
                accessor: (order: any) => (
                  <Link href={`/customer/orders/${order.id}`} className="font-bold text-sky-450 hover:underline">
                    {order.orderNumber}
                  </Link>
                )
              },
              {
                header: 'Date',
                accessor: (order: any) => (
                  <span className="text-slate-400 font-mono text-xs">
                    {new Date(order.createdAt).toLocaleDateString('en-IN', { dateStyle: 'short' })}
                  </span>
                )
              },
              {
                header: 'Items',
                accessor: (order: any) => <span className="font-mono text-slate-300">{order.itemsCount}</span>,
                className: 'text-center'
              },
              {
                header: 'Status',
                accessor: (order: any) => (
                  <StatusBadge
                    status={order.status}
                    type={order.status === 'DRAFT' ? 'neutral' : 'success'}
                  />
                )
              },
              {
                header: 'Amount',
                accessor: (order: any) => (
                  <span className="text-slate-200 font-bold">{currency(order.grandTotal)}</span>
                ),
                className: 'text-right'
              }
            ]}
          />
        </GlassCard>

        {/* Notifications Tray */}
        <GlassCard className="space-y-4 hover:translate-y-0" hoverable={false}>
          <div className="flex justify-between items-center border-b border-slate-900 pb-3">
            <h3 className="text-xs font-bold text-slate-200 tracking-wider font-mono uppercase flex items-center gap-1.5">
              <Bell className="w-3.5 h-3.5 text-slate-400" />
              <span>Latest Alerts</span>
            </h3>
            <Link href="/customer/notifications" className="text-[10px] text-sky-400 hover:underline font-mono font-bold">
              Inbox
            </Link>
          </div>

          {data.notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500 text-xs font-mono">
              <span>No new alerts.</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {data.notifications.map((notif) => (
                <div key={notif.id} className="p-3 rounded-xl bg-slate-900/35 border border-slate-950 flex items-start gap-2.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 mt-1.5 shrink-0" />
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-300 text-[10px] uppercase tracking-wider block font-mono">
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
        </GlassCard>
      </div>
    </div>
  );
}
