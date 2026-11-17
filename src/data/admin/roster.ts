import type { Tables } from './db';
import { db } from './db';
import { AdminError, unwrap, unwrapList } from './errors';

export type DutyRole = Tables['duty_roles']['Row'];
export type DutyService = Tables['duty_assignments']['Row']['service'];
/** cells[roleId][service] = names */
export type RosterCells = Record<string, Partial<Record<DutyService, string>>>;

export async function listRoles(includeInactive: boolean): Promise<DutyRole[]> {
  let q = db().from('duty_roles').select('*');
  if (!includeInactive) q = q.eq('active', true);
  return unwrapList(await q.order('sort_order').order('name_id'));
}

export async function getRosterCells(weekStart: string): Promise<RosterCells> {
  const rows = unwrapList(await db().from('duty_assignments').select('role_id, service, names').eq('week_start', weekStart));
  const cells: RosterCells = {};
  for (const r of rows) (cells[r.role_id] ??= {})[r.service] = r.names;
  return cells;
}

/**
 * Saves the changed cells with one upsert. A cleared cell is stored as ''
 * (editors cannot delete rows); the public site treats '' as unassigned.
 */
export async function saveRosterCells(weekStart: string, cells: RosterCells, before: RosterCells) {
  const rows: Tables['duty_assignments']['Insert'][] = [];
  for (const [roleId, services] of Object.entries(cells)) {
    for (const [service, value] of Object.entries(services) as [DutyService, string][]) {
      const next = value.trim();
      const prev = (before[roleId]?.[service] ?? '').trim();
      if (next === prev) continue;
      if (!next && before[roleId]?.[service] === undefined) continue; // never existed
      rows.push({ week_start: weekStart, service, role_id: roleId, names: next });
    }
  }
  if (!rows.length) return 0;
  unwrap(await db().from('duty_assignments').upsert(rows, { onConflict: 'week_start,service,role_id' }).select('id'));
  return rows.length;
}

/** Admin only (RLS). */
export async function saveRole(id: string | null, input: Pick<DutyRole, 'name_id' | 'name_en' | 'sort_order' | 'active'>) {
  const res = id
    ? await db().from('duty_roles').update(input).eq('id', id).select('*').maybeSingle()
    : await db().from('duty_roles').insert(input).select('*').single();
  const row = unwrap(res);
  if (!row) throw new AdminError('forbidden');
  return row;
}
