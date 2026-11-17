# Setia Bakti Baptist Church Website — Plan v3.2

Goal: onboard new members and serve existing member needs. Public site open to everyone, bilingual (ID/EN), staff-editable weekly content. Build happens separately in VS Code with a Claude agent; this doc is planning only.

## Church facts

- Name: Setia Bakti Baptist Church
- Address: Jl. Letjend Suprapto No.12, Burengan, Kec. Pesantren, Kota Kediri, Jawa Timur 64131
- Sunday services: 08.15 and 18.15 WIB
- Wednesday Night Prayer: 18.15 WIB
- Scripture: Roma 15:7 (text to be pasted from the church's preferred translation)
- Domain: none for now (not needed yet)
- All service times live in ONE data file in the code, and every page reads from it.

## Decisions so far

- Language: Indonesian + English toggle (default ID)
- Access: public site for everyone, login for staff only (no member accounts)
- Content updates: church staff via a simple admin page
- Forms: save submissions (including the person's phone number and email) in the database. Staff contact people manually. No WhatsApp integration. Staff get an email notification (staff email address TBD).
- Duty roster: one weekly table
- Daily bread: posted every day, audio + text
- Announcements (Pengumuman): posted by many local groups (KPW and others, local group worship services), not every week, so filter by group and show newest first
- Homepage section 4 groups: Kids, Students, Youth, Young Adults, Adults
- Mood: warm modern editorial + calm and reverent
- Media: placeholders for now (photos, logo, YouTube sermon, daily bread audio). Real slides and summary text will be supplied for sermons.
- Brand: black and white monochrome plus ONE accent, olive sage #5C6B4A (decided 2026-11-17). Defined once in src/index.css (`--accent`); `--accent-tint`, `--accent-strong` and `--on-accent` derive from it. Contrast on paper: accent 5.42:1, accent-strong 7.46:1, white on accent 5.74:1. Used sparingly, only for: the "Hari ini / Today" label, audio controls, active filter chips, announcement group tags, link underlines and hover, focus rings, and script accent words (accent-strong). Headlines, buttons and large backgrounds stay monochrome; no section is tinted.
- Page pattern for content with history (Daily Bread, Pengumuman): one featured card (accent tint + 1px accent border) for the current item, and the archive below in its own full-width band (slightly darker paper). Shared components: FeaturedCard, ArchiveSection.
- Typography rule: ONE display typeface (the heavy uppercase face used in the hero headline) is used for the hero headline, the "SETIA BAKTI" wordmark, section display headings such as "COME AND WORSHIP", and every page title. Script face only for accent words.

## Reference traits (user's reference site, high-level only, not to be copied)

- Hero: split layout. Big heavy uppercase headline with one oversized script word, short paragraph, two buttons on the left; arch-framed black-and-white photo on the right. Paper-textured off-white background, lots of whitespace.
- "Why us" section: centered heading, then three columns: sticky label on the left, stacked rounded photos in the center, script subhead + short paragraph on the right.
- Typography: heavy grotesque caps + brush script accent + clean body sans.
- We take the pacing, whitespace and type pairing. Our own identity, fonts, copy and imagery.
- Reference screenshots live in the repo at docs/reference/.

## Art direction (awwwards-sites skill)

- Visual thesis: a quiet, light-filled sanctuary rendered as a page. Paper-white background, heavy caps headlines with one script word, arch window motif (echoes church architecture), slow reverent motion.
- Hero focal asset: arch-framed monochrome congregation or sanctuary photo (labelled placeholder with fixed aspect ratio until the real photo arrives).
- Type: heavy grotesque caps for headlines, brush-script accent word, clean sans body. Must support ID and EN well.
- Color: monochrome (ink, paper, grays) plus one accent token, swappable in one place.
- Motion: GSAP word-by-word heading reveals and hero intro. Lenis as the single smooth-scroll engine, wired to ScrollTrigger. All motion bypassed under prefers-reduced-motion.
- Three.js: not used.
- Assets: no hand-drawn SVG illustrations. Real photos only, with alt text and fallbacks. Solar icons via Iconify. No fake testimonials, avatars or logos.

## Homepage

1. Hero: welcome, scripture (Roma 15:7), CTAs "I'm new" and "Need prayer" (each opens a form)
2. Service cards (carousel): Sunday Service (next Sunday's material), Wednesday Night Prayer (next prayer list), Choir (join form)
3. Most recent sermon: YouTube embed + slides + summary
4. "There's a place for you": three-column layout for Kids, Students, Youth, Young Adults, Adults
5. Footer: other pages, contact, service times, address and map link, language toggle

## Other pages

- Daily Bread (audio + text, daily)
- Church Services
- Baptisan (info + registration form)
- Pengumuman (filterable by group)
- Jadwal Petugas Ibadah (one weekly table)
- Contact Us

## Forms (saved to database, staff emailed)

New member, Prayer request, Choir sign-up, Baptism registration, Contact

## Proposed stack

React + Vite + TypeScript, Tailwind CSS, react-i18next, GSAP + Lenis, Supabase (Postgres, Auth for staff, Storage), Vercel hosting.
Admin page: staff login, then manage sermons, daily bread, announcements, roster, service cards, prayer list, and a form inbox.

## Daily bread audio hosting options

- Supabase Storage (recommended to start): same system as the rest of the site, plays directly in the page, upload from the admin page. Compress to mono MP3 and check plan limits as the library grows.
- Cloudflare R2: very cheap, no download fees, good if audio grows large.
- Podcast host (e.g. Spotify for Creators): free, members can also listen in a podcast app, but less control.
- Google Drive: not recommended for streaming.

## Build order

1. Homepage only (frontend, mock data, form UI with stub submit) — DONE, with a revision pass for reference layout, typography and times
2. Other pages (frontend, mock data, stub forms): partly done. Daily Bread, Pengumuman and Jadwal Petugas Ibadah were built with step 3 on real data. Church Services, Baptisan and Contact Us are still "Coming soon" stubs.
3. Supabase: tables, form submissions, staff auth — DONE (see docs/backend-plan.md)
4. Admin page — DONE (/admin, roles admin + editor; see docs/backend-plan.md)
5. Email notification, deploy
   - 5a. Deploy preparation (Vercel config, security headers, SEO, robots/sitemap, env checks) — DONE (see docs/deploy.md)
   - 5b. Staff email notifications for new form submissions — POSTPONED until we have a domain (needed for a verified sending address)
   - 5c. First production deploy and custom domain

## Open items

- Staff email address for notifications
- Logo (placeholder wordmark until then)
- Domain (later)
