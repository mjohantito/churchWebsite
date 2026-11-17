import { useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { PageHeader } from '../components/PageHeader';
import { Prose } from '../components/Prose';
import { Icon } from '../components/Icon';
import { AudioPlayer } from '../components/AudioPlayer';
import { AccentLabel, FeaturedCard } from '../components/FeaturedCard';
import { ArchiveList, ArchiveRow, ArchiveSection } from '../components/ArchiveSection';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { useCurrentDailyBread, useDailyBreadArchive, useDailyBreadByDate } from '../data/queries';
import type { DailyBreadView } from '../data/types';
import { isIsoDate, jakartaToday } from '../lib/dates';
import { useLocalized } from '../lib/useLocalized';
import { useScroll } from '../lib/motion';

const PAGE = 10;

/** /daily-bread (today) and /daily-bread/:date (one day). */
export function DailyBreadPage() {
  const { t } = useTranslation();
  const { date } = useParams<{ date?: string }>();
  const validDate = isIsoDate(date);
  const scroll = useScroll();
  const archiveHeading = useRef<HTMLHeadingElement>(null);

  const current = useCurrentDailyBread();
  const byDate = useDailyBreadByDate(date ?? '', Boolean(date) && validDate);
  const entry = date ? byDate : current;

  const jumpToArchive = () => {
    const el = document.getElementById('arsip');
    if (!el) return;
    scroll.scrollToElement(el);
    archiveHeading.current?.focus({ preventScroll: true });
  };

  return (
    <>
      <PageHeader eyebrow={t('dailyBread.eyebrow')} title={t('nav.dailyBread')} intro={t('dailyBread.intro')}>
        <div className="flex flex-wrap gap-x-6 gap-y-1">
          {date && (
            <Link to="/daily-bread" className="text-link">
              <Icon name="arrow-left-linear" className="h-4 w-4" />
              {t('dailyBread.backToToday')}
            </Link>
          )}
          <a href="#arsip" className="text-link lg:hidden" onClick={(e) => { e.preventDefault(); jumpToArchive(); }}>
            {t('dailyBread.seeArchive')}
            <Icon name="arrow-left-linear" className="h-4 w-4 -rotate-90" />
          </a>
        </div>
      </PageHeader>

      <div className="page-x mx-auto mt-8 max-w-page sm:mt-10">
        <div className="max-w-[48rem]">
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
        </div>
      </div>

      <Archive activeDate={date ?? entry.data?.entry_date ?? null} headingRef={archiveHeading} />
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
            <AudioPlayer src={entry.audio_url} labelId="audio-label" />
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

function Archive({ activeDate, headingRef }: { activeDate: string | null; headingRef: React.Ref<HTMLHeadingElement> }) {
  const { t } = useTranslation();
  const { pick, lang } = useLocalized();
  const archive = useDailyBreadArchive();
  const [shown, setShown] = useState(PAGE);
  const chip = (iso: string) =>
    new Intl.DateTimeFormat(lang === 'id' ? 'id-ID' : 'en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).format(new Date(`${iso}T00:00:00Z`));
  const items = archive.data ?? [];

  return (
    <ArchiveSection
      id="arsip"
      ref={headingRef}
      title={t('dailyBread.archive')}
      footer={
        items.length > shown && (
          <div className="flex flex-wrap items-center gap-4">
            <button type="button" className="btn btn--outline" onClick={() => setShown((n) => n + PAGE)}>
              {t('dailyBread.loadMore')}
            </button>
            <span className="text-sm text-stone-600" aria-live="polite">{t('dailyBread.archiveCount', { shown, total: items.length })}</span>
          </div>
        )
      }
    >
      {archive.isPending ? (
        <Loading lines={4} />
      ) : archive.isError ? (
        <LoadError onRetry={() => void archive.refetch()} />
      ) : items.length === 0 ? (
        <Empty>{t('dailyBread.empty')}</Empty>
      ) : (
        <ArchiveList>
          {items.slice(0, shown).map((d) => (
            <ArchiveRow
              key={d.entry_date}
              to={`/daily-bread/${d.entry_date}`}
              chip={chip(d.entry_date)}
              chipDateTime={d.entry_date}
              title={pick(d.title)}
              current={d.entry_date === activeDate}
            />
          ))}
        </ArchiveList>
      )}
    </ArchiveSection>
  );
}
