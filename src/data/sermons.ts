import { USE_MOCK } from '../lib/env';
import { getSupabase, publicFileUrl } from '../lib/supabase';
import { mockLatestSermon } from './mock';
import { fail, loc } from './map';
import type { SermonView } from './types';

/** Most recent published sermon, or null if none yet. */
export async function getLatestSermon(): Promise<SermonView | null> {
  if (USE_MOCK) return mockLatestSermon();
  const { data, error } = await getSupabase()
    .from('sermons')
    .select('id, title_id, title_en, preacher, preached_on, scripture_ref, youtube_id, summary_id, summary_en, slides_path')
    .eq('status', 'published')
    .order('preached_on', { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) fail('getLatestSermon', error);
  if (!data) return null;
  return {
    id: data.id,
    title: loc(data.title_id, data.title_en),
    preached_on: data.preached_on,
    preacher_name: data.preacher,
    scripture_ref: data.scripture_ref ? { id: data.scripture_ref } : null,
    summary: data.summary_id ? loc(data.summary_id, data.summary_en) : null,
    youtube_video_id: data.youtube_id,
    slides_url: publicFileUrl('sermon-slides', data.slides_path),
  };
}
