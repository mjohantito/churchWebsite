-- Row Level Security on EVERY public table.
-- anon  = public website visitors (publishable key)
-- authenticated = signed-in users; only rows in staff_users count as staff

-- ------------------------------------------------------------------
-- Helpers (security definer so they can read staff_users under RLS)
-- ------------------------------------------------------------------
create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_users where user_id = (select auth.uid())
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.staff_users
    where user_id = (select auth.uid()) and role = 'admin'
  );
$$;

revoke all on function public.is_staff() from public;
revoke all on function public.is_admin() from public;
grant execute on function public.is_staff() to anon, authenticated;
grant execute on function public.is_admin() to anon, authenticated;

-- ------------------------------------------------------------------
-- Enable RLS everywhere
-- ------------------------------------------------------------------
alter table public.staff_users enable row level security;
alter table public.groups enable row level security;
alter table public.announcements enable row level security;
alter table public.daily_bread enable row level security;
alter table public.sermons enable row level security;
alter table public.weekly_items enable row level security;
alter table public.duty_roles enable row level security;
alter table public.duty_assignments enable row level security;
alter table public.form_submissions enable row level security;

-- ------------------------------------------------------------------
-- Table privileges (defense in depth: anon can never write content,
-- and can only INSERT into form_submissions)
-- ------------------------------------------------------------------
revoke all on public.staff_users, public.groups, public.announcements, public.daily_bread,
  public.sermons, public.weekly_items, public.duty_roles, public.duty_assignments,
  public.form_submissions from anon, authenticated;

grant select on public.groups, public.announcements, public.daily_bread, public.sermons,
  public.weekly_items, public.duty_roles, public.duty_assignments to anon;

grant select, insert, update, delete on public.groups, public.announcements, public.daily_bread,
  public.sermons, public.weekly_items, public.duty_roles, public.duty_assignments,
  public.staff_users, public.form_submissions to authenticated;

grant insert on public.form_submissions to anon;

-- ------------------------------------------------------------------
-- Published content: public read, staff full access
-- ------------------------------------------------------------------
create policy "public reads published announcements" on public.announcements
  for select to anon, authenticated using (status = 'published');
create policy "staff manage announcements" on public.announcements
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "public reads published daily bread" on public.daily_bread
  for select to anon, authenticated using (status = 'published');
create policy "staff manage daily bread" on public.daily_bread
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "public reads published sermons" on public.sermons
  for select to anon, authenticated using (status = 'published');
create policy "staff manage sermons" on public.sermons
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "public reads published weekly items" on public.weekly_items
  for select to anon, authenticated using (status = 'published');
create policy "staff manage weekly items" on public.weekly_items
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- Active groups / roles: public read
create policy "public reads active groups" on public.groups
  for select to anon, authenticated using (active = true);
create policy "staff manage groups" on public.groups
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

create policy "public reads active duty roles" on public.duty_roles
  for select to anon, authenticated using (active = true);
create policy "staff manage duty roles" on public.duty_roles
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- Duty assignments: public read
create policy "public reads duty assignments" on public.duty_assignments
  for select to anon, authenticated using (true);
create policy "staff manage duty assignments" on public.duty_assignments
  for all to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));

-- ------------------------------------------------------------------
-- form_submissions: anyone may submit; nobody public can read
-- (prayer requests can be sensitive)
-- ------------------------------------------------------------------
create policy "anyone submits a form" on public.form_submissions
  for insert to anon, authenticated
  with check (
    status = 'new'
    and staff_notes is null
    and handled_by is null
    and consented_at <= now() + interval '5 minutes'
  );
create policy "staff read submissions" on public.form_submissions
  for select to authenticated using ((select public.is_staff()));
create policy "staff update submissions" on public.form_submissions
  for update to authenticated using ((select public.is_staff())) with check ((select public.is_staff()));
create policy "admins delete submissions" on public.form_submissions
  for delete to authenticated using ((select public.is_admin()));

-- ------------------------------------------------------------------
-- staff_users: own row, or everything for admins; only admins write
-- ------------------------------------------------------------------
create policy "staff read own row" on public.staff_users
  for select to authenticated using (user_id = (select auth.uid()));
create policy "admins read all staff" on public.staff_users
  for select to authenticated using ((select public.is_admin()));
create policy "admins add staff" on public.staff_users
  for insert to authenticated with check ((select public.is_admin()));
create policy "admins update staff" on public.staff_users
  for update to authenticated using ((select public.is_admin())) with check ((select public.is_admin()));
create policy "admins remove staff" on public.staff_users
  for delete to authenticated using ((select public.is_admin()));
