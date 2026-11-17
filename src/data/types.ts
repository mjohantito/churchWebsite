// Shapes mirror the planned Supabase tables (snake_case columns, uuid ids,
// ISO dates). Bilingual text is stored as a jsonb { id, en } column.

export type Localized = { id: string; en: string };

export type ServiceKind = 'sunday' | 'prayer' | 'choir';

/** table: service_cards */
export interface ServiceCardRow {
  id: string;
  kind: ServiceKind;
  sort_order: number;
  /** 24-hour "HH:MM" (WIB), formatted per language at render; null for cards without a time */
  times: string[] | null;
  is_published: boolean;
  updated_at: string;
}

/** table: sunday_materials (one row per Sunday) */
export interface SundayMaterialRow {
  id: string;
  service_date: string; // YYYY-MM-DD
  theme: Localized;
  scripture_ref: Localized;
  preacher_name: string | null;
}

/** table: prayer_lists (one row per Wednesday) */
export interface PrayerListRow {
  id: string;
  prayer_date: string; // YYYY-MM-DD
  items: Localized[];
}

/** table: sermons */
export interface SermonRow {
  id: string;
  title: Localized;
  preached_on: string; // YYYY-MM-DD
  preacher_name: string | null;
  scripture_ref: Localized;
  summary: Localized;
  /** e.g. "dQw4w9WgXcQ"; null shows the labelled placeholder frame */
  youtube_video_id: string | null;
  slides_url: string | null;
}
