// Per-route <title>, description and robots rules. Used at runtime
// (PageMeta) and at build time (scripts/prerender.mjs via entry-server).
import type { TFunction } from 'i18next';
import { isIsoDate } from './dates';

export interface RouteMeta {
  title: string;
  description: string;
  noindex: boolean;
}

type DescKey = 'home' | 'dailyBread' | 'announcements' | 'roster' | 'services' | 'baptism' | 'contact' | 'sermons';

const PAGES: Record<string, { nav: string; desc: DescKey }> = {
  '/daily-bread': { nav: 'nav.dailyBread', desc: 'dailyBread' },
  '/pengumuman': { nav: 'nav.announcements', desc: 'announcements' },
  '/jadwal-petugas': { nav: 'nav.roster', desc: 'roster' },
  '/church-services': { nav: 'nav.services', desc: 'services' },
  '/baptisan': { nav: 'nav.baptism', desc: 'baptism' },
  '/contact-us': { nav: 'nav.contact', desc: 'contact' },
  '/sermons': { nav: 'nav.sermons', desc: 'sermons' },
};

/** Public routes with their own pre-rendered HTML file and sitemap entry. */
export const PUBLIC_ROUTES = ['/', ...Object.keys(PAGES)];

export function routeMeta(pathname: string, t: TFunction, formatDate?: (iso: string) => string): RouteMeta {
  const path = pathname.replace(/\/+$/, '') || '/';
  if (path === '/admin' || path.startsWith('/admin/') || path === '/login') {
    const page = path === '/login' ? t('auth.title') : 'Admin';
    return { title: t('meta.pageTitle', { page }), description: t('meta.descriptions.staff'), noindex: true };
  }
  const dated = path.match(/^\/daily-bread\/(\d{4}-\d{2}-\d{2})$/);
  if (dated && isIsoDate(dated[1])) {
    const date = formatDate ? formatDate(dated[1]) : dated[1];
    return {
      title: t('meta.pageTitle', { page: `${t('nav.dailyBread')} · ${date}` }),
      description: t('meta.descriptions.dailyBreadDate', { date }),
      noindex: false,
    };
  }
  // Sermon detail: SermonsPage sets the sermon's own title once it has loaded.
  if (/^\/sermons\/[^/]+$/.test(path)) {
    return { title: t('meta.pageTitle', { page: t('nav.sermons') }), description: t('meta.descriptions.sermons'), noindex: false };
  }
  if (/^\/pengumuman\/[^/]+$/.test(path)) {
    return { title: t('meta.pageTitle', { page: t('nav.announcements') }), description: t('meta.descriptions.announcements'), noindex: false };
  }
  const page = PAGES[path];
  if (page) {
    return { title: t('meta.pageTitle', { page: t(page.nav as 'nav.dailyBread') }), description: t(`meta.descriptions.${page.desc}`), noindex: false };
  }
  return { title: t('meta.title'), description: t('meta.descriptions.home'), noindex: false };
}
