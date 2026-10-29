import React, { useState, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { LoadingScreen } from '../ui/LoadingScreen';

export const DashboardLayout = () => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-[#111827] flex font-sans">
      {/* Left fixed / responsive sidebar */}
      <Sidebar
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Right side main content area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out ${
          isCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        {/* Top Header */}
        <Header onMobileMenuClick={() => setIsMobileOpen(true)} />

        {/* Dynamic page content routed by React Router DOM */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full max-w-[1600px] mx-auto bg-white">
          <Suspense fallback={<LoadingScreen fullScreen={false} message="Loading module..." />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
    </div>
  );
};
