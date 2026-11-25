import { httpClient } from './api';
import type { InitiatePaymentRequest, InitiatePaymentResponse } from '@/types/payment';

export const PaymentsService = {
  async initiatePayment(payload: InitiatePaymentRequest): Promise<InitiatePaymentResponse> {
    return httpClient.post<InitiatePaymentResponse>('/payments/initiate', payload);
  },

  async getPublicKey(): Promise<{ publicKey: string }> {
    return httpClient.get<{ publicKey: string }>('/payments/public-key');
  },
};
