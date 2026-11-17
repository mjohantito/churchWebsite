import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { SplitHeading } from '../components/SplitHeading';
import { Icon } from '../components/Icon';
import { ServiceCard } from '../components/ServiceCard';
import { useServiceList } from '../data/queries';
import { prefersReducedMotion, useSectionReveal } from '../lib/motion';

export function Services() {
  const { t } = useTranslation();
  const section = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useSectionReveal(section);
  // Services managed in /admin/services (offline copy while loading / on error).
  const { services } = useServiceList();
  const cards = services.filter((x) => x.show_on_homepage);

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
  }, [updateEdges, cards.length]);

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
        {cards.map((service, i) => (
          <li
            key={service.id}
            className="service-slide"
            aria-roledescription="slide"
            aria-label={t('services.cardOf', { current: i + 1, total: cards.length })}
          >
            <ServiceCard service={service} />
          </li>
        ))}
        </ul>
      </div>

    </section>
  );
}
