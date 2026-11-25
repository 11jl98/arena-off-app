export type OnlinePaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';

export interface InitiatePaymentRequest {
  bookingId: string;
  method: OnlinePaymentMethod;
  payerEmail?: string;
  cardToken?: string;
  /** Card brand id required by MP Orders API (ex.: "visa", "master", "elo") */
  paymentMethodId?: string;
  installments?: number;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  bookingId: string;
  mpOrderId: string;
  method: OnlinePaymentMethod;
  amount: number;
  status: string;
  /** PIX */
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixTicketUrl?: string;
  /** Credit card */
  statusDetail?: string;
  paymentMethodId?: string;
  /** Booking state after initiation */
  bookingStatus?: string;
  pendingExpiresAt?: string;
}
