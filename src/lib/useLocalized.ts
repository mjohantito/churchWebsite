import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import type { Localized } from '../data/types';
import { isLang } from '../i18n';
import { formatServiceTime, formatTime, formatTimes } from '../data/churchInfo';

/** Picks the current language from bilingual { id, en } values; English falls back to Indonesian. */
export function useLocalized() {
  const { i18n } = useTranslation();
  const lang = isLang(i18n.resolvedLanguage) ? i18n.resolvedLanguage : 'id';
  const pick = useCallback((value: Localized) => (lang === 'en' && value.en ? value.en : value.id), [lang]);
  const formatDate = useCallback(
    (iso: string) =>
      new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'Asia/Jakarta',
      }).format(new Date(`${iso}T12:00:00+07:00`)),
    [lang],
  );
  const time = useCallback((t: string) => formatTime(t, lang), [lang]);
  const times = useCallback((list: readonly { day: number; time: string }[]) => formatTimes(list, lang), [lang]);
  const serviceTime = useCallback((t: { day: number; time: string }) => formatServiceTime(t, lang), [lang]);
  return { lang, pick, formatDate, time, times, serviceTime };
}

