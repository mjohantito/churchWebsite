-- Announcements: new items go to the END of their week (follow-up to 20261118120000).
-- Without this, a new announcement got sort_order 0 and jumped above items
-- that had been reordered (1..n). Also numbers existing rows 1..n per week so
-- the order never depends on identical created_at values.

-- Existing rows: 1..n per week in their current display order.
update public.announcements a
set sort_order = o.rn
from (
  select id, row_number() over (partition by week_start order by sort_order, created_at, id) as rn
  from public.announcements
) o
where a.id = o.id;

-- Insert with sort_order 0 (the default), or move to another week without
-- choosing a position: append after the last item of that week.
create or replace function private.announcement_append_sort()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  if (tg_op = 'INSERT' and new.sort_order = 0)
     or (tg_op = 'UPDATE' and new.week_start is distinct from old.week_start and new.sort_order = old.sort_order) then
    select coalesce(max(a.sort_order), 0) + 1 into new.sort_order
    from public.announcements a
    where a.week_start = new.week_start and a.id <> new.id;
  end if;
  return new;
end;
$$;

revoke all on function private.announcement_append_sort() from public;

create trigger announcements_append_sort
  before insert or update of week_start on public.announcements
  for each row execute function private.announcement_append_sort();
