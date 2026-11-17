-- Church services managed from the admin page (replaces the static times in
-- src/data/churchInfo.ts, which stays only as an offline fallback).
--
-- Rules
--   public   : read visible services and their times
--   editor   : insert + update services; add/edit/remove their times
--   admin    : also delete services
--   database : the fixed Sunday service can never be deleted; its kind, is_fixed,
--              name and description never change; it always keeps >= 1 time.
-- Times are interpreted as WIB (Asia/Jakarta). day_of_week: 0 = Sunday ... 6 = Saturday.

create type public.service_kind as enum ('sunday', 'other');
create type public.service_cta as enum ('none', 'form_choir', 'link');

-- ------------------------------------------------------------------
-- Tables
-- ------------------------------------------------------------------
create table public.church_services (
  id uuid primary key default gen_random_uuid(),
  kind public.service_kind not null default 'other',
  name_id text not null check (char_length(btrim(name_id)) between 1 and 120),
  name_en text check (char_length(name_en) <= 120),
  description_id text check (char_length(description_id) <= 2000),
  description_en text check (char_length(description_en) <= 2000),
  is_fixed boolean not null default false,
  show_on_homepage boolean not null default true,
  visible boolean not null default true,
  sort_order integer not null default 0,
  weekly_kind public.weekly_kind,
  cta_type public.service_cta not null default 'none',
  cta_label_id text check (char_length(cta_label_id) <= 80),
  cta_label_en text check (char_length(cta_label_en) <= 80),
  cta_url text check (char_length(cta_url) <= 500 and cta_url ~ '^(https?://|/|mailto:|tel:)'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint church_services_link_needs_url check (cta_type <> 'link' or cta_url is not null),
  constraint church_services_fixed_is_sunday check (not is_fixed or kind = 'sunday')
);
-- Only one Sunday service can exist.
create unique index church_services_one_sunday on public.church_services (kind) where kind = 'sunday';
create index church_services_order_idx on public.church_services (visible, sort_order);

create table public.church_service_times (
  id uuid primary key default gen_random_uuid(),
  service_id uuid not null references public.church_services (id) on delete cascade,
  day_of_week smallint not null check (day_of_week between 0 and 6),
  start_time time not null,
  label_id text check (char_length(label_id) <= 60),
  label_en text check (char_length(label_en) <= 60),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (service_id, day_of_week, start_time)
);
create index church_service_times_service_idx on public.church_service_times (service_id);

create trigger set_updated_at before update on public.church_services for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.church_service_times for each row execute function public.set_updated_at();

-- ------------------------------------------------------------------
-- Sunday protection (enforced for everyone, including admins)
-- ------------------------------------------------------------------
create or replace function private.protect_fixed_service()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_fixed then
      raise exception 'The fixed Sunday service cannot be deleted' using errcode = '42501';
    end if;
    return old;
  end if;

  if tg_op = 'INSERT' then
    -- Only migrations (no signed-in user) may create the fixed row.
    if new.is_fixed and auth.uid() is not null then
      raise exception 'A fixed service cannot be created from the app' using errcode = '42501';
    end if;
    return new;
  end if;

  -- UPDATE
  if new.is_fixed is distinct from old.is_fixed then
    raise exception 'is_fixed cannot be changed' using errcode = '42501';
  end if;
  if old.is_fixed and (
       new.kind is distinct from old.kind
    or new.name_id is distinct from old.name_id
    or new.name_en is distinct from old.name_en
    or new.description_id is distinct from old.description_id
    or new.description_en is distinct from old.description_en
  ) then
    raise exception 'The fixed Sunday service: only its times and display settings can change' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_fixed_service
  before insert or update or delete on public.church_services
  for each row execute function private.protect_fixed_service();

-- A time may not move to another service.
create or replace function private.protect_service_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.service_id is distinct from old.service_id then
    raise exception 'A time cannot move to another service' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger protect_service_time
  before update on public.church_service_times
  for each row execute function private.protect_service_time();

-- The fixed service must keep at least one time. Checked at COMMIT (deferred),
-- so replacing all times in one transaction (save_church_service) is allowed,
-- but removing the last one is not.
create or replace function private.fixed_service_keeps_a_time()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if exists (select 1 from public.church_services s where s.id = old.service_id and s.is_fixed)
     and not exists (select 1 from public.church_service_times t where t.service_id = old.service_id) then
    raise exception 'The fixed Sunday service must keep at least one time' using errcode = '23514';
  end if;
  return null;
end;
$$;

create constraint trigger fixed_service_keeps_a_time
  after delete on public.church_service_times
  deferrable initially deferred
  for each row execute function private.fixed_service_keeps_a_time();

revoke all on function private.protect_fixed_service() from public;
revoke all on function private.protect_service_time() from public;
revoke all on function private.fixed_service_keeps_a_time() from public;

-- ------------------------------------------------------------------
-- Row Level Security
-- ------------------------------------------------------------------
alter table public.church_services enable row level security;
alter table public.church_service_times enable row level security;

revoke all on public.church_services, public.church_service_times from anon, authenticated;
grant select on public.church_services, public.church_service_times to anon;
grant select, insert, update, delete on public.church_services, public.church_service_times to authenticated;

-- services
create policy "anon reads visible" on public.church_services
  for select to anon using (visible = true);
create policy "signed-in reads visible, staff read all" on public.church_services
  for select to authenticated using (visible = true or (select private.is_staff()));
create policy "staff insert" on public.church_services
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff update" on public.church_services
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "admins delete" on public.church_services
  for delete to authenticated using ((select private.is_admin()));

-- times (readable when their service is readable; editing times is part of editing a service)
create policy "anon reads times of visible services" on public.church_service_times
  for select to anon
  using (exists (select 1 from public.church_services s where s.id = service_id and s.visible));
create policy "signed-in reads times, staff read all" on public.church_service_times
  for select to authenticated
  using (exists (select 1 from public.church_services s where s.id = service_id and s.visible) or (select private.is_staff()));
create policy "staff insert" on public.church_service_times
  for insert to authenticated with check ((select private.is_staff()));
create policy "staff update" on public.church_service_times
  for update to authenticated using ((select private.is_staff())) with check ((select private.is_staff()));
create policy "staff delete" on public.church_service_times
  for delete to authenticated using ((select private.is_staff()));

-- ------------------------------------------------------------------
-- Save a service and all its times in ONE transaction.
-- SECURITY INVOKER: runs with the caller's rights, so RLS and the triggers
-- above apply exactly as for direct table calls.
-- p_service: { kind?, name_id, name_en, description_id, description_en,
--   show_on_homepage, visible, sort_order?, weekly_kind, cta_type,
--   cta_label_id, cta_label_en, cta_url }
-- p_times: [{ day_of_week, start_time "HH:MM", label_id, label_en }]
-- ------------------------------------------------------------------
create or replace function public.save_church_service(p_id uuid, p_service jsonb, p_times jsonb)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if jsonb_typeof(p_times) is distinct from 'array' then
    raise exception 'p_times must be an array' using errcode = '22023';
  end if;

  if p_id is null then
    insert into public.church_services (
      kind, name_id, name_en, description_id, description_en, show_on_homepage, visible, sort_order,
      weekly_kind, cta_type, cta_label_id, cta_label_en, cta_url
    ) values (
      'other',
      p_service->>'name_id', nullif(p_service->>'name_en', ''),
      nullif(p_service->>'description_id', ''), nullif(p_service->>'description_en', ''),
      coalesce((p_service->>'show_on_homepage')::boolean, true),
      coalesce((p_service->>'visible')::boolean, true),
      coalesce((p_service->>'sort_order')::int,
               (select coalesce(max(sort_order), 0) + 1 from public.church_services)),
      nullif(p_service->>'weekly_kind', '')::public.weekly_kind,
      coalesce(nullif(p_service->>'cta_type', ''), 'none')::public.service_cta,
      nullif(p_service->>'cta_label_id', ''), nullif(p_service->>'cta_label_en', ''),
      nullif(p_service->>'cta_url', '')
    )
    returning id into v_id;
  else
    update public.church_services set
      name_id = p_service->>'name_id',
      name_en = nullif(p_service->>'name_en', ''),
      description_id = nullif(p_service->>'description_id', ''),
      description_en = nullif(p_service->>'description_en', ''),
      show_on_homepage = coalesce((p_service->>'show_on_homepage')::boolean, show_on_homepage),
      visible = coalesce((p_service->>'visible')::boolean, visible),
      weekly_kind = nullif(p_service->>'weekly_kind', '')::public.weekly_kind,
      cta_type = coalesce(nullif(p_service->>'cta_type', ''), 'none')::public.service_cta,
      cta_label_id = nullif(p_service->>'cta_label_id', ''),
      cta_label_en = nullif(p_service->>'cta_label_en', ''),
      cta_url = nullif(p_service->>'cta_url', '')
    where id = p_id
    returning id into v_id;
    if v_id is null then
      raise exception 'Service not found or not allowed' using errcode = '42501';
    end if;
  end if;

  delete from public.church_service_times where service_id = v_id;
  insert into public.church_service_times (service_id, day_of_week, start_time, label_id, label_en, sort_order)
  select v_id, (t->>'day_of_week')::smallint, (t->>'start_time')::time,
         nullif(t->>'label_id', ''), nullif(t->>'label_en', ''),
         row_number() over (order by (t->>'day_of_week')::smallint, (t->>'start_time')::time)
  from jsonb_array_elements(p_times) as x(t);

  return v_id;
end;
$$;

revoke all on function public.save_church_service(uuid, jsonb, jsonb) from public, anon;
grant execute on function public.save_church_service(uuid, jsonb, jsonb) to authenticated;

-- ------------------------------------------------------------------
-- Seed from the previous static data (runs as the migration owner).
-- ------------------------------------------------------------------
insert into public.church_services
  (id, kind, name_id, name_en, description_id, description_en, is_fixed, show_on_homepage, visible, sort_order,
   weekly_kind, cta_type, cta_label_id, cta_label_en)
values
  ('00000000-0000-4000-8000-000000000701', 'sunday', 'Ibadah Minggu', 'Sunday Service', null, null,
   true, true, true, 1, 'sunday_material', 'none', null, null),
  ('00000000-0000-4000-8000-000000000702', 'other', 'Doa Rabu Malam', 'Wednesday Night Prayer', null, null,
   false, true, true, 2, 'prayer_list', 'none', null, null),
  ('00000000-0000-4000-8000-000000000703', 'other', 'Paduan Suara', 'Choir',
   'Suka bernyanyi? Bergabunglah melayani lewat pujian. Tidak perlu pengalaman, cukup kerinduan untuk memuji Tuhan bersama.',
   'Love to sing? Join us in serving through worship. No experience needed, just a heart to praise God together.',
   false, true, true, 3, null, 'form_choir', 'Gabung paduan suara', 'Join the choir')
on conflict (id) do nothing;

insert into public.church_service_times (service_id, day_of_week, start_time, label_id, label_en, sort_order)
values
  ('00000000-0000-4000-8000-000000000701', 0, '08:15', 'Ibadah pagi', 'Morning service', 1),
  ('00000000-0000-4000-8000-000000000701', 0, '18:15', 'Ibadah sore', 'Evening service', 2),
  ('00000000-0000-4000-8000-000000000702', 3, '18:15', null, null, 1)
on conflict (service_id, day_of_week, start_time) do nothing;
