import { Outlet } from 'react-router-dom';
import { BottomNav } from '@/components/layout/BottomNav';

export const AppLayout: React.FC = () => {
  return (
    <div className="flex flex-col h-dvh w-full bg-background overflow-hidden">
      <main className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden pb-20">
        <Outlet />
      </main>
      <BottomNav />
    </div>
  );
};
