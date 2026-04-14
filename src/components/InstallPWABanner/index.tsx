import { useEffect, useRef, useState } from 'react';
import { X, Download } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';

export function InstallPWABanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('pwa-banner-dismissed') === 'true';
  });
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  const { isStandalone } = useDeviceDetection();

  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    const onInstalled = () => {
      setCanInstall(false);
      deferredPromptRef.current = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  const handleInstall = async () => {
    const prompt = deferredPromptRef.current;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setCanInstall(false);
      deferredPromptRef.current = null;
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!canInstall || isStandalone || dismissed) {
    return null;
  }

  return (
    <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
      <div className="w-full max-w-xl rounded-2xl bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
              <Download className="h-5 w-5 text-orange-600" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900">
                Instale o app para melhor experiência
              </p>
              <p className="text-xs text-slate-600">
                Acesso rápido, offline e notificações.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              onClick={handleInstall}
              className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 active:scale-95"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/40 text-slate-600 transition hover:bg-white/70"
              aria-label="Fechar"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
