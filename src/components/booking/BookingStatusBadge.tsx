import type { BookingStatus, PaymentStatus } from '@/types/booking';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const STATUS_CONFIG: Record<BookingStatus, { label: string; variant: 'warning' | 'success' | 'destructive' | 'secondary' | 'outline' }> = {
  PENDING: { label: 'Pendente', variant: 'warning' },
  CONFIRMED: { label: 'Confirmado', variant: 'success' },
  CANCELLED: { label: 'Cancelado', variant: 'destructive' },
  COMPLETED: { label: 'Concluído', variant: 'secondary' },
  NO_SHOW: { label: 'Não compareceu', variant: 'outline' },
};

interface BookingStatusBadgeProps {
  status: BookingStatus;
  paymentStatus?: PaymentStatus;
  className?: string;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({
  status,
  paymentStatus,
  className,
}) => {
  const isAwaitingPayment =
    status === 'PENDING' && paymentStatus === 'PENDING';

  const config = isAwaitingPayment
    ? { label: 'Aguardando pagamento', variant: 'warning' as const }
    : STATUS_CONFIG[status];

  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
};
