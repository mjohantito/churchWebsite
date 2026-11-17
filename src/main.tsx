import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import '@fontsource-variable/archivo/wdth.css';
// Display headings: Plus Jakarta Sans ExtraBold, latin subset, 800 only (preloaded in vite.config.ts).
import '@fontsource/plus-jakarta-sans/latin-800.css';
import '@fontsource/dm-sans/300.css';
import '@fontsource/dm-sans/300-italic.css';
import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/500.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/yellowtail/400.css';
import './index.css';
import { App } from './App';
import { DEFAULT_LANG, initI18n, readStoredLang } from './i18n';

const container = document.getElementById('root')!;
const lang = readStoredLang() ?? DEFAULT_LANG;
initI18n(lang);

const app = (
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// The build prerenders "/" in Indonesian. Hydrate only when the visitor
// will see exactly that markup; otherwise render fresh.
const prerendered = container.firstElementChild !== null;
if (prerendered && window.location.pathname === '/' && lang === DEFAULT_LANG) {
  hydrateRoot(container, app);
} else {
  container.innerHTML = '';
  createRoot(container).render(app);
}
