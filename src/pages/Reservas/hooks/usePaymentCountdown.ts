import { useEffect, useState } from 'react';

export function usePaymentCountdown(expiresAt?: string | null) {
  const [remainingMs, setRemainingMs] = useState<number>(() => {
    if (!expiresAt) return 0;
    return Math.max(0, new Date(expiresAt).getTime() - Date.now());
  });

  useEffect(() => {
    if (!expiresAt) return;
    const compute = () =>
      setRemainingMs(Math.max(0, new Date(expiresAt).getTime() - Date.now()));
    compute();
    const interval = setInterval(compute, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const totalSeconds = Math.floor(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    remainingMs,
    expired: remainingMs <= 0,
    formatted: `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}
