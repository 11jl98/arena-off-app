import type { Booking } from '@/types/booking';

type OnlineMarkers = Pick<
  Booking,
  'paymentStatus' | 'pendingExpiresAt' | 'mpOrderId' | 'interTxid'
>;

function hasOnlineMarker(booking: OnlineMarkers | null | undefined): boolean {
  return !!booking && (!!booking.mpOrderId || !!booking.interTxid);
}

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
 * Booking pago online (Banco Inter / MP legado). O backend mantém pendingExpiresAt
 * e mpOrderId/interTxid mesmo após a confirmação.
 */
export function isPaidOnlinePayment(
  booking: OnlineMarkers | null | undefined
): boolean {
  return (
    !!booking &&
    booking.paymentStatus === 'PAID' &&
    (!!booking.pendingExpiresAt || hasOnlineMarker(booking))
  );
}

/**
 * Booking com pagamento automático online — pendente ou pago.
 */
export function isOnlinePayment(
  booking: Booking | null | undefined
): boolean {
  return (
    !!booking &&
    (isPendingOnlinePayment(booking) ||
      isPaidOnlinePayment(booking) ||
      !!booking.pendingExpiresAt ||
      hasOnlineMarker(booking))
  );
}

export function getBookingPaymentLabel(
  booking: OnlineMarkers | null | undefined
): string {
  if (
    isPaidOnlinePayment(booking) ||
    !!booking?.pendingExpiresAt ||
    hasOnlineMarker(booking)
  ) {
    return 'PIX Online';
  }
  return 'Presencial';
}
