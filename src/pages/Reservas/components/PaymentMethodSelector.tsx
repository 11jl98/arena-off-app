import { QrCode, CreditCard, Lock } from 'lucide-react';
import type { OnlinePaymentMethod } from '@/types/payment';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface PaymentMethodSelectorProps {
  amount: number;
  onSelect: (method: OnlinePaymentMethod) => void;
}

export const PaymentMethodSelector: React.FC<PaymentMethodSelectorProps> = ({ amount, onSelect }) => {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h3 className="font-semibold text-foreground">Como você quer pagar?</h3>
        <p className="text-sm text-muted-foreground">
          Total a pagar: <span className="font-bold text-primary">{fmt(amount)}</span>. O horário fica
          reservado enquanto você conclui o pagamento.
        </p>
      </div>

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
        <span className="text-xs font-semibold text-primary shrink-0">Imediato</span>
      </button>

      <button
        onClick={() => onSelect('CREDIT_CARD')}
        className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border text-left active:scale-[0.98] transition-transform hover:border-primary/60"
      >
        <span className="w-11 h-11 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <CreditCard size={22} />
        </span>
        <span className="flex-1 flex flex-col gap-0.5">
          <span className="font-semibold text-foreground">Cartão de crédito</span>
          <span className="text-xs text-muted-foreground">
            Pague agora com cartão, em até 12x.
          </span>
        </span>
        <span className="text-xs font-semibold text-primary shrink-0">Em até 12x</span>
      </button>

      <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
        <Lock size={12} className="mt-0.5 shrink-0" />
        Seus dados de pagamento são processados com segurança pelo Mercado Pago.
      </p>
    </div>
  );
};
