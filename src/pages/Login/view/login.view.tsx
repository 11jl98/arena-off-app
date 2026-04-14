import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ROUTES } from '@/utils/constants/app.constant';

export function LoginView() {
  const { isAuthenticated, isChecking, loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && !isChecking) {
      navigate(ROUTES.HOME, { replace: true });
    }
  }, [isAuthenticated, isChecking, navigate]);

  if (isChecking) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-linear-to-b from-[#FF8424] to-[#FF5722] px-6"
    >
      <div className="absolute inset-0 overflow-hidden opacity-10">
      </div>

      <div className="relative z-10 mb-10 text-center">
        <div className="relative mx-auto mb-5 flex h-24 w-24 items-center justify-center">
          <div className="absolute inset-0 animate-pulse rounded-full bg-white/30 blur-3xl" />
          <img
            src="/logo.jpg"
            alt="Arena Off Beach"
            className="relative h-24 w-24 rounded-2xl object-cover shadow-2xl ring-4 ring-white/20"
          />
        </div>
        <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-lg">
          Arena Off Beach
        </h1>
        <p className="mt-2 text-sm font-medium text-white/90 drop-shadow">
          Reserve quadras, ganhe cashback
        </p>
      </div>

      <div className="relative z-10 w-full max-w-sm space-y-4">
        <Button
          onClick={loginWithGoogle}
          variant="default"
          className="w-full gap-3 rounded-2xl bg-white py-4 text-sm font-bold text-gray-900 shadow-xl transition-all hover:scale-105 hover:bg-white hover:shadow-2xl active:scale-95"
        >
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Entrar com Google
        </Button>

        <p className="text-center text-xs font-medium text-white/80 drop-shadow">
          Ao continuar, você concorda com os Termos de Uso e Política de
          Privacidade.
        </p>
      </div>
    </div>
  );
}
