// Post-build step (after `vite build` + the SSR build):
//  - dist/index.html            homepage, rendered with real data
//  - dist/<route>/index.html    every other public page, with its own <title>/description/OG tags
//  - dist/spa.html              neutral app shell for all other URLs (vercel.json rewrites to it)
//  - dist/sitemap.xml + Sitemap line in robots.txt (only when the site URL is known)
import { mkdirSync, readFileSync, rmSync, writeFileSync, appendFileSync } from 'node:fs';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const dist = `${root}dist`;
const { render, meta, PUBLIC_ROUTES } = await import(pathToFileURL(`${root}dist-ssr/entry-server.js`).href);

// Public site URL for absolute links (canonical, og:url, og:image, sitemap).
// Set VITE_SITE_URL once you have a domain; on Vercel the production URL is used automatically.
const SITE_URL = (process.env.VITE_SITE_URL || (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : ''))
  .replace(/\/+$/, '');

const template = readFileSync(`${dist}/index.html`, 'utf8');
for (const marker of ['<!--app-html-->', '<!-- seo:start', '<!-- seo:end -->']) {
  if (!template.includes(marker)) throw new Error(`Missing ${marker} in dist/index.html`);
}

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const abs = (path) => (SITE_URL ? `${SITE_URL}${path}` : path);

function seoBlock(route) {
  const m = meta(route);
  const url = abs(route);
  return [
    `<title>${esc(m.title)}</title>`,
    `<meta name="description" content="${esc(m.description)}" />`,
    m.noindex ? '<meta name="robots" content="noindex, nofollow" />' : '',
    SITE_URL ? `<link rel="canonical" href="${esc(url)}" />` : '',
    '<meta property="og:type" content="website" />',
    '<meta property="og:site_name" content="Setia Bakti Baptist Church" />',
    `<meta property="og:title" content="${esc(m.title)}" />`,
    `<meta property="og:description" content="${esc(m.description)}" />`,
    SITE_URL ? `<meta property="og:url" content="${esc(url)}" />` : '',
    `<meta property="og:image" content="${esc(abs('/og-image.png'))}" />`,
    '<meta property="og:image:width" content="1200" />',
    '<meta property="og:image:height" content="630" />',
    '<meta property="og:image:alt" content="Setia Bakti Baptist Church, Kediri" />',
    '<meta property="og:locale" content="id_ID" />',
    '<meta property="og:locale:alternate" content="en_US" />',
    '<meta name="twitter:card" content="summary_large_image" />',
  ].filter(Boolean).join('\n    ');
}

const withSeo = (html, route) => html.replace(/<!-- seo:start[\s\S]*?<!-- seo:end -->/, seoBlock(route));
// Escape "<" so content can never close the script tag.
const stateScript = (state) => `<script>window.__SB_QUERY_STATE__=${JSON.stringify(state).replace(/</g, '\\u003c')}</script>\n</body>`;

let failedTotal = 0;
for (const route of PUBLIC_ROUTES) {
  const { html, state, failed } = await render(route);
  failedTotal += failed;
  let out = withSeo(template, route).replace('<!--app-html-->', html);
  // Every page carries its build-time data (services for the footer; homepage content on /).
  out = out.replace('</body>', stateScript(state));
  const file = route === '/' ? `${dist}/index.html` : `${dist}${route}/index.html`;
  mkdirSync(file.slice(0, file.lastIndexOf('/')), { recursive: true });
  writeFileSync(file, out);
}

// App shell for every other URL (/daily-bread/<date>, /login, /admin/*): no
// pre-rendered body, so no page ever flashes another page's content.
writeFileSync(`${dist}/spa.html`, withSeo(template, '/').replace('<!--app-html-->', ''));

if (SITE_URL) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_ROUTES.map((r) => `  <url><loc>${esc(abs(r))}</loc><lastmod>${today}</lastmod><changefreq>${r === '/' || r === '/daily-bread' ? 'daily' : 'weekly'}</changefreq></url>`);
  writeFileSync(`${dist}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join('\n')}\n</urlset>\n`);
  appendFileSync(`${dist}/robots.txt`, `\nSitemap: ${SITE_URL}/sitemap.xml\n`);
} else {
  console.warn('Prerender: no VITE_SITE_URL / VERCEL_PROJECT_PRODUCTION_URL, so canonical/og:url and sitemap.xml are skipped.');
}

rmSync(`${root}dist-ssr`, { recursive: true, force: true });
if (failedTotal) console.warn(`Prerender: ${failedTotal} homepage quer${failedTotal === 1 ? 'y' : 'ies'} failed; that content will load in the browser.`);
console.log(`Prerendered ${PUBLIC_ROUTES.length} public routes + spa.html${SITE_URL ? ` + sitemap.xml (${SITE_URL})` : ''}`);
// Open HTTP keep-alive sockets from the build-time fetches must not hold the build.
process.exit(0);
