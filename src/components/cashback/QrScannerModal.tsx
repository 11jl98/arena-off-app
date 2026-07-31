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
import { QrPurposeSelector } from './QrPurposeSelector';
import { QrSuccessScreen } from './QrSuccessScreen';
import type { CashbackWallet, CashbackPurpose } from '@/types/cashback';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  barEnabled: boolean;
  cashbackEnabled: boolean;
  staffClientId?: string;
}

type Step = 'SCAN' | 'PURPOSE_SELECT' | 'SUCCESS';

const isNfceUrl = (text: string) =>
  /nfce|nfceweb|sefaz|fazenda\.gov/i.test(text);

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose, barEnabled, staffClientId }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const scannedRef = useRef(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('SCAN');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<{ cashbackEarned: number; totalAmount: number; purpose: CashbackPurpose } | null>(null);
  const queryClient = useQueryClient();
  const {  error: showError } = useNotify();


  const { mutate: submitReceipt, isPending } = useMutation({
    mutationFn: (payload: { receiptData: string; purpose: CashbackPurpose }) =>
      CashbackService.scanQrReceipt(payload),
    onSuccess: (data) => {
      const result = {
        cashbackEarned: data.cashbackEarned,
        totalAmount: data.totalAmount,
        purpose: data.purpose,
      };

      setScanResult(result);
      setIsProcessing(false);
      setStep('SUCCESS');

      queryClient.setQueriesData<CashbackWallet>(
        { queryKey: ['cashback-wallet'] },
        (old) =>
          old
            ? {
                ...old,
                balance: old.balance + data.cashbackEarned,
                courtBalance:
                  data.purpose === 'COURT'
                    ? old.courtBalance + data.cashbackEarned
                    : old.courtBalance,
                barBalance:
                  data.purpose === 'BAR'
                    ? old.barBalance + data.cashbackEarned
                    : old.barBalance,
                totalEarned: old.totalEarned + data.cashbackEarned,
              }
            : old
      );
      queryClient.invalidateQueries({ queryKey: ['cashback-wallet'] });
      queryClient.invalidateQueries({ queryKey: ['cashback-transactions'] });
    },
    onError: (err: Error) => {
      showError(err.message || 'Erro ao processar a nota. Tente novamente.');
      scannedRef.current = false;
      setIsProcessing(false);
      setStep('SCAN');
      startScanner();
    },
  });

  const stopScanner = async () => {
    if (scannerRef.current && scanningRef.current) {
      scanningRef.current = false;
      setIsScanning(false);
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch { /* empty */ }
    }
  };

  const startScanner = async () => {
    const elementId = 'qr-reader';
    if (!document.getElementById(elementId)) return;

    if (scannerRef.current) {
      try { await scannerRef.current.clear(); } catch { /* empty */ }
      scannerRef.current = null;
    }

    try {
      const scanner = new Html5Qrcode(elementId);
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        if (scannedRef.current) return;

        if (!isNfceUrl(decodedText)) {
          showError('QR Code não reconhecido como nota fiscal. Aponte para o QR da NFC-e.');
          return;
        }

        scannedRef.current = true;
        setScannedData(decodedText);

        if (!barEnabled) {
          setIsProcessing(true);
          stopScanner();
          submitReceipt({ receiptData: decodedText, purpose: 'COURT' });
        } else {
          stopScanner();
          setStep('PURPOSE_SELECT');
        }
      };

      const scanConfig = {
        fps: 15,
        qrbox: { width: 300, height: 300 },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 980 },
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
      const message = err instanceof Error ? err.message : 'Erro ao acessar câmera';
      setPermissionError(
        message.toLowerCase().includes('permission')
          ? 'Câmera negada. Permita o acesso à câmera nas configurações do navegador.'
          : 'Não foi possível iniciar a câmera: ' + message
      );
    }
  };

  useEffect(() => {
    if (open) {
      scannedRef.current = false;
      setIsProcessing(false);
      setPermissionError(null);
      setStep('SCAN');
      setScannedData(null);
      setScanResult(null);
      const timer = setTimeout(() => startScanner(), 500);
      return () => clearTimeout(timer);
    } else {
      stopScanner();
    }
  }, [open]);

  const handleClose = () => {
    stopScanner();
    setStep('SCAN');
    setScannedData(null);
    setScanResult(null);
    onClose();
  };

  const handlePurposeConfirm = (purpose: CashbackPurpose) => {
    if (!scannedData) return;
    setIsProcessing(true);
    submitReceipt({ receiptData: scannedData, purpose });
  };

  const walletKey = staffClientId ? ['cashback-wallet', staffClientId] : ['cashback-wallet'];
  const walletData = queryClient.getQueryData<CashbackWallet>(walletKey);

  return (
    <Drawer open={open} onOpenChange={(v) => !v && handleClose()}>
      <DrawerContent className="max-h-[90dvh] flex flex-col">
        <DrawerHeader className="flex items-center justify-between pr-4 shrink-0">
          <DrawerTitle className="flex items-center gap-2">
            <Camera size={18} />
            {step === 'SCAN' && 'Escanear nota fiscal'}
            {step === 'PURPOSE_SELECT' && 'Escolher destino'}
            {step === 'SUCCESS' && 'Concluído'}
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

        <div key={step} className="px-4 flex flex-col items-center gap-5 overflow-y-auto flex-1 min-h-0" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {step === 'SCAN' && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                Aponte a câmera para o QR Code da sua nota fiscal para resgatar cashback.
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
                    style={{ minHeight: 'min(200px, 30dvh)' }}
                  />
                  {!isScanning && !permissionError && !isProcessing && (
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
                O QR Code geralmente está no rodapé da nota fiscal ou cupom eletrônico.
              </p>
            </>
          )}

          {step === 'PURPOSE_SELECT' && (
            <QrPurposeSelector
              onConfirm={handlePurposeConfirm}
              onCancel={() => {
                scannedRef.current = false;
                setStep('SCAN');
                startScanner();
              }}
              loading={isPending}
            />
          )}

          {step === 'SUCCESS' && (
            <QrSuccessScreen
              cashbackEarned={scanResult?.cashbackEarned ?? 0}
              purpose={scanResult?.purpose ?? 'COURT'}
              courtBalance={(walletData?.courtBalance ?? 0) + (scanResult?.purpose === 'COURT' ? scanResult?.cashbackEarned ?? 0 : 0)}
              barBalance={(walletData?.barBalance ?? 0) + (scanResult?.purpose === 'BAR' ? scanResult?.cashbackEarned ?? 0 : 0)}
              onClose={handleClose}
            />
          )}
        </div>
      </DrawerContent>
    </Drawer>
  );
};
