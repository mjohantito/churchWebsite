import { useEffect, useMemo, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Icon } from './Icon';
import { addDays } from '../lib/dates';
import { addWeeks, getWeekStart, weekDays } from '../lib/week';
import { prefersReducedMotion } from '../lib/motion';
import { useLocalized } from '../lib/useLocalized';

type Props = {
  /** The open date (YYYY-MM-DD), or null while unknown. */
  selected: string | null;
  /** Today in Asia/Jakarta. */
  today: string;
  /** Dates that have a published entry (any order). */
  available: readonly string[];
  onSelect: (iso: string) => void;
};

const SWIPE_MIN = 48; // px of horizontal travel that changes the week

const utc = (iso: string) => new Date(`${iso}T00:00:00Z`);

/**
 * Week-strip calendar (Daily Bread, below 1024px). Sunday to Saturday
 * (src/lib/week.ts), dates in Asia/Jakarta. Swipe or the
 * round buttons change the week; days with an entry carry a dot and are
 * selectable; empty and future days are dimmed (aria-disabled). Never goes
 * before the week of the earliest entry or past the current week.
 */
export function WeekCalendar({ selected, today, available, onSelect }: Props) {
  const { t } = useTranslation();
  const { lang } = useLocalized();
  const locale = lang === 'id' ? 'id-ID' : 'en-GB';

  const has = useMemo(() => new Set(available), [available]);
  const maxWeek = getWeekStart(today);
  const minWeek = useMemo(() => {
    const earliest = available.reduce<string | null>((min, d) => (min === null || d < min ? d : min), null);
    return earliest && earliest < maxWeek ? getWeekStart(earliest) : maxWeek;
  }, [available, maxWeek]);
  const clamp = (w: string) => (w < minWeek ? minWeek : w > maxWeek ? maxWeek : w);

  const [week, setWeek] = useState(() => getWeekStart(selected ?? today));
  const [dir, setDir] = useState<-1 | 0 | 1>(0);
  const shown = clamp(week);
  // Follow the open date (direct load, archive link, back/forward).
  useEffect(() => {
    if (!selected) return;
    setDir(0);
    setWeek(getWeekStart(selected));
  }, [selected]);

  const days = useMemo(() => weekDays(shown), [shown]);
  const canPrev = shown > minWeek;
  const canNext = shown < maxWeek;
  const isAvailable = (iso: string) => has.has(iso) && iso <= today;

  const go = (step: -1 | 1) => {
    if (step < 0 ? !canPrev : !canNext) return;
    setDir(step);
    setWeek(addWeeks(shown, step));
  };

  // ---- Title: "November 2026", or "November – Desember 2026" across months.
  const title = useMemo(() => {
    const first = utc(days[0]);
    const last = utc(days[6]);
    const f = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat(locale, { ...o, timeZone: 'UTC' });
    if (first.getUTCMonth() === last.getUTCMonth()) return f({ month: 'long', year: 'numeric' }).format(first);
    if (first.getUTCFullYear() === last.getUTCFullYear())
      return `${f({ month: 'long' }).format(first)} – ${f({ month: 'long', year: 'numeric' }).format(last)}`;
    return `${f({ month: 'long', year: 'numeric' }).format(first)} – ${f({ month: 'long', year: 'numeric' }).format(last)}`;
  }, [days, locale]);
  const fullDate = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }),
    [locale],
  );
  const initials = t('dailyBread.calendar.weekdays').split(' ');
  const weekEmpty = days.every((d) => !isAvailable(d));

  // ---- Roving focus: one tab stop in the row; arrows move between days.
  const [focusDate, setFocusDate] = useState<string | null>(null);
  const pendingFocus = useRef(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const tabStop =
    (focusDate && days.includes(focusDate) && focusDate) ||
    (selected && days.includes(selected) && selected) ||
    days.find(isAvailable) ||
    (days.includes(today) ? today : days[0]);

  useEffect(() => {
    if (!pendingFocus.current) return;
    pendingFocus.current = false;
    rowRef.current?.querySelector<HTMLButtonElement>(`[data-date="${tabStop}"]`)?.focus();
  });

  const moveFocus = (target: string) => {
    const targetWeek = getWeekStart(target);
    if (targetWeek < minWeek || targetWeek > maxWeek) return;
    if (targetWeek !== shown) {
      setDir(targetWeek > shown ? 1 : -1);
      setWeek(targetWeek);
    }
    setFocusDate(target);
    pendingFocus.current = true;
  };

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    const current = (e.target as HTMLElement).dataset.date;
    if (!current) return;
    const moves: Record<string, () => string> = {
      ArrowLeft: () => addDays(current, -1),
      ArrowRight: () => addDays(current, 1),
      Home: () => days[0],
      End: () => days[6],
      PageUp: () => addDays(current, -7),
      PageDown: () => addDays(current, 7),
    };
    const next = moves[e.key];
    if (!next) return;
    e.preventDefault();
    moveFocus(next());
  };

  // ---- Swipe / drag (pointer). touch-action: pan-y keeps vertical scroll native.
  const drag = useRef<{ id: number; x: number; y: number; dx: number; active: boolean } | null>(null);
  const suppressClick = useRef(false);
  const [offset, setOffset] = useState(0);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    suppressClick.current = false; // a touch swipe fires no click to consume the flag
    drag.current = { id: e.pointerId, x: e.clientX, y: e.clientY, dx: 0, active: false };
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    const dx = e.clientX - d.x;
    const dy = e.clientY - d.y;
    if (!d.active) {
      if (Math.abs(dx) < 8 || Math.abs(dx) < Math.abs(dy)) return;
      d.active = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    d.dx = dx;
    if (prefersReducedMotion()) return; // no sliding: switch on release only
    const blocked = (dx > 0 && !canPrev) || (dx < 0 && !canNext);
    setOffset(blocked ? dx * 0.25 : dx);
  };
  const endDrag = (e: PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    drag.current = null;
    if (!d || d.id !== e.pointerId || !d.active) return;
    suppressClick.current = true; // a drag is not a tap
    setOffset(0);
    if (d.dx <= -SWIPE_MIN) go(1);
    else if (d.dx >= SWIPE_MIN) go(-1);
  };

  return (
    <div className="week-cal" role="group" aria-label={t('dailyBread.calendar.label')}>
      <div className="week-cal__head">
        <button type="button" className="week-cal__arrow" aria-label={t('dailyBread.calendar.prevWeek')}
          aria-disabled={!canPrev || undefined} onClick={() => go(-1)}>
          <Icon name="alt-arrow-left-linear" className="h-5 w-5" />
        </button>
        <p className="week-cal__title" aria-live="polite">{title}</p>
        <button type="button" className="week-cal__arrow" aria-label={t('dailyBread.calendar.nextWeek')}
          aria-disabled={!canNext || undefined} onClick={() => go(1)}>
          <Icon name="alt-arrow-right-linear" className="h-5 w-5" />
        </button>
      </div>

      <div
        className="week-cal__viewport"
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={(e) => {
          if (!suppressClick.current) return;
          suppressClick.current = false;
          e.preventDefault();
          e.stopPropagation();
        }}
      >
        <div
          key={shown}
          ref={rowRef}
          className={`week-cal__row ${dir > 0 ? 'is-from-right' : dir < 0 ? 'is-from-left' : ''}`}
          style={offset ? { transform: `translateX(${offset}px)`, animation: 'none' } : undefined}
          onKeyDown={onKeyDown}
        >
          {days.map((iso, i) => {
            const ok = isAvailable(iso);
            const isSelected = iso === selected;
            return (
              <div key={iso} className="week-cal__cell">
                <span className="week-cal__initial" aria-hidden="true">{initials[i]}</span>
                <button
                  type="button"
                  data-date={iso}
                  className="week-cal__day"
                  tabIndex={iso === tabStop ? 0 : -1}
                  aria-label={fullDate.format(utc(iso))}
                  aria-current={iso === today ? 'date' : undefined}
                  aria-pressed={isSelected}
                  aria-disabled={!ok || undefined}
                  onFocus={() => setFocusDate(iso)}
                  onClick={() => ok && !isSelected && onSelect(iso)}
                >
                  {utc(iso).getUTCDate()}
                  {ok && <span className="week-cal__dot" aria-hidden="true" />}
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {weekEmpty && <p className="week-cal__empty">{t('dailyBread.calendar.emptyWeek')}</p>}
    </div>
  );
}
