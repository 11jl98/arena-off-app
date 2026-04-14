import React, { useEffect } from 'react';
import { AppRoutes } from './routes';
import './styles/global.css';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from 'sonner';

const App: React.FC = () => {
  useTheme();
  const { checkAuth, isChecking } = useAuth();

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isChecking) {
    return <SplashScreen />;
  }

  return (
    <>
      <AppRoutes />
      <Toaster
        position="top-center"
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
