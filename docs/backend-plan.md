# Backend plan (Supabase)

Build step 3. Postgres + Auth + Storage on Supabase, read by the React site through one client with the public (publishable/anon) key. Every request is limited by Row Level Security. The service_role key is never used in the frontend or stored in git.

## Environment variables

| Variable | Where | Notes |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local`, Vercel | Project URL |
| `VITE_SUPABASE_ANON_KEY` | `.env.local`, Vercel | Publishable key (`sb_publishable_…`). Public by design; RLS protects data |
| `VITE_SITE_URL` | optional, Vercel | Public site URL for canonical links, `og:url` and `sitemap.xml`. Defaults to Vercel's production URL |
| `VITE_USE_MOCK` | optional | `true` = offline mode: old mock data, forms use a stub, login disabled |

Copy `.env.example` to `.env.local`. All `VITE_` values end up in the browser bundle, so only public values go there.

## Tables

Dynamic text is Indonesian-first: `*_id` is required and `*_en` is optional. The UI falls back to Indonesian when English is empty. Every table has `id uuid` (primary key), `created_at` and `updated_at` (kept by a trigger).

| Table | Purpose | Key columns |
|---|---|---|
| `staff_users` | Who may use the admin page | `user_id` → `auth.users`, `full_name`, `role` (`admin` / `editor`) |
| `groups` | Who posts announcements | `slug` (unique), `name`, `sort_order`, `active` |
| `announcements` | Pengumuman | `group_id`, `title_*`, `body_*`, `image_path`, `status`, `published_at` (auto-set when published), `week_start` (Sunday that starts its week), `sort_order` |
| `daily_bread` | One devotional per day | `entry_date` (unique), `title_*`, `scripture_ref`, `body_*`, `audio_path`, `status` |
| `sermons` | Sermons | `title_*`, `preacher`, `preached_on`, `scripture_ref`, `youtube_id` (11 chars), `summary_*`, `slides_path`, `status` |
| `weekly_items` | Homepage "Next Sunday's material" / "Next prayer list" | `kind`, `service_date`, `title_*`, `body_*` (one line per item), `file_path`, `status`; unique (`kind`, `service_date`) |
| `duty_roles` | Roster rows | `name_*`, `sort_order`, `active` |
| `duty_assignments` | Roster cells | `week_start` (must be a Monday), `service` (`sun_am` / `sun_pm` / `wed`), `role_id`, `names`; unique (`week_start`, `service`, `role_id`) |
| `form_submissions` | All public forms | `type` (`new_member` / `prayer` / `choir` / `baptism` / `contact`), `full_name` ≤120, `phone` ≤32, `email` ≤254, `message` ≤4000, `extra` jsonb ≤4 KB, `consented_at`, `status` (`new` / `contacted` / `done`), `staff_notes`, `handled_by` |

`status` on content is `draft` / `published`. `sermons.scripture_ref` was added beyond the original brief so the homepage keeps its "Reading" line. `form_submissions` also requires a phone or an email.

## Roles and Row Level Security

RLS is enabled on every table. The helpers `private.is_staff()` and `private.is_admin()` are `security definer` functions that look up `auth.uid()` in `staff_users`. They live in the `private` schema, which the API does not expose, so they cannot be called as `/rpc` endpoints. (The admin step asked for `public.is_admin()`. It was kept in `private` for that reason; the protection is the same.)

| | Public (anon) | Signed in, not staff | Editor | Admin |
|---|---|---|---|---|
| announcements, daily_bread, sermons, weekly_items | read `published` | read `published` | read all, insert, update (incl. publish) | + delete |
| duty_assignments | read | read | read, insert, update | + delete |
| groups, duty_roles | read `active` | read `active` | read all | insert, update, delete |
| church_services | read `visible` | read `visible` | read all, insert, update | + delete (never the fixed Sunday row) |
| church_service_times | read times of visible services | same | read all, insert, update, delete | same |
| form_submissions | **insert only** | insert only | read; update `status` + `staff_notes` only | + delete |
| staff_users | none | own row | own row | everyone; insert, update, delete |
| storage (3 buckets) | files by public URL; no listing | none | upload, replace | + delete |

Other rules:
- **Editors never delete.** A cleared roster cell is saved as an empty string, and the public site treats it as unassigned. Replacing a file uploads a new one; old files stay in storage until an admin deletes the record. Deleting a record also deletes its files.
- **Column privileges on `form_submissions`.** Staff can only update `status` and `staff_notes`, never what the person submitted.
- **`handled_by` is set by a trigger** (`private.stamp_handled_by`) to whoever changed the status or notes.
- **CSV export is admin-only in the UI only.** Editors can read the inbox (they work it), so RLS cannot stop them reading the same rows.
- **Table grants match the policies:** anon has `SELECT` on public content and `INSERT` on `form_submissions` only.
- **The public site filters on `published` itself too,** so signed-in staff never see drafts on public pages.

Checks:
- `npm run db:check`: as an anonymous visitor (add `-- --insert` to also prove a normal submission works).
- `node --env-file=<file> scripts/check-roles.mjs`: signs in as an editor and an admin (`TEST_EDITOR_*` / `TEST_ADMIN_*` env vars) and calls the API directly to prove the role rules.

## Church services (migration 20261118090000)

Managed at `/admin/services`. They feed:
- the homepage worship and fellowship carousel
- the Church Services page
- the footer schedule
- the hero tag
- the mobile menu
- the admin roster's column labels

`src/data/churchInfo.ts` keeps an offline copy (`FALLBACK_SERVICES`), shown only while the data loads or if the request fails.

| Table | Columns |
|---|---|
| `church_services` | `kind` (`sunday` / `other`), `name_*`, `description_*`, `is_fixed`, `show_on_homepage`, `visible`, `sort_order`, `weekly_kind` (null / `sunday_material` / `prayer_list`: shows that weekly block on the card), `cta_type` (`none` / `form_choir` / `link`), `cta_label_*`, `cta_url` |
| `church_service_times` | `service_id`, `day_of_week` (0 = Sunday … 6 = Saturday), `start_time` (`time`, read as WIB), `label_*` (e.g. "Ibadah pagi"), `sort_order`; unique (`service_id`, `day_of_week`, `start_time`) |

Constraints:
- A unique partial index allows only one `kind = 'sunday'` row.
- `is_fixed` implies `kind = 'sunday'`.
- `cta_type = 'link'` requires a `cta_url` starting with `https://`, `http://`, `/`, `mailto:` or `tel:`.

**Saving:** `public.save_church_service(p_id, p_service jsonb, p_times jsonb)` creates or updates a service and replaces all its times in **one transaction**.
- It is `SECURITY INVOKER`, so RLS and the triggers apply exactly as for direct table calls.
- Only `authenticated` may execute it.
- It can only create `kind = 'other'` services.

**Sunday protection** applies to everyone, including admins and direct API calls:
- `private.protect_fixed_service` (BEFORE INSERT/UPDATE/DELETE on `church_services`) rejects:
  - deleting the fixed row
  - creating a fixed row while signed in
  - changing `is_fixed` on any row
  - changing the fixed row's `kind`, `name_*` or `description_*`

  Its times and display settings (visible, homepage, order, weekly block, button) can change.
- `private.protect_service_time` (BEFORE UPDATE on `church_service_times`) rejects moving a time to another service.
- `private.fixed_service_keeps_a_time` is a deferred constraint trigger (AFTER DELETE, `DEFERRABLE INITIALLY DEFERRED`). At commit it rejects any transaction that leaves the fixed service with no times. Replacing all times in one save works; removing the last time fails and is rolled back.

**Sunday button (migration 20261119090000):** the fixed Sunday row's CTA is "Materi khotbah / Sermon materials" → `/sermons`. `private.protect_fixed_service` now also locks `cta_type`, `cta_label_*` and `cta_url` on the fixed row for signed-in requests, next to the existing `kind`, name and description locks. Migrations run with no signed-in user, so they can still set it. The admin form shows these fields read-only with a note, and resends the stored values on save.

**Roles:** editors may insert, update and delete *time rows* (removing a time is part of editing a service). Deleting a whole service is admin-only (RLS), and the Sunday row can never be deleted (trigger).

**Freshness:** the public site reads services through TanStack Query (`['services']`, 60 s stale time). Every pre-rendered page also carries the build-time copy for its footer, which is marked stale and refetched on load. Saving in the admin invalidates the admin and public queries, so changes show on the public site after a refresh.

**Tests:** `npm run db:services` (needs `.env.test-accounts` with `TEST_ADMIN_*` / `TEST_EDITOR_*`). It covers anonymous, editor and admin access, every Sunday rule, hiding, and deleting, all through direct API calls.

## Storage

| Bucket | Public read | Max size | Types |
|---|---|---|---|
| `daily-bread-audio` | yes | 15 MB | mp3, m4a/mp4, aac |
| `sermon-slides` | yes (also used for weekly item files) | 50 MB | pdf, pptx |
| `announcement-images` | yes | 5 MB | jpg, png, webp |

Files are served by public URL. The `*_path` columns store the path inside the bucket (`YYYY/MM/<time>-<name>`), and the data layer turns it into a URL. Staff upload and replace files; only admins delete them. The public cannot list bucket contents. The admin page checks type and size before uploading and shows progress. Compress daily bread audio to mono MP3 (about 1 MB per minute or less).

## Auth flow

- Email + password (Supabase Auth). **Public sign-up is disabled.** Staff accounts are created in the dashboard.
- `/login` is not linked from the public navigation. After signing in you go to `/admin` (or the page you came from).
- `AuthProvider` (`src/auth/AuthContext.tsx`) holds the session and looks up the staff role from `staff_users`. supabase-js stores the session, refreshes the access token before it expires (and when a tab becomes visible again), and signs out if a refresh fails.
- `/admin` is wrapped in `RequireStaff`:
  - not signed in: redirect to `/login`
  - signed in but not in `staff_users`: "Not authorized" with a sign-out button
  - staff: the page

  The database enforces the same rules through RLS.

## Announcements by week (migrations 20261118120000, 20261118130000, 20261118140000)

Every announcement belongs to one Sunday-to-Saturday week (Asia/Jakarta). The public page shows one week at a time; staff order items inside a week.

**Columns:**
- `week_start date not null`: the Sunday that starts its week. A CHECK (`announcements_week_start_is_sunday`, `extract(dow from week_start) = 0`) rejects any other day. The default is the current Jakarta week's Sunday.
  - Weeks were first Monday-based (20261118120000) and switched to Sunday in 20261118140000. That migration backfilled `week_start` = Jakarta publish date (`created_at` for drafts) minus its day of week, then renumbered `sort_order`.
  - The frontend uses the shared helper `src/lib/week.ts` (`getWeekStart`, `formatWeekRange`, `addWeeks`); a picked date becomes the Sunday on or before it.
- `sort_order int not null default 0`: display order within the week.
- Index `announcements_week_idx` on (`week_start`, `status`).

**Order:** `sort_order`, then `created_at`, then `id`. The trigger `private.announcement_append_sort` (BEFORE INSERT / UPDATE OF week_start) puts a new item (sort_order 0), or one moved to another week, after the last item of that week.

**Functions** (all SECURITY INVOKER with an empty `search_path`, so RLS still decides who may read or write):
- `announcement_weeks()`: the distinct weeks with published announcements, for the public navigator bounds. Callable by anon and authenticated. Draft-only weeks never appear.
- `reorder_announcements(p_week, p_ids)`: sets `sort_order` 1..n in the given order. Ids outside the week are ignored. Authenticated only, so the "staff update" policy applies.
- `copy_announcements_to_next_week(p_ids)`: copies to `week_start + 7` as drafts (`published_at` null), after the items already in that week, in their original order. Authenticated only, so the "staff insert" policy applies.

**RLS:** unchanged. Visitors read `published` rows only, editors insert and update, admins also delete.

**Images:** copies share the original's `image_path`. Deleting an announcement (admin) removes its image file only when no other row still uses that path (`deleteContent` in `src/data/admin/content.ts`).

**Data layer:**
- public: `listAnnouncementWeeks`, `listAnnouncementsForWeek(week)`, `getAnnouncement(id)` in `src/data/announcements.ts`; group filtering happens on the page.
- admin: `listWeekAnnouncements`, `reorderAnnouncements`, `copyAnnouncementsToNextWeek` in `src/data/admin/announcements.ts`.

**Tests:** `npm run db:announcements` (needs `.env.test-accounts`). It creates A–E this week and F–J next week, then checks:
- each week shows only its own items
- the Sunday CHECK (a Monday or a Saturday is rejected) and the default week
- a draft-only week stays invisible to visitors
- anon cannot write or call the staff functions
- reorder
- new and moved items go to the end
- copy as drafts, keeping order
- editor cannot delete; admin can

Everything it creates is removed afterwards.

## Sermons (/sermons)

The table, RLS and admin screen are unchanged (from 20261117100000). Visitors read `status = 'published'` only; staff create and edit; admins delete. The existing index (`status`, `preached_on desc`) serves the list, so nothing was added.

**URLs:** `/sermons/<preached_on>-<slug of title_id>-<first 8 of id>` (`src/lib/sermonSlug.ts`). It is resolved by date plus id prefix, so a renamed sermon keeps working; a bare uuid also works. Drafts and unknown slugs show "not found".

**Queries:**
- **List:** newest first by `preached_on`, then `id`. Search uses `ilike` on `title_id`, `title_en` and `preacher`; the term is reduced to letters, digits, spaces and hyphens before going into the `or()` filter. The year filter is a date range. Pages are 10 rows, fetched as 11 to know whether there is more.
- **Year chips:** come from the published dates.
- **Previous/next:** the neighbouring published sermon by (`preached_on`, `id`).
- **Slide size:** a HEAD request to the public file. Supabase exposes `content-length` with `access-control-allow-origin: *`.

**Sample data:** `scripts/sample-sermons.mjs add|remove` signs in as an admin from `.env.test-accounts` (`TEST_ADMIN_EMAIL` / `TEST_ADMIN_PASSWORD`; your own admin login works).
- It adds 14 published sermons titled "Contoh: … / Sample: …" (2025–2026) and 1 draft, with fixed ids `00000000-0000-4000-8000-0000000009NN`, plus one sample PDF, `sermon-slides/contoh/contoh-slide-khotbah.pdf`.
- Sample #4 has no video, #7 no slides and #9 no summary.
- `remove` deletes exactly those rows and that file.
- They were added on 2026-11-19 and kept on purpose for review; run `remove` before going live.

## Admin page (/admin)

- **Separate chunk:** a code-split JS + CSS chunk, with its i18n text loaded alongside it. The public bundle does not include it. It uses its own calm shell: no Lenis, no scroll animations, `noindex`. The layout is a sidebar on wide screens and a drawer on phones.
- **Screens:**
  - Dashboard
  - Inbox (filters, search, detail with call/email links, status, notes; admin: delete, CSV export)
  - Daily Bread
  - Sermons (YouTube link parsed and previewed; "Lihat di situs" for published sermons)
  - Weekly Items
  - Announcements (week view: navigator, up/down order, copy one or all to next week as drafts; the form picks the week)
  - Duty Roster (week grid, Save, copy from last week; admin: manage roles)
  - Groups (admin)
  - Staff (admin, read-only)
- **Content forms:**
  - Indonesian (required) and English (optional) fields side by side.
  - A light formatting syntax with a live preview, rendered on the public site by `src/lib/markdown.tsx`. It builds React elements, never HTML, so content cannot inject markup. Only http(s), mailto and tel links become clickable.
  - Save draft / Publish (or Save changes / Move to draft) and admin-only Delete with confirmation.
  - A warning when leaving with unsaved changes; friendly toasts instead of raw errors.
- **Session expiry:** a request that fails with an expired session signs out locally, `/login` opens, and after signing in the user returns to the same admin page.
- **Code:** data access in `src/data/admin/*` (CRUD, inbox, roster, groups, staff, uploads with progress via XHR), hooks with cache invalidation in `src/data/admin/hooks.ts`, UI in `src/admin/*`.

## Frontend data layer

- `src/lib/supabase.ts`: the one client. `src/types/database.ts`: generated types.
- `src/data/*.ts`: one function per resource (`getLatestSermon`, `getNextWeeklyItem`, `getCurrentDailyBread`, `getDailyBreadByDate`, `listDailyBread`, `listGroups`, `listAnnouncementWeeks`, `listAnnouncementsForWeek`, `getAnnouncement`, `listDailyBreadDates`, `listSermons` (search + year + pages of 10), `listSermonYears`, `getSermonBySlug`, `getSermonNeighbours`, `getFileSize` (HEAD for the slide size), `getRoster`, `submitForm`, plus the auth helpers). Pages never import Supabase.
- `src/data/queries.ts`: TanStack Query hooks with loading, error (with retry) and empty states.
- The build prerenders the homepage with real data (`scripts/prerender.mjs`), so it is complete without JavaScript. The browser refreshes it on load. If the database is unreachable at build time, the build still succeeds and the data loads in the browser.

### Forms

`submitForm(type, payload)` (`src/data/forms.ts`):
- inserts into `form_submissions`
- uses a hidden honeypot field: if it's filled, the form pretends to succeed and saves nothing
- throttles in the browser: one submission per form type per 30 seconds
- records `consented_at` next to the consent line "Staff will contact you using these details"
- never shows raw database errors to the user

## Migrations and seed

Files:
- `supabase/migrations/20261117100000_core_schema.sql`: enums, tables, constraints, triggers
- `supabase/migrations/20261117100100_rls.sql`: helper functions, grants, policies
- `supabase/migrations/20261117100200_storage.sql`: buckets and storage policies
- `supabase/migrations/20261117100300_harden_policies.sql`: helpers moved to the `private` schema, one SELECT policy per role
- `supabase/migrations/20261117120000_roles.sql`: editor/admin rules, inbox column privileges, `handled_by` trigger, 15 MB audio
- `supabase/migrations/20261118090000_church_services.sql`: church services, times, Sunday-protection triggers, `save_church_service`, seed
- `supabase/migrations/20261118120000_announcement_weeks.sql`: announcements `week_start` + `sort_order` (backfill, Monday CHECK, index), `announcement_weeks`, `reorder_announcements`, `copy_announcements_to_next_week`
- `supabase/migrations/20261118130000_announcement_order.sql`: renumbers `sort_order` 1..n per week; trigger that appends new or moved announcements at the end of their week
- `supabase/migrations/20261118140000_announcement_weeks_sunday.sql`: weeks start on Sunday: Sunday CHECK, backfill, renumbered order, new default
- `supabase/migrations/20261119090000_sunday_sermons_cta.sql`: Sunday button → /sermons; the trigger also locks the fixed row's CTA for app users
- `supabase/seed.sql`: the homepage mock content plus sample daily bread, announcements and roster. Dates are relative to today, all text is marked "Contoh / Sample", and a few `draft` rows exist so the RLS check has something to hide. Safe to re-run.

Commands (Supabase CLI, project already linked):

```bash
supabase db push --remote --dry-run --include-seed   # preview
supabase db push --remote --include-seed             # apply migrations + seed
npm run db:types                                     # regenerate src/types/database.ts
npm run db:check                                     # RLS smoke test as an anonymous visitor
```

New schema changes go in a new timestamped file in `supabase/migrations/`. Never edit a migration that has already been pushed. `supabase/config.toml` is for local development only. Do not run `supabase config push` without reviewing it, because it overwrites hosted auth settings.

## Manual steps (dashboard)

1. **Disable sign-ups:** Authentication → Sign In / Providers → turn off "Allow new users to sign up". `npm run db:check` verifies this.
2. **Create a staff user:** Authentication → Users → Add user → email + password, with "Auto confirm" ticked.
3. **Make them admin:** SQL Editor:
   ```sql
   insert into public.staff_users (user_id, full_name, role)
   select id, 'Your Name', 'admin' from auth.users where email = 'you@example.com';
   ```
4. **Vercel:** add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` to the project environment variables.
5. **Editors:** register them the same way with `role = 'editor'`.
6. **Leaked-password protection** (Authentication → Policies/Settings, where your plan offers it) is recommended by Supabase's advisor.
7. **Staff email notifications** for new form submissions are build step 5 (not done yet).
