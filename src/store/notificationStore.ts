import { create } from 'zustand';
import type { AppNotification } from '@/types/notification';

interface NotificationState {
  unreadCount: number;
  notifications: AppNotification[];
  setUnreadCount: (count: number) => void;
  incrementUnread: () => void;
  addNotification: (notification: AppNotification) => void;
  markAllRead: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set) => ({
  unreadCount: 0,
  notifications: [],

  setUnreadCount: (count) => set({ unreadCount: count }),

  incrementUnread: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  addNotification: (notification) =>
    set((state) => ({
      // Prepend newest first, prevent duplicates
      notifications: state.notifications.some((n) => n.id === notification.id)
        ? state.notifications
        : [notification, ...state.notifications],
    })),

  markAllRead: () =>
    set((state) => ({
      unreadCount: 0,
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),

  reset: () => set({ unreadCount: 0, notifications: [] }),
}));
