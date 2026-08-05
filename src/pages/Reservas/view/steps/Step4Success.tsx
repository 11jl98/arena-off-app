import { useEffect, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  CheckCircle2,
  CalendarDays,
  Clock,
  MapPin,
  CreditCard,
  Bell,
  X,
  Copy,
  ExternalLink,
  QrCode,
  XCircle,
  Loader2,
  Timer,
  RefreshCw,
  MessageCircle,
  FileText,
  Lock,
  AlertTriangle,
  Ban,
} from 'lucide-react';
import { useBookingFlow } from '@/hooks/useBookingFlow';
import { usePixPaymentWatch } from '@/hooks/usePixPaymentWatch';
import { useCountdown } from '@/hooks/useCountdown';
import { usePushSubscription } from '@/hooks/usePushSubscription';
import { useNotify } from '@/hooks/useNotify';
import { BookingsService } from '@/services/bookings';
import { CardPaymentForm } from '@/pages/Reservas/components/CardPaymentForm';
import { ARENA_CONTACT } from '@/utils/constants/app.constant';
import { cn } from '@/lib/utils';
import type { InitiateCardPaymentResponse } from '@/types';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PAYMENT_LABELS: Record<string, string> = {
  MERCADO_PAGO: 'Mercado Pago',
  PRESENCIAL: 'Presencial',
};

export const Step4Success: React.FC<{ onViewHistory?: () => void }> = ({ onViewHistory }) => {
  const {
    createdBooking,
    reset,
    pixPaymentData,
    paymentMethod,
    setStep,
    updateCreatedBooking,
    setPixPaymentData,
    clearCreatedBooking,
    onlinePaymentMode,
    cardPaymentData,
    setCardPaymentData,
  } = useBookingFlow();
  const { isSupported, requestPermissionAndSubscribe } = usePushSubscription();
  const { success: showSuccess, error: showError } = useNotify();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [confirmCancelUnpaid, setConfirmCancelUnpaid] = useState(false);

  const [showPushBanner, setShowPushBanner] = useState(() => {
    if (typeof window === 'undefined') return false;
    if (!isSupported) return false;
    if (typeof Notification === 'undefined') return false;
    if (Notification.permission !== 'default') return false;
    if (localStorage.getItem('push_asked') === '1') return false;
    return true;
  });

  const isOnline =
    paymentMethod === 'MERCADO_PAGO' || createdBooking?.paymentMethod === 'MERCADO_PAGO';
  const isConfirmed =
    createdBooking?.status === 'CONFIRMED' || createdBooking?.status === 'COMPLETED';
  const isCancelled = createdBooking?.status === 'CANCELLED';
  const isOnlinePending = !!createdBooking && isOnline && !isConfirmed && !isCancelled;
  const paymentMode = isOnline ? onlinePaymentMode : 'pix';
  const cardStatus = cardPaymentData?.status ?? null;

  const { booking: watchedBooking, refetch: refetchPix } = usePixPaymentWatch(
    isOnlinePending ? createdBooking!.id : null
  );

  useEffect(() => {
    if (!watchedBooking || !createdBooking) return;
    if (watchedBooking.id !== createdBooking.id) return;
    const terminal =
      watchedBooking.status === 'CONFIRMED' ||
      watchedBooking.status === 'COMPLETED' ||
      watchedBooking.status === 'CANCELLED';
    if (terminal && watchedBooking !== createdBooking) {
      updateCreatedBooking(watchedBooking);
    }
  }, [watchedBooking, createdBooking, updateCreatedBooking]);

  const expiresAt = pixPaymentData?.expiresAt ?? createdBooking?.pendingExpiresAt ?? null;
  const hasDeadline = !!expiresAt;
  const { isExpired: countdownExpired, formatted: countdownLabel } = useCountdown(expiresAt);

  useEffect(() => {
    if (countdownExpired && isOnlinePending) {
      refetchPix();
    }
  }, [countdownExpired, isOnlinePending, refetchPix]);

  const { mutate: cancelUnpaid, isPending: cancellingUnpaid } = useMutation({
    mutationFn: () => BookingsService.cancelBooking(createdBooking!.id),
    onSuccess: () => {
      showSuccess('Reserva cancelada e horário liberado.');
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['slots'] });
      setPixPaymentData(null);
      clearCreatedBooking();
      setStep(2);
    },
    onError: (err: Error) => {
      showError(err.message || 'Não foi possível cancelar a reserva.');
      setConfirmCancelUnpaid(false);
    },
  });

  const goChooseAnotherSlot = () => {
    queryClient.invalidateQueries({ queryKey: ['slots'] });
    setPixPaymentData(null);
    setCardPaymentData(null);
    clearCreatedBooking();
    setStep(2);
  };

  const handleCardApproved = (result: InitiateCardPaymentResponse) => {
    setCardPaymentData(result);
    queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
    queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
  };

  const handleCardPending = (result: InitiateCardPaymentResponse) => {
    setCardPaymentData(result);
  };

  if (!createdBooking) return null;

  const date = parseISO(createdBooking.date.substring(0, 10) + 'T12:00:00');
  const receiptUrl =
    createdBooking.receipt?.url ??
    createdBooking.payments?.find((p) => p.receipt?.url)?.receipt?.url;
  const showQr = isOnlinePending && paymentMode === 'pix' && !!pixPaymentData;
  const showCardForm =
    isOnlinePending && paymentMode === 'card' && cardStatus !== 'approved' && cardStatus !== 'pending';

  return (
    <div className="flex flex-col items-center gap-6 py-4 animate-fade-in">
      <div className="flex flex-col items-center gap-3 text-center">
        {isCancelled ? (
          <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
            <XCircle size={44} className="text-red-600 dark:text-red-400" />
          </div>
        ) : isConfirmed ? (
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 size={44} className="text-green-600 dark:text-green-400" />
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <QrCode size={44} className="text-primary" />
          </div>
        )}
        <h2 className="text-xl font-bold text-foreground">
          {isCancelled
            ? 'Reserva cancelada'
            : isConfirmed
              ? isOnline
                ? 'Pagamento confirmado!'
                : 'Reserva confirmada!'
              : 'Pagamento em andamento'}
        </h2>
        <p className="text-sm text-muted-foreground max-w-xs">
          {isCancelled
            ? 'O tempo para o pagamento expirou ou a reserva foi cancelada. O horário foi liberado para novas reservas.'
            : isConfirmed
              ? isOnline
                ? 'Seu pagamento foi confirmado e a reserva está garantida. Boa partida!'
                : 'Sua quadra está confirmada. Apareça no horário combinado e boa partida!'
              : showQr
                ? 'Escaneie o QR code ou copie a chave PIX para pagar. O horário está reservado para você.'
                : paymentMode === 'card'
                  ? 'Preencha os dados do cartão para concluir o pagamento. O horário está reservado para você.'
                  : 'Aguardando pagamento. O horário está reservado para você.'}
        </p>
      </div>

      {showQr && pixPaymentData && (
        <div className="w-full bg-card border border-border rounded-2xl overflow-hidden">
          <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border">
            <QrCode size={16} className="text-primary" />
            <span className="font-semibold text-foreground text-sm">Pague com PIX</span>
            {hasDeadline ? (
              <span
                className={cn(
                  'ml-auto flex items-center gap-1.5 text-xs font-medium',
                  countdownExpired
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-yellow-600 dark:text-yellow-400 animate-pulse'
                )}
              >
                <Timer size={12} />
                {countdownExpired ? 'Expirado' : countdownLabel}
              </span>
            ) : (
              <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse font-medium">
                <Loader2 size={12} className="animate-spin" />
                Aguardando pagamento...
              </span>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 px-5 py-5">
            <img
              src={`data:image/png;base64,${pixPaymentData.pixQrCodeBase64}`}
              alt="QR Code PIX"
              width={200}
              height={200}
              className="rounded-xl border border-border"
            />

            <div className="w-full flex flex-col gap-1.5">
              <p className="text-xs text-muted-foreground font-medium">Chave PIX (Cópia e Cola)</p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground truncate">
                  {pixPaymentData.pixQrCode}
                </div>
                <button
                  onClick={async () => {
                    try {
                      await navigator.clipboard.writeText(pixPaymentData.pixQrCode);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    } catch {
                      // fallback: noop
                    }
                  }}
                  className={cn(
                    'shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95',
                    copied
                      ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                      : 'bg-primary/10 text-primary'
                  )}
                >
                  <Copy size={13} />
                  {copied ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <a
              href={pixPaymentData.pixTicketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-medium text-foreground active:scale-[0.98] transition-transform"
            >
              <ExternalLink size={14} />
              Abrir no app do banco
            </a>

            <p className="text-xs text-muted-foreground text-center">
              {hasDeadline
                ? `O horário está reservado para você até ${countdownLabel}. Após o prazo, se o pagamento não for confirmado, o horário é liberado automaticamente.`
                : 'O horário está reservado para você enquanto o pagamento estiver pendente.'}
            </p>

            <div className="w-full flex items-start gap-2.5 bg-muted/60 border border-border rounded-xl px-3.5 py-3">
              <Lock size={14} className="text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground leading-relaxed">
                Reservas pagas via PIX não podem ser canceladas pelo app. Para cancelamento ou
                reembolso, fale com a arena pelo WhatsApp.
              </p>
            </div>
          </div>
        </div>
      )}

      {showCardForm && (
        <CardPaymentForm
          booking={createdBooking}
          onApproved={handleCardApproved}
          onPending={handleCardPending}
        />
      )}

      {isOnlinePending && paymentMode === 'card' && cardStatus === 'pending' && (
        <div className="w-full bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
          <Loader2 size={26} className="text-amber-600 dark:text-amber-400 animate-spin" />
          <p className="text-sm font-semibold text-foreground">Pagamento em análise</p>
          <p className="text-xs text-muted-foreground">
            Seu pagamento está sendo processado. A confirmação chega em instantes.
          </p>
        </div>
      )}

      {isOnlinePending && paymentMode === 'card' && cardStatus === 'approved' && (
        <div className="w-full bg-card border border-green-200 dark:border-green-800 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
          <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
          <p className="text-sm font-semibold text-foreground">Pagamento aprovado!</p>
          <p className="text-xs text-muted-foreground">
            Estamos confirmando sua reserva. Um instante...
          </p>
        </div>
      )}

      {isOnlinePending && paymentMode === 'pix' && !showQr && (
        <div className="w-full bg-card border border-border rounded-2xl px-4 py-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            <Loader2 size={13} className="animate-spin" />
            Já existe um pagamento ativo para esta reserva. Aguardando confirmação...
          </div>
          <p className="text-xs text-muted-foreground">
            Se o QR code não aparecer, feche e reabra esta tela ou fale com a arena pelo WhatsApp.
          </p>
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

        <div className="grid gap-3 text-sm grid-cols-2">
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
            Cashback utilizado: {fmt(createdBooking.cashbackUsed)}
          </div>
        )}

        {isConfirmed && isOnline && (
          <div className="border-t border-border pt-3 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <FileText size={15} className="text-primary" />
              <span className="text-sm font-semibold text-foreground">Comprovante</span>
            </div>
            {receiptUrl ? (
              <a
                href={receiptUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 bg-primary/10 border border-primary text-primary font-semibold text-sm py-2.5 rounded-xl active:scale-[0.98] transition-transform"
              >
                <ExternalLink size={14} />
                Ver comprovante
              </a>
            ) : (
              <p className="text-xs text-muted-foreground">
                Comprovante disponível em breve no histórico de reservas.
              </p>
            )}
          </div>
        )}
      </div>

      {isConfirmed && isOnline && (
        <div className="w-full flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-2xl px-4 py-3">
          <AlertTriangle size={15} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="flex-1 flex flex-col gap-2">
            <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed">
              <span className="font-semibold">Cancelamento bloqueado:</span> reservas pagas online
              não podem ser canceladas pelo app. Para cancelar ou reembolsar, entre em contato com a
              arena.
            </p>
            <a
              href={ARENA_CONTACT.WHATSAPP_LINK}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-1.5 self-start bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-lg active:scale-95 transition-transform"
            >
              <MessageCircle size={13} />
              Falar no WhatsApp
            </a>
          </div>
        </div>
      )}

      {showPushBanner && isConfirmed && !isCancelled && (
        <div className="w-full flex items-start gap-3 bg-card border border-border rounded-2xl px-4 py-3">
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

      <div className="w-full flex flex-col gap-3">
        {isOnlinePending && (
          <>
            <button
              onClick={() => refetchPix()}
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
            >
              <RefreshCw size={15} />
              Verificar pagamento
            </button>

            {confirmCancelUnpaid ? (
              <div className="flex flex-col gap-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4">
                <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                  <AlertTriangle size={16} />
                  <p className="text-sm font-medium">Cancelar e liberar este horário?</p>
                </div>
                <p className="text-xs text-red-600 dark:text-red-400">
                  O horário será liberado para outras pessoas e o pagamento será cancelado.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmCancelUnpaid(false)}
                    disabled={cancellingUnpaid}
                    className="flex-1 py-2.5 rounded-xl border border-border text-sm font-medium"
                  >
                    Não, manter
                  </button>
                  <button
                    onClick={() => cancelUnpaid()}
                    disabled={cancellingUnpaid}
                    className="flex-1 py-2.5 rounded-xl bg-red-600 text-white text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {cancellingUnpaid && <Loader2 size={14} className="animate-spin" />}
                    Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setConfirmCancelUnpaid(true)}
                className="w-full flex items-center justify-center gap-2 border border-red-300 dark:border-red-800 text-red-600 dark:text-red-400 font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
              >
                <Ban size={15} />
                Cancelar e escolher outro horário
              </button>
            )}
          </>
        )}

        {isCancelled && isOnline && (
          <button
            onClick={goChooseAnotherSlot}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Escolher outro horário
          </button>
        )}

        {isConfirmed && (
          <button
            onClick={reset}
            className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Nova reserva
          </button>
        )}

        {!isOnlinePending && (
          <button
            onClick={() => {
              reset();
              onViewHistory?.();
            }}
            className="w-full border border-border text-foreground font-medium py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
          >
            Ver histórico
          </button>
        )}
      </div>
    </div>
  );
};
