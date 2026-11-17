import type { ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Loading, LoadError } from '../components/QueryState';

/**
 * Guards staff-only routes:
 * not signed in → /login (then back here); signed in but not staff → "Not authorized".
 * The database enforces the same rule with RLS; this only shapes the UI.
 */
export function RequireStaff({ children }: { children: ReactNode }) {
  const { t } = useTranslation();
  const { status, staffStatus, signOut, retryStaff } = useAuth();
  const location = useLocation();

  if (status === 'loading' || staffStatus === 'loading') {
    return (
      <div className="page-x mx-auto max-w-page pt-24">
        <p className="sr-only">{t('auth.checking')}</p>
        <Loading lines={2} className="max-w-md" />
      </div>
    );
  }
  if (status === 'signedOut') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  if (staffStatus === 'error') {
    return (
      <PageHeader title={t('auth.notAuthorizedTitle')}>
        <LoadError onRetry={retryStaff} />
      </PageHeader>
    );
  }
  if (staffStatus === 'notStaff') {
    return (
      <PageHeader title={t('auth.notAuthorizedTitle')} intro={t('auth.notAuthorized')}>
        <button type="button" className="btn btn--outline" onClick={() => void signOut()}>
          {t('auth.signOut')}
        </button>
      </PageHeader>
    );
  }
  return <>{children}</>;
}
