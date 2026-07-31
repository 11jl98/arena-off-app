import { useQueries } from '@tanstack/react-query';
import { CashbackService } from '@/services/cashback';
import { useUserStore } from '@/store/userStore';
import { CashbackView } from '../view/cashback.view';

export const CashbackController: React.FC = () => {
  const currentUser = useUserStore((s) => s.user);
  const isStaff = currentUser?.role === 'ADMIN' || currentUser?.role === 'EMPLOYEE';
  const staffClientId = isStaff ? currentUser?.id : undefined;

  const results = useQueries({
    queries: [
      {
        queryKey: ['cashback-config'],
        queryFn: () => CashbackService.getConfig(),
        staleTime: 5 * 60 * 1000,
        enabled: !!currentUser,
      },
      {
        queryKey: staffClientId ? ['cashback-wallet', staffClientId] : ['cashback-wallet'],
        queryFn: () => CashbackService.getWallet(staffClientId),
        staleTime: 30 * 1000,
        enabled: !!currentUser,
      },
    ],
  });

  const config = results[0].data;
  const wallet = results[1].data;
  const loadingConfig = results[0].isLoading;
  const loadingWallet = results[1].isLoading;

  return (
    <CashbackView
      wallet={wallet}
      config={config}
      loadingWallet={loadingWallet}
      loadingConfig={loadingConfig}
      staffClientId={staffClientId}
    />
  );
};
