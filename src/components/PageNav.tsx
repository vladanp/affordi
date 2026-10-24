import { useSyncExternalStore } from 'react';

import type { Translator } from '../domain/i18n';

const pages = ['cost', 'earnings'] as const;

type Page = (typeof pages)[number];

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

interface PageNavProps {
  copy: Translator;
  page: Page;
}

/** Links styled as a segmented control, because each page is a place with its own address. */
export function PageNav({ copy, page }: PageNavProps) {
  return (
    <nav className="page-nav">
      {pages.map((option) => (
        <a aria-current={option === page ? 'page' : undefined} href={`#${option}`} key={option}>
          {copy.t(`nav.${option}`)}
        </a>
      ))}
    </nav>
  );
}
