import { useEffect, useState } from 'react';

function subscribeVisibleInterval(intervalMs: number, tick: () => void): () => void {
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
  // A page shown again starts from the current time instead of when it was hidden.
  const first = document.visibilityState === 'hidden' ? undefined : window.setTimeout(tick, 0);
  if (document.visibilityState !== 'hidden') start();
  const syncVisibility = () => {
    if (document.visibilityState === 'hidden') {
      window.clearTimeout(first);
      stop();
    } else {
      tick();
      start();
    }
  };
  document.addEventListener('visibilitychange', syncVisibility);
  return () => {
    window.clearTimeout(first);
    stop();
    document.removeEventListener('visibilitychange', syncVisibility);
  };
}

/** The current time, refreshed on an interval while the page is visible. */
export function useNow(intervalMs: number): Date {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => subscribeVisibleInterval(intervalMs, () => setNow(Date.now())), [intervalMs]);
  return new Date(now);
}
