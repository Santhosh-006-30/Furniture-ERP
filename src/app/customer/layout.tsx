'use client';

import React, { useEffect, useState } from 'react';
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
  ShieldCheck
} from 'lucide-react';

interface CustomerLayoutProps {
  children: React.ReactNode;
}

export default function CustomerLayout({ children }: CustomerLayoutProps) {
  const pathname = usePathname();
  const router = useRouter();
  
  const [customerUser, setCustomerUser] = useState<{ id: string; name: string; email: string; role: string } | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  const isAuthPage =
    pathname === '/customer/login' ||
    pathname === '/customer/register' ||
    pathname === '/customer/forgot-password';

  useEffect(() => {
    if (isAuthPage) {
      setLoading(false);
      return;
    }

    // Initialise customer auth cache
    const storedUser = localStorage.getItem('customer_portal_user');
    const storedToken = localStorage.getItem('customer_portal_token');

    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role !== 'CUSTOMER') {
          // If ERP user tries to access customer pages -> show 403 or redirect
          router.push('/session-expired'); // or custom 403 page
          return;
        }
        setCustomerUser(parsedUser);
        setToken(storedToken);
      } catch (e) {
        localStorage.removeItem('customer_portal_user');
        localStorage.removeItem('customer_portal_token');
        router.push('/customer/login');
      }
    } else {
      router.push('/customer/login');
    }
    setLoading(false);
  }, [pathname, isAuthPage]);

  const menuItems = [
    { name: 'Dashboard', path: '/customer/dashboard', icon: LayoutDashboard },
    { name: 'Products', path: '/customer/products', icon: Package },
    { name: 'Cart', path: '/customer/cart', icon: ShoppingCart },
    { name: 'My Orders', path: '/customer/orders', icon: History },
    { name: 'Invoices', path: '/customer/invoices', icon: FileText },
    { name: 'Notifications', path: '/customer/notifications', icon: Bell },
    { name: 'Profile', path: '/customer/profile', icon: User }
  ];

  const handleLogout = () => {
    localStorage.removeItem('customer_portal_user');
    localStorage.removeItem('customer_portal_token');
    router.push('/customer/login');
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#060913] text-slate-400 font-mono text-sm">
        <span>Authenticating Customer Session...</span>
      </div>
    );
  }

  if (isAuthPage) {
    return <>{children}</>;
  }

  // Ensure layout is only shown for authenticated customers
  if (!customerUser) {
    return null;
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#060913] text-slate-100 font-sans">
      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-[#090e1a] border-r border-slate-800/80 transition-transform duration-300 transform md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/80 bg-[#0d1426]/20">
            <Link href="/customer/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                BUYER PORTAL
              </span>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg md:hidden hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {menuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-4 py-3 text-xs font-semibold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-sky-500/10 text-sky-400 border-l-4 border-sky-400 shadow-md shadow-sky-500/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-slate-800/80 bg-[#070b14]/50">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-500 flex items-center justify-center font-bold text-xs uppercase shadow-inner text-white">
                {customerUser.name?.slice(0, 2) || 'CS'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{customerUser.name || 'Customer'}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                  BUYER
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/10 hover:border-rose-500/20 transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Header */}
        <header className="flex items-center justify-between h-16 px-6 bg-[#090e1a]/60 backdrop-blur-md border-b border-slate-800/80 z-30">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 transition-colors md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                Customer Workspace
              </span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <span className="text-xxs text-slate-500 block font-mono">System Time</span>
              <span className="text-xs font-bold text-slate-350 font-mono">
                {new Date().toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
              </span>
            </div>
          </div>
        </header>

        {/* Page Children */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#060913]">
          <div className="max-w-7xl mx-auto space-y-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
