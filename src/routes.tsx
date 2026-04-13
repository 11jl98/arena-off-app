import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { ROUTES } from './utils/constants/app.constant';
import { SplashScreen } from './components/SplashScreen';
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthGuard } from './components/guards/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';

const LandingPage = React.lazy(() =>
  import('./pages/Landing/landing.page').then((module) => ({
    default: module.LandingPage,
  }))
);

const LoginPage = React.lazy(() =>
  import('./pages/Login/login.page').then((module) => ({
    default: module.LoginPage,
  }))
);

const ReservasPage = React.lazy(() =>
  import('./pages/Reservas/reservas.page').then((module) => ({
    default: module.ReservasPage,
  }))
);

const CashbackPage = React.lazy(() =>
  import('./pages/Cashback/cashback.page').then((module) => ({
    default: module.CashbackPage,
  }))
);

const PerfilPage = React.lazy(() =>
  import('./pages/Perfil/perfil.page').then((module) => ({
    default: module.PerfilPage,
  }))
);

const PaymentReturnPage = React.lazy(() =>
  import('./pages/PaymentReturn/payment-return.page').then((module) => ({
    default: module.PaymentReturnPage,
  }))
);

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, isChecking } = useAuth();
  const { isStandalone } = useDeviceDetection();

  if (isChecking) return <SplashScreen />;

  const defaultRoute = isAuthenticated
    ? ROUTES.RESERVAS
    : isStandalone
      ? ROUTES.LOGIN
      : ROUTES.LANDING;

  return (
    <React.Suspense fallback={<SplashScreen />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path={ROUTES.LANDING} element={<LandingPage />} />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
        </Route>

        <Route element={<AuthGuard />}>
          <Route element={<AppLayout />}>
            <Route path={ROUTES.RESERVAS} element={<ReservasPage />} />
            <Route path={ROUTES.CASHBACK} element={<CashbackPage />} />
            <Route path={ROUTES.PERFIL} element={<PerfilPage />} />
            <Route path={ROUTES.PAYMENT_RETURN} element={<PaymentReturnPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to={defaultRoute} replace />} />
      </Routes>
    </React.Suspense>
  );
};
