import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CheckCircle2, CalendarDays, Clock, MapPin, CreditCard } from 'lucide-react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { cn } from '@/lib/utils';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABELS: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PRESENCIAL: 'Presencial',
};

export const Step4Success: React.FC<{ onViewHistory?: () => void }> = ({ onViewHistory }) => {
  const { createdBooking, reset } = useBookingFlow();

  if (!createdBooking) return null;

  const date = parseISO(createdBooking.date);

  return (
    <div className="flex flex-col items-center gap-6 py-4 animate-fade-in">
      {/* Success icon */}
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Reserva realizada!</h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          Sua quadra está reservada. Apareça no horário combinado e boa partida! 🏐
        </p>
      </div>

      {/* Booking detail card */}
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
            <span className="text-xs text-muted-foreground">Total pago</span>
            <span className="font-bold text-primary">{fmt(createdBooking.finalAmount)}</span>
          </div>
        </div>

        {createdBooking.cashbackUsed > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 text-sm text-orange-700 dark:text-orange-400">
            💰 Cashback utilizado: {fmt(createdBooking.cashbackUsed)}
          </div>
        )}
      </div>

      {/* Actions */}
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
