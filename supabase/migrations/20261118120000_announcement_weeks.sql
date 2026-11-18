-- Announcements by week (Pengumuman revision, 2026-11-18).
-- Every announcement belongs to one Monday-to-Sunday week (Asia/Jakarta).
-- The public page shows one week at a time; staff order items inside a week.
-- RLS is unchanged: anon/signed-in visitors still read status = 'published' only.

-- ------------------------------------------------------------------
-- Columns, backfill, constraint, index
-- ------------------------------------------------------------------
alter table public.announcements
  add column week_start date,
  add column sort_order integer not null default 0;

-- Backfill: the Monday of published_at (drafts: created_at) in Jakarta time.
-- date_trunc('week', ...) truncates to Monday.
update public.announcements
set week_start = date_trunc('week', coalesce(published_at, created_at) at time zone 'Asia/Jakarta')::date;

-- Rows inserted without a week land in the current Jakarta week.
alter table public.announcements
  alter column week_start set default (date_trunc('week', now() at time zone 'Asia/Jakarta')::date),
  alter column week_start set not null,
  add constraint announcements_week_start_is_monday check (extract(isodow from week_start) = 1);

create index announcements_week_idx on public.announcements (week_start, status);

-- ------------------------------------------------------------------
-- Public: distinct weeks that have published announcements (navigator bounds).
-- SECURITY INVOKER, so RLS still applies on top of the explicit filter.
-- ------------------------------------------------------------------
create or replace function public.announcement_weeks()
returns setof date
language sql
stable
security invoker
set search_path = ''
as $$
  select distinct a.week_start
  from public.announcements a
  where a.status = 'published'
  order by 1;
$$;

revoke all on function public.announcement_weeks() from public;
grant execute on function public.announcement_weeks() to anon, authenticated;

-- ------------------------------------------------------------------
-- Staff: set the order of a week's announcements in one statement.
-- p_ids is the full new order; ids outside p_week are ignored.
-- SECURITY INVOKER: the "staff update" RLS policy decides who may do this.
-- ------------------------------------------------------------------
create or replace function public.reorder_announcements(p_week date, p_ids uuid[])
returns integer
language sql
security invoker
set search_path = ''
as $$
  with updated as (
    update public.announcements a
    set sort_order = o.pos
    from unnest(p_ids) with ordinality as o(id, pos)
    where a.id = o.id and a.week_start = p_week
    returning a.id
  )
  select count(*)::integer from updated;
$$;

-- ------------------------------------------------------------------
-- Staff: copy announcements to the following week as drafts (repeating
-- notices). Copies keep group, texts and image; they go after the items
-- already in the target week, in their original order.
-- SECURITY INVOKER: the "staff insert" RLS policy decides who may do this.
-- ------------------------------------------------------------------
create or replace function public.copy_announcements_to_next_week(p_ids uuid[])
returns integer
language sql
security invoker
set search_path = ''
as $$
  with src as (
    select a.*, row_number() over (partition by a.week_start order by a.sort_order, a.created_at) as rn
    from public.announcements a
    where a.id = any (p_ids)
  ),
  inserted as (
    insert into public.announcements
      (group_id, title_id, title_en, body_id, body_en, image_path, status, published_at, week_start, sort_order)
    select s.group_id, s.title_id, s.title_en, s.body_id, s.body_en, s.image_path,
           'draft', null, s.week_start + 7,
           coalesce((select max(t.sort_order) from public.announcements t where t.week_start = s.week_start + 7), 0) + s.rn::integer
    from src s
    order by s.week_start, s.rn
    returning 1
  )
  select count(*)::integer from inserted;
$$;

revoke all on function public.reorder_announcements(date, uuid[]) from public, anon;
revoke all on function public.copy_announcements_to_next_week(uuid[]) from public, anon;
grant execute on function public.reorder_announcements(date, uuid[]) to authenticated;
grant execute on function public.copy_announcements_to_next_week(uuid[]) to authenticated;
