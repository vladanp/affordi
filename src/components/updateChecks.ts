/** Installed apps can stay open for days, so look for a new version every hour. */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Checks for a new service worker hourly and on wake while visible and online. */
export function scheduleUpdateChecks(
  _scriptUrl: string,
  registration: { update(): Promise<unknown> } | undefined,
): () => void {
  if (registration === undefined) return () => undefined;
  let lastChecked = Date.now();
  const check = () => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    lastChecked = Date.now();
    registration.update().catch(() => undefined);
  };
  const onVisible = () => {
    if (Date.now() - lastChecked >= UPDATE_CHECK_INTERVAL_MS) check();
  };
  const timer = window.setInterval(check, UPDATE_CHECK_INTERVAL_MS);
  document.addEventListener('visibilitychange', onVisible);
  return () => {
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisible);
  };
}
