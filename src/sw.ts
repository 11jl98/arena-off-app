/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

import { NavigationRoute } from 'workbox-routing';

const navigationRoute = new NavigationRoute(async ({ request }) => {
  return fetch(request);
});

registerRoute(navigationRoute);

declare const self: ServiceWorkerGlobalScope;

const isIOS = /iPad|iPhone|iPod/.test(self.navigator.userAgent);

self.skipWaiting();
if (!isIOS) {
  clientsClaim();
}

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/') &&
    !url.pathname.includes('schedule') &&
    !url.pathname.includes('/auth'), // 👈 AQUI
  new NetworkFirst({
    cacheName: 'api-cache',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 86400,
      }),
      new CacheableResponsePlugin({
        statuses: [0, 200],
      }),
    ],
  }),
  'GET'
);

type NotificationType =
  | 'CLASS_REMINDER'
  | 'CLASS_REMINDER_CANCELLED_ATTENDANCE'
  | 'REPLACEMENT_CLASS_REMINDER'
  | 'CLASS_CANCELLED'
  | 'QR_CODE_GENERATED'
  | 'NEW_PAYMENT_CREATED'
  | 'PAYMENT_REMINDER'
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_OVERDUE'
  | 'BLOCK_WARNING'
  | 'USER_BLOCKED'
  | 'USER_UNBLOCKED'
  | 'CLASS_REACTIVATED'
  | 'RECEIPT_UPLOADED'
  | 'RECEIPT_REJECTED'
  | 'EXTRA_CLASS_CONFIRMED'
  | 'EXTRA_CLASS_CONFIRMED';

interface NotificationData {
  type?: NotificationType;
  url?: string;
  route?: string;
  classId?: string;
  className?: string;
  startTime?: string;
  absenceId?: string;
  enrollmentId?: string;
  replacementEnrollmentId?: string;
  cancelReason?: string;
  paymentId?: string;
  amount?: number;
  dueDate?: string;
  daysOverdue?: number;
  daysRemaining?: number;
  validUntil?: string;
  timestamp?: string;
  [key: string]: unknown;
}

interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
  actions?: Array<{ action: string; title: string }>;
}

const getNotificationUrl = (type?: NotificationType, fallbackUrl?: string): string => {
  if (!type) return fallbackUrl || '/schedule';

  const urlMap: Partial<Record<NotificationType, string>> = {
    CLASS_REMINDER: '/schedule',
    CLASS_REMINDER_CANCELLED_ATTENDANCE: '/schedule',
    REPLACEMENT_CLASS_REMINDER: '/schedule',
    CLASS_CANCELLED: '/schedule',
    QR_CODE_GENERATED: '/payments',
    NEW_PAYMENT_CREATED: '/payments',
    PAYMENT_REMINDER: '/payments',
    PAYMENT_CONFIRMED: '/profile',
    PAYMENT_OVERDUE: '/payments',
    BLOCK_WARNING: '/payments',
    USER_BLOCKED: '/payments',
    USER_UNBLOCKED: '/home',
    CLASS_REACTIVATED: '/schedule',
    EXTRA_CLASS_CONFIRMED: '/profile',
    RECEIPT_UPLOADED: '/payments',
    RECEIPT_REJECTED: '/payments',
  };

  return urlMap[type] || fallbackUrl || '/schedule';
};

const getNotificationTag = (type?: NotificationType, classId?: string): string => {
  if (!type) return 'default';

  const tagPrefix: Partial<Record<NotificationType, string>> = {
    CLASS_REMINDER: 'class-reminder',
    CLASS_REMINDER_CANCELLED_ATTENDANCE: 'class-cancelled-attendance',
    REPLACEMENT_CLASS_REMINDER: 'replacement-reminder',
    CLASS_CANCELLED: 'class-cancelled',
    QR_CODE_GENERATED: 'qrcode-generated',
    NEW_PAYMENT_CREATED: 'payment-created',
    PAYMENT_REMINDER: 'payment-reminder',
    PAYMENT_CONFIRMED: 'payment-confirmed',
    PAYMENT_OVERDUE: 'payment-overdue',
    BLOCK_WARNING: 'block-warning',
    USER_BLOCKED: 'user-blocked',
    USER_UNBLOCKED: 'user-unblocked',
    CLASS_REACTIVATED: 'class-reactivated',
    EXTRA_CLASS_CONFIRMED: 'extra-class-confirmed',
  };

  const prefix = tagPrefix[type] || 'notification';
  return classId ? `${prefix}-${classId}` : prefix;
};

const getNotificationActions = (
  type?: NotificationType
): Array<{ action: string; title: string }> => {
  if (!type) return [];

  const actionsMap: Partial<Record<NotificationType, Array<{ action: string; title: string }>>> = {
    CLASS_REMINDER: [
      { action: 'view', title: 'Ver Aula' },
      { action: 'cancel', title: 'Cancelar Presença' },
    ],
    CLASS_REMINDER_CANCELLED_ATTENDANCE: [
      { action: 'confirm', title: 'Confirmar Presença' },
      { action: 'view', title: 'Ver Detalhes' },
    ],
    REPLACEMENT_CLASS_REMINDER: [
      { action: 'view', title: 'Ver Aula' },
      { action: 'cancel-replacement', title: 'Cancelar Reposição' },
    ],
    CLASS_CANCELLED: [{ action: 'view', title: 'Ver Aulas Disponíveis' }],
    QR_CODE_GENERATED: [{ action: 'view', title: 'Ver QR Code' }],
    NEW_PAYMENT_CREATED: [{ action: 'view', title: 'Ver Pagamento' }],
    PAYMENT_REMINDER: [{ action: 'pay', title: 'Pagar Agora' }],
    PAYMENT_CONFIRMED: [{ action: 'view', title: 'Ver Comprovante' }],
    PAYMENT_OVERDUE: [{ action: 'pay', title: 'Regularizar' }],
    BLOCK_WARNING: [{ action: 'pay', title: 'Pagar Agora' }],
    USER_BLOCKED: [{ action: 'contact', title: 'Falar com Suporte' }],
    USER_UNBLOCKED: [{ action: 'view', title: 'Acessar App' }],
    CLASS_REACTIVATED: [{ action: 'view', title: 'Ver Aulas Disponíveis' }],
    EXTRA_CLASS_CONFIRMED: [
      { action: 'view', title: 'Ver Créditos' },
      { action: 'schedule', title: 'Agendar Aula' },
    ],
  };

  return actionsMap[type] || [];
};

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {
    title: 'Nova notificação',
    body: 'Você tem uma nova atualização',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const notificationType = payload.data?.type;
  const classId = payload.data?.classId;
  const tag = payload.tag || getNotificationTag(notificationType, classId);
  const actions = payload.actions || getNotificationActions(notificationType);

  const isPaymentCritical =
    notificationType === 'PAYMENT_OVERDUE' ||
    notificationType === 'BLOCK_WARNING' ||
    notificationType === 'USER_BLOCKED';

  const promiseChain = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon || '/icon-192x192.png',
    badge: payload.badge || '/icon-192x192.png',
    tag,
    data: payload.data,
    requireInteraction: notificationType === 'CLASS_CANCELLED' || isPaymentCritical,
    ...(actions && { actions }),
  } as never);

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const notificationData = event.notification.data as NotificationData | undefined;
  const action = event.action;

  let urlToOpen = '/schedule';

  if (action === 'view' || action === 'pay' || !action) {
    urlToOpen = getNotificationUrl(
      notificationData?.type,
      notificationData?.route || notificationData?.url
    );
  } else if (action === 'cancel' || action === 'confirm' || action === 'cancel-replacement') {
    urlToOpen = '/schedule';
  } else if (action === 'contact') {
    urlToOpen = '/profile';
  }

  const promiseChain = self.clients
    .matchAll({
      type: 'window',
      includeUncontrolled: true,
    })
    .then((windowClients) => {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;

      for (const client of windowClients) {
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    });

  event.waitUntil(promiseChain);
});
