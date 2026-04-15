export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID' | 'PARTIAL';

export type PaymentMethod = 'MERCADO_PAGO' | 'PRESENCIAL';

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
  /** Present only when status === 'PENDING' — 30-min expiry window */
  pendingExpiresAt?: string;
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
