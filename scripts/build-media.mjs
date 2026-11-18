// Builds the site photos from the originals in media-src/ (see media-src/README.md).
//   npm run media
// For each photo: AVIF + WebP at a few widths into public/media/, plus
// src/lib/media.generated.json with the real dimensions, a dominant colour
// and a tiny blurred preview (shown while the photo loads).
// The originals in media-src/ are never copied into public/ or the bundle.
// Output is full colour in sRGB; EXIF metadata (camera, GPS) is dropped.
// Crops are NOT baked in: the full framing is kept and the focal point is
// set in src/lib/media.ts (object-position), so it can be tuned in CSS.
import { mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const sharp = require('sharp');
const ROOT = new URL('..', import.meta.url).pathname;
const SRC = `${ROOT}media-src`;
const OUT = `${ROOT}public/media`;

// key = MediaKey in src/lib/media.ts; file = original in media-src/
const PHOTOS = [
  // Hero: shown cropped inside the arch, up to ~2x on large screens.
  { key: 'heroSanctuary', name: 'hero', file: 'heroimage.JPEG', widths: [768, 1152, 1536, 2000], avif: 60, webp: 80 },
  { key: 'students', name: 'students', file: 'student.JPEG', widths: [480, 960, 1600], avif: 52, webp: 74 },
  { key: 'youth', name: 'youth', file: 'youth.jpg', widths: [480, 960, 1600], avif: 46, webp: 68 }, // portrait: more pixels per width
  { key: 'youngAdults', name: 'young-adults', file: 'youngadults.JPEG', widths: [480, 960, 1600], avif: 52, webp: 74 },
];

const kb = (n) => `${(n / 1024).toFixed(0)} KB`;
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
const manifest = {};
const report = [];

for (const p of PHOTOS) {
  const input = `${SRC}/${p.file}`;
  // Apply EXIF orientation, convert to sRGB (e.g. iPhone Display P3) and tag the
  // output as sRGB; all other metadata (camera, GPS) is dropped. Full colour.
  const base = sharp(input).rotate().toColourspace('srgb').withIccProfile('srgb');
  const meta = await base.clone().metadata();
  const rotated = (meta.orientation ?? 1) >= 5;
  const W = rotated ? meta.height : meta.width;
  const H = rotated ? meta.width : meta.height;
  const widths = p.widths.filter((w) => w <= W);
  const files = [];
  for (const w of widths) {
    const resized = base.clone().resize({ width: w, withoutEnlargement: true });
    for (const [fmt, opts] of [['avif', { quality: p.avif, effort: 6 }], ['webp', { quality: p.webp, effort: 6 }]]) {
      const out = `${OUT}/${p.name}-${w}.${fmt}`;
      await resized.clone()[fmt](opts).toFile(out);
      files.push({ fmt, w, bytes: statSync(out).size });
    }
  }
  // Placeholders: dominant colour + a 20px-wide preview (the browser's
  // upscaling blurs it). Inlined as a data URI, a few hundred bytes.
  const { dominant } = await base.clone().stats();
  const color = `#${[dominant.r, dominant.g, dominant.b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
  const lqip = await base.clone().resize({ width: 20 }).blur(0.6).webp({ quality: 40 }).toBuffer();
  const largest = widths.at(-1);
  manifest[p.key] = {
    base: `/media/${p.name}`,
    widths,
    width: largest,
    height: Math.round((largest * H) / W),
    color,
    lqip: `data:image/webp;base64,${lqip.toString('base64')}`,
  };
  report.push({ file: p.file, original: statSync(input).size, files });
}

writeFileSync(`${ROOT}src/lib/media.generated.json`, `${JSON.stringify(manifest, null, 2)}\n`);

for (const r of report) {
  console.log(`\n${r.file}  original ${kb(r.original)}`);
  for (const f of r.files) console.log(`  ${String(f.w).padStart(4)}w ${f.fmt.padEnd(4)} ${kb(f.bytes).padStart(7)}`);
}
console.log(`\nWrote ${readdirSync(OUT).length} files to public/media/ and src/lib/media.generated.json`);
