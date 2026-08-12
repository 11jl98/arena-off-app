import { useQuery } from '@tanstack/react-query';
import { BookingsService } from '@/services/bookings';
import type { Booking } from '@/types/booking';

/**
 * Polls a booking while it is awaiting payment. The cache key `booking-poll`
 * is also refreshed by the SSE notification stream, so confirmation arrives
 * as soon as the backend processes the Mercado Pago webhook.
 */
export function usePaymentStatus(bookingId?: string | null, active = false) {
  return useQuery<Booking>({
    queryKey: ['booking-poll', bookingId],
    queryFn: () => BookingsService.getBooking(bookingId!),
    enabled: !!bookingId && active,
    refetchInterval: active ? 5000 : false,
    staleTime: 0,
    retry: 3,
  });
}
