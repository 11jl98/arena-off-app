import { useQuery } from '@tanstack/react-query';
import { BookingsService } from '@/services/bookings';
import type { Booking } from '@/types/booking';

export type PixPaymentState = 'waiting' | 'confirmed' | 'expired';

export interface UsePixPaymentWatchResult {
  status: PixPaymentState;
  booking: Booking | undefined;
  isLoading: boolean;
  refetch: () => Promise<unknown>;
}

function deriveState(booking: Booking): PixPaymentState {
  if (booking.status === 'CONFIRMED' || booking.status === 'COMPLETED') return 'confirmed';
  if (booking.status === 'CANCELLED') return 'expired';
  return 'waiting';
}

function isTerminal(booking: Booking): boolean {
  return booking.status === 'CONFIRMED' || booking.status === 'CANCELLED' || booking.status === 'COMPLETED';
}

/**
 * Watches an online PIX booking until it reaches a terminal state.
 *
 * Combines two sources that share the same query cache:
 *  - SSE events (useNotifications writes fresh data into ['booking-poll', id])
 *  - polling GET /bookings/:id every 5s as fallback
 *
 * Polling stops automatically once the booking is confirmed/cancelled.
 */
export function usePixPaymentWatch(bookingId: string | null | undefined): UsePixPaymentWatchResult {
  const { data, isLoading, refetch } = useQuery<Booking>({
    queryKey: ['booking-poll', bookingId],
    queryFn: () => BookingsService.getBooking(bookingId!),
    enabled: !!bookingId,
    staleTime: 0,
    refetchOnWindowFocus: true,
    refetchInterval: (query) => {
      const booking = query.state.data as Booking | undefined;
      if (booking && isTerminal(booking)) return false;
      return 5000;
    },
  });

  if (!bookingId || !data) {
    return { status: 'waiting', booking: data, isLoading, refetch };
  }

  return { status: deriveState(data), booking: data, isLoading, refetch };
}
