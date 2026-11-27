import { QrCode, Lock, Gift, Sparkles } from 'lucide-react';
import { FEATURE_FLAGS, ONLINE_PAYMENTS_AVAILABLE } from '@/config/featureFlags';
import type { OnlinePaymentMethod } from '@/types/payment';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface PaymentMethodSelectorProps {
  amount: number;
  onSelect: (method: OnlinePaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({
  amount,
  onSelect,
}) => {
  if (!ONLINE_PAYMENTS_AVAILABLE) return null;

  const showPix = FEATURE_FLAGS.ONLINE_PAYMENT_PIX_ENABLED;
  const showCard = FEATURE_FLAGS.ONLINE_PAYMENT_CARD_ENABLED;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">Como você quer pagar?</h3>
        <p className="text-sm text-muted-foreground">
          Total a pagar: <span className="font-bold text-primary">{fmt(amount)}</span>. O horário fica
          reservado enquanto você conclui o pagamento.
        </p>
      </div>

      <div className="flex items-start gap-2.5 rounded-2xl border border-green-500/30 bg-green-50 dark:bg-green-900/20 px-3.5 py-3">
        <Sparkles size={16} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
        <p className="text-xs leading-snug text-green-700 dark:text-green-300">
          <strong className="font-semibold">Pagando online você ganha cashback!</strong>{' '}
          Uma parte do valor pago volta para a sua carteira e pode ser usada nas próximas
          reservas de quadra.
        </p>
      </div>

      {showPix && (
        <button
          onClick={() => onSelect('PIX')}
          className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left active:scale-[0.98] transition-transform hover:border-primary/60"
        >
          <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <QrCode size={22} />
          </span>
          <span className="flex-1 flex flex-col gap-0.5">
            <span className="font-semibold text-foreground">PIX</span>
            <span className="text-xs text-muted-foreground">
              Pague na hora com QR Code pelo app do seu banco.
            </span>
          </span>
          <span className="flex items-center gap-1 text-xs font-semibold text-green-600 dark:text-green-400 shrink-0">
            <Gift size={12} />
            Cashback
          </span>
        </button>
      )}

      {showCard && (
        <>
          <button
            onClick={() => onSelect('CREDIT_CARD')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left active:scale-[0.98] transition-transform hover:border-primary/60"
          >
            <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <QrCode size={22} />
            </span>
            <span className="flex-1 flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Cartão de crédito</span>
              <span className="text-xs text-muted-foreground">
                Pague agora com cartão, à vista.
              </span>
            </span>
            <span className="text-xs font-semibold text-primary shrink-0">À vista</span>
          </button>
          <button
            onClick={() => onSelect('DEBIT_CARD')}
            className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left active:scale-[0.98] transition-transform hover:border-primary/60"
          >
            <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <QrCode size={22} />
            </span>
            <span className="flex-1 flex flex-col gap-0.5">
              <span className="font-semibold text-foreground">Cartão de débito</span>
              <span className="text-xs text-muted-foreground">
                Pague agora na hora com o saldo da sua conta.
              </span>
            </span>
            <span className="text-xs font-semibold text-primary shrink-0">À vista</span>
          </button>
        </>
      )}

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Lock size={12} className="mt-0.5 shrink-0" />
        Pagamento processado com segurança pelo Banco Inter. Inclui taxa de 0,90% e
        gera cashback para futuras reservas.
      </p>
    </div>
  );
};
