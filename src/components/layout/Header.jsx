import React, { useState, useRef, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { 
  Menu, 
  Bell, 
  ChevronDown, 
  LogOut, 
  ShieldCheck, 
  ExternalLink,
  CheckCheck,
  Building
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ROUTE_TITLES = {
  '/': { title: 'Dashboard Overview', breadcrumb: 'Dashboard' },
  '/inventory': { title: 'Product Catalog', breadcrumb: 'Products' },
  '/products': { title: 'Product Catalog', breadcrumb: 'Products' },
  '/categories': { title: 'Categories & Metals', breadcrumb: 'Categories' },
  '/orders': { title: 'Orders & Settlements', breadcrumb: 'Orders' },
  '/inquiries': { title: 'Inquiries & Buyback', breadcrumb: 'Inquiries' },
  '/customers': { title: 'Users', breadcrumb: 'Users' },
  '/admin-users': { title: 'Admin Users', breadcrumb: 'Admin Users' },
  '/coupons': { title: 'Coupons', breadcrumb: 'Coupons' },
  '/payments': { title: 'Payments & Transactions', breadcrumb: 'Payments' },
  '/spot-prices': { title: 'Precious Metals Spot Benchmark', breadcrumb: 'Spot Benchmark' },
  '/settings': { title: 'Settings', breadcrumb: 'Settings' },
};

export const Header = ({ onMobileMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { adminUser, notifications, markAllNotificationsRead, logout } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifOpen, setIsNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  const routeInfo = ROUTE_TITLES[location.pathname] || {
    title: 'Highlander Admin Console',
    breadcrumb: 'Console'
  };

  const unreadCount = notifications?.filter((n) => !n.read)?.length || 0;

  // Close popovers on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-30 h-16 bg-white border-b border-[#DCE5F0] px-4 sm:px-6 flex items-center justify-between transition-all shadow-xs">
      {/* Left: Mobile trigger & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={onMobileMenuClick}
          className="p-2 -ml-1 text-[#111827] hover:text-[#D6AD45] hover:bg-[#F5F8FC] rounded-lg lg:hidden cursor-pointer"
          aria-label="Open navigation sidebar"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div>
          {location.pathname === '/' ? (
            <h1 className="text-xl font-bold font-sans text-[#111827] tracking-tight">
              Dashboard
            </h1>
          ) : (
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Link to="/" className="text-[#64748B] hover:text-[#111827] transition-colors">
                Dashboard
              </Link>
              <span className="text-slate-300">/</span>
              <span className="text-[#111827] font-semibold font-sans">
                {routeInfo.breadcrumb || routeInfo.title}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Right: Notifications & Profile Dropdown */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Notifications Popover */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative p-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F5F8FC] rounded-xl transition-colors cursor-pointer"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-2xl shadow-elevated border border-[#DCE5F0] p-0 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="px-4 py-3 border-b border-[#DCE5F0] flex items-center justify-between bg-[#F5F8FC]">
                <span className="font-semibold text-xs text-[#111827] uppercase tracking-wider font-sans">
                  Notifications & Alerts
                </span>
                <div className="flex items-center gap-2">
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllNotificationsRead}
                      className="text-[11px] text-[#111827] hover:text-[#D6AD45] flex items-center gap-1 font-medium cursor-pointer"
                    >
                      <CheckCheck className="w-3.5 h-3.5" />
                      Mark read
                    </button>
                  )}
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotifOpen(false)}
                    className="text-[11px] text-[#64748B] hover:text-[#111827] underline"
                  >
                    View all
                  </Link>
                </div>
              </div>

              <div className="max-h-72 overflow-y-auto divide-y divide-[#DCE5F0]/60 text-xs">
                {(notifications || []).map((n) => (
                  <div
                    key={n.id}
                    className={`p-3.5 hover:bg-[#F5F8FC]/70 transition-colors ${
                      !n.read ? 'bg-amber-50/50' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-semibold text-[#111827]">{n.title}</p>
                      <span className="text-[10px] text-[#64748B] shrink-0">{n.time}</span>
                    </div>
                    <p className="text-[#64748B] mt-1 leading-relaxed">{n.detail}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[#F5F8FC] transition-colors border border-transparent hover:border-[#DCE5F0] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center border border-[#D6AD45] shadow-xs font-sans">
              AM
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#111827] leading-tight">
                {adminUser?.name || 'Alexander MacLeod'}
              </span>
              <span className="text-[10px] text-[#64748B] leading-tight">
                {adminUser?.role || 'Senior Numismatist & Vault Director'}
              </span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#64748B] hidden sm:block" />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-[#DCE5F0] p-2 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-[#DCE5F0]">
                <p className="text-xs font-bold text-[#111827] font-sans">{adminUser?.name || 'Alexander MacLeod'}</p>
                <p className="text-[11px] text-[#64748B]">{adminUser?.email || 'admin@highlandergoldsilver.com'}</p>
                <div className="mt-2 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F8FC] text-[#111827] text-[10px] font-semibold border border-[#DCE5F0] font-sans">
                  <ShieldCheck className="w-3 h-3 text-[#D6AD45]" />
                  {adminUser?.role || 'Vault Director'}
                </div>
              </div>

              <div className="py-1">
                <div className="px-3 py-1.5 text-[11px] text-[#64748B] flex items-center gap-2">
                  <Building className="w-3.5 h-3.5 text-[#D6AD45]" />
                  <span>Bigfork, MT Storefront</span>
                </div>
                <a
                  href="https://highlander-gold-silver.vercel.app/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-3 py-2 text-xs text-[#111827] hover:bg-[#F5F8FC] rounded-lg transition-colors"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-[#D6AD45]" />
                  <span>Public Website</span>
                </a>
              </div>

              <div className="pt-1 border-t border-[#DCE5F0]">
                <button
                  onClick={async () => {
                    await logout();
                    setIsProfileOpen(false);
                    navigate('/login');
                  }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
