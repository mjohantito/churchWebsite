import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SplitHeading } from '../components/SplitHeading';
import { Icon } from '../components/Icon';
import { useOpenForm } from '../components/forms/FormDialog';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { CHURCH_INFO } from '../data/churchInfo';
import { useNextWeeklyItem } from '../data/queries';
import type { WeeklyKind } from '../data/types';

// Card order and content type are fixed; times come from churchInfo, weekly content from the database.
const CARDS = ['sunday', 'prayer', 'choir'] as const;
type CardKind = (typeof CARDS)[number];
import { useLocalized } from '../lib/useLocalized';
import { renderInline } from '../lib/markdown';
import { prefersReducedMotion, useSectionReveal } from '../lib/motion';

export function Services() {
  const { t } = useTranslation();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useSectionReveal(section);


  const updateEdges = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    setEdges({ start: el.scrollLeft <= 4, end: el.scrollLeft >= max - 4 });
  }, []);

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      ro.disconnect();
    };
  }, [updateEdges]);

  const step = (dir: 1 | -1) => {
    const el = track.current;
    const card = el?.querySelector<HTMLElement>('li.service-slide');
    if (!el || !card) return;
    const gap = parseFloat(getComputedStyle(el).columnGap) || 0;
    el.scrollBy({ left: dir * (card.offsetWidth + gap), behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  };

  // Arrow keys already scroll the focused track natively; Home/End jump to the ends.
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    const el = e.currentTarget;
    const behavior = prefersReducedMotion() ? 'auto' : 'smooth';
    if (e.key === 'Home') {
      e.preventDefault();
      el.scrollTo({ left: 0, behavior });
    } else if (e.key === 'End') {
      e.preventDefault();
      el.scrollTo({ left: el.scrollWidth, behavior });
    } else if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      step(e.key === 'ArrowRight' ? 1 : -1);
    }
  };

  return (
    <section ref={section} aria-labelledby="services-heading" className="section-gap">
      <div className="page-x mx-auto max-w-page">
        <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="eyebrow" data-reveal>
              <span className="eyebrow__rule" aria-hidden="true" />
              {t('services.eyebrow')}
            </p>
            <SplitHeading
              id="services-heading"
              before={t('services.headingBefore')}
              script={t('services.headingScript')}
              className="section-heading mt-5"
            />
            <p className="mt-5 max-w-md text-lg text-stone-700" data-reveal>
              {t('services.intro')}
            </p>
          </div>
          <div className="flex gap-2" data-reveal>
            <button
              type="button"
              className="round-button"
              aria-label={t('services.prev')}
              aria-controls="service-track"
              aria-disabled={edges.start || undefined}
              onClick={() => step(-1)}
            >
              <Icon name="arrow-left-linear" className="h-5 w-5" />
            </button>
            <button
              type="button"
              className="round-button"
              aria-label={t('services.next')}
              aria-controls="service-track"
              aria-disabled={edges.end || undefined}
              onClick={() => step(1)}
            >
              <Icon name="arrow-right-linear" className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      <div
        ref={track}
        id="service-track"
        tabIndex={0}
        role="region"
        aria-label={t('services.carouselLabel')}
        aria-roledescription="carousel"
        onKeyDown={onKeyDown}
        data-lenis-prevent-horizontal
        className="service-track mt-10 sm:mt-12"
      >
        <ul className="service-list">
        {CARDS.map((kind, i) => (
          <li
            key={kind}
            className="service-slide"
            aria-roledescription="slide"
            aria-label={t('services.cardOf', { current: i + 1, total: CARDS.length })}
          >
            <ServiceCard kind={kind} />
          </li>
        ))}
        </ul>
      </div>

    </section>
  );
}

function CardShell({ tag, icon, title, children }: { tag: string; icon: string; title: string; children: ReactNode }) {
  return (
    <article className="service-card">
      <div className="flex items-center justify-between">
        <span className="tag">{tag}</span>
        <span className="grid h-11 w-11 place-items-center rounded-full border border-stone-300" aria-hidden="true">
          <Icon name={icon} className="h-5 w-5" />
        </span>
      </div>
      <h3 className="mt-8 font-display text-[2rem] sm:text-[2.4rem]">
        {title}
      </h3>
      <div className="mt-6 flex flex-1 flex-col">{children}</div>
    </article>
  );
}

function Times({ label, times }: { label: string; times: readonly string[] | null }) {
  const { time } = useLocalized();
  if (!times || times.length === 0) return null;
  return (
    <div>
      <p className="mini-label">{label}</p>
      <ul className="mt-2 flex flex-wrap gap-2">
        {times.map((value) => (
          <li key={value} className="time-chip">
            <Icon name="clock-circle-linear" className="h-4 w-4" />
            {time(value)}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Weekly block inside a card: loading / error / empty / data states. */
function WeeklyBlock({ kind, label, emptyText, list }: { kind: WeeklyKind; label: string; emptyText: string; list: boolean }) {
  const { pick, formatDate } = useLocalized();
  const q = useNextWeeklyItem(kind);
  return (
    <div className="card-block mt-auto">
      <p className="mini-label">{label}</p>
      {q.isPending ? (
        <Loading lines={3} className="mt-3" />
      ) : q.isError ? (
        <LoadError onRetry={() => void q.refetch()} className="mt-3" />
      ) : !q.data ? (
        <Empty className="mt-2">{emptyText}</Empty>
      ) : (
        <>
          <p className="mt-2 text-sm text-stone-600">
            <time dateTime={q.data.service_date}>{formatDate(q.data.service_date)}</time>
          </p>
          {list ? (
            <ul className="mt-3 space-y-2">
              {q.data.lines.map((item, i) => (
                <li key={i} className="flex gap-3 leading-snug">
                  <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                  <span>{renderInline(pick(item))}</span>
                </li>
              ))}
            </ul>
          ) : (
            <>
              <p className="mt-2 text-lg font-medium leading-snug">{pick(q.data.title)}</p>
              {q.data.lines.map((line, i) => (
                <p key={i} className="mt-2 flex items-center gap-2 text-sm text-stone-700">
                  <Icon name="book-2-linear" className="h-4 w-4 shrink-0" />
                  <span>{renderInline(pick(line))}</span>
                </p>
              ))}
            </>
          )}
          {q.data.file_url && (
            <a href={q.data.file_url} className="text-link mt-3" target="_blank" rel="noopener noreferrer">
              <Icon name="download-minimalistic-linear" className="h-4 w-4" />
              {pick(q.data.title)}
            </a>
          )}
        </>
      )}
    </div>
  );
}

function ServiceCard({ kind }: { kind: CardKind }) {
  const { t } = useTranslation();
  const openForm = useOpenForm();

  if (kind === 'sunday') {
    return (
      <CardShell tag={t('services.sunday.tag')} icon="calendar-linear" title={t('services.sunday.title')}>
        <Times label={t('services.sunday.timesLabel')} times={CHURCH_INFO.services.sunday} />
        <WeeklyBlock kind="sunday_material" label={t('services.sunday.materialLabel')} emptyText={t('services.sunday.materialEmpty')} list={false} />
      </CardShell>
    );
  }

  if (kind === 'prayer') {
    return (
      <CardShell tag={t('services.prayer.tag')} icon="hand-heart-linear" title={t('services.prayer.title')}>
        <Times label={t('services.prayer.timesLabel')} times={CHURCH_INFO.services.wednesdayPrayer} />
        <WeeklyBlock kind="prayer_list" label={t('services.prayer.listLabel')} emptyText={t('services.prayer.listEmpty')} list />
      </CardShell>
    );
  }

  return (
    <CardShell tag={t('services.choir.tag')} icon="music-note-2-linear" title={t('services.choir.title')}>
      <p className="text-lg leading-relaxed text-stone-700">{t('services.choir.invite')}</p>
      <div className="mt-auto pt-8">
        <button type="button" className="btn btn--solid" aria-haspopup="dialog" onClick={() => openForm('choir')}>
          <Icon name="users-group-rounded-linear" />
          {t('services.choir.cta')}
        </button>
      </div>
    </CardShell>
  );
}
