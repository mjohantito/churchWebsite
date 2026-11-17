import { Icon } from './Icon';

interface Props {
  /** accessible description of what the real media will show */
  alt: string;
  /** visible label, e.g. "Photo coming soon" */
  label: string;
  /** CSS aspect-ratio ('4 / 5'); omit when the parent sets the size */
  ratio?: string;
  tone?: 'light' | 'dark';
  icon?: string;
  className?: string;
}

/** Monochrome frame that is obviously a placeholder, never a fake photo. */
export function MediaPlaceholder({ alt, label, ratio, tone = 'light', icon = 'gallery-linear', className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label={alt}
      className={`media-placeholder ${tone === 'dark' ? 'media-placeholder--dark' : 'media-placeholder--light'} ${ratio ? '' : 'h-full w-full'} ${className}`}
      style={ratio ? { aspectRatio: ratio } : undefined}
    >
      <span className="media-placeholder__label" aria-hidden="true">
        <Icon name={icon} className="h-4 w-4" />
        {label}
      </span>
    </div>
  );
}
