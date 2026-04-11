import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ROUTES } from '@/utils/constants/app.constant';
import { SplashScreen } from '@/components/SplashScreen';

export const AuthGuard: React.FC = () => {
  const { isAuthenticated, isChecking } = useAuth();

  if (isChecking) return <SplashScreen />;
  if (!isAuthenticated) return <Navigate to={ROUTES.LOGIN} replace />;

  return <Outlet />;
};
