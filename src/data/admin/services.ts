// Church services in the admin page. Saving goes through the database function
// save_church_service (service + times in one transaction). The Sunday service
// is protected by database triggers; see migration 20261118090000.
import type { Tables } from './db';
import { db } from './db';
import { AdminError, unwrap, unwrapList } from './errors';

export type ServiceRow = Tables['church_services']['Row'];
export type ServiceTimeRow = Tables['church_service_times']['Row'];
export type ServiceWithTimes = ServiceRow & { church_service_times: ServiceTimeRow[] };

export interface ServiceInput {
  name_id: string;
  name_en: string | null;
  description_id: string | null;
  description_en: string | null;
  show_on_homepage: boolean;
  visible: boolean;
  weekly_kind: ServiceRow['weekly_kind'];
  cta_type: ServiceRow['cta_type'];
  cta_label_id: string | null;
  cta_label_en: string | null;
  cta_url: string | null;
}
export interface TimeInput {
  day_of_week: number;
  /** "HH:MM" (WIB) */
  start_time: string;
  label_id: string | null;
  label_en: string | null;
}

const SELECT = '*, church_service_times(*)';
const sortTimes = (s: ServiceWithTimes): ServiceWithTimes => ({
  ...s,
  church_service_times: [...(s.church_service_times ?? [])].sort((a, b) => a.day_of_week - b.day_of_week || a.start_time.localeCompare(b.start_time)),
});

/** All services (hidden ones too), in display order. */
export async function listAllServices(): Promise<ServiceWithTimes[]> {
  const rows = unwrapList(await db().from('church_services').select(SELECT).order('sort_order').order('name_id'));
  return (rows as ServiceWithTimes[]).map(sortTimes);
}

export async function getService(id: string): Promise<ServiceWithTimes> {
  const row = unwrap(await db().from('church_services').select(SELECT).eq('id', id).maybeSingle());
  if (!row) throw new AdminError('notFound');
  return sortTimes(row as ServiceWithTimes);
}

/** Creates (id = null) or updates a service and replaces its times, atomically. Returns the id. */
export async function saveService(id: string | null, service: ServiceInput, times: TimeInput[]): Promise<string> {
  const saved = unwrap(await db().rpc('save_church_service', { p_id: id as string, p_service: service as never, p_times: times as never }));
  if (!saved) throw new AdminError('forbidden');
  return saved;
}

/** Visible / homepage toggles and order. Allowed on the Sunday service too. */
export async function updateServiceFlags(id: string, patch: Partial<Pick<ServiceRow, 'visible' | 'show_on_homepage' | 'sort_order'>>) {
  const rows = unwrapList(await db().from('church_services').update(patch).eq('id', id).select('id'));
  if (!rows.length) throw new AdminError('forbidden');
}

/** Swap the positions of two services (list index based, so equal sort_orders still move). */
export async function swapServiceOrder(a: { id: string }, aIndex: number, b: { id: string }, bIndex: number) {
  await updateServiceFlags(a.id, { sort_order: bIndex + 1 });
  await updateServiceFlags(b.id, { sort_order: aIndex + 1 });
}

/** Admin only (RLS). The Sunday service can never be deleted (database trigger). */
export async function deleteService(id: string) {
  const rows = unwrapList(await db().from('church_services').delete().eq('id', id).select('id'));
  if (!rows.length) throw new AdminError('forbidden');
}
