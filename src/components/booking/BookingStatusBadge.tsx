import type { BookingStatus } from '@/types/booking';
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
  className?: string;
}

export const BookingStatusBadge: React.FC<BookingStatusBadgeProps> = ({ status, className }) => {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant={config.variant} className={cn(className)}>
      {config.label}
    </Badge>
  );
};
