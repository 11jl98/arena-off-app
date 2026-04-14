import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { X, Camera, AlertCircle, Loader2 } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from '@/components/ui/drawer';
import { CashbackService } from '@/services/cashback';
import { useNotify } from '@/hooks/useNotify';
import type { CashbackWallet } from '@/types/cashback';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
}

const isNfceUrl = (text: string) =>
  /nfce|nfceweb|sefaz|fazenda\.gov/i.test(text);

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const scannedRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const { success: showSuccess, error: showError } = useNotify();

  const { mutate: submitReceipt } = useMutation({
    mutationFn: (receiptData: string) =>
      CashbackService.scanQrReceipt({ receiptData }),
    onSuccess: (data) => {
      queryClient.setQueriesData<CashbackWallet>(
        { queryKey: ['cashback-wallet'] },
        (old) =>
          old
            ? {
                ...old,
                balance: old.balance + data.cashbackEarned,
                totalEarned: old.totalEarned + data.cashbackEarned,
              }
            : old
      );
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-transactions'] });
      const earned = data.cashbackEarned.toLocaleString('pt-BR', {
        style: 'currency',
        currency: 'BRL',
      });
      showSuccess(`Cashback de ${earned} adicionado � sua carteira! ??`);
      handleClose();
    },
    onError: (err: Error) => {
      showError(err.message || 'Erro ao processar a nota. Tente novamente.');
      scannedRef.current = false;
      setIsProcessing(false);
    },
  });

  const stopScanner = async () => {
    if (scannerRef.current && scanningRef.current) {
      scanningRef.current = false;
      setIsScanning(false);
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch { /* empty */ }
    }
  };

  const startScanner = async () => {
    const elementId = 'qr-reader';
    if (!document.getElementById(elementId)) return;

    if (scannerRef.current) {
      try { scannerRef.current.clear(); } catch { /* empty */ }
      scannerRef.current = null;
    }

    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        if (scannedRef.current) return;

        if (!isNfceUrl(decodedText)) {
          showError('QR Code n�o reconhecido como nota fiscal. Aponte para o QR da NFCe.');
          return;
        }

        scannedRef.current = true;
        setIsProcessing(true);
        stopScanner();
        submitReceipt(decodedText);
      };

      const scanConfig = {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } as MediaTrackConstraints,
      };

      try {
        await scanner.start(
          { facingMode: { exact: 'environment' } } as { facingMode: ConstrainDOMString },
          scanConfig,
          onScanSuccess,
          undefined
        );
      } catch {
        await scanner.start(
          { facingMode: 'environment' },
          scanConfig,
          onScanSuccess,
          undefined
        );
      }

      scanningRef.current = true;
      setIsScanning(true);
      setPermissionError(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao acessar c�mera';
      setPermissionError(
        message.toLowerCase().includes('permission')
          ? 'C�mera negada. Permita o acesso � c�mera nas configura��es do navegador.'
          : 'N�o foi poss�vel iniciar a c�mera: ' + message
      );
    }
  };

  useEffect(() => {
    if (open) {
      scannedRef.current = false;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsProcessing(false);
      setPermissionError(null);
      const timer = setTimeout(() => startScanner(), 500);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open]);

  const handleClose = () => {
    stopScanner();
    onClose();
  };

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent className="max-h-[90dvh]">
        <DrawerHeader className="flex items-center justify-between pr-4">
          <DrawerTitle className="flex items-center gap-2">
            <Camera size={18} />
            Escanear nota fiscal
          </DrawerTitle>
          <DrawerClose asChild>
            <button
              onClick={handleClose}
              className="rounded-full p-1 hover:bg-muted transition-colors"
            >
              <X size={18} />
            </button>
          </DrawerClose>
        </DrawerHeader>

        <div className="px-4 flex flex-col items-center gap-5" style={{ paddingBottom: 'calc(2.5rem + env(safe-area-inset-bottom))' }}>
          <p className="text-sm text-muted-foreground text-center">
            Aponte a c�mera para o QR Code da sua nota fiscal para resgatar cashback.
          </p>

          {permissionError ? (
            <div className="flex flex-col items-center gap-3 text-center">
              <AlertCircle size={40} className="text-destructive" />
              <p className="text-sm text-destructive">{permissionError}</p>
              <button
                onClick={() => {
                  setPermissionError(null);
                  startScanner();
                }}
                className="px-6 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium"
              >
                Tentar novamente
              </button>
            </div>
          ) : (
            <div className="w-full relative">
              <div
                id="qr-reader"
                className="w-full rounded-2xl overflow-hidden"
                style={{ minHeight: 'min(280px, 45dvh)' }}
              />
              {!isScanning && !permissionError && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded-2xl">
                  <Loader2 size={28} className="animate-spin text-primary" />
                </div>
              )}
              {isProcessing && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 rounded-2xl gap-3">
                  <Loader2 size={32} className="animate-spin text-white" />
                  <p className="text-white text-sm">Processando nota...</p>
                </div>
              )}
            </div>
          )}

          <p className="text-xs text-muted-foreground text-center px-4">
            O QR Code geralmente est� no rodap� da nota fiscal ou cupom eletr�nico.
          </p>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
