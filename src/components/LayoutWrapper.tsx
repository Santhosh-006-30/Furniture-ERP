'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useStore } from '../lib/store';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  TrendingUp,
  Settings,
  Users,
  History,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  Hammer,
  Truck,
  FileSpreadsheet,
  UserRound,
  Tag,
  RotateCcw,
  BarChart2,
  FileText,
  Clock,
  User as UserIcon,
  ChevronRight
} from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sidebarOpen, toggleSidebar, clearAuth, setAuth } = useStore();

  const isCustomerRoute = pathname === '/customer' || pathname.startsWith('/customer/');
  const isAuthPage =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/session-expired');

  useEffect(() => {
    if (isCustomerRoute) return;

    const storedUser = localStorage.getItem('mini_erp_user');
    const storedToken = localStorage.getItem('mini_erp_token');
    if (storedUser && storedToken) {
      try {
        const parsedUser = JSON.parse(storedUser);
        if (parsedUser.role === 'CUSTOMER') {
          clearAuth();
          router.push('/customer/login');
          return;
        }
        setAuth(parsedUser, storedToken);
      } catch (e) {
        clearAuth();
      }
    } else if (!isAuthPage) {
      router.push('/login');
    }
  }, [pathname, isAuthPage, isCustomerRoute]);

  // Listen for session-expiry events fired by the api-client on 401 responses
  useEffect(() => {
    function handleSessionExpired(e: Event) {
      const isCustomer = (e as CustomEvent).detail?.customer;
      clearAuth();
      if (isCustomer) {
        router.push('/customer/login');
      } else {
        router.push('/login');
      }
    }
    window.addEventListener('erp:session-expired', handleSessionExpired);
    return () => window.removeEventListener('erp:session-expired', handleSessionExpired);
  }, []);

  if (isAuthPage || isCustomerRoute) {
    return <>{children}</>;
  }

  const menuItems = [
    { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, roles: ['ADMIN', 'SALES', 'PURCHASE', 'MANUFACTURING', 'INVENTORY', 'OWNER'] },
    { name: 'Analytics', path: '/analytics', icon: BarChart2, roles: ['ADMIN', 'OWNER', 'SALES'] },
    { name: 'Products', path: '/products', icon: Package, roles: ['ADMIN', 'SALES', 'MANUFACTURING', 'INVENTORY', 'OWNER'] },
    { name: 'Customers', path: '/customers', icon: UserRound, roles: ['ADMIN', 'SALES', 'OWNER'] },
    { name: 'Sales', path: '/sales', icon: ShoppingCart, roles: ['ADMIN', 'SALES', 'OWNER'] },
    { name: 'Coupons', path: '/coupons', icon: Tag, roles: ['ADMIN', 'OWNER'] },
    { name: 'Returns', path: '/returns', icon: RotateCcw, roles: ['ADMIN', 'SALES', 'OWNER'] },
    { name: 'Purchase', path: '/purchase', icon: TrendingUp, roles: ['ADMIN', 'PURCHASE', 'OWNER'] },
    { name: 'Manufacturing', path: '/manufacturing', icon: Hammer, roles: ['ADMIN', 'MANUFACTURING', 'OWNER'] },
    { name: 'BoM', path: '/bom', icon: FileSpreadsheet, roles: ['ADMIN', 'MANUFACTURING', 'OWNER'] },
    { name: 'Inventory', path: '/inventory', icon: Truck, roles: ['ADMIN', 'INVENTORY', 'OWNER'] },
    { name: 'Reports', path: '/reports', icon: FileText, roles: ['ADMIN', 'OWNER', 'SALES', 'PURCHASE', 'MANUFACTURING', 'INVENTORY'] },
    { name: 'Audit Logs', path: '/audit', icon: History, roles: ['ADMIN', 'OWNER'] },
    { name: 'Users', path: '/users', icon: Users, roles: ['ADMIN', 'OWNER'] },
    { name: 'Settings', path: '/settings', icon: Settings, roles: ['ADMIN'] }
  ];

  const filteredMenuItems = menuItems.filter(item => {
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Simple Breadcrumbs calculation
  const segments = pathname.split('/').filter(Boolean);

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0f1d] text-slate-100 font-sans">
      {/* Sidebar with Glassmorphism & transitions */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 w-64 glass-panel border-r border-slate-800/80 transition-transform duration-250 ease-in-out md:translate-x-0 md:static ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full bg-[#0a0f1d]/40">
          {/* Logo Section */}
          <div className="flex items-center justify-between h-16 px-6 border-b border-slate-800/50">
            <Link href="/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span className="font-black text-sm tracking-widest bg-gradient-to-r from-blue-500 to-sky-400 bg-clip-text text-transparent">
                SHIV FURNITURE
              </span>
            </Link>
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg md:hidden hover:bg-slate-800/40" aria-label="Close sidebar">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
            {filteredMenuItems.map((item) => {
              const isActive = pathname === item.path;
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center gap-3 px-3.5 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600/10 text-blue-400 border-l-2 border-blue-500 shadow-sm shadow-blue-600/5'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/40'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* User Profile Info section */}
          <div className="p-4 border-t border-slate-800/50 bg-[#070b14]/30">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-sky-400 flex items-center justify-center font-bold text-xs uppercase shadow-inner text-white">
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Loading...'}</p>
                <span className="inline-block mt-0.5 px-1.5 py-0.5 text-[9px] font-black tracking-wide rounded bg-blue-500/10 text-blue-400 uppercase">
                  {user?.role || 'Guest'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-4 rounded-xl text-xs font-bold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log out</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top Header Navigation (Glassmorphic) */}
        <header className="flex items-center justify-between h-16 px-6 glass-panel border-b border-slate-800/80 z-30 bg-[#0a0f1d]/40">
          <div className="flex items-center gap-4">
            <button
              onClick={toggleSidebar}
              className="p-2 rounded-xl border border-slate-800 bg-[#0a0f1d]/40 hover:bg-slate-900/40 text-slate-400 transition-colors"
              aria-label="Toggle sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
            
            {/* Breadcrumb / Location */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono">
              <Link href="/dashboard" className="hover:text-slate-350 transition-colors">ERP</Link>
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

          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-xs font-bold text-slate-400 font-mono" suppressHydrationWarning>
                {new Date().toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
              </span>
            </div>
            
            {/* Profile badge */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-800/80 bg-slate-900/10 text-slate-300">
              <UserIcon className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-xs font-semibold">{user?.name || 'Admin'}</span>
            </div>
          </div>
        </header>

        {/* Page Children Area */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#0a0f1d]">
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
