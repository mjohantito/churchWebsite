import type { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';

/** Calm placeholder while data loads (announced politely to screen readers). */
export function Loading({ lines = 3, className = '' }: { lines?: number; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={`space-y-3 ${className}`} role="status" aria-live="polite">
      <span className="sr-only">{t('states.loading')}</span>
      {Array.from({ length: lines }, (_, i) => (
        <span key={i} aria-hidden="true" className="skeleton block h-4" style={{ width: `${92 - i * 14}%` }} />
      ))}
    </div>
  );
}

export function LoadError({ onRetry, className = '' }: { onRetry?: () => void; className?: string }) {
  const { t } = useTranslation();
  return (
    <div className={`flex flex-col items-start gap-3 ${className}`} role="alert">
      <p className="flex items-start gap-2 text-stone-700">
        <Icon name="danger-circle-linear" className="mt-0.5 h-5 w-5 shrink-0" />
        {t('states.error')}
      </p>
      {onRetry && (
        <button type="button" className="text-link" onClick={onRetry}>
          <Icon name="refresh-linear" className="h-4 w-4" />
          {t('states.retry')}
        </button>
      )}
    </div>
  );
}

export function Empty({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`text-stone-600 ${className}`}>{children}</p>;
}
