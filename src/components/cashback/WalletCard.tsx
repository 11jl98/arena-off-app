import { TrendingUp, Lock, ArrowUpCircle } from 'lucide-react';
import type { CashbackWallet } from '@/types/cashback';

const fmt = (reais: number) =>
  reais.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

interface WalletCardProps {
  wallet: CashbackWallet | undefined;
  loading?: boolean;
}

export const WalletCard: React.FC<WalletCardProps> = ({ wallet, loading }) => {
  return (
    <div className="bg-gradient-to-br from-primary to-orange-600 rounded-3xl p-6 text-white shadow-lg shadow-primary/30">
      <p className="text-white/70 text-sm mb-1">Saldo disponível</p>

      {loading ? (
        <div className="h-10 w-36 bg-white/20 rounded-xl animate-pulse mb-6" />
      ) : (
        <p className="text-4xl font-bold tracking-tight mb-6">
          {fmt(wallet?.balance ?? 0)}
        </p>
      )}

      <div className="grid grid-cols-2 gap-3">
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
    </div>
  );
};
