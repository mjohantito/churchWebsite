-- Hardening after `supabase db advisors`:
-- 1. Move is_staff()/is_admin() out of the API-exposed `public` schema, so they
--    are no longer callable as /rest/v1/rpc endpoints.
-- 2. One permissive SELECT policy per role and table (no overlapping policies),
--    with staff writes split into INSERT / UPDATE / DELETE policies.
-- Access rules are unchanged (see docs/backend-plan.md).

create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create or replace function private.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_users where user_id = (select auth.uid()));
$$;

create or replace function private.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (select 1 from public.staff_users where user_id = (select auth.uid()) and role = 'admin');
$$;

revoke all on function private.is_staff() from public;
revoke all on function private.is_admin() from public;
grant execute on function private.is_staff() to authenticated;
grant execute on function private.is_admin() to authenticated;

-- ------------------------------------------------------------------
-- Drop every policy that used the public helpers, then recreate.
-- ------------------------------------------------------------------
drop policy "public reads published announcements" on public.announcements;
drop policy "staff manage announcements" on public.announcements;
drop policy "public reads published daily bread" on public.daily_bread;
drop policy "staff manage daily bread" on public.daily_bread;
drop policy "public reads published sermons" on public.sermons;
drop policy "staff manage sermons" on public.sermons;
drop policy "public reads published weekly items" on public.weekly_items;
drop policy "staff manage weekly items" on public.weekly_items;
drop policy "public reads active groups" on public.groups;
drop policy "staff manage groups" on public.groups;
drop policy "public reads active duty roles" on public.duty_roles;
drop policy "staff manage duty roles" on public.duty_roles;
drop policy "public reads duty assignments" on public.duty_assignments;
drop policy "staff manage duty assignments" on public.duty_assignments;
drop policy "staff read submissions" on public.form_submissions;
drop policy "staff update submissions" on public.form_submissions;
drop policy "admins delete submissions" on public.form_submissions;
drop policy "staff read own row" on public.staff_users;
drop policy "admins read all staff" on public.staff_users;
drop policy "admins add staff" on public.staff_users;
drop policy "admins update staff" on public.staff_users;
drop policy "admins remove staff" on public.staff_users;
drop policy "staff read site media" on storage.objects;
drop policy "staff upload site media" on storage.objects;
drop policy "staff update site media" on storage.objects;
drop policy "staff delete site media" on storage.objects;

drop function public.is_staff();
drop function public.is_admin();

-- ------------------------------------------------------------------
-- Content with draft/published status
-- ------------------------------------------------------------------
do $$
declare
  t text;
begin
  foreach t in array array['announcements', 'daily_bread', 'sermons', 'weekly_items'] loop
    execute format('create policy "anon reads published" on public.%I for select to anon using (status = ''published'')', t);
    execute format('create policy "signed-in reads published, staff read all" on public.%I for select to authenticated using (status = ''published'' or (select private.is_staff()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check ((select private.is_staff()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using ((select private.is_staff()))', t);
  end loop;

  -- groups / duty_roles: public sees active rows
  foreach t in array array['groups', 'duty_roles'] loop
    execute format('create policy "anon reads active" on public.%I for select to anon using (active = true)', t);
    execute format('create policy "signed-in reads active, staff read all" on public.%I for select to authenticated using (active = true or (select private.is_staff()))', t);
    execute format('create policy "staff insert" on public.%I for insert to authenticated with check ((select private.is_staff()))', t);
    execute format('create policy "staff update" on public.%I for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()))', t);
    execute format('create policy "staff delete" on public.%I for delete to authenticated using ((select private.is_staff()))', t);
  end loop;
end;
$$;

-- duty_assignments: everyone reads
create policy "everyone reads roster" on public.duty_assignments
  for select to anon, authenticated using (true);
create policy "staff insert" on public.duty_assignments
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff update" on public.duty_assignments
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff delete" on public.duty_assignments
  for delete to authenticated using ((select private.is_staff()));

-- ------------------------------------------------------------------
-- form_submissions ("anyone submits a form" INSERT policy is unchanged)
-- ------------------------------------------------------------------
create policy "staff read submissions" on public.form_submissions
  for select to authenticated using ((select private.is_staff()));
create policy "staff update submissions" on public.form_submissions
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "admins delete submissions" on public.form_submissions
  for delete to authenticated using ((select private.is_admin()));

-- ------------------------------------------------------------------
-- staff_users: own row, or all for admins; only admins write
-- ------------------------------------------------------------------
create policy "own row or admin reads" on public.staff_users
  for select to authenticated using (user_id = (select auth.uid()) or (select private.is_admin()));
create policy "admins add staff" on public.staff_users
  for insert to authenticated with check ((select private.is_admin()));
create policy "admins update staff" on public.staff_users
  for update to authenticated using ((select private.is_admin())) with check ((select private.is_admin()));
create policy "admins remove staff" on public.staff_users
  for delete to authenticated using ((select private.is_admin()));

-- ------------------------------------------------------------------
-- Storage: staff-only writes on the three site buckets
-- ------------------------------------------------------------------
create policy "staff read site media" on storage.objects
  for select to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_staff()));
create policy "staff upload site media" on storage.objects
  for insert to authenticated
  with check (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_staff()));
create policy "staff update site media" on storage.objects
  for update to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_staff()))
  with check (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_staff()));
create policy "staff delete site media" on storage.objects
  for delete to authenticated
  using (bucket_id in ('daily-bread-audio', 'sermon-slides', 'announcement-images') and (select private.is_staff()));
