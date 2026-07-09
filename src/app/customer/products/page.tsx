'use client';

import React, { useState, useEffect, useMemo } from 'react';
import api from '../../../lib/api-client';
import Link from 'next/link';
import { 
  Search, 
  Info, 
  ShoppingCart, 
  Loader2, 
  ArrowUpDown, 
  Tag, 
  CheckCircle2, 
  Grid, 
  List, 
  Heart, 
  Layers, 
  Star, 
  Clock, 
  ShieldAlert, 
  X, 
  Calendar, 
  ArrowRight,
  Eye
} from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  category: string;
  sellingPrice: number;
  description: string;
  dimensions: string;
  material: string;
  warranty: string;
  stockQty: number;
  reservedQty: number;
  freeQty: number;
  leadTimeDays: number;
}

const currency = (value: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

export default function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Layout state
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [instockOnly, setInstockOnly] = useState(false);
  const [sort, setSort] = useState('name_asc');
  
  // Selected product for Details Dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState('');
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  
  // Reviews state
  const [reviewsData, setReviewsData] = useState<{
    reviews: Array<{ id: string; rating: number; title: string; comment: string; createdAt: string; customer: { name: string } }>;
    averageRating: number;
    totalReviews: number;
    ratingBreakdown: Record<number, number>;
    canReview: boolean;
  } | null>(null);
  
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewComment, setReviewComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  // Frequently bought bundle state
  const [includeBundle, setIncludeBundle] = useState(false);

  // Wishlist and Compare local states
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [compareList, setCompareList] = useState<Product[]>([]);
  const [showCompareDrawer, setShowCompareDrawer] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    if (selectedProduct) {
      fetchReviews(selectedProduct.id);
      setIncludeBundle(false);
      setActiveImageIndex(0);
      setReviewRating(5);
      setReviewTitle('');
      setReviewComment('');
      setReviewError('');
    } else {
      setReviewsData(null);
    }
  }, [selectedProduct]);

  const fetchReviews = async (productId: string) => {
    try {
      const data = await api.get(`/customer/reviews/${productId}`);
      setReviewsData(data);
    } catch (e) {}
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    if (!reviewTitle.trim() || !reviewComment.trim()) {
      setReviewError('Review title and comment are required.');
      return;
    }
    try {
      setSubmittingReview(true);
      setReviewError('');
      await api.post('/api/customer/reviews', {
        productId: selectedProduct.id,
        rating: reviewRating,
        title: reviewTitle.trim(),
        comment: reviewComment.trim(),
      });
      await fetchReviews(selectedProduct.id);
      await fetchProducts();
      setReviewTitle('');
      setReviewComment('');
      showToast('Review submitted successfully!');
    } catch (err: any) {
      setReviewError(err.message || 'Failed to submit review.');
    } finally {
      setSubmittingReview(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    // Load wishlist and compare items
    const storedUser = localStorage.getItem('customer_portal_user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        const wlKey = `customer_portal_wishlist_${user.id}`;
        const storedWL = localStorage.getItem(wlKey);
        if (storedWL) setWishlist(JSON.parse(storedWL));
      } catch (e) {}
    }
    const storedCompare = localStorage.getItem('customer_portal_compare');
    if (storedCompare) {
      try {
        setCompareList(JSON.parse(storedCompare));
      } catch (e) {}
    }
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('customer_portal_token');
      const response = await fetch('/api/customer/products', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to retrieve product database catalog.');
      }
      const data = await response.json();
      setProducts(data);
    } catch (err: any) {
      setError(err.message || 'Error occurred listing products.');
    } finally {
      setLoading(false);
    }
  };

  // Add item to local storage cart
  const handleAddToCart = (product: Product) => {
    try {
      const storedUser = localStorage.getItem('customer_portal_user');
      if (!storedUser) return;
      const user = JSON.parse(storedUser);
      const cartKey = `customer_portal_cart_${user.id}`;
      
      const currentCartRaw = localStorage.getItem(cartKey);
      let cart = currentCartRaw ? JSON.parse(currentCartRaw) : [];

      const existingIndex = cart.findIndex((item: any) => item.productId === product.id);
      if (existingIndex > -1) {
        cart[existingIndex].quantity += 1;
      } else {
        cart.push({
          productId: product.id,
          name: product.name,
          sku: product.sku,
          sellingPrice: product.sellingPrice,
          quantity: 1,
          description: product.description,
          dimensions: product.dimensions,
          material: product.material,
          warranty: product.warranty,
          freeQty: product.freeQty,
          leadTimeDays: product.leadTimeDays,
        });
      }

      localStorage.setItem(cartKey, JSON.stringify(cart));
      showToast(`Added "${product.name}" to shopping cart!`);
    } catch (e) {
      showToast('Failed to add item to shopping cart.');
    }
  };

  // Toggle wishlist state
  const handleToggleWishlist = (productId: string, name: string) => {
    const storedUser = localStorage.getItem('customer_portal_user');
    if (!storedUser) return;
    try {
      const user = JSON.parse(storedUser);
      const wlKey = `customer_portal_wishlist_${user.id}`;
      let updatedWL = [...wishlist];
      
      if (wishlist.includes(productId)) {
        updatedWL = updatedWL.filter(id => id !== productId);
        showToast(`Removed "${name}" from Wishlist.`);
      } else {
        updatedWL.push(productId);
        showToast(`Added "${name}" to Wishlist!`);
      }
      setWishlist(updatedWL);
      localStorage.setItem(wlKey, JSON.stringify(updatedWL));
    } catch (e) {
      showToast('Failed to update Wishlist.');
    }
  };

  // Toggle comparison state
  const handleToggleCompare = (product: Product) => {
    let updated;
    if (compareList.some(item => item.id === product.id)) {
      updated = compareList.filter(item => item.id !== product.id);
      showToast(`Removed "${product.name}" from compare drawer.`);
    } else {
      if (compareList.length >= 4) {
        showToast('You can compare a maximum of 4 products at once.');
        return;
      }
      updated = [...compareList, product];
      setShowCompareDrawer(true);
      showToast(`Added "${product.name}" to compare list.`);
    }
    setCompareList(updated);
    localStorage.setItem('customer_portal_compare', JSON.stringify(updated));
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Get dynamic local images & ratings & MRP details based on SKU
  const getProductEnhancements = (product: Product) => {
    const hash = product.sku.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    // Consistent details based on SKU name hashing
    const rating = 4.0 + (hash % 11) / 10; // rating between 4.0 and 5.0
    const discountPercent = 15 + (hash % 21); // discount between 15% and 35%
    const mrp = Math.round((product.sellingPrice / (1 - discountPercent / 100)) / 100) * 100;
    const isOutofStock = product.freeQty <= 0;
    const estDeliveryDate = new Date();
    estDeliveryDate.setDate(estDeliveryDate.getDate() + product.leadTimeDays);
    const estDeliveryFormatted = estDeliveryDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', weekday: 'short' });

    // Local image check
    const imgUrl = `/images/products/${product.sku.toLowerCase()}.svg`;

    // Map Category UI name dynamically if not RAW_MATERIAL
    const categoryName = product.category === 'FINISHED_GOOD' ? 'Finished Furniture' : product.category;

    return {
      rating: rating.toFixed(1),
      discountPercent,
      mrp,
      imgUrl,
      isOutofStock,
      estDeliveryFormatted,
      categoryName
    };
  };

  // Unique categories list for filters
  const categoriesList = useMemo(() => {
    const set = new Set(products.map(p => p.category));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Apply filters, search and sort
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
        const matchesCategory = selectedCategory === 'ALL' || p.category === selectedCategory;
        const matchesPrice = priceMax === '' ? true : p.sellingPrice <= Number(priceMax);
        const matchesStock = instockOnly ? p.freeQty > 0 : true;
        return matchesSearch && matchesCategory && matchesPrice && matchesStock;
      })
      .sort((a, b) => {
        if (sort === 'name_asc') return a.name.localeCompare(b.name);
        if (sort === 'price_asc') return a.sellingPrice - b.sellingPrice;
        if (sort === 'price_desc') return b.sellingPrice - a.sellingPrice;
        return 0;
      });
  }, [products, search, selectedCategory, priceMax, instockOnly, sort]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  // Related products query for Quick View
  const relatedProducts = useMemo(() => {
    if (!selectedProduct) return [];
    return products
      .filter(p => p.id !== selectedProduct.id)
      .slice(0, 3);
  }, [selectedProduct, products]);

  return (
    <div className="space-y-6 relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 animate-bounce">
          <CheckCircle2 className="w-4.5 h-4.5 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Finished Furniture Catalog
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse our curated collection of premium hardwood tables, chairs, and custom furniture.
          </p>
        </div>

        {/* View Mode & Compare Switch */}
        <div className="flex items-center gap-3">
          {compareList.length > 0 && (
            <button
              onClick={() => setShowCompareDrawer(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/25 border border-indigo-500/20 text-indigo-400 font-bold text-xxs transition-all cursor-pointer"
            >
              <Layers className="w-4 h-4" />
              <span>Compare ({compareList.length})</span>
            </button>
          )}
          
          <div className="flex rounded-xl bg-slate-900 border border-slate-800 p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition-all ${viewMode === 'list' ? 'bg-sky-500 text-white' : 'text-slate-400 hover:text-slate-200'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search catalog..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        {/* Category */}
        <div className="relative">
          <SlidersHorizontalIcon className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs bg-[#090f1d] text-slate-200"
          >
            <option value="ALL">All Categories</option>
            {categoriesList.filter(c => c !== 'ALL').map((cat) => (
              <option key={cat} value={cat}>{cat === 'FINISHED_GOOD' ? 'Finished Furniture' : cat}</option>
            ))}
          </select>
        </div>

        {/* Max Price */}
        <div className="relative">
          <Tag className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="number"
            placeholder="Max Price (₹)"
            value={priceMax}
            onChange={(e) => { setPriceMax(e.target.value ? Number(e.target.value) : ''); setCurrentPage(1); }}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
          />
        </div>

        {/* Sort */}
        <div className="relative">
          <ArrowUpDown className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs bg-[#090f1d] text-slate-200"
          >
            <option value="name_asc">Name: A to Z</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>

        {/* In-Stock Toggle */}
        <div className="flex items-center gap-2.5 px-2">
          <input
            type="checkbox"
            id="inStockCheck"
            checked={instockOnly}
            onChange={(e) => { setInstockOnly(e.target.checked); setCurrentPage(1); }}
            className="rounded border-slate-800 text-sky-500 focus:ring-sky-500 focus:ring-offset-[#060913]"
          />
          <label htmlFor="inStockCheck" className="text-xs font-semibold text-slate-300 cursor-pointer">
            In-Stock Only
          </label>
        </div>
      </div>

      {/* Main product loading and list */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, idx) => (
            <div key={idx} className="glass-panel p-4 rounded-2xl border border-slate-800/80 space-y-4 animate-pulse">
              <div className="h-40 rounded-xl bg-slate-900" />
              <div className="h-4 w-2/3 bg-slate-900 rounded" />
              <div className="h-3 w-1/2 bg-slate-900 rounded" />
              <div className="flex justify-between items-center pt-2">
                <div className="h-4 w-1/4 bg-slate-900 rounded" />
                <div className="h-8 w-1/3 bg-slate-900 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800/80 text-rose-450 text-xs">
          <span>{error}</span>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800/80 text-slate-500 text-xs font-mono">
          <span>No products found matching filters.</span>
        </div>
      ) : viewMode === 'grid' ? (
        // --- GRID VIEW ---
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentItems.map((product) => {
              const { rating, discountPercent, mrp, imgUrl, isOutofStock, estDeliveryFormatted } = getProductEnhancements(product);
              const isInWishlist = wishlist.includes(product.id);
              const isInCompare = compareList.some(item => item.id === product.id);

              return (
                <div key={product.id} className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col group relative overflow-hidden">
                  
                  {/* Discount Badge */}
                  <div className="absolute top-6 left-6 z-10 px-2.5 py-1 rounded-lg bg-emerald-500 text-white font-extrabold text-[9px] uppercase tracking-wider">
                    {discountPercent}% OFF
                  </div>

                  {/* Wishlist Toggle Button */}
                  <button
                    onClick={() => handleToggleWishlist(product.id, product.name)}
                    className={`absolute top-6 right-6 z-10 p-2 rounded-xl border transition-all cursor-pointer ${
                      isInWishlist 
                        ? 'bg-rose-500 border-rose-500 text-white' 
                        : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-rose-450'
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5" fill={isInWishlist ? "currentColor" : "none"} />
                  </button>

                  {/* Image Container */}
                  <div className="h-44 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden mb-4 border border-slate-900">
                    <img 
                      src={imgUrl} 
                      alt={product.name} 
                      className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" 
                    />
                    <div className="absolute inset-0 bg-sky-500/0 group-hover:bg-sky-500/5 transition-colors pointer-events-none" />
                  </div>

                  {/* Product details */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 text-slate-400">
                        {product.sku}
                      </span>
                      <div className="flex items-center gap-0.5 text-amber-400 text-xxs font-extrabold ml-auto">
                        <Star className="w-3 h-3 fill-current" />
                        <span>{rating}</span>
                      </div>
                    </div>

                    <h3 className="text-xs font-extrabold text-slate-200 group-hover:text-sky-400 transition-colors">
                      {product.name}
                    </h3>
                    
                    <p className="text-[10px] text-slate-450 line-clamp-2">
                      {product.description}
                    </p>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded ${
                        product.freeQty > 5 
                          ? 'bg-emerald-500/10 text-emerald-450' 
                          : product.freeQty > 0 
                            ? 'bg-amber-500/10 text-amber-400' 
                            : 'bg-rose-500/10 text-rose-450'
                      }`}>
                        {product.freeQty > 0 ? `In Stock (${product.freeQty})` : 'Made-to-Order'}
                      </span>
                      <span className="text-[9px] font-mono text-slate-500 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-slate-500" />
                        {product.leadTimeDays}d lead
                      </span>
                    </div>

                    <div className="text-[9px] text-slate-500 font-mono pt-1">
                      Est. Delivery: <span className="text-slate-300 font-semibold">{estDeliveryFormatted}</span>
                    </div>
                  </div>

                  {/* Price & Action Section */}
                  <div className="flex items-center justify-between border-t border-slate-900/65 mt-4 pt-3">
                    <div>
                      {/* Price strike-through */}
                      <span className="text-[10px] text-slate-500 line-through block font-mono">
                        {currency(mrp)}
                      </span>
                      <span className="text-sm font-extrabold text-sky-400">
                        {currency(product.sellingPrice)}
                      </span>
                    </div>

                    <div className="flex gap-1.5">
                      <button
                        onClick={() => handleToggleCompare(product)}
                        className={`p-2 rounded-xl border transition-colors ${
                          isInCompare 
                            ? 'bg-indigo-500/20 border-indigo-500/35 text-indigo-400' 
                            : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400'
                        }`}
                        title="Compare Product Specs"
                      >
                        <Layers className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setSelectedProduct(product)}
                        className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                        title="Quick View"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handleAddToCart(product)}
                        disabled={isOutofStock}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-[10px] transition-colors cursor-pointer shadow-md shadow-sky-500/10 disabled:opacity-50"
                      >
                        <ShoppingCart className="w-3 h-3" />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        // --- LIST VIEW ---
        <div className="space-y-4">
          {currentItems.map((product) => {
            const { rating, discountPercent, mrp, imgUrl, isOutofStock, estDeliveryFormatted } = getProductEnhancements(product);
            const isInWishlist = wishlist.includes(product.id);
            const isInCompare = compareList.some(item => item.id === product.id);

            return (
              <div key={product.id} className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col md:flex-row gap-5 items-start md:items-center relative overflow-hidden group">
                
                {/* Wishlist toggle */}
                <button
                  onClick={() => handleToggleWishlist(product.id, product.name)}
                  className={`absolute top-4 right-4 z-10 p-2 rounded-xl border transition-all cursor-pointer ${
                    isInWishlist 
                      ? 'bg-rose-500 border-rose-500 text-white' 
                      : 'bg-slate-950/80 border-slate-800 text-slate-400 hover:text-rose-450'
                  }`}
                >
                  <Heart className="w-3.5 h-3.5" fill={isInWishlist ? "currentColor" : "none"} />
                </button>

                {/* Left image */}
                <div className="w-full md:w-44 h-40 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden border border-slate-900 shrink-0">
                  <img 
                    src={imgUrl} 
                    alt={product.name} 
                    className="w-full h-full object-contain p-2 transition-transform duration-300 group-hover:scale-105" 
                  />
                </div>

                {/* Middle details */}
                <div className="flex-1 space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="px-1.5 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 text-slate-400">
                      {product.sku}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 font-extrabold text-[9px] uppercase tracking-wider">
                      {discountPercent}% OFF
                    </span>
                    <div className="flex items-center gap-0.5 text-amber-400 text-xxs font-extrabold">
                      <Star className="w-3 h-3 fill-current" />
                      <span>{rating}</span>
                    </div>
                  </div>

                  <h3 className="text-sm font-extrabold text-slate-200 group-hover:text-sky-400 transition-colors">
                    {product.name}
                  </h3>

                  <p className="text-xs text-slate-450 max-w-2xl">
                    {product.description}
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-[10px] font-mono text-slate-400">
                    <div>
                      <span className="text-slate-500 block">Dimensions:</span>
                      <span className="text-slate-300 font-semibold">{product.dimensions}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Material:</span>
                      <span className="text-slate-300 font-semibold">{product.material}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Warranty:</span>
                      <span className="text-slate-300 font-semibold">{product.warranty}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Est. Delivery:</span>
                      <span className="text-sky-400 font-semibold">{estDeliveryFormatted}</span>
                    </div>
                  </div>
                </div>

                {/* Right Price & Buttons */}
                <div className="w-full md:w-48 border-t md:border-t-0 md:border-l border-slate-900/65 pt-4 md:pt-0 md:pl-5 flex flex-row md:flex-col justify-between md:justify-center gap-3 shrink-0 self-stretch">
                  <div className="md:text-center">
                    <span className="text-xs text-slate-500 line-through block font-mono">
                      {currency(mrp)}
                    </span>
                    <span className="text-lg font-extrabold text-sky-400 block">
                      {currency(product.sellingPrice)}
                    </span>
                    <span className={`inline-block mt-1.5 px-2 py-0.5 text-[9px] font-bold font-mono rounded ${
                      product.freeQty > 0 ? 'bg-emerald-500/10 text-emerald-450' : 'bg-rose-500/10 text-rose-450'
                    }`}>
                      {product.freeQty > 0 ? `In Stock (${product.freeQty})` : 'Made-to-Order'}
                    </span>
                  </div>

                  <div className="flex md:flex-row gap-2 justify-center items-center">
                    <button
                      onClick={() => handleToggleCompare(product)}
                      className={`p-2 rounded-xl border transition-colors cursor-pointer ${
                        isInCompare 
                          ? 'bg-indigo-500/20 border-indigo-500/35 text-indigo-400' 
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-indigo-400'
                      }`}
                      title="Compare"
                    >
                      <Layers className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="Specs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      disabled={isOutofStock}
                      className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs transition-colors cursor-pointer disabled:opacity-50"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((c) => c - 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Previous
          </button>
          <span className="text-xxs font-mono text-slate-400">
            Page {currentPage} of {totalPages}
          </span>
          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((c) => c + 1)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 transition-colors cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* Specifications Details Dialog / Quick View */}
      {selectedProduct && (() => {
        const { rating, mrp, imgUrl, isOutofStock, estDeliveryFormatted } = getProductEnhancements(selectedProduct);
        const galleryImages = [
          imgUrl,
          imgUrl,
          imgUrl,
        ];
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl bg-[#060913] rounded-3xl border border-slate-800/80 shadow-2xl relative overflow-hidden max-h-[90vh] flex flex-col">
              
              <button
                onClick={() => setSelectedProduct(null)}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 hover:text-slate-200 transition-all cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="overflow-y-auto p-6 sm:p-8 flex-1 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left Column: Image & Gallery */}
                  <div className="space-y-4">
                    <div className="h-56 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center border border-slate-900 relative">
                      <img src={galleryImages[activeImageIndex]} alt={selectedProduct.name} className="w-full h-full object-contain p-4" />
                    </div>
                    {/* Gallery Thumbnails */}
                    <div className="flex gap-2 justify-center">
                      {galleryImages.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => setActiveImageIndex(i)}
                          className={`w-12 h-12 rounded-lg bg-slate-905 border p-1 transition-all cursor-pointer ${
                            activeImageIndex === i ? 'border-sky-500 scale-105' : 'border-slate-850 opacity-60 hover:opacity-100'
                          }`}
                        >
                          <img src={img} alt={`View ${i + 1}`} className="w-full h-full object-contain" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Right Core Details */}
                  <div className="space-y-3">
                    <span className="px-2 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 text-slate-450 uppercase">
                      SKU: {selectedProduct.sku}
                    </span>
                    <h2 className="text-base font-extrabold text-slate-100">{selectedProduct.name}</h2>
                    <div className="flex items-center gap-1 text-amber-400 text-xs font-extrabold">
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rating} / 5.0 Rating</span>
                    </div>

                    <div className="border-t border-b border-slate-900 py-3 flex items-baseline gap-2.5">
                      <span className="text-lg font-extrabold text-sky-400">
                        {currency(selectedProduct.sellingPrice)}
                      </span>
                      <span className="text-xs text-slate-500 line-through font-mono">
                        {currency(mrp)}
                      </span>
                    </div>

                    <div className="text-[10px] space-y-2 text-slate-400">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>Lead Time: <strong>{selectedProduct.leadTimeDays} Days</strong></span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                        <span>Estimated Delivery: <strong className="text-slate-200">{estDeliveryFormatted}</strong></span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Spec sheets */}
                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Specifications</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="bg-slate-900/35 p-3 rounded-xl border border-slate-900">
                      <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-mono">Dimensions</span>
                      <span className="font-bold text-slate-350 text-xs">{selectedProduct.dimensions}</span>
                    </div>
                    <div className="bg-slate-900/35 p-3 rounded-xl border border-slate-900">
                      <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-mono">Material Wood</span>
                      <span className="font-bold text-slate-355 text-xs">{selectedProduct.material}</span>
                    </div>
                    <div className="bg-slate-900/35 p-3 rounded-xl border border-slate-900">
                      <span className="text-[9px] text-slate-500 block uppercase tracking-widest font-mono">Warranty Policy</span>
                      <span className="font-bold text-slate-350 text-xs">{selectedProduct.warranty}</span>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Product Description</h3>
                  <p className="text-xs text-slate-400 bg-slate-900/10 p-3.5 rounded-xl border border-slate-900">
                    {selectedProduct.description}
                  </p>
                </div>

                {/* Frequently Bought Together */}
                {relatedProducts.length > 0 && (() => {
                  const bundleProduct = relatedProducts[0];
                  return (
                    <div className="space-y-3 pt-4 border-t border-slate-900">
                      <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Frequently Bought Together</h3>
                      <div className="bg-slate-950/65 p-4 rounded-2xl border border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-850 p-1">
                            <img src={imgUrl} alt={selectedProduct.name} className="object-contain" />
                          </div>
                          <span className="text-slate-500 font-bold text-xs">+</span>
                          <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center border border-slate-850 p-1">
                            <img src={`/images/products/${bundleProduct.sku.toLowerCase()}.svg`} alt={bundleProduct.name} className="object-contain" />
                          </div>
                          <div className="text-xs">
                            <p className="font-extrabold text-slate-250">Shiv Furniture Bundle Offer</p>
                            <p className="text-slate-500 text-[10px]">Add matching companion item.</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <label className="flex items-center gap-2 text-xs text-slate-350 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={includeBundle}
                              onChange={(e) => setIncludeBundle(e.target.checked)}
                              className="rounded border-slate-800 text-sky-500"
                            />
                            <span>Add <strong className="text-slate-200">{bundleProduct.name}</strong> (+{currency(bundleProduct.sellingPrice)})</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  );
                })()}

                {/* Related Products Section */}
                <div className="space-y-3 pt-4 border-t border-slate-900">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Related Furniture</h3>
                  <div className="grid grid-cols-3 gap-3">
                    {relatedProducts.map(rp => {
                      const rpEnh = getProductEnhancements(rp);
                      return (
                        <div 
                          key={rp.id} 
                          onClick={() => setSelectedProduct(rp)}
                          className="bg-slate-950/40 p-2.5 rounded-xl border border-slate-900 hover:border-slate-800 transition-colors text-center cursor-pointer space-y-1.5"
                        >
                          <div className="h-16 rounded-lg bg-slate-900 flex items-center justify-center">
                            <img src={rpEnh.imgUrl} alt={rp.name} className="h-12 object-contain" />
                          </div>
                          <span className="text-[10px] font-extrabold text-slate-300 block truncate">{rp.name}</span>
                          <span className="text-[10px] font-bold text-sky-400 block">{currency(rp.sellingPrice)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Customer Reviews Section */}
                <div className="space-y-4 pt-4 border-t border-slate-900">
                  <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">Customer Reviews</h3>
                  {reviewsData ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-950/40 p-4 rounded-2xl border border-slate-900 text-xs">
                        <div className="text-center space-y-1 self-center border-r border-slate-900 pr-4">
                          <p className="text-3xl font-extrabold text-sky-400 font-mono">{reviewsData.averageRating}</p>
                          <div className="flex justify-center text-amber-450">
                            {[...Array(5)].map((_, idx) => (
                              <Star
                                key={idx}
                                className={`w-3.5 h-3.5 ${
                                  idx < Math.round(reviewsData.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                                }`}
                              />
                            ))}
                          </div>
                          <p className="text-[10px] text-slate-500 font-mono">Based on {reviewsData.totalReviews} customer reviews</p>
                        </div>
                        <div className="space-y-1.5 pl-4">
                          {[5, 4, 3, 2, 1].map((stars) => {
                            const count = reviewsData.ratingBreakdown[stars] || 0;
                            const percentage = reviewsData.totalReviews > 0
                              ? Math.round((count / reviewsData.totalReviews) * 100)
                              : 0;
                            return (
                              <div key={stars} className="flex items-center gap-2">
                                <span className="w-8 text-[10px] font-bold text-slate-400 text-right">{stars} Star</span>
                                <div className="flex-1 h-1.5 rounded-full bg-slate-900 overflow-hidden border border-slate-850">
                                  <div className="h-full bg-sky-500 rounded-full" style={{ width: `${percentage}%` }} />
                                </div>
                                <span className="w-6 text-[10px] text-slate-500 text-left font-mono">{count}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {reviewsData.reviews.length === 0 ? (
                        <p className="text-xs text-slate-500 italic">No reviews have been written for this product yet.</p>
                      ) : (
                        <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                          {reviewsData.reviews.map((r) => (
                            <div key={r.id} className="p-3 bg-slate-950/20 rounded-xl border border-slate-900 space-y-1.5 text-xs">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-extrabold text-slate-200">{r.title}</p>
                                  <p className="text-[10px] text-slate-500">By {r.customer.name} · {new Date(r.createdAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
                                </div>
                                <div className="flex text-amber-450">
                                  {[...Array(5)].map((_, idx) => (
                                    <Star
                                      key={idx}
                                      className={`w-3 h-3 ${
                                        idx < r.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-800'
                                      }`}
                                    />
                                  ))}
                                </div>
                              </div>
                              <p className="text-slate-400 text-xxs font-sans">{r.comment}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {reviewsData.canReview && (
                        <form onSubmit={handleReviewSubmit} className="p-4 bg-slate-950/60 rounded-2xl border border-slate-900 space-y-3">
                          <h4 className="text-xs font-bold text-slate-250 uppercase tracking-widest font-mono">Submit Product Review</h4>
                          {reviewError && (
                            <div className="text-xxs text-rose-450 font-bold font-mono">{reviewError}</div>
                          )}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <label className="text-[10px] text-slate-400 space-y-1">
                              <span className="font-bold block">Rating Score (1-5)</span>
                              <select
                                value={reviewRating}
                                onChange={(e) => setReviewRating(Number(e.target.value))}
                                className="w-full rounded-lg border border-slate-850 bg-[#090f1d] px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                              >
                                <option value="5">5 - Excellent Quality</option>
                                <option value="4">4 - Good Design</option>
                                <option value="3">3 - Satisfactory</option>
                                <option value="2">2 - Needs Improvement</option>
                                <option value="1">1 - Poor Experience</option>
                              </select>
                            </label>
                            <label className="text-[10px] text-slate-400 space-y-1">
                              <span className="font-bold block">Review Title</span>
                              <input
                                value={reviewTitle}
                                onChange={(e) => setReviewTitle(e.target.value)}
                                className="w-full rounded-lg border border-slate-850 bg-[#090f1d] px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                                placeholder="Summary of your review"
                              />
                            </label>
                          </div>
                          <label className="block text-[10px] text-slate-400 space-y-1">
                            <span className="font-bold block">Your Comments</span>
                            <textarea
                              value={reviewComment}
                              onChange={(e) => setReviewComment(e.target.value)}
                              rows={2}
                              className="w-full rounded-lg border border-slate-850 bg-[#090f1d] px-2.5 py-1.5 text-xs text-slate-200 outline-none"
                              placeholder="Describe your purchase and product experience..."
                            />
                          </label>
                          <button
                            type="submit"
                            disabled={submittingReview}
                            className="rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs px-4 py-2 uppercase tracking-wide cursor-pointer disabled:opacity-50"
                          >
                            {submittingReview ? 'Submitting...' : 'Post Review'}
                          </button>
                        </form>
                      )}
                    </div>
                  ) : (
                    <div className="flex justify-center items-center py-6 text-slate-500 font-mono text-xxs">
                      <Loader2 className="w-4 h-4 animate-spin mr-1.5 text-sky-400" />
                      <span>Retrieving reviews data...</span>
                    </div>
                  )}
                </div>

              </div>

              {/* Footer buttons */}
              <div className="flex justify-end gap-3 p-5 border-t border-slate-900 bg-slate-950/20">
                <button
                  onClick={() => handleToggleWishlist(selectedProduct.id, selectedProduct.name)}
                  className={`px-4 py-2 rounded-xl font-bold text-xxs transition-colors border cursor-pointer ${
                    wishlist.includes(selectedProduct.id)
                      ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20'
                      : 'bg-slate-900 border-slate-800 text-slate-455 hover:text-rose-450'
                  }`}
                >
                  {wishlist.includes(selectedProduct.id) ? 'In Wishlist' : 'Add to Wishlist'}
                </button>
                <button
                  onClick={() => {
                    handleAddToCart(selectedProduct);
                    if (includeBundle && relatedProducts.length > 0) {
                      handleAddToCart(relatedProducts[0]);
                    }
                    setSelectedProduct(null);
                  }}
                  disabled={isOutofStock}
                  className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs transition-colors cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>{includeBundle ? 'Add Bundle to Cart' : 'Add Item to Cart'}</span>
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Product Specification Comparison Drawer */}
      {showCompareDrawer && compareList.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-50 bg-[#090f1d] border-t border-slate-850 shadow-2xl p-5 md:p-6 transition-transform">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex justify-between items-center border-b border-slate-900 pb-3">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-indigo-400" />
                <h3 className="text-xs font-bold text-slate-200 uppercase tracking-widest font-mono">
                  Product Comparison Matrix ({compareList.length} / 4)
                </h3>
              </div>
              <div className="flex items-center gap-3">
                <Link
                  href="/customer/compare"
                  className="px-3 py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-[10px] font-bold cursor-pointer"
                >
                  Compare Matrix
                </Link>
                <button
                  onClick={() => {
                    setCompareList([]);
                    localStorage.removeItem('customer_portal_compare');
                  }}
                  className="text-xxs font-bold text-rose-400 hover:underline cursor-pointer"
                >
                  Clear all
                </button>
                <button
                  onClick={() => setShowCompareDrawer(false)}
                  className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 overflow-x-auto">
              {compareList.map((product) => {
                const { rating, imgUrl } = getProductEnhancements(product);
                return (
                  <div key={product.id} className="bg-slate-950/60 p-3 rounded-xl border border-slate-900 relative space-y-2.5">
                    <button
                      onClick={() => handleToggleCompare(product)}
                      className="absolute top-2 right-2 text-slate-500 hover:text-rose-450 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <div className="h-16 rounded-lg bg-slate-900 flex items-center justify-center">
                      <img src={imgUrl} alt={product.name} className="h-12 object-contain" />
                    </div>
                    <div className="text-[10px] space-y-1 text-slate-300">
                      <p className="font-extrabold truncate text-slate-200">{product.name}</p>
                      <p className="text-sky-400 font-bold">{currency(product.sellingPrice)}</p>
                      <p className="text-slate-500 truncate">SKU: {product.sku}</p>
                      <p className="truncate">Wood: <span className="text-slate-400">{product.material}</span></p>
                      <p className="truncate">Size: <span className="text-slate-400">{product.dimensions}</span></p>
                      <p className="truncate">Warranty: <span className="text-slate-400">{product.warranty}</span></p>
                    </div>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="w-full py-1 bg-sky-500 hover:bg-sky-600 text-white rounded text-[10px] font-bold"
                    >
                      Add to Cart
                    </button>
                  </div>
                );
              })}
              {[...Array(Math.max(0, 4 - compareList.length))].map((_, i) => (
                <div key={i} className="hidden md:flex border border-dashed border-slate-800 rounded-xl items-center justify-center text-slate-600 text-[10px] font-mono h-[180px]">
                  Add item to compare
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Helpers
function SlidersHorizontalIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <line x1="4" x2="20" y1="21" y2="21" />
      <line x1="4" x2="14" y1="14" y2="14" />
      <line x1="4" x2="8" y1="7" y2="7" />
      <line x1="12" x2="20" y1="7" y2="7" />
      <line x1="18" x2="20" y1="14" y2="14" />
      <circle cx="10" cy="7" r="2" />
      <circle cx="16" cy="14" r="2" />
      <circle cx="12" cy="21" r="2" />
    </svg>
  );
}
