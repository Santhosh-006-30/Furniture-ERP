'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Trash2, ShoppingCart, Heart, Layers, ArrowLeft, Star, Clock, CheckCircle2, Loader2 } from 'lucide-react';
import api from '../../../lib/api-client';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  description?: string | null;
  dimensions?: string | null;
  material?: string | null;
  warranty?: string | null;
  stockQty: number;
  reservedQty: number;
  procurementStrategy: string;
  rating: number;
  leadTimeDays?: number | null;
}

import { formatCurrency } from '../../../lib/format';

const currency = formatCurrency;


export default function ComparePage() {
  const router = useRouter();
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [toastMessage, setToastMessage] = useState('');

  useEffect(() => {
    loadCompareList();
    fetchWishlist();
  }, []);

  const loadCompareList = async () => {
    try {
      setLoading(true);
      setError('');
      const stored = localStorage.getItem('customer_portal_compare');
      if (stored) {
        const parsed = JSON.parse(stored) as Product[];
        if (parsed.length > 0) {
          const ids = parsed.map((p) => p.id).join(',');
          const data = await api.get(`/customer/compare?ids=${ids}`);
          setCompareList(data.products || []);
          localStorage.setItem('customer_portal_compare', JSON.stringify(data.products || []));
        } else {
          setCompareList([]);
        }
      } else {
        setCompareList([]);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to sync compared product details.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWishlist = async () => {
    try {
      const data = await api.get('/api/customer/wishlist?pageSize=50');
      const ids = (data.wishlist || []).map((item: any) => item.productId);
      setWishlist(ids);
    } catch (e) {}
  };

  const handleRemove = (productId: string) => {
    const updated = compareList.filter((p) => p.id !== productId);
    setCompareList(updated);
    localStorage.setItem('customer_portal_compare', JSON.stringify(updated));
    showToast('Removed product from comparison matrix.');
  };

  const handleAddToCart = (product: Product) => {
    try {
      const storedUser = localStorage.getItem('customer_portal_user');
      if (!storedUser) {
        router.push('/customer/login');
        return;
      }
      const user = JSON.parse(storedUser);
      const cartKey = `customer_portal_cart_${user.id}`;
      const storedCart = localStorage.getItem(cartKey);
      const cart = storedCart ? JSON.parse(storedCart) : [];

      const exists = cart.find((c: any) => c.productId === product.id);
      if (exists) {
        exists.quantity = Math.min(50, exists.quantity + 1);
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          sellingPrice: product.sellingPrice,
          quantity: 1,
          material: product.material || 'Premium Wood',
          leadTimeDays: product.leadTimeDays || 7,
        });
      }
      localStorage.setItem(cartKey, JSON.stringify(cart));
      showToast(`Added "${product.name}" to cart successfully!`);
    } catch (e) {
      showToast('Failed to add product to cart.');
    }
  };

  const handleAddToWishlist = async (productId: string, productName: string) => {
    try {
      if (wishlist.includes(productId)) {
        await api.delete(`/api/customer/wishlist/${productId}`);
        setWishlist((prev) => prev.filter((id) => id !== productId));
        showToast(`Removed "${productName}" from wishlist.`);
      } else {
        await api.post('/api/customer/wishlist', { productId });
        setWishlist((prev) => [...prev, productId]);
        showToast(`Added "${productName}" to wishlist.`);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to update wishlist.');
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-slate-400 font-mono text-xs">
        <Loader2 className="w-5 h-5 animate-spin mr-2 text-sky-400" />
        <span>Syncing comparison details...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Product Comparison Matrix
          </h1>
          <p className="text-slate-450 text-xs">
            Review detailed specifications, pricing, and warranties side-by-side to make the right choice.
          </p>
        </div>
        <Link
          href="/customer/products"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-slate-100 font-bold text-xs transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Catalog</span>
        </Link>
      </div>

      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 rounded-xl bg-slate-900 border border-sky-500/30 px-4 py-3 text-xs text-sky-350 shadow-2xl">
          {toastMessage}
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-450">
          {error}
        </div>
      )}

      {compareList.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
            <Layers className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-200">No products to compare</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Go to the product catalog and select "Add to Compare" on up to 4 furniture items to view them here.
          </p>
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-600 transition-colors cursor-pointer"
          >
            <span>Explore Catalog</span>
          </Link>
        </div>
      ) : (
        <div className="glass-panel rounded-3xl border border-slate-800/80 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-slate-950/40 border-b border-slate-850">
                  <th className="p-5 text-xs font-bold font-mono tracking-widest text-slate-500 uppercase w-48 bg-slate-950/20">
                    Specification
                  </th>
                  {compareList.map((product) => (
                    <th key={product.id} className="p-5 border-l border-slate-850 relative group min-w-[200px]">
                      <button
                        onClick={() => handleRemove(product.id)}
                        className="absolute top-3 right-3 p-1 rounded bg-slate-900/60 hover:bg-rose-500/20 border border-slate-800 text-slate-500 hover:text-rose-455 cursor-pointer transition-colors"
                        title="Remove from Comparison"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <div className="space-y-4">
                        <div className="w-full h-32 rounded-xl bg-slate-950/80 border border-slate-900 flex items-center justify-center">
                          <img
                            src={`/images/products/${product.sku.toLowerCase()}.svg`}
                            alt={product.name}
                            onError={(e) => {
                              (e.target as any).src = '/images/products/fallback.svg';
                            }}
                            className="h-24 object-contain p-2"
                          />
                        </div>
                        <div className="space-y-1">
                          <span className="text-[9px] font-bold tracking-widest font-mono text-sky-400 uppercase block">
                            {product.category}
                          </span>
                          <h3 className="text-xs font-extrabold text-slate-200 line-clamp-2">
                            {product.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 font-mono">
                            {product.sku}
                          </p>
                        </div>
                      </div>
                    </th>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <th key={i} className="p-5 border-l border-slate-850 bg-slate-950/5 min-w-[200px]">
                      <div className="h-[230px] flex items-center justify-center border border-dashed border-slate-850 rounded-2xl text-[10px] font-mono text-slate-600">
                        Add product to compare
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Selling Price</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 font-bold text-sky-400 font-mono text-sm">
                      {currency(p.sellingPrice)}
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">MRP (Inclusive taxes)</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 line-through text-slate-500 font-mono">
                      {currency(p.sellingPrice * 1.25)}
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Special Discount</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 text-emerald-450 font-semibold">
                      20% Off flat rate
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Customer Rating</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850">
                      <div className="flex items-center gap-1.5">
                        <div className="flex text-amber-450">
                          {[...Array(5)].map((_, idx) => (
                            <Star
                              key={idx}
                              className={`w-3.5 h-3.5 ${
                                idx < Math.round(p.rating || 5.0) ? 'fill-amber-400 text-amber-400' : 'text-slate-705'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="font-bold text-slate-200">{p.rating || 5.0}</span>
                      </div>
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Material Wood</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 font-semibold text-slate-200">
                      {p.material || 'Sheesham / Teak Wood'}
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Dimensions (L x W x H)</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 font-mono text-slate-350">
                      {p.dimensions || 'N/A'}
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Warranty Coverage</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 text-slate-350">
                      {p.warranty || '36 Months Manufacturer Warranty'}
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Availability</td>
                  {compareList.map((p) => {
                    const freeQty = Math.max(0, p.stockQty - p.reservedQty);
                    const isInStock = freeQty > 0 || p.procurementStrategy === 'MTO';
                    return (
                      <td key={p.id} className="p-4 border-l border-slate-850">
                        {isInStock ? (
                          <span className="inline-flex items-center gap-1 text-emerald-450 font-bold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> In Stock / Ready
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-amber-500 font-bold">
                            <Clock className="w-3.5 h-3.5" /> Make to Order
                          </span>
                        )}
                      </td>
                    );
                  })}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr>
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Lead Time Days</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 font-semibold text-slate-300">
                      {p.leadTimeDays || 7} Days transit window
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>

                <tr className="bg-slate-950/20">
                  <td className="p-4 font-semibold text-slate-400 bg-slate-950/10">Actions</td>
                  {compareList.map((p) => (
                    <td key={p.id} className="p-4 border-l border-slate-850 space-y-2">
                      <button
                        onClick={() => handleAddToCart(p)}
                        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xxs font-bold uppercase tracking-[0.15em] bg-sky-500 hover:bg-sky-600 text-white cursor-pointer transition-colors"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Cart</span>
                      </button>
                      <button
                        onClick={() => handleAddToWishlist(p.id, p.name)}
                        className={`w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xxs font-bold uppercase tracking-[0.15em] border transition-colors cursor-pointer ${
                          wishlist.includes(p.id)
                            ? 'bg-rose-500/10 border-rose-500/30 text-rose-455 hover:bg-rose-500/20'
                            : 'border-slate-800 bg-slate-950 text-slate-300 hover:bg-slate-900'
                        }`}
                      >
                        <Heart className="w-3.5 h-3.5" />
                        <span>{wishlist.includes(p.id) ? 'Wishlisted' : 'Add Wishlist'}</span>
                      </button>
                    </td>
                  ))}
                  {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                    <td key={i} className="p-4 border-l border-slate-850 bg-slate-950/5" />
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
