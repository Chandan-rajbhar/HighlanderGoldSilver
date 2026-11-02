import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  X, 
  CheckCheck, 
  Trash2, 
  ExternalLink, 
  Clock, 
  MessageSquare, 
  ShoppingBag, 
  Coins, 
  ShieldCheck, 
  ArrowRight,
  Bell,
  Sparkles,
  Inbox
} from 'lucide-react';

export const NotificationDrawer = ({
  isOpen,
  onClose,
  notifications = [],
  onMarkAllRead,
  onMarkRead,
  onDeleteNotification
}) => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('All');

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const unreadCount = useMemo(() => {
    return notifications.filter(n => !n.read).length;
  }, [notifications]);

  // Compute category counts for tab badges
  const counts = useMemo(() => {
    return {
      all: notifications.length,
      inquiries: notifications.filter(n => (n.category || n.type || '').toLowerCase() === 'inquiry').length,
      orders: notifications.filter(n => {
        const cat = (n.category || n.type || '').toLowerCase();
        return cat === 'wire' || cat === 'order';
      }).length,
      inventory: notifications.filter(n => (n.category || n.type || '').toLowerCase() === 'inventory').length,
      unread: notifications.filter(n => !n.read).length
    };
  }, [notifications]);

  // Filtered notifications
  const filteredNotifications = useMemo(() => {
    return notifications.filter(n => {
      const cat = (n.category || n.type || '').toLowerCase();
      if (activeTab === 'Unread') return !n.read;
      if (activeTab === 'Inquiries') return cat === 'inquiry';
      if (activeTab === 'Orders') return cat === 'wire' || cat === 'order';
      if (activeTab === 'Inventory') return cat === 'inventory';
      return true;
    });
  }, [notifications, activeTab]);

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

  const handleCardClick = (n) => {
    if (onMarkRead && !n.read) {
      onMarkRead(n.id);
    }
    onClose();
    const cat = (n.category || n.type || '').toLowerCase();
    const title = (n.title || '').toLowerCase();
    if (cat === 'inquiry' || title.includes('inquiry')) {
      navigate('/inquiries');
    } else if (cat === 'wire' || cat === 'order' || title.includes('settlement')) {
      navigate('/orders');
    } else if (cat === 'inventory' || title.includes('stock')) {
      navigate('/inventory');
    } else {
      navigate('/notifications');
    }
  };

  const getCategoryMeta = (item) => {
    const cat = (item?.category || item?.type || '').toLowerCase();
    if (cat === 'inquiry') {
      return {
        label: 'Inquiry',
        icon: MessageSquare,
        badgeStyle: 'bg-amber-50 text-amber-800 border-amber-200/80',
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
        badgeStyle: 'bg-emerald-50 text-emerald-800 border-emerald-200/80',
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
        badgeStyle: 'bg-blue-50 text-blue-800 border-blue-200/80',
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden font-sans">
      {/* Ambient Backdrop Blur Overlay */}
      <div 
        className="fixed inset-0 bg-[#0B2348]/45 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 flex max-w-full pl-6 sm:pl-10">
        {/* Right Slide-Over Panel */}
        <div className="w-screen max-w-md sm:max-w-lg bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-out animate-in slide-in-from-right duration-300 border-l border-[#C9A23A]/30">
          
          {/* Luxury Highlander Branded Header */}
          <div 
            className="px-6 py-5 text-white flex items-center justify-between border-b border-[#C9A23A]/25 shrink-0"
            style={{ background: 'linear-gradient(135deg, #071A35 0%, #0F2D54 50%, #153B6C 100%)' }}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#C9A23A]/20 border border-[#C9A23A]/40 flex items-center justify-center text-[#D6AD45] shadow-inner">
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base sm:text-lg font-bold font-sans tracking-wide text-white">
                    Notifications & Alerts
                  </h2>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#C9A23A] text-[#071A35] shadow-xs">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-300 mt-0.5 font-medium flex items-center gap-1.5">
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Live Depository & Storefront Stream
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={onMarkAllRead}
                  title="Mark all notifications as read"
                  className="px-2.5 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white text-xs font-medium transition-colors flex items-center gap-1.5 border border-white/10 cursor-pointer"
                >
                  <CheckCheck className="w-3.5 h-3.5 text-[#D6AD45]" />
                  <span className="hidden sm:inline">Mark read</span>
                </button>
              )}

              <button
                type="button"
                onClick={onClose}
                className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors cursor-pointer"
                aria-label="Close notifications panel"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Micro Filter Tab Bar */}
          <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200/80 flex items-center gap-1.5 overflow-x-auto shrink-0 scrollbar-none">
            {[
              { id: 'All', label: 'All', count: counts.all },
              { id: 'Unread', label: 'Unread', count: counts.unread },
              { id: 'Inquiries', label: 'Inquiries', count: counts.inquiries },
              { id: 'Orders', label: 'Orders & Wires', count: counts.orders },
              { id: 'Inventory', label: 'Inventory', count: counts.inventory }
            ].map(tab => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all shrink-0 flex items-center gap-1.5 cursor-pointer ${
                    isActive
                      ? 'bg-[#0B2348] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span>{tab.label}</span>
                  {tab.count > 0 && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                      isActive ? 'bg-[#C9A23A] text-[#071A35]' : 'bg-slate-200 text-slate-700'
                    }`}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Drawer Body - Scrollable Stream of Cards */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-3.5 space-y-2 bg-[#F8FAFC]">
            {filteredNotifications.length === 0 ? (
              <div className="py-16 px-4 text-center flex flex-col items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-[#C9A23A] mb-3">
                  <Inbox className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-slate-800">
                  {activeTab === 'Unread' ? 'All caught up!' : 'No notifications in this category'}
                </h3>
                <p className="text-xs text-slate-500 max-w-xs mt-1 leading-relaxed">
                  {activeTab === 'Unread' 
                    ? 'There are no pending unread notifications in your administrative queue.' 
                    : 'When new inquiries, orders, or stock triggers occur, they will automatically appear here.'}
                </p>
              </div>
            ) : (
              filteredNotifications.map((n) => {
                const meta = getCategoryMeta(n);
                const IconComponent = meta.icon;
                const isUnread = !n.read;

                return (
                  <div
                    key={n.id}
                    onClick={() => handleCardClick(n)}
                    className={`group relative rounded-xl px-3.5 py-2.5 transition-all duration-200 border cursor-pointer ${
                      isUnread
                        ? 'bg-white border-[#C9A23A]/50 shadow-2xs border-l-4 ' + meta.borderColor + ' hover:shadow-sm hover:border-[#C9A23A]'
                        : 'bg-white/80 hover:bg-white border-slate-200/80 shadow-2xs hover:shadow-sm border-l-4 border-l-slate-300'
                    }`}
                  >
                    <div className="flex items-start gap-2.5">
                      {/* Category Icon Badge */}
                      <div className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${meta.iconBg} shadow-2xs group-hover:scale-105 transition-transform`}>
                        <IconComponent className="w-3.5 h-3.5" />
                      </div>

                      {/* Content Area */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${meta.badgeStyle}`}>
                              {meta.label}
                            </span>
                          </div>
                          
                          <span className="text-[10px] text-slate-400 font-medium shrink-0 flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {formatRelativeTime(n.created_at || n.time)}
                          </span>
                        </div>

                        {/* Title */}
                        <h4 className={`text-xs font-bold mt-0.5 leading-snug line-clamp-1 ${
                          isUnread ? 'text-[#071A35]' : 'text-slate-700'
                        }`}>
                          {n.title}
                        </h4>

                        {/* Detail text */}
                        <p className="text-[11px] text-slate-600 mt-0.5 leading-tight line-clamp-1">
                          {n.detail}
                        </p>

                        {/* Quick Interactive Micro-Actions on Hover */}
                        <div className="mt-1.5 pt-1.5 border-t border-slate-100 flex items-center justify-between text-xs">
                          <span className="inline-flex items-center gap-1 text-[#0B2348] group-hover:text-[#C9A23A] font-semibold text-[10px] transition-colors">
                            <span>{meta.actionLabel}</span>
                            <ArrowRight className="w-2.5 h-2.5 group-hover:translate-x-0.5 transition-transform" />
                          </span>

                          <div 
                            className="flex items-center gap-1"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {isUnread && (
                              <button
                                type="button"
                                onClick={() => onMarkRead && onMarkRead(n.id)}
                                title="Mark as read"
                                className="p-0.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded transition-colors"
                              >
                                <CheckCheck className="w-3 h-3" />
                              </button>
                            )}

                            {onDeleteNotification && (
                              <button
                                type="button"
                                onClick={() => onDeleteNotification(n.id)}
                                title="Dismiss notification"
                                className="p-0.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Luxury Footer Bar */}
          <div className="p-4 bg-white border-t border-slate-200/90 shrink-0 flex items-center justify-between gap-3 shadow-lg">
            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/notifications');
              }}
              className="text-xs font-semibold text-slate-700 hover:text-[#0B2348] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ExternalLink className="w-3.5 h-3.5 text-[#C9A23A]" />
              <span>Full Notification Archive</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                navigate('/inquiries');
              }}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-[#071A35] to-[#153B6C] hover:from-[#0B2348] hover:to-[#1B4B8A] text-white text-xs font-bold shadow-sm hover:shadow transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <span>Manage Inquiries</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#D6AD45]" />
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default NotificationDrawer;

