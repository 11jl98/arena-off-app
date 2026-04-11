import { httpClient } from './api';

export interface MercadoPagoPreference {
  preferenceId: string;
  checkoutUrl: string;
}

export const PaymentsService = {
  async createMercadoPagoPreference(bookingId: string): Promise<MercadoPagoPreference> {
    return httpClient.post<MercadoPagoPreference>('/payments/create-preference', { bookingId });
  },
};
