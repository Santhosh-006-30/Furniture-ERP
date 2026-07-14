'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  ArrowRight, 
  Loader2, 
  MapPin, 
  ShieldCheck, 
  ShoppingBag, 
  AlertCircle, 
  Sparkles, 
  Truck, 
  CreditCard, 
  QrCode, 
  Building, 
  BadgeCheck, 
  Tag, 
  CheckCircle2 
} from 'lucide-react';
import api from '../../../lib/api-client';
import { Stepper } from '../../../components/ui/Stepper';
import { GlassInput } from '../../../components/ui/GlassInput';
import { PrimaryButton } from '../../../components/ui/PrimaryButton';
import { GlassCard } from '../../../components/ui/GlassCard';
import { StatusBadge } from '../../../components/ui/StatusBadge';


interface CartItem {
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  material: string;
  leadTimeDays: number;
}

import { formatCurrency } from '../../../lib/format';

const currency = formatCurrency;


export default function CustomerCheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  
  // Checkout Details States
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [notes, setNotes] = useState('');
  
  // Billing Address States
  const [sameAsShipping, setSameAsShipping] = useState(true);
  const [billingAddress, setBillingAddress] = useState('');
  const [billingName, setBillingName] = useState('');
  
  // Delivery Method (STANDARD, EXPRESS, PICKUP)
  const [deliveryMethod, setDeliveryMethod] = useState<'STANDARD' | 'EXPRESS' | 'PICKUP'>('STANDARD');
  
  // Payment Method Selector
  const [paymentMethod, setPaymentMethod] = useState<'CREDIT_CARD' | 'UPI' | 'NET_BANKING' | 'COD'>('CREDIT_CARD');
  
  // Coupon System
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0); // in rupees
  const [couponError, setCouponError] = useState('');

  // Loyalty System
  const [availablePoints, setAvailablePoints] = useState(0);
  const [useLoyalty, setUseLoyalty] = useState(false);


  // Order Confirmation State (Success View)
  const [successOrder, setSuccessOrder] = useState<{
    orderId: string;
    orderNumber: string;
    grandTotal: number;
    estimatedDelivery: string;
  } | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('customer_portal_user');
    if (!storedUser) {
      router.push('/customer/login');
      return;
    }

    try {
      const user = JSON.parse(storedUser);
      setContactName(user.name || '');
      setBillingName(user.name || '');
      
      const cartKey = `customer_portal_cart_${user.id}`;
      const storedCart = localStorage.getItem(cartKey);
      setCartItems(storedCart ? JSON.parse(storedCart) : []);

      // Fetch loyalty points
      api.get('/customer/loyalty').then((res) => {
        setAvailablePoints(res.loyaltyPoints || 0);
      }).catch((e) => console.warn('Failed to load loyalty points', e));
    } catch {
      setError('We could not restore your cart details.');
    } finally {
      setLoading(false);
    }
  }, [router]);

  // Core Calculations
  const subtotal = useMemo(() => cartItems.reduce((sum, item) => sum + item.sellingPrice * item.quantity, 0), [cartItems]);
  const loyaltyDiscount = useMemo(() => {
    return useLoyalty ? Math.min(availablePoints, subtotal - couponDiscount) : 0;
  }, [useLoyalty, availablePoints, subtotal, couponDiscount]);

  const gst = useMemo(() => {
    const netSubtotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);
    return Math.round(netSubtotal * 0.18 * 100) / 100;
  }, [subtotal, couponDiscount, loyaltyDiscount]);
  
  const shippingCharges = useMemo(() => {
    if (deliveryMethod === 'PICKUP') return 0;
    if (deliveryMethod === 'EXPRESS') return 1000;
    // Standard delivery: Free for orders >= ₹50,000, else ₹500
    return subtotal >= 50000 ? 0 : 500;
  }, [subtotal, deliveryMethod]);

  const grandTotal = useMemo(() => {
    const netSubtotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);
    const total = netSubtotal + gst + shippingCharges;
    return Math.max(0, total);
  }, [subtotal, couponDiscount, loyaltyDiscount, gst, shippingCharges]);

  // Delivery Lead Times
  const leadTimeDays = useMemo(() => {
    if (cartItems.length === 0) return 0;
    const maxDays = Math.max(...cartItems.map(item => item.leadTimeDays || 3));
    if (deliveryMethod === 'EXPRESS') return Math.max(2, Math.round(maxDays / 2));
    if (deliveryMethod === 'PICKUP') return 1;
    return maxDays;
  }, [cartItems, deliveryMethod]);

  const estDeliveryDateFormatted = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + leadTimeDays);
    return date.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  }, [leadTimeDays]);

  // Handle coupon application
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError('');
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    try {
      const result = await api.post('/customer/coupons/validate', { code, subtotal });
      if (result.valid) {
        setCouponDiscount(result.discount);
        setAppliedCoupon(`${result.code}${result.description ? ' – ' + result.description : ''}`);
        setCouponError('');
      }
    } catch (err: any) {
      setCouponError(err.message || 'Invalid coupon code');
      setCouponDiscount(0);
      setAppliedCoupon(null);
    }
  };

  // Override shipping UI representation if FREESHIP is applied
  const finalShippingCharges = appliedCoupon?.startsWith('FREESHIP') ? 0 : shippingCharges;
  const finalGrandTotal = useMemo(() => {
    const netSubtotal = Math.max(0, subtotal - couponDiscount - loyaltyDiscount);
    const baseTotal = netSubtotal + gst + finalShippingCharges;
    return Math.max(0, baseTotal);
  }, [subtotal, couponDiscount, loyaltyDiscount, gst, finalShippingCharges]);

  // Handle Checkout submission
  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setCheckingOut(true);

    try {
      if (cartItems.length === 0) {
        throw new Error('Your cart is empty.');
      }

      if (!contactName.trim() || !contactPhone.trim() || !shippingAddress.trim()) {
        throw new Error('Please complete your contact and delivery details.');
      }

      if (!sameAsShipping && !billingAddress.trim()) {
        throw new Error('Please provide your billing address.');
      }

      // Prepare payload
      const result = await api.post('/customer/checkout', {
        items: cartItems.map((item) => ({ productId: item.productId, quantity: item.quantity })),
        shippingAddress,
        contactName,
        contactPhone,
        notes,
        couponCode: couponCode ? couponCode.toUpperCase().trim() : undefined,
        loyaltyPointsUsed: useLoyalty ? loyaltyDiscount : undefined,
      });

      if (paymentMethod === 'COD') {
        // Save order metadata (coupon, addresses, totals) to localStorage for invoices / details retrieval
        const metaKey = `customer_order_meta_${result.orderId}`;
        const metadata = {
          shippingAddress,
          billingAddress: sameAsShipping ? shippingAddress : billingAddress,
          billingName: sameAsShipping ? contactName : billingName,
          deliveryMethod,
          paymentMethod,
          couponCode: appliedCoupon || undefined,
          couponDiscount,
          shippingCharges: finalShippingCharges,
          gst,
          grandTotal: finalGrandTotal,
          estimatedDelivery: estDeliveryDateFormatted
        };
        localStorage.setItem(metaKey, JSON.stringify(metadata));

        // Clear local storage cart
        const storedUser = JSON.parse(localStorage.getItem('customer_portal_user') || '{}');
        const cartKey = `customer_portal_cart_${storedUser.id || 'guest'}`;
        localStorage.setItem(cartKey, '[]');

        // Set success status to show confirmation screen
        setSuccessOrder({
          orderId: result.orderId,
          orderNumber: result.orderNumber || 'SO-0001',
          grandTotal: finalGrandTotal,
          estimatedDelivery: estDeliveryDateFormatted
        });
      } else {
        // Razorpay payment path
        const isScriptLoaded = await new Promise<boolean>((resolve) => {
          if ((window as any).Razorpay) {
            resolve(true);
            return;
          }
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = () => resolve(true);
          script.onerror = () => resolve(false);
          document.body.appendChild(script);
        });

        if (!isScriptLoaded) {
          throw new Error('Razorpay payment gateway failed to load. Please check your internet connection and try again.');
        }

        const couponCodeOnly = appliedCoupon ? appliedCoupon.split(' ')[0] : undefined;
        const razorpayOrder = await api.post('/api/payment/create-order', {
          orderId: result.orderId,
          couponCode: couponCodeOnly,
        });

        const options = {
          key: razorpayOrder.key,
          amount: razorpayOrder.amount,
          currency: razorpayOrder.currency,
          name: 'Shiv Furniture Works',
          description: `Payment for Order ${razorpayOrder.orderNumber}`,
          order_id: razorpayOrder.id,
          handler: async function (response: any) {
            setCheckingOut(true);
            try {
              await api.post('/api/payment/verify', {
                orderId: result.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              });

              // Save order metadata (coupon, addresses, totals) to localStorage for invoices / details retrieval
              const metaKey = `customer_order_meta_${result.orderId}`;
              const metadata = {
                shippingAddress,
                billingAddress: sameAsShipping ? shippingAddress : billingAddress,
                billingName: sameAsShipping ? contactName : billingName,
                deliveryMethod,
                paymentMethod: 'RAZORPAY',
                couponCode: appliedCoupon || undefined,
                couponDiscount,
                shippingCharges: finalShippingCharges,
                gst,
                grandTotal: finalGrandTotal,
                estimatedDelivery: estDeliveryDateFormatted,
                paymentId: response.razorpay_payment_id,
                paymentStatus: 'PAID',
                paidAt: new Date().toISOString(),
              };
              localStorage.setItem(metaKey, JSON.stringify(metadata));

              // Clear local storage cart
              const storedUser = JSON.parse(localStorage.getItem('customer_portal_user') || '{}');
              const cartKey = `customer_portal_cart_${storedUser.id || 'guest'}`;
              localStorage.setItem(cartKey, '[]');

              // Redirect to success page
              router.push(`/customer/order-success?orderId=${result.orderId}&orderNumber=${razorpayOrder.orderNumber}&paymentStatus=PAID&paymentId=${response.razorpay_payment_id}`);
            } catch (err: any) {
              router.push(`/customer/payment-failed?orderId=${result.orderId}`);
            } finally {
              setCheckingOut(false);
            }
          },
          prefill: {
            name: contactName,
            contact: contactPhone,
          },
          theme: {
            color: '#0ea5e9',
          },
          modal: {
            ondismiss: function () {
              setCheckingOut(false);
              router.push(`/customer/payment-failed?orderId=${result.orderId}`);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();
      }
    } catch (err: any) {
      setError(err.message || 'Checkout failed. Please try again.');
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
        <span>Preparing your checkout...</span>
      </div>
    );
  }

  // --- ORDER CONFIRMATION / PAYMENT SUCCESS SCREEN ---
  if (successOrder) {
    return (
      <div className="max-w-2xl mx-auto space-y-8 py-10 font-sans text-center">
        <div className="glass-panel p-8 sm:p-10 rounded-3xl border border-emerald-500/25 bg-emerald-500/5 relative overflow-hidden space-y-6">
          <div className="absolute top-0 right-0 -mt-12 -mr-12 w-48 h-48 rounded-full bg-emerald-500/5 blur-3xl pointer-events-none" />
          
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-8 h-8 animate-bounce" />
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-extrabold text-slate-100">Order Confirmed & Placed</h1>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Your draft sales order has been created. A designer from Shiv Furniture Works will contact you shortly to review custom specifications.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4 max-w-md mx-auto bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-left text-xs font-mono">
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Order Number</span>
              <span className="text-slate-200 font-bold text-sm">{successOrder.orderNumber}</span>
            </div>
            <div>
              <span className="text-slate-500 block uppercase text-[10px]">Grand Total</span>
              <span className="text-sky-400 font-bold text-sm">{currency(successOrder.grandTotal)}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-900 mt-2">
              <span className="text-slate-500 block uppercase text-[10px]">Estimated Delivery</span>
              <span className="text-slate-300 font-semibold">{successOrder.estimatedDelivery}</span>
            </div>
          </div>

          <div className="flex justify-center gap-4 pt-4 border-t border-slate-900/60">
            <Link
              href={`/customer/orders/${successOrder.orderId}`}
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors shadow-lg shadow-sky-500/10"
            >
              <span>View Order Progress</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/customer/dashboard"
              className="inline-flex items-center gap-1.5 px-5 py-3 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-300 font-bold text-xs transition-colors"
            >
              <span>Back to Dashboard</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Review & Checkout
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Secure your premium furniture order with dynamic shipping, billing and payment methods.
          </p>
        </div>

        <GlassCard className="p-4 bg-slate-900/10 hover:translate-y-0" hoverable={false}>
          <Stepper
            steps={[
              { label: 'Shopping Cart', description: 'Review cart items' },
              { label: 'Address & Delivery', description: 'Destination details' },
              { label: 'Secure Payment', description: 'Confirm purchase' }
            ]}
            currentStep={1}
          />
        </GlassCard>
      </div>


      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Form wrapper encompassing the entire grid layout to enable submit trigger */}
      <form onSubmit={handleSubmit} className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.75fr] gap-6 items-start">
        
        {/* Left main forms */}
        <div className="space-y-6">
          
          {/* Shipping details */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <MapPin className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">Shipping / Delivery Address</h2>
                <p className="text-[10px] text-slate-500">Provide the contact profile and delivery destination.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <GlassInput
                id="contactName"
                label="Contact Full Name"
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder="Receiver's name"
                required
              />
              <GlassInput
                id="contactPhone"
                label="Phone Number"
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="+91 99999 88888"
                required
              />
            </div>


            <label className="block text-xs text-slate-350 space-y-2">
              <span className="font-semibold block">Delivery Address</span>
              <textarea
                value={shippingAddress}
                onChange={(e) => setShippingAddress(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                placeholder="Building Name, Street, Landmark, City, State, Pincode"
                required
              />
            </label>
          </div>

          {/* Billing details */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6 space-y-5">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Building className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">Billing Address Details</h2>
                <p className="text-[10px] text-slate-500">Provide legal billing credentials for tax invoices.</p>
              </div>
            </div>

            <div className="flex items-center gap-2 px-1">
              <input
                type="checkbox"
                id="billingSame"
                checked={sameAsShipping}
                onChange={(e) => setSameAsShipping(e.target.checked)}
                className="rounded border-slate-800 text-sky-500"
              />
              <label htmlFor="billingSame" className="text-xs font-semibold text-slate-300 cursor-pointer">
                Billing address same as shipping address
              </label>
            </div>

            {!sameAsShipping && (
              <div className="space-y-4 animate-fade-in">
                <GlassInput
                  id="billingName"
                  label="Billing Name / Company"
                  value={billingName}
                  onChange={(e) => setBillingName(e.target.value)}
                  placeholder="Billing name or registered firm"
                />

                <label className="block text-xs text-slate-350 space-y-2">
                  <span className="font-semibold block">Billing Address</span>
                  <textarea
                    value={billingAddress}
                    onChange={(e) => setBillingAddress(e.target.value)}
                    rows={2}
                    className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200 outline-none"
                    placeholder="Billing address details"
                    required
                  />
                </label>
              </div>
            )}
          </div>

          {/* Delivery Method Selection */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <Truck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">Delivery Shipping Method</h2>
                <p className="text-[10px] text-slate-500">Select speed and cost parameters.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                {
                  id: 'STANDARD',
                  name: 'Standard Shipping',
                  desc: subtotal >= 50000 ? 'Free Shipping Active' : '₹500 flat fee',
                  time: '5-7 Days delivery window'
                },
                {
                  id: 'EXPRESS',
                  name: 'Express Speed Delivery',
                  desc: '₹1,000 flat surcharge',
                  time: '2-3 Days expedited delivery'
                },
                {
                  id: 'PICKUP',
                  name: 'Factory Self-Pickup',
                  desc: 'Free of charge',
                  time: 'Next day at Delhi workshop'
                }
              ].map((method) => (
                <div
                  key={method.id}
                  onClick={() => setDeliveryMethod(method.id as any)}
                  className={`p-4 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    deliveryMethod === method.id 
                      ? 'bg-sky-500/10 border-sky-500/30' 
                      : 'bg-slate-950/45 border-slate-900 hover:border-slate-800'
                  }`}
                >
                  <div>
                    <span className="text-xs font-extrabold text-slate-200 block">{method.name}</span>
                    <span className="text-[9px] text-slate-500 font-mono block mt-1">{method.time}</span>
                  </div>
                  <span className="text-[10px] text-sky-400 font-bold block mt-3">{method.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Payment Method Selector */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">Secure Payment Method</h2>
                <p className="text-[10px] text-slate-500">Persist transaction method for draft verification.</p>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: 'CREDIT_CARD', name: 'Credit Card', icon: CreditCard },
                { id: 'UPI', name: 'UPI Gateway', icon: QrCode },
                { id: 'NET_BANKING', name: 'Net Banking', icon: Building },
                { id: 'COD', name: 'Cash on Delivery', icon: BadgeCheck }
              ].map((pay) => {
                const Icon = pay.icon;
                return (
                  <div
                    key={pay.id}
                    onClick={() => setPaymentMethod(pay.id as any)}
                    className={`p-3.5 rounded-xl border cursor-pointer text-center space-y-2 transition-all ${
                      paymentMethod === pay.id 
                        ? 'bg-sky-500/10 border-sky-500/30 text-sky-400 font-bold' 
                        : 'bg-slate-950/40 border-slate-900 text-slate-450 hover:border-slate-800 hover:text-slate-350'
                    }`}
                  >
                    <Icon className="w-5 h-5 mx-auto" />
                    <span className="text-[10px] block font-semibold">{pay.name}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Special notes */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6">
            <label className="block text-xs text-slate-350 space-y-2">
              <span className="font-semibold block">Installation / Delivery Notes (Optional)</span>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-sky-500"
                placeholder="Preferred installation date, cargo elevator access details, contact at site, etc."
              />
            </label>
          </div>

        </div>

        {/* Right Sticky Checkout Sidebar */}
        <aside className="space-y-6">
          
          {/* Order Summary */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 sm:p-6 space-y-5">
            <div className="border-b border-slate-900 pb-3">
              <h2 className="text-sm font-extrabold text-slate-200">Purchase Summary</h2>
              <p className="text-[10px] text-slate-500 mt-1">Review items, delivery times, and totals.</p>
            </div>

            {/* Cart Items list scrollable */}
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {cartItems.map((item) => (
                <div key={item.productId} className="rounded-xl border border-slate-900 bg-slate-950/40 p-3 flex justify-between items-start gap-3">
                  <div>
                    <h3 className="text-[11px] font-extrabold text-slate-200 truncate max-w-[150px]">{item.name}</h3>
                    <p className="text-[9px] text-slate-500 mt-0.5 font-mono">Qty {item.quantity} · {item.material}</p>
                    <span className="text-[9px] text-sky-400/90 font-mono block mt-1">Lead: {item.leadTimeDays} days</span>
                  </div>
                  <span className="text-xs font-semibold text-sky-400 font-mono">{currency(item.sellingPrice * item.quantity)}</span>
                </div>
              ))}
            </div>

            {/* Coupon Code Block */}
            <div className="border-t border-slate-900 pt-4 space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Apply Coupon</span>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <GlassInput
                    id="couponCode"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value)}
                    placeholder="e.g. SHIV10"
                    className="uppercase font-mono"
                    aria-label="Coupon Code"
                  />

                </div>
                <button
                  type="button"
                  onClick={handleApplyCoupon}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-350 hover:text-white rounded-xl text-xs font-bold transition duration-200 shrink-0"
                >
                  Apply
                </button>
              </div>

              {appliedCoupon && (
                <div className="text-xxs text-emerald-450 font-bold font-mono">
                  Coupon Applied: {appliedCoupon}
                </div>
              )}
              {couponError && (
                <div className="text-xxs text-rose-450 font-bold font-mono">
                  {couponError}
                </div>
              )}
            </div>

            {/* Loyalty Points Block */}
            {availablePoints > 0 && (
              <div className="border-t border-slate-900 pt-4 space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono block">Loyalty Points</span>
                <div className="flex items-center gap-2 p-2.5 rounded-xl border border-slate-800 bg-[#090f1d]/50">
                  <input
                    type="checkbox"
                    id="redeemPoints"
                    checked={useLoyalty}
                    onChange={(e) => setUseLoyalty(e.target.checked)}
                    className="rounded border-slate-750 text-sky-500"
                  />
                  <label htmlFor="redeemPoints" className="text-xxs font-semibold text-slate-300 cursor-pointer">
                    Redeem {availablePoints.toLocaleString()} points (Save ₹{Math.min(availablePoints, subtotal - couponDiscount).toLocaleString()})
                  </label>
                </div>
              </div>
            )}

            {/* Calculations Breakdown */}
            <div className="space-y-3.5 text-xs border-t border-slate-900 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Cart Subtotal</span>
                <span className="font-semibold text-slate-200 font-mono">{currency(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-emerald-450">
                  <span>Coupon Discount</span>
                  <span className="font-semibold font-mono">-{currency(couponDiscount)}</span>
                </div>
              )}
              {loyaltyDiscount > 0 && (
                <div className="flex justify-between text-emerald-450">
                  <span>Loyalty Discount</span>
                  <span className="font-semibold font-mono">-{currency(loyaltyDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>GST (18% Flat)</span>
                <span className="font-semibold text-slate-200 font-mono">{currency(gst)}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Shipping Delivery</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {finalShippingCharges === 0 ? 'Free' : currency(finalShippingCharges)}
                </span>
              </div>
              
              <div className="border-t border-slate-900 pt-4 flex justify-between text-sm font-extrabold text-slate-100">
                <span>Grand Total</span>
                <span className="text-sky-400 font-mono">{currency(finalGrandTotal)}</span>
              </div>
            </div>

            {/* Delivery Date Notification */}
            <div className="rounded-xl border border-sky-500/15 bg-sky-500/5 p-3 text-[10px] text-slate-350 space-y-1">
              <span className="block font-bold uppercase tracking-wider text-sky-400 font-mono">Estimated Handover</span>
              <span>Delivery target: <strong>{estDeliveryDateFormatted}</strong> ({leadTimeDays} days transit).</span>
            </div>

            {/* Place Order CTA */}
            <div className="flex flex-col gap-3">
              <PrimaryButton
                type="submit"
                loading={checkingOut}
                className="w-full text-xs uppercase tracking-wider py-3"
              >
                <span>Confirm Purchase Order</span>
                <ArrowRight className="w-4 h-4" />
              </PrimaryButton>

              
              <Link 
                href="/customer/cart" 
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-xs font-extrabold text-slate-300 transition-colors hover:border-slate-700 hover:text-slate-100"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Cart</span>
              </Link>
            </div>

          </div>

          {/* Secure Handover Note */}
          <div className="glass-panel rounded-2xl border border-slate-800/80 p-5 space-y-4">
            <div className="flex items-center gap-2.5 text-slate-200">
              <div className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold">Order Assurance</h2>
                <p className="text-[10px] text-slate-500">Every draft is validated before dispatch.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-900 bg-slate-950/40 p-4 text-[10px] text-slate-400 space-y-2">
              <div className="flex items-center gap-2 text-slate-300">
                <Sparkles className="w-3.5 h-3.5 text-sky-400" />
                <span>Quotes validated within 1 business day.</span>
              </div>
              <div className="flex items-center gap-2 text-slate-300">
                <ShoppingBag className="w-3.5 h-3.5 text-sky-400" />
                <span>Custom builds automatically route to Planners.</span>
              </div>
            </div>
          </div>

        </aside>
      </form>
    </div>
  );
}
