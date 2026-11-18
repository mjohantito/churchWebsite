// ONE place for the site's photos and placeholders.
// Real photos are built from media-src/ by `npm run media` (see
// media-src/README.md); their sizes and placeholders come from
// media.generated.json. Entries without a photo render the labelled
// placeholder. Alt text lives in i18n under `media.<altKey>`.
import generated from './media.generated.json';

/**
 * Rendered width of the hero IMAGE (not the arch): the 16:9 photo covers a
 * near-square arch, so it is drawn about 1.8x wider than the arch itself.
 * Used by the <picture> and by the homepage preload (scripts/prerender.mjs).
 */
export const HERO_SIZES = '(min-width: 1024px) 82vw, 170vw';

export type MediaKey =
  | 'heroSanctuary'
  | 'kids'
  | 'students'
  | 'youth'
  | 'youngAdults'
  | 'adults';

/** Written by scripts/build-media.mjs: do not edit by hand. */
export interface GeneratedPhoto {
  /** public path without the "-<width>.<ext>" suffix, e.g. /media/youth */
  base: string;
  widths: number[];
  /** intrinsic size of the largest file (for width/height: no layout shift) */
  width: number;
  height: number;
  /** dominant colour, shown behind the blurred preview */
  color: string;
  /** tiny blurred preview as a data URI */
  lqip: string;
}

export interface MediaEntry {
  /** the built photo, or null for a labelled placeholder */
  photo: GeneratedPhoto | null;
  /** i18n key under `media.` */
  altKey: MediaKey;
  /** CSS aspect-ratio of the frame, e.g. '4 / 3' (the hero fills its arch instead) */
  ratio: string;
  /**
   * FOCAL POINT (object-position): which part of the photo stays in view when
   * the frame crops it. 'x% y%': 0% = left/top, 100% = right/bottom.
   */
  position: string;
}

const photos = generated as Partial<Record<MediaKey, GeneratedPhoto>>;
const photo = (key: MediaKey) => photos[key] ?? null;

export const MEDIA: Record<MediaKey, MediaEntry> = {
  // Landscape 16:9 in a near-square arch whose right side runs off-screen.
  // The focal point changes with the arch shape: per-breakpoint values are
  // the --hero-focus CSS variables on .arch (src/index.css).
  heroSanctuary: { photo: photo('heroSanctuary'), altKey: 'heroSanctuary', ratio: '4 / 5', position: 'var(--hero-focus, 60% 50%)' },
  kids: { photo: null, altKey: 'kids', ratio: '4 / 3', position: '50% 50%' },
  // 3:2 crowd in a 4:3 frame (sides trimmed). The crowd runs past both edges of
  // the original; 0% keeps every face on the left whole and trims the right
  // between heads (50% cut a face in half on the left). Shows the APBF logo.
  students: { photo: photo('students'), altKey: 'students', ratio: '4 / 3', position: '0% 50%' },
  // Portrait 3:4 in a 4:3 frame: keep the rows of faces (lower half), trim ceiling and feet.
  youth: { photo: photo('youth'), altKey: 'youth', ratio: '4 / 3', position: '50% 64%' },
  // 3:2 group in a 4:3 frame: centred; the outer two people's shoulders touch the edges, faces stay in.
  youngAdults: { photo: photo('youngAdults'), altKey: 'youngAdults', ratio: '4 / 3', position: '50% 50%' },
  adults: { photo: null, altKey: 'adults', ratio: '4 / 3', position: '50% 50%' },
};

/** "<base>-480.avif 480w, …" for one format. */
export function srcSet(p: GeneratedPhoto, fmt: 'avif' | 'webp'): string {
  return p.widths.map((w) => `${p.base}-${w}.${fmt} ${w}w`).join(', ');
}
