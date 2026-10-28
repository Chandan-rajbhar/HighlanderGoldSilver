import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCheck, 
  Trash2, 
  Coins, 
  ShoppingBag, 
  MessageSquareQuote, 
  ShieldCheck,
  Clock
} from 'lucide-react';
import { notificationService } from '../services/notificationService';
import { useToast } from '../context/ToastContext';

export const Notifications = () => {
  const { toast } = useToast();
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter] = useState('All');

  useEffect(() => {
    setNotifications(notificationService.getNotifications());
  }, []);

  const handleMarkAllRead = () => {
    const updated = notificationService.markAllAsRead();
    setNotifications(updated);
    toast.success('All notifications marked as read');
  };

  const handleMarkRead = (id) => {
    const updated = notificationService.markAsRead(id);
    setNotifications(updated);
  };

  const handleDelete = (id) => {
    const updated = notificationService.deleteNotification(id);
    setNotifications(updated);
    toast.info('Notification dismissed');
  };

  const filtered = notifications.filter(n => {
    if (filter === 'Unread') return !n.read;
    if (filter === 'Orders') return n.type === 'wire' || n.type === 'order';
    if (filter === 'Inventory') return n.type === 'inventory';
    return true;
  });

  const getIcon = (type) => {
    if (type === 'wire' || type === 'order') return ShoppingBag;
    if (type === 'inventory') return Coins;
    if (type === 'inquiry') return MessageSquareQuote;
    return ShieldCheck;
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl sm:text-2xl font-bold font-serif text-slate-900">
            Notifications & System Alerts
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time feed of bank wire confirmations, storefront inquiries, inventory stock triggers, and security events.
          </p>
        </div>

        <button
          onClick={handleMarkAllRead}
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-semibold hover:bg-slate-50 shadow-sm self-start sm:self-auto"
        >
          <CheckCheck className="w-3.5 h-3.5 text-gold" />
          Mark All Read
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        {['All', 'Unread', 'Orders', 'Inventory'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-aubergine text-white'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
        {filtered.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs">
            <Bell className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            No notifications in this filter view.
          </div>
        ) : (
          filtered.map(n => {
            const Icon = getIcon(n.type);
            return (
              <div 
                key={n.id}
                className={`p-4 flex items-start justify-between gap-4 hover:bg-slate-50/70 transition-colors ${
                  !n.read ? 'bg-amber-50/30' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-aubergine shrink-0 mt-0.5">
                    <Icon className="w-4 h-4 text-gold-dark" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm font-serif">{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">{n.detail}</p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-2 font-mono">
                      <Clock className="w-3 h-3" />
                      <span>{n.time}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  {!n.read && (
                    <button
                      onClick={() => handleMarkRead(n.id)}
                      className="p-1.5 text-slate-400 hover:text-aubergine hover:bg-slate-100 rounded-lg text-xs"
                      title="Mark as read"
                    >
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(n.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg text-xs"
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

