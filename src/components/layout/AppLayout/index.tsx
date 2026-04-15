import { useEffect, useLayoutEffect, useState } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { CalendarDays, Wallet, User, Menu, X } from 'lucide-react';
import { BottomNav } from '@/components/layout/BottomNav';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { NotificationsDrawer } from '@/components/notifications/NotificationsDrawer';
import { ROUTES } from '@/utils/constants/app.constant';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { to: ROUTES.RESERVAS, icon: CalendarDays, label: 'Reservas' },
  { to: ROUTES.CASHBACK, icon: Wallet, label: 'Cashback' },
  { to: ROUTES.PERFIL, icon: User, label: 'Perfil' },
] as const;

export const AppLayout: React.FC = () => {
  const { isStandalone, isMobile } = useDeviceDetection();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const location = useLocation();
  const { drawerOpen, openDrawer, closeDrawer } = useNotifications();

  useLayoutEffect(() => {
    document.body.style.backgroundColor = '';
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMobileNavOpen(false);
  }, [location.pathname]);

  if (isStandalone) {
    return (
      <div className="flex flex-col h-dvh w-full bg-background overflow-hidden">
        {/* Floating bell — appears above page content, respects safe area */}
        <div
          className="fixed right-4 z-50"
          style={{ top: 'calc(env(safe-area-inset-top) + 0.75rem)' }}
        >
          <NotificationBell onClick={openDrawer} />
        </div>

        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{ paddingBottom: 'calc(3rem + env(safe-area-inset-bottom))' }}
        >
          <Outlet />
        </main>
        <BottomNav />

        <NotificationsDrawer open={drawerOpen} onClose={closeDrawer} />
      </div>
    );
  }

  if (isMobile) {
    return (
      <div className="flex flex-col h-dvh w-full bg-background overflow-hidden"
      >
        <header
          className="fixed top-0 left-0 right-0 z-40 flex items-center gap-3 bg-linear-to-r from-primary to-orange-600"
          style={{
            paddingTop: 'env(safe-area-inset-top)',
            height: 'calc(3rem + env(safe-area-inset-top))',
          }}
        >
          <button
            onClick={() => setMobileNavOpen((o) => !o)}
            aria-label={mobileNavOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileNavOpen}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors duration-150"
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="flex items-center gap-2 flex-1">
            <img src="/logo.jpg" alt="Arena Off" className="w-7 h-7 rounded-lg object-cover shrink-0 shadow" />
            <span className="text-sm font-bold text-white">Arena Off</span>
          </div>
          <NotificationBell onClick={openDrawer} />
        </header>

        {/* Backdrop */}
        {mobileNavOpen && (
          <div
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
        )}

        {/* Overlay drawer */}
        <nav
          className={cn(
            'fixed inset-y-0 left-0 z-50 flex flex-col w-50',
            'transition-transform duration-200 ease-in-out',
            mobileNavOpen ? 'translate-x-0' : '-translate-x-full'
          )}
          style={{ backgroundColor: 'hsl(22, 60%, 10%)' }}
          aria-label="Menu de navegação"
        >
          <div
            className="flex items-center gap-2.5 px-3 border-b border-white/10 shrink-0"
            style={{
              paddingTop: 'env(safe-area-inset-top)',
              height: 'calc(3.5rem + env(safe-area-inset-top))',
            }}
          >
            <img src="/logo.jpg" alt="Arena Off" className="w-7 h-7 rounded-lg object-cover shrink-0 shadow" />
            <span className="text-white font-bold text-sm">Arena Off</span>
          </div>
          <div className="flex-1 flex flex-col gap-1 px-2 py-3">
            {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-2.5 py-2.5 rounded-lg transition-colors duration-150',
                    isActive
                      ? 'bg-primary/20 text-primary'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
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
          </div>
        </nav>

        <main
          className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
          style={{ paddingTop: 'calc(3rem + env(safe-area-inset-top))' }}
        >
          <Outlet />
        </main>

        <NotificationsDrawer open={drawerOpen} onClose={closeDrawer} />
      </div>
    );
  }

  return (
    <div className="flex flex-row h-dvh w-full bg-background overflow-hidden">
      {/* Desktop — minimal layout, bell in top-right corner */}
      <div className="fixed top-4 right-4 z-50">
        <NotificationBell onClick={openDrawer} className="text-foreground/60 hover:text-foreground hover:bg-muted" />
      </div>
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <Outlet />
      </main>
      <NotificationsDrawer open={drawerOpen} onClose={closeDrawer} />
    </div>
  );
};
