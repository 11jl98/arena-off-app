import { CheckCircle2, X } from 'lucide-react';
import type { CashbackPurpose } from '@/types/cashback';

interface QrSuccessScreenProps {
  cashbackEarned: number;
  purpose: CashbackPurpose;
  courtBalance: number;
  barBalance: number;
  onClose: () => void;
}

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

const PURPOSE_DATA: Record<CashbackPurpose, { label: string }> = {
  COURT: { label: 'Quadra' },
  BAR: { label: 'Bar' },
};

export const QrSuccessScreen: React.FC<QrSuccessScreenProps> = ({
  cashbackEarned,
  purpose,
  courtBalance,
  barBalance,
  onClose,
}) => {
  const data = PURPOSE_DATA[purpose];

  return (
    <div className="flex flex-col items-center gap-6 px-4 py-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 size={40} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Cashback Adicionado!</h3>
        <p className="text-sm text-muted-foreground">
          {fmt(cashbackEarned)} adicionado ao seu saldo de {data.label}
        </p>
      </div>

      <div className="w-full bg-card border border-border rounded-2xl p-4 flex flex-col gap-2">
        <p className="text-xs text-muted-foreground font-medium">Saldo atual</p>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Quadra</span>
          <span className="text-sm font-semibold">{fmt(courtBalance)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Bar</span>
          <span className="text-sm font-semibold">
            {fmt(barBalance)}
            {purpose === 'BAR' && (
              <span className="text-green-600 dark:text-green-400 text-xs ml-1">
                +{fmt(cashbackEarned)}
              </span>
            )}
          </span>
        </div>
      </div>

      <button
        onClick={onClose}
        className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm active:scale-[0.98] transition-transform"
      >
        <X size={16} />
        Fechar
      </button>
    </div>
  );
};
