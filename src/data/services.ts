import { USE_MOCK } from '../lib/env';
import { getSupabase } from '../lib/supabase';
import { FALLBACK_SERVICES } from './churchInfo';
import { fail, loc } from './map';
import type { ServiceView } from './types';

/** Visible church services in admin order, each with its times sorted by day then time. */
export async function listServices(): Promise<ServiceView[]> {
  if (USE_MOCK) return FALLBACK_SERVICES;
  const { data, error } = await getSupabase()
    .from('church_services')
    .select('id, kind, name_id, name_en, description_id, description_en, show_on_homepage, weekly_kind, cta_type, cta_label_id, cta_label_en, cta_url, sort_order, church_service_times(day_of_week, start_time, label_id, label_en)')
    .eq('visible', true)
    .order('sort_order', { ascending: true })
    .order('name_id', { ascending: true });
  if (error) fail('listServices', error);
  return (data ?? []).map((s) => ({
    id: s.id,
    kind: s.kind,
    name: loc(s.name_id, s.name_en),
    description: s.description_id ? loc(s.description_id, s.description_en) : null,
    show_on_homepage: s.show_on_homepage,
    weekly_kind: s.weekly_kind,
    cta: {
      type: s.cta_type,
      label: s.cta_label_id ? loc(s.cta_label_id, s.cta_label_en) : null,
      url: s.cta_url,
    },
    times: [...(s.church_service_times ?? [])]
      .map((t) => ({ day: t.day_of_week, time: t.start_time.slice(0, 5), label: t.label_id ? loc(t.label_id, t.label_en) : null }))
      .sort((a, b) => a.day - b.day || a.time.localeCompare(b.time)),
  }));
}
