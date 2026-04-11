import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  ShoppingBag,
  Gift,
  Receipt,
  CalendarDays,
  RefreshCcw,
  Clock,
} from 'lucide-react';
import type { CashbackTransaction, CashbackTransactionType } from '@/types/cashback';
import { cn } from '@/lib/utils';

const TYPE_CONFIG: Record<
  CashbackTransactionType,
  { label: string; icon: React.FC<{ size?: number; className?: string }>; earned: boolean }
> = {
  EARNED_CONSUMPTION: { label: 'Consumo no bar', icon: ShoppingBag, earned: true },
  EARNED_BONUS: { label: 'Bônus QR Code', icon: Gift, earned: true },
  USED_TAB: { label: 'Usado na comanda', icon: Receipt, earned: false },
  USED_BOOKING: { label: 'Usado em reserva', icon: CalendarDays, earned: false },
  REFUND: { label: 'Estorno', icon: RefreshCcw, earned: true },
  EXPIRATION: { label: 'Expirado', icon: Clock, earned: false },
};

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface TransactionItemProps {
  transaction: CashbackTransaction;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({ transaction }) => {
  const config = TYPE_CONFIG[transaction.type];
  const Icon = config.icon;

  return (
    <div className="flex items-center gap-3 py-3">
      <div
        className={cn(
          'w-10 h-10 rounded-full flex items-center justify-center shrink-0',
          config.earned
            ? 'bg-green-100 dark:bg-green-900/30'
            : 'bg-red-100 dark:bg-red-900/30'
        )}
      >
        <Icon
          size={18}
          className={
            config.earned
              ? 'text-green-600 dark:text-green-400'
              : 'text-red-500 dark:text-red-400'
          }
        />
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{config.label}</p>
        {transaction.description && (
          <p className="text-xs text-muted-foreground truncate">{transaction.description}</p>
        )}
        <p className="text-xs text-muted-foreground">
          {format(new Date(transaction.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </p>
      </div>

      <span
        className={cn(
          'text-sm font-bold shrink-0',
          config.earned
            ? 'text-green-600 dark:text-green-400'
            : 'text-red-500 dark:text-red-400'
        )}
      >
        {config.earned ? '+' : '-'}
        {fmt(Math.abs(transaction.amount))}
      </span>
    </div>
  );
};
