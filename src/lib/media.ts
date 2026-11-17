// ONE place to swap placeholders for real media.
// Set `src` (put files in /public/media/… or use a full URL) and the
// <Media> component renders a real <img> instead of the placeholder.
// Alt text lives in i18n under `media.<altKey>`.

export type MediaKey =
  | 'heroSanctuary'
  | 'kids'
  | 'students'
  | 'youth'
  | 'youngAdults'
  | 'adults';

export interface MediaEntry {
  src: string | null;
  /** i18n key under `media.` */
  altKey: MediaKey;
  /** CSS aspect-ratio, e.g. '4 / 5' */
  ratio: string;
  /** object-position for the crop; keep faces/focal point inside the frame */
  position: string;
  /** render in monochrome (matches the current brand) */
  grayscale: boolean;
}

export const MEDIA: Record<MediaKey, MediaEntry> = {
  heroSanctuary: { src: null, altKey: 'heroSanctuary', ratio: '4 / 5', position: '50% 40%', grayscale: true },
  kids: { src: null, altKey: 'kids', ratio: '4 / 3', position: '50% 50%', grayscale: true },
  students: { src: null, altKey: 'students', ratio: '4 / 3', position: '50% 50%', grayscale: true },
  youth: { src: null, altKey: 'youth', ratio: '4 / 3', position: '50% 50%', grayscale: true },
  youngAdults: { src: null, altKey: 'youngAdults', ratio: '4 / 3', position: '50% 50%', grayscale: true },
  adults: { src: null, altKey: 'adults', ratio: '4 / 3', position: '50% 50%', grayscale: true },
};
