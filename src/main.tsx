import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App.tsx';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/queryClient.tsx';
import { registerSW } from 'virtual:pwa-register';
import './styles/global.css';

let isReloading = false;

registerSW({
  immediate: true,
  onNeedRefresh() {
    if (!isReloading && document.visibilityState === 'visible') {
      isReloading = true;
      setTimeout(() => window.location.reload(), 100);
    }
  },
});

if ('serviceWorker' in navigator) {
  let controllerChangeCount = 0;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    controllerChangeCount++;
    if (controllerChangeCount === 1 && !isReloading) {
      isReloading = true;
      setTimeout(() => window.location.reload(), 100);
    }
  });

  navigator.serviceWorker.addEventListener('message', (event: MessageEvent) => {
    if (event.data?.type === 'NOTIFICATION_CLICK') {
      const url = event.data.url as string;
      if (url && window.location.pathname !== url) {
        window.location.href = url;
      }
    }
  });
}

createRoot(document.getElementById('root')!).render(
  <BrowserRouter>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </BrowserRouter>
);
