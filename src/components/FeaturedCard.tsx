import type { ReactNode } from 'react';

interface Props {
  /** id for the title, used to label the card */
  titleId: string;
  /** small line above the title: accent label, tag, date */
  eyebrow?: ReactNode;
  title: ReactNode;
  /** under the title: scripture reference, posted date… */
  meta?: ReactNode;
  /** image, audio player… */
  media?: ReactNode;
  children?: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/**
 * The main item of a page (today's devotional, the newest announcement):
 * accent-tinted card with a 1px accent border. Shared by Daily Bread and Pengumuman.
 */
export function FeaturedCard({ titleId, eyebrow, title, meta, media, children, footer, className = '' }: Props) {
  return (
    <article className={`featured-card ${className}`} aria-labelledby={titleId}>
      {eyebrow && <div className="featured-card__eyebrow">{eyebrow}</div>}
      <h2 id={titleId} className="featured-card__title font-display">{title}</h2>
      {meta && <div className="featured-card__meta">{meta}</div>}
      {media && <div className="featured-card__media">{media}</div>}
      {children && <div className="featured-card__body">{children}</div>}
      {footer && <div className="featured-card__footer">{footer}</div>}
    </article>
  );
}

/** "Hari ini / Today" style label in the accent. */
export function AccentLabel({ children }: { children: ReactNode }) {
  return (
    <span className="accent-label">
      <span className="accent-label__dot" aria-hidden="true" />
      {children}
    </span>
  );
}
