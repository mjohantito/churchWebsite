import { createContext, useContext, useEffect, useMemo, useRef, type ReactNode, type RefObject } from 'react';
import { useLocation } from 'react-router-dom';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

if (typeof window !== 'undefined') gsap.registerPlugin(ScrollTrigger);

export const REDUCED_QUERY = '(prefers-reduced-motion: reduce)';
export const MOTION_OK_QUERY = '(prefers-reduced-motion: no-preference)';

export function prefersReducedMotion() {
  return typeof window !== 'undefined' && window.matchMedia(REDUCED_QUERY).matches;
}

/* ------------------------------------------------------------------ */
/* Lenis: the ONLY smooth-scroll engine.                              */
/* Driven by GSAP's ticker so Lenis and ScrollTrigger share one clock. */
/* ------------------------------------------------------------------ */

interface ScrollApi {
  lock: () => void;
  unlock: () => void;
  scrollToTop: () => void;
  scrollToElement: (el: HTMLElement) => void;
}

const ScrollContext = createContext<ScrollApi | null>(null);

export function SmoothScrollProvider({ children }: { children: ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);
  const lockCount = useRef(0);
  const location = useLocation();

  useEffect(() => {
    const media = window.matchMedia(REDUCED_QUERY);
    let tick: ((time: number) => void) | null = null;

    const start = () => {
      if (lenisRef.current || media.matches) return;
      const lenis = new Lenis({ autoRaf: false, lerp: 0.09, smoothWheel: true });
      lenis.on('scroll', ScrollTrigger.update);
      tick = (time: number) => lenis.raf(time * 1000);
      gsap.ticker.add(tick);
      gsap.ticker.lagSmoothing(0);
      lenisRef.current = lenis;
      if (lockCount.current > 0) lenis.stop();
    };

    const stop = () => {
      if (tick) gsap.ticker.remove(tick);
      tick = null;
      lenisRef.current?.destroy();
      lenisRef.current = null;
      gsap.ticker.lagSmoothing(500, 33);
    };

    const onChange = () => (media.matches ? stop() : start());
    start();
    media.addEventListener('change', onChange);

    // Re-measure triggers once webfonts and late media have settled.
    const refresh = () => ScrollTrigger.refresh();
    void document.fonts?.ready.then(refresh);
    window.addEventListener('load', refresh);

    return () => {
      media.removeEventListener('change', onChange);
      window.removeEventListener('load', refresh);
      stop();
    };
  }, []);

  // New route: start at the top.
  useEffect(() => {
    if (lenisRef.current) lenisRef.current.scrollTo(0, { immediate: true });
    else window.scrollTo(0, 0);
    requestAnimationFrame(() => ScrollTrigger.refresh());
  }, [location.pathname]);

  const api = useMemo<ScrollApi>(() => ({
    lock() {
      lockCount.current += 1;
      lenisRef.current?.stop();
      document.documentElement.classList.add('scroll-locked');
    },
    unlock() {
      lockCount.current = Math.max(0, lockCount.current - 1);
      if (lockCount.current === 0) {
        lenisRef.current?.start();
        document.documentElement.classList.remove('scroll-locked');
      }
    },
    scrollToTop() {
      if (lenisRef.current) lenisRef.current.scrollTo(0);
      else window.scrollTo({ top: 0 });
    },
    scrollToElement(el) {
      if (lenisRef.current) lenisRef.current.scrollTo(el, { offset: -88 });
      else el.scrollIntoView();
    },
  }), []);

  return <ScrollContext.Provider value={api}>{children}</ScrollContext.Provider>;
}

export function useScroll() {
  const ctx = useContext(ScrollContext);
  if (!ctx) throw new Error('useScroll must be used inside SmoothScrollProvider');
  return ctx;
}

/* ------------------------------------------------------------------ */
/* Section reveal: split heading words + [data-reveal] items.         */
/* Content is fully visible in the HTML; GSAP only sets "from" states  */
/* after mount, and only when motion is allowed.                      */
/* ------------------------------------------------------------------ */

export function useSectionReveal(scope: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = scope.current;
    if (!root) return;
    const mm = gsap.matchMedia();

    mm.add(MOTION_OK_QUERY, () => {
      const heading = root.querySelector<HTMLElement>('[data-split]');
      if (heading) {
        const words = heading.querySelectorAll('[data-word]');
        const script = heading.querySelector('[data-script]');
        const tl = gsap.timeline({
          scrollTrigger: { trigger: heading, start: 'top 85%', once: true },
        });
        tl.from(words, { yPercent: 110, duration: 0.9, ease: 'power3.out', stagger: 0.06 });
        if (script) {
          tl.fromTo(
            script,
            { clipPath: 'inset(-30% 100% -30% 0%)' },
            { clipPath: 'inset(-30% 0% -30% 0%)', duration: 1, ease: 'power2.inOut', clearProps: 'clipPath' },
            '-=0.45',
          );
        }
      }

      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((el) => {
        gsap.from(el, {
          opacity: 0,
          y: 24,
          duration: 0.9,
          ease: 'power2.out',
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        });
      });
    });

    return () => mm.revert();
  }, [scope]);
}

export { gsap, ScrollTrigger };
