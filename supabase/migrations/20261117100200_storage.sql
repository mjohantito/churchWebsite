-- Storage buckets: public read (files are served by public URL), staff-only writes.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('daily-bread-audio', 'daily-bread-audio', true, 26214400, -- 25 MB
    array['audio/mpeg', 'audio/mp3', 'audio/mp4', 'audio/x-m4a', 'audio/m4a', 'audio/aac']),
  ('sermon-slides', 'sermon-slides', true, 52428800, -- 50 MB
    array['application/pdf', 'application/vnd.openxmlformats-officedocument.presentationml.presentation']),
  ('announcement-images', 'announcement-images', true, 5242880, -- 5 MB
    array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public buckets serve files by URL without a SELECT policy, so the public
-- cannot list bucket contents. Staff get full access to these three buckets.
create policy "staff read site media" on storage.objects
  for select to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select public.is_staff()));

create policy "staff upload site media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select public.is_staff()));

create policy "staff update site media" on storage.objects
  for update to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select public.is_staff()))
  with check (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select public.is_staff()));

create policy "staff delete site media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select public.is_staff()));
