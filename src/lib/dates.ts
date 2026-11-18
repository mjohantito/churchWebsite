// Dates are plain 'YYYY-MM-DD' strings in church local time (Asia/Jakarta).

// Weeks for Daily Bread and Pengumuman (Sunday to Saturday) live in ./week.
import { jakartaDate } from './week';

/** Today's date in Kediri, as YYYY-MM-DD. */
export function jakartaToday(now = new Date()): string {
  return jakartaDate(now);
}

export function isIsoDate(value: string | undefined | null): value is string {
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

export function addDays(iso: string, days: number): string {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Monday of the week containing `iso`. Duty roster only (its weeks start on Monday). */
export function mondayOf(iso: string): string {
  const dow = new Date(`${iso}T00:00:00Z`).getUTCDay(); // 0 = Sunday
  return addDays(iso, -((dow + 6) % 7));
}
