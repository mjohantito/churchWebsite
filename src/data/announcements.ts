import { USE_MOCK } from '../lib/env';
import { getSupabase, publicFileUrl } from '../lib/supabase';
import { mockAnnouncements, mockGroups } from './mock';
import { fail, loc } from './map';
import type { AnnouncementView, GroupView } from './types';

/** Active groups, in staff-defined order. */
export async function listGroups(): Promise<GroupView[]> {
  if (USE_MOCK) return mockGroups;
  const { data, error } = await getSupabase()
    .from('groups')
    .select('id, slug, name')
    .eq('active', true)
    .order('sort_order', { ascending: true })
    .order('name', { ascending: true });
  if (error) fail('listGroups', error);
  return data ?? [];
}

const COLUMNS = 'id, group_id, title_id, title_en, body_id, body_en, image_path, published_at, week_start';

type Row = {
  id: string; group_id: string; title_id: string; title_en: string | null; body_id: string; body_en: string | null;
  image_path: string | null; published_at: string | null; week_start: string;
};

function toView(r: Row, byId: Map<string, GroupView>): AnnouncementView {
  return {
    id: r.id,
    group: byId.get(r.group_id) ?? null,
    title: loc(r.title_id, r.title_en),
    body: loc(r.body_id, r.body_en),
    image_url: publicFileUrl('announcement-images', r.image_path),
    published_at: r.published_at ?? new Date(0).toISOString(),
    week_start: r.week_start,
  };
}

/**
 * Week navigator bounds: the distinct week-start Sundays (YYYY-MM-DD) that have at
 * least one published announcement, oldest first. Includes future weeks
 * as soon as something is published for them.
 */
export async function listAnnouncementWeeks(): Promise<string[]> {
  if (USE_MOCK) return [...new Set(mockAnnouncements().map((a) => a.week_start))].sort();
  const { data, error } = await getSupabase().rpc('announcement_weeks');
  if (error) fail('listAnnouncementWeeks', error);
  return data ?? [];
}

/**
 * One week's published announcements (active groups only), in staff order:
 * sort_order, then creation time. Group filtering happens on the page.
 */
export async function listAnnouncementsForWeek(weekStart: string): Promise<AnnouncementView[]> {
  if (USE_MOCK) return mockAnnouncements().filter((a) => a.week_start === weekStart);
  const groups = await listGroups();
  const byId = new Map(groups.map((g) => [g.id, g]));
  if (groups.length === 0) return [];
  const { data, error } = await getSupabase()
    .from('announcements')
    .select(COLUMNS)
    .eq('status', 'published')
    .eq('week_start', weekStart)
    .in('group_id', groups.map((g) => g.id))
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true });
  if (error) fail('listAnnouncementsForWeek', error);
  return (data ?? []).map((r) => toView(r, byId));
}

/** One published announcement (detail route / direct links). */
export async function getAnnouncement(id: string): Promise<AnnouncementView | null> {
  if (USE_MOCK) return mockAnnouncements().find((a) => a.id === id) ?? null;
  if (!/^[0-9a-f-]{36}$/i.test(id)) return null;
  const groups = await listGroups();
  const byId = new Map(groups.map((g) => [g.id, g]));
  const { data, error } = await getSupabase()
    .from('announcements')
    .select(COLUMNS)
    .eq('status', 'published')
    .eq('id', id)
    .maybeSingle();
  if (error) fail('getAnnouncement', error);
  return data && byId.has(data.group_id) ? toView(data, byId) : null;
}
