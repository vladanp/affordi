import { useState, useSyncExternalStore } from 'react';

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

/** Which way the page last moved: to a tab further along, or back to an earlier one. */
export type PageMotion = 'forward' | 'back';

/**
 * Which way the page moved, so it can slide in from the side of its tab, or null until the
 * first change. The page shown before is kept in state, as React suggests for a value that
 * depends on an earlier render.
 */
export function usePageMotion(page: Page): PageMotion | null {
  const [shown, setShown] = useState<{ page: Page; motion: PageMotion | null }>({
    page,
    motion: null,
  });
  if (shown.page === page) return shown.motion;
  const motion = pages.indexOf(page) > pages.indexOf(shown.page) ? 'forward' : 'back';
  setShown({ page, motion });
  return motion;
}
