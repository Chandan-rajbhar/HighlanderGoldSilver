import React, { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpotPriceProvider } from './context/SpotPriceContext';
import { DashboardLayout } from './components/layout/DashboardLayout';

// Lazy-loaded auth pages
const Login = lazy(() => import('./pages/Login').then(m => ({ default: m.Login })));
const SignUp = lazy(() => import('./pages/SignUp').then(m => ({ default: m.SignUp })));

// Lazy-loaded admin pages for high performance & minimal initial payload
const Dashboard = lazy(() => import('./pages/Dashboard').then(m => ({ default: m.Dashboard })));
const Inventory = lazy(() => import('./pages/Inventory').then(m => ({ default: m.Inventory })));
const Categories = lazy(() => import('./pages/Categories').then(m => ({ default: m.Categories })));
const Orders = lazy(() => import('./pages/Orders').then(m => ({ default: m.Orders })));
const Payments = lazy(() => import('./pages/Payments').then(m => ({ default: m.Payments })));
const Coupons = lazy(() => import('./pages/Coupons').then(m => ({ default: m.Coupons })));
const Customers = lazy(() => import('./pages/Customers').then(m => ({ default: m.Customers })));
const Inquiries = lazy(() => import('./pages/Inquiries').then(m => ({ default: m.Inquiries })));
const Notifications = lazy(() => import('./pages/Notifications').then(m => ({ default: m.Notifications })));
const AdminUsers = lazy(() => import('./pages/AdminUsers').then(m => ({ default: m.AdminUsers })));
const SpotPrices = lazy(() => import('./pages/SpotPrices').then(m => ({ default: m.SpotPrices })));
const Settings = lazy(() => import('./pages/Settings').then(m => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/NotFound').then(m => ({ default: m.NotFound })));

// Sleek loading skeleton fallback
const PageLoader = () => (
  <div className="flex flex-col items-center justify-center min-h-[400px] gap-3">
    <div className="w-10 h-10 border-3 border-aubergine-border border-t-gold rounded-full animate-spin" />
    <span className="text-xs font-serif font-bold text-slate-500 uppercase tracking-widest">
      Highlander Console Loading...
    </span>
  </div>
);

// Protected route guard for console administration
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export const App = () => {
  return (
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          <SpotPriceProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                {/* Public Authentication Screens */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<SignUp />} />

                {/* Primary Admin Console Layout: Protected Session Required */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<Inventory />} />
                  <Route path="inventory" element={<Inventory />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="orders" element={<Orders />} />
                  <Route path="payments" element={<Payments />} />
                  <Route path="coupons" element={<Coupons />} />
                  <Route path="customers" element={<Customers />} />
                  <Route path="inquiries" element={<Inquiries />} />
                  <Route path="notifications" element={<Notifications />} />
                  <Route path="admin-users" element={<AdminUsers />} />
                  <Route path="spot-prices" element={<SpotPrices />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Route>
              </Routes>
            </Suspense>
          </SpotPriceProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
