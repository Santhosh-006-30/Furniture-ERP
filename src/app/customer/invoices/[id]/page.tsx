'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowLeft, Download, Printer, CheckCircle2 } from 'lucide-react';
import api from '../../../../lib/api-client';

interface InvoiceDetailItem {
  id: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  gst: number;
  lineTotal: number;
}

interface InvoiceDetail {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  invoiceDate: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string | null;
  customerCompany?: string | null;
  customerAddress?: string | null;
  billingAddress: string;
  shippingAddress: string;
  gstNumber?: string | null;
  subtotal: number;
  gst: number;
  shipping: number;
  discount: number;
  grandTotal: number;
  paymentStatus: string;
  paymentStatusBadge: string;
  status: string;
  items: InvoiceDetailItem[];
  paymentId?: string | null;
  paymentGateway?: string | null;
  paidAt?: string | null;
  transactionReference?: string | null;
}

export default function CustomerInvoiceDetailPage() {
  const params = useParams();
  const [invoice, setInvoice] = useState<InvoiceDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadInvoice = async () => {
      try {
        setLoading(true);
        const data = await api.get(`/customer/invoices/${params.id}`);
        setInvoice(data);
      } catch (err: any) {
        setError(err.message || 'Unable to load invoice.');
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      loadInvoice();
    }
  }, [params.id]);

  const badgeClasses = useMemo(() => {
    switch (invoice?.paymentStatus) {
      case 'PAID':
        return 'bg-emerald-500/10 text-emerald-300';
      case 'PARTIALLY PAID':
        return 'bg-amber-500/10 text-amber-300';
      case 'OVERDUE':
        return 'bg-rose-500/10 text-rose-300';
      default:
        return 'bg-slate-800 text-slate-300';
    }
  }, [invoice?.paymentStatus]);

  const handlePrint = () => window.print();

  if (loading) {
    return <div className="rounded-2xl border border-slate-800/80 bg-[#090f1d] p-10 text-sm text-slate-400">Loading invoice…</div>;
  }

  if (error || !invoice) {
    return <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-10 text-sm text-rose-300">{error || 'Invoice not found.'}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/customer/invoices" className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300">
          <ArrowLeft size={16} /> Back to invoices
        </Link>
        <div className="flex gap-2">
          <button onClick={handlePrint} className="inline-flex items-center gap-2 rounded-xl border border-slate-800 px-3 py-2 text-sm text-slate-300">
            <Printer size={16} /> Print
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white">
            <Download size={16} /> Download
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-3xl border border-slate-800/80 p-6 lg:p-8">
        <div className="flex flex-col gap-4 border-b border-slate-800/80 pb-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-400">Invoice</p>
            <h1 className="mt-2 text-2xl font-extrabold text-slate-100">{invoice.invoiceNumber}</h1>
            <p className="mt-2 text-sm text-slate-400">Order #{invoice.orderNumber}</p>
          </div>
          <div className="text-left lg:text-right">
            <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${badgeClasses}`}>
              <CheckCircle2 size={14} /> {invoice.paymentStatus}
            </div>
            <p className="mt-3 text-sm text-slate-400">Issued {new Date(invoice.invoiceDate).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Bill to</h2>
              <div className="mt-2 space-y-1 text-sm text-slate-300">
                <p className="font-semibold text-slate-100">{invoice.customerName}</p>
                <p>{invoice.customerCompany || 'Individual customer'}</p>
                <p>{invoice.customerEmail}</p>
                <p>{invoice.customerPhone || 'Phone not provided'}</p>
              </div>
            </div>
            <div>
              <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Delivery</h2>
              <p className="mt-2 text-sm text-slate-300">{invoice.shippingAddress}</p>
            </div>
            {invoice.paymentGateway && (
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Payment details</h2>
                <div className="mt-2 space-y-1 text-sm text-slate-300 font-sans">
                  <p><span className="text-slate-500">Gateway:</span> {invoice.paymentGateway}</p>
                  {invoice.paymentId && <p><span className="text-slate-500">Transaction ID:</span> <span className="font-mono text-[11px] text-slate-350">{invoice.paymentId}</span></p>}
                  {invoice.paidAt && <p><span className="text-slate-500">Paid Date:</span> {new Date(invoice.paidAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}</p>}
                </div>
              </div>
            )}
          </div>
          <div className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
            <div className="flex items-center justify-between border-b border-slate-800 py-2">
              <span>Subtotal</span>
              <span>₹{invoice.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 py-2">
              <span>GST</span>
              <span>₹{invoice.gst.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 py-2">
              <span>Shipping</span>
              <span>₹{invoice.shipping.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between border-b border-slate-800 py-2">
              <span>Discount</span>
              <span>₹{invoice.discount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between pt-3 text-base font-semibold text-slate-100">
              <span>Total</span>
              <span>₹{invoice.grandTotal.toLocaleString()}</span>
            </div>
          </div>
        </div>

        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-800">
          <div className="grid grid-cols-[2fr_1fr_1fr_1fr] bg-slate-950/80 px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-400">
            <div>Item</div>
            <div>Qty</div>
            <div>Unit Price</div>
            <div>Total</div>
          </div>
          {invoice.items.map((item) => (
            <div key={item.id} className="grid grid-cols-[2fr_1fr_1fr_1fr] border-t border-slate-800 px-4 py-3 text-sm text-slate-300">
              <div>
                <p className="font-semibold text-slate-100">{item.productName}</p>
                <p className="text-xs text-slate-500">{item.sku}</p>
              </div>
              <div>{item.quantity}</div>
              <div>₹{item.unitPrice.toLocaleString()}</div>
              <div>₹{item.lineTotal.toLocaleString()}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
