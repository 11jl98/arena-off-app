import { NavLink } from 'react-router-dom';
import { CalendarDays, Wallet, User, LogOut } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ROUTES } from '@/utils/constants/app.constant';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: ROUTES.RESERVAS, icon: CalendarDays, label: 'Reservas' },
  { to: ROUTES.CASHBACK, icon: Wallet, label: 'Cashback' },
  { to: ROUTES.PERFIL, icon: User, label: 'Perfil' },
] as const;

interface SidebarNavProps {
  onOpenNotifications: () => void;
}

export const SidebarNav: React.FC<SidebarNavProps> = ({ onOpenNotifications }) => {
  const { user, logout } = useAuth();
  const avatarSrc = user?.avatarUrl || user?.photoURL;

  return (
    <aside className="flex flex-col w-64 shrink-0 bg-card border-r border-border">
      <div className="flex items-center gap-3 px-5 h-16 shrink-0 border-b border-border">
        <img
          src="/logo.jpg"
          alt="Arena Off"
          className="w-9 h-9 rounded-lg object-cover shrink-0 shadow"
        />
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground leading-tight">Arena Off</p>
          <p className="text-[10px] text-muted-foreground leading-tight">Beach Sports</p>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-1 px-3 py-4" aria-label="Menu de navegação">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors duration-150',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/60'
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.75} className="shrink-0" />
                <span className="text-sm font-medium">{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-4 flex flex-col gap-1 shrink-0">
        <button
          onClick={onOpenNotifications}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors duration-150"
        >
          <NotificationBell onClick={onOpenNotifications} className="bg-transparent p-0 hover:bg-transparent" />
          <span className="text-sm font-medium">Notificações</span>
        </button>

        <div className="flex items-center gap-3 px-3 py-3 mt-1 border-t border-border">
          {avatarSrc ? (
            <img
              src={avatarSrc}
              alt={user?.name}
              referrerPolicy="no-referrer"
              className="w-9 h-9 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center shrink-0">
              <User size={16} className="text-muted-foreground" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground truncate">{user?.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <button
            onClick={logout}
            aria-label="Sair da conta"
            className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
          >
            <LogOut size={17} />
          </button>
        </div>
      </div>
    </aside>
  );
};
