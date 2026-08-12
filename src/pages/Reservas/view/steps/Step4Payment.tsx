import { useCallback, useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  MapPin,
  CreditCard,
  Bell,
  X,
  XCircle,
  Loader2,
} from 'lucide-react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { usePaymentStatus } from '@/pages/Reservas/hooks/usePaymentStatus';
import { usePaymentCountdown } from '@/pages/Reservas/hooks/usePaymentCountdown';
import { PaymentMethodSelector } from '@/pages/Reservas/components/PaymentMethodSelector';
import { PixPaymentPanel } from '@/pages/Reservas/components/PixPaymentPanel';
import { CardPaymentForm } from '@/pages/Reservas/components/CardPaymentForm';
import { PaymentsService } from '@/services/payments';
import { BookingsService } from '@/services/bookings';
import { useUserStore } from '@/store/userStore';
import { useNotify } from '@/hooks/useNotify';
import { isOnlinePayment, getBookingPaymentLabel } from '@/utils/helpers/booking.helper';
import { cn } from '@/lib/utils';
import type { InitiatePaymentResponse, OnlinePaymentMethod } from '@/types/payment';

type Phase = 'select' | 'pix' | 'card' | 'processing' | 'success' | 'expired';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

function deriveInitialPhase(
  bookingStatus?: string,
  paymentData?: InitiatePaymentResponse | null
): Phase {
  if (bookingStatus === 'CONFIRMED') return 'success';
  if (bookingStatus === 'CANCELLED') return 'expired';
  if (paymentData) {
    if (paymentData.method === 'PIX') return 'pix';
    if (paymentData.status === 'approved') return 'success';
    return 'processing';
  }
  return 'select';
}

export const Step4Payment: React.FC<{ onViewHistory?: () => void }> = ({ onViewHistory }) => {
  const { createdBooking, reset, paymentData, setPaymentData, updateCreatedBooking, setStep } =
    useBookingFlow();
  const queryClient = useQueryClient();
  const currentUser = useUserStore((s) => s.user);
  const { success: showSuccess, error: showError } = useNotify();
  const { isSupported, requestPermissionAndSubscribe } = usePushSubscription();

  const [phase, setPhase] = useState<Phase>(() =>
    deriveInitialPhase(createdBooking?.status, paymentData)
  );
  const [initiating, setInitiating] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [showPushBanner, setShowPushBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isSupported) return false;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'default') return false;
    if (localStorage.getItem('push_asked') === '1') return false;
    return true;
  });

  const bookingId = createdBooking?.id;
  const isOnline = isOnlinePayment(createdBooking);
  const isPolling = isOnline && phase !== 'success' && phase !== 'expired';
  const { data: polledBooking } = usePaymentStatus(isPolling ? bookingId : null, isPolling);

  const expiresAt = createdBooking?.pendingExpiresAt ?? paymentData?.pendingExpiresAt;
  const { formatted: countdown } = usePaymentCountdown(expiresAt);

  useEffect(() => {
    if (!polledBooking) return;
    if (polledBooking.status === 'CONFIRMED') {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      updateCreatedBooking(polledBooking);
      setPaymentData(null);
      setPhase('success');
    } else if (polledBooking.status === 'CANCELLED') {
      setPaymentData(null);
      setPhase('expired');
    }
  }, [polledBooking, queryClient, updateCreatedBooking, setPaymentData]);

  const handleSelectMethod = async (m: OnlinePaymentMethod) => {
    if (!createdBooking) return;
    if (m === 'CREDIT_CARD') {
      setPhase('card');
      return;
    }
    setInitiating(true);
    try {
      const data = await PaymentsService.initiatePayment({
        bookingId: createdBooking.id,
        method: 'PIX',
      });
      setPaymentData(data);
      setPhase('pix');
    } catch (err) {
      const status = (err as unknown as { status?: number }).status;
      if (status === 400 && paymentData?.method === 'PIX') {
        setPhase('pix');
      } else {
        setPhase('select');
        showError((err as Error).message || 'Não foi possível gerar o PIX. Tente novamente.');
      }
    } finally {
      setInitiating(false);
    }
  };

  const handleCardApproved = useCallback(
    (data: InitiatePaymentResponse) => {
      setPaymentData(data);
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      if (bookingId) queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      setPhase('success');
    },
    [bookingId, queryClient, setPaymentData]
  );

  const handleCardInProcess = useCallback(
    (data: InitiatePaymentResponse) => {
      setPaymentData(data);
      setPhase('processing');
    },
    [setPaymentData]
  );

  const handleCancel = async () => {
    if (!createdBooking || cancelling) return;
    setCancelling(true);
    try {
      await BookingsService.cancelBooking(createdBooking.id);
      showSuccess('Reserva cancelada. O horário foi liberado.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['booking', createdBooking.id] });
      queryClient.invalidateQueries({ queryKey: ['booking-poll', createdBooking.id] });
      setPaymentData(null);
      setPhase('expired');
    } catch (err) {
      showError((err as Error).message || 'Erro ao cancelar a reserva. Tente novamente.');
    } finally {
      setCancelling(false);
    }
  };

  if (!createdBooking) return null;

  const showCountdownBanner =
    isOnline && phase !== 'success' && phase !== 'expired' && expiresAt;

  return (
    <div className="flex flex-col items-center gap-5 py-4 animate-fade-in">
      {showCountdownBanner && (
        <div className="w-full max-w-md flex items-center justify-between gap-3 bg-card border border-border rounded-2xl px-4 py-3">
          <div className="flex items-center gap-2 text-sm">
            <Clock size={15} className="text-primary" />
            <span className="text-muted-foreground">Tempo para pagar</span>
            <span className="font-mono font-bold tabular-nums text-foreground">{countdown}</span>
          </div>
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-1 text-xs font-medium text-red-600 dark:text-red-400 disabled:opacity-60"
          >
            {cancelling ? (
              <Loader2 size={13} className="animate-spin" />
            ) : (
              <XCircle size={13} />
            )}
            Cancelar reserva
          </button>
        </div>
      )}

      {phase === 'select' && (
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5">
          {initiating ? (
            <div className="h-64 flex flex-col items-center justify-center gap-3">
              <Loader2 size={24} className="animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Gerando pagamento...</p>
            </div>
          ) : (
            <PaymentMethodSelector amount={createdBooking.finalAmount} onSelect={handleSelectMethod} />
          )}
        </div>
      )}

      {phase === 'pix' && paymentData && (
        <div className="w-full max-w-md">
          <PixPaymentPanel paymentData={paymentData} expiresAt={expiresAt} />
        </div>
      )}

      {phase === 'card' && (
        <div className="w-full max-w-md">
          <CardPaymentForm
            bookingId={createdBooking.id}
            amount={createdBooking.finalAmount}
            payerEmail={currentUser?.email}
            payerCpf={currentUser?.cpf}
            onApproved={handleCardApproved}
            onInProcess={handleCardInProcess}
          />
        </div>
      )}

      {phase === 'processing' && (
        <div className="w-full max-w-md bg-card border border-border rounded-2xl p-6 flex flex-col items-center gap-3 text-center">
          <Loader2 size={32} className="animate-spin text-primary" />
          <h3 className="font-semibold text-foreground">Pagamento em análise</h3>
          <p className="text-sm text-muted-foreground">
            Estamos confirmando seu pagamento. A reserva será confirmada automaticamente em alguns
            instantes.
          </p>
        </div>
      )}

      {phase === 'success' && (
        <>
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
            </div>
            <h2 className="text-xl font-bold text-foreground">Reserva confirmada!</h2>
            <p className="text-sm text-muted-foreground max-w-xs">
              {isOnline
                ? 'Pagamento confirmado. Seu horário está garantido.'
                : 'Sua quadra está confirmada. Apareça no horário combinado e boa partida!'}
            </p>
          </div>

          <div className="w-full max-w-md bg-card border border-border rounded-2xl p-5 flex flex-col gap-3">
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

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CalendarDays size={12} />
                  Data
                </span>
                <span className="font-medium">
                  {format(parseISO(createdBooking.date.substring(0, 10) + 'T12:00:00'), "dd/MM/yyyy (EEE)", { locale: ptBR })}
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
                  {getBookingPaymentLabel(createdBooking)}
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-xs text-muted-foreground">Total final</span>
                <span className="font-bold text-primary">{fmt(createdBooking.finalAmount)}</span>
              </div>
            </div>

            {createdBooking.cashbackUsed > 0 && (
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl px-3 py-2 text-sm text-orange-700 dark:text-orange-400">
                Cashback utilizado: {fmt(createdBooking.cashbackUsed)}
              </div>
            )}
          </div>

          {showPushBanner && (
            <div className="w-full max-w-md flex items-start gap-3 bg-card border border-border rounded-2xl px-4 py-3">
              <div className="mt-0.5 shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                <Bell size={16} className="text-primary" />
              </div>
              <div className="flex-1 flex flex-col gap-2">
                <p className="text-sm font-semibold text-foreground leading-snug">
                  Receber notificações de confirmação?
                </p>
                <p className="text-xs text-muted-foreground">
                  Fique por dentro de atualizações importantes das suas reservas.
                </p>
                <button
                  onClick={async () => {
                    setShowPushBanner(false);
                    await requestPermissionAndSubscribe();
                  }}
                  className="self-start bg-primary text-primary-foreground text-xs font-semibold px-4 py-1.5 rounded-lg active:scale-95 transition-transform"
                >
                  Sim, quero!
                </button>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('push_asked', '1');
                  setShowPushBanner(false);
                }}
                aria-label="Dispensar"
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X size={16} />
              </button>
            </div>
          )}

          <div className="w-full max-w-md flex flex-col gap-3">
            <button
              onClick={reset}
              className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Nova reserva
            </button>
            <button
              onClick={() => {
                reset();
                onViewHistory?.();
              }}
              className="w-full border border-border text-foreground font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Ver histórico
            </button>
          </div>
        </>
      )}

      {phase === 'expired' && (
        <div className="flex flex-col items-center gap-3 text-center pt-4">
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle size={44} className="text-red-600 dark:text-red-400" />
          </div>
          <h2 className="text-xl font-bold text-foreground">Reserva cancelada</h2>
          <p className="text-sm text-muted-foreground max-w-xs">
            {isOnline
              ? 'O horário foi liberado. Você pode escolher outro horário e tentar novamente.'
              : 'A reserva foi cancelada. Qualquer cashback utilizado foi devolvido.'}
          </p>
          <div className="w-full max-w-md flex flex-col gap-3 mt-3">
            {isOnline && (
              <button
                onClick={() => setStep(2)}
                className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
              >
                Escolher outro horário
              </button>
            )}
            <button
              onClick={reset}
              className={cn(
                'w-full font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform',
                isOnline
                  ? 'border border-border text-foreground'
                  : 'bg-primary text-primary-foreground font-semibold'
              )}
            >
              Nova reserva
            </button>
            <button
              onClick={() => {
                reset();
                onViewHistory?.();
              }}
              className="w-full border border-border text-foreground font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              Ver histórico
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
