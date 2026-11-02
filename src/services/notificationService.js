import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';
import { localDB } from './storageService';

export const NOTIF_CHANNEL_NAME = 'hgs_notifications_broadcast_channel';
const READ_IDS_KEY = 'hgs_read_notification_ids';

export const getReadNotificationIds = () => {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = localStorage.getItem(READ_IDS_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch (e) {
    return new Set();
  }
};

export const saveReadNotificationIds = (readSet) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(READ_IDS_KEY, JSON.stringify(Array.from(readSet)));
  } catch (e) {}
};

// Cross-tab broadcast channel singleton
let broadcastChannel = null;
export const getBroadcastChannel = () => {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    if (!broadcastChannel) {
      try {
        broadcastChannel = new BroadcastChannel(NOTIF_CHANNEL_NAME);
      } catch (err) {
        console.warn('BroadcastChannel initialization note:', err);
      }
    }
  }
  return broadcastChannel;
};

// Broadcast notification to all tabs and local window
export const broadcastNotification = (newRecord) => {
  // 1. Same-window dispatch
  if (typeof window !== 'undefined') {
    try {
      window.dispatchEvent(new CustomEvent('hgs:new-notification', { detail: newRecord }));
    } catch (e) {
      console.warn('Local dispatchEvent note:', e);
    }
  }

  // 2. Cross-tab BroadcastChannel
  const channel = getBroadcastChannel();
  if (channel) {
    try {
      channel.postMessage({ type: 'NEW_NOTIFICATION', payload: newRecord });
    } catch (e) {
      console.warn('BroadcastChannel postMessage note:', e);
    }
  }
};

export const notificationService = {
  getNotifications() {
    const raw = localDB.getNotifications();
    const readIds = getReadNotificationIds();
    return (raw || []).map(n => ({
      ...n,
      read: Boolean(n.read || readIds.has(n.id) || (n.inquiry_id && readIds.has(n.inquiry_id)))
    }));
  },

  async fetchNotifications() {
    const local = this.getNotifications();
    const readIds = getReadNotificationIds();

    if (isSupabaseConfigured() && supabase) {
      try {
        // 1. Fetch system notifications
        const notifsPromise = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30);

        // 2. Fetch recent inquiries to dynamically reflect in the notifications bell
        const inqsPromise = supabase
          .from('inquiries')
          .select('id, lot_title, inquirer_name, inquiry_type, status, created_at')
          .order('created_at', { ascending: false })
          .limit(20);

        const [notifsRes, inqsRes] = await Promise.allSettled([notifsPromise, inqsPromise]);

        const remoteNotifs = (notifsRes.status === 'fulfilled' && Array.isArray(notifsRes.value?.data)) 
          ? notifsRes.value.data 
          : [];

        const remoteInqs = (inqsRes.status === 'fulfilled' && Array.isArray(inqsRes.value?.data)) 
          ? inqsRes.value.data 
          : [];

        // Synthesize inquiries into notification cards
        const syntheticInqs = remoteInqs.map(i => {
          const notifId = `notif-inq-${i.id}`;
          const isRead = readIds.has(notifId) || readIds.has(i.id) || (i.status && i.status !== 'New');
          return {
            id: notifId,
            title: 'New Collector Acquisition Inquiry',
            detail: `${i.inquirer_name || 'Collector'} inquired regarding ${i.lot_title || i.inquiry_type || 'General Inquiry'}`,
            category: 'inquiry',
            read: Boolean(isRead),
            created_at: i.created_at,
            inquiry_id: i.id
          };
        });

        // Deduplicate between explicit notifications and synthesized inquiries
        const seen = new Set();
        const merged = [];

        for (const item of [...remoteNotifs, ...syntheticInqs]) {
          const isRead = Boolean(item.read || readIds.has(item.id) || (item.inquiry_id && readIds.has(item.inquiry_id)));
          const resolvedItem = { ...item, read: isRead };
          const key = resolvedItem.inquiry_id || (resolvedItem.detail ? `detail-${resolvedItem.detail}` : resolvedItem.id);
          if (!seen.has(key)) {
            seen.add(key);
            merged.push(resolvedItem);
          }
        }

        // Sort latest first
        merged.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        if (merged.length > 0) {
          localDB.setNotifications(merged);
          return merged;
        }
      } catch (err) {
        console.warn('Supabase fetchNotifications note:', err);
      }
    }
    return local;
  },

  async createNotification(notifData) {
    const id = notifData.id || `notif-${Date.now()}`;
    const newRecord = {
      id,
      title: notifData.title || 'New Notification',
      detail: notifData.detail || '',
      category: notifData.category || notifData.type || 'system',
      read: false,
      created_at: notifData.created_at || new Date().toISOString()
    };

    // 1. Save to local storage first (instant synchronous)
    try {
      const current = localDB.getNotifications();
      const updated = [newRecord, ...current.filter(n => n.id !== id)];
      localDB.setNotifications(updated);
    } catch (err) {
      console.warn('localDB setNotifications note:', err);
    }

    // 2. Broadcast immediately across all browser tabs & current window (0ms latency)
    broadcastNotification(newRecord);

    // 3. Save to Supabase in background
    if (isSupabaseConfigured() && supabase) {
      supabase
        .from('notifications')
        .insert([newRecord])
        .then(({ error }) => {
          if (error) console.warn('Supabase notification insert note:', error.message);
        })
        .catch(err => {
          console.warn('Supabase createNotification insert note:', err);
        });
    }

    return newRecord;
  },

  async markAsRead(id) {
    const readIds = getReadNotificationIds();
    readIds.add(id);
    if (typeof id === 'string' && id.startsWith('notif-inq-')) {
      readIds.add(id.replace('notif-inq-', ''));
    }
    saveReadNotificationIds(readIds);

    const notifs = localDB.getNotifications();
    const updated = notifs.map(n => {
      if (n.id === id || n.inquiry_id === id || (typeof id === 'string' && id.startsWith('notif-inq-') && n.id === id.replace('notif-inq-', ''))) {
        return { ...n, read: true };
      }
      return n;
    });
    localDB.setNotifications(updated);

    const channel = getBroadcastChannel();
    if (channel) {
      try {
        channel.postMessage({ type: 'NOTIFICATIONS_UPDATED', payload: updated });
      } catch (e) {}
    }

    if (isSupabaseConfigured() && supabase) {
      supabase.from('notifications').update({ read: true }).eq('id', id).then(() => {}).catch(() => {});
    }

    return updated;
  },

  async markAllAsRead() {
    const notifs = localDB.getNotifications();
    const readIds = getReadNotificationIds();

    notifs.forEach(n => {
      readIds.add(n.id);
      if (n.inquiry_id) readIds.add(n.inquiry_id);
      if (typeof n.id === 'string' && n.id.startsWith('notif-inq-')) {
        readIds.add(n.id.replace('notif-inq-', ''));
      }
    });
    saveReadNotificationIds(readIds);

    const updated = notifs.map(n => ({ ...n, read: true }));
    localDB.setNotifications(updated);

    const channel = getBroadcastChannel();
    if (channel) {
      try {
        channel.postMessage({ type: 'NOTIFICATIONS_UPDATED', payload: updated });
      } catch (e) {}
    }

    if (isSupabaseConfigured() && supabase) {
      supabase.from('notifications').update({ read: true }).eq('read', false).then(() => {}).catch(() => {});
    }

    return updated;
  },

  async deleteNotification(id) {
    const notifs = localDB.getNotifications();
    const updated = notifs.filter(n => n.id !== id);
    localDB.setNotifications(updated);

    const readIds = getReadNotificationIds();
    readIds.delete(id);
    if (typeof id === 'string' && id.startsWith('notif-inq-')) {
      readIds.delete(id.replace('notif-inq-', ''));
    }
    saveReadNotificationIds(readIds);

    const channel = getBroadcastChannel();
    if (channel) {
      try {
        channel.postMessage({ type: 'NOTIFICATIONS_UPDATED', payload: updated });
      } catch (e) {}
    }

    if (isSupabaseConfigured() && supabase) {
      supabase.from('notifications').delete().eq('id', id).then(() => {}).catch(() => {});
    }

    return updated;
  }
};
