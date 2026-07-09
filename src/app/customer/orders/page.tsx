'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, Search, CalendarRange, Filter, ArrowRight, RotateCcw, XCircle, PackageCheck } from 'lucide-react';
import api from '../../../lib/api-client';

interface OrderListItem {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  grandTotal: number;
  itemCount: number;
  paymentStatus: string;
  deliveryStatus: string;
  estimatedDelivery: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function CustomerOrdersPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<OrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [dateFrom, setDateFrom] = useState(searchParams.get('dateFrom') || '');
  const [dateTo, setDateTo] = useState(searchParams.get('dateTo') || '');
  const [sort, setSort] = useState(searchParams.get('sort') || 'newest');
  const [page, setPage] = useState(Number(searchParams.get('page') || 1));
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, [page, status, dateFrom, dateTo, sort]);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(page),
        sort,
        ...(search ? { search } : {}),
        ...(status ? { status } : {}),
        ...(dateFrom ? { dateFrom } : {}),
        ...(dateTo ? { dateTo } : {}),
      });
      const data = await api.get(`/customer/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || 'Unable to load your orders right now.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (status) params.set('status', status);
    if (dateFrom) params.set('dateFrom', dateFrom);
    if (dateTo) params.set('dateTo', dateTo);
    if (sort) params.set('sort', sort);
    params.set('page', '1');
    router.replace(`/customer/orders?${params.toString()}`);
    fetchOrders();
  };

  const handleReorder = async (order: OrderListItem) => {
    try {
      const detail = await api.get(`/customer/orders/${order.id}`);
      const currentCartKey = `customer_portal_cart_${JSON.parse(localStorage.getItem('customer_portal_user') || '{}').id || 'guest'}`;
      const cartItems = (detail.items || []).map((item: any) => ({
        productId: item.productId,
        name: item.productName,
        sku: item.sku,
        sellingPrice: item.unitPrice,
        quantity: item.quantity,
        description: '',
        dimensions: '',
        material: '',
        warranty: '',
        freeQty: 999,
        leadTimeDays: 7,
      }));
      localStorage.setItem(currentCartKey, JSON.stringify(cartItems));
      router.push('/customer/cart');
    } catch (err: any) {
      setError(err.message || 'Unable to create a reorder cart from this order.');
    }
  };

  const handleCancel = async (orderId: string) => {
    try {
      setCancelling(true);
      await api.post(`/customer/orders/${orderId}/cancel`, {});
      setConfirmingCancel(null);
      fetchOrders();
    } catch (err: any) {
      setError(err.message || 'Unable to cancel this order.');
    } finally {
      setCancelling(false);
    }
  };

  const statusStyles: Record<string, string> = {
    DRAFT: 'bg-slate-800 text-slate-200',
    CONFIRMED: 'bg-sky-500/15 text-sky-300',
    PARTIALLY_DELIVERED: 'bg-amber-500/15 text-amber-300',
    FULLY_DELIVERED: 'bg-emerald-500/15 text-emerald-300',
    CANCELLED: 'bg-rose-500/15 text-rose-300',
  };

  const pageable = useMemo(() => pagination, [pagination]);

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">My Orders</h1>
        <p className="text-slate-400 text-xs">Track every order, review delivery progress, and reopen previous purchases.</p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-300">{error}</div>
      )}

      <form onSubmit={handleSearch} className="glass-panel rounded-2xl border border-slate-800/80 p-4 space-y-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
          <label className="text-xs text-slate-300 space-y-2">
            <span className="font-semibold">Search by order number</span>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input value={search} onChange={(e) => setSearch(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 pl-9 text-sm text-slate-200" placeholder="SO-0001" />
            </div>
          </label>
          <label className="text-xs text-slate-300 space-y-2">
            <span className="font-semibold">Date from</span>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 pl-9 text-sm text-slate-200" />
            </div>
          </label>
          <label className="text-xs text-slate-300 space-y-2">
            <span className="font-semibold">Date to</span>
            <div className="relative">
              <CalendarRange className="absolute left-3 top-3 h-4 w-4 text-slate-500" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 pl-9 text-sm text-slate-200" />
            </div>
          </label>
          <label className="text-xs text-slate-300 space-y-2">
            <span className="font-semibold">Status</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-sm text-slate-200">
              <option value="">All statuses</option>
              <option value="DRAFT">Draft</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PARTIALLY_DELIVERED">Partially delivered</option>
              <option value="FULLY_DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
          </label>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <label className="text-xs text-slate-300 flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <span>Sort</span>
            <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-sm text-slate-200">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="highest_amount">Highest amount</option>
              <option value="lowest_amount">Lowest amount</option>
            </select>
          </label>
          <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white">Apply Filters</button>
        </div>
      </form>

      {loading ? (
        <div className="grid gap-4">
          {[...Array(4)].map((_, idx) => <div key={idx} className="glass-panel h-24 animate-pulse rounded-2xl border border-slate-800/80" />)}
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-10 text-center text-sm text-slate-400">No orders match your current filters.</div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="glass-panel rounded-2xl border border-slate-800/80 p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-extrabold text-sky-400">{order.orderNumber}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.2em] ${statusStyles[order.status] || 'bg-slate-800 text-slate-200'}`}>{order.status}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">
                    <span>{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
                    <span className="mx-2">•</span>
                    <span>{order.itemCount} item(s)</span>
                    <span className="mx-2">•</span>
                    <span>Est. {order.estimatedDelivery}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-extrabold text-slate-100">₹{order.grandTotal.toLocaleString()}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{order.paymentStatus}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-slate-400">{order.deliveryStatus}</div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2 border-t border-slate-900/70 pt-4">
                <Link href={`/customer/orders/${order.id}`} className="rounded-xl bg-slate-900 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-300">View Details</Link>
                <button className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400" disabled>Download Invoice</button>
                <button onClick={() => handleReorder(order)} className="rounded-xl border border-slate-800 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400">Reorder</button>
                {order.status === 'DRAFT' && (
                  <button onClick={() => setConfirmingCancel(order.id)} className="rounded-xl bg-rose-500/10 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.2em] text-rose-300">Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {pageable && pageable.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Previous</button>
          <span className="text-xs text-slate-400">Page {pageable.page} of {pageable.totalPages}</span>
          <button disabled={page >= pageable.totalPages} onClick={() => setPage((p) => p + 1)} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300 disabled:opacity-50">Next</button>
        </div>
      )}

      {confirmingCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="glass-panel w-full max-w-md rounded-2xl border border-slate-800/80 p-6">
            <h3 className="text-sm font-extrabold text-slate-100">Cancel draft order?</h3>
            <p className="mt-2 text-xs text-slate-400">This will cancel the selected draft order and release any pending reservation.</p>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setConfirmingCancel(null)} className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-300">Keep order</button>
              <button disabled={cancelling} onClick={() => handleCancel(confirmingCancel)} className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-bold text-white">{cancelling ? 'Cancelling...' : 'Confirm cancel'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
