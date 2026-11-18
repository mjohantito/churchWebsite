import { USE_MOCK } from '../lib/env';
import { getSupabase, publicFileUrl } from '../lib/supabase';
import { jakartaToday } from '../lib/dates';
import { mockDailyBread } from './mock';
import { fail, loc } from './map';
import type { DailyBreadSummary, DailyBreadView } from './types';

const COLUMNS = 'id, entry_date, title_id, title_en, scripture_ref, body_id, body_en, audio_path';

type Row = {
  id: string; entry_date: string; title_id: string; title_en: string | null;
  scripture_ref: string | null; body_id: string; body_en: string | null; audio_path: string | null;
};

function toView(r: Row): DailyBreadView {
  return {
    id: r.id,
    entry_date: r.entry_date,
    title: loc(r.title_id, r.title_en),
    scripture_ref: r.scripture_ref,
    body: loc(r.body_id, r.body_en),
    audio_url: publicFileUrl('daily-bread-audio', r.audio_path),
  };
}

/** Today's entry, or the latest earlier one if today's is not posted yet. */
export async function getCurrentDailyBread(): Promise<DailyBreadView | null> {
  const today = jakartaToday();
  if (USE_MOCK) return mockDailyBread().find((d) => d.entry_date <= today) ?? null;
  const { data, error } = await getSupabase()
    .from('daily_bread')
    .select(COLUMNS)
    .eq('status', 'published')
    .lte('entry_date', today)
    .order('entry_date', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('getCurrentDailyBread', error);
  return data ? toView(data) : null;
}

/** The entry for one date (published only). */
export async function getDailyBreadByDate(date: string): Promise<DailyBreadView | null> {
  if (USE_MOCK) return mockDailyBread().find((d) => d.entry_date === date) ?? null;
  const { data, error } = await getSupabase()
    .from('daily_bread')
    .select(COLUMNS)
    .eq('status', 'published')
    .eq('entry_date', date)
    .maybeSingle();
  if (error) fail('getDailyBreadByDate', error);
  return data ? toView(data) : null;
}

/** Archive: newest first, up to today. */
export async function listDailyBread(limit = 60): Promise<DailyBreadSummary[]> {
  const today = jakartaToday();
  if (USE_MOCK) return mockDailyBread().filter((d) => d.entry_date <= today).map(({ entry_date, title }) => ({ entry_date, title }));
  const { data, error } = await getSupabase()
    .from('daily_bread')
    .select('entry_date, title_id, title_en')
    .eq('status', 'published')
    .lte('entry_date', today)
    .order('entry_date', { ascending: false })
    .limit(limit);
  if (error) fail('listDailyBread', error);
  return (data ?? []).map((r) => ({ entry_date: r.entry_date, title: loc(r.title_id, r.title_en) }));
}

/**
 * Calendar: only the dates of published entries up to today (Asia/Jakarta),
 * newest first. A small list of strings; no titles or bodies.
 * PostgREST caps a response at 1000 rows (~2.7 years of daily entries).
 */
export async function listDailyBreadDates(): Promise<string[]> {
  const today = jakartaToday();
  if (USE_MOCK) return mockDailyBread().map((d) => d.entry_date).filter((d) => d <= today);
  const { data, error } = await getSupabase()
    .from('daily_bread')
    .select('entry_date')
    .eq('status', 'published')
    .lte('entry_date', today)
    .order('entry_date', { ascending: false })
    .limit(1000);
  if (error) fail('listDailyBreadDates', error);
  return (data ?? []).map((r) => r.entry_date);
}
