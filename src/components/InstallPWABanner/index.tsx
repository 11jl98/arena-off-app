import { useEffect, useRef, useState } from 'react';
import { X, Download, Share2, PlusSquare, MoreVertical } from 'lucide-react';
import { useDeviceDetection } from '@/hooks/useDeviceDetection';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';

type BannerMode = 'native' | 'ios-manual' | null;

let deferredPromptGlobal: BeforeInstallPromptEvent | null = null;

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', ((e: BeforeInstallPromptEvent) => {
    e.preventDefault();
    deferredPromptGlobal = e;
  }) as EventListener);
}

export function InstallPWABanner() {
  const [dismissed, setDismissed] = useState(() => {
    return localStorage.getItem('pwa-banner-dismissed') === 'true';
  });
  const deferredPromptRef = useRef<BeforeInstallPromptEvent | null>(null);
  const [mode, setMode] = useState<BannerMode>(null);
  const [showSteps, setShowSteps] = useState(false);

  const { isStandalone, isIOS } = useDeviceDetection();

  useEffect(() => {
    if (deferredPromptGlobal) {
      deferredPromptRef.current = deferredPromptGlobal;
      setMode('native');
    }

    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      deferredPromptRef.current = e;
      deferredPromptGlobal = e;
      setMode('native');
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    const onInstalled = () => {
      setMode(null);
      deferredPromptRef.current = null;
      deferredPromptGlobal = null;
    };
    window.addEventListener('appinstalled', onInstalled);

    if (isIOS && !isStandalone && !dismissed && !deferredPromptGlobal) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setMode('ios-manual');
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, [isIOS, isStandalone, dismissed]);

  const handleInstall = async () => {
    if (mode === 'native') {
      const prompt = deferredPromptRef.current;
      if (!prompt) return;

      await prompt.prompt();
      const { outcome } = await prompt.userChoice;
      if (outcome === 'accepted') {
        setMode(null);
        deferredPromptRef.current = null;
      }
      return;
    }

    setShowSteps(true);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowSteps(false);
    localStorage.setItem('pwa-banner-dismissed', 'true');
  };

  if (!mode || isStandalone || dismissed) {
    console.log('InstallPWABanner: not showing banner', { mode, isStandalone, dismissed });
    return null;
  }

  const isIOSManual = mode === 'ios-manual';

  return (
    <>
      <div className="fixed inset-x-0 top-6 z-50 flex justify-center px-4">
        <div className="w-full max-w-xl rounded-2xl bg-white/90 px-4 py-3 shadow-2xl backdrop-blur-md ring-1 ring-white/30">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-500/15">
                <Download className="h-5 w-5 text-orange-600" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900">
                  {isIOSManual
                    ? 'Adicione à Tela de Início'
                    : 'Instale o app para melhor experiência'}
                </p>
                <p className="text-xs text-slate-600">
                  {isIOSManual
                    ? 'Acesso rápido como um app nativo no seu iPhone.'
                    : 'Acesso rápido, offline e notificações.'}
                </p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={handleInstall}
                className="rounded-xl bg-orange-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-orange-600 active:scale-95"
              >
                {isIOSManual ? 'Como fazer' : 'Instalar'}
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

      <Sheet open={showSteps} onOpenChange={setShowSteps}>
        <SheetContent side="bottom" className="rounded-t-3xl pb-8">
          <SheetHeader className="text-left">
            <SheetTitle className="text-base">
              {isIOSManual ? 'Adicionar à Tela de Início' : 'Instalar o app'}
            </SheetTitle>
            <SheetDescription className="text-sm">
              {isIOSManual
                ? 'Siga os passos para instalar o Arena Off Beach como um app no seu iPhone.'
                : 'Siga os passos para instalar o Arena Off Beach no seu dispositivo Android.'}
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 flex flex-col gap-4">
            {isIOSManual ? (
              <>
                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Share2 className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">1. Toque em Compartilhar</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      No Safari, toque no ícone de compartilhar na barra inferior.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PlusSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      2. Escolha "Adicionar à Tela de Início"
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Role as opções e toque em "Adicionar à Tela de Início".
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">3. Confirme</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toque em "Adicionar". O ícone do app aparecerá na sua tela inicial.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <MoreVertical className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">1. Abra o menu do Chrome</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toque nos três pontinhos no canto superior direito do navegador.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Download className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">
                      2. Toque em "Adicionar à tela inicial"
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Pode aparecer como "Instalar app" em algumas versões do Android.
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 rounded-2xl bg-muted/50 p-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <PlusSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-foreground">3. Confirme a instalação</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Toque em "Adicionar" ou "Instalar". O ícone do app aparecerá na sua tela inicial.
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleDismiss}
            className="mt-6 w-full rounded-xl border border-border py-3 text-sm font-medium text-foreground transition active:scale-[0.98]"
          >
            Não mostrar novamente
          </button>
        </SheetContent>
      </Sheet>
    </>
  );
}
