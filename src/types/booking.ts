import type { Court } from './court';

export type BookingStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'CANCELLED'
  | 'COMPLETED'
  | 'NO_SHOW';

export type PaymentStatus = 'PENDING' | 'PAID';

export type PaymentMethod = 'MERCADO_PAGO' | 'PRESENCIAL';

export interface Booking {
  id: string;
  courtId: string;
  court?: Court;
  clientId: string;
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
  createdAt: string;
}

export interface AvailableSlot {
  startTime: string;
  endTime: string;
  available: boolean;
}

export interface CreateBookingPayload {
  courtId: string;
  clientId: string;
  sportId: string;
  date: string;
  startTime: string;
  endTime: string;
  promotionId?: string;
  cashbackUsed?: number;
  paymentMethod?: PaymentMethod;
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
