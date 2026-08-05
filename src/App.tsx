import React, { useEffect } from 'react';
import { AppRoutes } from './routes';
import './styles/global.css';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { useDeviceDetection } from './hooks/useDeviceDetection';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from 'sonner';
import { getMercadoPagoInstance } from './lib/mercadopago';

const App: React.FC = () => {
  useTheme();
  const { checkAuth, clearSession, isChecking } = useAuth();
  const { isDesktop } = useDeviceDetection();

  useEffect(() => {
    checkAuth();
    // Preloads the Mercado Pago SDK so the card payment brick is ready when needed
    getMercadoPagoInstance().catch(() => {
      // non-fatal — card payment will be unavailable until the key is configured
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const handleSessionExpired = () => {
      clearSession();
    };
    window.addEventListener('session-expired', handleSessionExpired);
    return () => window.removeEventListener('session-expired', handleSessionExpired);
  }, [clearSession]);

  if (isChecking) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppRoutes />
      <Toaster
        position={isDesktop ? 'bottom-right' : 'bottom-center'}
        richColors closeButton theme="system"
        toastOptions={{
          classNames: {
            toast: 'rounded-xl',
            title: 'font-semibold',
            description: 'text-sm',

          },
        }}
      />
    </>
  );
};

export default App;
