import { env, InferenceSession, Tensor } from 'onnxruntime-web/wasm';
import wasmModuleUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.mjs?url';
import wasmUrl from '../../../node_modules/onnxruntime-web/dist/ort-wasm-simd-threaded.wasm?url';
import modelUrl from '../../assets/receipt-ocr/en_PP-OCRv5_mobile_rec.onnx?url';
import alphabet from '../../assets/receipt-ocr/characters.json';

interface Point { x: number; y: number }
interface Span { start: number; end: number }
interface WordBox { x: number; y: number; width: number; height: number }

let sessionPromise: Promise<InferenceSession> | undefined;
const getSession = () => {
  if (!sessionPromise) {
    env.wasm.numThreads = 1;
    env.wasm.wasmPaths = {
      wasm: new URL(wasmUrl, location.href).href,
      mjs: new URL(wasmModuleUrl, location.href).href,
    };
    sessionPromise = InferenceSession.create(modelUrl, { executionProviders: ['wasm'] })
      .catch((error: unknown) => { sessionPromise = undefined; throw error; });
  }
  return sessionPromise;
};

function spans(counts: Uint32Array, threshold: number, maxGap: number): Span[] {
  const groups: Span[] = [];
  for (let i = 0; i < counts.length; i++) {
    if (counts[i] < threshold) continue;
    const previous = groups.at(-1);
    if (previous && i - previous.end - 1 <= maxGap) previous.end = i;
    else groups.push({ start: i, end: i });
  }
  return groups;
}

function locateWord(frame: HTMLCanvasElement, point: Point): WordBox | null {
  const { width, height } = frame;
  const ctx = frame.getContext('2d', { willReadFrequently: true });
  if (!ctx || !width || !height) return null;
  const pixels = ctx.getImageData(0, 0, width, height).data;
  const radius = Math.max(8, Math.min(height / 4, width / 4));
  const left = Math.max(0, Math.floor(point.x - radius));
  const right = Math.min(width, Math.ceil(point.x + radius));
  const rows = new Uint32Array(height);
  const levels = new Uint8Array(height);
  const histogram = new Uint32Array(256);
  for (let y = 0; y < height; y++) {
    histogram.fill(0);
    for (let x = left; x < right; x++) histogram[pixels[(y * width + x) * 4 + 1]]++;
    let paper = 255;
    let count = 0;
    while (paper > 0 && count + histogram[paper] < (right - left) / 4) count += histogram[paper--];
    levels[y] = Math.max(0, paper - Math.max(16, paper * 0.16));
    for (let level = 0; level < levels[y]; level++) rows[y] += histogram[level];
  }
  const lines = spans(rows, Math.max(2, Math.ceil((right - left) * 0.035)), 0)
    .filter(({ start, end }) => {
      const h = end - start + 1;
      return h >= 4 && point.y >= start - h * 0.28 && point.y <= end + h * 0.28;
    });
  if (lines.length !== 1) return null;
  const { start, end } = lines[0];
  if (start === 0 || end === height - 1) return null;
  const h = end - start + 1;
  const columns = new Uint32Array(width);
  for (let y = start; y <= end; y++) {
    for (let x = 0; x < width; x++) {
      if (pixels[(y * width + x) * 4 + 1] < levels[y]) columns[x]++;
    }
  }
  const words = spans(columns, Math.max(1, Math.floor(h * 0.08)), Math.ceil(h * 0.72))
    .filter(word => point.x >= word.start - h / 2 && point.x <= word.end + h / 2);
  if (words.length !== 1) return null;
  const word = words[0];
  if (word.start === 0 || word.end === width - 1) return null;
  return { x: word.start, y: start, width: word.end - word.start + 1, height: h };
}

async function readWord(session: InferenceSession, frame: HTMLCanvasElement, box: WordBox, margin: number) {
  const pad = Math.max(1, Math.round(box.height * margin));
  const x = Math.max(0, box.x - pad);
  const y = Math.max(0, box.y - pad);
  const width = Math.min(frame.width, box.x + box.width + pad) - x;
  const height = Math.min(frame.height, box.y + box.height + pad) - y;
  const w = Math.ceil(48 * width / height);
  if (w < 1 || w > 960) return null;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = 48;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(frame, x, y, width, height, 0, 0, w, 48);
  const rgba = ctx.getImageData(0, 0, w, 48).data;
  const stride = Math.max(320, w);
  const input = new Float32Array(3 * 48 * stride);
  for (let row = 0; row < 48; row++) {
    for (let col = 0; col < w; col++) {
      const offset = 4 * (row * w + col);
      for (let c = 0; c < 3; c++) input[(c * 48 + row) * stride + col] = rgba[offset + 2 - c] / 127.5 - 1;
    }
  }
  const tensor = new Tensor('float32', input, [1, 3, 48, stride]);
  const outputs = await session.run({ [session.inputNames[0]]: tensor });
  const scores = outputs[session.outputNames[0]];
  try {
    const [, steps, classes] = scores.dims;
    const probabilities = scores.data as Float32Array;
    let last = 0;
    let text = '';
    for (let step = 0; step < steps; step++) {
      const offset = step * classes;
      let best = 0;
      for (let i = 1; i < classes; i++) {
        if (probabilities[offset + i] > probabilities[offset + best]) best = i;
      }
      if (best && best !== last) {
        const char = alphabet[best - 1] ?? ' ';
        if (/\d/.test(char) && probabilities[offset + best] < 0.77) return null;
        text += char;
      }
      last = best;
    }
    return text;
  } finally {
    tensor.dispose();
    for (const output of Object.values(outputs)) output.dispose();
  }
}

export async function readPrintedAmount(
  frame: HTMLCanvasElement, point: Point, signal: AbortSignal,
  parseMoney: (text: string) => number | null,
): Promise<number | null> {
  const word = locateWord(frame, point);
  if (!word || signal.aborted) return null;
  const session = await getSession();
  if (signal.aborted) return null;
  const first = parseMoney(await readWord(session, frame, word, 0.10) ?? '');
  if (first === null || signal.aborted) return null;
  const second = parseMoney(await readWord(session, frame, word, 0.23) ?? '');
  return second === first ? first : null;
}

export async function readPrintedLabel(
  frame: HTMLCanvasElement, box: WordBox, signal: AbortSignal,
): Promise<string> {
  if (signal.aborted) return '';
  const session = await getSession();
  return signal.aborted ? '' : await readWord(session, frame, box, 0.12) ?? '';
}
