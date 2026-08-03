export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod = 'MERCADO_PAGO' | 'PRESENCIAL';

export interface PaymentReceipt {
  id: string;
  url?: string;
  amount?: number;
  paidAt?: string;
  method?: string;
  mpOrderId?: string;
}

export interface BookingPayment {
  id: string;
  status: PaymentStatus;
  method?: PaymentMethod;
  mpOrderId?: string;
  amount?: number;
  receipt?: PaymentReceipt;
  createdAt?: string;
}

export interface Booking {
  id: string;
  courtId: string;
  court?: {
    id: string;
    name: string;
    pricePerHour: number;
    sport: { id: string; name: string };
  };
  clientId?: string;
  guestName?: string;
  sport?: { id: string; name: string };
  client?: { id: string; name: string; email: string };
  date: string;
  startTime: string;
  endTime: string;
  calculatedAmount: number;
  cashbackUsed: number;
  finalAmount: number;
  status: BookingStatus;
  paymentStatus: PaymentStatus;
  paymentMethod?: PaymentMethod;
  notes?: string;
  splitPayment: boolean;
  numberOfPeople: number;
  createdAt: string;
  updatedAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
  /** TTL of a PENDING booking (slot held while waiting for the online payment) */
  pendingExpiresAt?: string;
  /** Mercado Pago order ID — set when payment is initiated */
  mpOrderId?: string;
  /** Comprovante of the PAID online payment */
  receipt?: PaymentReceipt;
  payments?: BookingPayment[];
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
  pricePerHour: number;
}

/** CLIENT flow: no clientId — backend fills it from auth token */
export interface CreateBookingPayload {
  courtId: string;
  sportId: string;
  date: string;
  startTime: string;
  endTime: string;
  /** Admin/Employee only — ignored by backend when sent by CLIENT */
  clientId?: string;
  guestName?: string;
  promotionId?: string;
  cashbackUsed?: number;
  paymentMethod?: PaymentMethod;
  /** When true, booking is created as PENDING (slot held) and released if the PIX is not paid within the TTL */
  payOnline?: boolean;
  notes?: string;
}

/** PATCH /bookings/:id — Admin/Employee only. `status` is NOT accepted here. */
export interface UpdateBookingPayload {
  paymentStatus?: PaymentStatus;
  notes?: string;
}

export interface AvailableSlotsParams {
  courtId: string;
  date: string;
}

export interface CheckAvailabilityPayload {
  courtId: string;
  date: string;
  startTime: string;
  endTime: string;
}
