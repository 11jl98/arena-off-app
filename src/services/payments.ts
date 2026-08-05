import { httpClient } from './api';
import type { InitiatePixPaymentResponse, InitiateCardPaymentPayload, InitiateCardPaymentResponse } from '@/types';

export const PaymentsService = {

  async initiatePixPayment(bookingId: string, payerEmail?: string): Promise<InitiatePixPaymentResponse> {
    const payload: Record<string, string> = { bookingId };
    if (payerEmail) payload.payerEmail = payerEmail;
    return httpClient.post<InitiatePixPaymentResponse>('/payments/initiate', payload);
  },

  async initiateCardPayment(payload: InitiateCardPaymentPayload): Promise<InitiateCardPaymentResponse> {
    return httpClient.post<InitiateCardPaymentResponse>('/payments/initiate-card', payload);
  },
};
