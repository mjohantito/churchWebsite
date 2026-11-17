// CRUD for the four content tables (daily bread, sermons, weekly items,
// announcements). Admin screens call these through src/data/admin/hooks.ts.
import type { Tables } from './db';
import { untyped } from './db';
import { AdminError, unwrap } from './errors';
import { removeFile, type Bucket } from './storage';

export type ContentTable = 'daily_bread' | 'sermons' | 'weekly_items' | 'announcements';
export type Row<T extends ContentTable> = Tables[T]['Row'];
/** Editable fields: everything except id and timestamps. */
export type Input<T extends ContentTable> = Omit<Tables[T]['Insert'], 'id' | 'created_at' | 'updated_at'>;

interface Config {
  order: { column: string; ascending: boolean }[];
  /** columns holding storage paths, and their bucket */
  files: { column: string; bucket: Bucket }[];
}

export const CONTENT: Record<ContentTable, Config> = {
  daily_bread: { order: [{ column: 'entry_date', ascending: false }], files: [{ column: 'audio_path', bucket: 'daily-bread-audio' }] },
  sermons: { order: [{ column: 'preached_on', ascending: false }], files: [{ column: 'slides_path', bucket: 'sermon-slides' }] },
  weekly_items: {
    order: [{ column: 'service_date', ascending: false }, { column: 'kind', ascending: true }],
    files: [{ column: 'file_path', bucket: 'sermon-slides' }],
  },
  announcements: {
    order: [{ column: 'published_at', ascending: false }, { column: 'created_at', ascending: false }],
    files: [{ column: 'image_path', bucket: 'announcement-images' }],
  },
};

export async function listContent<T extends ContentTable>(table: T, filter?: Record<string, string>): Promise<Row<T>[]> {
  let q = untyped().from(table).select('*');
  for (const [col, val] of Object.entries(filter ?? {})) q = q.eq(col, val);
  for (const o of CONTENT[table].order) q = q.order(o.column, { ascending: o.ascending, nullsFirst: true });
  return unwrap(await q.limit(300)) as Row<T>[];
}

export async function getContent<T extends ContentTable>(table: T, id: string): Promise<Row<T>> {
  const row = unwrap(await untyped().from(table).select('*').eq('id', id).maybeSingle());
  if (!row) throw new AdminError('notFound');
  return row as Row<T>;
}

/** Another row with the same unique key (for "already exists" warnings). */
export async function findConflict<T extends ContentTable>(table: T, match: Record<string, string>, exceptId?: string | null) {
  let q = untyped().from(table).select('id').match(match);
  if (exceptId) q = q.neq('id', exceptId);
  const rows = unwrap(await q.limit(1)) as { id: string }[];
  return rows[0]?.id ?? null;
}

/** Insert (id = null) or update. Returns the saved row. */
export async function saveContent<T extends ContentTable>(table: T, id: string | null, input: Input<T>): Promise<Row<T>> {
  const res = id
    ? await untyped().from(table).update(input as never).eq('id', id).select('*').maybeSingle()
    : await untyped().from(table).insert(input as never).select('*').single();
  const row = unwrap(res);
  if (!row) throw new AdminError('forbidden'); // RLS silently matched no row
  return row as Row<T>;
}

/** Admin only (RLS). Also removes the row's uploaded files. */
export async function deleteContent<T extends ContentTable>(table: T, row: Row<T>): Promise<void> {
  const deleted = unwrap(await untyped().from(table).delete().eq('id', (row as { id: string }).id).select('id')) as unknown[];
  if (!deleted.length) throw new AdminError('forbidden');
  const r = row as Record<string, string | null>;
  await Promise.all(CONTENT[table].files.map((f) => removeFile(f.bucket, r[f.column])));
}
