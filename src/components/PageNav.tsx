import { Coins, Tag, Wallet, type LucideIcon } from 'lucide-react';

import type { Translator } from '../domain/i18n';
import { pageNames, pages, type Page } from './pages';

/** Icons label the tabs where they sit in a bar along the bottom of a phone. */
const pageIcons: Record<Page, LucideIcon> = {
  cost: Tag,
  earnings: Coins,
  monthly: Wallet,
};

interface PageNavProps {
  copy: Translator;
  page: Page;
}

/** Links styled as tabs, because each page is a place with its own address. */
export function PageNav({ copy, page }: PageNavProps) {
  return (
    <nav className="page-nav">
      {pages.map((option) => {
        const Icon = pageIcons[option];
        return (
          <a aria-current={option === page ? 'page' : undefined} href={`#${option}`} key={option}>
            <Icon aria-hidden="true" className="page-nav-icon" size={20} strokeWidth={2} />
            <span>{copy.t(pageNames[option])}</span>
          </a>
        );
      })}
    </nav>
  );
}
