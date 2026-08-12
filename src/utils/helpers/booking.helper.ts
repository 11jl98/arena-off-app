import type { Booking } from '@/types/booking';

/**
 * Booking criado com pagamento online (payOnline) aguardando confirmação do
 * pagamento automático. O backend não serializa `paymentMethod`, então o sinal
 * confiável é status PENDING + paymentStatus PENDING (presencial nasce CONFIRMED).
 */
export function isPendingOnlinePayment(
  booking: Pick<Booking, 'status' | 'paymentStatus'> | null | undefined
): boolean {
  return (
    !!booking &&
    booking.status === 'PENDING' &&
    booking.paymentStatus === 'PENDING'
  );
}

/**
 * Booking pago online (Mercado Pago). O backend mantém pendingExpiresAt e
 * mpOrderId mesmo após a confirmação, então a presença deles + paymentStatus
 * PAID indica pagamento automático concluído.
 */
export function isPaidOnlinePayment(
  booking: Pick<Booking, 'paymentStatus' | 'pendingExpiresAt' | 'mpOrderId'> | null | undefined
): boolean {
  return (
    !!booking &&
    booking.paymentStatus === 'PAID' &&
    (!!booking.pendingExpiresAt || !!booking.mpOrderId)
  );
}

/**
 * Booking com pagamento automático (Mercado Pago) — pendente ou pago.
 */
export function isOnlinePayment(
  booking: Booking | null | undefined
): boolean {
  return (
    !!booking &&
    (isPendingOnlinePayment(booking) ||
      isPaidOnlinePayment(booking) ||
      !!booking.pendingExpiresAt ||
      !!booking.mpOrderId)
  );
}

export function getBookingPaymentLabel(
  booking: Pick<Booking, 'paymentStatus' | 'pendingExpiresAt' | 'mpOrderId'> | null | undefined
): string {
  if (isPaidOnlinePayment(booking) || !!booking?.pendingExpiresAt || !!booking?.mpOrderId) {
    return 'Mercado Pago';
  }
  return 'Presencial';
}
