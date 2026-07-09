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
  FileText
} from 'lucide-react';

interface LayoutWrapperProps {
  children: React.ReactNode;
}

export default function LayoutWrapper({ children }: LayoutWrapperProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, sidebarOpen, toggleSidebar, clearAuth, setAuth } = useStore();

  const isCustomerRoute = pathname.startsWith('/customer');
  const isAuthPage =
    pathname.includes('/login') ||
    pathname.includes('/register') ||
    pathname.includes('/forgot-password') ||
    pathname.includes('/session-expired');

  useEffect(() => {
    if (isCustomerRoute) return;

    // Initialise auth cache
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
            <Link href="/dashboard" className="flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-sky-400" />
              <span className="font-extrabold text-base tracking-wide bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                SHIV FURNITURE
              </span>
            </Link>
            <button onClick={toggleSidebar} className="p-1.5 rounded-lg md:hidden hover:bg-slate-800">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
            {filteredMenuItems.map((item) => {
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
                {user?.name?.slice(0, 2) || 'US'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">{user?.name || 'Loading...'}</p>
                <span className="inline-block mt-0.5 px-2 py-0.5 text-[9px] font-bold font-mono tracking-wide rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 uppercase">
                  {user?.role || 'Guest'}
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
              onClick={toggleSidebar}
              className="p-2 rounded-xl border border-slate-800 hover:bg-slate-900 text-slate-400 transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest font-mono">
                Control Center
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
          <div className="max-w-7xl mx-auto space-y-8 animate-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
