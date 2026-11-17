import type { ReactNode } from 'react';
import { SplitHeading } from './SplitHeading';

interface Props {
  /** Page title in the display face (uppercase caps). */
  title: string;
  /** Optional brush-script accent word. */
  script?: string;
  /** Where the script word sits: after the title (default) or before it. */
  scriptPosition?: 'after' | 'before';
  /** Optional short line above the title. */
  eyebrow?: string;
  /** Optional short intro paragraph under the title. */
  intro?: ReactNode;
  /** Extra content under the intro (buttons, filters). */
  children?: ReactNode;
  id?: string;
}

/**
 * Shared header for every page (Daily Bread, Church Services, Baptisan,
 * Pengumuman, Jadwal Petugas Ibadah, Contact Us, and the "Coming soon" stubs).
 * The title always uses the single display face via SplitHeading.
 */
export function PageHeader({ title, script, scriptPosition = 'after', eyebrow, intro, children, id = 'page-title' }: Props) {
  return (
    <header className="page-x mx-auto max-w-page pt-16 sm:pt-24">
      {eyebrow && (
        <p className="eyebrow">
          <span className="eyebrow__rule" aria-hidden="true" />
          {eyebrow}
        </p>
      )}
      <SplitHeading
        as="h1"
        id={id}
        before={scriptPosition === 'after' ? title : ''}
        after={scriptPosition === 'before' ? title : undefined}
        script={script}
        scriptLead={scriptPosition === 'before' && Boolean(script)}
        className={`page-title ${eyebrow ? 'mt-6' : ''}`}
      />
      {intro && <p className="mt-6 max-w-[34rem] text-lg leading-relaxed text-stone-700">{intro}</p>}
      {children && <div className="mt-10">{children}</div>}
    </header>
  );
}
