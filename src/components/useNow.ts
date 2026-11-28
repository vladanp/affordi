import { useEffect, useState } from 'react';

/** The current time, refreshed on an interval while the page is visible. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const tick = () => setNow(Date.now());
    let timer: number | undefined;
    const stop = () => {
      if (timer !== undefined) {
        window.clearInterval(timer);
        timer = undefined;
      }
    };
    const start = () => {
      if (timer === undefined) timer = window.setInterval(tick, intervalMs);
    };
    const syncVisibility = () => {
      if (document.visibilityState === 'hidden') {
        stop();
      } else {
        tick();
        start();
      }
    };
    // A page shown again starts from the current time instead of when it was hidden.
    const first = window.setTimeout(() => {
      if (document.visibilityState !== 'hidden') {
        tick();
        start();
      }
    }, 0);
    document.addEventListener('visibilitychange', syncVisibility);
    return () => {
      window.clearTimeout(first);
      stop();
      document.removeEventListener('visibilitychange', syncVisibility);
    };
  }, [intervalMs]);
  return new Date(now);
}
