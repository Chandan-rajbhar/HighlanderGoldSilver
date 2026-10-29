import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastProvider } from './context/ToastContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SpotPriceProvider } from './context/SpotPriceContext';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { LoadingScreen } from './components/ui/LoadingScreen';

// Direct imports for instant, 0ms route transitions with zero network buffering
import { Login } from './pages/Login';
import { SignUp } from './pages/SignUp';
import { Dashboard } from './pages/Dashboard';
import { Inventory } from './pages/Inventory';
import { Categories } from './pages/Categories';
import { Orders } from './pages/Orders';
import { Payments } from './pages/Payments';
import { Coupons } from './pages/Coupons';
import { Customers } from './pages/Customers';
import { Inquiries } from './pages/Inquiries';
import { Notifications } from './pages/Notifications';
import { AdminUsers } from './pages/AdminUsers';
import { SpotPrices } from './pages/SpotPrices';
import { Settings } from './pages/Settings';
import { NotFound } from './pages/NotFound';

// Protected route guard for console administration
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoadingAuth } = useAuth();
  if (isLoadingAuth) {
    return <LoadingScreen fullScreen={true} message="Authenticating session..." />;
  }
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
          </SpotPriceProvider>
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

export default App;
