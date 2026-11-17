import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV } from '../config/site';
import { CHURCH_INFO, MAPS_URL } from '../data/churchInfo';
import { useLocalized } from '../lib/useLocalized';
import { Icon } from './Icon';
import { LanguageToggle } from './LanguageToggle';

export function Footer() {
  const { t } = useTranslation();
  const { times } = useLocalized();
  const year = new Date().getFullYear();

  return (
    <footer className="mt-28 border-t border-ink bg-ink text-paper sm:mt-36">
      <div className="page-x mx-auto max-w-page pb-10 pt-16 sm:pt-20">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="font-display text-[2.6rem] sm:text-[3.4rem]">
              {t('church.wordmark')}
            </p>
            <p className="mt-3 font-script text-3xl text-[color:var(--accent-on-ink)]">{t('footer.tagline')}</p>
          </div>

          <nav aria-label={t('a11y.footerNav')} className="lg:col-span-3">
            <h2 className="footer-heading">{t('footer.pages')}</h2>
            <ul className="mt-4 space-y-1">
              {NAV.map((item) => (
                <li key={item.path}>
                  <Link to={item.path} className="footer-link">
                    {t(item.key)}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-2">
            <h2 className="footer-heading">{t('footer.times')}</h2>
            <dl className="mt-4 space-y-4 text-paper/85">
              <div>
                <dt className="font-medium text-paper">{t('footer.sunday')}</dt>
                <dd>{times(CHURCH_INFO.services.sunday)}</dd>
              </div>
              <div>
                <dt className="font-medium text-paper">{t('footer.prayer')}</dt>
                <dd>{times(CHURCH_INFO.services.wednesdayPrayer)}</dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-3">
            <h2 className="footer-heading">{t('footer.visit')}</h2>
            <address className="mt-4 not-italic leading-relaxed text-paper/85">{CHURCH_INFO.address}</address>
            <a href={MAPS_URL} target="_blank" rel="noopener noreferrer" className="footer-link mt-3 inline-flex items-center gap-2">
              <Icon name="map-point-linear" className="h-5 w-5" />
              {t('footer.maps')}
              <span className="sr-only">{t('a11y.opensNewTab')}</span>
              <Icon name="arrow-right-up-linear" className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-paper/20 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-paper/70">{t('footer.copyright', { year })}</p>
          <div className="flex items-center gap-3">
            <span className="text-sm text-paper/70" aria-hidden="true">
              {t('footer.language')}
            </span>
            <LanguageToggle className="lang-toggle--on-ink" />
          </div>
        </div>
      </div>
    </footer>
  );
}
