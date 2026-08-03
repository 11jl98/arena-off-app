import { useEffect, useState } from 'react';

/**
 * Countdown to an ISO deadline, ticking every second.
 * Based on the absolute clock so it stays accurate across tab switches.
 */
export function useCountdown(targetIso: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (!targetIso) return;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [targetIso]);

  const target = targetIso ? new Date(targetIso).getTime() : 0;
  const remainingMs = targetIso ? Math.max(0, target - now) : 0;

  const isExpired = !!targetIso && remainingMs <= 0;

  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return { remainingMs, isExpired, formatted };
}
