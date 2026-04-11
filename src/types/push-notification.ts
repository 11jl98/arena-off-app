export type NotificationType = 
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_REMINDER'
  | 'BOOKING_CANCELLED'
  | 'CASHBACK_RECEIVED'
  | 'PROMOTION_NEW';

export interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  data?: Record<string, unknown>;
  actions?: NotificationAction[];
  type?: NotificationType;
}
