/// <reference lib="webworker" />

import { clientsClaim } from 'workbox-core';
import { cleanupOutdatedCaches, precacheAndRoute } from 'workbox-precaching';
import { registerRoute, NavigationRoute } from 'workbox-routing';
import { NetworkFirst } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';
import { CacheableResponsePlugin } from 'workbox-cacheable-response';

declare const self: ServiceWorkerGlobalScope;

const isIOS = /iPad|iPhone|iPod/.test(self.navigator.userAgent);

self.skipWaiting();
if (!isIOS) {
  clientsClaim();
}

precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();

const navigationRoute = new NavigationRoute(async ({ request }) => {
  return fetch(request);
});
registerRoute(navigationRoute);

registerRoute(
  ({ url }) =>
    url.pathname.startsWith('/api/') &&
    !url.pathname.includes('/auth'),
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

// -- Push Notifications -------------------------------------------------------

type NotificationType = 'NEW_BOOKING' | 'BOOKING_CONFIRMED' | 'BOOKING_CANCELLED';

interface NotificationData {
  type?: NotificationType;
  bookingId?: string;
  courtId?: string;
  route?: string;
  url?: string;
  [key: string]: unknown;
}

interface PushPayload {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: NotificationData;
}

const getNotificationTag = (type?: NotificationType, bookingId?: string): string => {
  const prefix =
    type === 'BOOKING_CONFIRMED'
      ? 'booking-confirmed'
      : type === 'BOOKING_CANCELLED'
      ? 'booking-cancelled'
      : 'new-booking';
  return bookingId ? `${prefix}-${bookingId}` : prefix;
};

self.addEventListener('push', (event: PushEvent) => {
  let payload: PushPayload = {
    title: 'Arena Off',
    body: 'Voce tem uma nova atualizacao.',
    icon: '/logo.jpg',
    badge: '/logo.jpg',
  };

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() };
    } catch {
      payload.body = event.data.text();
    }
  }

  const tag = payload.tag || getNotificationTag(payload.data?.type, payload.data?.bookingId);

  const promiseChain = self.registration.showNotification(payload.title, {
    body: payload.body,
    icon: payload.icon ?? '/logo.jpg',
    badge: payload.badge ?? '/logo.jpg',
    tag,
    data: payload.data,
    requireInteraction: false,
  } as never);

  event.waitUntil(promiseChain);
});

self.addEventListener('notificationclick', (event: NotificationEvent) => {
  event.notification.close();

  const urlToOpen = '/app/reservas';

  const promiseChain = self.clients
    .matchAll({ type: 'window', includeUncontrolled: true })
    .then((windowClients) => {
      const targetUrl = new URL(urlToOpen, self.location.origin).href;

      for (const client of windowClients) {
        if (client.url.startsWith(new URL('/', self.location.origin).href) && 'focus' in client) {
          (client as WindowClient).postMessage({ type: 'NOTIFICATION_CLICK', url: urlToOpen });
          return client.focus();
        }
      }

      if (self.clients.openWindow) {
        return self.clients.openWindow(targetUrl);
      }
    });

  event.waitUntil(promiseChain);
});
