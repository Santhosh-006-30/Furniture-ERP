'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Heart, Trash2, ShoppingCart, Loader2, Search, ArrowRight, Star } from 'lucide-react';
import api from '../../../lib/api-client';
import { formatCurrency } from '../../../lib/format';


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
}

interface WishlistItem {
  id: string;
  productId: string;
  product: Product;
  createdAt: string;
}

interface PaginationMeta {
  page: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
}

export default function WishlistPage() {
  const router = useRouter();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [pagination, setPagination] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState<string | null>(null);

  useEffect(() => {
    fetchWishlist();
  }, [page]);

  const fetchWishlist = async (nextPage = page) => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams({
        page: String(nextPage),
        pageSize: '8',
        ...(search.trim() ? { search: search.trim() } : {}),
      });
      const data = await api.get(`/customer/wishlist?${params.toString()}`);
      setItems(data.wishlist || []);
      setPagination(data.pagination || null);
    } catch (err: any) {
      setError(err.message || 'Unable to retrieve your wishlist.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchWishlist(1);
  };

  const handleRemove = async (wishlistItemId: string) => {
    try {
      setBusyId(wishlistItemId);
      await api.delete(`/customer/wishlist/${wishlistItemId}`);
      await fetchWishlist(page);
    } catch (err: any) {
      setError(err.message || 'Failed to remove item.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMoveToCart = async (item: WishlistItem) => {
    try {
      setBusyId(item.id);
      const storedUser = localStorage.getItem('customer_portal_user');
      if (!storedUser) {
        router.push('/customer/login');
        return;
      }
      const user = JSON.parse(storedUser);
      const cartKey = `customer_portal_cart_${user.id}`;
      const storedCart = localStorage.getItem(cartKey);
      const cart = storedCart ? JSON.parse(storedCart) : [];

      const exists = cart.find((c: any) => c.productId === item.productId);
      if (exists) {
        exists.quantity = Math.min(50, exists.quantity + 1);
      } else {
        cart.push({
          productId: item.product.id,
          name: item.product.name,
          sku: item.product.sku,
          sellingPrice: item.product.sellingPrice,
          quantity: 1,
          material: item.product.material || 'Premium Wood',
          leadTimeDays: 7,
        });
      }
      localStorage.setItem(cartKey, JSON.stringify(cart));

      // Remove from wishlist
      await api.delete(`/customer/wishlist/${item.id}`);
      await fetchWishlist(page);
    } catch (err: any) {
      setError(err.message || 'Failed to move item to cart.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
          My Wishlist
        </h1>
        <p className="text-slate-400 text-xs">
          Keep track of your favorite custom designs, furniture styles, and upcoming additions.
        </p>
      </div>

      {error && (
        <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 p-3.5 text-xs text-rose-400">
          {error}
        </div>
      )}

      {/* Filter and Search */}
      <form onSubmit={handleSearch} className="glass-panel rounded-2xl border border-slate-800/80 p-4 flex gap-3 items-center">
        <label className="flex-1 flex items-center gap-2 rounded-xl border border-slate-800 bg-[#090f1d] px-3 py-2 text-xs text-slate-350">
          <Search className="h-4 w-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-transparent outline-none text-sm text-slate-200"
            placeholder="Search wishlist items..."
          />
        </label>
        <button type="submit" className="rounded-xl bg-sky-500 px-4 py-2 text-xs font-bold text-white cursor-pointer hover:bg-sky-600 transition-colors">
          Search
        </button>
      </form>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="glass-panel h-80 animate-pulse rounded-2xl border border-slate-800/80" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="glass-panel rounded-2xl border border-slate-800/80 p-12 text-center space-y-4">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-900 text-slate-500">
            <Heart className="w-6 h-6" />
          </div>
          <h2 className="text-sm font-extrabold text-slate-200">Your wishlist is empty</h2>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Explore our curated collections of luxury home decor and custom furniture works.
          </p>
          <Link
            href="/customer/products"
            className="inline-flex items-center gap-2 rounded-xl bg-sky-500 px-5 py-2.5 text-xs font-bold text-white hover:bg-sky-600 transition-colors cursor-pointer"
          >
            <span>Explore Catalog</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {items.map((item) => (
            <div key={item.id} className="glass-panel rounded-2xl border border-slate-800/80 overflow-hidden flex flex-col justify-between group hover:border-slate-700/80 transition-all">
              <div className="p-4 space-y-3">
                <div className="w-full h-36 rounded-xl bg-slate-950/60 border border-slate-900 flex items-center justify-center relative">
                  <img
                    src={`/images/products/${item.product.sku.toLowerCase()}.svg`}
                    alt={item.product.name}
                    onError={(e) => {
                      (e.target as any).src = '/images/products/fallback.svg';
                    }}
                    className="w-full h-full object-contain p-2"
                  />
                  <div className="absolute top-2 right-2 flex items-center gap-1 rounded bg-slate-950/85 px-1.5 py-0.5 text-[9px] font-bold font-mono tracking-wide text-amber-400 border border-amber-400/20">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{item.product.rating || 5.0}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-[9px] font-bold tracking-widest font-mono text-sky-400 uppercase block">
                    {item.product.category}
                  </span>
                  <h3 className="text-xs font-extrabold text-slate-105 truncate">
                    {item.product.name}
                  </h3>
                  <p className="text-[10px] text-slate-500 truncate font-mono">
                    {item.product.sku}
                  </p>
                </div>

                <div className="flex justify-between items-baseline pt-1">
                  <span className="text-xs font-extrabold text-sky-400 font-mono">
                    {formatCurrency(item.product.sellingPrice)}
                  </span>


                  <span className="text-[9px] font-bold tracking-wide rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 px-2 py-0.5">
                    {item.product.procurementStrategy}
                  </span>
                </div>
              </div>

              <div className="p-4 border-t border-slate-900 bg-slate-950/20 flex gap-2">
                <button
                  onClick={() => handleMoveToCart(item)}
                  disabled={busyId !== null}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xxs font-bold uppercase tracking-[0.1em] bg-sky-500 hover:bg-sky-600 text-white cursor-pointer transition-colors disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Move to Cart</span>
                </button>
                <button
                  onClick={() => handleRemove(item.id)}
                  disabled={busyId !== null}
                  className="p-2 rounded-xl border border-rose-500/20 hover:border-rose-500/40 bg-rose-500/5 hover:bg-rose-500/10 text-rose-450 cursor-pointer transition-colors disabled:opacity-50"
                  title="Remove from Wishlist"
                >
                  {busyId === item.id ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="w-3.5 h-3.5" />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {pagination && pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-350 disabled:opacity-50 cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xs text-slate-400">
            Page {pagination.page} of {pagination.totalPages}
          </span>
          <button
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-800 px-3 py-2 text-xs text-slate-350 disabled:opacity-50 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
