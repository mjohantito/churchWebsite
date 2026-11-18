import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MEDIA, srcSet, type MediaKey } from '../lib/media';
import { ScrollTrigger } from '../lib/motion';
import { MediaPlaceholder } from './MediaPlaceholder';

interface Props {
  id: MediaKey;
  /** above the fold: load eagerly with high priority */
  eager?: boolean;
  /** fill the parent (parent sets the shape) instead of using the entry's ratio */
  fill?: boolean;
  tone?: 'light' | 'dark';
  /** rendered width of the IMAGE (not the frame) for srcset selection */
  sizes?: string;
  className?: string;
}

/**
 * The built photo from media.ts as a responsive <picture> (AVIF, WebP),
 * or the labelled placeholder when there is none (and if it fails to load).
 * width/height are set so the browser reserves the space (no layout shift);
 * the dominant colour and a tiny blurred preview show until it arrives.
 */
export function Media({ id, eager = false, fill = false, tone = 'light', sizes = '100vw', className = '' }: Props) {
  const { t } = useTranslation();
  const entry = MEDIA[id];
  const [failed, setFailed] = useState(false);
  const alt = t(`media.${entry.altKey}`);
  const ratio = fill ? undefined : entry.ratio;
  const p = entry.photo;

  if (!p || failed) {
    return <MediaPlaceholder alt={alt} label={t('media.placeholder')} ratio={ratio} tone={tone} className={className} />;
  }

  const fallback = p.widths[Math.min(1, p.widths.length - 1)];
  return (
    <picture className={fill ? 'block h-full w-full' : 'block'}>
      <source type="image/avif" srcSet={srcSet(p, 'avif')} sizes={sizes} />
      <source type="image/webp" srcSet={srcSet(p, 'webp')} sizes={sizes} />
      <img
        src={`${p.base}-${fallback}.webp`}
        width={p.width}
        height={p.height}
        alt={alt}
        loading={eager ? 'eager' : 'lazy'}
        decoding={eager ? 'sync' : 'async'}
        // React 18 warns on camelCase fetchPriority; pass the lowercase DOM attribute
        {...{ fetchpriority: eager ? 'high' : 'auto' }}
        onLoad={() => ScrollTrigger.refresh()}
        onError={() => setFailed(true)}
        className={`media-img block ${fill ? 'h-full w-full' : 'h-auto w-full'} object-cover ${className}`}
        style={{
          aspectRatio: ratio,
          objectPosition: entry.position,
          backgroundColor: p.color,
          backgroundImage: `url("${p.lqip}")`,
          backgroundPosition: entry.position,
        }}
      />
    </picture>
  );
}
