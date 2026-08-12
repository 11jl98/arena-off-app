import { useState } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Loader2, CalendarDays, History, Plus } from 'lucide-react';
import { useNotify } from '@/hooks/useNotify';
import { BookingFlowProvider, useBookingFlow } from '@/hooks/useBookingFlow';
import { Step1Courts } from './steps/Step1Courts';
import { Step2DateTime } from './steps/Step2DateTime';
import { Step3Checkout } from './steps/Step3Checkout';
import { Step4Payment } from './steps/Step4Payment';
import { BookingCard } from '@/components/booking/BookingCard';
import { BookingDetailSheet } from '@/components/booking/BookingDetailSheet';
import { BookingsService } from '@/services/bookings';
import { cn } from '@/lib/utils';
import type { Booking } from '@/types/booking';

const STEP_TITLES = ['Escolha a quadra', 'Data e horário', 'Confirmação', 'Finalizar'];

const WizardContent: React.FC<{ onViewHistory: () => void }> = ({ onViewHistory }) => {
  const { step, goBack, reset } = useBookingFlow();

  const showBackButton = step === 2 || step === 3;
  const showProgress = step <= 3;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        {showBackButton ? (
          <button
            onClick={goBack}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
          >
            <ChevronLeft size={20} />
          </button>
        ) : step === 4 ? null : (
          <div className="w-8" />
        )}
        <h2 className="font-bold text-foreground text-base flex-1">{STEP_TITLES[step - 1]}</h2>
        {step === 4 && (
          <button
            onClick={reset}
            className="text-xs text-primary font-medium"
          >
            Nova reserva
          </button>
        )}
      </div>

      {showProgress && (
        <div className="flex gap-1.5">
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              className={cn(
                'h-1 flex-1 rounded-full transition-colors duration-300',
                s <= step ? 'bg-primary' : 'bg-muted'
              )}
            />
          ))}
        </div>
      )}

      {step === 1 && <Step1Courts />}
      {step === 2 && <Step2DateTime />}
      {step === 3 && <Step3Checkout />}
      {step === 4 && <Step4Payment onViewHistory={onViewHistory} />}
    </div>
  );
};

const HistoryTab: React.FC<{ onContinuePayment: (booking: Booking) => void }> = ({
  onContinuePayment,
}) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const { success: showSuccess, error: showError } = useNotify();
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => BookingsService.listMyBookings({ pageSize: 50 }),
    staleTime: 15_000,
  });

  const { mutate: cancelBooking, isPending: cancelling } = useMutation({
    mutationFn: (booking: Booking) => BookingsService.cancelBooking(booking.id),
    onSuccess: () => {
      showSuccess('Reserva cancelada com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking'] });
    },
    onError: (err: Error) => {
      const msg =
        (err as unknown as { status?: number }).status === 403 ||
        err.message?.includes('403') ||
        err.message?.toLowerCase().includes('own bookings')
          ? 'Você não pode cancelar a reserva de outro cliente.'
          : err.message || 'Erro ao cancelar reserva.';
      showError(msg);
    },
  });

  const bookings = data ?? [];

  const handleCancel = (booking: Booking) => {
    cancelBooking(booking, {
      onSuccess: () => {
        if (selectedId === booking.id) setSelectedId(null);
      },
    });
  };

  return (
    <>
      {isLoading && (
        <div className="flex justify-center py-12">
          <Loader2 size={28} className="animate-spin text-primary" />
        </div>
      )}

      {!isLoading && bookings.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-14 text-center">
          <CalendarDays size={40} className="text-muted-foreground/40" />
          <p className="text-muted-foreground text-sm">Nenhuma reserva encontrada.</p>
          <p className="text-xs text-muted-foreground/70">
            Suas reservas aparecerão aqui após você agendar.
          </p>
        </div>
      )}

      {bookings.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => setSelectedId(booking.id)}
              onContinuePayment={onContinuePayment}
              onCancel={handleCancel}
              cancelling={cancelling}
            />
          ))}
        </div>
      )}

      <BookingDetailSheet
        bookingId={selectedId}
        onClose={() => setSelectedId(null)}
        onContinuePayment={(booking) => {
          setSelectedId(null);
          onContinuePayment(booking);
        }}
      />
    </>
  );
};

type ActiveTab = 'nova' | 'historico';

const ReservasContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('nova');
  const { isStandalone } = useDeviceDetection();
  const { resumeBooking } = useBookingFlow();

  const handleContinuePayment = (booking: Booking) => {
    resumeBooking(booking);
    setActiveTab('nova');
  };

  return (
    <div className="flex flex-col min-h-full">
      <div
        className="bg-linear-to-r from-primary to-orange-600"
        style={{ paddingTop: isStandalone ? 'calc(2rem + env(safe-area-inset-top))' : '0.75rem' }}
      >
        <div className="mx-auto w-full max-w-5xl px-4 lg:px-8 pb-4">
          <h1 className="text-xl font-bold text-white">Reservas</h1>
          <p className="text-white/80 text-sm mt-0.5">Agende quadras e veja seu histórico</p>
        </div>
      </div>

      <div className="mx-auto w-full max-w-5xl px-4 lg:px-8 -mt-3 mb-4">
        <div className="bg-card border border-border rounded-2xl p-1 flex shadow-sm">
          <button
            onClick={() => setActiveTab('nova')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              activeTab === 'nova'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground'
            )}
          >
            <Plus size={15} />
            Nova reserva
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={cn(
              'flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              activeTab === 'historico'
                ? 'bg-primary text-primary-foreground shadow'
                : 'text-muted-foreground'
            )}
          >
            <History size={15} />
            Histórico
          </button>
        </div>
      </div>

      <div className="flex-1 mx-auto w-full max-w-5xl px-4 lg:px-8 pb-4">
        {activeTab === 'nova' ? (
          <WizardContent onViewHistory={() => setActiveTab('historico')} />
        ) : (
          <HistoryTab onContinuePayment={handleContinuePayment} />
        )}
      </div>
    </div>
  );
};

export const ReservasView: React.FC = () => {
  return (
    <BookingFlowProvider>
      <ReservasContent />
    </BookingFlowProvider>
  );
};
