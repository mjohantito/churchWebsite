import { USE_MOCK } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import { mockRoster } from './mock';
import { fail, loc } from './map';
import type { RosterView } from './types';

/** Duty roster for the week starting on `weekStart` (a Monday). */
export async function getRoster(weekStart: string): Promise<RosterView> {
  if (USE_MOCK) return mockRoster(weekStart);
  const supabase = getSupabase();
  const [roles, assignments] = await Promise.all([
    supabase.from('duty_roles').select('id, name_id, name_en').eq('active', true).order('sort_order', { ascending: true }),
    supabase.from('duty_assignments').select('role_id, service, names').eq('week_start', weekStart),
  ]);
  if (roles.error) fail('getRoster roles', roles.error);
  if (assignments.error) fail('getRoster assignments', assignments.error);

  const names: RosterView['names'] = {};
  for (const a of assignments.data ?? []) {
    if (!a.names.trim()) continue; // cleared cell = unassigned
    (names[a.role_id] ??= {})[a.service] = a.names;
  }
  return {
    week_start: weekStart,
    roles: (roles.data ?? []).map((r) => ({ id: r.id, name: loc(r.name_id, r.name_en) })),
    names,
  };
}
