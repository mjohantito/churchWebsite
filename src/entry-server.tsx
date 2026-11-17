import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import { StaticRouter } from 'react-router-dom/server';
import { dehydrate, QueryClientProvider } from '@tanstack/react-query';
import { App } from './App';
import i18n, { DEFAULT_LANG, initI18n } from './i18n';
import { createQueryClient } from './lib/queryClient';
import { prefetchHomepage, prefetchServices } from './data/queries';
import { PUBLIC_ROUTES, routeMeta } from './lib/seo';

export { PUBLIC_ROUTES };

/** Title / description / robots for a route, in the default language (ID). */
export function meta(url: string) {
  initI18n(DEFAULT_LANG);
  return routeMeta(url, i18n.t);
}

/**
 * Build time only (scripts/prerender.mjs): renders a route to static HTML so
 * it is readable with JavaScript disabled. The homepage is rendered with real
 * data; other pages render their shell (header, footer, page frame).
 * If the database is unreachable at build time, the page still renders and
 * the browser fetches the data instead.
 */
export async function render(url: string) {
  initI18n(DEFAULT_LANG);
  const queryClient = createQueryClient();
  const failed = url === '/'
    ? await prefetchHomepage(queryClient)
    : await prefetchServices(queryClient).then(() => 0, () => 1); // footer times on every page

  const state = dehydrate(queryClient);
  const html = renderToString(
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <StaticRouter location={url}>
          <App />
        </StaticRouter>
      </QueryClientProvider>
    </StrictMode>,
  );
  queryClient.clear(); // drop cache timers so the build process can exit
  return { html, state, failed };
}
