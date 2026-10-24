import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

import { loadLocale, supportedLocales } from '../domain/i18n';

// The app loads languages other than English on demand; tests start with all of them.
await Promise.all(supportedLocales.map(loadLocale));

vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [false, vi.fn()],
    offlineReady: [false, vi.fn()],
    updateServiceWorker: vi.fn(async () => undefined),
  }),
}));
