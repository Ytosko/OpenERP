'use client';

import React from 'react';
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

// Protected Route Guard (No auto-login, redirects unauthenticated users to /login)
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public Authentication Entrypoint */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/onboarding" element={<GuidedSetupPage />} />

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
