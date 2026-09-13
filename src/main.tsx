import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from './App';
import './styles/foundation.css';
import './styles/forms.css';
import './styles/calculator.css';
import './styles/overlays.css';
import './styles/responsive-theme.css';

const root = document.querySelector('#root');

if (!(root instanceof HTMLElement)) {
  throw new Error('Affordi could not find its application root.');
}

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
