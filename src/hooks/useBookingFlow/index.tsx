import { createContext, useContext, useEffect, useState } from 'react';
import type { Court, Sport } from '@/types/court';
import type { AvailableSlot, PaymentMethod, Booking } from '@/types/booking';
import type { InitiatePixPaymentResponse, InitiateCardPaymentResponse } from '@/types';

export type BookingStep = 1 | 2 | 3 | 4;

export type OnlinePaymentMode = 'pix' | 'card';

const PIX_SESSION_KEY = 'pix-flow-session';

interface BookingFlowState {
  step: BookingStep;
  selectedCourt: Court | null;
  selectedDate: Date | null;
  selectedSlots: AvailableSlot[];
  selectedSport: Sport | null;
  slotDuration: number;
  cashbackAmount: number;
  paymentMethod: PaymentMethod;
  /** Sub-instrument for online Mercado Pago payments (PIX vs credit card) */
  onlinePaymentMode: OnlinePaymentMode;
  createdBooking: Booking | null;
  pixPaymentData: InitiatePixPaymentResponse | null;
  cardPaymentData: InitiateCardPaymentResponse | null;
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
  setOnlinePaymentMode: (mode: OnlinePaymentMode) => void;
  setCreatedBooking: (booking: Booking) => void;
  updateCreatedBooking: (booking: Booking) => void;
  clearCreatedBooking: () => void;
  setPixPaymentData: (data: InitiatePixPaymentResponse | null) => void;
  setCardPaymentData: (data: InitiateCardPaymentResponse | null) => void;
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
  onlinePaymentMode: 'card',
  createdBooking: null,
  pixPaymentData: null,
  cardPaymentData: null,
};

interface PixFlowSession {
  createdBooking: Booking | null;
  pixPaymentData: InitiatePixPaymentResponse | null;
  cardPaymentData: InitiateCardPaymentResponse | null;
  onlinePaymentMode: OnlinePaymentMode;
}

function loadSession(): Partial<BookingFlowState> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(PIX_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PixFlowSession>;
    if (!parsed.createdBooking && !parsed.pixPaymentData) return null;
    return {
      createdBooking: parsed.createdBooking ?? null,
      pixPaymentData: parsed.pixPaymentData ?? null,
      cardPaymentData: parsed.cardPaymentData ?? null,
      onlinePaymentMode: parsed.cardPaymentData
        ? 'card'
        : parsed.pixPaymentData
          ? 'pix'
          : (parsed.onlinePaymentMode ?? 'card'),
      step: parsed.createdBooking ? 4 : 1,
    };
  } catch {
    return null;
  }
}

function persistSession(
  booking: Booking | null,
  pix: InitiatePixPaymentResponse | null,
  card: InitiateCardPaymentResponse | null,
  mode: OnlinePaymentMode
) {
  if (typeof window === 'undefined') return;
  try {
    if (!booking && !pix && !card) {
      sessionStorage.removeItem(PIX_SESSION_KEY);
      return;
    }
    sessionStorage.setItem(
      PIX_SESSION_KEY,
      JSON.stringify({ createdBooking: booking, pixPaymentData: pix, cardPaymentData: card, onlinePaymentMode: mode } satisfies PixFlowSession)
    );
  } catch {
    // storage unavailable — non-fatal, PIX screen just won't survive reloads
  }
}

const BookingFlowCtx = createContext<BookingFlowContext | null>(null);

export const BookingFlowProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<BookingFlowState>(() => ({
    ...initialState,
    ...loadSession(),
  }));

  const update = (partial: Partial<BookingFlowState>) =>
    setState((prev) => ({ ...prev, ...partial }));

  useEffect(() => {
    persistSession(
      state.createdBooking,
      state.pixPaymentData,
      state.cardPaymentData,
      state.onlinePaymentMode
    );
  }, [state.createdBooking, state.pixPaymentData, state.cardPaymentData, state.onlinePaymentMode]);

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
    setOnlinePaymentMode: (onlinePaymentMode) => update({ onlinePaymentMode }),
    setCreatedBooking: (booking) =>
      update({
        createdBooking: booking,
        step: 4,
      }),
    updateCreatedBooking: (booking) =>
      update({
        createdBooking: booking,
      }),
    clearCreatedBooking: () =>
      update({
        createdBooking: null,
        pixPaymentData: null,
        cardPaymentData: null,
      }),
    setPixPaymentData: (pixPaymentData) => update({ pixPaymentData }),
    setCardPaymentData: (cardPaymentData) => update({ cardPaymentData }),
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
    reset: () => setState({ ...initialState }),
  };

  return <BookingFlowCtx.Provider value={value}>{children}</BookingFlowCtx.Provider>;
};

export const useBookingFlow = (): BookingFlowContext => {
  const ctx = useContext(BookingFlowCtx);
  if (!ctx) throw new Error('useBookingFlow must be used inside BookingFlowProvider');
  return ctx;
};
