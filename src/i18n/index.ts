import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import id from './id';
import en from './en';

export const LANGS = ['id', 'en'] as const;
export type Lang = (typeof LANGS)[number];
export const DEFAULT_LANG: Lang = 'id';
const STORAGE_KEY = 'sb-lang';

export function isLang(value: unknown): value is Lang {
  return typeof value === 'string' && (LANGS as readonly string[]).includes(value);
}

export function readStoredLang(): Lang | null {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return isLang(value) ? value : null;
  } catch {
    return null;
  }
}

function storeLang(lang: Lang) {
  try {
    window.localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    /* storage unavailable (private mode): the toggle still works for this visit */
  }
}

export function initI18n(lng: Lang = DEFAULT_LANG) {
  if (!i18n.isInitialized) {
    void i18n.use(initReactI18next).init({
      resources: { id: { translation: id }, en: { translation: en } },
      lng,
      fallbackLng: DEFAULT_LANG,
      supportedLngs: LANGS,
      interpolation: { escapeValue: false },
      initAsync: false,
      returnNull: false,
      returnEmptyString: true,
    });
  }
  return i18n;
}

export function setLanguage(lang: Lang) {
  void i18n.changeLanguage(lang);
  storeLang(lang);
}

export function syncDocumentLanguage(lang: string) {
  if (typeof document === 'undefined') return;
  document.documentElement.lang = lang;
}

export default i18n;
