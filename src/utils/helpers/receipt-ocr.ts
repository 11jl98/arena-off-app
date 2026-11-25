import type { Worker, PSM } from 'tesseract.js';

const WHITELIST = '0123456789.,R$ ';
const FRAMES = 3;
const FRAME_DELAY_MS = 160;
const MIN_BAND_HEIGHT_PX = 150;
const MAX_UPSCALE = 4;

export interface GuideRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

let workerPromise: Promise<Worker> | null = null;

const getWorker = async (): Promise<Worker> => {
  if (!workerPromise) {
    workerPromise = import('tesseract.js')
      .then(({ createWorker }) => createWorker('por'))
      .catch((err) => {
        workerPromise = null;
        throw err;
      });
  }
  return workerPromise;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Recorta a faixa (retângulo-guia, em coordenadas de página) do frame do
 * vídeo, mapeando para pixels considerando object-fit: cover.
 */
export const captureGuideBand = (
  video: HTMLVideoElement,
  guide: GuideRect,
): HTMLCanvasElement | null => {
  const { videoWidth, videoHeight } = video;
  if (!videoWidth || !videoHeight) return null;

  const vRect = video.getBoundingClientRect();
  if (vRect.width === 0 || vRect.height === 0) return null;

  // object-fit: cover → escala uniforme centrada
  const scale = Math.max(vRect.width / videoWidth, vRect.height / videoHeight);
  const contentOffsetX = vRect.left + (vRect.width - videoWidth * scale) / 2;
  const contentOffsetY = vRect.top + (vRect.height - videoHeight * scale) / 2;

  const cropX = Math.round((guide.left - contentOffsetX) / scale);
  const cropY = Math.round((guide.top - contentOffsetY) / scale);
  const cropW = Math.round(guide.width / scale);
  const cropH = Math.round(guide.height / scale);

  const x = Math.max(0, Math.min(cropX, videoWidth - 1));
  const y = Math.max(0, Math.min(cropY, videoHeight - 1));
  const w = Math.max(1, Math.min(cropW, videoWidth - x));
  const h = Math.max(1, Math.min(cropH, videoHeight - y));

  const upscale = Math.min(
    MAX_UPSCALE,
    Math.max(1, Math.ceil(MIN_BAND_HEIGHT_PX / h)),
  );

  const canvas = document.createElement('canvas');
  canvas.width = w * upscale;
  canvas.height = h * upscale;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.imageSmoothingEnabled = true;
  ctx.drawImage(video, x, y, w, h, 0, 0, canvas.width, canvas.height);

  return canvas;
};

/** Escala de cinza + limiar de Otsu (texto escuro em papel claro). */
const binarize = (canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) => {
  const { width, height } = canvas;
  const image = ctx.getImageData(0, 0, width, height);
  const data = image.data;

  const histogram = new Uint32Array(256);
  for (let i = 0; i < data.length; i += 4) {
    const grey = Math.round(
      0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
    );
    data[i] = grey;
    data[i + 1] = grey;
    data[i + 2] = grey;
    histogram[grey]++;
  }

  const total = width * height;
  let sum = 0;
  for (let i = 0; i < 256; i++) sum += i * histogram[i];

  let sumBackground = 0;
  let weightBackground = 0;
  let bestVariance = 0;
  let threshold = 160;

  for (let i = 0; i < 256; i++) {
    weightBackground += histogram[i];
    if (weightBackground === 0) continue;
    const weightForeground = total - weightBackground;
    if (weightForeground === 0) break;

    sumBackground += i * histogram[i];
    const meanBackground = sumBackground / weightBackground;
    const meanForeground = (sum - sumBackground) / weightForeground;
    const variance =
      weightBackground *
      weightForeground *
      (meanBackground - meanForeground) *
      (meanBackground - meanForeground);

    if (variance > bestVariance) {
      bestVariance = variance;
      threshold = i;
    }
  }

  for (let i = 0; i < data.length; i += 4) {
    const value = data[i] > threshold ? 255 : 0;
    data[i] = value;
    data[i + 1] = value;
    data[i + 2] = value;
  }

  ctx.putImageData(image, 0, 0);
};

/** Aceita um único valor completo, inclusive quando o OCR separa os centavos. */
const parseMoney = (text: string): number | null => {
  const match = text.trim().match(
    /^(?:R\s*\$?\s*|\$\s*)?(\d{1,3}(?:\.\d{3})+|\d+)\s*([.,])\s*(\d{2})$/i,
  );
  if (!match) return null;
  const cents = Number(match[1].replace(/\./g, '')) * 100 + Number(match[3]);
  return cents > 0 && cents <= 20000000 ? cents / 100 : null;
};

export const parseAmountFromText = (text: string): number | null => {
  const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const amounts = new Set<number>();
  for (const [index, line] of lines.entries()) {
    const label = line.match(/^(?:(?:forma de pagamento\s+)?valor\s+(?:pago|total|da nota|a pagar)|total(?:\s+a pagar)?|a\s+pagar)\b[\s:.-]*/i);
    if (!label) continue;

    const tail = line.slice(label[0].length);
    let amount = parseMoney(tail);
    // Alguns cupons imprimem "Valor pago" como cabeçalho da coluna.
    if (/^(?:R\s*\$)?$/i.test(tail.trim()) && index === lines.length - 2) {
      amount = parseMoney(lines[index + 1].replace(/^(?:pix|dinheiro|cart[aã]o(?: de)? (?:cr[eé]dito|d[eé]bito))\s+/i, ''));
    }
    if (amount !== null) amounts.add(amount);
  }
  if (amounts.size === 1) return [...amounts][0];
  return lines.length === 1 ? parseMoney(lines[0]) : null;
};


interface ImagePoint {
  x: number;
  y: number;
}

const readPointedAmount = async (frame: HTMLCanvasElement, point: ImagePoint, signal: AbortSignal) => {
  const { readPrintedAmount } = await import('./printed-amount');
  return readPrintedAmount(frame, point, signal, parseMoney);
};

export const readPhotoAmount = async (
  photo: HTMLImageElement,
  point: ImagePoint,
  signal: AbortSignal,
): Promise<number | null> => {
  const width = photo.naturalWidth;
  const height = photo.naturalHeight;
  if (!width || !height) return null;
  const x = point.x * width;
  const y = point.y * height;
  const w = Math.max(1, Math.round(width * 0.48));
  const h = Math.max(1, Math.min(height, Math.round(w * 0.30)));
  const left = Math.max(0, Math.min(width - w, x - w / 2));
  const top = Math.max(0, Math.min(height - h, y - h / 2));
  const scale = Math.min(3, 1152 / w);
  const frame = document.createElement('canvas');
  frame.width = Math.ceil(w * scale);
  frame.height = Math.ceil(h * scale);
  const ctx = frame.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(photo, left, top, w, h, 0, 0, frame.width, frame.height);
  return readPointedAmount(frame, {
    x: (x - left) * frame.width / w,
    y: (y - top) * frame.height / h,
  }, signal);
};

const readLabeledAmount = async (
  worker: Worker,
  frame: HTMLCanvasElement,
  signal: AbortSignal,
): Promise<number | null> => {
  // O rótulo permite distinguir o total de troco ou subtotal na mesma faixa.
  await worker.setParameters({ tessedit_char_whitelist: '', tessedit_pageseg_mode: '6' as PSM });
  const { data } = await worker.recognize(frame, {}, { blocks: true });
  const labeled = new Set<number>();
  for (const block of data.blocks ?? []) {
    for (const paragraph of block.paragraphs) {
      for (const line of paragraph.lines) {
        const prices = line.words.filter(word => parseMoney(word.text) !== null);
        if (prices.length !== 1) continue;
        const price = prices[0];
        const prefix = line.words.slice(0, line.words.indexOf(price));
        const label = prefix.map(word => word.text).join(' ');
        if (!/^(valor\b|total\b|a\s+pagar\b)/i.test(label)) continue;

        // O primeiro OCR localiza as colunas. Confirma separadamente o nome
        // da linha e os dígitos, inclusive se o papel tiver impressão estreita.
        const isTotal = /^(?:valor\s+(?:t[o0][ti1]al|pago|a\s+pagar|da\s+nota)|total(?:\s+a\s+pagar)?|a\s+pagar)\s*[:.-]?\s*(?:r\s*[$s]|\$)?$/i;
        if (!isTotal.test(label)) {
          const x = Math.min(...prefix.map(w => w.bbox.x0));
          const y = Math.min(...prefix.map(w => w.bbox.y0));
          const width = Math.max(...prefix.map(w => w.bbox.x1)) - x;
          const height = Math.max(...prefix.map(w => w.bbox.y1)) - y;
          const { readPrintedLabel } = await import('./printed-amount');
          if (!isTotal.test((await readPrintedLabel(frame, { x, y, width, height }, signal)).trim())) continue;
        }
        const { x0, x1, y0, y1 } = price.bbox;
        const confirmed = await readPointedAmount(frame, { x: (x0 + x1) / 2, y: (y0 + y1) / 2 }, signal);
        if (confirmed === null) return null;
        labeled.add(confirmed);
      }
    }
  }
  if (labeled.size > 0) return labeled.size === 1 ? [...labeled][0] : null;
  let amount = parseAmountFromText(data.text);
  if (amount === null && !signal.aborted) {
    const ctx = frame.getContext('2d');
    if (!ctx) return null;
    binarize(frame, ctx);
    const digitsOnly = /^[\d\sR$.,]+$/i.test(data.text.trim()) && !data.text.trim().includes('\n');
    await worker.setParameters({
      tessedit_char_whitelist: digitsOnly ? WHITELIST : '',
      tessedit_pageseg_mode: (data.text.trim().includes('\n') ? '6' : '7') as PSM,
    });
    const retry = await worker.recognize(frame);
    amount = parseAmountFromText(retry.data.text);
  }
  return amount;
};

export const readReceiptAmount = async (
  video: HTMLVideoElement,
  guide: HTMLElement,
  signal: AbortSignal,
  numbersOnly = false,
): Promise<number | null> => {
  const frames: HTMLCanvasElement[] = [];
  let lastTime = -1;
  for (let i = 0; i < FRAMES; i++) {
    if (i > 0) await sleep(FRAME_DELAY_MS);
    if (signal.aborted) return null;
    if (video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA || video.currentTime === lastTime) continue;
    lastTime = video.currentTime;
    const frame = captureGuideBand(video, guide.getBoundingClientRect());
    if (frame) frames.push(frame);
  }

  if (frames.length < 2) return null;
  const seen = new Set<number>();
  for (const frame of frames) {
    if (signal.aborted) return null;
    const amount = numbersOnly
      ? await readPointedAmount(frame, { x: frame.width / 2, y: frame.height / 2 }, signal)
      : await readLabeledAmount(await getWorker(), frame, signal);
    if (amount !== null) {
      if (seen.has(amount)) return amount;
      seen.add(amount);
    }
  }
  return null;
};
