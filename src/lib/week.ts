// Weeks for Daily Bread and Pengumuman: SUNDAY to SATURDAY, in church local
// time (Asia/Jakarta). One shared definition; use these helpers everywhere
// instead of repeating the logic. (The duty roster keeps its own Monday weeks:
// mondayOf in ./dates.)
//
// Dates are plain 'YYYY-MM-DD' strings meaning a calendar day in Jakarta.
// This file has no imports so `node --test` can load it directly
// (tests: scripts/week.test.mjs, `npm test`).

export const WEEK_TIME_ZONE = 'Asia/Jakarta';

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/** Calendar date in Jakarta for an instant, as YYYY-MM-DD. */
export function jakartaDate(instant: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: WEEK_TIME_ZONE, year: 'numeric', month: '2-digit', day: '2-digit' }).format(instant);
}

/** Adds whole days to a YYYY-MM-DD date. */
export function shiftDays(iso: string, days: number): string {
  const d = utc(iso);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/**
 * The Sunday on or before a date (the start of its week).
 * Accepts 'YYYY-MM-DD' (already a Jakarta calendar day) or a Date (an
 * instant, converted to its Jakarta calendar day first).
 */
export function getWeekStart(date: string | Date = new Date()): string {
  const iso = typeof date === 'string' ? date : jakartaDate(date);
  if (!ISO.test(iso)) throw new Error(`getWeekStart: expected YYYY-MM-DD, got "${iso}"`);
  return shiftDays(iso, -utc(iso).getUTCDay()); // getUTCDay: 0 = Sunday
}

/** The Saturday that ends the week starting on `weekStart`. */
export function getWeekEnd(weekStart: string): string {
  return shiftDays(weekStart, 6);
}

/** The week start `n` weeks later (negative: earlier). */
export function addWeeks(weekStart: string, n: number): string {
  return shiftDays(weekStart, 7 * n);
}

/** The seven dates of a week, Sunday first. */
export function weekDays(weekStart: string): string[] {
  return Array.from({ length: 7 }, (_, i) => shiftDays(weekStart, i));
}

/** True when the date is a Sunday (a valid week_start). */
export function isWeekStart(iso: string): boolean {
  return ISO.test(iso) && utc(iso).getUTCDay() === 0;
}

/** This week's Sunday in Jakarta. */
export function currentWeekStart(now: Date = new Date()): string {
  return getWeekStart(jakartaDate(now));
}

/**
 * "15–21 Nov 2026", "29 Nov – 5 Des 2026", "27 Des 2026 – 2 Jan 2027"
 * (Sunday to Saturday; ID or EN month names).
 */
export function formatWeekRange(weekStart: string, lang: 'id' | 'en'): string {
  const f = new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  // Some ICU versions put thin / narrow no-break spaces around the dash.
  return f.formatRange(utc(weekStart), utc(getWeekEnd(weekStart))).replace(/[\u2009\u202f]/g, ' ');
}
