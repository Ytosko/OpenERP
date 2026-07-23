'use client';

import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import { usePrintDesignerStore } from '@/store/usePrintDesignerStore';
import { syncOfflineQueue, getOfflineQueue } from '@/lib/offline-sync';
import {
  Terminal,
  ShoppingCart,
  Printer,
  Package,
  FileText,
  Users,
  CreditCard,
  Truck,
  BarChart3,
  LogOut,
  ChevronDown,
  Wifi,
  WifiOff,
  RefreshCw,
  Building2,
  Sliders,
  Plus,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, activeProject, projects, selectProject, logout } = useAuthStore();
  const loadTemplatesFromDb = usePrintDesignerStore((s) => s.loadTemplatesFromDb);
  const navigate = useNavigate();

  // Saved print templates are used by POS receipts and invoice reprints,
  // so load them as soon as any dashboard page mounts.
  useEffect(() => {
    loadTemplatesFromDb();
  }, [activeProject?.id, loadTemplatesFromDb]);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [offlineCount, setOfflineCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      handleSync();
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    setOfflineCount(getOfflineQueue().length);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleSync = async () => {
    setSyncing(true);
    await syncOfflineQueue();
    setOfflineCount(getOfflineQueue().length);
    setSyncing(false);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'POS Terminal', path: '/pos', icon: ShoppingCart },
    { label: 'Print Designer', path: '/print-designer', icon: Printer },
    { label: 'Products & Inventory', path: '/products', icon: Package },
    { label: 'Sales & Invoices', path: '/invoices', icon: FileText },
    { label: 'Suppliers & Purchasing', path: '/suppliers', icon: Truck },
    { label: 'Team & Roles', path: '/team', icon: Users },
    { label: 'Payment Processors', path: '/payment-gateways', icon: CreditCard },
    { label: 'Financial Reports & Tax', path: '/reports', icon: BarChart3 },
    { label: 'Store Branding & SaaS', path: '/settings', icon: Building2 },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 font-mono text-xs">
        <div>
          {/* App Branding Header */}
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-hacker-orange shrink-0 font-bold">
                <Terminal className="w-5 h-5" />
              </div>
              <div className="truncate">
                <h1 className="font-bold text-white tracking-tight text-sm">INDUSTRIAL ERP</h1>
                <p className="text-[10px] text-slate-400">Commercial SaaS Edition</p>
              </div>
            </div>

            {/* Connection Status Badge */}
            <div className="flex items-center gap-1">
              {isOnline ? (
                <span className="flex items-center text-emerald-400 text-[9px] font-bold bg-emerald-950/60 border border-emerald-800 px-2 py-0.5 rounded-full" title="Connected online">
                  <Wifi className="w-3 h-3 mr-1" /> ONLINE
                </span>
              ) : (
                <span className="flex items-center text-amber-400 text-[9px] font-bold bg-amber-950/60 border border-amber-800 px-2 py-0.5 rounded-full" title="Offline mode">
                  <WifiOff className="w-3 h-3 mr-1" /> OFFLINE
                </span>
              )}
            </div>
          </div>

          {/* Offline Sync Banner if Pending Queue */}
          {offlineCount > 0 && (
            <div className="p-2.5 bg-amber-950/80 border-b border-amber-800 text-amber-300 flex items-center justify-between">
              <span>{offlineCount} Offline Sales Queued</span>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="p-1 hover:bg-amber-900 rounded text-amber-200 cursor-pointer"
                title="Sync now"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              </button>
            </div>
          )}

          {/* Active Multi-Branch Store Switcher */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/50 relative">
            <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase">ACTIVE BRANCH / STORE</div>
            <button
              onClick={() => setShowStoreDropdown(!showStoreDropdown)}
              className="w-full flex items-center justify-between text-white font-bold bg-slate-800/80 p-2 rounded border border-slate-700 hover:border-brand-500 cursor-pointer transition-all"
            >
              <span className="truncate">{activeProject?.name || 'No store yet'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Dropdown Menu for Store Branches (real memberships from Supabase) */}
            {showStoreDropdown && (
              <div className="absolute left-3 right-3 top-16 bg-slate-900 border border-slate-700 rounded-lg shadow-xl z-50 p-2 space-y-1">
                <div className="text-[9px] text-slate-500 font-bold px-2 py-1 uppercase">SWITCH STORE / PROJECT</div>
                {projects.length === 0 && (
                  <div className="p-2 text-slate-500 text-[10px]">
                    No stores found for your account.
                  </div>
                )}
                {projects.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      selectProject(s.id);
                      setShowStoreDropdown(false);
                    }}
                    className={`w-full text-left p-2 rounded text-xs font-bold transition-all flex items-center justify-between ${
                      activeProject?.id === s.id
                        ? 'bg-brand-500 text-white'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="truncate">{s.name}</span>
                    <span className="text-[9px] opacity-75 uppercase">{s.role}</span>
                  </button>
                ))}
                <button
                  onClick={() => {
                    setShowStoreDropdown(false);
                    navigate('/onboarding');
                  }}
                  className="w-full text-left p-2 rounded text-xs font-bold text-brand-400 hover:bg-slate-800 flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create new store
                </button>
              </div>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="p-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `flex items-center gap-3 px-3 py-2.5 rounded-lg font-semibold transition-all ${
                      isActive
                        ? 'bg-brand-500 text-white shadow-hacker-orange'
                        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                    }`
                  }
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span className="truncate">{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-xs">
              {user?.full_name?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate flex-1">
              <div className="font-bold text-white text-[11px] truncate">
                {user?.full_name || user?.employee_code || 'Super Admin'}
              </div>
              <div className="text-[9px] text-slate-400 uppercase">Role: {user?.role || 'Owner'}</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 rounded text-slate-400 hover:text-red-400 hover:border-red-900 hover:bg-red-950/20 transition-all cursor-pointer font-bold"
          >
            <LogOut className="w-3.5 h-3.5" /> LOG OUT
          </button>
        </div>
      </aside>

      {/* Main Screen Content View */}
      <main className="flex-1 p-4 md:p-6 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};
