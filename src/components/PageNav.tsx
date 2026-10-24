import type { Translator } from '../domain/i18n';
import { pageNames, pages, type Page } from './pages';

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
          {copy.t(pageNames[option])}
        </a>
      ))}
    </nav>
  );
}
