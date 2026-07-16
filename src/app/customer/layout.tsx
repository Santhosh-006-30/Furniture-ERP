'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  History,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Heart,
  Layers,
  RotateCcw,
  ChevronRight,
  ShoppingBag
} from 'lucide-react';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [customerUser, setCustomerUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wishlistCount, setWishlistCount] = useState(0);

  const isAuthPage =
    pathname === '/customer/login' ||
    pathname === '/customer/register' ||
    pathname === '/customer/forgot-password';

  const fetchWishlistCount = useCallback(async (storedToken: string) => {
    try {
      const res = await fetch('/api/customer/wishlist?pageSize=1', {
        headers: { 'Authorization': `Bearer ${storedToken}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWishlistCount(data.pagination?.totalItems || 0);
      }
    } catch (e) {}
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [pathname]);

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    const storedUser = localStorage.getItem('customer_portal_user');
    const storedToken = localStorage.getItem('customer_portal_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'CUSTOMER') {
          router.push('/session-expired');
          return;
        }
        setCustomerUser(parsedUser);
        fetchWishlistCount(storedToken);
      } catch (e) {
        localStorage.removeItem('customer_portal_user');
        localStorage.removeItem('customer_portal_token');
        router.push('/customer/login');
      }
    } else {
      router.push('/customer/login');
    }
    setLoading(false);
  }, [pathname, isAuthPage, fetchWishlistCount, router]);

  if (isAuthPage) {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0f1d]">
        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/customer/products', icon: Package },
    { name: 'Cart', path: '/customer/cart', icon: ShoppingCart },
    { name: 'My Orders', path: '/customer/orders', icon: History },
    { name: 'Invoices', path: '/customer/invoices', icon: FileText },
    { name: 'Notifications', path: '/customer/notifications', icon: Bell },
    { name: 'Wishlist', path: '/customer/wishlist', icon: Heart, badge: wishlistCount > 0 ? wishlistCount : undefined },
    { name: 'Compare', path: '/customer/compare', icon: Layers },
    { name: 'Returns', path: '/customer/returns', icon: RotateCcw },
    { name: 'Profile', path: '/customer/profile', icon: User }
  ];

  const handleLogout = () => {
    localStorage.removeItem('customer_portal_user');
    localStorage.removeItem('customer_portal_token');
    router.push('/customer/login');
  };

  const segments = pathname.split('/').filter(Boolean).slice(1);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1d] text-slate-100 font-sans">
      {/* Sidebar with Glassmorphic design styling */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 transition-transform duration-250 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full bg-[#0a0f1d]/40">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/50">
            <Link href="/customer/dashboard" className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-500" />
              <span className="font-black text-sm tracking-widest bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
                SHIV CATALOG
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg md:hidden hover:bg-slate-800/40" aria-label="Close sidebar">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center justify-between px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-600/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge !== undefined && (
                    <span className="px-1.5 py-0.5 bg-blue-600 text-white rounded-full text-[9px] font-black">{item.badge}</span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Profile and logout buttons */}
          <div className="p-4 border-t border-slate-800/50 bg-[#070b14]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner text-white">
                {customerUser?.name?.slice(0, 2) || 'CS'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{customerUser?.name || 'Customer'}</p>
                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-black tracking-wide rounded bg-blue-500/10 text-blue-400 uppercase">
                  Buyer Account
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Sidebar Overlay/Backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden transition-opacity duration-250 cursor-pointer"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Glassmorphic Navbar */}
        <header className="flex items-center justify-between h-16 px-6 glass-panel border-b border-slate-800/80 z-30 bg-[#0a0f1d]/40">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 rounded-xl border border-slate-800 bg-[#0a0f1d]/40 hover:bg-slate-900/40 text-slate-400 transition-colors md:hidden"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            {/* Breadcrumb pathing */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Link href="/customer/dashboard" className="hover:text-slate-350 transition-colors">Catalog</Link>
              {segments.map((segment, idx) => (
                <React.Fragment key={segment}>
                  <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                  <span className={idx === segments.length - 1 ? 'text-slate-300 font-semibold' : ''}>
                    {segment.charAt(0).toUpperCase() + segment.slice(1)}
                  </span>
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Cart shortcut */}
            <Link href="/customer/cart" className="relative p-2 rounded-xl border border-slate-800 hover:bg-slate-850/50 text-slate-400 hover:text-slate-200 transition">
              <ShoppingCart className="w-4 h-4" />
            </Link>
            
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/80 bg-slate-900/10 text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold">{customerUser?.name || 'Account'}</span>
            </div>
          </div>
        </header>

        {/* Content Children */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0f1d]">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
