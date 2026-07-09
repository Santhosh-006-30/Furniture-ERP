'use client';

import React, { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { CheckCircle2, ShoppingBag, ArrowLeft, Loader2, FileText, Calendar, Sparkles, Truck, Package, User, MapPin, CreditCard } from 'lucide-react';
import api from '../../../../lib/api-client';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gst: number;
  lineTotal: number;
}

interface OrderDetail {
  id: string;
  orderNumber: string;
  status: string;
  createdAt: string;
  subtotal: number;
  tax: number;
  shipping: number;
  grandTotal: number;
  paymentStatus: string;
  deliveryStatus: string;
  estimatedDelivery: string;
  customer: {
    name: string;
    email: string;
    phone?: string | null;
    address?: string | null;
    companyName?: string | null;
    gstNumber?: string | null;
  };
  deliveryAddress: string;
  paymentMethod: string;
  items: OrderItem[];
  timeline: Array<{
    stage: string;
    completed: boolean;
    timestamp?: string | null;
  }>;
  paymentId?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  transactionReference?: string | null;
  trackingNumber?: string | null;
  courierName?: string | null;
  trackingUrl?: string | null;
  dispatchDate?: string | null;
  deliveryDate?: string | null;
  trackingStatus?: string | null;
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
    <div className="space-y-8 font-sans">
      {/* Success Notification Banner */}
      <div className="glass-panel p-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/5 flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left">
        <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-450 shrink-0">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1 flex-1">
          <h2 className="text-base font-extrabold text-slate-100">Order Submitted Successfully</h2>
          <p className="text-xs text-slate-400">
            Your request <strong>{order.orderNumber}</strong> is now in the review queue. Our team will confirm availability and next steps shortly.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-sky-500/20 bg-sky-500/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.25em] text-sky-300">
          <Sparkles className="w-3.5 h-3.5" />
          Review in progress
        </div>
      </div>

      <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
        <div className="p-5 border-b border-slate-900 bg-[#090e1a]/40 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xxs font-bold text-slate-500 uppercase tracking-widest font-mono">Order Reference</span>
            <h3 className="text-sm font-extrabold text-slate-200 mt-0.5">{order.orderNumber}</h3>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold font-mono tracking-wide px-2.5 py-0.5 rounded-full bg-slate-900 text-sky-400 border border-slate-800 uppercase">{order.status}</span>
            <span className="text-[10px] font-bold font-mono tracking-wide px-2.5 py-0.5 rounded-full bg-slate-900 text-slate-400 border border-slate-800 uppercase">{order.paymentStatus}</span>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3 text-xs font-mono">
            <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-3">
              <span className="text-xxs text-slate-500 block uppercase tracking-widest">Date Placed</span>
              <span className="text-slate-300 font-bold">{new Date(order.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</span>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-3">
              <span className="text-xxs text-slate-500 block uppercase tracking-widest">Delivery Status</span>
              <span className="text-slate-300 font-bold">{order.deliveryStatus}</span>
            </div>
            <div className="rounded-xl border border-slate-900 bg-slate-950/30 p-3">
              <span className="text-xxs text-slate-500 block uppercase tracking-widest">Estimated Delivery</span>
              <span className="text-slate-300 font-bold">{order.estimatedDelivery}</span>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-200"><User className="w-4 h-4 text-sky-400" /> Customer Information</div>
                <div className="space-y-2 text-xs text-slate-400">
                  <div><span className="text-slate-500">Name:</span> {order.customer.name}</div>
                  <div><span className="text-slate-500">Email:</span> {order.customer.email}</div>
                  {order.customer.phone && <div><span className="text-slate-500">Phone:</span> {order.customer.phone}</div>}
                  {order.customer.companyName && <div><span className="text-slate-500">Company:</span> {order.customer.companyName}</div>}
                  {order.customer.gstNumber && <div><span className="text-slate-500">GST:</span> {order.customer.gstNumber}</div>}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-200"><MapPin className="w-4 h-4 text-sky-400" /> Delivery Address</div>
                <div className="text-xs text-slate-400">{order.deliveryAddress}</div>
              </div>

              <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-200">
                  <CreditCard className="w-4 h-4 text-sky-400" /> Payment Details
                </div>
                <div className="space-y-2 text-xs text-slate-400 font-sans">
                  <div><span className="text-slate-500">Method:</span> {order.paymentMethod}</div>
                  <div><span className="text-slate-500">Status:</span> <span className={`font-semibold ${order.paymentStatus === 'PAID' ? 'text-emerald-400 font-bold' : 'text-slate-350'}`}>{order.paymentStatus}</span></div>
                  {order.paymentId && <div><span className="text-slate-500">Transaction ID:</span> <span className="font-mono text-[11px] text-slate-300">{order.paymentId}</span></div>}
                  {order.paidAt && <div><span className="text-slate-500">Paid Date:</span> {new Date(order.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                </div>
              </div>

              {/* Shipment Tracking Details */}
              {order.trackingNumber && (
                <div className="rounded-2xl border border-sky-500/20 bg-sky-950/10 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-extrabold text-slate-200">
                    <Truck className="w-4 h-4 text-sky-400" /> Shipment Tracking Info
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Courier Carrier:</span>
                      <strong className="text-slate-200">{order.courierName || 'N/A'}</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Tracking Number:</span>
                      <strong className="text-slate-200 font-mono">{order.trackingNumber || 'N/A'}</strong>
                    </div>
                    {order.trackingUrl && (
                      <div className="md:col-span-2">
                        <span className="text-slate-500 block">Tracking Link:</span>
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-400 hover:text-sky-300 font-bold underline inline-flex items-center gap-1.5 mt-0.5"
                        >
                          Track Package &rarr;
                        </a>
                      </div>
                    )}
                    {order.dispatchDate && (
                      <div>
                        <span className="text-slate-500 block">Dispatch Date:</span>
                        <strong className="text-slate-200">{new Date(order.dispatchDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong>
                      </div>
                    )}
                    {order.deliveryDate && (
                      <div>
                        <span className="text-slate-500 block">Delivery Date:</span>
                        <strong className="text-slate-200">{new Date(order.deliveryDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</strong>
                      </div>
                    )}
                    {order.trackingStatus && (
                      <div>
                        <span className="text-slate-500 block">Tracking Status:</span>
                        <span className="inline-block mt-0.5 px-2 py-0.5 text-[10px] font-bold font-mono rounded bg-slate-900 border border-slate-800 text-sky-400 uppercase">
                          {order.trackingStatus}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950/30 p-4">
              <div className="mb-4 flex items-center gap-2 text-sm font-extrabold text-slate-200"><Truck className="w-4 h-4 text-sky-400" /> Order Timeline</div>
              <div className="space-y-3">
                {order.timeline.map((step, index) => (
                  <div key={step.stage} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className={`mt-0.5 h-3.5 w-3.5 rounded-full ${step.completed ? 'bg-emerald-400' : 'bg-slate-700'}`} />
                      {index < order.timeline.length - 1 && <div className="mt-1 h-full w-px bg-slate-800" />}
                    </div>
                    <div className="flex-1 rounded-xl border border-slate-900 bg-[#090f1d] p-3">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-slate-200">{step.stage}</span>
                        {step.completed && <CheckCircle2 className="h-4 w-4 text-emerald-400" />}
                      </div>
                      {step.timestamp && <div className="mt-1 text-[10px] text-slate-500">{new Date(step.timestamp).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest font-mono block">Products Purchased</span>
            <div className="divide-y divide-slate-900 border border-slate-900 rounded-xl overflow-hidden bg-slate-950/20">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-slate-800 bg-slate-900 text-slate-500"><Package className="w-5 h-5" /></div>
                    <div>
                      <div className="font-bold text-slate-200">{item.productName}</div>
                      <div className="text-[10px] text-slate-500 font-mono">SKU: {item.sku} · Qty: {item.quantity}</div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs text-slate-400 sm:grid-cols-4">
                    <div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Unit Price</span>₹{item.unitPrice.toLocaleString()}</div>
                    <div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Discount</span>₹{item.discount.toLocaleString()}</div>
                    <div><span className="block text-[10px] uppercase tracking-widest text-slate-500">GST</span>₹{item.gst.toLocaleString()}</div>
                    <div><span className="block text-[10px] uppercase tracking-widest text-slate-500">Line Total</span>₹{item.lineTotal.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-slate-900 pt-5 space-y-3 text-xs">
            <div className="flex justify-between"><span className="text-slate-400 font-mono">Subtotal</span><span className="font-semibold text-slate-200">₹{order.subtotal.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-mono">GST (18%)</span><span className="font-semibold text-slate-200">₹{order.tax.toLocaleString()}</span></div>
            <div className="flex justify-between"><span className="text-slate-400 font-mono">Shipping Delivery</span><span className="font-semibold text-slate-200">{order.shipping > 0 ? `₹${order.shipping.toLocaleString()}` : 'Free'}</span></div>
            <div className="border-t border-slate-900 pt-3 flex justify-between items-baseline mt-2"><span className="font-bold text-slate-300">Grand Total Sum</span><span className="text-base font-extrabold text-sky-400 font-mono">₹{order.grandTotal.toLocaleString()}</span></div>
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
