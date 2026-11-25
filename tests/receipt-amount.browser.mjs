import assert from 'node:assert/strict';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { test } from 'node:test';
import { chromium } from 'playwright-core';
import { createServer } from 'vite';

test('lê o preço impresso na foto e no vídeo, com outras linhas na faixa', async (t) => {
  const cache = await mkdtemp(path.join(tmpdir(), 'receipt-ocr-vite-'));
  const server = await createServer({
    configFile: false, cacheDir: cache, logLevel: 'error',
    optimizeDeps: { noDiscovery: true, include: ['onnxruntime-web/wasm'] },
    server: { host: '127.0.0.1', port: 0 },
  });
  t.after(async () => {
    await server.close();
    await rm(cache, { recursive: true, force: true });
  });
  await server.listen();
  const browser = await chromium.launch({ channel: 'chrome' });
  t.after(() => browser.close());
  const page = await browser.newPage();
  const source = await readFile(new URL('./fixtures/total-cupom.png', import.meta.url));
  await page.goto(new URL('logo-192.png', server.resolvedUrls.local[0]).href);
  const values = await page.evaluate(async (base64) => {
    const { readPhotoAmount, readReceiptAmount } = await import('/src/utils/helpers/receipt-ocr.ts');
    const photo = new Image();
    photo.src = 'data:image/png;base64,' + base64;
    await photo.decode();
    const signal = new AbortController().signal;
    const tap = (x, y) => readPhotoAmount(photo, { x: x / photo.width, y: y / photo.height }, signal);
    const total = await tap(383, 36);
    const blank = await tap(234, 10);

    const canvas = document.createElement('canvas');
    canvas.width = photo.width;
    canvas.height = 120;
    const ctx = canvas.getContext('2d');
    const paint = () => ctx.drawImage(photo, 0, 30);
    paint();
    const timer = setInterval(paint, 36);
    const video = document.createElement('video');
    video.muted = true;
    video.style.cssText = 'position:absolute;left:0;top:0;width:416px;height:120px';
    document.body.append(video);
    const stream = canvas.captureStream(24);
    video.srcObject = stream;
    try {
      await video.play();
      const guide = document.createElement('div');
      guide.style.cssText = 'position:absolute;left:350px;top:46px;width:66px;height:40px';
      document.body.append(guide);
      return { total, blank, live: await readReceiptAmount(video, guide, signal, true) };
    } finally {
      clearInterval(timer);
      stream.getTracks().forEach(track => track.stop());
    }
  }, source.toString('base64'));
  assert.deepEqual(values, { total: 783.13, blank: null, live: 783.13 });
});
