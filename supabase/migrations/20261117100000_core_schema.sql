-- Setia Bakti Baptist Church: core schema
-- Dynamic content is stored in Indonesian (*_id, required) with optional
-- English (*_en, nullable). The UI falls back to Indonesian.

-- ------------------------------------------------------------------
-- Enums
-- ------------------------------------------------------------------
create type public.staff_role as enum ('admin', 'editor');
create type public.content_status as enum ('draft', 'published');
create type public.weekly_kind as enum ('sunday_material', 'prayer_list');
create type public.duty_service as enum ('sun_am', 'sun_pm', 'wed');
create type public.form_type as enum ('new_member', 'prayer', 'choir', 'baptism', 'contact');
create type public.submission_status as enum ('new', 'contacted', 'done');

-- ------------------------------------------------------------------
-- updated_at trigger
-- ------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- ------------------------------------------------------------------
-- staff_users: who may use the admin page
-- ------------------------------------------------------------------
create table public.staff_users (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  full_name text not null check (char_length(full_name) between 1 and 120),
  role public.staff_role not null default 'editor',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- groups: who posts announcements (KPW and others)
-- ------------------------------------------------------------------
create table public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and char_length(slug) <= 60),
  name text not null check (char_length(name) between 1 and 120),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ------------------------------------------------------------------
-- announcements (Pengumuman)
-- ------------------------------------------------------------------
create table public.announcements (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete restrict,
  title_id text not null check (char_length(title_id) between 1 and 200),
  title_en text check (char_length(title_en) <= 200),
  body_id text not null check (char_length(body_id) <= 10000),
  body_en text check (char_length(body_en) <= 10000),
  image_path text,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index announcements_feed_idx on public.announcements (status, published_at desc);
create index announcements_group_idx on public.announcements (group_id);

-- Publishing without a date stamps it now, so "newest first" always works.
create or replace function public.stamp_published_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.status = 'published' and new.published_at is null then
    new.published_at := now();
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------------
-- daily_bread (one entry per day)
-- ------------------------------------------------------------------
create table public.daily_bread (
  id uuid primary key default gen_random_uuid(),
  entry_date date not null unique,
  title_id text not null check (char_length(title_id) between 1 and 200),
  title_en text check (char_length(title_en) <= 200),
  scripture_ref text check (char_length(scripture_ref) <= 120),
  body_id text not null check (char_length(body_id) <= 20000),
  body_en text check (char_length(body_en) <= 20000),
  audio_path text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index daily_bread_feed_idx on public.daily_bread (status, entry_date desc);

-- ------------------------------------------------------------------
-- sermons
-- ------------------------------------------------------------------
create table public.sermons (
  id uuid primary key default gen_random_uuid(),
  title_id text not null check (char_length(title_id) between 1 and 200),
  title_en text check (char_length(title_en) <= 200),
  preacher text check (char_length(preacher) <= 120),
  preached_on date not null,
  -- Extra column (not in the brief) so the homepage keeps its "Reading" line.
  scripture_ref text check (char_length(scripture_ref) <= 120),
  youtube_id text check (youtube_id ~ '^[A-Za-z0-9_-]{11}$'),
  summary_id text check (char_length(summary_id) <= 10000),
  summary_en text check (char_length(summary_en) <= 10000),
  slides_path text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index sermons_feed_idx on public.sermons (status, preached_on desc);

-- ------------------------------------------------------------------
-- weekly_items: homepage "Next Sunday's material" + "Next prayer list"
-- body_*: one line per item (prayer list items are split on new lines)
-- ------------------------------------------------------------------
create table public.weekly_items (
  id uuid primary key default gen_random_uuid(),
  kind public.weekly_kind not null,
  service_date date not null,
  title_id text not null check (char_length(title_id) between 1 and 200),
  title_en text check (char_length(title_en) <= 200),
  body_id text check (char_length(body_id) <= 10000),
  body_en text check (char_length(body_en) <= 10000),
  file_path text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (kind, service_date)
);
create index weekly_items_next_idx on public.weekly_items (kind, status, service_date);

-- ------------------------------------------------------------------
-- duty roster (Jadwal Petugas Ibadah): one weekly table
-- ------------------------------------------------------------------
create table public.duty_roles (
  id uuid primary key default gen_random_uuid(),
  name_id text not null check (char_length(name_id) between 1 and 120),
  name_en text check (char_length(name_en) <= 120),
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.duty_assignments (
  id uuid primary key default gen_random_uuid(),
  week_start date not null check (extract(isodow from week_start) = 1), -- Monday
  service public.duty_service not null,
  role_id uuid not null references public.duty_roles (id) on delete cascade,
  names text not null check (char_length(names) between 1 and 500),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (week_start, service, role_id)
);
create index duty_assignments_role_idx on public.duty_assignments (role_id);

-- ------------------------------------------------------------------
-- form_submissions: public forms write here; only staff read
-- ------------------------------------------------------------------
create table public.form_submissions (
  id uuid primary key default gen_random_uuid(),
  type public.form_type not null,
  full_name text not null check (char_length(btrim(full_name)) between 1 and 120),
  phone text check (char_length(phone) <= 32),
  email text check (char_length(email) <= 254 and email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  message text check (char_length(message) <= 4000),
  extra jsonb not null default '{}'::jsonb
    check (jsonb_typeof(extra) = 'object' and pg_column_size(extra) <= 4096),
  consented_at timestamptz not null default now(),
  status public.submission_status not null default 'new',
  staff_notes text check (char_length(staff_notes) <= 4000),
  handled_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- staff need at least one way to reach the person
  constraint form_submissions_contact_required check (phone is not null or email is not null)
);
create index form_submissions_inbox_idx on public.form_submissions (status, created_at desc);
create index form_submissions_handled_by_idx on public.form_submissions (handled_by);

-- ------------------------------------------------------------------
-- Triggers
-- ------------------------------------------------------------------
create trigger set_updated_at before update on public.staff_users for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.groups for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.announcements for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.daily_bread for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.sermons for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.weekly_items for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.duty_roles for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.duty_assignments for each row execute function public.set_updated_at();
create trigger set_updated_at before update on public.form_submissions for each row execute function public.set_updated_at();

create trigger stamp_published_at before insert or update on public.announcements
  for each row execute function public.stamp_published_at();
