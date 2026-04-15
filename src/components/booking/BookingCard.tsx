import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, DollarSign, Hourglass } from 'lucide-react';
import type { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  className?: string;
}

function useCountdown(expiresAt: string | null | undefined): string | null {
  const [display, setDisplay] = useState<string | null>(null);

  useEffect(() => {
    if (!expiresAt) { setDisplay(null); return; }
    const tick = () => {
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

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, className }) => {
  const courtName = booking.court?.name ?? 'Quadra';
  const date = parseISO(booking.date);

  const countdown = useCountdown(
    booking.status === 'PENDING' ? booking.pendingExpiresAt : null
  );

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full text-left bg-card border border-border rounded-xl p-3 shadow-sm',
        'active:scale-[0.98] transition-transform duration-100',
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
        <BookingStatusBadge status={booking.status} />
      </div>

      {booking.status === 'PENDING' && (
        <div className={cn(
          'flex items-center gap-1.5 text-xs rounded-lg px-2.5 py-1.5 mb-2 border',
          countdown
            ? 'text-yellow-700 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800'
            : 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800'
        )}>
          <Hourglass size={12} className="shrink-0" />
          <span>
            {countdown
              ? `Aguardando confirmação — expira em ${countdown}`
              : 'Aguardando confirmação do administrador'}
          </span>
        </div>
      )}

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
    </button>
  );
};
