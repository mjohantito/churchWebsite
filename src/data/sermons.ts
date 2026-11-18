import { USE_MOCK } from '../lib/env';
import { getSupabase, publicFileUrl } from '../lib/supabase';
import { parseSermonSlug, sermonSlug } from '../lib/sermonSlug';
import { mockLatestSermon } from './mock';
import { fail, loc } from './map';
import type { SermonLink, SermonView } from './types';

const COLUMNS = 'id, title_id, title_en, preacher, preached_on, scripture_ref, youtube_id, summary_id, summary_en, slides_path';
/** Sermons per "Muat lebih banyak" page. */
export const SERMON_PAGE = 10;

type Row = {
  id: string; title_id: string; title_en: string | null; preacher: string | null; preached_on: string;
  scripture_ref: string | null; youtube_id: string | null; summary_id: string | null; summary_en: string | null; slides_path: string | null;
};

function toView(r: Row): SermonView {
  return {
    id: r.id,
    title: loc(r.title_id, r.title_en),
    preached_on: r.preached_on,
    preacher_name: r.preacher,
    scripture_ref: r.scripture_ref ? { id: r.scripture_ref } : null,
    summary: r.summary_id ? loc(r.summary_id, r.summary_en) : null,
    youtube_video_id: r.youtube_id,
    slides_url: publicFileUrl('sermon-slides', r.slides_path),
    slug: sermonSlug(r),
  };
}

const published = () => getSupabase().from('sermons').select(COLUMNS).eq('status', 'published');

/** Most recent published sermon, or null if none yet. */
export async function getLatestSermon(): Promise<SermonView | null> {
  if (USE_MOCK) return mockLatestSermon();
  const { data, error } = await published().order('preached_on', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle();
  if (error) fail('getLatestSermon', error);
  return data ? toView(data) : null;
}

/** Letters, digits, spaces and hyphens only: safe inside a PostgREST or() filter. */
export function cleanSearch(q: string | null | undefined): string {
  return (q ?? '').normalize('NFKC').replace(/[^\p{L}\p{N}\s-]/gu, ' ').replace(/\s+/g, ' ').trim().slice(0, 60);
}

/**
 * One page of published sermons, newest first (date, then id), optionally
 * filtered by year and by a search term on title (ID/EN) or preacher.
 */
export async function listSermons(o: { q?: string | null; year?: number | null; page: number }): Promise<{ items: SermonView[]; hasMore: boolean }> {
  const term = cleanSearch(o.q);
  if (USE_MOCK) {
    const all = [mockLatestSermon()].filter((s) => (!o.year || s.preached_on.startsWith(String(o.year))) && (!term || s.title.id.toLowerCase().includes(term.toLowerCase())));
    return { items: o.page === 0 ? all : [], hasMore: false };
  }
  let q = published();
  if (o.year) q = q.gte('preached_on', `${o.year}-01-01`).lte('preached_on', `${o.year}-12-31`);
  if (term) q = q.or(`title_id.ilike."*${term}*",title_en.ilike."*${term}*",preacher.ilike."*${term}*"`);
  const from = o.page * SERMON_PAGE;
  // Ask for one extra row to know whether another page exists.
  const { data, error } = await q.order('preached_on', { ascending: false }).order('id', { ascending: false }).range(from, from + SERMON_PAGE);
  if (error) fail('listSermons', error);
  const rows = data ?? [];
  return { items: rows.slice(0, SERMON_PAGE).map(toView), hasMore: rows.length > SERMON_PAGE };
}

/** Years that have published sermons, newest first (for the year filter). */
export async function listSermonYears(): Promise<number[]> {
  if (USE_MOCK) return [Number(mockLatestSermon().preached_on.slice(0, 4))];
  const { data, error } = await getSupabase().from('sermons').select('preached_on').eq('status', 'published').order('preached_on', { ascending: false }).limit(1000);
  if (error) fail('listSermonYears', error);
  return [...new Set((data ?? []).map((r) => Number(r.preached_on.slice(0, 4))))];
}

/** One published sermon by its slug (or bare id); null if not found or a draft. */
export async function getSermonBySlug(slug: string): Promise<SermonView | null> {
  const parsed = parseSermonSlug(slug);
  if (!parsed) return null;
  if (USE_MOCK) { const m = mockLatestSermon(); return 'id' in parsed ? (m.id === parsed.id ? m : null) : m.preached_on === parsed.date ? m : null; }
  const q = 'id' in parsed ? published().eq('id', parsed.id) : published().eq('preached_on', parsed.date);
  const { data, error } = await q.limit(20);
  if (error) fail('getSermonBySlug', error);
  const row = (data ?? []).find((r) => ('id' in parsed ? r.id === parsed.id : r.id.startsWith(parsed.idPrefix)));
  return row ? toView(row) : null;
}

/** The published sermons just before (older) and after (newer) this one. */
export async function getSermonNeighbours(s: { id: string; preached_on: string }): Promise<{ older: SermonLink | null; newer: SermonLink | null }> {
  if (USE_MOCK) return { older: null, newer: null };
  const cols = 'id, title_id, title_en, preached_on';
  const sb = getSupabase();
  const d = s.preached_on;
  const [older, newer] = await Promise.all([
    sb.from('sermons').select(cols).eq('status', 'published').or(`preached_on.lt.${d},and(preached_on.eq.${d},id.lt.${s.id})`)
      .order('preached_on', { ascending: false }).order('id', { ascending: false }).limit(1).maybeSingle(),
    sb.from('sermons').select(cols).eq('status', 'published').or(`preached_on.gt.${d},and(preached_on.eq.${d},id.gt.${s.id})`)
      .order('preached_on', { ascending: true }).order('id', { ascending: true }).limit(1).maybeSingle(),
  ]);
  if (older.error) fail('getSermonNeighbours', older.error);
  if (newer.error) fail('getSermonNeighbours', newer.error);
  const link = (r: { id: string; title_id: string; title_en: string | null; preached_on: string } | null): SermonLink | null =>
    r ? { title: loc(r.title_id, r.title_en), preached_on: r.preached_on, slug: sermonSlug(r) } : null;
  return { older: link(older.data), newer: link(newer.data) };
}

/** Size in bytes of a public file (HEAD request), or null if unknown. */
export async function getFileSize(url: string): Promise<number | null> {
  try {
    const res = await fetch(url, { method: 'HEAD' });
    const n = Number(res.headers.get('content-length'));
    return res.ok && n > 0 ? n : null;
  } catch {
    return null;
  }
}
