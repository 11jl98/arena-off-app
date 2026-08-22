import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, DollarSign, Loader2, AlertTriangle } from 'lucide-react';
import type { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { isPendingOnlinePayment } from '@/utils/helpers/booking.helper';
import { usePaymentCountdown } from '@/pages/Reservas/hooks/usePaymentCountdown';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  onContinuePayment?: (booking: Booking) => void;
  onCancel?: (booking: Booking) => void;
  cancelling?: boolean;
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({
  booking,
  onClick,
  onContinuePayment,
  onCancel,
  cancelling,
  className,
}) => {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const courtName = booking.court?.name ?? 'Quadra';
  const date = parseISO(booking.date.substring(0, 10) + 'T12:00:00');

  const isPendingUnpaid = isPendingOnlinePayment(booking);

  const { expired: pendingExpired } = usePaymentCountdown(
    isPendingUnpaid ? booking.pendingExpiresAt : null
  );

  const showActions = isPendingUnpaid && !pendingExpired && (onContinuePayment || onCancel);

  return (
    <div
      onClick={onClick}
      className={cn(
        'w-full text-left bg-card border border-border rounded-xl p-3 shadow-sm',
        'active:scale-[0.98] transition-transform duration-100',
        onClick && 'cursor-pointer',
        className
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 text-muted-foreground text-xs mb-0.5">
            <MapPin size={12} />
            <span className="truncate">{booking.court?.sport?.name ?? 'Esporte'}</span>
          </div>
          <h3 className="font-semibold text-foreground truncate">{courtName}</h3>
        </div>
        <BookingStatusBadge
          status={booking.status}
          paymentStatus={booking.paymentStatus}
        />
      </div>

      <div className="flex items-center gap-4 text-sm text-muted-foreground">
        <span className="flex items-center gap-1">
          <CalendarDays size={14} />
          {format(date, "dd 'de' MMM", { locale: ptBR })}
        </span>
        <span className="flex items-center gap-1">
          <Clock size={14} />
          {booking.startTime} – {booking.endTime}
        </span>
        <span className="flex items-center gap-1 ml-auto font-medium text-foreground">
          <DollarSign size={14} />
          {booking.finalAmount.toLocaleString('pt-BR', {
            style: 'currency',
            currency: 'BRL',
          })}
        </span>
      </div>

      {pendingExpired && (
        <div className="mt-3 pt-3 border-t border-border">
          <p className="text-xs text-muted-foreground">Pagamento expirado — reserva cancelada.</p>
        </div>
      )}

      {showActions && (
        <div
          className="mt-3 pt-3 border-t border-border flex gap-2"
          onClick={(e) => e.stopPropagation()}
        >
          {onContinuePayment && (
            <button
              onClick={() => onContinuePayment(booking)}
              className="flex-1 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-semibold active:scale-[0.98] transition-transform"
            >
              Concluir pagamento
            </button>
          )}
          {onCancel &&
            (confirmCancel ? (
              <div className="flex-1 flex items-center gap-1.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-2">
                <AlertTriangle size={13} className="text-red-600 dark:text-red-400 shrink-0" />
                <button
                  onClick={() => setConfirmCancel(false)}
                  disabled={cancelling}
                  className="flex-1 py-2 text-xs font-medium text-muted-foreground"
                >
                  Manter
                </button>
                <button
                  onClick={() => onCancel(booking)}
                  disabled={cancelling}
                  className="flex-1 py-2 text-xs font-semibold text-red-600 dark:text-red-400 flex items-center justify-center gap-1 disabled:opacity-60"
                >
                  {cancelling && <Loader2 size={12} className="animate-spin" />}
                  Cancelar
                </button>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancel(true)}
                className="flex-1 py-2 rounded-lg border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-xs font-medium active:scale-[0.98] transition-transform"
              >
                Cancelar reserva
              </button>
            ))}
        </div>
      )}
    </div>
  );
};
