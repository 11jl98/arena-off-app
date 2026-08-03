import { httpClient } from './api';
import type { InitiatePixPaymentResponse } from '@/types';

export const PaymentsService = {
  /**
   * Starts the online PIX payment for a PENDING booking.
   * @param bookingId booking created with payOnline: true
   * @param payerEmail required for guest bookings without a linked client (backend uses the profile email otherwise)
   */
  async initiatePixPayment(bookingId: string, payerEmail?: string): Promise<InitiatePixPaymentResponse> {
    const payload: Record<string, string> = { bookingId };
    if (payerEmail) payload.payerEmail = payerEmail;
    return httpClient.post<InitiatePixPaymentResponse>('/payments/initiate', payload);
  },
};
