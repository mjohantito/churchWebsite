import { formatWeekRange } from '../lib/week';
import { useLocalized } from '../lib/useLocalized';
import { Icon } from './Icon';

/** formatWeekRange in the current language: "15–21 Nov 2026" (Sunday to Saturday). */
export function useWeekRange() {
  const { lang } = useLocalized();
  return (weekStart: string) => formatWeekRange(weekStart, lang);
}

type Props = {
  week: string;
  thisWeek: string;
  /** Target of the previous / next arrow; null = disabled (bound reached). */
  prev: string | null;
  next: string | null;
  onGo: (weekStart: string) => void;
  labels: { group: string; prev: string; next: string; thisWeek: string };
  className?: string;
};

/**
 * Previous / next week arrows around the Sunday–Saturday range, plus a
 * "this week" button when another week is shown. Used on /pengumuman
 * (the admin week view reuses useWeekRange).
 */
export function WeekNav({ week, thisWeek, prev, next, onGo, labels, className = '' }: Props) {
  const range = useWeekRange()(week);
  return (
    <div className={`week-nav ${className}`} role="group" aria-label={labels.group}>
      <button type="button" className="round-button" aria-label={labels.prev} aria-disabled={!prev || undefined}
        onClick={() => prev && onGo(prev)}>
        <Icon name="arrow-left-linear" className="h-5 w-5" />
      </button>
      <p className="week-nav__range" aria-live="polite">
        <time dateTime={week}>{range}</time>
      </p>
      <button type="button" className="round-button" aria-label={labels.next} aria-disabled={!next || undefined}
        onClick={() => next && onGo(next)}>
        <Icon name="arrow-right-linear" className="h-5 w-5" />
      </button>
      {week !== thisWeek && (
        <button type="button" className="week-nav__today" onClick={() => onGo(thisWeek)}>
          {labels.thisWeek}
        </button>
      )}
    </div>
  );
}
