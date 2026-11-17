import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { SplitHeading } from '../components/SplitHeading';
import { Icon } from '../components/Icon';
import { useOpenForm } from '../components/forms/FormDialog';
import { nextPrayerList, nextSundayMaterial, serviceCards } from '../data/mock';
import type { ServiceCardRow } from '../data/types';
import { useLocalized } from '../lib/useLocalized';
import { prefersReducedMotion, useSectionReveal } from '../lib/motion';

export function Services() {
  const { t } = useTranslation();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useSectionReveal(section);

  const cards = [...serviceCards].filter((c) => c.is_published).sort((a, b) => a.sort_order - b.sort_order);

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
    const card = el?.querySelector<HTMLElement>('li');
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
        {cards.map((card, i) => (
          <li
            key={card.id}
            className="service-slide"
            aria-roledescription="slide"
            aria-label={t('services.cardOf', { current: i + 1, total: cards.length })}
          >
            <ServiceCard card={card} />
          </li>
        ))}
        </ul>
      </div>

      <p className="page-x mx-auto mt-5 max-w-page text-sm text-stone-500">{t('services.sampleNote')}</p>
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

function Times({ label, times }: { label: string; times: string[] | null }) {
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

function ServiceCard({ card }: { card: ServiceCardRow }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const openForm = useOpenForm();

  if (card.kind === 'sunday') {
    const m = nextSundayMaterial;
    return (
      <CardShell tag={t('services.sunday.tag')} icon="calendar-linear" title={t('services.sunday.title')}>
        <Times label={t('services.sunday.timesLabel')} times={card.times} />
        <div className="card-block mt-auto">
          <p className="mini-label">{t('services.sunday.materialLabel')}</p>
          <p className="mt-2 text-sm text-stone-600">
            <time dateTime={m.service_date}>{formatDate(m.service_date)}</time>
          </p>
          <p className="mt-2 text-lg font-medium leading-snug">{pick(m.theme)}</p>
          <p className="mt-2 flex items-center gap-2 text-sm text-stone-700">
            <Icon name="book-2-linear" className="h-4 w-4" />
            <span>
              {t('services.sunday.readingLabel')}: {pick(m.scripture_ref)}
            </span>
          </p>
        </div>
      </CardShell>
    );
  }

  if (card.kind === 'prayer') {
    const p = nextPrayerList;
    return (
      <CardShell tag={t('services.prayer.tag')} icon="hand-heart-linear" title={t('services.prayer.title')}>
        <Times label={t('services.prayer.timesLabel')} times={card.times} />
        <div className="card-block mt-auto">
          <p className="mini-label">{t('services.prayer.listLabel')}</p>
          <p className="mt-2 text-sm text-stone-600">
            <time dateTime={p.prayer_date}>{formatDate(p.prayer_date)}</time>
          </p>
          <ul className="mt-3 space-y-2">
            {p.items.map((item, i) => (
              <li key={i} className="flex gap-3 leading-snug">
                <span className="mt-[0.55em] h-1 w-1 shrink-0 rounded-full bg-ink" aria-hidden="true" />
                {pick(item)}
              </li>
            ))}
          </ul>
        </div>
      </CardShell>
    );
  }

  return (
    <CardShell tag={t('services.choir.tag')} icon="music-note-2-linear" title={t('services.choir.title')}>
      <p className="text-lg leading-relaxed text-stone-700">{t('services.choir.invite')}</p>
      <div className="mt-auto pt-8">
        <button type="button" className="btn btn--solid" aria-haspopup="dialog" onClick={() => openForm('choir_signup')}>
          <Icon name="users-group-rounded-linear" />
          {t('services.choir.cta')}
        </button>
      </div>
    </CardShell>
  );
}
