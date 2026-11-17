# Deploying to Vercel

The site is a Vite + React SPA with a Supabase backend. Vercel builds it from the GitHub repo on every push: `main` goes to production, and other branches and pull requests get preview URLs.

## What the build produces

`npm run build` runs, in order:
1. a type check
2. the Vite client build
3. a small server build
4. `scripts/prerender.mjs`, which writes the HTML files below

| File | Served for | Notes |
|---|---|---|
| `dist/index.html` | `/` | Homepage rendered with live data at build time (readable without JavaScript). The browser refreshes the data on load. |
| `dist/<route>/index.html` | `/daily-bread`, `/pengumuman`, `/jadwal-petugas`, `/church-services`, `/baptisan`, `/contact-us`, `/sermons` | Each has its own `<title>`, description and Open Graph tags for search engines and link previews. |
| `dist/spa.html` | everything else (`/daily-bread/<date>`, `/login`, `/admin/*`, unknown paths) | Empty app shell. `vercel.json` rewrites to it after checking for a real file. `/assets/*` is never rewritten, so a missing chunk returns a real 404, and the app reloads once to pick up a new deploy. |
| `dist/sitemap.xml`, `Sitemap:` line in `robots.txt` | | Only when the site URL is known (see `VITE_SITE_URL`). |

`vercel.json` also sets the security headers on every response:
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`
- `X-Frame-Options: DENY`
- `Permissions-Policy` that disables camera, microphone and geolocation

It adds `X-Robots-Tag: noindex` on `/admin` and `/login`, and long-term caching for `/assets/*`, whose file names are content-hashed.

**No Content-Security-Policy yet.** A CSP must allow YouTube embeds, the Supabase API and storage (audio and images), and inline startup scripts. Add one only after testing it on a preview deployment.

## 1. Import the project in Vercel

1. Vercel → **Add New → Project** → import the GitHub repo.
2. Framework preset: **Vite** (detected). Build command `npm run build` and output directory `dist` come from `vercel.json`. Leave the install command as default (`npm install`).
3. Node.js version: 20 or 22 (Settings → General). `package.json` declares `>=20`.
4. Add the environment variables (next section) **before** the first deploy. Without them the build stops with a clear error, by design.

## 2. Environment variables

Set them in Vercel → Settings → Environment Variables, for **Production** and **Preview**:

| Name | Value | Required |
|---|---|---|
| `VITE_SUPABASE_URL` | `https://<project-ref>.supabase.co` | yes |
| `VITE_SUPABASE_ANON_KEY` | the **publishable** key (`sb_publishable_…`) from Supabase → Project Settings → API Keys | yes |
| `VITE_SITE_URL` | the public URL once you have a custom domain, e.g. `https://example.org` | optional (when empty, Vercel's production URL is used) |
| `VITE_USE_MOCK` | leave unset | no: `true` makes the site run on mock data and forms save nothing |

Things to know:
- **All `VITE_` values are public.** They end up in the browser bundle. That is fine for the URL and the publishable key, because Row Level Security protects the data.
- **Never add the `service_role` / `sb_secret_` key** to Vercel or to any `VITE_` variable. The build refuses to run if a `VITE_` value looks like a secret key.
- **Preview deployments use the same Supabase project.** Form tests on a preview URL land in the real inbox. Use test names you can delete, or later create a second Supabase project for previews.

## 3. Supabase dashboard settings

1. **Authentication → URL Configuration:**
   - **Site URL:** your production URL, e.g. `https://<project>.vercel.app`, or the custom domain later.
   - **Redirect URLs:** add `https://<project>.vercel.app/**` and, once you have a domain, `https://<domain>/**`. Optionally add `https://*-<team>.vercel.app/**` for previews.

   Sign-in is email + password, which does not use redirects today. These settings matter for future password-reset and invite emails.
2. **Authentication → Sign In / Providers:** "Allow new users to sign up" stays **off**.
3. **Authentication → Password security:** turn on **leaked password protection** if your plan offers it. It is the only remaining Supabase advisor finding.
4. **API settings:** no CORS change is needed. The Supabase API accepts browser requests from any origin, and RLS decides what each request may do.

## 4. After the first deploy: smoke test

- `/`, `/daily-bread`, `/pengumuman`, `/jadwal-petugas`: reload each one directly, not only through the menu.
- A dated URL such as `/daily-bread/2026-11-15` loads directly.
- `/admin` sends you to `/login`, and signing in returns you to `/admin`.
- Submit a form with a test name, find it in the admin inbox, then delete it.
- Browser devtools → Network → the document response shows the four security headers.
- Paste the URL into a chat app or https://www.opengraph.xyz to check the link preview.

## Rolling back

- **Frontend (instant):** Vercel → Deployments → pick the last good deployment → **⋯ → Instant Rollback** (or `vercel rollback <deployment-url>`). Then fix forward with a new commit, or `git revert` the bad one and push.
- **Database:** Vercel does not touch the database. Supabase migrations are not rolled back automatically.
  - Before running `supabase db push`, take a backup: `supabase db dump --remote -f backup-$(date +%F).sql`, and `--data-only` for the data.
  - To undo a change, write a new migration that reverses it. Never edit a migration that has already been pushed.
  - Paid Supabase plans also have daily backups or point-in-time recovery under Database → Backups.
- **Content:** content lives in Supabase, not in the build, so a frontend rollback never loses posts.

## Local checks before pushing

```bash
npm run build                    # type check + build + prerender
npm run preview                  # serve dist/ locally (note: ignores vercel.json headers/rewrites)
npm run db:check                 # RLS as an anonymous visitor
supabase db advisors --remote    # Supabase security/performance advisors
```
