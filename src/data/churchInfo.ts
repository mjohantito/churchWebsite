// Church facts that are not edited in the admin page (address, scripture
// reference), the time formatting helpers, and an OFFLINE FALLBACK copy of
// the services. Service times are managed in the admin (/admin/services) and
// read from the database; FALLBACK_SERVICES is only shown while they load or
// if the request fails, so the footer and hero are never blank.
import type { Localized, ServiceView } from './types';
import type { Lang } from '../i18n';

export const CHURCH_INFO = {
  name: 'Setia Bakti Baptist Church',
  timeZoneLabel: 'WIB',
  address: 'Jl. Letjend Suprapto No.12, Burengan, Kec. Pesantren, Kota Kediri, Jawa Timur 64131',
  /** Verse text is translated, so it lives in i18n (`scripture.text`); the reference lives here. */
  scriptureReference: { id: 'Roma 15:7', en: 'Romans 15:7' } satisfies Localized,
} as const;

export const MAPS_URL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(CHURCH_INFO.address)}`;

/** Offline fallback only: mirrors the seeded services (migration 20261118090000). */
export const FALLBACK_SERVICES: ServiceView[] = [
  {
    id: 'fallback-sunday', kind: 'sunday', name: { id: 'Ibadah Minggu', en: 'Sunday Service' }, description: null,
    show_on_homepage: true, weekly_kind: 'sunday_material',
    cta: { type: 'link', label: { id: 'Materi khotbah', en: 'Sermon materials' }, url: '/sermons' },
    times: [
      { day: 0, time: '08:15', label: { id: 'Ibadah pagi', en: 'Morning service' } },
      { day: 0, time: '18:15', label: { id: 'Ibadah sore', en: 'Evening service' } },
    ],
  },
  {
    id: 'fallback-prayer', kind: 'other', name: { id: 'Doa Rabu Malam', en: 'Wednesday Night Prayer' }, description: null,
    show_on_homepage: true, weekly_kind: 'prayer_list', cta: { type: 'none', label: null, url: null },
    times: [{ day: 3, time: '18:15', label: null }],
  },
  {
    id: 'fallback-choir', kind: 'other', name: { id: 'Paduan Suara', en: 'Choir' },
    description: {
      id: 'Suka bernyanyi? Bergabunglah melayani lewat pujian. Tidak perlu pengalaman, cukup kerinduan untuk memuji Tuhan bersama.',
      en: 'Love to sing? Join us in serving through worship. No experience needed, just a heart to praise God together.',
    },
    show_on_homepage: true, weekly_kind: null,
    cta: { type: 'form_choir', label: { id: 'Gabung paduan suara', en: 'Join the choir' }, url: null },
    times: [],
  },
];

/** ID: "08.15 WIB" · EN: "8:15 AM WIB" */
export function formatTime(time: string, lang: Lang): string {
  const [h, m] = time.split(':').map(Number);
  const mm = String(m).padStart(2, '0');
  if (lang === 'id') return `${String(h).padStart(2, '0')}.${mm} ${CHURCH_INFO.timeZoneLabel}`;
  const suffix = h < 12 ? 'AM' : 'PM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm} ${suffix} ${CHURCH_INFO.timeZoneLabel}`;
}

/** Day name, 0 = Sunday. ID "Rabu" · EN "Wednesday" */
export function dayName(day: number, lang: Lang, width: 'long' | 'short' = 'long'): string {
  // 2026-11-15 is a Sunday.
  return new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: width, timeZone: 'UTC' })
    .format(new Date(Date.UTC(2026, 10, 15 + day)));
}

/** "08.15 WIB" on Sunday, "Rabu 18.15 WIB" / "Wednesday 6:15 PM WIB" on other days. */
export function formatServiceTime(t: { day: number; time: string }, lang: Lang): string {
  return t.day === 0 ? formatTime(t.time, lang) : `${dayName(t.day, lang)} ${formatTime(t.time, lang)}`;
}

/** ID: "08.15 WIB dan 18.15 WIB" · EN: "8:15 AM WIB and 6:15 PM WIB" */
export function formatTimes(times: readonly { day: number; time: string }[], lang: Lang): string {
  const parts = times.map((t) => formatServiceTime(t, lang));
  return new Intl.ListFormat(lang === 'id' ? 'id-ID' : 'en-GB', { style: 'long', type: 'conjunction' }).format(parts);
}
