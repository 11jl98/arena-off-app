import { useEffect, useRef } from 'react';
import { useAuthStore } from '@/store';
import { PushService } from '@/services/push';
import { urlBase64ToUint8Array } from '@/utils/helpers/vapid.helper';

const PUSH_ENDPOINT_KEY = 'push_endpoint';
const PUSH_VAPID_FP_KEY = 'push_vapid_fp';
const PUSH_ASKED_KEY = 'push_asked';
const sessionBackendOk = () => sessionStorage.getItem('push_backend_ok') === '1';
const setSessionBackendOk = () => sessionStorage.setItem('push_backend_ok', '1');
const clearSessionBackendOk = () => sessionStorage.removeItem('push_backend_ok');

export const isSupported =
  typeof window !== 'undefined' &&
  'Notification' in window &&
  'serviceWorker' in navigator &&
  'PushManager' in window;

async function subscribeToPush(): Promise<void> {
  if (!isSupported) return;

  const vapidKey = import.meta.env.VITE_VAPID_PUBLIC_KEY;
  if (!vapidKey) {
    console.warn('[Push] VITE_VAPID_PUBLIC_KEY nao definida. Push desativado.');
    return;
  }

  const reg = await navigator.serviceWorker.ready;
  console.log('[Push] Service worker ativo:', reg.active?.state);

  const existing = await reg.pushManager.getSubscription();
  const storedEndpoint = localStorage.getItem(PUSH_ENDPOINT_KEY);
  const previousEndpoint = storedEndpoint ?? undefined;

  const currentFp = vapidKey.slice(0, 16);
  const storedFp = localStorage.getItem(PUSH_VAPID_FP_KEY);
  const vapidKeyChanged = storedFp !== null && storedFp !== currentFp;

  if (vapidKeyChanged) {
    console.warn('[Push] VAPID key mudou — forçando re-registro completo.');
    localStorage.removeItem(PUSH_ENDPOINT_KEY);
    clearSessionBackendOk();
  }

  if (!vapidKeyChanged && existing && existing.endpoint === storedEndpoint && sessionBackendOk()) {
    console.log('[Push] Subscription OK nesta sessao.');
    return;
  }

  if (existing) {
    const oldEndpoint = existing.endpoint;
    console.log('[Push] Notificando backend sobre remoção do endpoint antigo...');
    await PushService.unsubscribePush(oldEndpoint).catch(() => undefined);
    localStorage.removeItem(PUSH_ENDPOINT_KEY);
    clearSessionBackendOk();

    await existing.unsubscribe();
    console.log('[Push] Subscription anterior removida.');
  }

  const subscription = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(vapidKey),
  });
  console.log('[Push] Nova subscription criada:', subscription.endpoint.slice(0, 60) + '...');

  const json = subscription.toJSON();
  const p256dh = json.keys?.p256dh;
  const auth = json.keys?.auth;

  if (!p256dh || !auth) {
    console.error('[Push] Subscription sem chaves p256dh/auth. Abortando.');
    return;
  }

  try {
    await PushService.subscribePush({
      endpoint: subscription.endpoint,
      keys: { p256dh, auth },
      ...(previousEndpoint && previousEndpoint !== subscription.endpoint
        ? { previousEndpoint }
        : {}),
    });
    localStorage.setItem(PUSH_ENDPOINT_KEY, subscription.endpoint);
    localStorage.setItem(PUSH_VAPID_FP_KEY, currentFp);
    setSessionBackendOk();
    console.log('[Push] Subscription registrada no backend com sucesso');
  } catch (err) {
    console.error('[Push] FALHA ao registrar subscription no backend:', err);
    clearSessionBackendOk();
    throw err;
  }
}

async function unsubscribeFromPush(): Promise<void> {
  if (!isSupported) return;

  const storedEndpoint = localStorage.getItem(PUSH_ENDPOINT_KEY);

  try {
    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await existing.unsubscribe();
    }
    if (storedEndpoint) {
      await PushService.unsubscribePush(storedEndpoint);
    }
    console.log('[Push] Subscription removida com sucesso.');
  } catch (err) {
    console.warn('[Push] Erro ao remover subscription (best-effort):', err);
  } finally {
    localStorage.removeItem(PUSH_ENDPOINT_KEY);
    localStorage.removeItem(PUSH_VAPID_FP_KEY);
    clearSessionBackendOk();
  }
}

export function usePushSubscription() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const prevAuthRef = useRef(isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) return;
    if (!isSupported) return;
    if (typeof Notification === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    subscribeToPush().catch((err) => {
      console.error('[Push] Erro na auto-subscricao:', err);
    });
  }, [isAuthenticated]);

  useEffect(() => {
    const wasAuth = prevAuthRef.current;
    prevAuthRef.current = isAuthenticated;

    if (wasAuth && !isAuthenticated) {
      unsubscribeFromPush().catch((err) => {
        console.warn('[Push] Erro ao remover subscription no logout:', err);
      });
    }
  }, [isAuthenticated]);

  async function requestPermissionAndSubscribe(): Promise<NotificationPermission> {
    if (!isSupported) return 'denied';

    const permission = await Notification.requestPermission();
    localStorage.setItem(PUSH_ASKED_KEY, '1');
    console.log('[Push] Resultado da permissao:', permission);

    if (permission === 'granted') {
      await subscribeToPush().catch((err) => {
        console.error('[Push] Erro ao subscrever apos permissao:', err);
      });
    }

    return permission;
  }

  return {
    isSupported,
    requestPermissionAndSubscribe,
  };
}
