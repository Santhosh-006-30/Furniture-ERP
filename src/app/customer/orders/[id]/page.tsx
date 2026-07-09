'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowLeft, Loader2, FileText, Calendar } from 'lucide-react';
import api from '../../../../lib/api-client';

interface OrderItem {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  product: {
    name: string;
    sku: string;
  };
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
}

interface PageProps {
  params: Promise<{ id: string }>;
}

export default function CustomerOrderDetailPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const id = unwrappedParams.id;
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrderDetail();
  }, [id]);

  const fetchOrderDetail = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.get(`/customer/orders/${id}`);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load purchase order details.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
        <span>Loading purchase order details...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800/80 text-rose-450 text-xs">
        <span>{error || 'Order record not found.'}</span>
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans max-w-3xl mx-auto">
      {/* Success Notification Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-450 shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-extrabold text-slate-100">Order Created Successfully</h2>
          <p className="text-xs text-slate-400">
            Your draft order <strong>{order.orderNumber}</strong> has been received and is awaiting administrator confirmation.
          </p>
        </div>
      </div>

      {/* Order Info Card */}
      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        {/* Card Header */}
        <div className="p-5 border-b border-slate-900 bg-[#090e1a]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest font-mono">Order Reference</span>
            <h3 className="text-sm font-extrabold text-slate-200 mt-0.5">{order.orderNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wide px-2.5 py-0.5 rounded-full bg-slate-900 text-sky-400 border border-slate-800 uppercase">
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Details Body */}
        <div className="p-5 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs font-mono">
            <div>
              <span className="text-xxs text-slate-500 block uppercase tracking-widest">Date Placed</span>
              <span className="text-slate-300 font-bold">
                {new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
              </span>
            </div>
            <div>
              <span className="text-xxs text-slate-500 block uppercase tracking-widest">Order ID</span>
              <span className="text-slate-350 text-xxs block truncate">{order.id}</span>
            </div>
          </div>

          {/* Items Table */}
          <div className="space-y-3">
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest font-mono block">Order Items</span>
            <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
              {order.items.map((item) => (
                <div key={item.id} className="p-3.5 flex justify-between items-center text-xs">
                  <div className="space-y-0.5">
                    <span className="font-bold text-slate-200 block">{item.product.name}</span>
                    <span className="text-[10px] text-slate-500 font-mono">SKU: {item.product.sku} | Qty: {item.quantity}</span>
                  </div>
                  <span className="font-bold text-sky-400 font-mono">
                    ₹{(item.unitPrice * item.quantity).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Summary */}
          <div className="border-t border-slate-900 pt-5 space-y-3 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">Subtotal</span>
              <span className="font-semibold text-slate-200">₹{order.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">GST (18%)</span>
              <span className="font-semibold text-slate-200">₹{order.tax.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400 font-mono">Shipping Delivery</span>
              <span className="font-semibold text-slate-200">
                {order.shipping > 0 ? `₹${order.shipping.toLocaleString()}` : 'Free'}
              </span>
            </div>
            <div className="border-t border-slate-900 pt-3 flex justify-between items-baseline mt-2">
              <span className="font-bold text-slate-300">Grand Total Sum</span>
              <span className="text-base font-extrabold text-sky-400 font-mono">
                ₹{order.grandTotal.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-center gap-4">
        <Link
          href="/customer/products"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-slate-100 font-bold text-xxs transition-colors"
        >
          <ShoppingBag className="w-3.5 h-3.5" />
          <span>Browse Catalogue</span>
        </Link>
        <Link
          href="/customer/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    </div>
  );
}
