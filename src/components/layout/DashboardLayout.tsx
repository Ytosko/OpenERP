'use client';

import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/useAuthStore';
import {
  Terminal,
  ShoppingCart,
  Printer,
  Package,
  FileText,
  Users,
  Settings,
  LogOut,
  ChevronDown,
  Sparkles,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { user, activeProject, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: 'POS Terminal', path: '/pos', icon: ShoppingCart },
    { label: 'Print Designer', path: '/print-designer', icon: Printer },
    { label: 'Products & Inventory', path: '/products', icon: Package },
    { label: 'Sales & Invoices', path: '/invoices', icon: FileText },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar Navigation */}
      <aside className="w-full md:w-64 bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col justify-between shrink-0 font-mono text-xs">
        <div>
          {/* App Branding Header */}
          <div className="p-4 border-b border-slate-800 flex items-center gap-3">
            <div className="w-9 h-9 bg-brand-500 text-white rounded-lg flex items-center justify-center shadow-hacker-orange shrink-0">
              <Terminal className="w-5 h-5" />
            </div>
            <div className="truncate">
              <h1 className="font-bold text-white tracking-tight text-sm">MODULAR AI POS</h1>
              <p className="text-[10px] text-slate-400">Print Engine & ERP</p>
            </div>
          </div>

          {/* Active Project Switcher */}
          <div className="p-3 border-b border-slate-800 bg-slate-950/50">
            <div className="text-[9px] text-slate-500 font-bold mb-1 uppercase">ACTIVE PROJECT STORE</div>
            <div className="flex items-center justify-between text-white font-bold bg-slate-800/80 p-2 rounded border border-slate-700">
              <span className="truncate">{activeProject?.name || 'Hacker Mart Store'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </div>
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
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </div>

        {/* User Footer & Logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-500 flex items-center justify-center font-bold text-xs">
              {user?.email?.charAt(0).toUpperCase() || 'A'}
            </div>
            <div className="truncate flex-1">
              <div className="font-bold text-white text-[11px] truncate">
                {user?.user_metadata?.full_name || user?.email || 'Alex Cashier'}
              </div>
              <div className="text-[9px] text-slate-400">Cashier Role</div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 border border-slate-800 rounded text-slate-400 hover:text-red-400 hover:border-red-900 hover:bg-red-950/20 transition-all cursor-pointer"
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
