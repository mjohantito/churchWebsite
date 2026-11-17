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

/** Published announcements, newest first, optionally for one group (by slug). */
export async function listAnnouncements(groupSlug?: string | null, limit = 50): Promise<AnnouncementView[]> {
  if (USE_MOCK) {
    const all = mockAnnouncements();
    return groupSlug ? all.filter((a) => a.group?.slug === groupSlug) : all;
  }
  const groups = await listGroups();
  const byId = new Map(groups.map((g) => [g.id, g]));
  const ids = groupSlug ? groups.filter((g) => g.slug === groupSlug).map((g) => g.id) : groups.map((g) => g.id);
  if (ids.length === 0) return [];

  const { data, error } = await getSupabase()
    .from('announcements')
    .select('id, group_id, title_id, title_en, body_id, body_en, image_path, published_at')
    .eq('status', 'published')
    .in('group_id', ids)
    .order('published_at', { ascending: false })
    .limit(limit);
  if (error) fail('listAnnouncements', error);
  return (data ?? []).map((r) => ({
    id: r.id,
    group: byId.get(r.group_id) ?? null,
    title: loc(r.title_id, r.title_en),
    body: loc(r.body_id, r.body_en),
    image_url: publicFileUrl('announcement-images', r.image_path),
    published_at: r.published_at ?? new Date(0).toISOString(),
  }));
}
