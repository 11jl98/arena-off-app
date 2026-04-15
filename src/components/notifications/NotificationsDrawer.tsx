import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Bell, BellOff, CheckCheck, Loader2, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { NotificationsService } from '@/services/notifications';
import { useNotificationStore } from '@/store/notificationStore';
import type { AppNotification } from '@/types/notification';
import { cn } from '@/lib/utils';

const TYPE_STYLES: Record<
  string,
  { dot: string; label: string }
> = {
  BOOKING_CONFIRMED: {
    dot: 'bg-green-500',
    label: 'Confirmada',
  },
  BOOKING_CANCELLED: {
    dot: 'bg-red-500',
    label: 'Cancelada',
  },
  NEW_BOOKING: {
    dot: 'bg-primary',
    label: 'Nova reserva',
  },
};

function NotificationRow({ notification }: { notification: AppNotification }) {
  const config = notification.type ? TYPE_STYLES[notification.type] : null;
  const date = parseISO(notification.createdAt);

  return (
    <div
      className={cn(
        'flex items-start gap-3 px-4 py-3 border-b border-border last:border-0 transition-colors',
        !notification.read && 'bg-primary/5'
      )}
    >
      {config && (
        <span
          className={cn('mt-1.5 shrink-0 w-2 h-2 rounded-full', config.dot)}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0">
        <p
          className={cn(
            'text-sm leading-snug',
            notification.read ? 'text-foreground/80' : 'text-foreground font-semibold'
          )}
        >
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
          {notification.body}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-1">
          {format(date, "dd/MM · HH:mm", { locale: ptBR })}
        </p>
      </div>
    </div>
  );
}

interface NotificationsDrawerProps {
  open: boolean;
  onClose: () => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({ open, onClose }) => {
  const queryClient = useQueryClient();
  const { markAllRead } = useNotificationStore();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => NotificationsService.getNotifications({ limit: 50 }),
    enabled: open,
    staleTime: 0,
  });

  // When drawer opens: mark all as read (optimistic + server)
  useEffect(() => {
    if (!open) return;
    markAllRead();
    NotificationsService.markAllRead().then(() => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }).catch(() => {/* non-critical */});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && onClose()}>
      <DrawerContent className="max-h-[85dvh]">
        <DrawerHeader className="flex items-center justify-between pr-4 border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-primary" />
            <DrawerTitle className="text-base">Notificações</DrawerTitle>
          </div>
          <DrawerClose asChild>
            <button
              aria-label="Fechar notificações"
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="overflow-y-auto flex-1">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={24} className="animate-spin text-primary" />
            </div>
          )}

          {!isLoading && notifications.length === 0 && (
            <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
              <BellOff size={36} className="text-muted-foreground/40" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação.</p>
            </div>
          )}

          {!isLoading && notifications.length > 0 && (
            <>
              <div className="flex items-center justify-end px-4 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <CheckCheck size={12} />
                  Todas marcadas como lidas
                </span>
              </div>
              {notifications.map((n) => (
                <NotificationRow key={n.id} notification={n} />
              ))}
            </>
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
