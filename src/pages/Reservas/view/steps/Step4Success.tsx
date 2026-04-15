import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, CalendarDays, Clock, MapPin, CreditCard, Hourglass, XCircle } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { BookingsService } from '@/services/bookings';
import { cn } from '@/lib/utils';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABELS: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PRESENCIAL: 'Presencial',
};

function useCountdown(expiresAt: string | null | undefined): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    const tick = () => {
      if (!expiresAt) { setDisplay(null); return; }
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) { setDisplay(null); return; }
      const m = Math.floor(diff / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setDisplay(`${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [expiresAt]);

  return display;
}

export const Step4Success: React.FC<{ onViewHistory?: () => void }> = ({ onViewHistory }) => {
  const { createdBooking, pendingExpiresAt, updateCreatedBooking, reset } = useBookingFlow();

  const { data: polledBooking } = useQuery({
    queryKey: ['booking-poll', createdBooking?.id],
    queryFn: () => BookingsService.getBooking(createdBooking!.id),
    enabled: !!createdBooking && createdBooking.status === 'PENDING',
    refetchInterval: 10_000,
    refetchIntervalInBackground: false,
    staleTime: 0,
  });

  useEffect(() => {
    if (
      polledBooking &&
      polledBooking.id === createdBooking?.id &&
      polledBooking.status !== createdBooking?.status
    ) {
      updateCreatedBooking(polledBooking);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [polledBooking]);

  const countdown = useCountdown(
    createdBooking?.status === 'PENDING' ? pendingExpiresAt : null
  );

  if (!createdBooking) return null;

  const date = parseISO(createdBooking.date);
  const isPending = createdBooking.status === 'PENDING';
  const isCancelled = createdBooking.status === 'CANCELLED';

  return (
    <div className="flex flex-col items-center gap-6 py-4 animate-fade-in">
      <div className="flex flex-col items-center gap-3 text-center">
        {isCancelled ? (
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle size={44} className="text-red-600 dark:text-red-400" />
          </div>
        ) : isPending ? (
          <div className="w-20 h-20 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
            <Hourglass size={44} className="text-yellow-600 dark:text-yellow-400" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
          </div>
        )}
        <h2 className="text-xl font-bold text-foreground">
          {isCancelled
            ? 'Reserva expirada'
            : isPending
            ? 'Aguardando confirmação'
            : 'Reserva confirmada!'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isCancelled
            ? 'A reserva foi cancelada pois não foi confirmada dentro do prazo. Qualquer cashback utilizado foi devolvido.'
            : isPending
            ? 'Sua reserva foi recebida e está aguardando confirmação do administrador.'
            : 'Sua quadra está confirmada. Apareça no horário combinado e boa partida! 🏐'}
        </p>
      </div>

      {isPending && (
        <div
          className={cn(
            'w-full flex items-center gap-3 rounded-2xl px-4 py-3 border',
            countdown
              ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-800 dark:text-yellow-300'
              : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-700 dark:text-red-400'
          )}
        >
          <Hourglass size={18} className="shrink-0" />
          <div className="flex flex-col gap-0.5">
            <span className="text-sm font-semibold">
              {countdown ? `Confirme em ${countdown}` : 'Prazo de confirmação esgotando…'}
            </span>
            <span className="text-xs opacity-75">
              Se não confirmada em 30 min, a reserva é cancelada automaticamente.
            </span>
          </div>
        </div>
      )}

      <div className="w-full bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2 pb-3 border-b border-border">
          <MapPin size={15} className="text-primary shrink-0" />
          <div>
            <p className="font-semibold text-foreground leading-tight">
              {createdBooking.court?.name ?? 'Quadra'}
            </p>
            <p className="text-xs text-muted-foreground">
              {createdBooking.court?.sport?.name ?? ''}
            </p>
          </div>
        </div>

        <div
          className={cn(
            'grid gap-3 text-sm',
            createdBooking.cashbackUsed > 0 ? 'grid-cols-2' : 'grid-cols-2'
          )}
        >
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CalendarDays size={12} />
              Data
            </span>
            <span className="font-medium">
              {format(date, "dd/MM/yyyy (EEE)", { locale: ptBR })}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <Clock size={12} />
              Horário
            </span>
            <span className="font-medium">
              {createdBooking.startTime} – {createdBooking.endTime}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground flex items-center gap-1">
              <CreditCard size={12} />
              Pagamento
            </span>
            <span className="font-medium">
              {PAYMENT_LABELS[createdBooking.paymentMethod ?? 'PRESENCIAL']}
            </span>
          </div>
          <div className="flex flex-col gap-0.5">
            <span className="text-xs text-muted-foreground">Total final</span>
            <span className="font-bold text-primary">{fmt(createdBooking.finalAmount)}</span>
          </div>
        </div>

        {createdBooking.cashbackUsed > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 text-sm text-orange-700 dark:text-orange-400">
            💰 Cashback utilizado: {fmt(createdBooking.cashbackUsed)}
          </div>
        )}
      </div>

      <div className="w-full flex flex-col gap-3">
        <button
          onClick={reset}
          className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          Nova reserva
        </button>
        <button
          onClick={() => { reset(); onViewHistory?.(); }}
          className="w-full border border-border text-foreground font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
        >
          Ver histórico
        </button>
      </div>
    </div>
  );
};
