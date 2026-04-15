import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { NotificationsService } from '@/services/notifications';
import { BookingsService } from '@/services/bookings';
import { useNotificationStore } from '@/store/notificationStore';
import type { AppNotification, SSEPayload } from '@/types/notification';

export interface UseNotificationsReturn {
    unreadCount: number;
    notifications: AppNotification[];
    drawerOpen: boolean;
    openDrawer: () => void;
    closeDrawer: () => void;
}

export function useNotifications(): UseNotificationsReturn {
    const queryClient = useQueryClient();
    const { unreadCount, notifications, setUnreadCount, incrementUnread, addNotification } =
        useNotificationStore();
    const [drawerOpen, setDrawerOpen] = useState(false);

    // Hydrate unread count on mount
    useEffect(() => {
        NotificationsService.getUnreadCount()
            .then(setUnreadCount)
            .catch(() => {/* silently ignore — not critical */ });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // SSE stream
    useEffect(() => {
        const source = NotificationsService.createSSESource();

        source.onmessage = (event: MessageEvent) => {
            let payload: SSEPayload;
            try {
                payload = JSON.parse(event.data as string) as SSEPayload;
            } catch {
                return;
            }

            if (payload.type === 'heartbeat') return;

            const notification = payload as AppNotification;

            addNotification(notification);
            incrementUnread();

            if (notification.type === 'BOOKING_CONFIRMED' || notification.type === 'BOOKING_CANCELLED') {
                if (notification.type === 'BOOKING_CONFIRMED') {
                    toast.success(notification.title, { description: notification.body });
                } else {
                    toast.warning(notification.title, { description: notification.body });
                }

                queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
                queryClient.invalidateQueries({ queryKey: ['slots'] });

                if (notification.data?.bookingId) {
                    const bookingId = notification.data.bookingId;
                    BookingsService.getBooking(bookingId)
                        .then((fresh) => {
                            queryClient.setQueryData(['booking', bookingId], fresh);
                            queryClient.setQueryData(['booking-poll', bookingId], fresh);
                        })
                        .catch(() => {
                            queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
                            queryClient.invalidateQueries({ queryKey: ['booking-poll', bookingId] });
                        });
                }
            }
        };

        source.onerror = () => {
        };

        return () => {
            source.close();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return {
        unreadCount,
        notifications,
        drawerOpen,
        openDrawer: () => setDrawerOpen(true),
        closeDrawer: () => setDrawerOpen(false),
    };
}
