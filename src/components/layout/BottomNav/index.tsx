import { NavLink } from 'react-router-dom';
import { CalendarDays, Wallet, User } from 'lucide-react';
import { ROUTES } from '@/utils/constants/app.constant';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: ROUTES.RESERVAS, icon: CalendarDays, label: 'Reservas' },
  { to: ROUTES.CASHBACK, icon: Wallet, label: 'Cashback' },
  { to: ROUTES.PERFIL, icon: User, label: 'Perfil' },
] as const;

export const BottomNav: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border">
      <div className="flex items-stretch h-16">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors duration-150',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground'
              )
            }
          >
            {({ isActive }) => (
              <>
                <div className={cn('p-2 rounded-xl transition-colors duration-150', isActive && 'bg-primary/10')}>
                  <Icon
                    className={cn(
                      'transition-transform duration-150',
                      isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.75]'
                    )}
                    size={22}
                  />
                </div>
                <span
                  className={cn(
                    'text-[10px] font-medium leading-none',
                    isActive && 'font-semibold'
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
};
