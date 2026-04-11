import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, Loader2, Receipt } from 'lucide-react';
import { WalletCard } from '@/components/cashback/WalletCard';
import { TransactionItem } from '@/components/cashback/TransactionItem';
import { QrScannerModal } from '@/components/cashback/QrScannerModal';
import { CashbackService } from '@/services/cashback';
import { useUserStore } from '@/store/userStore';

export const CashbackView: React.FC = () => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const currentUser = useUserStore((s) => s.user);
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'EMPLOYEE';
  const staffClientId = isStaff ? currentUser?.id : undefined;

  const { data: wallet, isLoading: loadingWallet } = useQuery({
    queryKey: ['cashback-wallet', staffClientId],
    queryFn: () => CashbackService.getWallet(staffClientId),
    enabled: !!currentUser,
    staleTime: 30 * 1000,
  });

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['cashback-transactions', staffClientId],
    queryFn: () => CashbackService.getTransactions(50, staffClientId),
    enabled: !!currentUser,
    staleTime: 30 * 1000,
  });

  const transactions = txData ?? [];

  return (
    <>
      <div className="flex flex-col min-h-full">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-orange-600 px-4 pt-12 pb-20">
          <h1 className="text-2xl font-bold text-white">Cashback</h1>
          <p className="text-white/80 text-sm mt-0.5">
            Escaneie notas e acumule créditos
          </p>
        </div>

        {/* Wallet card overlapping header */}
        <div className="px-4 -mt-14 mb-4">
          <WalletCard wallet={wallet} loading={loadingWallet} />
        </div>

        {/* Scan button */}
        <div className="px-4 mb-6">
          <button
            onClick={() => setScannerOpen(true)}
            className="w-full flex items-center justify-center gap-3 bg-primary text-primary-foreground font-semibold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          >
            <ScanLine size={22} />
            Escanear nota fiscal
          </button>
        </div>

        {/* Transactions */}
        <div className="flex-1 px-4">
          <h2 className="font-bold text-foreground mb-3">Histórico de cashback</h2>

          {loadingTx && (
            <div className="flex justify-center py-10">
              <Loader2 size={26} className="animate-spin text-primary" />
            </div>
          )}

          {!loadingTx && transactions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Receipt size={40} className="text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhuma transação ainda.</p>
              <p className="text-xs text-muted-foreground/70">
                Escaneie uma nota fiscal para ganhar seu primeiro cashback!
              </p>
            </div>
          )}

          {transactions.length > 0 && (
            <div className="bg-card border border-border rounded-2xl divide-y divide-border overflow-hidden mb-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="px-4">
                  <TransactionItem transaction={tx} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <QrScannerModal open={scannerOpen} onClose={() => setScannerOpen(false)} />
    </>
  );
};
