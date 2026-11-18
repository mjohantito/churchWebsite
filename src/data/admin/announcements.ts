// Announcements by week in the admin page (migration 20261118120000).
// Ordering and copying go through SECURITY INVOKER database functions, so
// RLS still decides who may write (editors and admins; only admins delete).
import type { Tables } from './db';
import { db } from './db';
import { unwrap, unwrapList } from './errors';

export type AnnouncementRow = Tables['announcements']['Row'];

/** Every announcement of one week (drafts included), in display order. */
export async function listWeekAnnouncements(weekStart: string): Promise<AnnouncementRow[]> {
  return unwrapList(
    await db()
      .from('announcements')
      .select('*')
      .eq('week_start', weekStart)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })
      .order('id', { ascending: true }),
  );
}

/** Saves a week's new order (the full list of ids, top to bottom). */
export async function reorderAnnouncements(weekStart: string, ids: string[]): Promise<number> {
  return unwrap(await db().rpc('reorder_announcements', { p_week: weekStart, p_ids: ids })) ?? 0;
}

/** Copies announcements to the following week as drafts. Returns how many were created. */
export async function copyAnnouncementsToNextWeek(ids: string[]): Promise<number> {
  return unwrap(await db().rpc('copy_announcements_to_next_week', { p_ids: ids })) ?? 0;
}
