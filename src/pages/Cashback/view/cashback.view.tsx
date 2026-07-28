import { useState, useEffect } from 'react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useQuery } from '@tanstack/react-query';
import { ScanLine, Loader2, Receipt, ChevronDown, ChevronUp } from 'lucide-react';
import { WalletCard } from '@/components/cashback/WalletCard';
import { WalletInfoCards } from '@/components/cashback/WalletInfoCards';
import { TransactionItem } from '@/components/cashback/TransactionItem';
import { QrScannerModal } from '@/components/cashback/QrScannerModal';
import { DualCashbackOnboarding, hasSeenDualCashbackOnboarding } from '@/components/cashback/DualCashbackOnboarding';
import { CashbackService } from '@/services/cashback';
import { cn } from '@/lib/utils';
import type { CashbackConfig, CashbackWallet, CashbackPurpose } from '@/types/cashback';

const TAB_ALL = null;
const TAB_COURT: CashbackPurpose = 'COURT';
const TAB_BAR: CashbackPurpose = 'BAR';

type PurposeTab = typeof TAB_ALL | CashbackPurpose;

const TABS: { key: PurposeTab; label: string }[] = [
  { key: TAB_ALL, label: 'Todas' },
  { key: TAB_COURT, label: 'Quadra' },
  { key: TAB_BAR, label: 'Bar' },
];

interface CashbackViewProps {
  wallet: CashbackWallet | undefined;
  config: CashbackConfig | undefined;
  loadingWallet: boolean;
  loadingConfig: boolean;
  staffClientId?: string;
}

export const CashbackView: React.FC<CashbackViewProps> = ({
  wallet,
  config,
  loadingWallet,
  loadingConfig,
  staffClientId,
}) => {
  const [scannerOpen, setScannerOpen] = useState(false);
  const [purposeTab, setPurposeTab] = useState<PurposeTab>(TAB_ALL);
  const [showFullExtract, setShowFullExtract] = useState(false);
  const { isStandalone } = useDeviceDetection();

  const barEnabled = config?.barCashbackEnabled ?? false;
  const cashbackEnabled = config?.cashbackEnabled ?? true;
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    if (barEnabled && !loadingConfig && !hasSeenDualCashbackOnboarding()) {
      setShowOnboarding(true);
    }
  }, [barEnabled, loadingConfig]);

  const { data: txData, isLoading: loadingTx } = useQuery({
    queryKey: ['cashback-transactions', purposeTab, staffClientId],
    queryFn: () =>
      CashbackService.getTransactions({
        purpose: purposeTab ?? undefined,
        limit: showFullExtract ? 200 : 50,
      }),
    enabled: true,
    staleTime: 30 * 1000,
  });

  const transactions = txData ?? [];

  return (
    <>
      <div className="flex flex-col min-h-full">
        <div
          className="bg-linear-to-r from-primary to-orange-600 px-4 pb-14"
          style={{ paddingTop: isStandalone ? 'calc(2rem + env(safe-area-inset-top))' : '0.75rem' }}
        >
          <h1 className="text-xl font-bold text-white">Meu Cashback</h1>
          <p className="text-white/80 text-sm mt-0.5">
            Escaneie notas e acumule créditos
          </p>
        </div>

        <div className="px-4 -mt-14 mb-4">
          <WalletCard
            wallet={wallet}
            loading={loadingWallet}
            barEnabled={barEnabled}
            cashbackEnabled={cashbackEnabled}
            compact={!isStandalone}
          />
        </div>

        {isStandalone && (
          <div className="px-4 mb-4">
            <WalletInfoCards barEnabled={barEnabled} />
          </div>
        )}

        <div className="px-4 mb-6">
          <button
            onClick={() => {
              if (!cashbackEnabled) return;
              setScannerOpen(true);
            }}
            disabled={!cashbackEnabled}
            className={cn(
              'w-full flex items-center justify-center gap-3 font-semibold py-3 rounded-2xl shadow-lg shadow-primary/25 transition-all',
              cashbackEnabled
                ? 'bg-primary text-primary-foreground active:scale-[0.98]'
                : 'bg-muted text-muted-foreground cursor-not-allowed'
            )}
            title={!cashbackEnabled ? 'Cashback indisponível no momento' : undefined}
          >
            <ScanLine size={18} />
            {cashbackEnabled ? 'Escanear nota fiscal' : 'Cashback indisponível'}
          </button>
        </div>

        <div className="flex-1 px-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Extrato</h2>
          </div>

          <div className="flex gap-2 mb-4">
            {TABS.map((tab) => (
              <button
                key={tab.key ?? 'all'}
                onClick={() => setPurposeTab(tab.key)}
                className={cn(
                  'px-3 py-1.5 rounded-full text-xs font-medium transition-all',
                  purposeTab === tab.key
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {loadingTx && (
            <div className="flex justify-center py-10">
              <Loader2 size={26} className="animate-spin text-primary" />
            </div>
          )}

          {!loadingTx && transactions.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center">
              <Receipt size={40} className="text-muted-foreground/40" />
              <p className="text-muted-foreground text-sm">Nenhuma transação encontrada.</p>
              <p className="text-xs text-muted-foreground/70">
                {purposeTab
                  ? `Nenhuma transação com destino em ${purposeTab === 'COURT' ? 'Quadra' : 'Bar'}.`
                  : 'Escaneie uma nota fiscal para ganhar seu primeiro cashback!'}
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

          {!loadingTx && transactions.length >= 50 && !showFullExtract && (
            <button
              onClick={() => setShowFullExtract(true)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-primary mb-6"
            >
              <ChevronDown size={16} />
              Ver extrato completo
            </button>
          )}

          {showFullExtract && transactions.length > 0 && (
            <button
              onClick={() => setShowFullExtract(false)}
              className="w-full flex items-center justify-center gap-2 py-3 text-sm font-medium text-muted-foreground mb-6"
            >
              <ChevronUp size={16} />
              Mostrar menos
            </button>
          )}
        </div>
      </div>

      <DualCashbackOnboarding
        open={showOnboarding}
        onClose={() => setShowOnboarding(false)}
      />

      <QrScannerModal
        open={scannerOpen}
        onClose={() => setScannerOpen(false)}
        barEnabled={barEnabled}
        cashbackEnabled={cashbackEnabled}
      />
    </>
  );
};
