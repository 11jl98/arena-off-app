import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { ROUTES } from './utils/constants/app.constant';
import { PublicLayout } from './components/layout/PublicLayout';
import { AuthGuard } from './components/guards/AuthGuard';
import { AppLayout } from './components/layout/AppLayout';
import { LandingPage } from './pages/Landing/landing.page';
import { LoginPage } from './pages/Login/login.page';

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

  if (isChecking) return null;

  const defaultRoute = isAuthenticated
    ? ROUTES.RESERVAS
    : isStandalone
      ? ROUTES.LOGIN
      : ROUTES.LANDING;

  return (
    <React.Suspense fallback={null}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route
            path={ROUTES.LANDING}
            element={isAuthenticated ? <Navigate to={ROUTES.RESERVAS} replace /> : <LandingPage />}
          />
          <Route
            path={ROUTES.LOGIN}
            element={isAuthenticated ? <Navigate to={ROUTES.RESERVAS} replace /> : <LoginPage />}
          />
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
