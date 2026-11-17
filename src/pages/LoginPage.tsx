import { useEffect, useId, useState, type FormEvent } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../auth/AuthContext';
import { PageHeader } from '../components/PageHeader';
import { Icon } from '../components/Icon';
import { useNoIndex } from '../lib/useNoIndex';

export function LoginPage() {
  const { t } = useTranslation();
  const { status, staffStatus, signIn, available } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from ?? '/admin';
  const uid = useId();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useNoIndex();

  useEffect(() => {
    if (!available) setError(t('auth.unavailable'));
  }, [available, t]);

  if (status === 'signedIn' && staffStatus === 'staff') return <Navigate to={from} replace />;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError(null);
    const result = await signIn(email, password);
    setBusy(false);
    if (result.ok) navigate(from, { replace: true });
    else setError(t(`auth.${result.reason}`));
  };

  return (
    <PageHeader title={t('auth.title')} intro={t('auth.intro')}>
      <form onSubmit={onSubmit} className="max-w-sm space-y-5" aria-busy={busy}>
        {error && (
          <p className="form-alert" role="alert">
            <Icon name="danger-circle-linear" className="h-5 w-5 shrink-0" />
            {error}
          </p>
        )}
        <div>
          <label htmlFor={`${uid}-email`} className="field-label">
            {t('auth.email')}
          </label>
          <input id={`${uid}-email`} type="email" autoComplete="username" required value={email}
            onChange={(e) => setEmail(e.target.value)} className="field-control" />
        </div>
        <div>
          <label htmlFor={`${uid}-password`} className="field-label">
            {t('auth.password')}
          </label>
          <input id={`${uid}-password`} type="password" autoComplete="current-password" required value={password}
            onChange={(e) => setPassword(e.target.value)} className="field-control" />
        </div>
        <button type="submit" className="btn btn--solid" aria-disabled={busy || !available || undefined}>
          {busy ? (
            <>
              <span className="spinner" aria-hidden="true" />
              {t('auth.submitting')}
            </>
          ) : (
            t('auth.submit')
          )}
        </button>
      </form>
    </PageHeader>
  );
}
