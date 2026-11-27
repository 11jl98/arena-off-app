import { useQuery } from '@tanstack/react-query';
import { PaymentsService } from '@/services/payments';
import type { Booking } from '@/types/booking';
import { getPaymentStatusPollingInterval } from './payment-status-polling';

/**
 * Polls the booking and rechecks pending PIX charges with Banco Inter.
 */
export function usePaymentStatus(bookingId?: string | null, active = false) {
  return useQuery<Booking>({
    queryKey: ['booking-poll', bookingId],
    queryFn: () => PaymentsService.getBookingPaymentStatus(bookingId!),
    enabled: !!bookingId && active,
    refetchInterval: getPaymentStatusPollingInterval(active),
    staleTime: 0,
    retry: 3,
  });
}
