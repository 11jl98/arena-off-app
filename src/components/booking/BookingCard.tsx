import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { CalendarDays, Clock, MapPin, DollarSign } from 'lucide-react';
import type { Booking } from '@/types/booking';
import { BookingStatusBadge } from './BookingStatusBadge';
import { cn } from '@/lib/utils';

interface BookingCardProps {
  booking: Booking;
  onClick?: () => void;
  className?: string;
}

export const BookingCard: React.FC<BookingCardProps> = ({ booking, onClick, className }) => {
  const courtName = booking.court?.name ?? 'Quadra';
  const date = parseISO(booking.date);

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
