import { useSyncExternalStore } from 'react';

import type { TranslationKey } from '../domain/i18n';

export const pages = ['cost', 'earnings', 'monthly'] as const;

export type Page = (typeof pages)[number];

/** The tab label of each page, which also names it in the document title. */
export const pageNames: Record<Page, TranslationKey> = {
  cost: 'nav.cost',
  earnings: 'nav.earnings',
  monthly: 'nav.monthly',
};

/** Fixed costs and bills had pages of their own before they shared the monthly page. */
const formerPages: Record<string, Page> = { '#fixed-costs': 'monthly', '#bills': 'monthly' };

function pageFromHash(hash: string): Page {
  return pages.find((page) => `#${page}` === hash) ?? formerPages[hash] ?? 'cost';
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
