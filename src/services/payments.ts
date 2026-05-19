import { httpClient } from './api';
import type { InitiatePixPaymentResponse } from '@/types';

export interface MercadoPagoPreference {
  preferenceId: string;
  checkoutUrl: string;
}

export const PaymentsService = {
  async createMercadoPagoPreference(bookingId: string): Promise<MercadoPagoPreference> {
    return httpClient.post<MercadoPagoPreference>('/payments/create-preference', { bookingId });
  },

  async initiatePixPayment(bookingId: string): Promise<InitiatePixPaymentResponse> {
    return httpClient.post<InitiatePixPaymentResponse>('/payments/initiate', { bookingId });
  },
};
