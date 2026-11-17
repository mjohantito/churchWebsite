import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { App } from './App';
import { DEFAULT_LANG, initI18n } from './i18n';

// Used only at build time (scripts/prerender.mjs) to write the static HTML
// of the homepage, so it is complete with JavaScript disabled.
export function render(url: string) {
  initI18n(DEFAULT_LANG);
  return renderToString(
    <StrictMode>
      <StaticRouter location={url}>
        <App />
      </StaticRouter>
    </StrictMode>,
  );
}
