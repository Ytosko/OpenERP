'use client';

import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/useAuthStore';
import { supabase } from '@/lib/supabase';

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
import { GuidedSetupPage } from '@/pages/Onboarding/GuidedSetupPage';
import { LoginPage } from '@/pages/Auth/LoginPage';
import { SignupPage } from '@/pages/Auth/SignupPage';

const queryClient = new QueryClient();

export function App() {
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setAuth(session?.user ?? null, session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setAuth(session?.user ?? null, session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, [setAuth, setLoading]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Auth Routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<GuidedSetupPage />} />

          {/* Dashboard Application Shell */}
          <Route path="/" element={<DashboardLayout />}>
            <Route index element={<Navigate to="/pos" replace />} />
            <Route path="pos" element={<PosTerminalPage />} />
            <Route path="print-designer" element={<PrintDesignerStudio />} />
            <Route path="products" element={<ProductsPage />} />
            <Route path="invoices" element={<InvoicesPage />} />
            <Route path="suppliers" element={<SuppliersPage />} />
            <Route path="team" element={<TeamManagementPage />} />
            <Route path="payment-gateways" element={<PaymentGatewaysPage />} />
            <Route path="reports" element={<ReportsPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/pos" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
