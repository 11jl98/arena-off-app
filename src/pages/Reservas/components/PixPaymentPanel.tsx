import { useState } from 'react';
import { Copy, ExternalLink, Loader2, QrCode } from 'lucide-react';
import { usePaymentCountdown } from '@/pages/Reservas/hooks/usePaymentCountdown';
import { cn } from '@/lib/utils';
import type { InitiatePaymentResponse } from '@/types/payment';

interface PixPaymentPanelProps {
  paymentData: InitiatePaymentResponse;
  expiresAt?: string | null;
}

export const PixPaymentPanel: React.FC<PixPaymentPanelProps> = ({ paymentData, expiresAt }) => {
  const [copied, setCopied] = useState(false);
  const { formatted, expired } = usePaymentCountdown(expiresAt);

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
            <p className="text-xs text-muted-foreground font-medium">Chave PIX (Cópia e Cola)</p>
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
      </div>

      <div className="bg-muted/50 border border-border rounded-2xl px-4 py-3 flex items-center justify-between">
        <span className="text-sm text-muted-foreground">Tempo para pagar</span>
        <span
          className={cn(
            'font-mono text-lg font-bold tabular-nums',
            expired ? 'text-red-600 dark:text-red-400' : 'text-foreground'
          )}
        >
          {formatted}
        </span>
      </div>
    </div>
  );
};
