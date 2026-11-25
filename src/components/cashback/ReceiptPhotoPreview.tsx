import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { ResponsiveModal } from '@/components/ui/responsive-modal';
import { CashbackService } from '@/services/cashback';
import type { CashbackPurpose, ReceiptPhotoJob } from '@/types/cashback';

export function ReceiptCamera({ onClose, barEnabled, clientId }: {
  onClose: () => void; barEnabled: boolean; clientId: string;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const capture = useRef<{ id: string; blob: Blob } | null>(null);
  const [error, setError] = useState('');
  const [purpose, setPurpose] = useState<CashbackPurpose>('COURT');
  const queries = useQueryClient();

  useEffect(() => {
    let closed = false;
    let stream: MediaStream | undefined;
    async function start() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: false, video: {
          facingMode: { ideal: 'environment' }, width: { ideal: 1920 }, height: { ideal: 1440 },
        } });
        if (!closed && video.current) {
          video.current.srcObject = stream;
          await video.current.play();
        } else stream.getTracks().forEach(track => track.stop());
      } catch {
        if (!closed) setError('Não foi possível abrir a câmera. Confira a permissão do navegador e tente de novo.');
      }
    }
    void start();
    return () => { closed = true; stream?.getTracks().forEach(track => track.stop()); };
  }, [attempt]);

  async function submit() {
    if (lock.current) return;
    lock.current = true;
    setBusy(true);
    setError('');
    try {
      if (!capture.current) {
        const camera = video.current;
        if (!camera?.videoWidth || !camera.videoHeight) throw new Error('Aguarde a câmera e tente novamente.');
        const canvas = document.createElement('canvas');
        canvas.width = camera.videoWidth;
        canvas.height = camera.videoHeight;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Não foi possível tirar a foto.');
        context.drawImage(camera, 0, 0);
        const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.92));
        if (!blob) throw new Error('Tire outra foto do cupom.');
        capture.current = { id: crypto.randomUUID(), blob };
      }
      const job = await CashbackService.submitPhoto(capture.current.id, capture.current.blob, purpose);
      queries.setQueryData<ReceiptPhotoJob[]>(['receipt-photos', clientId], old => [job, ...(old ?? []).filter(item => item.id !== job.id)]);
      void queries.invalidateQueries({ queryKey: ['receipt-photos', clientId] });
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Falha no envio. Tente novamente.');
    } finally { lock.current = false; setBusy(false); }
  }

  return <ResponsiveModal open onClose={() => { if (!lock.current) onClose(); }} title="Fotografar cupom">
    <div className="px-4 pb-6 space-y-3">
      <p className="text-sm">Enquadre o QR inteiro e a linha do valor final na mesma foto.</p>
      <video ref={video} playsInline muted autoPlay onLoadedData={() => setReady(true)}
        className="w-full max-h-[45dvh] rounded-xl bg-black object-contain" />
      {barEnabled && <label className="block text-sm">Destino do cashback
        <select className="ml-2 rounded border p-1" disabled={busy || !!capture.current} value={purpose}
          onChange={e => setPurpose(e.target.value as CashbackPurpose)}>
          <option value="COURT">Quadra</option><option value="BAR">Bar</option>
        </select>
      </label>}
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      {error && !ready && <button onClick={() => { setError(''); setAttempt(v => v + 1); }}>Abrir câmera novamente</button>}
      <button type="button" disabled={!ready || busy} onClick={submit}
        className="w-full rounded-xl bg-primary py-3 font-semibold text-primary-foreground disabled:opacity-50">
        {busy ? 'Enviando…' : capture.current ? 'Reenviar a mesma foto' : 'Tirar foto e enviar'}
      </button>
    </div>
  </ResponsiveModal>;
}
