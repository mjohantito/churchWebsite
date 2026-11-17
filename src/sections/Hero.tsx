import { useEffect, useRef, type CSSProperties } from 'react';
import { Trans, useTranslation } from 'react-i18next';
import { Media } from '../components/Media';
import { Icon } from '../components/Icon';
import { useOpenForm } from '../components/forms/FormDialog';
import { gsap, MOTION_OK_QUERY } from '../lib/motion';
import { useLocalized } from '../lib/useLocalized';
import { CHURCH_INFO } from '../data/churchInfo';

/**
 * Three stacked uppercase lines + one oversized script word.
 * Placement is derived from string lengths (not measured in JS), so the
 * server-rendered / no-JS / reduced-motion layout is identical:
 * - short script word (e.g. "Hope"): sits beside the widest caps line
 * - long script word (e.g. "Pengharapan"): sits beside the last caps line
 * CSS sizes the script word with container units so it never overflows.
 */
function HeroTitle({ id }: { id: string }) {
  const { t } = useTranslation();
  const caps = t('hero.headingBefore').split(/\s+/).filter(Boolean);
  const script = t('hero.headingScript');
  const beside = script.length <= 6;
  const anchor = beside ? caps.reduce((a, b) => (b.length > a.length ? b : a), '') : caps[caps.length - 1] ?? '';
  const vars = {
    '--indent-chars': anchor.length,
    '--script-chars': script.length,
  } as CSSProperties;

  return (
    <h1
      id={id}
      aria-label={`${caps.join(' ')} ${script}`}
      data-split
      className={`hero-title ${beside ? 'hero-title--beside' : 'hero-title--under'}`}
      style={vars}
    >
      <span aria-hidden="true" className="hero-title__inner">
        {caps.map((word, i) => (
          <span key={i} className="hero-title__line">
            <span className="split-word">
              <span className="split-inner" data-word data-intro>
                {word}
              </span>
            </span>
          </span>
        ))}
        <span className="hero-title__script" data-script data-intro>
          {script}
        </span>
      </span>
    </h1>
  );
}

export function Hero() {
  const { t } = useTranslation();
  const openForm = useOpenForm();
  const { pick, times } = useLocalized();
  const root = useRef<HTMLElement>(null);

  // Composed intro + pointer parallax. The HTML is complete without this.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK_QUERY, () => {
      const q = gsap.utils.selector(el);
      const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });

      // 1. arch rises open, photo settles  2. caps lines stagger up
      // 3. copy + buttons fade up           4. script word draws in last
      tl.fromTo(
        q('[data-hero="arch"]'),
        { clipPath: 'inset(100% 0% 0% 0%)' },
        { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.5, ease: 'power3.inOut', clearProps: 'clipPath' },
        0,
      )
        .fromTo(q('[data-hero="arch-media"]'), { scale: 1.14 }, { scale: 1, duration: 2, ease: 'power2.out' }, 0)
        .fromTo(
          q('[data-word]'),
          { opacity: 1, yPercent: 110 },
          { yPercent: 0, duration: 1, ease: 'power4.out', stagger: 0.1 },
          0.1,
        )
        .fromTo(
          q('[data-hero="copy"]'),
          { opacity: 0, y: 18 },
          { opacity: 1, y: 0, duration: 0.8, stagger: 0.1 },
          0.45,
        )
        .fromTo(q('[data-hero="ring"]'), { opacity: 0 }, { opacity: 1, duration: 1.2 }, 0.8)
        .fromTo(q('[data-hero="detail"]'), { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.8 }, 1.1)
        .fromTo(
          q('[data-script]'),
          { opacity: 1, clipPath: 'inset(-40% 100% -40% -10%)' },
          { clipPath: 'inset(-40% -10% -40% -10%)', duration: 1.2, ease: 'power2.inOut', clearProps: 'clipPath' },
          0.85,
        );

      // From-states are now set inline; hand control from the CSS failsafe to GSAP.
      el.classList.add('intro-ready');

      // Additive pointer parallax: fine pointers only.
      const fine = window.matchMedia('(hover: hover) and (pointer: fine)');
      const arch = q('[data-hero="arch-wrap"]')[0];
      const ring = q('[data-hero="ring"]')[0];
      if (!fine.matches || !arch || !ring) return;

      const archX = gsap.quickTo(arch, 'x', { duration: 1.2, ease: 'power3.out' });
      const archY = gsap.quickTo(arch, 'y', { duration: 1.2, ease: 'power3.out' });
      const ringX = gsap.quickTo(ring, 'x', { duration: 1.6, ease: 'power3.out' });
      const ringY = gsap.quickTo(ring, 'y', { duration: 1.6, ease: 'power3.out' });

      let frame = 0;
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return;
        cancelAnimationFrame(frame);
        frame = requestAnimationFrame(() => {
          const rect = el.getBoundingClientRect();
          const nx = (e.clientX - rect.left) / rect.width - 0.5;
          const ny = (e.clientY - rect.top) / rect.height - 0.5;
          archX(nx * 12);
          archY(ny * 8);
          ringX(nx * -7);
          ringY(ny * -5);
        });
      };
      const reset = () => {
        cancelAnimationFrame(frame);
        archX(0);
        archY(0);
        ringX(0);
        ringY(0);
      };
      const onVisibility = () => document.hidden && reset();

      el.addEventListener('pointermove', onMove);
      el.addEventListener('pointerleave', reset);
      window.addEventListener('blur', reset);
      document.addEventListener('visibilitychange', onVisibility);
      return () => {
        cancelAnimationFrame(frame);
        el.removeEventListener('pointermove', onMove);
        el.removeEventListener('pointerleave', reset);
        window.removeEventListener('blur', reset);
        document.removeEventListener('visibilitychange', onVisibility);
      };
    });

    return () => {
      mm.revert();
      el.classList.remove('intro-ready');
    };
  }, []);

  return (
    <section ref={root} aria-labelledby="hero-heading" className="hero">
      <div className="hero__copy">
        <HeroTitle id="hero-heading" />

        <p data-hero="copy" data-intro className="hero__welcome">
          <Trans i18nKey="hero.welcome" components={{ b: <strong />, i: <em /> }} />
        </p>

        <figure data-hero="copy" data-intro className="scripture mt-7 max-w-[30rem]">
          <blockquote>
            <p>{t('scripture.text')}</p>
          </blockquote>
          <figcaption>{pick(CHURCH_INFO.scriptureReference)}</figcaption>
        </figure>

        <div data-hero="copy" data-intro className="mt-10 flex flex-wrap gap-3 sm:gap-4">
          <button type="button" className="btn btn--solid" aria-haspopup="dialog" onClick={() => openForm('new_member')}>
            {t('hero.ctaNew')}
          </button>
          <button type="button" className="btn btn--outline" aria-haspopup="dialog" onClick={() => openForm('prayer_request')}>
            {t('hero.ctaPrayer')}
          </button>
        </div>
      </div>

      <div className="hero__media">
        <div className="arch-stage">
          <div data-hero="ring" data-intro className="arch-ring" aria-hidden="true" />
          <div data-hero="arch-wrap" className="relative">
            <div data-hero="arch" data-intro className="arch">
              <div data-hero="arch-media" className="h-full w-full">
                <Media id="heroSanctuary" eager fill tone="dark" sizes="(min-width: 1024px) 55vw, 90vw" />
              </div>
            </div>
          </div>
          {/* Our one small monochrome detail where the reference had its map. */}
          <p data-hero="detail" data-intro className="arch-detail">
            <Icon name="clock-circle-linear" className="h-4 w-4 shrink-0" />
            <span>{t('hero.serviceNote', { times: times(CHURCH_INFO.services.sunday) })}</span>
          </p>
        </div>
      </div>
    </section>
  );
}
