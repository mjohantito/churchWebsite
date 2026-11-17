# Church Website — Plan v1

Goal: onboard new members and serve existing member needs. Bilingual (ID/EN), staff-editable weekly content.

## Decisions so far

- Language: Indonesian + English toggle (default ID)
- Content updates: church staff via a simple admin page
- Mood: warm modern editorial + calm and reverent
- Media: placeholders for now (photos, logo, YouTube sermon, daily bread audio). Real slides and summary text will be supplied for sermons.
- Brand: black and white monochrome for now, with one warm accent to be decided later

## Art direction (awwwards-sites skill)

- Visual thesis: a quiet, light-filled sanctuary rendered as a page. Large serif headlines, generous whitespace, one warm accent, slow reverent motion.
- Hero focal asset: full-bleed congregation/sanctuary photo (placeholder frame with fixed aspect ratio until real photo arrives), scripture or slogan overlaid in large serif.
- Type: editorial serif for headlines (e.g. Fraunces or Cormorant), clean sans for UI and body (e.g. Inter or DM Sans). Must support Indonesian and English strings of different lengths.
- Color: monochrome (ink #111, paper #FAF8F5, grays) + one warm accent token swappable in one place.
- Motion: GSAP for word-by-word heading reveals and a hero intro. Lenis as the single smooth-scroll engine, connected to ScrollTrigger. All motion bypassed under prefers-reduced-motion.
- Three.js: not used. A shader adds nothing to a reverent, content-first site, and it would cost performance on phones.
- Assets: no hand-drawn SVG illustrations. Photos only, with alt text and fallbacks. Solar icons via Iconify. No fake testimonials, avatars or logos.

## Homepage

1. Hero: welcome, church slogan or scripture, two CTAs: "I'm new" and "Need prayer" (each opens a form)
2. Service cards (carousel): Sunday Service (next Sunday's material), Wednesday Night Prayer (next prayer list), Choir (join form)
3. Most recent sermon: YouTube embed + slides + summary
4. "There's a place for you": ministries/communities and a path into them
5. Footer: other pages, contact, service times, language toggle

## Other pages

- Daily Bread: audio (Google Drive-hosted) + text
- Church Services
- Baptisan: info + registration form
- Pengumuman: KPW and others, filterable
- Jadwal Petugas Ibadah: service duty roster
- Contact Us

## Forms (all save to the database and notify staff)

New member, Prayer request, Choir sign-up, Baptism registration, Contact

## Proposed stack

React + Vite (same as EJG), Supabase (Postgres, Auth for staff, Storage), Vercel hosting, i18n with ID/EN dictionaries. Admin page: login, then CRUD for sermons, daily bread, announcements, roster, service cards, and a form inbox.

## Open questions

- Church name, slogan/scripture, service times and address
- Where form submissions should notify staff (email, WhatsApp, or admin inbox only)
- Daily bread: one entry per day, or a weekly batch? Audio hosting on Google Drive can be flaky for streaming
- Duty roster format: weekly table, or per-person and per-role?
- Do "members" need a login, or is the site public with staff-only admin?
- Domain name
