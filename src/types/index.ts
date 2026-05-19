export interface InitiatePixPaymentResponse {
  paymentId: string;
  bookingId: string;
  mpOrderId: string;
  amount: number;
  status: 'action_required';
  pixQrCode: string;
  pixQrCodeBase64: string;
  pixTicketUrl: string;
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
