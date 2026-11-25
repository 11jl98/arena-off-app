import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { AlertCircle, Loader2, TextSearch } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { CashbackService } from '@/services/cashback';
import { useNotify } from '@/hooks/useNotify';
import { QrPurposeSelector } from './QrPurposeSelector';
import { QrSuccessScreen } from './QrSuccessScreen';
import { qrHasAmount } from '@/utils/helpers/qr.helper';
import { readPhotoAmount, readReceiptAmount } from '@/utils/helpers/receipt-ocr';
import type { CashbackWallet, CashbackPurpose } from '@/types/cashback';

interface QrScannerModalProps {
  open: boolean;
  onClose: () => void;
  barEnabled: boolean;
  cashbackEnabled: boolean;
  staffClientId?: string;
}

type Step = 'SCAN' | 'VALUE' | 'PURPOSE_SELECT' | 'SUCCESS';
type OcrState = 'idle' | 'reading' | 'confirmed' | 'error' | 'unavailable';

const isNfceUrl = (text: string) =>
  /nfce|nfceweb|sefaz|fazenda\.gov/i.test(text);

const formatBrl = (value: number) =>
  value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export const QrScannerModal: React.FC<QrScannerModalProps> = ({ open, onClose, barEnabled, staffClientId }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scanningRef = useRef(false);
  const scannedRef = useRef(false);
  const ocrRequest = useRef<AbortController | null>(null);
  const photoInput = useRef<HTMLInputElement>(null);
  const photoRef = useRef<HTMLImageElement>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [numbersOnly, setNumbersOnly] = useState(true);
  const guideRef = useRef<HTMLDivElement>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [step, setStep] = useState<Step>('SCAN');
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [scannedAmount, setScannedAmount] = useState<number | null>(null);
  const [ocrState, setOcrState] = useState<OcrState>('idle');
  const [ocrValue, setOcrValue] = useState<number | null>(null);
  const [scanResult, setScanResult] = useState<{ cashbackEarned: number; totalAmount: number; purpose: CashbackPurpose } | null>(null);
  const [scanNonce, setScanNonce] = useState(0);
  const queryClient = useQueryClient();
  const {  error: showError } = useNotify();


  const { mutate: submitReceipt, isPending } = useMutation({
    mutationFn: (payload: { receiptData: string; purpose: CashbackPurpose; amount?: number }) =>
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
      clearValueCapture();
      setScannedAmount(null);
      setOcrState('idle');
      setOcrValue(null);
      setStep('SCAN');
      setScanNonce((nonce) => nonce + 1);
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
      const scanner = new Html5Qrcode(elementId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      const onScanSuccess = (decodedText: string) => {
        if (scannedRef.current) return;

        if (!isNfceUrl(decodedText)) {
          showError('QR Code não reconhecido como nota fiscal. Aponte para o QR da NFC-e.');
          return;
        }

        scannedRef.current = true;
        setScannedData(decodedText);

        if (qrHasAmount(decodedText)) {
          // Emissão offline: o valor já vem no QR Code.
          if (!barEnabled) {
            setIsProcessing(true);
            stopScanner();
            submitReceipt({ receiptData: decodedText, purpose: 'COURT' });
          } else {
            stopScanner();
            setStep('PURPOSE_SELECT');
          }
        } else {
          // QR Code 3.0 online: o valor não vem na URL (NT 2025.001).
          // A câmera continua ligada para a leitura por OCR do cupom.
          setStep('VALUE');
        }
      };

      const scanConfig = {
        fps: 15,
        disableFlip: true,
        qrbox: (width: number, height: number) => {
          // The camera surface is twice the visible width to retain more detail when decoding.
          const side = Math.floor(Math.min(width / 2, height) * 0.7);
          return { width: side, height: side };
        },
        videoConstraints: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 980 },
          advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet & { focusMode: string }],
        } as MediaTrackConstraints,
      };

      await scanner.start(
        { facingMode: 'environment' },
        scanConfig,
        onScanSuccess,
        undefined
      );

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

  const startScannerRef = useRef(startScanner);
  useEffect(() => {
    startScannerRef.current = startScanner;
  });

  // Para a câmera se a página for desmontada com o modal aberto.
  useEffect(() => {
    return () => {
      ocrRequest.current?.abort();
      const scanner = scannerRef.current;
      if (!scanner || !scanningRef.current) return;
      scanningRef.current = false;
      void scanner
        .stop()
        .catch(() => {})
        .then(() => scanner.clear())
        .catch(() => {});
    };
  }, []);

  useEffect(() => {
    if (!open || step !== 'SCAN' || scanningRef.current) return;

    let frame: number;
    const startWhenVisible = () => {
      if (scanningRef.current) return;
      if (document.getElementById('qr-reader')?.clientWidth) {
        void startScannerRef.current();
      } else {
        frame = requestAnimationFrame(startWhenVisible);
      }
    };
    frame = requestAnimationFrame(startWhenVisible);
    return () => cancelAnimationFrame(frame);
  }, [open, step, scanNonce]);

  useEffect(() => {
    const scanner = scannerRef.current;
    if (!open || !isScanning || !scanner) return;
    if (step === 'VALUE' && scanner.getState() === Html5QrcodeScannerState.SCANNING) {
      scanner.pause(false);
      const video = document.querySelector<HTMLVideoElement>('#qr-reader video');
      const stream = video?.srcObject;
      const track = typeof MediaStream !== 'undefined' && stream instanceof MediaStream ? stream.getVideoTracks()[0] : undefined;
      if (video && track?.applyConstraints) {
        const portrait = video.videoHeight > video.videoWidth;
        void track.applyConstraints({
          ...track.getConstraints(),
          width: { ideal: portrait ? 1080 : 1920 },
          height: { ideal: portrait ? 1920 : 1080 },
        }).catch(() => {});
      }
    } else if (step === 'SCAN' && scanner.getState() === Html5QrcodeScannerState.PAUSED) {
      scanner.resume();
    }
  }, [isScanning, open, step]);

  useEffect(() => () => {
    if (photoUrl) URL.revokeObjectURL(photoUrl);
  }, [photoUrl]);

  const clearValueCapture = () => {
    ocrRequest.current?.abort();
    setPhotoUrl(null);
    setNumbersOnly(true);
  };

  const handleClose = () => {
    clearValueCapture();
    stopScanner();
    scannedRef.current = false;
    setIsProcessing(false);
    setPermissionError(null);
    setStep('SCAN');
    setScannedData(null);
    setScannedAmount(null);
    setOcrState('idle');
    setOcrValue(null);
    setScanResult(null);
    onClose();
  };

  const resetOcr = () => {
    clearValueCapture();
    scannedRef.current = false;
    setOcrState('idle');
    setOcrValue(null);
    setScannedAmount(null);
  };

  const readValue = async (read: (signal: AbortSignal) => Promise<number | null>) => {
    ocrRequest.current?.abort();
    const request = new AbortController();
    ocrRequest.current = request;
    setOcrState('reading');
    try {
      const value = await read(request.signal);
      if (request.signal.aborted) return;

      if (value === null) {
        setOcrState('error');
        return;
      }
      setOcrValue(value);
      setOcrState('confirmed');
    } catch {
      if (!request.signal.aborted) setOcrState('unavailable');
    }
  };

  const handleReadValue = () => {
    const video = document.querySelector<HTMLVideoElement>('#qr-reader video');
    const guide = guideRef.current;
    if (video && guide) void readValue(signal => readReceiptAmount(video, guide, signal, numbersOnly));
  };

  const handlePhotoClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    const photo = photoRef.current;
    if (!photo?.naturalWidth) return;
    const rect = photo.getBoundingClientRect();
    const point = event.detail === 0 ? { x: 0.5, y: 0.5 } : {
      x: (event.clientX - rect.left) / rect.width,
      y: (event.clientY - rect.top) / rect.height,
    };
    if (point.x < 0 || point.x > 1 || point.y < 0 || point.y > 1) return;
    void readValue(signal => readPhotoAmount(photo, point, signal));
  };

  const handleConfirmValue = () => {
    if (ocrValue === null || !scannedData) return;
    setScannedAmount(ocrValue);

    if (!barEnabled) {
      setIsProcessing(true);
      stopScanner();
      submitReceipt({
        receiptData: scannedData,
        purpose: 'COURT',
        amount: ocrValue,
      });
    } else {
      stopScanner();
      setStep('PURPOSE_SELECT');
    }
  };

  const handlePurposeConfirm = (purpose: CashbackPurpose) => {
    if (!scannedData) return;
    setIsProcessing(true);
    submitReceipt({
      receiptData: scannedData,
      purpose,
      amount: scannedAmount ?? undefined,
    });
  };

  const walletKey = staffClientId ? ['cashback-wallet', staffClientId] : ['cashback-wallet'];
  const walletData = queryClient.getQueryData<CashbackWallet>(walletKey);

  return (
    <ResponsiveModal
      open={open}
      onClose={handleClose}
      title={
        step === 'SCAN'
          ? 'Escanear nota fiscal'
          : step === 'VALUE'
            ? 'Ler valor do cupom'
            : step === 'PURPOSE_SELECT'
              ? 'Escolher destino'
              : 'Concluído'
      }
      dialogClassName="max-w-md"
    >
      <div className="px-4 flex flex-col items-center gap-5" style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          {(step === 'SCAN' || step === 'VALUE') && (
            <>
              <p className="text-sm text-muted-foreground text-center">
                {step === 'SCAN'
                  ? 'Aponte a câmera para o QR Code da sua nota fiscal para resgatar cashback.'
                  : photoUrl
                    ? 'Toque nos dígitos do valor total ou a pagar na foto.'
                    : numbersOnly
                      ? 'Centralize só os dígitos do total, do valor a pagar ou do valor pago, incluindo os centavos. Deixe os dígitos grandes e nítidos.'
                      : 'Enquadre a linha inteira de Valor total, A pagar ou Valor pago, incluindo os centavos.'}
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
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl bg-black">
                  <div className={step === 'VALUE' ? 'absolute inset-0' : 'absolute left-1/2 top-1/2 w-[200%] -translate-x-1/2 -translate-y-1/2'}>
                    <div id="qr-reader" className={step === 'VALUE' ? 'size-full [&>video]:size-full! [&>video]:object-cover [&>div]:hidden!' : 'w-full'} />
                  </div>

                  {step === 'VALUE' && !photoUrl && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div
                        ref={guideRef}
                        className={`h-10 rounded-lg border-2 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] ${numbersOnly ? 'w-32' : 'w-[94%]'}`}
                      />
                      <span className="absolute top-[calc(50%+1.75rem)] text-[11px] font-medium text-white bg-black/70 px-2.5 py-1 rounded-full">
                        {numbersOnly ? 'Centralize os dígitos' : 'Inclua o nome e o valor da linha'}
                      </span>
                    </div>
                  )}

                  {photoUrl && step === 'VALUE' && (
                    <button type="button" onClick={handlePhotoClick}
                      disabled={ocrState === 'reading' || isProcessing}
                      aria-label="Selecionar o valor na foto"
                      className="absolute inset-0 flex items-center justify-center bg-black">
                      <img ref={photoRef} src={photoUrl} alt="Cupom fotografado"
                        onError={() => { setPhotoUrl(null); showError('Não foi possível abrir a foto. Fotografe o valor novamente.'); }}
                        className="max-h-full max-w-full h-auto w-auto" />
                    </button>
                  )}
                  {ocrState === 'reading' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 rounded-2xl">
                      <Loader2 size={32} className="animate-spin text-white" />
                      <p className="text-white text-sm">Lendo o valor do cupom...</p>
                      {!photoUrl && <p className="text-white/70 text-xs">Mantenha o celular parado</p>}
                    </div>
                  )}

                  {!photoUrl && !isScanning && !permissionError && !isProcessing && ocrState !== 'reading' && (
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

              {step === 'SCAN' && (
                <p className="text-xs text-muted-foreground text-center px-4">
                  Centralize o QR Code no quadrado, com a margem branca visível. Ele pode ocupar só uma parte do quadrado.
                </p>
              )}
            </>
          )}

          {step === 'VALUE' && (
            <div className="w-full flex flex-col gap-3">
              {ocrState === 'confirmed' && ocrValue !== null && (
                <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-center">
                  <p className="text-xs text-muted-foreground">Valor lido no cupom</p>
                  <p className="text-lg font-semibold text-foreground">{formatBrl(ocrValue)}</p>
                </div>
              )}

              {ocrState === 'unavailable' && (
                <p className="text-sm text-destructive text-center">
                  A leitura da imagem foi interrompida. Confira a conexão para carregar o leitor e tente novamente.
                </p>
              )}
              {ocrState === 'error' && (
                <p className="text-sm text-destructive text-center">
                  {photoUrl ? 'Toque no meio dos dígitos. Se estiverem pequenos, tire uma foto mais próxima.' : 'Não consegui confirmar os dígitos. Você também pode fotografar o valor para ler com mais detalhe.'}
                </p>
              )}

              <input ref={photoInput} type="file" accept="image/*" capture="environment" className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  event.target.value = '';
                  if (!file) return;
                  ocrRequest.current?.abort();
                  setOcrValue(null);
                  setOcrState('idle');
                  setPhotoUrl(URL.createObjectURL(file));
                }} />
              {ocrState !== 'reading' && !isProcessing && (
                <div className="flex justify-center gap-5 text-sm">
                  <button type="button" className="underline" onClick={() => {
                    if (photoUrl) setPhotoUrl(null);
                    else setNumbersOnly(!numbersOnly);
                    setOcrValue(null);
                    setOcrState('idle');
                  }}>
                    {photoUrl ? 'Voltar à câmera' : numbersOnly ? 'Ler linha inteira' : 'Ler só os dígitos'}
                  </button>
                  <button type="button" onClick={() => photoInput.current?.click()} className="underline">
                    {photoUrl ? 'Tirar outra foto' : 'Fotografar valor'}
                  </button>
                </div>
              )}
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    resetOcr();
                    setStep('SCAN');
                  }}
                  className="px-4 py-2.5 rounded-xl text-sm font-medium border border-border text-muted-foreground"
                >
                  Voltar
                </button>
                {(!photoUrl || ocrState === 'confirmed') && <button
                  onClick={ocrState === 'confirmed' ? handleConfirmValue : handleReadValue}
                  disabled={ocrState === 'reading' || isProcessing}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-xl text-sm font-medium disabled:opacity-60"
                >
                  {ocrState === 'reading' ? (
                    <Loader2 size={16} className="animate-spin" />
                  ) : (
                    <TextSearch size={16} />
                  )}
                  {ocrState === 'reading'
                    ? 'Lendo...'
                    : ocrState === 'confirmed'
                      ? 'Confirmar valor'
                      : ocrState === 'error'
                        ? 'Tentar novamente'
                        : 'Ler valor'}
                </button>}
              </div>
            </div>
          )}

          {step === 'PURPOSE_SELECT' && (
            <QrPurposeSelector
              onConfirm={handlePurposeConfirm}
              onCancel={() => {
                resetOcr();
                setStep('SCAN');
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
    </ResponsiveModal>
  );
};
