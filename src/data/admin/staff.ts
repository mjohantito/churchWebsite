import type { Tables } from './db';
import { db } from './db';
import { unwrapList } from './errors';

export type StaffRow = Tables['staff_users']['Row'];

/** Admins see everyone; editors only themselves (RLS). */
export async function listStaff(): Promise<StaffRow[]> {
  return unwrapList(await db().from('staff_users').select('*').order('role').order('full_name'));
}
