'use client';

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';

// Pages & Layouts
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PosTerminalPage } from '@/pages/POS/PosTerminalPage';
import { PrintDesignerStudio } from '@/components/print-designer/PrintDesignerStudio';
import { ProductsPage } from '@/pages/Inventory/ProductsPage';
import { InvoicesPage } from '@/pages/Sales/InvoicesPage';
import { SuppliersPage } from '@/pages/Purchasing/SuppliersPage';
import { TeamManagementPage } from '@/pages/Team/TeamManagementPage';
import { PaymentGatewaysPage } from '@/pages/Settings/PaymentGatewaysPage';
import { ReportsPage } from '@/pages/Reports/ReportsPage';
import { SettingsPage } from '@/pages/Settings/SettingsPage';
import { GuidedSetupPage } from '@/pages/Onboarding/GuidedSetupPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { SignupPage } from '@/pages/Auth/SignupPage';

const queryClient = new QueryClient();

// Protected Route Guard — waits for the initial Supabase session restore,
// then redirects unauthenticated users to /login.
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, authReady } = useAuthStore();

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center font-mono text-xs text-slate-400">
        RESTORING SESSION...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  const initAuth = useAuthStore((s) => s.initAuth);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Entrypoint */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />

          {/* Onboarding requires a signed-in user (it creates real DB rows) */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <GuidedSetupPage />
              </ProtectedRoute>
            }
          />

          {/* Protected Dashboard Application Shell */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/pos" replace />} />
            <Route path="pos" element={<PosTerminalPage />} />
            <Route path="print-designer" element={<PrintDesignerStudio />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="team" element={<TeamManagementPage />} />
            <Route path="payment-gateways" element={<PaymentGatewaysPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
