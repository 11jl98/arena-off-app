import { useState } from 'react';
import { Copy, ExternalLink, Loader2, QrCode, Gift, Receipt } from 'lucide-react';
import { usePaymentCountdown } from '@/pages/Reservas/hooks/usePaymentCountdown';
import { cn } from '@/lib/utils';
import type { InitiatePaymentResponse } from '@/types/payment';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface PixPaymentPanelProps {
  paymentData: InitiatePaymentResponse;
  expiresAt?: string | null;
}

export const PixPaymentPanel: React.FC<PixPaymentPanelProps> = ({ paymentData, expiresAt }) => {
  const [copied, setCopied] = useState(false);
  const { formatted, expired } = usePaymentCountdown(expiresAt);

  const base = paymentData.amount ?? 0;
  const fee = paymentData.fee ?? 0;
  const total = paymentData.totalAmount ?? base + fee;
  const cashback = paymentData.estimatedCashback ?? 0;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentData.pixQrCode ?? '');
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback: noop
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="flex items-center gap-2 px-5 pt-5 pb-3 border-b border-border">
          <QrCode size={16} className="text-primary" />
          <span className="font-semibold text-foreground text-sm">Pague com PIX</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 animate-pulse font-medium">
            <Loader2 size={12} className="animate-spin" />
            Aguardando pagamento...
          </span>
        </div>

        <div className="flex flex-col items-center gap-4 px-5 py-5">
          {paymentData.pixQrCodeBase64 && (
            <img
              src={`data:image/png;base64,${paymentData.pixQrCodeBase64}`}
              alt="QR Code PIX"
              width={200}
              height={200}
              className="rounded-xl border border-border"
            />
          )}

          <div className="w-full flex flex-col gap-1.5">
            <p className="text-xs text-muted-foreground font-medium">PIX (Cópia e Cola)</p>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-muted rounded-xl px-3 py-2 text-xs font-mono text-foreground truncate">
                {paymentData.pixQrCode}
              </div>
              <button
                onClick={handleCopy}
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

          {paymentData.pixTicketUrl && (
            <a
              href={paymentData.pixTicketUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 border border-border rounded-xl py-2.5 text-sm font-medium text-foreground active:scale-[0.98] transition-transform"
            >
              <ExternalLink size={14} />
              Abrir no app do banco
            </a>
          )}
        </div>

        <div className="px-5 pb-5 flex flex-col gap-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <Receipt size={13} />
              Reserva
            </span>
            <span className="font-medium text-foreground">{fmt(base)}</span>
          </div>
          {fee > 0 && (
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Taxa PIX (0,90%)</span>
              <span className="font-medium text-foreground">{fmt(fee)}</span>
            </div>
          )}
          <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
            <span className="font-semibold text-foreground">Total</span>
            <span className="font-bold text-primary">{fmt(total)}</span>
          </div>
        </div>
      </div>

      {cashback > 0 && (
        <div className="flex items-start gap-2.5 rounded-2xl border border-green-500/30 bg-green-50 dark:bg-green-900/20 px-4 py-3">
          <Gift size={16} className="text-green-600 dark:text-green-400 mt-0.5 shrink-0" />
          <p className="text-xs leading-snug text-green-700 dark:text-green-300">
            <strong className="font-semibold">
              Ao pagar você ganha {fmt(cashback)} de cashback
            </strong>{' '}
            para usar nas próximas reservas
            {paymentData.cashbackPurpose === 'BAR' ? ' e no bar' : ' de quadra'}.
          </p>
        </div>
      )}

      <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Tempo para pagar</span>
        {expired ? (
          <span className="flex items-center gap-1.5 text-xs text-yellow-600 dark:text-yellow-400 font-medium">
            <Loader2 size={12} className="animate-spin" />
            Confirmando pagamento...
          </span>
        ) : (
          <span className="font-mono text-lg font-bold tabular-nums text-foreground">
            {formatted}
          </span>
        )}
      </div>
    </div>
  );
};
