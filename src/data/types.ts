// View models the UI renders. The data layer (src/data/*.ts) maps database
// rows (src/types/database.ts) or mock data into these shapes.

/** Indonesian is required; English is optional and falls back to Indonesian. */
export type Localized = { id: string; en?: string | null };

export type WeeklyKind = 'sunday_material' | 'prayer_list';
export type DutyService = 'sun_am' | 'sun_pm' | 'wed';

export interface WeeklyItemView {
  id: string;
  kind: WeeklyKind;
  service_date: string; // YYYY-MM-DD
  title: Localized;
  /** body split into lines (prayer list items, or short material notes) */
  lines: Localized[];
  file_url: string | null;
}

export interface SermonView {
  id: string;
  title: Localized;
  preached_on: string; // YYYY-MM-DD
  preacher_name: string | null;
  scripture_ref: Localized | null;
  summary: Localized | null;
  youtube_video_id: string | null;
  slides_url: string | null;
  /** readable URL part for /sermons/:slug */
  slug: string;
}

/** Previous / next sermon link on the detail page. */
export interface SermonLink {
  title: Localized;
  preached_on: string;
  slug: string;
}

export interface DailyBreadView {
  id: string;
  entry_date: string; // YYYY-MM-DD
  title: Localized;
  scripture_ref: string | null;
  body: Localized;
  audio_url: string | null;
}

export interface DailyBreadSummary {
  entry_date: string;
  title: Localized;
}

export interface GroupView {
  id: string;
  slug: string;
  name: string;
}

export interface AnnouncementView {
  id: string;
  group: GroupView | null;
  title: Localized;
  body: Localized;
  image_url: string | null;
  published_at: string; // ISO timestamp
  week_start: string; // Sunday that starts its week, YYYY-MM-DD (Asia/Jakarta; src/lib/week.ts)
}

export interface RosterView {
  week_start: string; // Monday, YYYY-MM-DD
  roles: { id: string; name: Localized }[];
  /** names[roleId][service] */
  names: Record<string, Partial<Record<DutyService, string>>>;
}

export interface StaffProfile {
  full_name: string;
  role: 'admin' | 'editor';
}

export interface ServiceTimeView {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** "HH:MM", WIB */
  time: string;
  label: Localized | null;
}

export interface ServiceView {
  id: string;
  kind: 'sunday' | 'other';
  name: Localized;
  description: Localized | null;
  show_on_homepage: boolean;
  weekly_kind: WeeklyKind | null;
  cta: { type: 'none' | 'form_choir' | 'link'; label: Localized | null; url: string | null };
  /** sorted by day, then time */
  times: ServiceTimeView[];
}
