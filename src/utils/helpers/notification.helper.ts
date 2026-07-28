import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { NotificationType, NotificationAction } from '@/types/push-notification';

export const formatNotificationTime = (startTime: string): string => {
  try {
    const date = parseISO(startTime);
    return format(date, "'às' HH'h'mm", { locale: ptBR });
  } catch {
    return '';
  }
};

export const getNotificationIcon = (type: NotificationType): string => {
  const icons: Partial<Record<NotificationType, string>> = {
    CASHBACK_RECEIVED: '/icon-192x192.png',
  };
  return icons[type] || '/icon-192x192.png';
};

export const getNotificationBadge = (): string => {
  return '/icon-192x192.png';
};

export const getNotificationTag = (type: NotificationType, classId?: string): string => {
  const tagPrefix: Partial<Record<NotificationType, string>> = {
    CASHBACK_RECEIVED: 'cashback',
  };
  const prefix = tagPrefix[type] || 'notification';
  return classId ? `${prefix}-${classId}` : prefix;
};

export const getNotificationActions = (type: NotificationType): NotificationAction[] => {
  const actionsMap: Partial<Record<NotificationType, NotificationAction[]>> = {
    CASHBACK_RECEIVED: [
      { action: 'view', title: 'Ver saldo' },
    ],
  };
  return actionsMap[type] || [{ action: 'view', title: 'Ver Detalhes' }];
};

export const getNotificationUrl = (type: NotificationType): string => {
  const urlMap: Partial<Record<NotificationType, string>> = {
    CASHBACK_RECEIVED: '/app/cashback',
  };
  return urlMap[type] || '/schedule';
};
