import { TrendingUp, Lock, ArrowUpCircle, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { CashbackWallet } from '@/types/cashback';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface WalletCardProps {
  wallet: CashbackWallet | undefined;
  loading?: boolean;
  barEnabled?: boolean;
  cashbackEnabled?: boolean;
  compact?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, loading, barEnabled, cashbackEnabled, compact }) => {
  const isCashbackActive = cashbackEnabled !== false;

  return (
    <div className="relative bg-linear-to-br from-primary to-orange-600 rounded-2xl p-4 text-white shadow-lg shadow-primary/30">
      {!isCashbackActive && (
        <div className="absolute inset-0 bg-black/40 rounded-2xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-1.5 text-center px-6">
            <AlertTriangle size={28} className="text-amber-300" />
            <p className="text-sm font-semibold text-white">Cashback temporariamente desativado</p>
            <p className="text-xs text-white/70">Seu saldo continua preservado</p>
          </div>
        </div>
      )}

      <div className={cn('transition-opacity', !isCashbackActive && 'opacity-30 pointer-events-none')}>
        <p className="text-white/70 text-sm mb-1">Saldo disponível</p>

        {loading ? (
          <div className={cn('bg-white/20 rounded-xl animate-pulse', compact ? 'h-10 w-40 mb-2' : 'h-8 w-32 mb-4')} />
        ) : (
          <p className={cn('font-bold tracking-tight', compact ? 'text-3xl mb-2' : 'text-3xl mb-4')}>
            {fmt(wallet?.balance ?? 0)}
          </p>
        )}

        {!compact && (
          <>
            <div className={cn('grid gap-2', barEnabled ? 'grid-cols-2' : 'grid-cols-1')}>
              <div className="bg-white/15 rounded-2xl p-3">
                <p className="text-white/70 text-xs mb-1">Quadra</p>
                <p className="font-semibold text-sm">
                  {loading ? '...' : fmt(wallet?.courtBalance ?? 0)}
                </p>
              </div>

              {barEnabled && (
                <div className="bg-white/15 rounded-2xl p-3">
                  <p className="text-white/70 text-xs mb-1">Bar</p>
                  <p className="font-semibold text-sm">
                    {loading ? '...' : fmt(wallet?.barBalance ?? 0)}
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
              <div className="bg-white/15 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Lock size={13} className="text-white/70" />
                  <span className="text-white/70 text-xs">Bloqueado</span>
                </div>
                <p className="font-semibold text-sm">
                  {loading ? '...' : fmt(wallet?.blockedBalance ?? 0)}
                </p>
              </div>
              <div className="bg-white/15 rounded-2xl p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={13} className="text-white/70" />
                  <span className="text-white/70 text-xs">Total ganho</span>
                </div>
                <p className="font-semibold text-sm">
                  {loading ? '...' : fmt(wallet?.totalEarned ?? 0)}
                </p>
              </div>
            </div>

            {(wallet?.blockedBalance ?? 0) > 0 && (
              <div className="mt-3 flex items-center gap-1.5 text-white/70 text-xs">
                <ArrowUpCircle size={12} />
                Saldo bloqueado será liberado após suas reservas
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
