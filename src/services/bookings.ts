import { httpClient } from './api';
import type {
  Booking,
  CreateBookingPayload,
  UpdateBookingPayload,
  AvailableSlotsParams,
  AvailableSlot,
  CheckAvailabilityPayload,
} from '@/types/booking';

export interface ListBookingsParams {
  page?: number;
  pageSize?: number;
  status?: string;
  courtId?: string;
  date?: string;
  paymentStatus?: string;
}

interface AvailableSlotsResponse {
  courtId: string;
  date: string;
  slots: AvailableSlot[];
}

export const BookingsService = {
  async createBooking(payload: CreateBookingPayload): Promise<Booking> {
    return httpClient.post<Booking>('/bookings', payload);
  },

  async listMyBookings(params?: ListBookingsParams): Promise<Booking[]> {
    const queryParams: Record<string, string> = {};
    if (params?.page) queryParams.page = String(params.page);
    if (params?.pageSize) queryParams.pageSize = String(params.pageSize);
    if (params?.status) queryParams.status = params.status;
    if (params?.courtId) queryParams.courtId = params.courtId;
    if (params?.date) queryParams.date = params.date;
    if (params?.paymentStatus) queryParams.paymentStatus = params.paymentStatus;

    return httpClient.get<Booking[]>('/bookings', { params: queryParams });
  },

  async getBooking(id: string): Promise<Booking> {
    return httpClient.get<Booking>(`/bookings/${id}`);
  },

  async updateBooking(id: string, payload: UpdateBookingPayload): Promise<Booking> {
    return httpClient.patch<Booking>(`/bookings/${id}`, payload);
  },

  async cancelBooking(id: string): Promise<Booking> {
    return httpClient.post<Booking>(`/bookings/${id}/cancel`, {});
  },

  async confirmBooking(id: string): Promise<Booking> {
    return httpClient.post<Booking>(`/bookings/${id}/confirm`, {});
  },

  async getAvailableSlots(params: AvailableSlotsParams): Promise<AvailableSlot[]> {
    const res = await httpClient.get<AvailableSlotsResponse>(
      '/bookings/available-slots',
      { params: { courtId: params.courtId, date: params.date } }
    );
    return res.slots ?? [];
  },

  async checkAvailability(payload: CheckAvailabilityPayload): Promise<{ available: boolean }> {
    return httpClient.post<{ available: boolean }>('/bookings/check-availability', payload);
  },
};
