import { USE_MOCK } from '../lib/env';
import { getSupabase, publicFileUrl } from '../lib/supabase';
import { jakartaToday } from '../lib/dates';
import { mockNextWeekly } from './mock';
import { fail, lines, loc } from './map';
import type { WeeklyItemView, WeeklyKind } from './types';

/** The next published item of this kind on or after today (Kediri time). */
export async function getNextWeeklyItem(kind: WeeklyKind): Promise<WeeklyItemView | null> {
  if (USE_MOCK) return mockNextWeekly(kind);
  const { data, error } = await getSupabase()
    .from('weekly_items')
    .select('id, kind, service_date, title_id, title_en, body_id, body_en, file_path')
    .eq('kind', kind)
    .eq('status', 'published')
    .gte('service_date', jakartaToday())
    .order('service_date', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error) fail('getNextWeeklyItem', error);
  if (!data) return null;
  return {
    id: data.id,
    kind: data.kind,
    service_date: data.service_date,
    title: loc(data.title_id, data.title_en),
    lines: lines(data.body_id, data.body_en),
    // Weekly attachments live with the sermon slides (PDF/PPTX).
    file_url: publicFileUrl('sermon-slides', data.file_path),
  };
}
