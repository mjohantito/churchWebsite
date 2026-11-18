// Readable sermon URLs: /sermons/<date>-<title-slug>-<first 8 chars of id>,
// e.g. /sermons/2026-11-15-kasih-yang-sabar-00000000. The page resolves a
// sermon by date + id prefix, so the URL keeps working if the title changes.
// No imports: also used by scripts.

export function slugify(text: string, max = 60): string {
  return text
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, max)
    .replace(/-+$/g, '');
}

export function sermonSlug(s: { id: string; preached_on: string; title_id: string }): string {
  const title = slugify(s.title_id);
  return `${s.preached_on}${title ? `-${title}` : ''}-${s.id.slice(0, 8)}`;
}

/** { date, idPrefix } from a slug, { id } for a bare uuid, or null. */
export function parseSermonSlug(slug: string): { date: string; idPrefix: string } | { id: string } | null {
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug)) return { id: slug.toLowerCase() };
  const m = slug.match(/^(\d{4}-\d{2}-\d{2})(?:-[a-z0-9-]*)?-([0-9a-f]{8})$/i);
  return m ? { date: m[1], idPrefix: m[2].toLowerCase() } : null;
}
