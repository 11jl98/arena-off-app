import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, XCircle, Clock, Loader2 } from 'lucide-react';
import { ROUTES } from '@/utils/constants/app.constant';
import { useQueryClient } from '@tanstack/react-query';
import { cn } from '@/lib/utils';

type PaymentStatus = 'approved' | 'rejected' | 'pending' | 'null';

const STATUS_CONFIG: Record<
  PaymentStatus,
  {
    icon: React.FC<{ size?: number; className?: string }>;
    title: string;
    message: string;
    iconClass: string;
    bgClass: string;
  }
> = {
  approved: {
    icon: CheckCircle2,
    title: 'Pagamento aprovado!',
    message: 'Sua reserva está confirmada. Boa partida! 🏐',
    iconClass: 'text-green-600 dark:text-green-400',
    bgClass: 'bg-green-100 dark:bg-green-900/30',
  },
  rejected: {
    icon: XCircle,
    title: 'Pagamento recusado',
    message: 'Não foi possível processar seu pagamento. Tente novamente ou escolha pagamento presencial.',
    iconClass: 'text-destructive',
    bgClass: 'bg-red-100 dark:bg-red-900/30',
  },
  pending: {
    icon: Clock,
    title: 'Pagamento em análise',
    message: 'Seu pagamento está sendo processado. Você receberá uma confirmação em breve.',
    iconClass: 'text-yellow-600 dark:text-yellow-400',
    bgClass: 'bg-yellow-100 dark:bg-yellow-900/30',
  },
  null: {
    icon: Loader2,
    title: 'Verificando pagamento...',
    message: 'Aguarde um momento.',
    iconClass: 'text-primary animate-spin',
    bgClass: 'bg-muted',
  },
};

export const PaymentReturnPage: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const status = (params.get('status') as PaymentStatus | null) ?? 'null';
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['null'];
  const Icon = config.icon;

  useEffect(() => {
    if (status === 'approved' || status === 'pending') {
      queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
    }

    const timer = setTimeout(
      () => navigate(ROUTES.RESERVAS, { replace: true }),
      status === 'approved' ? 4000 : 6000
    );
    return () => clearTimeout(timer);
  }, [status, navigate, queryClient]);

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center px-6 gap-8 animate-fade-in">
      <div className={cn('w-24 h-24 rounded-full flex items-center justify-center', config.bgClass)}>
        <Icon size={52} className={config.iconClass} />
      </div>

      <div className="text-center flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-foreground">{config.title}</h1>
        <p className="text-muted-foreground text-sm max-w-xs">{config.message}</p>
      </div>

      <p className="text-xs text-muted-foreground/60 text-center">
        Redirecionando para suas reservas...
      </p>

      <button
        onClick={() => navigate(ROUTES.RESERVAS, { replace: true })}
        className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-semibold text-sm active:scale-[0.98] transition-transform"
      >
        Ir para reservas
      </button>
    </div>
  );
};
