import { useSyncExternalStore } from 'react';

import type { TranslationKey } from '../domain/i18n';

export const pages = ['cost', 'earnings', 'fixed-costs'] as const;

export type Page = (typeof pages)[number];

/** The tab label of each page, which also names it in the document title. */
export const pageNames: Record<Page, TranslationKey> = {
  cost: 'nav.cost',
  earnings: 'nav.earnings',
  'fixed-costs': 'nav.fixedCosts',
};

function pageFromHash(hash: string): Page {
  return pages.find((page) => `#${page}` === hash) ?? 'cost';
}

function subscribeToHash(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** The page named by the URL hash, so each page has its own link and history entry. */
export function usePage(): Page {
  return useSyncExternalStore(
    subscribeToHash,
    () => pageFromHash(window.location.hash),
    () => 'cost',
  );
}
