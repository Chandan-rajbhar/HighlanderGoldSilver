import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Coins, 
  ShoppingBag, 
  MessageSquare, 
  ShieldCheck,
  Clock,
  ArrowRight,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useToast } from '../context/ToastContext';

export const Notifications = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadNotifications = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const data = await notificationService.fetchNotifications();
      if (Array.isArray(data)) {
        setNotifications(data);
        if (showToast) toast.success('Notifications synchronized from database');
      }
    } catch (err) {
      console.warn('Load notifications note:', err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    // 1. Instant synchronous local load
    setNotifications(notificationService.getNotifications());
    // 2. Fetch fresh data from database
    loadNotifications(false);
  }, []);

  const handleMarkAllRead = async () => {
    const updated = await notificationService.markAllAsRead();
    setNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const handleMarkRead = async (id) => {
    const updated = await notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleDelete = async (id) => {
    const updated = await notificationService.deleteNotification(id);
    setNotifications(updated);
    toast.info('Notification dismissed');
  };

  const formatRelativeTime = (dateOrStr) => {
    if (!dateOrStr) return 'Just now';
    if (typeof dateOrStr === 'string' && dateOrStr.includes('ago')) return dateOrStr;
    const d = new Date(dateOrStr);
    if (isNaN(d.getTime())) return dateOrStr;
    const now = new Date();
    const diffSec = Math.floor((now.getTime() - d.getTime()) / 1000);
    if (diffSec < 45) return 'Just now';
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs}h ago`;
    const diffDays = Math.floor(diffHrs / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // KPI summary metrics
  const stats = useMemo(() => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const inquiries = notifications.filter(n => (n.category || n.type || '').toLowerCase() === 'inquiry').length;
    const orders = notifications.filter(n => {
      const cat = (n.category || n.type || '').toLowerCase();
      return cat === 'wire' || cat === 'order';
    }).length;
    return { total, unread, inquiries, orders };
  }, [notifications]);

  // Filtered & searched notifications
  const filtered = useMemo(() => {
    return notifications.filter(n => {
      const cat = (n.category || n.type || '').toLowerCase();
      
      // Category / Tab filter
      if (filter === 'Unread' && n.read) return false;
      if (filter === 'Inquiries' && cat !== 'inquiry') return false;
      if (filter === 'Orders' && cat !== 'wire' && cat !== 'order') return false;
      if (filter === 'Inventory' && cat !== 'inventory') return false;

      // Text search filter
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase().trim();
        const titleMatch = (n.title || '').toLowerCase().includes(q);
        const detailMatch = (n.detail || '').toLowerCase().includes(q);
        const catMatch = cat.includes(q);
        return titleMatch || detailMatch || catMatch;
      }

      return true;
    });
  }, [notifications, filter, searchQuery]);

  const getCategoryMeta = (item) => {
    const cat = (item?.category || item?.type || '').toLowerCase();
    if (cat === 'inquiry') {
      return {
        label: 'Inquiry',
        icon: MessageSquare,
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/90',
        iconBg: 'bg-amber-100 text-amber-700',
        borderColor: 'border-l-[#C9A23A]',
        targetRoute: '/inquiries',
        actionLabel: 'View in Inquiries'
      };
    }
    if (cat === 'wire' || cat === 'order') {
      return {
        label: 'Settlement',
        icon: ShoppingBag,
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/90',
        iconBg: 'bg-emerald-100 text-emerald-700',
        borderColor: 'border-l-emerald-500',
        targetRoute: '/orders',
        actionLabel: 'View Order'
      };
    }
    if (cat === 'inventory') {
      return {
        label: 'Inventory',
        icon: Coins,
        badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200/90',
        iconBg: 'bg-blue-100 text-blue-700',
        borderColor: 'border-l-blue-500',
        targetRoute: '/inventory',
        actionLabel: 'Check Catalog'
      };
    }
    return {
      label: 'System Alert',
      icon: ShieldCheck,
      badgeStyle: 'bg-slate-100 text-slate-700 border-slate-200',
      iconBg: 'bg-slate-200 text-slate-700',
      borderColor: 'border-l-slate-400',
      targetRoute: '/notifications',
      actionLabel: 'Inspect Details'
    };
  };

  const handleCardNavigate = (n) => {
    if (!n.read) {
      handleMarkRead(n.id);
    }
    const meta = getCategoryMeta(n);
    navigate(meta.targetRoute);
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 font-sans">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52]">
              Notifications & Vault Feeds
            </h2>
            {stats.unread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#C9A23A] text-[#071A35] shadow-xs animate-pulse">
                {stats.unread} unread
              </span>
            )}
          </div>
          <p className="text-xs sm:text-sm text-[#64748B] mt-0.5">
            Real-time feed of storefront inquiries, bank wire settlements, inventory triggers, and security events.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {stats.unread > 0 && (
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5F0] text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-xs transition-colors cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5 text-[#C9A23A]" />
              <span>Mark All Read</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => loadNotifications(true)}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white border border-[#DCE5F0] hover:bg-slate-50 text-slate-700 text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            title="Refresh feeds from database"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-[#0B2D52] ${isRefreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Full-Width Interactive KPI Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full">
        {/* Total Notifications Card */}
        <div
          onClick={() => setFilter('All')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filter === 'All'
              ? 'border-[#155A96] ring-2 ring-[#155A96]/15 bg-[#F8FAFD]'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              All Feeds
            </span>
            <div className="w-8 h-8 rounded-xl bg-[#F4F9FD] text-[#155A96] border border-[#D8EBFA] flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52] mt-2">
            {stats.total}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Total recorded alerts
          </span>
        </div>

        {/* Unread Alerts Card */}
        <div
          onClick={() => setFilter('Unread')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filter === 'Unread'
              ? 'border-rose-500 ring-2 ring-rose-500/20 bg-rose-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              Unread Actionable
            </span>
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-rose-700 mt-2">
            {stats.unread}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Requires admin attention
          </span>
        </div>

        {/* Inquiries Card */}
        <div
          onClick={() => setFilter('Inquiries')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filter === 'Inquiries'
              ? 'border-[#C9A23A] ring-2 ring-[#C9A23A]/25 bg-amber-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              Customer Inquiries
            </span>
            <div className="w-8 h-8 rounded-xl bg-amber-50 text-[#C9A23A] border border-amber-200 flex items-center justify-center">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52] mt-2">
            {stats.inquiries}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Client messages & buyback
          </span>
        </div>

        {/* Orders & Settlements Card */}
        <div
          onClick={() => setFilter('Orders')}
          className={`p-4 sm:p-5 rounded-2xl bg-white border transition-all cursor-pointer shadow-xs hover:shadow-sm ${
            filter === 'Orders'
              ? 'border-emerald-600 ring-2 ring-emerald-500/20 bg-emerald-50/20'
              : 'border-[#E2EEF8] hover:border-[#CBD5E1]'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider font-sans">
              Settlements & Orders
            </span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <p className="text-xl sm:text-2xl font-bold font-serif text-[#0B2D52] mt-2">
            {stats.orders}
          </p>
          <span className="text-[11px] text-slate-400 mt-0.5 block">
            Bank wires & checkouts
          </span>
        </div>
      </div>

      {/* Control Toolbar: Filter Pills + Search Bar */}
      <div className="bg-white rounded-2xl border border-[#DCE5F0] p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3 w-full">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {[
            { id: 'All', label: 'All Feeds', count: stats.total },
            { id: 'Unread', label: 'Unread', count: stats.unread },
            { id: 'Inquiries', label: 'Inquiries', count: stats.inquiries },
            { id: 'Orders', label: 'Orders & Wires', count: stats.orders },
            { id: 'Inventory', label: 'Inventory' }
          ].map(f => {
            const isActive = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  isActive
                    ? 'bg-[#0B2D52] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <span>{f.label}</span>
                {f.count !== undefined && f.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-[#C9A23A] text-[#071A35]' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {f.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Live Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search alerts, inquiries, or names..."
            className="w-full pl-9 pr-4 py-1.5 bg-[#F8FAFC] border border-[#DCE5F0] rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-[#C9A23A] focus:bg-white transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* Full-Width Luxury Feed List */}
      <div className="bg-white rounded-2xl border border-[#DCE5F0] shadow-xs overflow-hidden divide-y divide-[#DCE5F0]/70 w-full">
        {filtered.length === 0 ? (
          <div className="py-20 px-4 text-center flex flex-col items-center justify-center">
            <div className="w-16 h-16 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-center justify-center text-[#C9A23A] mb-3 shadow-inner">
              <Bell className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800 font-serif">
              {searchQuery ? 'No matching notifications found' : 'All caught up!'}
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1 leading-relaxed">
              {searchQuery
                ? `No notifications found matching "${searchQuery}". Try a different keyword.`
                : 'There are no pending alerts in this filter view. All storefront feeds are up to date.'}
            </p>
          </div>
        ) : (
          filtered.map(n => {
            const meta = getCategoryMeta(n);
            const Icon = meta.icon;
            const isUnread = !n.read;

            return (
              <div 
                key={n.id}
                onClick={() => handleCardNavigate(n)}
                className={`group px-4 py-3 sm:px-5 sm:py-3.5 flex items-start justify-between gap-4 transition-all duration-150 cursor-pointer ${
                  isUnread 
                    ? 'bg-amber-50/20 hover:bg-amber-50/35 border-l-4 ' + meta.borderColor
                    : 'hover:bg-slate-50/80 border-l-4 border-l-transparent'
                }`}
              >
                {/* Left Section: Icon + Text Content */}
                <div className="flex items-start gap-4 min-w-0 flex-1">
                  {/* Category Luxury Icon */}
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg} shadow-2xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>

                  {/* Text Description */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border uppercase tracking-wider ${meta.badgeStyle}`}>
                        {meta.label}
                      </span>
                      
                      <span className={`font-bold text-sm font-sans ${isUnread ? 'text-[#071A35]' : 'text-slate-700'}`}>
                        {n.title}
                      </span>
                    </div>

                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      {n.detail}
                    </p>

                    <div className="flex items-center gap-3 text-[11px] text-slate-400 mt-2.5">
                      <span className="flex items-center gap-1 font-medium">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{formatRelativeTime(n.created_at || n.time)}</span>
                      </span>
                      <span className="text-slate-300">·</span>
                      <span className="text-[#0B2D52] group-hover:text-[#C9A23A] font-semibold flex items-center gap-1 transition-colors">
                        <span>{meta.actionLabel}</span>
                        <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Quick Action Icons */}
                <div 
                  className="flex items-center gap-1 shrink-0 self-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  {isUnread && (
                    <button
                      type="button"
                      onClick={() => handleMarkRead(n.id)}
                      className="p-2 text-slate-400 hover:text-[#0B2D52] hover:bg-slate-100 rounded-xl text-xs transition-colors cursor-pointer"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4 text-[#C9A23A]" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDelete(n.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl text-xs transition-colors cursor-pointer"
                    title="Dismiss"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};

export default Notifications;
