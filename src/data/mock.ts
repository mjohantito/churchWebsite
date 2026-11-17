// MOCK DATA: stands in for Supabase until it is wired up.
// Replace these exports with queries returning the same row types.
import type { PrayerListRow, SermonRow, ServiceCardRow, SundayMaterialRow } from './types';
import { CHURCH_INFO } from './churchInfo';

export const serviceCards: ServiceCardRow[] = [
  {
    id: '6b1d0c1e-0000-4000-8000-000000000001',
    kind: 'sunday',
    sort_order: 1,
    times: [...CHURCH_INFO.services.sunday],
    is_published: true,
    updated_at: '2026-11-16T09:00:00+07:00',
  },
  {
    id: '6b1d0c1e-0000-4000-8000-000000000002',
    kind: 'prayer',
    sort_order: 2,
    times: [...CHURCH_INFO.services.wednesdayPrayer],
    is_published: true,
    updated_at: '2026-11-16T09:00:00+07:00',
  },
  {
    id: '6b1d0c1e-0000-4000-8000-000000000003',
    kind: 'choir',
    sort_order: 3,
    times: null,
    is_published: true,
    updated_at: '2026-11-16T09:00:00+07:00',
  },
];

export const nextSundayMaterial: SundayMaterialRow = {
  id: '7c2e1d2f-0000-4000-8000-000000000001',
  service_date: '2026-11-22',
  theme: { id: 'Contoh tema: Berjalan dalam Terang', en: 'Sample theme: Walking in the Light' },
  scripture_ref: { id: '1 Yohanes 1:5–7', en: '1 John 1:5–7' },
  preacher_name: null,
};

export const nextPrayerList: PrayerListRow = {
  id: '8d3f2e3a-0000-4000-8000-000000000001',
  prayer_date: '2026-11-18',
  items: [
    { id: 'Jemaat yang sedang sakit dan keluarganya', en: 'Members who are ill, and their families' },
    { id: 'Pelayanan anak, remaja, dan pemuda', en: 'Ministry to children, students and youth' },
    { id: 'Kota Kediri dan para pemimpinnya', en: 'The city of Kediri and its leaders' },
  ],
};

export const latestSermon: SermonRow = {
  id: '9e4a3f4b-0000-4000-8000-000000000001',
  title: { id: 'Contoh judul khotbah: Pengharapan yang Hidup', en: 'Sample sermon title: A Living Hope' },
  preached_on: '2026-11-15',
  preacher_name: null,
  scripture_ref: { id: '1 Petrus 1:3–9', en: '1 Peter 1:3–9' },
  summary: {
    id: 'Ringkasan khotbah akan diisi oleh staf gereja. Teks ini hanya contoh untuk melihat tata letak: dua sampai tiga kalimat yang merangkum pokok Firman, ayat utama, dan satu ajakan untuk minggu ini.',
    en: 'Church staff will supply the sermon summary. This text is only a layout sample: two or three sentences covering the main point, the key verse, and one invitation for the week.',
  },
  youtube_video_id: null,
  slides_url: null,
};
