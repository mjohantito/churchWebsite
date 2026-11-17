import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SplitHeading } from '../components/SplitHeading';
import { Media } from '../components/Media';
import { Icon } from '../components/Icon';
import { useSectionReveal } from '../lib/motion';

// Order requested: Kids, Students, Youth, Young Adults, Adults.
const GROUPS = ['kids', 'students', 'youth', 'youngAdults', 'adults'] as const;

/**
 * Desktop: three columns. A sticky label on the left, a stack of equal
 * photos in the middle, and each group's script subhead + text centred
 * beside its photo on the right. Tablet: label on top, photo | text rows.
 * Mobile: one column.
 */
export function Ministries() {
  const { t } = useTranslation();
  const section = useRef<HTMLElement>(null);
  useSectionReveal(section);

  return (
    <section ref={section} aria-labelledby="ministries-heading" className="section-gap page-x mx-auto max-w-page">
      <div className="text-center">
        <SplitHeading
          id="ministries-heading"
          before={t('ministries.headingBefore')}
          script={t('ministries.headingScript')}
          after={t('ministries.headingAfter')}
          className="section-heading"
          scriptClassName="script-word--accent"
          scriptLead
        />
        <p className="mx-auto mt-6 max-w-[30rem] text-lg leading-relaxed text-stone-700" data-reveal>
          {t('ministries.intro')}
        </p>
      </div>

      <div className="mt-16 grid gap-12 sm:mt-24 lg:grid-cols-12 lg:gap-x-10">
        <div className="lg:col-span-3">
          <p className="ministries-label" data-reveal>
            <Icon name="users-group-rounded-linear" className="h-9 w-9 shrink-0 text-accent" />
            <span>{t('ministries.label')}</span>
          </p>
        </div>

        <ol className="space-y-14 sm:space-y-10 lg:col-span-9">
          {GROUPS.map((group) => {
            const name = t(`ministries.groups.${group}.name`);
            return (
              <li key={group} className="grid items-center gap-6 sm:grid-cols-9 sm:gap-8 lg:gap-12">
                <div className="sm:col-span-5" data-reveal>
                  <Media id={group} className="rounded-[1.5rem]" sizes="(min-width: 1024px) 34vw, (min-width: 640px) 52vw, 92vw" />
                </div>
                <div className="sm:col-span-4" data-reveal>
                  <h3 className="font-script text-[2.6rem] leading-[1.1] text-ink sm:text-5xl">
                    {t(`ministries.groups.${group}.script`)}
                  </h3>
                  <p className="mt-3 max-w-[24rem] leading-relaxed text-stone-700">
                    {t(`ministries.groups.${group}.text`)}{' '}
                    <span className="text-stone-600">{t(`ministries.groups.${group}.detail`)}</span>
                  </p>
                  <Link to="/contact-us" className="text-link mt-4">
                    {t('ministries.join')}
                    <span className="sr-only"> {t('ministries.joinGroup', { group: name })}</span>
                    <Icon name="arrow-right-linear" className="h-4 w-4" />
                  </Link>
                </div>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}
