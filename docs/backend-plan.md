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
| `announcements` | Pengumuman | `group_id`, `title_*`, `body_*`, `image_path`, `status`, `published_at` (auto-set when published) |
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

## Admin page (/admin)

- **Separate chunk:** a code-split JS + CSS chunk, with its i18n text loaded alongside it. The public bundle does not include it. It uses its own calm shell: no Lenis, no scroll animations, `noindex`. The layout is a sidebar on wide screens and a drawer on phones.
- **Screens:**
  - Dashboard
  - Inbox (filters, search, detail with call/email links, status, notes; admin: delete, CSV export)
  - Daily Bread
  - Sermons (YouTube link parsed and previewed)
  - Weekly Items
  - Announcements
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
- `src/data/*.ts`: one function per resource (`getLatestSermon`, `getNextWeeklyItem`, `getCurrentDailyBread`, `getDailyBreadByDate`, `listDailyBread`, `listGroups`, `listAnnouncements`, `getRoster`, `submitForm`, plus the auth helpers). Pages never import Supabase.
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
