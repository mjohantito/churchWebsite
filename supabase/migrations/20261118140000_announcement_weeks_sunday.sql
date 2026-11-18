-- Announcement weeks run SUNDAY to SATURDAY (replaces the Monday weeks of
-- 20261118120000). week_start is now the Sunday of the week, Asia/Jakarta.
-- The functions announcement_weeks / reorder_announcements /
-- copy_announcements_to_next_week (+7 days) need no change.

alter table public.announcements drop constraint announcements_week_start_is_monday;

-- Backfill from the publish date in Jakarta time (drafts have no publish
-- date: use created_at). The append trigger is paused so that it does not
-- reshuffle the order; rows are renumbered per week right after.
alter table public.announcements disable trigger announcements_append_sort;

update public.announcements a
set week_start = d.day - extract(dow from d.day)::int
from (
  select id, (coalesce(published_at, created_at) at time zone 'Asia/Jakarta')::date as day
  from public.announcements
) d
where a.id = d.id;

update public.announcements a
set sort_order = o.rn
from (
  select id, row_number() over (partition by week_start order by sort_order, created_at, id) as rn
  from public.announcements
) o
where a.id = o.id;

alter table public.announcements enable trigger announcements_append_sort;

-- New rows without a week: this week's Sunday in Jakarta.
alter table public.announcements
  alter column week_start set default (
    (now() at time zone 'Asia/Jakarta')::date - extract(dow from (now() at time zone 'Asia/Jakarta')::date)::int
  ),
  add constraint announcements_week_start_is_sunday check (extract(dow from week_start) = 0);
