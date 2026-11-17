import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { hydrate, QueryClientProvider, type DehydratedState } from '@tanstack/react-query';
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
import { createQueryClient, DEHYDRATED_KEY } from './lib/queryClient';

// After a new deploy, an open tab may ask for an old (now removed) lazy chunk.
// Reload once to pick up the new version instead of showing a broken page.
window.addEventListener('vite:preloadError', (event) => {
  const key = 'sb-reloaded-for-chunk';
  if (sessionStorage.getItem(key)) return;
  sessionStorage.setItem(key, '1');
  event.preventDefault();
  window.location.reload();
});
window.addEventListener('load', () => window.setTimeout(() => sessionStorage.removeItem('sb-reloaded-for-chunk'), 10_000));

const container = document.getElementById('root')!;
const lang = readStoredLang() ?? DEFAULT_LANG;
initI18n(lang);

const queryClient = createQueryClient();
// Homepage data fetched at build time (scripts/prerender.mjs). It seeds the
// cache so hydration matches the static HTML, then is marked stale so the
// browser always refetches it on mount (staff edits show up immediately,
// however recent the build).
const dehydrated = (window as unknown as Record<string, DehydratedState | undefined>)[DEHYDRATED_KEY];
if (dehydrated) {
  hydrate(queryClient, dehydrated);
  void queryClient.invalidateQueries({ refetchType: 'none' });
}

// Data router with one splat route: App keeps its own <Routes>, and the
// admin forms can use useBlocker() to warn about unsaved changes.
const router = createBrowserRouter([{ path: '*', element: <App /> }], {
  future: { v7_relativeSplatPath: true },
});

const app = (
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} future={{ v7_startTransition: true }} />
    </QueryClientProvider>
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
