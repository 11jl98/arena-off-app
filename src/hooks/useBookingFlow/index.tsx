/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState } from 'react';
import type { Court, Sport } from '@/types/court';
import type { AvailableSlot, PaymentMethod, Booking } from '@/types/booking';

export type BookingStep = 1 | 2 | 3 | 4;

interface BookingFlowState {
  step: BookingStep;
  selectedCourt: Court | null;
  selectedDate: Date | null;
  selectedSlots: AvailableSlot[];
  selectedSport: Sport | null;
  cashbackAmount: number;
  paymentMethod: PaymentMethod;
  createdBooking: Booking | null;
}

interface BookingFlowActions {
  setStep: (step: BookingStep) => void;
  selectCourt: (court: Court) => void;
  selectDate: (date: Date) => void;
  setSelectedSlots: (slots: AvailableSlot[]) => void;
  setSport: (sport: Sport) => void;
  setCashbackAmount: (amount: number) => void;
  setPaymentMethod: (method: PaymentMethod) => void;
  setCreatedBooking: (booking: Booking) => void;
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
  cashbackAmount: 0,
  paymentMethod: 'PRESENCIAL',
  createdBooking: null,
};

const BookingFlowCtx = createContext<BookingFlowContext | null>(null);

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
    setSport: (sport) => update({ selectedSport: sport }),
    setCashbackAmount: (cashbackAmount) => update({ cashbackAmount }),
    setPaymentMethod: (paymentMethod) => update({ paymentMethod }),
    setCreatedBooking: (booking) => update({ createdBooking: booking, step: 4 }),
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
    reset: () => setState(initialState),
  };

  return <BookingFlowCtx.Provider value={value}>{children}</BookingFlowCtx.Provider>;
};

export const useBookingFlow = (): BookingFlowContext => {
  const ctx = useContext(BookingFlowCtx);
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider');
  return ctx;
};
