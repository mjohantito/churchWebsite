// Copies only the Solar icons the site uses into a small local JSON,
// so Iconify never fetches icons from its API at runtime.
// Add a name to ICONS, then run `npm run icons`.
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const solar = JSON.parse(readFileSync(require.resolve('@iconify-json/solar/icons.json'), 'utf8'));

const ICONS = [
  'hamburger-menu-linear', 'close-circle-linear', 'arrow-left-linear', 'arrow-right-linear',
  'arrow-right-up-linear', 'calendar-linear', 'clock-circle-linear', 'hand-heart-linear',
  'music-note-2-linear', 'map-point-linear', 'play-circle-linear', 'download-minimalistic-linear',
  'gallery-linear', 'letter-linear', 'phone-linear', 'check-circle-linear', 'danger-circle-linear',
  'refresh-linear', 'book-bookmark-linear', 'global-linear', 'users-group-rounded-linear',
  'user-plus-rounded-linear', 'book-2-linear', 'document-text-linear', 'heart-linear',
];

const out = { prefix: 'solar', width: solar.width ?? 24, height: solar.height ?? 24, icons: {} };
for (const name of ICONS) {
  const icon = solar.icons[name];
  if (!icon) throw new Error(`Unknown Solar icon: ${name}`);
  out.icons[name] = icon;
}
writeFileSync(new URL('../src/lib/solar-icons.json', import.meta.url), JSON.stringify(out));
console.log(`Wrote ${ICONS.length} Solar icons`);
