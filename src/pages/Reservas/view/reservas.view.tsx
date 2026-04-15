import { useState } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, Loader2, CalendarDays, History, Plus } from 'lucide-react';
import { BookingFlowProvider, useBookingFlow } from '@/hooks/useBookingFlow';
import { Step1Courts } from './steps/Step1Courts';
import { Step2DateTime } from './steps/Step2DateTime';
import { Step3Checkout } from './steps/Step3Checkout';
import { Step4Success } from './steps/Step4Success';
import { BookingCard } from '@/components/booking/BookingCard';
import { BookingDetailSheet } from '@/components/booking/BookingDetailSheet';
import { BookingsService } from '@/services/bookings';
import { cn } from '@/lib/utils';

const STEP_TITLES = ['Escolha a quadra', 'Data e horário', 'Confirmação', 'Reservado!'];

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
      {step === 4 && <Step4Success onViewHistory={onViewHistory} />}
    </div>
  );
};

const HistoryTab: React.FC = () => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['my-bookings'],
    queryFn: () => BookingsService.listMyBookings({ pageSize: 50 }),
    staleTime: 15_000,
    refetchInterval: (query) => {
      const bookings = query.state.data ?? [];
      return bookings.some((b) => b.status === 'PENDING') ? 15_000 : false;
    },
  });

  const bookings = data ?? [];

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
        <div className="flex flex-col gap-3">
          {bookings.map((booking) => (
            <BookingCard
              key={booking.id}
              booking={booking}
              onClick={() => setSelectedId(booking.id)}
            />
          ))}
        </div>
      )}

      <BookingDetailSheet
        bookingId={selectedId}
        onClose={() => setSelectedId(null)}
      />
    </>
  );
};

type ActiveTab = 'nova' | 'historico';

export const ReservasView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('nova');
  const { isStandalone } = useDeviceDetection();

  return (
    <div className="flex flex-col min-h-full">
      <div
        className="bg-linear-to-r from-primary to-orange-600 px-4 pb-4"
        style={{ paddingTop: isStandalone ? 'calc(2rem + env(safe-area-inset-top))' : '0.75rem' }}
      >
        <h1 className="text-xl font-bold text-white">Reservas</h1>
        <p className="text-white/80 text-sm mt-0.5">Agende quadras e veja seu histórico</p>
      </div>

      <div className="px-4 -mt-3 mb-4">
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

      <div className="flex-1 px-4 pb-4">
        {activeTab === 'nova' ? (
          <BookingFlowProvider>
            <WizardContent onViewHistory={() => setActiveTab('historico')} />
          </BookingFlowProvider>
        ) : (
          <HistoryTab />
        )}
      </div>
    </div>
  );
};
