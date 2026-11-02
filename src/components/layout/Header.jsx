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
import { NotificationDrawer } from './NotificationDrawer';

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
  '/notifications': { title: 'Notifications & Vault Feeds', breadcrumb: 'Notifications' },
};

export const Header = ({ onMobileMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { 
    adminUser, 
    notifications, 
    markAllNotificationsRead, 
    markNotificationRead, 
    deleteNotification,
    logout 
  } = useAuth();

  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  const profileRef = useRef(null);

  const isViewAdmin = location.pathname === '/customers' && new URLSearchParams(location.search).get('view') === 'admin';
  const routeInfo = isViewAdmin
    ? { title: 'Administrative Staff Profile', breadcrumb: 'Admin Profile' }
    : (ROUTE_TITLES[location.pathname] || {
        title: 'Highlander Admin Console',
        breadcrumb: 'Console'
      });

  const unreadCount = notifications?.filter((n) => !n.read)?.length || 0;

  const userInitials = React.useMemo(() => {
    if (!adminUser?.name) return 'HG';
    const parts = adminUser.name.trim().split(' ').filter(Boolean);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return adminUser.name.slice(0, 2).toUpperCase();
  }, [adminUser?.name]);

  // Close profile on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setIsProfileOpen(false);
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
        {/* Notifications Slide-Over Drawer Trigger */}
        <button
          onClick={() => setIsNotifDrawerOpen(true)}
          className="relative p-2 text-[#64748B] hover:text-[#111827] hover:bg-[#F5F8FC] rounded-xl transition-all duration-200 cursor-pointer active:scale-95"
          aria-label="Open notifications drawer"
          title="Notifications & Alerts"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white shadow-xs animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Ultra-Luxury Slide-Over Notification Drawer */}
        <NotificationDrawer
          isOpen={isNotifDrawerOpen}
          onClose={() => setIsNotifDrawerOpen(false)}
          notifications={notifications}
          onMarkAllRead={markAllNotificationsRead}
          onMarkRead={markNotificationRead}
          onDeleteNotification={deleteNotification}
        />

        {/* User Profile Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-2 p-1.5 sm:px-2.5 sm:py-1.5 rounded-xl hover:bg-[#F5F8FC] transition-colors border border-transparent hover:border-[#DCE5F0] cursor-pointer"
          >
            <div className="w-8 h-8 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center border border-[#D6AD45] shadow-xs font-sans overflow-hidden shrink-0">
              {adminUser?.avatar_url ? (
                <img src={adminUser.avatar_url} alt="" className="w-full h-full object-cover" />
              ) : (
                userInitials
              )}
            </div>
            <div className="hidden sm:flex flex-col text-left">
              <span className="text-xs font-semibold text-[#111827] leading-tight">
                {adminUser?.name || 'Alexander MacLeod'}
              </span>
              <span className="text-[10px] text-[#64748B] leading-tight">
                {adminUser?.role || 'Senior Numismatist & Vault Director'}
              </span>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] transition-transform duration-200 ${isProfileOpen ? 'rotate-180' : ''}`} />
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-elevated border border-[#DCE5F0] p-2 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150">
              <div className="p-3 border-b border-[#DCE5F0] flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#111827] text-white font-bold text-xs flex items-center justify-center border border-[#D6AD45] shadow-xs font-sans overflow-hidden shrink-0">
                  {adminUser?.avatar_url ? (
                    <img src={adminUser.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    userInitials
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-[#111827] font-sans truncate">{adminUser?.name || 'Alexander MacLeod'}</p>
                  <p className="text-[11px] text-[#64748B] truncate">{adminUser?.email || 'admin@highlandergoldsilver.com'}</p>
                  <div className="mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F5F8FC] text-[#111827] text-[10px] font-semibold border border-[#DCE5F0] font-sans">
                    <ShieldCheck className="w-3 h-3 text-[#D6AD45]" />
                    {adminUser?.role || 'Vault Director'}
                  </div>
                </div>
              </div>

              <div className="py-1">
                <Link
                  to={{ pathname: '/customers', search: '?view=admin' }}
                  state={{ openAdminProfile: Date.now() }}
                  onClick={() => setIsProfileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-xs font-semibold text-[#111827] hover:bg-[#F5F8FC] rounded-lg transition-colors"
                >
                  <ShieldCheck className="w-3.5 h-3.5 text-[#D6AD45]" />
                  <span>View Admin Profile</span>
                </Link>
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
