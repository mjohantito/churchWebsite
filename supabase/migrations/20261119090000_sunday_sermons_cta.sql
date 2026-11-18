-- Sermon history page (/sermons) linked from the Sunday Service card.
--
-- 1. The fixed Sunday row's button (CTA) is now locked like its name and
--    description: staff cannot change it from the app (signed-in requests).
--    Migrations run without a signed-in user, so they may still set it.
-- 2. Seed the Sunday button: "Materi khotbah / Sermon materials" -> /sermons.
--
-- sermons already has (status, preached_on desc) for the list; no new index.

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
  -- Fixed row, changed from the app: only times and display settings
  -- (visible, homepage, order, weekly block) may change. Migrations
  -- (auth.uid() is null) may also set the identity and the button.
  if old.is_fixed and auth.uid() is not null and (
       new.kind is distinct from old.kind
    or new.name_id is distinct from old.name_id
    or new.name_en is distinct from old.name_en
    or new.description_id is distinct from old.description_id
    or new.description_en is distinct from old.description_en
    or new.cta_type is distinct from old.cta_type
    or new.cta_label_id is distinct from old.cta_label_id
    or new.cta_label_en is distinct from old.cta_label_en
    or new.cta_url is distinct from old.cta_url
  ) then
    raise exception 'The fixed Sunday service: only its times and display settings can change' using errcode = '42501';
  end if;
  return new;
end;
$$;

update public.church_services
set cta_type = 'link',
    cta_label_id = 'Materi khotbah',
    cta_label_en = 'Sermon materials',
    cta_url = '/sermons'
where is_fixed;
