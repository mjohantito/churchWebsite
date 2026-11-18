# Site photos (originals)

This folder holds the **original** photos. They are never served to visitors.
`npm run media` turns them into small AVIF and WebP files in `public/media/`,
which is what the site uses.

## Replace a photo

1. Put the new file here, using the **same file name** as the one you are
   replacing (for example `youth.jpg`). Any JPEG or PNG works. Use the largest
   version you have; the script makes the smaller sizes.
2. Run:

   ```bash
   npm run media
   ```

   This rebuilds every photo, prints the file sizes, and updates
   `src/lib/media.generated.json` (sizes and loading preview). It takes about
   20 seconds.
3. Check the crop on the homepage (`npm run dev`) at phone and desktop width.
   If heads are cut off, change the **focal point** (`position`) for that photo
   in `src/lib/media.ts` (for the hero: the `--hero-focus` values in
   `src/index.css`, see below). The format is `'x% y%'`: `0%` is left or top and
   `100%` is right or bottom. For example, `'50% 30%'` keeps the upper part in
   view.
4. Update the alt text (what the photo shows) in `src/i18n/id.ts` and
   `src/i18n/en.ts`, under `media`.

## Add a photo for Kids or Adults (still placeholders)

1. Put the file here, for example `kids.jpg`.
2. In `scripts/build-media.mjs`, add a line to `PHOTOS`:

   ```js
   { key: 'kids', name: 'kids', file: 'kids.jpg', widths: [480, 960, 1600], avif: 52, webp: 74 },
   ```

   (`key` must match the name in `src/lib/media.ts`: `kids` or `adults`.)
3. In `src/lib/media.ts`, change that entry's `photo: null` to `photo: photo('kids')`.
4. Run `npm run media`, write the alt text in both i18n files, and check the
   crop as above.

## Hero focal point (per screen width)

The hero photo is wide and the arch is nearly square, so the crop changes
with the screen width. Its focal points are CSS variables (`--hero-focus`)
on `.arch` in `src/index.css`, one per breakpoint. If you replace the hero
photo, check the crop at phone, tablet and desktop width, and tune those
values so nobody is cut at the arch edge.

All photos are shown in full colour (sRGB); there is no black-and-white filter.

## Notes

- Camera and location metadata (EXIF and GPS) are removed from the generated
  files. The originals here still contain it, so think twice before sharing
  this folder.
- These originals are large (2 to 4 MB each). Keeping them in git is fine but
  makes the repository bigger. You can also keep them outside git and copy
  them here when you need to rebuild.
- Only use photos the church has permission to publish, especially photos of
  children.
