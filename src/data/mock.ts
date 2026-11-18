// MOCK DATA for offline work (VITE_USE_MOCK=true). Same content as
// supabase/seed.sql. Dates are computed relative to today so cards stay current.
import { addDays, jakartaToday, mondayOf } from '../lib/dates';
import { addWeeks, getWeekStart } from '../lib/week';
import type {
  AnnouncementView, DailyBreadView, GroupView, RosterView, SermonView, WeeklyItemView, DutyService,
} from './types';

const today = () => jakartaToday();
const dow = () => new Date(`${today()}T00:00:00Z`).getUTCDay(); // 0 = Sunday

export function mockNextWeekly(kind: WeeklyItemView['kind']): WeeklyItemView {
  if (kind === 'sunday_material') {
    return {
      id: 'mock-sunday', kind, service_date: addDays(today(), (7 - dow()) % 7),
      title: { id: 'Contoh tema: Berjalan dalam Terang', en: 'Sample theme: Walking in the Light' },
      lines: [{ id: 'Bacaan: 1 Yohanes 1:5–7', en: 'Reading: 1 John 1:5–7' }],
      file_url: null,
    };
  }
  return {
    id: 'mock-prayer', kind, service_date: addDays(today(), (3 - dow() + 7) % 7),
    title: { id: 'Pokok doa', en: 'Prayer list' },
    lines: [
      { id: 'Jemaat yang sedang sakit dan keluarganya', en: 'Members who are ill, and their families' },
      { id: 'Pelayanan anak, remaja, dan pemuda', en: 'Ministry to children, students and youth' },
      { id: 'Kota Kediri dan para pemimpinnya', en: 'The city of Kediri and its leaders' },
    ],
    file_url: null,
  };
}

export function mockLatestSermon(): SermonView {
  return {
    id: 'mock-sermon',
    title: { id: 'Contoh judul khotbah: Pengharapan yang Hidup', en: 'Sample sermon title: A Living Hope' },
    preached_on: addDays(today(), -dow()),
    preacher_name: null,
    scripture_ref: { id: '1 Petrus 1:3–9' },
    summary: {
      id: 'Ringkasan khotbah akan diisi oleh staf gereja. Teks ini hanya contoh untuk melihat tata letak: dua sampai tiga kalimat yang merangkum pokok Firman, ayat utama, dan satu ajakan untuk minggu ini.',
      en: 'Church staff will supply the sermon summary. This text is only a layout sample: two or three sentences covering the main point, the key verse, and one invitation for the week.',
    },
    youtube_video_id: null,
    slides_url: null,
  };
}

const DAILY: [number, string, string, string][] = [
  [0, 'Contoh: Kasih yang Setia', 'Sample: Faithful Love', 'Ratapan 3:22–23'],
  [-1, 'Contoh: Terang bagi Langkahku', 'Sample: A Light for My Path', 'Mazmur 119:105'],
  [-2, 'Contoh: Damai Sejahtera', 'Sample: Peace', 'Yohanes 14:27'],
  [-3, 'Contoh: Berjalan Bersama', 'Sample: Walking Together', 'Amos 3:3'],
];

export function mockDailyBread(): DailyBreadView[] {
  return DAILY.map(([offset, tid, ten, ref]) => ({
    id: `mock-db-${offset}`,
    entry_date: addDays(today(), offset),
    title: { id: tid, en: ten },
    scripture_ref: ref,
    body: {
      id: 'Contoh renungan harian. Teks lengkap dan rekaman audio akan diunggah oleh staf gereja setiap hari.\n\nParagraf kedua contoh, untuk melihat jarak antarparagraf dan panjang baris saat membaca di ponsel.',
      en: 'Sample daily devotional. Church staff will upload the full text and audio recording every day.\n\nA second sample paragraph, to check paragraph spacing and line length when reading on a phone.',
    },
    audio_url: null,
  }));
}

export const mockGroups: GroupView[] = [
  { id: 'g-kpw', slug: 'kpw', name: 'KPW' },
  { id: 'g-a', slug: 'contoh-kelompok-a', name: 'Contoh Kelompok A (placeholder)' },
  { id: 'g-b', slug: 'contoh-kelompok-b', name: 'Contoh Kelompok B (placeholder)' },
];

export function mockAnnouncements(): AnnouncementView[] {
  const daysAgo = (n: number) => new Date(Date.now() - n * 86_400_000).toISOString();
  const thisWeek = getWeekStart(today());
  return [
    { id: 'a1', group: mockGroups[0], title: { id: 'Contoh pengumuman KPW', en: 'Sample KPW announcement' },
      body: { id: 'Ini contoh pengumuman dari KPW. Isi sebenarnya akan ditulis oleh staf melalui halaman admin.', en: 'This is a sample announcement from KPW. Staff will write the real content from the admin page.' },
      image_url: null, published_at: daysAgo(1), week_start: thisWeek },
    { id: 'a2', group: mockGroups[1], title: { id: 'Contoh pengumuman Kelompok A', en: 'Sample announcement from Group A' },
      body: { id: 'Contoh isi pengumuman untuk menguji filter kelompok.', en: 'Sample text to test the group filter.' },
      image_url: null, published_at: daysAgo(3), week_start: thisWeek },
    { id: 'a3', group: mockGroups[2], title: { id: 'Contoh pengumuman Kelompok B' },
      body: { id: 'Pengumuman ini sengaja tanpa versi bahasa Inggris, untuk menguji fallback ke bahasa Indonesia.' },
      image_url: null, published_at: daysAgo(6), week_start: addWeeks(thisWeek, -1) },
  ];
}

const ROLES = [
  { id: 'r1', name: { id: 'Pemimpin Ibadah', en: 'Worship Leader' } },
  { id: 'r2', name: { id: 'Pengkhotbah', en: 'Preacher' } },
  { id: 'r3', name: { id: 'Pemusik', en: 'Musician' } },
  { id: 'r4', name: { id: 'Multimedia', en: 'Multimedia' } },
  { id: 'r5', name: { id: 'Penerima Tamu', en: 'Usher' } },
];

export function mockRoster(weekStart: string): RosterView {
  const thisMonday = mondayOf(today());
  const known = weekStart === thisMonday || weekStart === addDays(thisMonday, 7);
  const names: RosterView['names'] = {};
  if (known) {
    ROLES.forEach((r, i) => {
      const cell: Partial<Record<DutyService, string>> = {};
      (['sun_am', 'sun_pm', 'wed'] as DutyService[]).forEach((s, j) => {
        cell[s] = `Contoh Petugas ${i + 1}${'ABC'[j]}`;
      });
      names[r.id] = cell;
    });
  }
  return { week_start: weekStart, roles: ROLES, names };
}
