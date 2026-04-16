import React, { useEffect } from 'react';
import { AppRoutes } from './routes';
import './styles/global.css';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  useTheme();
  const { checkAuth, clearSession, isChecking } = useAuth();

  useEffect(() => {
    checkAuth();
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
        position="bottom-center"
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
