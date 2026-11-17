-- Staff roles for the admin page.
--   admin : everything, including deletes, groups, duty roles, export
--   editor: create + edit content, work the form inbox; no deletes
-- Uses private.is_admin() / private.is_staff() (20261117100300). They stay in
-- the non-exposed `private` schema so they are not callable as /rpc endpoints.

-- ------------------------------------------------------------------
-- Content tables: editors insert/update, only admins delete
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['announcements', 'daily_bread', 'sermons', 'weekly_items', 'duty_assignments'] loop
    execute format('drop policy "staff delete" on public.%I', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using ((select private.is_admin()))', t);
  end loop;

  -- Groups and duty roles are admin-managed (editors only read them).
  foreach t in array array['groups', 'duty_roles'] loop
    execute format('drop policy "staff insert" on public.%I', t);
    execute format('drop policy "staff update" on public.%I', t);
    execute format('drop policy "staff delete" on public.%I', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check ((select private.is_admin()))', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using ((select private.is_admin()))', t);
  end loop;
end;
$$;

-- ------------------------------------------------------------------
-- Inbox: staff may only change status and notes; "handled by" is set
-- automatically to whoever changed them.
-- ------------------------------------------------------------------
revoke update on public.form_submissions from authenticated;
grant update (status, staff_notes) on public.form_submissions to authenticated;

create or replace function private.stamp_handled_by()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if (new.status is distinct from old.status or new.staff_notes is distinct from old.staff_notes)
     and auth.uid() is not null then
    new.handled_by := auth.uid();
  end if;
  return new;
end;
$$;
revoke all on function private.stamp_handled_by() from public;

create trigger stamp_handled_by before update on public.form_submissions
  for each row execute function private.stamp_handled_by();

-- ------------------------------------------------------------------
-- Roster: an empty cell is saved as '' (editors cannot delete rows).
-- ------------------------------------------------------------------
alter table public.duty_assignments drop constraint duty_assignments_names_check;
alter table public.duty_assignments add constraint duty_assignments_names_check check (char_length(names) <= 500);

-- ------------------------------------------------------------------
-- Storage: editors upload/replace; only admins delete files.
-- Daily bread audio limit lowered to 15 MB (mono MP3 at 64-96 kbps).
-- ------------------------------------------------------------------
drop policy "staff delete site media" on storage.objects;
create policy "admins delete site media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_admin()));

update storage.buckets set file_size_limit = 15728640 where id = 'daily-bread-audio';
