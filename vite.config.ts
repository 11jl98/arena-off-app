import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import fs from 'fs';
import { visualizer } from 'rollup-plugin-visualizer';

const API_PROXY_TARGET = process.env.VITE_API_BASE_URL || 'http://localhost:8080';

const certPath = './cert/192.168.15.4.pem';
const keyPath = './cert/192.168.15.4-key.pem';
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

          if (normalized.includes('/firebase/') || normalized.includes('@firebase/')) return 'vendor-firebase';
          if (normalized.includes('react-hook-form') || normalized.includes('/zod/') || normalized.includes('hookform-resolvers')) return 'vendor-forms';
          if (normalized.includes('react-router')) return 'vendor-router';
          if (normalized.includes('@tanstack')) return 'vendor-query';
          if (normalized.includes('/react/') || normalized.includes('react-dom') || normalized.includes('/scheduler/') || normalized.includes('/react-is/')) return 'vendor-react';
          if (normalized.includes('framer-motion')) return 'vendor-motion';
          if (normalized.includes('@radix-ui') || normalized.includes('/vaul/') || normalized.includes('/sonner/') || normalized.includes('lucide-react') || normalized.includes('next-themes')) return 'vendor-ui';
          return 'vendor-misc';
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
