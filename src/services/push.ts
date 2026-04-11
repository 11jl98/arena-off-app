import { httpClient } from './api';

export interface PushSubscriptionPayload {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export const PushService = {
  subscribePush: async (subscription: PushSubscriptionPayload) => {
    const response = await httpClient.post('/push/subscribe', subscription);
    return response;
  },

  unsubscribePush: async (endpoint: string) => {
    const response = await httpClient.post('/push/unsubscribe', { endpoint });
    return response;
  },
};
