import { lazy, Suspense, useEffect, useRef } from 'react';
import { Route, Routes, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FormDialogProvider } from './components/forms/FormDialog';
import { SmoothScrollProvider, ScrollTrigger } from './lib/motion';
import { syncDocumentLanguage } from './i18n';
import { STUB_ROUTES } from './config/site';
import { Home } from './pages/Home';
import { ComingSoon } from './pages/ComingSoon';
import { Loading } from './components/QueryState';
import { AuthProvider } from './auth/AuthContext';
import { PageMeta } from './components/PageMeta';

// Pages other than the homepage load on demand (smaller first download).
const DailyBreadPage = lazy(() => import('./pages/DailyBreadPage').then((m) => ({ default: m.DailyBreadPage })));
const AnnouncementsPage = lazy(() => import('./pages/AnnouncementsPage').then((m) => ({ default: m.AnnouncementsPage })));
const RosterPage = lazy(() => import('./pages/RosterPage').then((m) => ({ default: m.RosterPage })));
const LoginPage = lazy(() => import('./pages/LoginPage').then((m) => ({ default: m.LoginPage })));
// The whole staff admin area is one separate chunk: it never grows the public bundle.
const AdminApp = lazy(() => import('./admin/AdminApp'));

const pageFallback = (
  <div className="page-x mx-auto max-w-page pt-24">
    <Loading lines={3} className="max-w-xl" />
  </div>
);

export function App() {
  const { i18n } = useTranslation();
  const { pathname } = useLocation();
  const inAdmin = pathname === '/admin' || pathname.startsWith('/admin/');

  useEffect(() => {
    syncDocumentLanguage(i18n.language);
    const onChange = (lng: string) => {
      syncDocumentLanguage(lng);
      // Text length differs between languages: re-measure scroll triggers.
      requestAnimationFrame(() => ScrollTrigger.refresh());
    };
    i18n.on('languageChanged', onChange);
    return () => i18n.off('languageChanged', onChange);
  }, [i18n]);

  return (
    <AuthProvider>
      <PageMeta />
      {inAdmin ? (
        // Staff admin: its own calm shell. No Lenis, no scroll animations, no public chrome.
        <Suspense fallback={pageFallback}>
          <AdminApp />
        </Suspense>
      ) : (
        <PublicSite />
      )}
    </AuthProvider>
  );
}

function PublicSite() {
  const { t } = useTranslation();
  const main = useRef<HTMLElement>(null);
  return (
    <SmoothScrollProvider>
      <FormDialogProvider>
        <a
          href="#main"
          className="skip-link"
          onClick={(e) => {
            e.preventDefault();
            main.current?.focus();
            main.current?.scrollIntoView();
          }}
        >
          {t('a11y.skip')}
        </a>
        <Header />
        <main id="main" ref={main} tabIndex={-1} className="outline-none">
          <Suspense fallback={pageFallback}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/daily-bread" element={<DailyBreadPage />} />
              <Route path="/daily-bread/:date" element={<DailyBreadPage />} />
              <Route path="/pengumuman" element={<AnnouncementsPage />} />
              <Route path="/jadwal-petugas" element={<RosterPage />} />
              {/* Staff only. Not linked from the public navigation. */}
              <Route path="/login" element={<LoginPage />} />
              {STUB_ROUTES.map((r) => (
                <Route key={r.path} path={r.path} element={<ComingSoon titleKey={r.key} />} />
              ))}
              <Route path="*" element={<Home />} />
            </Routes>
          </Suspense>
        </main>
        <Footer />
      </FormDialogProvider>
    </SmoothScrollProvider>
  );
}
