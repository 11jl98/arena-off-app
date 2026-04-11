import React, { useEffect } from 'react';
import { AppRoutes } from './routes';
import './styles/global.css';
import { useTheme } from './hooks/useTheme';
import { useAuth } from './hooks/useAuth';
import { SplashScreen } from './components/SplashScreen';
import { Toaster } from 'sonner';
import { auth } from './config/firebase';
import { onAuthStateChanged } from 'firebase/auth';

const App: React.FC = () => {
  useTheme();
  const { checkAuth, handleRedirectResult, isChecking } = useAuth();

  useEffect(() => {
    let authInitialized = false;
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser && !authInitialized) {
        console.log('[App] Firebase auth state changed, user found:', firebaseUser.email);
        authInitialized = true;
        await handleRedirectResult();
      }
    });

    const initAuth = async () => {
      console.log('[App] Initializing authentication...');
      
      await new Promise(resolve => setTimeout(resolve, 100));
      
      const hasRedirectResult = await handleRedirectResult();
      console.log('[App] Redirect result processed:', hasRedirectResult);
      if (!hasRedirectResult) {
        console.log('[App] No redirect result, checking existing auth...');
        await checkAuth();
      }
      authInitialized = true;
    };
    initAuth();

    return () => unsubscribe();
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
