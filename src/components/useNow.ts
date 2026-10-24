import { useEffect, useState } from 'react';

/** The current time, refreshed on an interval while the page is shown. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    // A page shown again starts from the current time instead of when it was hidden.
    const first = window.setTimeout(tick, 0);
    const timer = window.setInterval(tick, intervalMs);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [intervalMs]);
  return new Date(now);
}
