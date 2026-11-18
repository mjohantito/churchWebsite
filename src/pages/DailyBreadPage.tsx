import { useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { AudioPlayer } from '../components/AudioPlayer';
import { AccentLabel, FeaturedCard } from '../components/FeaturedCard';
import { WeekCalendar } from '../components/WeekCalendar';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useCurrentDailyBread, useDailyBreadArchive, useDailyBreadByDate, useDailyBreadDates } from '../data/queries';
import type { DailyBreadView } from '../data/types';
import { isIsoDate, jakartaToday } from '../lib/dates';
import { useLocalized } from '../lib/useLocalized';

const PAGE = 10;

/**
 * /daily-bread (today, or the latest entry) and /daily-bread/:date.
 * Below 1024px: week calendar above the devotional. From 1024px: devotional
 * on the left, sticky archive panel on the right. Never both at once (CSS).
 */
export function DailyBreadPage() {
  const { t } = useTranslation();
  const { date } = useParams<{ date?: string }>();
  const navigate = useNavigate();
  const validDate = isIsoDate(date);
  const today = jakartaToday();

  const current = useCurrentDailyBread();
  const byDate = useDailyBreadByDate(date ?? '', Boolean(date) && validDate);
  const dates = useDailyBreadDates();
  const entry = date ? byDate : current;
  const selected = date ? (validDate ? date : null) : (current.data?.entry_date ?? null);

  // While the next day loads, keep the previous devotional on screen (dimmed)
  // so the page does not collapse to a skeleton and jump.
  const lastShown = useRef<DailyBreadView | null>(null);
  if (entry.data !== undefined) lastShown.current = entry.data;
  const showing = entry.data ?? (entry.isPending ? lastShown.current : null);
  const busy = entry.isPending && showing !== null;

  return (
    <>
      <PageHeader eyebrow={t('dailyBread.eyebrow')} title={t('nav.dailyBread')} intro={t('dailyBread.intro')} />

      <div className="page-x mx-auto mt-8 max-w-page sm:mt-10">
        <div className="daily-layout">
          <div className="min-w-0">
            <div className="lg:hidden">
              <WeekCalendar
                selected={selected}
                today={today}
                available={dates.data ?? []}
                onSelect={(iso) => navigate(`/daily-bread/${iso}`, { state: { keepScroll: true } })}
              />
            </div>

            <div className="mt-6 lg:mt-0" aria-busy={busy || undefined}>
              {date && !validDate ? (
                <Empty>{t('dailyBread.invalidDate')}</Empty>
              ) : busy ? (
                <div className="is-refreshing"><Entry entry={showing!} /></div>
              ) : entry.isPending ? (
                <Loading lines={6} />
              ) : entry.isError ? (
                <LoadError onRetry={() => void entry.refetch()} />
              ) : entry.data ? (
                <Entry entry={entry.data} />
              ) : (
                <Empty>{date ? t('dailyBread.emptyDate') : t('dailyBread.empty')}</Empty>
              )}
            </div>
          </div>

          <ArchivePanel activeDate={selected} />
        </div>
      </div>
    </>
  );
}

function Entry({ entry }: { entry: DailyBreadView }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const isToday = entry.entry_date === jakartaToday();
  return (
    <FeaturedCard
      titleId="entry-title"
      eyebrow={
        isToday ? (
          <AccentLabel>{t('dailyBread.todayLabel')}</AccentLabel>
        ) : (
          <time dateTime={entry.entry_date} className="featured-card__date">{formatDate(entry.entry_date)}</time>
        )
      }
      title={pick(entry.title)}
      meta={
        entry.scripture_ref && (
          <p className="flex items-center gap-2">
            <Icon name="book-2-linear" className="h-4 w-4" />
            {t('dailyBread.readingLabel')}: {entry.scripture_ref}
          </p>
        )
      }
      media={
        entry.audio_url ? (
          <>
            <p id="audio-label" className="sr-only">{t('dailyBread.listen')}</p>
            <AudioPlayer key={entry.audio_url} src={entry.audio_url} labelId="audio-label" />
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <Icon name="play-circle-linear" className="h-5 w-5" />
            {t('dailyBread.noAudio')}
          </p>
        )
      }
    >
      <Prose text={pick(entry.body)} className="text-lg" />
    </FeaturedCard>
  );
}

/** Desktop only: sticky side panel with its own scroll. */
function ArchivePanel({ activeDate }: { activeDate: string | null }) {
  const { t } = useTranslation();
  const { pick, lang } = useLocalized();
  const archive = useDailyBreadArchive();
  const [shown, setShown] = useState(PAGE);
  const short = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
      .format(new Date(`${iso}T00:00:00Z`));
  const items = archive.data ?? [];

  return (
    <aside className="archive-panel" aria-labelledby="arsip-heading" data-lenis-prevent>
      <h2 id="arsip-heading" className="archive-heading">
        <span className="archive-mark" aria-hidden="true" />
        {t('dailyBread.archive')}
      </h2>
      <div className="mt-4">
        {archive.isPending ? (
          <Loading lines={4} />
        ) : archive.isError ? (
          <LoadError onRetry={() => void archive.refetch()} />
        ) : items.length === 0 ? (
          <Empty>{t('dailyBread.empty')}</Empty>
        ) : (
          <ul className="side-list">
            {items.slice(0, shown).map((d) => {
              const current = d.entry_date === activeDate;
              return (
                <li key={d.entry_date}>
                  <Link to={`/daily-bread/${d.entry_date}`} className="side-row" aria-current={current ? 'page' : undefined}>
                    <time className="side-row__date" dateTime={d.entry_date}>{short(d.entry_date)}</time>
                    <span className="side-row__title">{pick(d.title)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {items.length > shown && (
        <div className="mt-4 flex flex-col items-start gap-2">
          <button type="button" className="btn btn--outline" onClick={() => setShown((n) => n + PAGE)}>
            {t('dailyBread.loadMore')}
          </button>
          <span className="text-sm text-stone-600" aria-live="polite">{t('dailyBread.archiveCount', { shown, total: items.length })}</span>
        </div>
      )}
    </aside>
  );
}
