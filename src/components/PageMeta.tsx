import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { routeMeta } from '../lib/seo';
import { useLocalized } from '../lib/useLocalized';

function setMeta(selector: string, attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = content;
}

/**
 * Keeps <title>, description and Open Graph text in step with the route and
 * the selected language. (The build writes the same tags into each public
 * page's HTML for crawlers that do not run JavaScript.)
 */
export function PageMeta() {
  const { t, i18n } = useTranslation();
  const { pathname } = useLocation();
  const { formatDate } = useLocalized();
  useEffect(() => {
    const m = routeMeta(pathname, t, formatDate);
    document.title = m.title;
    setMeta('meta[name="description"]', 'name', 'description', m.description);
    setMeta('meta[property="og:title"]', 'property', 'og:title', m.title);
    setMeta('meta[property="og:description"]', 'property', 'og:description', m.description);
    setMeta('meta[property="og:locale"]', 'property', 'og:locale', i18n.resolvedLanguage === 'en' ? 'en_US' : 'id_ID');
  }, [pathname, t, i18n.resolvedLanguage, formatDate]);
  return null;
}
