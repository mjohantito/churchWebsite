import { useEffect, useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { NAV } from '../config/site';
import { useSundayTimes } from '../data/queries';
import { useLocalized } from '../lib/useLocalized';
import { Dialog } from './Dialog';
import { Icon } from './Icon';
import { LanguageToggle } from './LanguageToggle';

export function Wordmark() {
  const { t } = useTranslation();
  return (
    <Link to="/" aria-label={t('a11y.home')} className="wordmark">
      {t('church.wordmark')
        .split(' ')
        .map((line) => (
          <span key={line} className="block">
            {line}
          </span>
        ))}
    </Link>
  );
}

export function Header() {
  const { t } = useTranslation();
  const { times } = useLocalized();
  const sundayTimes = useSundayTimes();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Transparent at the top of the page; paper + hairline once scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className="site-header" data-scrolled={scrolled || undefined}>
      <div className="page-x mx-auto flex h-[76px] max-w-page items-center gap-6 xl:gap-10">
        <Wordmark />

        <nav aria-label={t('a11y.mainNav')} className="hidden xl:block">
          <ul className="flex items-center">
            {NAV.map((item) => (
              <li key={item.path}>
                <NavLink to={item.path} className="nav-link">
                  {t(item.key)}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="ml-auto flex items-center gap-2">
          <LanguageToggle />
          <button
            type="button"
            className="icon-button xl:hidden"
            aria-label={t('a11y.openMenu')}
            aria-haspopup="dialog"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(true)}
          >
            <Icon name="hamburger-menu-linear" className="h-6 w-6" />
          </button>
        </div>
      </div>

      <Dialog open={menuOpen} onClose={() => setMenuOpen(false)} labelledBy="mobile-menu-title" variant="panel">
        <div className="flex min-h-full flex-col px-6 pb-8 pt-5">
          <div className="flex items-center justify-between">
            <h2 id="mobile-menu-title" className="text-xs font-medium uppercase tracking-[0.22em] text-stone-600">
              {t('a11y.menu')}
            </h2>
            <form method="dialog">
              <button type="submit" className="icon-button" aria-label={t('a11y.closeMenu')}>
                <Icon name="close-circle-linear" className="h-7 w-7" />
              </button>
            </form>
          </div>
          <nav aria-label={t('a11y.mainNav')} className="mt-6">
            <ul className="divide-y divide-stone-200 border-y border-stone-200">
              {NAV.map((item) => (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={() => setMenuOpen(false)}
                    className="menu-link"
                  >
                    {t(item.key)}
                    <Icon name="arrow-right-linear" className="h-5 w-5 shrink-0" />
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <div className="mt-auto space-y-5 pt-10">
            <p className="text-sm text-stone-600">
              {t('footer.sunday')} · {times(sundayTimes)}
            </p>
            <LanguageToggle />
          </div>
        </div>
      </Dialog>
    </header>
  );
}
