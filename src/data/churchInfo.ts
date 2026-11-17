// SINGLE SOURCE OF TRUTH for church facts shown across the site.
// Service times, address and the hero scripture reference live here only.
// Every component reads from this file; never hardcode a time elsewhere.
import type { Localized } from './types';
import type { Lang } from '../i18n';

/** 24-hour "HH:MM" in Western Indonesia Time (WIB). Formatted per language by formatTime(). */
type Time24 = `${number}:${number}`;

export const CHURCH_INFO = {
  name: 'Setia Bakti Baptist Church',
  timeZoneLabel: 'WIB',
  services: {
    sunday: ['08:15', '18:15'] as Time24[],
    wednesdayPrayer: ['18:15'] as Time24[],
  },
  address: 'Jl. Letjend Suprapto No.12, Burengan, Kec. Pesantren, Kota Kediri, Jawa Timur 64131',
  /** Verse text is translated, so it lives in i18n (`scripture.text`); the reference lives here. */
  scriptureReference: { id: 'Roma 15:7', en: 'Romans 15:7' } satisfies Localized,
} as const;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHURCH_INFO.address)}`;

/** ID: "08.15 WIB" · EN: "8:15 AM WIB" */
export function formatTime(time: string, lang: Lang): string {
  const [h, m] = time.split(':').map(Number);
  const mm = String(m).padStart(2, '0');
  if (lang === 'id') return `${String(h).padStart(2, '0')}.${mm} ${CHURCH_INFO.timeZoneLabel}`;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix} ${CHURCH_INFO.timeZoneLabel}`;
}

/** ID: "08.15 WIB dan 18.15 WIB" · EN: "8:15 AM WIB and 6:15 PM WIB" */
export function formatTimes(times: readonly string[], lang: Lang): string {
  const parts = times.map((t) => formatTime(t, lang));
  return new Intl.ListFormat(lang === 'id' ? 'id-ID' : 'en-GB', { style: 'long', type: 'conjunction' }).format(parts);
}
