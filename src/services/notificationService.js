import { localDB } from './storageService';

export const notificationService = {
  getNotifications() {
    return localDB.getNotifications();
  },

  markAsRead(id) {
    const notifs = localDB.getNotifications();
    const updated = notifs.map(n => n.id === id ? { ...n, read: true } : n);
    localDB.setNotifications(updated);
    return updated;
  },

  markAllAsRead() {
    const notifs = localDB.getNotifications();
    const updated = notifs.map(n => ({ ...n, read: true }));
    localDB.setNotifications(updated);
    return updated;
  },

  deleteNotification(id) {
    const notifs = localDB.getNotifications();
    const updated = notifs.filter(n => n.id !== id);
    localDB.setNotifications(updated);
    return updated;
  }
};

