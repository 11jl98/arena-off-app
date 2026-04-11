import { useState } from 'react';
import { format, parseISO, addHours, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CalendarDays,
  Clock,
  MapPin,
  CreditCard,
  X,
  AlertTriangle,
  Loader2,
  Ban,
} from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { BookingStatusBadge } from '@/components/booking/BookingStatusBadge';
import { BookingsService } from '@/services/bookings';
import { useNotify } from '@/hooks/useNotify';
import { cn } from '@/lib/utils';
const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABELS: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PRESENCIAL: 'Presencial',
};

interface BookingDetailSheetProps {
  bookingId: string | null;
  onClose: () => void;
}

export const BookingDetailSheet: React.FC<BookingDetailSheetProps> = ({
  bookingId,
  onClose,
}) => {
  const open = !!bookingId;
  const { success: showSuccess, error: showError } = useNotify();
  const queryClient = useQueryClient();
  const [confirmCancel, setConfirmCancel] = useState(false);

  const { data: booking, isLoading } = useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => BookingsService.getBooking(bookingId!),
    enabled: !!bookingId,
    staleTime: 30 * 1000,
  });

  const { mutate: cancelBooking, isPending: cancelling } = useMutation({
    mutationFn: () => BookingsService.cancelBooking(bookingId!),
    onSuccess: () => {
      showSuccess('Reserva cancelada com sucesso.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setConfirmCancel(false);
      onClose();
    },
    onError: (err: Error) => {
      showError(err.message || 'Erro ao cancelar reserva.');
      setConfirmCancel(false);
    },
  });

  const isCancellableStatus =
    booking?.status === 'PENDING' || booking?.status === 'CONFIRMED';

  const isCancellableByTime = (() => {
    if (!booking) return false;
    // Constrói a data/hora como local (sem conversão de timezone)
    const dateOnly = booking.date.substring(0, 10); // "YYYY-MM-DD"
    const bookingStart = new Date(`${dateOnly}T${booking.startTime}:00`);
    // Permite cancelar apenas se faltam mais de 2 horas para o início
    return isBefore(addHours(new Date(), 2), bookingStart);
  })();

  const canCancel = isCancellableStatus && isCancellableByTime;

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="flex items-center justify-between pr-4">
          <DrawerTitle className="text-base">Detalhes da Reserva</DrawerTitle>
          <DrawerClose asChild>
            <button className="rounded-full p-1 hover:bg-muted transition-colors">
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto px-4 pb-8 flex flex-col gap-4">
          {isLoading && (
            <div className="flex justify-center py-8">
              <Loader2 size={28} className="animate-spin text-primary" />
            </div>
          )}

          {booking && (
            <>
              {/* Court info */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <MapPin size={16} className="text-primary mt-0.5 shrink-0" />
                  <div>
                    <p className="font-bold text-foreground">{booking.court?.name ?? 'Quadra'}</p>
                    <p className="text-xs text-muted-foreground">
                      {booking.court?.sport?.name ?? ''}
                    </p>
                  </div>
                </div>
                <BookingStatusBadge status={booking.status} />
              </div>

              {/* Details grid */}
              <div className="bg-muted/50 rounded-2xl p-4 grid grid-cols-2 gap-4 text-sm">
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CalendarDays size={11} /> Data
                  </span>
                  <span className="font-medium">
                    {format(parseISO(booking.date), "dd/MM/yyyy", { locale: ptBR })}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock size={11} /> Horário
                  </span>
                  <span className="font-medium">
                    {booking.startTime} – {booking.endTime}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    <CreditCard size={11} /> Pagamento
                  </span>
                  <span className="font-medium">
                    {PAYMENT_LABELS[booking.paymentMethod ?? 'PRESENCIAL']}
                  </span>
                </div>
                <div className="flex flex-col gap-0.5">
                  <span className="text-xs text-muted-foreground">Status pag.</span>
                  <span
                    className={cn(
                      'font-medium text-xs',
                      booking.paymentStatus === 'PAID'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-yellow-600 dark:text-yellow-400'
                    )}
                  >
                    {booking.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                  </span>
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-card border border-border rounded-2xl p-4 flex flex-col gap-2 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Valor calculado</span>
                  <span>{fmt(booking.calculatedAmount)}</span>
                </div>
                {booking.cashbackUsed > 0 && (
                  <div className="flex justify-between text-orange-500">
                    <span>Cashback usado</span>
                    <span>- {fmt(booking.cashbackUsed)}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold border-t border-border pt-2">
                  <span>Total final</span>
                  <span className="text-primary">{fmt(booking.finalAmount)}</span>
                </div>
              </div>

              {/* Cancel */}
              {canCancel && (
                <div className="pt-2">
                  {confirmCancel ? (
                    <div className="flex flex-col gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                      <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                        <AlertTriangle size={16} />
                        <p className="text-sm font-medium">Confirmar cancelamento?</p>
                      </div>
                      <p className="text-xs text-red-600 dark:text-red-400">
                        Esta ação não pode ser desfeita.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setConfirmCancel(false)}
                          disabled={cancelling}
                          className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
                        >
                          Não, manter
                        </button>
                        <button
                          onClick={() => cancelBooking()}
                          disabled={cancelling}
                          className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                        >
                          {cancelling && <Loader2 size={14} className="animate-spin" />}
                          Cancelar reserva
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmCancel(true)}
                      className="w-full py-3 rounded-xl border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 text-sm font-medium active:scale-[0.98] transition-transform"
                    >
                      Cancelar reserva
                    </button>
                  )}
                </div>
              )}

              {/* Aviso: prazo de cancelamento expirado */}
              {isCancellableStatus && !isCancellableByTime && (
                <div className="pt-2">
                  <div className="flex items-start gap-2 bg-muted/60 border border-border rounded-2xl p-4">
                    <Ban size={16} className="text-muted-foreground mt-0.5 shrink-0" />
                    <div className="flex flex-col gap-0.5">
                      <p className="text-sm font-medium text-foreground">Cancelamento indisponível</p>
                      <p className="text-xs text-muted-foreground">
                        O prazo para cancelamento expirou. Reservas só podem ser canceladas com pelo menos 2 horas de antecedência.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
