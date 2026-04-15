import { Bell } from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { cn } from '@/lib/utils';

interface NotificationBellProps {
  onClick: () => void;
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick, className }) => {
  const unreadCount = useNotificationStore((s) => s.unreadCount);

  return (
    <button
      onClick={onClick}
      aria-label={unreadCount > 0 ? `${unreadCount} notificações não lidas` : 'Notificações'}
      className={cn(
        'relative p-2 rounded-lg transition-colors duration-150',
        'text-white/80 hover:text-white hover:bg-white/10',
        'bg-[#ff5922]',
        className
      )}
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span
          aria-hidden="true"
          className="absolute top-1 right-1 min-w-4 h-4 px-1 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold leading-none"
        >
          {unreadCount > 99 ? '99+' : unreadCount}
        </span>
      )}
    </button>
  );
};
