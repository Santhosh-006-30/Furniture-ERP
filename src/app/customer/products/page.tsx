'use client';

import React, { useState, useEffect } from 'react';
import { Search, SlidersHorizontal, Info, ShoppingCart, Loader2, ArrowUpDown, Tag, InfoIcon, CheckCircle2 } from 'lucide-react';

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

export default function CustomerProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Search & Filter state
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState('name_asc');
  const [priceMax, setPriceMax] = useState<number | ''>('');
  const [instockOnly, setInstockOnly] = useState(false);
  
  // Selected product for Details Dialog
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [toastMessage, setToastMessage] = useState('');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    fetchProducts();
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

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3000);
  };

  // Apply filters, search and sort
  const filteredProducts = products
    .filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
      const matchesPrice = priceMax === '' ? true : p.sellingPrice <= Number(priceMax);
      const matchesStock = instockOnly ? p.freeQty > 0 : true;
      return matchesSearch && matchesPrice && matchesStock;
    })
    .sort((a, b) => {
      if (sort === 'name_asc') return a.name.localeCompare(b.name);
      if (sort === 'price_asc') return a.sellingPrice - b.sellingPrice;
      if (sort === 'price_desc') return b.sellingPrice - a.sellingPrice;
      return 0;
    });

  // Pagination calculation
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredProducts.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="space-y-6 relative font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-xl bg-sky-500 text-white font-bold text-xs shadow-lg shadow-sky-500/25 animate-bounce">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
            Finished Furniture Catalog
          </h1>
          <p className="text-slate-400 text-xs mt-1">
            Browse our curated collection of premium hardwood tables, chairs, and custom furniture.
          </p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
          <input
            type="text"
            placeholder="Search by name, SKU..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            className="w-full glass-input pl-9 pr-4 py-2 rounded-xl text-xs"
          />
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
            In-Stock Items Only
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
        <div className="glass-panel p-8 text-center rounded-2xl border border-slate-800/80 text-rose-400 text-xs">
          <span>{error}</span>
        </div>
      ) : currentItems.length === 0 ? (
        <div className="glass-panel p-12 text-center rounded-2xl border border-slate-800/80 text-slate-500 text-xs font-mono">
          <span>No products found matching filters.</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {currentItems.map((product) => (
              <div key={product.id} className="glass-panel p-4 rounded-2xl border border-slate-800/80 hover:border-slate-700/60 transition-all flex flex-col group">
                {/* Image Placeholder */}
                <div className="h-40 rounded-xl bg-gradient-to-br from-slate-900 to-slate-950 flex items-center justify-center relative overflow-hidden mb-4 border border-slate-900">
                  <div className="absolute inset-0 bg-sky-500/5 group-hover:bg-sky-500/10 transition-colors pointer-events-none" />
                  <span className="text-xxs font-bold font-mono tracking-widest text-slate-600 uppercase">
                    {product.sku}
                  </span>
                </div>

                <div className="space-y-1.5 flex-1">
                  <h3 className="text-xs font-extrabold text-slate-200 group-hover:text-sky-400 transition-colors">
                    {product.name}
                  </h3>
                  <p className="text-[10px] text-slate-400 line-clamp-2">
                    {product.description}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 text-[9px] font-bold font-mono rounded bg-slate-900 text-slate-400">
                      SKU: {product.sku}
                    </span>
                    <span className={`px-2 py-0.5 text-[9px] font-bold font-mono rounded ${product.freeQty > 0 ? 'bg-emerald-500/10 text-emerald-450' : 'bg-amber-500/10 text-amber-400'}`}>
                      {product.freeQty > 0 ? `In Stock (${product.freeQty})` : 'Made-to-Order'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-900/65 mt-4 pt-3">
                  <div>
                    <span className="text-xxs text-slate-500 block font-mono">Price</span>
                    <span className="text-sm font-extrabold text-sky-400">
                      ₹{product.sellingPrice.toLocaleString()}
                    </span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedProduct(product)}
                      className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                      title="View specifications"
                    >
                      <Info className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleAddToCart(product)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs transition-colors cursor-pointer shadow-md shadow-sky-500/10"
                    >
                      <ShoppingCart className="w-3.5 h-3.5" />
                      <span>Add</span>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((c) => c - 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 transition-colors"
              >
                Previous
              </button>
              <span className="text-xxs font-mono text-slate-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((c) => c + 1)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-xs font-bold text-slate-300 transition-colors"
              >
                Next
              </button>
            </div>
          )}
        </div>
      )}

      {/* Specifications Details Dialog */}
      {selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="w-full max-w-lg glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800/80 shadow-2xl relative">
            <h2 className="text-lg font-extrabold text-slate-200 mb-2">
              {selectedProduct.name} Specs
            </h2>
            <span className="text-xxs font-mono text-slate-400 block mb-4 uppercase tracking-widest">
              Model SKU: {selectedProduct.sku}
            </span>

            <div className="space-y-4 text-xs">
              <p className="text-slate-350 bg-slate-900/40 p-3 rounded-xl border border-slate-900">
                {selectedProduct.description}
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <span className="text-xxs text-slate-500 block uppercase tracking-widest font-mono">Dimensions</span>
                  <span className="font-bold text-slate-300">{selectedProduct.dimensions}</span>
                </div>
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <span className="text-xxs text-slate-500 block uppercase tracking-widest font-mono">Material Wood</span>
                  <span className="font-bold text-slate-300">{selectedProduct.material}</span>
                </div>
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <span className="text-xxs text-slate-500 block uppercase tracking-widest font-mono">Warranty Policy</span>
                  <span className="font-bold text-slate-300">{selectedProduct.warranty}</span>
                </div>
                <div className="bg-slate-900/30 p-3 rounded-xl border border-slate-900">
                  <span className="text-xxs text-slate-500 block uppercase tracking-widest font-mono">Procurement lead time</span>
                  <span className="font-bold text-slate-300">{selectedProduct.leadTimeDays} Days</span>
                </div>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-sky-500/5 border border-sky-500/10 mt-2">
                <div>
                  <span className="text-xxs text-slate-500 block font-mono">Availability</span>
                  <span className="font-extrabold text-sky-400">
                    {selectedProduct.freeQty > 0 ? `${selectedProduct.freeQty} units ready in factory` : 'Custom build on demand'}
                  </span>
                </div>
                <div>
                  <span className="text-xxs text-slate-500 block font-mono">Unit Price</span>
                  <span className="font-extrabold text-slate-200">
                    ₹{selectedProduct.sellingPrice.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-900">
              <button
                onClick={() => setSelectedProduct(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 font-bold text-slate-350 text-xxs transition-colors cursor-pointer"
              >
                Close Dialog
              </button>
              <button
                onClick={() => {
                  handleAddToCart(selectedProduct);
                  setSelectedProduct(null);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xxs transition-colors cursor-pointer"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add Item to Cart</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
