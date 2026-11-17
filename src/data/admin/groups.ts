import type { Tables } from './db';
import { db } from './db';
import { AdminError, unwrap, unwrapList } from './errors';

export type Group = Tables['groups']['Row'];

/** Staff see every group (including inactive) in the admin page. */
export async function listAllGroups(): Promise<Group[]> {
  return unwrapList(await db().from('groups').select('*').order('sort_order').order('name'));
}

export function slugify(name: string) {
  return name.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'kelompok';
}

/** Admin only (RLS). The slug is fixed after creation (it is used in public URLs). */
export async function saveGroup(id: string | null, input: Pick<Group, 'name' | 'sort_order' | 'active'> & { slug?: string }) {
  const res = id
    ? await db().from('groups').update({ name: input.name, sort_order: input.sort_order, active: input.active }).eq('id', id).select('*').maybeSingle()
    : await db().from('groups').insert({ ...input, slug: input.slug ?? slugify(input.name) }).select('*').single();
  const row = unwrap(res);
  if (!row) throw new AdminError('forbidden');
  return row;
}
