export interface InitiatePixPaymentResponse {
  paymentId: string;
  bookingId: string;
  mpOrderId: string;
  amount: number;
  status: 'action_required';
  pixQrCode: string;
  pixQrCodeBase64: string;
  pixTicketUrl: string;
  expiresAt?: string;
}

export type CardPaymentStatus = 'approved' | 'rejected' | 'pending';

export interface InitiateCardPaymentPayload {
  bookingId: string;
  cardToken: string;
  paymentMethodId: string;
  paymentMethodType: 'credit_card';
  installments: number;
  sessionId?: string;
  payer?: {
    email?: string;
    identification?: { type: string; number: string };
  };
}

export interface InitiateCardPaymentResponse {
  paymentId: string;
  bookingId: string;
  mpOrderId?: string;
  amount: number;
  status: CardPaymentStatus;
  /** Only used by non-Brick integrations; the Card Payment Brick handles 3DS automatically */
  transactionSecurityUrl?: string;
  installments?: number;
  paymentMethodId?: string;
  lastFourDigits?: string;
  /**
   * Raw Mercado Pago rejection detail, sent when the payment is refused
   * (e.g. "cc_rejected_insufficient_amount" or the short code "FUND").
   * Accepted in camelCase and snake_case variants.
   */
  statusDetail?: string;
  status_detail?: string;
  rejectionReason?: string;
  rejection_reason?: string;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
}
