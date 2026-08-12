import { useCallback, useEffect, useMemo, useState } from 'react';
import { CardPayment, initMercadoPago } from '@mercadopago/sdk-react';
import { Loader2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { PaymentsService } from '@/services/payments';
import { MERCADO_PAGO_PUBLIC_KEY } from '@/utils/constants/app.constant';
import type { InitiatePaymentResponse } from '@/types/payment';

let mpInitialized = false;

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface CardPaymentFormProps {
  bookingId: string;
  amount: number;
  payerEmail?: string;
  payerCpf?: string | null;
  onApproved: (data: InitiatePaymentResponse) => void;
  onInProcess: (data: InitiatePaymentResponse) => void;
}

export const CardPaymentForm: React.FC<CardPaymentFormProps> = ({
  bookingId,
  amount,
  payerEmail,
  payerCpf,
  onApproved,
  onInProcess,
}) => {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [loadingKey, setLoadingKey] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { publicKey: pk } = await PaymentsService.getPublicKey();
        if (!cancelled) setPublicKey(pk || MERCADO_PAGO_PUBLIC_KEY || null);
      } catch {
        if (!cancelled) setPublicKey(MERCADO_PAGO_PUBLIC_KEY || null);
      } finally {
        if (!cancelled) setLoadingKey(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!publicKey) return;
    if (!mpInitialized) {
      initMercadoPago(publicKey, { locale: 'pt-BR' });
      mpInitialized = true;
    }
  }, [publicKey]);

  const handleSubmit = useCallback(
    async (cardData: { token: string; installments: number; payment_method_id?: string }) => {
      setError(null);
      try {
        const data = await PaymentsService.initiatePayment({
          bookingId,
          method: 'CREDIT_CARD',
          cardToken: cardData.token,
          paymentMethodId: cardData.payment_method_id,
          installments: cardData.installments || 1,
        });
        if (data.status === 'approved') {
          onApproved(data);
        } else {
          onInProcess(data);
        }
      } catch (err) {
        const status = (err as unknown as { status?: number }).status;
        setError(
          status === 400
            ? 'Pagamento recusado. Verifique os dados do cartão e tente novamente.'
            : (err as Error).message || 'Não foi possível processar o pagamento. Tente novamente.'
        );
        throw err;
      }
    },
    [bookingId, onApproved, onInProcess]
  );

  const onReady = useCallback(() => setError(null), []);
  const onError = useCallback(() => {
    setError('Não foi possível carregar o formulário de cartão. Tente novamente.');
  }, []);

  const initialization = useMemo(
    () => ({
      amount,
      payer: payerEmail
        ? {
            email: payerEmail,
            ...(payerCpf ? { identification: { type: 'CPF' as const, number: payerCpf } } : {}),
          }
        : undefined,
    }),
    [amount, payerEmail, payerCpf]
  );

  const customization = useMemo(
    () => ({
      paymentMethods: { minInstallments: 1, maxInstallments: 12 },
      visual: { hideFormTitle: true },
    }),
    []
  );

  if (loadingKey) {
    return (
      <div className="h-72 flex flex-col items-center justify-center gap-3 rounded-2xl bg-card border border-border">
        <Loader2 size={24} className="animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Carregando formulário de pagamento...</p>
      </div>
    );
  }

  if (!publicKey) {
    return (
      <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
        <AlertTriangle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
        <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">
          O pagamento com cartão está indisponível no momento. Tente novamente em instantes ou
          escolha outra forma de pagamento.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      {error && (
        <div className="flex items-start gap-2.5 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-2xl px-4 py-3">
          <AlertTriangle size={15} className="text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
          <p className="text-xs text-red-700 dark:text-red-300 leading-relaxed">{error}</p>
        </div>
      )}

      <div className="bg-card border border-border rounded-2xl p-4">
        <p className="text-sm font-semibold text-foreground mb-1">Cartão de crédito</p>
        <p className="text-xs text-muted-foreground mb-3">
          Você será cobrado em {fmt(amount)} (parcelas disponíveis conforme a bandeira).
        </p>
        <CardPayment
          initialization={initialization}
          customization={customization}
          locale="pt-BR"
          onReady={onReady}
          onError={onError}
          onSubmit={handleSubmit}
        />
      </div>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck size={12} className="mt-0.5 shrink-0" />
        Pagamento processado com segurança pelo Mercado Pago. Seus dados não são armazenados por nós.
      </p>
    </div>
  );
};
