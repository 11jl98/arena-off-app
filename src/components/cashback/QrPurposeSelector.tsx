import { useState } from 'react';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CashbackPurpose } from '@/types/cashback';

interface QrPurposeSelectorProps {
  onConfirm: (purpose: CashbackPurpose) => void;
  onCancel: () => void;
  loading?: boolean;
}

const OPTIONS: { purpose: CashbackPurpose; title: string; description: string }[] = [
  {
    purpose: 'COURT',
    title: 'Na Quadra',
    description: 'Usar em agendamentos de quadra',
  },
  {
    purpose: 'BAR',
    title: 'No Bar',
    description: 'Usar no consumo do bar (com atendente)',
  },
];

export const QrPurposeSelector: React.FC<QrPurposeSelectorProps> = ({
  onConfirm,
  onCancel,
  loading,
}) => {
  const [selected, setSelected] = useState<CashbackPurpose | null>(null);

  return (
    <div className="flex flex-col items-center gap-5 px-4" style={{ paddingBottom: 'calc(env(safe-area-inset-bottom) + 1rem)' }}>
      <div className="flex flex-col items-center gap-2 text-center">
        <div className="w-14 h-14 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
        </div>
        <h3 className="text-lg font-bold text-foreground">Nota Fiscal Válida!</h3>
        <p className="text-sm text-muted-foreground">
          Onde quer usar esse cashback?
        </p>
      </div>

      <div className="w-full flex flex-col gap-2">
        {OPTIONS.map((opt) => (
          <button
            key={opt.purpose}
            onClick={() => setSelected(opt.purpose)}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-2xl border-2 text-left transition-all',
              selected === opt.purpose
                ? 'border-primary bg-primary/5'
                : 'border-border bg-card hover:border-primary/50'
            )}
          >
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">{opt.title}</p>
              <p className="text-xs text-muted-foreground">{opt.description}</p>
            </div>
            {selected === opt.purpose ? (
              <CheckCircle2 size={20} className="text-primary shrink-0" />
            ) : (
              <div className="w-5 shrink-0" />
            )}
          </button>
        ))}
      </div>

      <div className="w-full flex gap-3">
        <button
          onClick={onCancel}
          disabled={loading}
          className="flex-1 py-3 rounded-xl border border-border text-sm font-medium text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          onClick={() => selected && onConfirm(selected)}
          disabled={!selected || loading}
          className="flex-1 flex items-center justify-center gap-2 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Processando...
            </>
          ) : (
            'Confirmar'
          )}
        </button>
      </div>
    </div>
  );
};
