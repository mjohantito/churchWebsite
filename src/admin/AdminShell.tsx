import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { Icon } from '../components/Icon';
import { Dialog } from '../components/Dialog';
import { LanguageToggle } from '../components/LanguageToggle';
import { useInboxSummary } from '../data/admin/hooks';

type Item = { to: string; key: string; icon: string; adminOnly?: boolean; end?: boolean };
export const NAV_ITEMS: Item[] = [
  { to: '/admin', key: 'dashboard', icon: 'global-linear', end: true },
  { to: '/admin/inbox', key: 'inbox', icon: 'letter-linear' },
  { to: '/admin/daily-bread', key: 'dailyBread', icon: 'book-2-linear' },
  { to: '/admin/sermons', key: 'sermons', icon: 'play-circle-linear' },
  { to: '/admin/weekly', key: 'weekly', icon: 'calendar-linear' },
  { to: '/admin/announcements', key: 'announcements', icon: 'document-text-linear' },
  { to: '/admin/services', key: 'services', icon: 'clock-circle-linear' },
  { to: '/admin/roster', key: 'roster', icon: 'users-group-rounded-linear' },
  { to: '/admin/groups', key: 'groups', icon: 'map-point-linear', adminOnly: true },
  { to: '/admin/staff', key: 'staff', icon: 'user-plus-rounded-linear', adminOnly: true },
];

function NavList({ onNavigate }: { onNavigate?: () => void }) {
  const { t } = useTranslation();
  const { staff } = useAuth();
  const summary = useInboxSummary();
  const newCount = Object.values(summary.data?.counts ?? {}).reduce((a, b) => a + (b ?? 0), 0);
  return (
    <ul className="space-y-1">
      {NAV_ITEMS.filter((i) => !i.adminOnly || staff?.role === 'admin').map((i) => (
        <li key={i.to}>
          <NavLink to={i.to} end={i.end} className="admin-nav-link" onClick={onNavigate}>
            <Icon name={i.icon} className="h-5 w-5 shrink-0" />
            <span className="flex-1">{t(`admin.nav.${i.key as 'inbox'}`)}</span>
            {i.key === 'inbox' && newCount > 0 && (
              <span className="count-pill">
                {newCount}
                <span className="sr-only"> {t('admin.inbox.statuses.new')}</span>
              </span>
            )}
          </NavLink>
        </li>
      ))}
    </ul>
  );
}

function Account() {
  const { t } = useTranslation();
  const { staff, signOut } = useAuth();
  return (
    <div className="space-y-3 border-t border-stone-200 pt-4">
      {staff && (
        <p className="text-sm">
          <span className="block font-bold">{staff.full_name}</span>
          <span className="text-stone-600">{t(`admin.roles.${staff.role}`)}</span>
        </p>
      )}
      <LanguageToggle />
      <div className="flex flex-col gap-1">
        <Link to="/" className="admin-nav-link">
          <Icon name="arrow-right-up-linear" className="h-5 w-5" />
          {t('admin.viewSite')}
        </Link>
        <button type="button" className="admin-nav-link" onClick={() => void signOut()}>
          <Icon name="close-circle-linear" className="h-5 w-5" />
          {t('auth.signOut')}
        </button>
      </div>
    </div>
  );
}

/** Calm admin frame: sidebar on wide screens, top bar + drawer on phones. */
export function AdminShell({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();
  const main = useRef<HTMLElement>(null);

  // Move focus to the page title after navigation (screen readers hear the new page).
  useEffect(() => {
    window.scrollTo(0, 0);
    const h = requestAnimationFrame(() => document.getElementById('admin-page-title')?.focus({ preventScroll: true }));
    return () => cancelAnimationFrame(h);
  }, [pathname]);

  return (
    <div className="admin">
      <a href="#admin-main" className="skip-link" onClick={(e) => { e.preventDefault(); main.current?.focus(); }}>{t('a11y.skip')}</a>

      <header className="admin-topbar lg:hidden">
        <Link to="/admin" className="font-display text-lg">{t('admin.brand')}</Link>
        <button type="button" className="icon-button" aria-label={t('admin.openMenu')} aria-haspopup="dialog" aria-expanded={open} onClick={() => setOpen(true)}>
          <Icon name="hamburger-menu-linear" className="h-6 w-6" />
        </button>
      </header>

      <aside className="admin-sidebar hidden lg:flex" aria-label={t('admin.menu')}>
        <Link to="/admin" className="font-display text-xl">{t('admin.brand')}</Link>
        <nav aria-label={t('admin.menu')} className="mt-8 flex-1"><NavList /></nav>
        <Account />
      </aside>

      <Dialog open={open} onClose={() => setOpen(false)} labelledBy="admin-menu-title" variant="panel">
        <div className="flex min-h-full flex-col gap-6 px-5 pb-6 pt-5">
          <div className="flex items-center justify-between">
            <h2 id="admin-menu-title" className="font-display text-lg">{t('admin.brand')}</h2>
            <form method="dialog">
              <button type="submit" className="icon-button" aria-label={t('admin.closeMenu')}>
                <Icon name="close-circle-linear" className="h-7 w-7" />
              </button>
            </form>
          </div>
          <nav aria-label={t('admin.menu')} className="flex-1"><NavList onNavigate={() => setOpen(false)} /></nav>
          <Account />
        </div>
      </Dialog>

      <main id="admin-main" ref={main} tabIndex={-1} className="admin-main outline-none">{children}</main>
    </div>
  );
}
