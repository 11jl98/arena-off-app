import { httpClient } from './api';
import { API_BASE_URL } from '@/utils/constants/app.constant';
import type { AppNotification } from '@/types/notification';

export interface ListNotificationsParams {
  read?: boolean;
  limit?: number;
}

export const NotificationsService = {
  async getNotifications(params?: ListNotificationsParams): Promise<AppNotification[]> {
    const queryParams: Record<string, string> = {};
    if (params?.read !== undefined) queryParams.read = String(params.read);
    if (params?.limit !== undefined) queryParams.limit = String(params.limit);
    return httpClient.get<AppNotification[]>('/notifications', { params: queryParams });
  },

  async getUnreadCount(): Promise<number> {
    const res = await httpClient.get<{ count: number }>('/notifications/unread-count');
    return res.count;
  },

  async markRead(id: string): Promise<AppNotification> {
    return httpClient.patch<AppNotification>(`/notifications/${id}/read`, {});
  },

  async markAllRead(): Promise<void> {
    await httpClient.patch<{ message: string }>('/notifications/read-all', {});
  },

  /** Opens an SSE stream. Caller is responsible for closing with source.close() */
  createSSESource(): EventSource {
    return new EventSource(`${API_BASE_URL}/notifications/stream`, {
      withCredentials: true,
    });
  },
};
