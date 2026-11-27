import { useEffect, useState } from 'react';

export function usePaymentCountdown(expiresAt?: string | null) {
  const [, refreshClock] = useState(0);
  const deadline = expiresAt ? Date.parse(expiresAt) : NaN;
  const hasDeadline = Number.isFinite(deadline);
  const remainingMs = hasDeadline ? Math.max(0, deadline - Date.now()) : 0;
  const running = remainingMs > 0;

  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => refreshClock(tick => tick + 1), 1000);
    return () => clearInterval(interval);
  }, [running]);

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  return {
    remainingMs,
    expired: hasDeadline && !running,
    formatted: !hasDeadline ? '--:--' : `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`,
  };
}
