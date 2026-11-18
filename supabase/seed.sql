-- Seed: loads the homepage mock data plus sample content for the other pages,
-- so the site looks the same on first run. Safe to run more than once.
-- Everything here is SAMPLE content ("Contoh ..."), to be replaced by staff.
-- Dates are relative to today in Asia/Jakarta so "next Sunday" stays current.

-- ------------------------------------------------------------------
-- Groups: KPW + two clearly named placeholders
-- ------------------------------------------------------------------
insert into public.groups (id, slug, name, sort_order, active) values
  ('00000000-0000-4000-8000-000000000101', 'kpw', 'KPW', 1, true),
  ('00000000-0000-4000-8000-000000000102', 'contoh-kelompok-a', 'Contoh Kelompok A (placeholder)', 2, true),
  ('00000000-0000-4000-8000-000000000103', 'contoh-kelompok-b', 'Contoh Kelompok B (placeholder)', 3, true)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Homepage weekly cards (same text as src/data/mock.ts)
-- ------------------------------------------------------------------
with d as (
  select (now() at time zone 'Asia/Jakarta')::date as today,
         extract(isodow from (now() at time zone 'Asia/Jakarta')::date)::int as dow
)
insert into public.weekly_items (id, kind, service_date, title_id, title_en, body_id, body_en, status)
select '00000000-0000-4000-8000-000000000201'::uuid, 'sunday_material'::public.weekly_kind,
       today + ((7 - dow) % 7),
       'Contoh tema: Berjalan dalam Terang', 'Sample theme: Walking in the Light',
       'Bacaan: 1 Yohanes 1:5–7', 'Reading: 1 John 1:5–7', 'published'::public.content_status
from d
union all
select '00000000-0000-4000-8000-000000000202'::uuid, 'prayer_list'::public.weekly_kind,
       today + ((3 - dow + 7) % 7),
       'Pokok doa', 'Prayer list',
       E'Jemaat yang sedang sakit dan keluarganya\nPelayanan anak, remaja, dan pemuda\nKota Kediri dan para pemimpinnya',
       E'Members who are ill, and their families\nMinistry to children, students and youth\nThe city of Kediri and its leaders',
       'published'::public.content_status
from d
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Sermons: latest (published) + one DRAFT used to test RLS
-- ------------------------------------------------------------------
with d as (
  select (now() at time zone 'Asia/Jakarta')::date as today,
         extract(isodow from (now() at time zone 'Asia/Jakarta')::date)::int as dow
)
insert into public.sermons (id, title_id, title_en, preacher, preached_on, scripture_ref, youtube_id, summary_id, summary_en, slides_path, status)
select '00000000-0000-4000-8000-000000000301'::uuid,
       'Contoh judul khotbah: Pengharapan yang Hidup', 'Sample sermon title: A Living Hope',
       null::text, today - (dow % 7), '1 Petrus 1:3–9'::text, null::text,
       'Ringkasan khotbah akan diisi oleh staf gereja. Teks ini hanya contoh untuk melihat tata letak: dua sampai tiga kalimat yang merangkum pokok Firman, ayat utama, dan satu ajakan untuk minggu ini.',
       'Church staff will supply the sermon summary. This text is only a layout sample: two or three sentences covering the main point, the key verse, and one invitation for the week.',
       null::text, 'published'::public.content_status
from d
union all
select '00000000-0000-4000-8000-000000000302'::uuid,
       'DRAF (tidak boleh tampil di situs)', 'DRAFT (must never appear on the site)',
       null, today + 7, null, null, 'Draf untuk menguji keamanan.', null, null, 'draft'::public.content_status
from d
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Daily bread: today and the previous three days (published), one future DRAFT
-- ------------------------------------------------------------------
with d as (select (now() at time zone 'Asia/Jakarta')::date as today)
insert into public.daily_bread (id, entry_date, title_id, title_en, scripture_ref, body_id, body_en, audio_path, status)
select v.id::uuid, d.today + v.offset_days, v.title_id, v.title_en, v.ref,
       'Contoh renungan harian. Teks lengkap dan rekaman audio akan diunggah oleh staf gereja setiap hari.' || E'\n\n' ||
       'Paragraf kedua contoh, untuk melihat jarak antarparagraf dan panjang baris saat membaca di ponsel.',
       'Sample daily devotional. Church staff will upload the full text and audio recording every day.' || E'\n\n' ||
       'A second sample paragraph, to check paragraph spacing and line length when reading on a phone.',
       null, v.status::public.content_status
from d, (values
  ('00000000-0000-4000-8000-000000000401', 0, 'Contoh: Kasih yang Setia', 'Sample: Faithful Love', 'Ratapan 3:22–23', 'published'),
  ('00000000-0000-4000-8000-000000000402', -1, 'Contoh: Terang bagi Langkahku', 'Sample: A Light for My Path', 'Mazmur 119:105', 'published'),
  ('00000000-0000-4000-8000-000000000403', -2, 'Contoh: Damai Sejahtera', 'Sample: Peace', 'Yohanes 14:27', 'published'),
  ('00000000-0000-4000-8000-000000000404', -3, 'Contoh: Berjalan Bersama', 'Sample: Walking Together', 'Amos 3:3', 'published'),
  ('00000000-0000-4000-8000-000000000405', 1, 'DRAF besok (tidak boleh tampil)', 'DRAFT tomorrow (must not appear)', null, 'draft')
) as v(id, offset_days, title_id, title_en, ref, status)
on conflict (id) do nothing;

-- ------------------------------------------------------------------
-- Announcements: three published samples + one DRAFT
-- ------------------------------------------------------------------
insert into public.announcements (id, group_id, title_id, title_en, body_id, body_en, image_path, status, published_at) values
  ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000101',
   'Contoh pengumuman KPW', 'Sample KPW announcement',
   'Ini contoh pengumuman dari KPW. Isi sebenarnya akan ditulis oleh staf melalui halaman admin.',
   'This is a sample announcement from KPW. Staff will write the real content from the admin page.',
   null, 'published', now() - interval '1 day'),
  ('00000000-0000-4000-8000-000000000502', '00000000-0000-4000-8000-000000000102',
   'Contoh pengumuman Kelompok A', 'Sample announcement from Group A',
   'Contoh isi pengumuman untuk menguji filter kelompok.', 'Sample text to test the group filter.',
   null, 'published', now() - interval '3 days'),
  ('00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000103',
   'Contoh pengumuman Kelompok B', null,
   'Pengumuman ini sengaja tanpa versi bahasa Inggris, untuk menguji fallback ke bahasa Indonesia.', null,
   null, 'published', now() - interval '6 days'),
  ('00000000-0000-4000-8000-000000000504', '00000000-0000-4000-8000-000000000101',
   'DRAF pengumuman (tidak boleh tampil)', 'DRAFT announcement (must not appear)',
   'Draf untuk menguji keamanan.', null, null, 'draft', null)
on conflict (id) do nothing;

-- Each sample in the Sunday-to-Saturday week (Asia/Jakarta) of its publish date.
update public.announcements
set week_start = (coalesce(published_at, created_at) at time zone 'Asia/Jakarta')::date
               - extract(dow from (coalesce(published_at, created_at) at time zone 'Asia/Jakarta')::date)::int
where id in ('00000000-0000-4000-8000-000000000501', '00000000-0000-4000-8000-000000000502',
             '00000000-0000-4000-8000-000000000503', '00000000-0000-4000-8000-000000000504');

-- ------------------------------------------------------------------
-- Duty roster: roles + this week and next week (placeholder names)
-- ------------------------------------------------------------------
insert into public.duty_roles (id, name_id, name_en, sort_order, active) values
  ('00000000-0000-4000-8000-000000000601', 'Pemimpin Ibadah', 'Worship Leader', 1, true),
  ('00000000-0000-4000-8000-000000000602', 'Pengkhotbah', 'Preacher', 2, true),
  ('00000000-0000-4000-8000-000000000603', 'Pemusik', 'Musician', 3, true),
  ('00000000-0000-4000-8000-000000000604', 'Multimedia', 'Multimedia', 4, true),
  ('00000000-0000-4000-8000-000000000605', 'Penerima Tamu', 'Usher', 5, true)
on conflict (id) do nothing;

with w as (
  select ((now() at time zone 'Asia/Jakarta')::date
          - (extract(isodow from (now() at time zone 'Asia/Jakarta')::date)::int - 1)) as monday
)
insert into public.duty_assignments (week_start, service, role_id, names)
select w.monday + wk.offset_days, s.service::public.duty_service, r.id,
       'Contoh Petugas ' || r.sort_order || (case s.service when 'sun_am' then 'A' when 'sun_pm' then 'B' else 'C' end)
from w,
     (values (0), (7)) as wk(offset_days),
     (values ('sun_am'), ('sun_pm'), ('wed')) as s(service),
     public.duty_roles r
where r.id in ('00000000-0000-4000-8000-000000000601', '00000000-0000-4000-8000-000000000602',
               '00000000-0000-4000-8000-000000000603', '00000000-0000-4000-8000-000000000604',
               '00000000-0000-4000-8000-000000000605')
on conflict (week_start, service, role_id) do nothing;
