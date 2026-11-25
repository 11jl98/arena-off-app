import { createContext, useContext, useState } from 'react';
import type { Court, Sport } from '@/types/court';
import type { AvailableSlot, PaymentMethod, Booking } from '@/types/booking';
import type { InitiatePaymentResponse } from '@/types/payment';

export type BookingStep = 1 | 2 | 3 | 4;

const PENDING_PAYMENT_KEY = 'mp_pending_payment';

interface BookingFlowState {
  step: BookingStep;
  selectedCourt: Court | null;
  selectedDate: Date | null;
  selectedSlots: AvailableSlot[];
  selectedSport: Sport | null;
  slotDuration: number;
  cashbackAmount: number;
  paymentMethod: PaymentMethod;
  createdBooking: Booking | null;
  paymentData: InitiatePaymentResponse | null;
}

interface BookingFlowActions {
  setStep: (step: BookingStep) => void;
  selectCourt: (court: Court) => void;
  selectDate: (date: Date) => void;
  setSelectedSlots: (slots: AvailableSlot[]) => void;
  setSlotDuration: (duration: number) => void;
  setSport: (sport: Sport) => void;
  setCashbackAmount: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCreatedBooking: (booking: Booking) => void;
  updateCreatedBooking: (booking: Booking) => void;
  setPaymentData: (data: InitiatePaymentResponse | null) => void;
  resumeBooking: (booking: Booking) => void;
  goNext: () => void;
  goBack: () => void;
  reset: () => void;
}

type BookingFlowContext = BookingFlowState & BookingFlowActions;

const initialState: BookingFlowState = {
  step: 1,
  selectedCourt: null,
  selectedDate: null,
  selectedSlots: [],
  selectedSport: null,
  slotDuration: 60,
  cashbackAmount: 0,
  paymentMethod: 'PRESENCIAL',
  createdBooking: null,
  paymentData: null,
};

const BookingFlowCtx = createContext<BookingFlowContext | null>(null);

function readPendingPayment(): { bookingId: string; paymentData: InitiatePaymentResponse } | null {
  try {
    const raw = sessionStorage.getItem(PENDING_PAYMENT_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as { bookingId: string; paymentData: InitiatePaymentResponse };
  } catch {
    return null;
  }
}

function clearPendingPayment() {
  try {
    sessionStorage.removeItem(PENDING_PAYMENT_KEY);
  } catch {
    // ignore
  }
}

export const BookingFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingFlowState>(initialState);

  const update = (partial: Partial<BookingFlowState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  const value: BookingFlowContext = {
    ...state,
    setStep: (step) => update({ step }),
    selectCourt: (court) => update({ selectedCourt: court, selectedSlots: [], step: 2 }),
    selectDate: (date) => update({ selectedDate: date, selectedSlots: [] }),
    setSelectedSlots: (slots) => update({ selectedSlots: slots }),
    setSlotDuration: (duration) => update({ slotDuration: duration }),
    setSport: (sport) => update({ selectedSport: sport }),
    setCashbackAmount: (cashbackAmount) => update({ cashbackAmount }),
    setPaymentMethod: (paymentMethod) => update({ paymentMethod }),
    setCreatedBooking: (booking) =>
      update({
        createdBooking: booking,
        step: 4,
      }),
    updateCreatedBooking: (booking) => {
      if (booking === state.createdBooking) return;
      update({
        createdBooking: booking,
      });
    },
    setPaymentData: (paymentData) => {
      if (paymentData === state.paymentData) return;
      update({ paymentData });
      if (state.createdBooking) {
        try {
          if (paymentData) {
            sessionStorage.setItem(
              PENDING_PAYMENT_KEY,
              JSON.stringify({ bookingId: state.createdBooking.id, paymentData })
            );
          } else {
            sessionStorage.removeItem(PENDING_PAYMENT_KEY);
          }
        } catch {
          // ignore
        }
      }
    },
    resumeBooking: (booking) => {
      const pending = readPendingPayment();
      update({
        createdBooking: booking,
        paymentMethod: 'MERCADO_PAGO',
        paymentData: pending && pending.bookingId === booking.id ? pending.paymentData : null,
        step: 4,
      });
    },
    goNext: () =>
      setState((prev) => ({
        ...prev,
        step: Math.min(prev.step + 1, 4) as BookingStep,
      })),
    goBack: () =>
      setState((prev) => ({
        ...prev,
        step: Math.max(prev.step - 1, 1) as BookingStep,
      })),
    reset: () => {
      clearPendingPayment();
      setState(initialState);
    },
  };

  return <BookingFlowCtx.Provider value={value}>{children}</BookingFlowCtx.Provider>;
};

export const useBookingFlow = (): BookingFlowContext => {
  const ctx = useContext(BookingFlowCtx);
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider');
  return ctx;
};
