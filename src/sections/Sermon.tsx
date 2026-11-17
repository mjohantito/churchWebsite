import { useRef } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { SplitHeading } from '../components/SplitHeading';
import { MediaPlaceholder } from '../components/MediaPlaceholder';
import { Icon } from '../components/Icon';
import { Empty, Loading, LoadError } from '../components/QueryState';
import { Prose } from '../components/Prose';
import { useLatestSermon } from '../data/queries';
import type { SermonView } from '../data/types';
import { useSectionReveal } from '../lib/motion';
import { useLocalized } from '../lib/useLocalized';

export function Sermon() {
  const { t } = useTranslation();
  const section = useRef<HTMLElement>(null);
  useSectionReveal(section);
  const sermon = useLatestSermon();

  return (
    <section ref={section} aria-labelledby="sermon-heading" className="section-gap page-x mx-auto max-w-page">
      <p className="eyebrow" data-reveal>
        <span className="eyebrow__rule" aria-hidden="true" />
        {t('sermon.eyebrow')}
      </p>
      <SplitHeading
        id="sermon-heading"
        before={t('sermon.headingBefore')}
        script={t('sermon.headingScript')}
        className="section-heading mt-5"
      />

      {sermon.isPending ? (
        <Loading lines={4} className="mt-10 max-w-xl" />
      ) : sermon.isError ? (
        <LoadError onRetry={() => void sermon.refetch()} className="mt-10" />
      ) : !sermon.data ? (
        <Empty className="mt-10">{t('sermon.empty')}</Empty>
      ) : (
        <SermonBody s={sermon.data} />
      )}
    </section>
  );
}

function SermonBody({ s }: { s: SermonView }) {
  const { t } = useTranslation();
  const { pick, formatDate } = useLocalized();
  const title = pick(s.title);
  return (
      <div className="mt-10 grid gap-10 sm:mt-14 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7" data-reveal>
            <div className="overflow-hidden rounded-[1.25rem] bg-ink" style={{ aspectRatio: '16 / 9' }}>
              {s.youtube_video_id ? (
                <iframe
                  className="h-full w-full"
                  src={`https://www.youtube-nocookie.com/embed/${encodeURIComponent(s.youtube_video_id)}?rel=0`}
                  title={t('sermon.iframeTitle', { title })}
                  loading="lazy"
                  allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                  referrerPolicy="strict-origin-when-cross-origin"
                  allowFullScreen
                />
              ) : (
                <MediaPlaceholder
                  alt={t('sermon.videoPlaceholder')}
                  label={t('sermon.videoPlaceholder')}
                  tone="dark"
                  icon="play-circle-linear"
                />
              )}
            </div>
          </div>

          <div className="flex flex-col lg:col-span-5" data-reveal>
            <h3 className="font-label text-[1.6rem] leading-[1.05] sm:text-[2rem]">
              {title}
            </h3>
            <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 border-y border-stone-200 py-5 text-sm">
              <div>
                <dt className="mini-label">{t('sermon.dateLabel')}</dt>
                <dd className="mt-1">
                  <time dateTime={s.preached_on}>{formatDate(s.preached_on)}</time>
                </dd>
              </div>
              <div>
                <dt className="mini-label">{t('sermon.preacherLabel')}</dt>
                <dd className="mt-1">{s.preacher_name ?? '—'}</dd>
              </div>
              <div className="col-span-2">
                <dt className="mini-label">{t('sermon.readingLabel')}</dt>
                <dd className="mt-1">{s.scripture_ref ? pick(s.scripture_ref) : '—'}</dd>
              </div>
            </dl>
            {s.summary && (
              <>
                <h4 className="mini-label mt-6">{t('sermon.summaryLabel')}</h4>
                <Prose text={pick(s.summary)} className="mt-2" />
              </>
            )}

            <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-4">
              {s.slides_url ? (
                <a href={s.slides_url} className="btn btn--solid" target="_blank" rel="noopener noreferrer">
                  <Icon name="download-minimalistic-linear" />
                  {t('sermon.slides')}
                </a>
              ) : (
                // Placeholder until staff upload slides; clearly marked, not a dead link.
                <a href="#" className="btn btn--solid btn--pending" aria-disabled="true" onClick={(e) => e.preventDefault()}>
                  <Icon name="download-minimalistic-linear" />
                  {t('sermon.slides')}
                  <span className="sr-only">({t('sermon.slidesSoon')})</span>
                </a>
              )}
              <Link to="/sermons" className="text-link">
                {t('sermon.all')}
                <Icon name="arrow-right-linear" className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
  );
}
