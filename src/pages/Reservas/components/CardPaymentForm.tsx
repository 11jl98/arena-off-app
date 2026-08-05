import { useEffect, useRef, useState } from 'react';
import { Loader2, CheckCircle2, XCircle, ShieldCheck, Lock } from 'lucide-react';
import {
  getMercadoPagoInstance,
  getMpSessionId,
  type MercadoPagoCardPaymentBrickController,
  type MercadoPagoCardPaymentBrickSettings,
} from '@/lib/mercadopago';
import { PaymentsService } from '@/services/payments';
import { useUserStore } from '@/store/userStore';
import { useNotify } from '@/hooks/useNotify';
import { getCardRejectionMessage } from '@/utils/helpers/payment.helper';
import type { Booking } from '@/types/booking';
import type { InitiateCardPaymentResponse } from '@/types';

const BRICK_CONTAINER_ID = 'cardPaymentBrick_container';

type Outcome = 'idle' | 'approved' | 'rejected' | 'pending';

interface CardPaymentFormProps {
  booking: Booking;
  onApproved: (result: InitiateCardPaymentResponse) => void;
  onPending?: (result: InitiateCardPaymentResponse) => void;
}

/**
 * Renders the Mercado Pago Card Payment Brick. Card number/CVV are collected
 * inside Mercado Pago's secure iframe — only the single-use cardToken and the
 * fraud sessionId leave the browser (to the backend via initiateCardPayment).
 */
export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  booking,
  onApproved,
  onPending,
}) => {
  const currentUser = useUserStore((s) => s.user);
  const { error: showError } = useNotify();

  const controllerRef = useRef<MercadoPagoCardPaymentBrickController | null>(null);
  const [outcome, setOutcome] = useState<Outcome>('idle');
  const [brickReady, setBrickReady] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const amount = booking.finalAmount;

  useEffect(() => {
    let active = true;

    async function renderBrick() {
      try {
        const mp = await getMercadoPagoInstance();

        if (!active) return;

        const payer: MercadoPagoCardPaymentBrickSettings['initialization']['payer'] = {
          email: currentUser?.email || undefined,
        };
        if (currentUser?.cpf) {
          payer.identification = { type: 'CPF', number: currentUser.cpf };
        }

        const settings: MercadoPagoCardPaymentBrickSettings = {
          initialization: {
            amount,
            payer,
          },
          customization: {
            paymentMethods: {
              types: {
                excluded: ['debit_card', 'prepaid_card'],
              },
            },
          },
          locale: 'pt-BR',
          callbacks: {
            onReady: () => {
              if (active) setBrickReady(true);
            },
            onError: (error) => {
              if (!active) return;
              console.error('[MERCADO PAGO] Brick error:', error);
              setSubmitError(error.message || 'Erro no processamento do cartão.');
            },
            onSubmit: async (formData) => {
              setSubmitError(null);
              setSubmitting(true);
              try {
                const sessionId = await getMpSessionId();
                const result = await PaymentsService.initiateCardPayment({
                  bookingId: booking.id,
                  cardToken: formData.token,
                  paymentMethodId: formData.payment_method_id,
                  paymentMethodType: 'credit_card',
                  installments: formData.installments,
                  sessionId,
                  payer: {
                    email: formData.payer?.email,
                    identification: formData.payer?.identification,
                  },
                });

                setOutcome(result.status);

                if (result.status === 'approved') {
                  onApproved(result);
                } else if (result.status === 'pending') {
                  onPending?.(result);
                } else {
                  setSubmitError(getCardRejectionMessage(result));
                }
              } catch (err) {
                console.error('[MERCADO PAGO] Erro ao iniciar pagamento:', err);
                const message =
                  (err as Error)?.message ||
                  'Não foi possível processar o pagamento. Tente novamente.';
                setSubmitError(message);
                setOutcome('idle');
                showError(message);
              } finally {
                if (active) setSubmitting(false);
              }
            },
          },
        };

        const controller = await mp.bricks().create('cardPayment', BRICK_CONTAINER_ID, settings);
        if (!active) {
          controller.unmount();
          return;
        }
        controllerRef.current = controller;
      } catch (err) {
        if (!active) return;
        console.error('[MERCADO PAGO] Falha ao renderizar brick:', err);
        setLoadError(
          (err as Error)?.message ||
            'Pagamento com cartão indisponível no momento. Tente novamente mais tarde.'
        );
      }
    }

    renderBrick();

    return () => {
      active = false;
      controllerRef.current?.unmount();
      controllerRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking.id]);

  useEffect(() => {
    if (outcome === 'approved') {
      controllerRef.current?.unmount();
      controllerRef.current = null;
    }
  }, [outcome]);

  if (loadError) {
    return (
      <div className="w-full bg-card border border-border rounded-2xl p-4 flex items-start gap-3">
        <XCircle size={16} className="text-destructive shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground leading-relaxed">{loadError}</p>
      </div>
    );
  }

  if (outcome === 'approved') {
    return (
      <div className="w-full bg-card border border-green-200 dark:border-green-800 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
        <CheckCircle2 size={28} className="text-green-600 dark:text-green-400" />
        <p className="text-sm font-semibold text-foreground">Pagamento aprovado!</p>
        <p className="text-xs text-muted-foreground">
          Estamos confirmando sua reserva. Um instante...
        </p>
      </div>
    );
  }

  if (outcome === 'pending') {
    return (
      <div className="w-full bg-card border border-amber-200 dark:border-amber-800 rounded-2xl p-4 flex flex-col items-center gap-2 text-center">
        <Loader2 size={26} className="text-amber-600 dark:text-amber-400 animate-spin" />
        <p className="text-sm font-semibold text-foreground">Pagamento em análise</p>
        <p className="text-xs text-muted-foreground">
          Seu pagamento está sendo processado. A confirmação chega em instantes.
        </p>
      </div>
    );
  }

  return (
    <div className="w-full bg-card border border-border rounded-2xl overflow-hidden">
      <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border">
        <ShieldCheck size={16} className="text-primary" />
        <span className="font-semibold text-foreground text-sm">Cartão de crédito</span>
        <span className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground">
          <Lock size={11} />
          Ambiente seguro
        </span>
      </div>

      {submitError && (
        <div className="mx-5 mt-4 flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl px-3.5 py-3">
          <XCircle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{submitError}</p>
        </div>
      )}

      {!brickReady && (
        <div className="flex flex-col items-center gap-2 py-10">
          <Loader2 size={22} className="animate-spin text-primary" />
          <p className="text-xs text-muted-foreground">Carregando formulário de pagamento...</p>
        </div>
      )}

      <div className="px-5 py-5">
        <div id={BRICK_CONTAINER_ID} />
      </div>

      <div className="px-5 pb-5 flex items-start gap-2.5 bg-muted/60 border-t border-border pt-4">
        <Lock size={13} className="text-muted-foreground shrink-0 mt-0.5" />
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Seus dados de cartão são processados diretamente pelo Mercado Pago em ambiente seguro e
          nunca passam pelo servidor da arena.
        </p>
      </div>
      {submitting && (
        <div className="px-5 pb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <Loader2 size={13} className="animate-spin" />
          Processando pagamento...
        </div>
      )}
    </div>
  );
};
