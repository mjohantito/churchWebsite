import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { MEDIA, type MediaKey } from '../lib/media';
import { ScrollTrigger } from '../lib/motion';
import { MediaPlaceholder } from './MediaPlaceholder';

interface Props {
  id: MediaKey;
  /** above the fold: load eagerly with high priority */
  eager?: boolean;
  /** fill the parent (parent sets the shape) instead of using the entry's ratio */
  fill?: boolean;
  tone?: 'light' | 'dark';
  sizes?: string;
  className?: string;
}

/**
 * Renders the real image from media.ts when `src` is set, or the labelled
 * placeholder otherwise (and as the fallback if the image fails to load).
 */
export function Media({ id, eager = false, fill = false, tone = 'light', sizes, className = '' }: Props) {
  const { t } = useTranslation();
  const entry = MEDIA[id];
  const [failed, setFailed] = useState(false);
  const alt = t(`media.${entry.altKey}`);
  const ratio = fill ? undefined : entry.ratio;

  if (!entry.src || failed) {
    return (
      <MediaPlaceholder alt={alt} label={t('media.placeholder')} ratio={ratio} tone={tone} className={className} />
    );
  }

  return (
    <img
      src={entry.src}
      alt={alt}
      sizes={sizes}
      loading={eager ? 'eager' : 'lazy'}
      decoding="async"
      // React 18 warns on camelCase fetchPriority; pass the lowercase DOM attribute
      {...{ fetchpriority: eager ? 'high' : 'auto' }}
      onLoad={() => ScrollTrigger.refresh()}
      onError={() => setFailed(true)}
      className={`block ${fill ? 'h-full w-full' : 'w-full'} object-cover ${entry.grayscale ? 'grayscale' : ''} ${className}`}
      style={{ aspectRatio: ratio, objectPosition: entry.position }}
    />
  );
}
