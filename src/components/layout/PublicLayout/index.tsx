import { Outlet } from 'react-router-dom';
import { InstallPWABanner } from '@/components/InstallPWABanner';

export function PublicLayout() {
  return (
    <div className="h-full overflow-y-auto overflow-x-hidden">
      <InstallPWABanner />
      <Outlet />
    </div>
  );
}
