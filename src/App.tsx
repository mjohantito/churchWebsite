import { useEffect, useRef } from 'react';
import { Route, Routes } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { FormDialogProvider } from './components/forms/FormDialog';
import { SmoothScrollProvider, ScrollTrigger } from './lib/motion';
import { syncDocumentLanguage } from './i18n';
import { STUB_ROUTES } from './config/site';
import { Home } from './pages/Home';
import { ComingSoon } from './pages/ComingSoon';

export function App() {
  const { t, i18n } = useTranslation();
  const main = useRef<HTMLElement>(null);

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
          <Routes>
            <Route path="/" element={<Home />} />
            {STUB_ROUTES.map((r) => (
              <Route key={r.path} path={r.path} element={<ComingSoon titleKey={r.key} />} />
            ))}
            <Route path="*" element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </FormDialogProvider>
    </SmoothScrollProvider>
  );
}
