import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

const API_PROXY_TARGET = process.env.VITE_API_BASE_URL || 'http://localhost:8080';

const certPath = './cert/192.168.15.3.pem';
const keyPath = './cert/192.168.15.3-key.pem';
const hasLocalCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

// https://vite.dev/config/
export default defineConfig({
  server: {
    host: true,
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      'Cross-Origin-Embedder-Policy': 'unsafe-none',
    },
    https: hasLocalCerts
      ? {
          cert: fs.readFileSync(certPath),
          key: fs.readFileSync(keyPath),
        }
      : undefined,
    proxy: {
      '/api': {
        target: API_PROXY_TARGET,
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  plugins: [
    react(),
    visualizer({ open: false }),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      injectManifest: {
        injectionPoint: 'self.__WB_MANIFEST',
      },
      includeAssets: [
        'logo.jpg',
        'logo-192.png',
        'logo-512.png',
        'icons/maskable-192x192.png',
        'icons/maskable-512x512.png',
        'favicon-16x16.png',
        'favicon-32x32.png',
        'apple-touch-icon.png',
        'apple-touch-icon-180x180.png',
      ],
      manifest: {
        id: 'arena-off-beach-app',
        name: 'Arena Off Beach',
        short_name: 'Arena Off',
        description: 'Reserve quadras de beach sports e ganhe cashback',
        lang: 'pt-BR',
        theme_color: '#E8610A',
        background_color: '#E8610A',
        display: 'standalone',
        start_url: '/',
        scope: '/',
        icons: [
          {
            src: 'logo-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'logo-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: 'icons/maskable-192x192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'maskable',
          },
          {
            src: 'icons/maskable-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        importScripts: ['sw-push.js'],
        globPatterns: ['**/*.{js,css,json,png,svg,ico,webp,woff2}'],
        globIgnores: ['**/logo-512.png'],
        maximumFileSizeToCacheInBytes: 500 * 1024,
        runtimeCaching: [
          {
            urlPattern: /\/api\/auth\//,
            handler: 'NetworkOnly',
          },
          {
            urlPattern: /\/api\//,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api',
              networkTimeoutSeconds: 2,
            },
          },
          {
            urlPattern: /\/logo-512\.png$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'images',
              expiration: { maxEntries: 5, maxAgeSeconds: 30 * 24 * 60 * 60 },
            },
          },
        ],
      },
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined;

          const normalized = id.replace(/\\/g, '/');

          if (normalized.includes('/firebase/') || normalized.includes('@firebase/'))
            return 'vendor-firebase';
          if (
            normalized.includes('node_modules/react/') ||
            normalized.includes('node_modules/react-dom/') ||
            normalized.includes('node_modules/scheduler/') ||
            normalized.includes('node_modules/react-is/')
          ) {
            return 'vendor-react';
          }

          return undefined;
        },
      },
    },
  },
  resolve: {
    alias: {
      '@': '/src',
      '@components': '/src/components',
      '@pages': '/src/pages',
      '@services': '/src/services',
      '@hooks': '/src/hooks',
      '@store': '/src/store',
      '@utils': '/src/utils',
      '@types': '/src/types',
      '@assets': '/src/assets',
      '@lib': '/src/lib',
    },
  },
});
