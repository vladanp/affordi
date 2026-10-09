/** Installed apps can stay open for days, so look for a new version every hour. */
export const UPDATE_CHECK_INTERVAL_MS = 60 * 60 * 1000;

/** Checks for a new service worker while the app is visible and online. */
export function scheduleUpdateChecks(
  _scriptUrl: string,
  registration: { update(): Promise<unknown> } | undefined,
): void {
  if (registration === undefined) return;
  window.setInterval(() => {
    if (document.visibilityState !== 'visible' || !navigator.onLine) return;
    registration.update().catch(() => undefined);
  }, UPDATE_CHECK_INTERVAL_MS);
}
