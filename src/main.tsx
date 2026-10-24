import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import { detectLocale, loadLocale, supportedLocales } from './domain/i18n';
import { trackKeyboardFocus } from './domain/keyboardFocus';
import { loadSettings } from './domain/storage';
import './styles/foundation.css';
import './styles/forms.css';
import './styles/calculator.css';
import './styles/cards.css';
import './styles/earnings.css';
import './styles/lists.css';
import './styles/bills.css';
import './styles/overlays.css';
import './styles/motion.css';
import './styles/responsive-theme.css';

const root = document.querySelector('#root');

if (!(root instanceof HTMLElement)) {
  throw new Error('Affordi could not find its application root.');
}

trackKeyboardFocus();

function render(element: HTMLElement) {
  createRoot(element).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}

// Only English is part of the first screen. Another language loads before the first render,
// so the page never flashes in English, and falls back to it if the file cannot load.
loadLocale(loadSettings()?.language ?? detectLocale())
  .catch(() => undefined)
  .finally(() => render(root));

// The other languages load once the page has, so switching language is instant.
window.addEventListener(
  'load',
  () => {
    for (const locale of supportedLocales) loadLocale(locale).catch(() => undefined);
  },
  { once: true },
);
