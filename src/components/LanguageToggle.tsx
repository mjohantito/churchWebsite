import { useTranslation } from 'react-i18next';
import { LANGS, setLanguage } from '../i18n';

export function LanguageToggle({ className = '' }: { className?: string }) {
  const { t, i18n } = useTranslation();
  const current = i18n.resolvedLanguage ?? i18n.language;
  return (
    <div role="group" aria-label={t('a11y.language')} className={`lang-toggle ${className}`}>
      {LANGS.map((lang) => (
        <button
          key={lang}
          type="button"
          lang={lang}
          aria-pressed={current === lang}
          aria-label={t(lang === 'id' ? 'lang.idLong' : 'lang.enLong')}
          onClick={() => setLanguage(lang)}
          className="lang-toggle__btn"
        >
          {t(`lang.${lang}`)}
        </button>
      ))}
    </div>
  );
}
