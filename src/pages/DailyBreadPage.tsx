import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useCurrentDailyBread, useDailyBreadArchive, useDailyBreadByDate } from '../data/queries';
import type { DailyBreadView } from '../data/types';
import { isIsoDate, jakartaToday } from '../lib/dates';
import { useLocalized } from '../lib/useLocalized';

/** /daily-bread (today) and /daily-bread/:date (one day). */
export function DailyBreadPage() {
  const { t } = useTranslation();
  const { date } = useParams<{ date?: string }>();
  const validDate = isIsoDate(date);

  const current = useCurrentDailyBread();
  const byDate = useDailyBreadByDate(date ?? '', Boolean(date) && validDate);
  const entry = date ? byDate : current;

  return (
    <>
      <PageHeader eyebrow={t('dailyBread.eyebrow')} title={t('nav.dailyBread')} intro={t('dailyBread.intro')} />

      <div className="page-x mx-auto mt-14 grid max-w-page gap-14 lg:grid-cols-12 lg:gap-16">
        <div className="lg:col-span-8">
          {date && !validDate ? (
            <Empty>{t('dailyBread.invalidDate')}</Empty>
          ) : entry.isPending ? (
            <Loading lines={6} />
          ) : entry.isError ? (
            <LoadError onRetry={() => void entry.refetch()} />
          ) : entry.data ? (
            <Entry entry={entry.data} />
          ) : (
            <Empty>{date ? t('dailyBread.emptyDate') : t('dailyBread.empty')}</Empty>
          )}
          {date && (
            <Link to="/daily-bread" className="text-link mt-8">
              <Icon name="arrow-left-linear" className="h-4 w-4" />
              {t('dailyBread.backToToday')}
            </Link>
          )}
        </div>
        <aside className="lg:col-span-4" aria-labelledby="archive-heading">
          <Archive activeDate={date ?? entry.data?.entry_date ?? null} />
        </aside>
      </div>
    </>
  );
}

function Entry({ entry }: { entry: DailyBreadView }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const isToday = entry.entry_date === jakartaToday();
  return (
    <article aria-labelledby="entry-title">
      <p className="mini-label">
        {isToday && <span>{t('dailyBread.todayLabel')} · </span>}
        <time dateTime={entry.entry_date}>{formatDate(entry.entry_date)}</time>
      </p>
      <h2 id="entry-title" className="mt-3 font-display text-[1.9rem] sm:text-[2.4rem]">
        {pick(entry.title)}
      </h2>
      {entry.scripture_ref && (
        <p className="mt-3 flex items-center gap-2 text-stone-700">
          <Icon name="book-2-linear" className="h-4 w-4" />
          {t('dailyBread.readingLabel')}: {entry.scripture_ref}
        </p>
      )}

      <div className="audio-panel mt-8">
        {entry.audio_url ? (
          <>
            <p className="mini-label" id="audio-label">
              {t('dailyBread.listen')}
            </p>
            <audio className="mt-3 w-full" controls preload="none" src={entry.audio_url} aria-labelledby="audio-label">
              {t('dailyBread.audioUnsupported')}
            </audio>
          </>
        ) : (
          <p className="flex items-center gap-2 text-sm text-stone-600">
            <Icon name="play-circle-linear" className="h-5 w-5" />
            {t('dailyBread.noAudio')}
          </p>
        )}
      </div>

      <Prose text={pick(entry.body)} className="mt-8 max-w-[38rem] text-lg" />
    </article>
  );
}

function Archive({ activeDate }: { activeDate: string | null }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const archive = useDailyBreadArchive();
  return (
    <>
      <h2 id="archive-heading" className="mini-label">
        {t('dailyBread.archive')}
      </h2>
      {archive.isPending ? (
        <Loading lines={4} className="mt-4" />
      ) : archive.isError ? (
        <LoadError onRetry={() => void archive.refetch()} className="mt-4" />
      ) : archive.data.length === 0 ? (
        <Empty className="mt-4">{t('dailyBread.empty')}</Empty>
      ) : (
        <ul className="mt-4 divide-y divide-stone-200 border-y border-stone-200">
          {archive.data.map((d) => (
            <li key={d.entry_date}>
              <Link
                to={`/daily-bread/${d.entry_date}`}
                aria-current={d.entry_date === activeDate ? 'page' : undefined}
                className="archive-link"
              >
                <span className="text-sm text-stone-600">{formatDate(d.entry_date)}</span>
                <span className="font-medium">{pick(d.title)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
