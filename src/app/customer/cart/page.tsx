'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShoppingCart, Trash2, ArrowLeft, ArrowRight, Loader2, AlertCircle, Calendar, ShieldAlert } from 'lucide-react';
import api from '../../../lib/api-client';

interface CartItem {
  productId: string;
  name: string;
  sku: string;
  sellingPrice: number;
  quantity: number;
  description: string;
  dimensions: string;
  material: string;
  warranty: string;
  freeQty: number;
  leadTimeDays: number;
}

export default function CustomerCartPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkingOut, setCheckingOut] = useState(false);
  const [error, setError] = useState('');
  const [customerId, setCustomerId] = useState('');

  useEffect(() => {
    loadCart();
  }, []);

  const loadCart = () => {
    try {
      const storedUser = localStorage.getItem('customer_portal_user');
      if (!storedUser) {
        router.push('/customer/login');
        return;
      }
      const user = JSON.parse(storedUser);
      setCustomerId(user.id);
      
      const cartKey = `customer_portal_cart_${user.id}`;
      const storedCart = localStorage.getItem(cartKey);
      setCartItems(storedCart ? JSON.parse(storedCart) : []);
    } catch (e) {
      setError('Failed to load shopping cart from memory.');
    } finally {
      setLoading(false);
    }
  };

  const saveCart = (updatedItems: CartItem[]) => {
    if (!customerId) return;
    const cartKey = `customer_portal_cart_${customerId}`;
    localStorage.setItem(cartKey, JSON.stringify(updatedItems));
    setCartItems(updatedItems);
  };

  const handleUpdateQuantity = (productId: string, delta: number) => {
    const updated = cartItems.map((item) => {
      if (item.productId === productId) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    });
    saveCart(updated);
  };

  const handleRemoveItem = (productId: string) => {
    const updated = cartItems.filter((item) => item.productId !== productId);
    saveCart(updated);
  };

  const handleClearCart = () => {
    saveCart([]);
  };

  const calculateSubtotal = () => {
    return cartItems.reduce((acc, item) => acc + item.sellingPrice * item.quantity, 0);
  };

  const calculateGST = (subtotal: number) => {
    return Math.round(subtotal * 0.18 * 100) / 100;
  };

  const calculateShipping = (subtotal: number) => {
    if (subtotal === 0) return 0;
    return subtotal >= 50000 ? 0 : 500;
  };

  const handleCheckout = async () => {
    setError('');
    setCheckingOut(true);

    try {
      const payload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
      };

      const result = await api.post('/customer/checkout', payload);

      // Clear local storage cart
      saveCart([]);

      // Redirect to Order Detail stub with success query
      router.push(`/customer/orders/${result.orderId}?success=true`);
    } catch (err: any) {
      setError(err.message || 'Checkout request failed. Please try again.');
    } finally {
      setCheckingOut(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
        <span>Syncing cart state...</span>
      </div>
    );
  }

  const subtotal = calculateSubtotal();
  const gst = calculateGST(subtotal);
  const shipping = calculateShipping(subtotal);
  const grandTotal = subtotal + gst + shipping;

  return (
    <div className="space-y-6 font-sans">
      <div>
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          Shopping Cart Summary
        </h1>
        <p className="text-slate-400 text-xs mt-1">
          Review your items, taxes, shipping configurations and dispatch timelines.
        </p>
      </div>

      {error && (
        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {cartItems.length === 0 ? (
        <div className="glass-panel p-16 text-center rounded-2xl border border-slate-800/80 max-w-2xl mx-auto space-y-6">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-500">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-widest font-mono">Your Cart is Empty</h3>
            <p className="text-xs text-slate-400">
              Browse finished goods items in our catalogs to populate your purchase cart.
            </p>
          </div>
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Browse Products catalogue</span>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          {/* Cart Items List */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden">
              <div className="p-4 border-b border-slate-900 bg-[#090e1a]/40 flex justify-between items-center">
                <span className="text-xxs font-bold text-slate-400 uppercase tracking-widest font-mono">
                  Shopping Items ({cartItems.length})
                </span>
                <button
                  onClick={handleClearCart}
                  className="text-xxs font-bold text-rose-400 hover:text-rose-350 transition-colors uppercase tracking-widest font-mono cursor-pointer"
                >
                  Clear Cart List
                </button>
              </div>

              <div className="divide-y divide-slate-900">
                {cartItems.map((item) => (
                  <div key={item.productId} className="p-4 sm:p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    {/* Placeholder image */}
                    <div className="w-16 h-16 rounded-xl bg-slate-900 shrink-0 border border-slate-800 flex items-center justify-center text-[10px] font-mono font-bold text-slate-600">
                      {item.sku}
                    </div>

                    {/* Description info */}
                    <div className="flex-1 space-y-1">
                      <h4 className="text-xs font-extrabold text-slate-200">{item.name}</h4>
                      <p className="text-[10px] text-slate-500 font-mono">SKU: {item.sku} | Wood: {item.material}</p>
                      <div className="flex items-center gap-1.5 text-[9px] text-sky-400 font-mono pt-1">
                        <Calendar className="w-3 h-3" />
                        <span>Est. Delivery: {item.leadTimeDays} Days</span>
                      </div>
                    </div>

                    {/* Quantity selectors */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, -1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold"
                      >
                        -
                      </button>
                      <span className="w-8 text-center text-xs font-mono text-slate-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleUpdateQuantity(item.productId, 1)}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 font-bold"
                      >
                        +
                      </button>
                    </div>

                    {/* Price fields */}
                    <div className="text-left sm:text-right shrink-0 w-28 space-y-1">
                      <span className="text-[10px] text-slate-500 font-mono block">
                        ₹{item.sellingPrice.toLocaleString()} ea
                      </span>
                      <span className="text-xs font-bold text-sky-400 block">
                        ₹{(item.sellingPrice * item.quantity).toLocaleString()}
                      </span>
                    </div>

                    {/* Remove Action */}
                    <button
                      onClick={() => handleRemoveItem(item.productId)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <Link
              href="/customer/products"
              className="inline-flex items-center gap-1.5 text-xxs font-bold text-sky-400 hover:text-sky-350 transition-colors uppercase tracking-widest font-mono"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Continue Shopping</span>
            </Link>
          </div>

          {/* Checkout Totals Summary */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800/80 space-y-6">
            <h3 className="text-xs font-bold text-slate-200 tracking-wide font-mono uppercase border-b border-slate-900 pb-3">
              Purchase Summary
            </h3>

            <div className="space-y-3.5 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-400">Cart Subtotal</span>
                <span className="font-semibold text-slate-200">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">GST (18% Flat Rate)</span>
                <span className="font-semibold text-slate-200">₹{gst.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex flex-col">
                  <span className="text-slate-400">Shipping Delivery</span>
                  {shipping === 0 && (
                    <span className="text-[9px] text-emerald-450 font-mono font-bold uppercase">
                      Free Shipping Promo Active
                    </span>
                  )}
                </div>
                <span className="font-semibold text-slate-200">
                  {shipping > 0 ? `₹${shipping.toLocaleString()}` : 'Free'}
                </span>
              </div>

              <div className="border-t border-slate-900 pt-4 flex justify-between items-baseline mt-4">
                <span className="text-xs font-bold text-slate-300">Grand Total Sum</span>
                <span className="text-lg font-extrabold text-sky-400">
                  ₹{grandTotal.toLocaleString()}
                </span>
              </div>
            </div>

            {shipping > 0 && (
              <div className="p-3 rounded-xl bg-amber-500/5 border border-amber-500/10 flex items-start gap-2.5 text-[10px] text-amber-300">
                <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Tip: Orders above <strong>₹50,000</strong> qualify for <strong>Free Shipping</strong> (Save ₹500)! Add ₹{(50000 - subtotal).toLocaleString()} more to qualify.
                </span>
              </div>
            )}

            <button
              onClick={handleCheckout}
              disabled={checkingOut}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 shadow-lg shadow-sky-500/15 transition-all cursor-pointer disabled:opacity-50"
            >
              {checkingOut ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Processing Checkout transaction...</span>
                </>
              ) : (
                <>
                  <span>Checkout Purchase Order</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
