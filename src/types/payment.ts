export type OnlinePaymentMethod = 'PIX' | 'CREDIT_CARD' | 'DEBIT_CARD';

export type CashbackPurposeOption = 'COURT' | 'BAR';

export interface InitiatePaymentRequest {
  bookingId: string;
  method: OnlinePaymentMethod;
  payerEmail?: string;
  /** Destino do cashback quando a opção Bar está ligada */
  cashbackPurpose?: CashbackPurposeOption;
  cardToken?: string;
  paymentMethodId?: string;
  installments?: number;
}

export interface InitiatePaymentResponse {
  paymentId: string;
  bookingId: string;
  /** Legado — carrega o txid Inter */
  mpOrderId: string;
  /** txid da cobrança PIX no Banco Inter */
  interTxid?: string;
  method: OnlinePaymentMethod;
  /** Valor base da reserva (sem taxa) */
  amount: number;
  /** Taxa PIX repassada (0,90%) em reais */
  fee?: number;
  /** Total cobrado = amount + fee */
  totalAmount?: number;
  /** Cashback estimado sobre o total pago */
  estimatedCashback?: number;
  /** Destino do cashback que será creditado */
  cashbackPurpose?: CashbackPurposeOption;
  status: string;
  /** Legacy card field */
  statusDetail?: string;
  /** PIX */
  pixQrCode?: string;
  pixQrCodeBase64?: string;
  pixTicketUrl?: string;
  /** Booking state after initiation */
  bookingStatus?: string;
  pendingExpiresAt?: string;
}
