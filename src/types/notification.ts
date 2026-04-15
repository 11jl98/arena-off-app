/** Notification types sent by the backend SSE stream and REST API */
export type NotificationType =
  | 'NEW_BOOKING'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED';

export interface AppNotification {
  id: string;
  title: string;
  body: string;
  type?: NotificationType;
  read: boolean;
  data?: {
    bookingId: string;
    courtId: string;
    clientId?: string;
  };
  createdAt: string;
}

/** Raw payload received from the SSE stream (includes heartbeat) */
export type SSEPayload =
  | ({ type: 'heartbeat' })
  | AppNotification;
