import { forwardRef, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';

/**
 * Secondary list under the main item: its own full-width band (slightly
 * darker paper, top divider), heading with a small accent mark, compact rows.
 * Shared by Daily Bread (archive) and Pengumuman (earlier / more announcements).
 */
export const ArchiveSection = forwardRef<HTMLHeadingElement, { id: string; title: string; children: ReactNode; footer?: ReactNode }>(
  function ArchiveSection({ id, title, children, footer }, headingRef) {
    return (
      <section id={id} aria-labelledby={`${id}-heading`} className="archive-band">
        <div className="page-x mx-auto max-w-page">
          <h2 id={`${id}-heading`} ref={headingRef} tabIndex={-1} className="archive-heading">
            <span className="archive-mark" aria-hidden="true" />
            {title}
          </h2>
          <div className="mt-5">{children}</div>
          {footer && <div className="mt-6">{footer}</div>}
        </div>
      </section>
    );
  },
);

export function ArchiveList({ children }: { children: ReactNode }) {
  return <ul className="archive-list">{children}</ul>;
}

/** One compact row: date chip + title (+ optional tag and excerpt). Min. 44px tall. */
export function ArchiveRow({
  to, chip, chipDateTime, title, tag, excerpt, current = false,
}: { to: string; chip: string; chipDateTime: string; title: string; tag?: string; excerpt?: string; current?: boolean }) {
  return (
    <li>
      <Link to={to} className="archive-row" aria-current={current ? 'page' : undefined}>
        <time className="date-chip" dateTime={chipDateTime}>{chip}</time>
        <span className="archive-row__main">
          {tag && <span className="tag tag--accent tag--sm">{tag}</span>}
          <span className="archive-row__title">{title}</span>
          {excerpt && <span className="archive-row__excerpt">{excerpt}</span>}
        </span>
        <Icon name="arrow-right-linear" className="archive-row__arrow h-4 w-4" />
      </Link>
    </li>
  );
}
